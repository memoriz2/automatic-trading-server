import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/use-websocket';
import { MockTradingSystem } from '@/components/mock-trading-system';
import { TRADING_CONSTANTS } from '@/lib/utils';
import './legacy-auto-trading.css';
import { useToast } from '@/hooks/use-toast';
import { apiFetchJson } from '@/lib/queryClient';

interface Band {
  name?: string;
  target_kimp?: number | string;
  exit_kimp?: number | string;
  tolerance?: number | string;
  leverage?: number | string;
  amount_btc?: number | string;
  serverId?: string | number;
}

// ===== Helpers (컴포넌트 외부 또는 내부에 정의) =====
const isNum = (v: any): v is number => typeof v === 'number' && isFinite(v);
const fx = (v: number | undefined | null, n = 2) => (isNum(v) ? Number(v).toFixed(n) : '-');
const loc = (v: number | undefined | null) => (isNum(v) ? Number(v).toLocaleString() : '-');
const floorQty = (q: number | string | undefined | null) => Math.floor((Number(q) || 0) / 0.001) * 0.001;
const formatKRW = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.round(n));
const formatUSD = (n: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const formatCompact = (n: number, digits = 1): string => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(digits)}K`;
  return `${n.toFixed(Math.min(digits, 2))}`;
};

// ===== 전역 in-flight/캐시 (전략 조회 과호출 방지) =====
const INFLIGHT_API = new Map<string, Promise<any>>();
const API_CACHE = new Map<string, { ts: number; data: any }>();

// 투자 수량 보정: 서버 원화 금액/비정상 값이 들어왔을 때 안전한 BTC 수량으로 변환
const normalizeAmountBtc = (raw: any, upbitPrice?: number): number => {
  let amt = Number(raw ?? 0) || 0;
  // 원화 금액(100 이상) 또는 과도한 수량은 변환/클램프
  if (amt >= 100 && upbitPrice && upbitPrice > 0) {
    amt = +(amt / upbitPrice).toFixed(3);
  }
  if (!isFinite(amt) || amt <= 0) amt = 0.001;
  if (amt > 10) amt = 0.001; // 상식적 한도 초과 시 최소값
  return Math.max(0.001, amt);
};

// 서버 전략 → UI 밴드 매핑
const mapStrategyToBand = (s: any): Band => ({
  name: s?.name,
  target_kimp: Number(s?.entryRate),
  exit_kimp: Number(s?.exitRate),
  tolerance: Number(s?.toleranceRate ?? s?.tolerance ?? 0.1),
  leverage: Number(s?.leverage ?? 3),
  // 현재 서버는 BTC 수량을 investmentAmount로 보관 중 → 역매핑
  amount_btc: Number(s?.investmentAmount ?? 0) || 0,
  serverId: s?.id,
});

const LegacyAutoTradingPage = () => {
  // 인증 정보
  const { user, isAuthenticated, isLoading, checkSession } = useAuth();
  const { isConnected, subscribe } = useWebSocket();
  const { toast } = useToast();
  
  // 세션 조회 관련 상태
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  // userId 동적 결정: Auth → URL(?userId|uid) → localStorage(x-user-id) → null (하드코딩 금지)
  const initialUserId = (() => {
    try {
      const fromAuth = user?.id != null ? String(user.id) : undefined;
      const search = new URLSearchParams(window.location.search);
      const fromQuery = search.get('userId') || search.get('uid') || undefined;
      const fromStorage = localStorage.getItem('x-user-id') || undefined;
      return fromAuth || fromQuery || fromStorage || null; // 하드코딩 '6' 제거
    } catch {
      return user?.id != null ? String(user.id) : null;
    }
  })();
  const [effectiveUserId, setEffectiveUserId] = useState<string>(initialUserId || '6');
  useEffect(() => {
    try {
      const search = new URLSearchParams(window.location.search);
      const fromAuth = user?.id != null ? String(user.id) : undefined;
      const fromQuery = search.get('userId') || search.get('uid') || undefined;
      const fromStorage = localStorage.getItem('x-user-id') || undefined;
      const id = fromAuth || fromQuery || fromStorage || effectiveUserId;
      if (id && id !== effectiveUserId) {
        setEffectiveUserId(id);
        localStorage.setItem('x-user-id', id);
      }
    } catch {}
  }, [user?.id]);
  
  // 상태 관리 (useState)
  const [bands, setBands] = useState<Band[]>([]);
  type SparkPoint = { t: number; v: number };
  const [sparkData, setSparkData] = useState<SparkPoint[]>([]);
  const [logs, setLogs] = useState('Loading...');
  const [kimp, setKimp] = useState<any>({});
  const [balances, setBalances] = useState<any>({ real: {}, connected: {} });
  const [metrics, setMetrics] = useState<any>({});
  const [serverState, setServerState] = useState<any>({});
  const [serverBands, setServerBands] = useState<any[]>([]);
  const [serverStatusBands, setServerStatusBands] = useState<any[]>([]);
  const [registeringIndex, setRegisteringIndex] = useState<number | null>(null);
  const [unregisteringIndex, setUnregisteringIndex] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [netMs, setNetMs] = useState<number | null>(null);
  const [netOk, setNetOk] = useState<boolean>(true);
  const [errCount, setErrCount] = useState<number>(0);
  const [boardActingId, setBoardActingId] = useState<string | number | null>(null);
  
  // 새 전략 모달 상태
  type NewStrategyForm = {
    name: string;
    crypto: string;
    entryCondition: string;
    takeProfitCondition: string;
    baseAmount: string;
    investmentAmount: string;
    leverage: string;
    tolerance: string; // 타입 완화: 문자형으로 관리
    riskLevel: string;
    activateImmediately: boolean;
  };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStrategy, setNewStrategy] = useState<NewStrategyForm>({
    name: '',
    crypto: '',
    entryCondition: '3.0',
    takeProfitCondition: '2.0',
    baseAmount: '500000',
    investmentAmount: '0.003',
    leverage: '3',
    tolerance: String(TRADING_CONSTANTS.DEFAULT_TOLERANCE),
    riskLevel: 'moderate',
    activateImmediately: false
  });

  // 김치프리미엄 차트 시간대 상태
  const [chartTimeframe, setChartTimeframe] = useState('1H');
  
  // 시간대별 데이터 필터링(타임스탬프 윈도우 + 리샘플)
  const getChartData = useCallback(() => {
    if (sparkData.length === 0) return [] as SparkPoint[];
    const now = Date.now();
    const WINDOW_MS: Record<string, number> = { '1H': 60 * 60 * 1000, '4H': 4 * 60 * 60 * 1000, '1D': 24 * 60 * 60 * 1000 };
    const windowMs = WINDOW_MS[chartTimeframe] ?? WINDOW_MS['1H'];
    const inWindow = sparkData.filter(p => p.t >= now - windowMs);

    // 리샘플 버킷(ms): 1H=1m, 4H=5m, 1D=15m
    const bucketMs = chartTimeframe === '1H' ? 60 * 1000 : chartTimeframe === '4H' ? 5 * 60 * 1000 : 15 * 60 * 1000;
    const buckets = new Map<number, number[]>();
    for (const p of inWindow) {
      const b = Math.floor(p.t / bucketMs) * bucketMs;
      const arr = buckets.get(b) || [];
      arr.push(p.v);
      buckets.set(b, arr);
    }
    const entriesArray: Array<[number, number[]]> = Array.from(buckets.entries());
    const resampled: SparkPoint[] = entriesArray
      .sort((a, b) => a[0] - b[0])
      .map(([t, arr]) => ({ t, v: arr.reduce((sum: number, val: number) => sum + val, 0) / arr.length }));
    const limited = resampled.slice(-120);
    return limited;
  }, [sparkData, chartTimeframe]);

  // 투자수량 변경 시 기본투자금액 자동 계산
  useEffect(() => {
    // 입력 중에는 계산하지 않고, 고정 소수점(최대 3자리) 형태로만 정상화
    const raw = newStrategy.investmentAmount;
    if (raw == null) return;
    // 공백/빈 문자열은 건드리지 않음 → 포커스 유지
    if (raw === '') return;
    // 유효 숫자면 0.001 단위로 고정 (표시 영향 없음)
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const fixed = n.toFixed(3);
    if (fixed !== raw) {
      setNewStrategy(prev => ({ ...prev, investmentAmount: fixed }));
      return;
    }
    const btcAmount = n || 0.003;
    const leverage = parseFloat(newStrategy.leverage) || 3;
    const btcPrice = 156000000;
    const calculatedBaseAmount = Math.round(btcAmount * leverage * btcPrice);
    if (String(calculatedBaseAmount) !== newStrategy.baseAmount) {
      setNewStrategy(prev => ({ ...prev, baseAmount: String(calculatedBaseAmount) }));
    }
  }, [newStrategy.investmentAmount, newStrategy.leverage]);

  // 전략 목록 상태 (카드 표시용)
  const [strategies, setStrategies] = useState<any[]>([]);

  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  const [dailyStats, setDailyStats] = useState({
    totalTrades: 0,
    upbitTrades: 0,
    binanceTrades: 0,
    activePositions: 0,
    totalFees: 0,
    realizedPnl: 0
  });

  // ===== Memoized maps for O(1) lookups =====
  const configuredByName = useMemo(() => {
    const m = new Map<string, any>();
    for (const s of serverBands || []) {
      if (s?.name) m.set(String(s.name), s);
    }
    return m;
  }, [serverBands]);

  const statusById = useMemo(() => {
    const m = new Map<string, any>();
    for (const s of serverStatusBands || []) {
      if (s?.id != null) m.set(String(s.id), s);
    }
    return m;
  }, [serverStatusBands]);

  const statusByName = useMemo(() => {
    const m = new Map<string, any>();
    for (const s of serverStatusBands || []) {
      if (s?.name) m.set(String(s.name), s);
    }
    return m;
  }, [serverStatusBands]);

  // DOM 요소 참조 (useRef)
  const bandTbodyRef = useRef<HTMLTableSectionElement>(null);
  const sparkCanvasRef = useRef<HTMLCanvasElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // --- REFS ---
  const bandRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const abortersRef = useRef<Array<AbortController>>([]);
  const hasLoadedStrategiesRef = useRef<boolean>(false);
  const hasScheduledInitialLoadRef = useRef<boolean>(false);

  const cancelInflight = useCallback(() => {
    try { abortersRef.current.forEach((a) => { try { a.abort(); } catch {} }); } finally { abortersRef.current = []; }
  }, []);

  // useEffect를 사용하여 초기화 및 폴링 로직을 설정합니다.
  useEffect(() => {
    // 초기 밴드 데이터 로드
    const raw = localStorage.getItem('kimp_cfg_bands_v2');
    if (raw) {
      try {
        const j = JSON.parse(raw);
        const upMaybe = undefined as any; // 최초 로드 시 가격 미확정 → 과대값은 0.001로 안전 보정
        const fixed = (j.bands || []).map((b: any) => ({
          ...b,
          amount_btc: normalizeAmountBtc(b?.amount_btc, upMaybe),
        }));
        setBands(fixed);
      } catch {
        setBands([]);
      }
    } else {
      setBands([]);
    }

    // 폴링 시작 (나중에 구현)
    // startPolling();

    // 컴포넌트 언마운트 시 폴링 중지
    // return () => stopPolling();
  }, []); // 빈 배열은 컴포넌트 마운트 시 한 번만 실행됨을 의미

  // ===== API Helper =====
  const fetchJson = useCallback(async (url: string, opt = {}) => {
    // 1) 경로 정규화: 세션 기반 조회 보장 (undefined/null/빈 ID 방지)
    let normalized = url;
    if (normalized.startsWith('/api/trading-strategies')) {
      // '/api/trading-strategies/undefined', '/null', '/' → '/api/trading-strategies'
      if (
        normalized === '/api/trading-strategies/undefined' ||
        normalized === '/api/trading-strategies/null' ||
        normalized === '/api/trading-strategies/' ||
        normalized.startsWith('/api/trading-strategies/undefined?') ||
        normalized.startsWith('/api/trading-strategies/null?')
      ) {
        console.warn('⚠️ 잘못된 사용자 ID로 전략 API 호출이 발생하여 차단되었습니다:', normalized);
        throw new Error('유효하지 않은 사용자 ID 상태에서 전략 API가 호출되었습니다. 세션 확인 후 다시 시도해주세요.');
      }
      // 쿼리스트링이 있는 경우도 방어
      // (무파라미터 라우트는 서버 추가 시 정상 허용)
    }

    // 2) 모든 '/api/' 시작 경로는 프록시 없이 그대로 통과
    const isApiPath = normalized.startsWith('/api/');
    const fullUrl = isApiPath ? normalized : `/api/kimpga${normalized}`;
    
    const cacheKey = `${(opt as any)?.method || 'GET'} ${fullUrl}`;

    // 0) 짧은 캐시(1s): 동일 즉시 반복 호출 흡수
    const cached = API_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < 1000) {
      return cached.data;
    }
    // 0-1) in-flight dedupe (JSON 파싱까지 완료된 Promise 공유)
    const inflight = INFLIGHT_API.get(cacheKey) as Promise<any> | undefined;
    if (inflight) return await inflight;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // 세션 쿠키 우선. 식별자가 있을 때만 헤더 전달
      ...(effectiveUserId ? { 'X-User-ID': String(effectiveUserId) } : {}),
      ...(opt as any)?.headers,
    };
    
    const noCachePaths = ['/balance', '/metrics', '/current', '/status'];
    const isNoCacheTarget = noCachePaths.some(p => url.startsWith(p));
    const finalUrl = isNoCacheTarget ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}_=${Date.now()}` : fullUrl;

    const ctrl = new AbortController();
    abortersRef.current.push(ctrl);
    try {
      const p = (async () => {
        const r = await fetch(finalUrl, {
          ...opt,
          headers,
          cache: isNoCacheTarget ? 'no-store' : (opt as any)?.cache,
          credentials: 'include', // 세션 쿠키 포함
          signal: (opt as any)?.signal ?? ctrl.signal,
        });
        console.log('📥 API 응답 상태:', r.status, r.statusText);
        if (!r.ok) {
          const errorBody = await r.text();
          setErrCount(c => c + 1);
          console.error('API Error:', errorBody);
          throw new Error(`${finalUrl} ${r.status} ${errorBody}`);
        }
        setErrCount(0);
        const data = await r.json();
        API_CACHE.set(cacheKey, { ts: Date.now(), data });
        return data;
      })();
      INFLIGHT_API.set(cacheKey, p);
      return await p;
    } catch (e: any) {
      if (e?.name === 'AbortError' || /aborted/i.test(String(e?.message))) {
        return;
      }
      throw e;
    } finally {
      INFLIGHT_API.delete(cacheKey);
      abortersRef.current = abortersRef.current.filter(a => a !== ctrl);
    }
  }, [effectiveUserId]);

  const refreshServerBands = useCallback(async (options: { force?: boolean } = {}) => {
    if (!options.force && hasLoadedStrategiesRef.current) return;
    try {
      const serverData = await fetchJson(`/api/trading-strategies/${effectiveUserId}`);
      if (serverData == null) {
        console.log('⏭️ 서버 밴드 조회가 취소/중단되어 UI 업데이트를 건너뜁니다.');
        return;
      }
      setServerBands(serverData || []);
      // NOTE: 게이트는 실제 전략 목록 로드에서만 설정합니다
    } catch (e) {
      console.error('Failed to fetch server bands', e);
    }
  }, [fetchJson, effectiveUserId]);

  // ===== 미리보기 원형 차트 =====
  const createCircleHTML = useCallback((label: string, valueText: string, unitText: string, sizePx: number, titleText?: string, extraStyle?: string) => {
    const valueFont = Math.max(10, Math.min(16, Math.floor(sizePx / 6)));
    return `
      <div class="circle" style="width:${sizePx}px;height:${sizePx}px;display:grid;place-items:center;border-radius:999px;border:1px solid var(--border);background:#0a1220;box-shadow:var(--shadow);overflow:hidden;${extraStyle || ''}" title="${titleText || ''}">
        <div style="text-align:center;max-width:${sizePx - 12}px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          <small style="display:block;font-size:11px;color:#9db0d0;margin-bottom:2px">${label}</small>
          <span style="display:inline-flex;align-items:baseline;gap:4px">
            <strong style="font-size:${valueFont}px;font-variant-numeric:tabular-nums">${valueText}</strong>
            <small style="font-size:10px;color:#9db0d0">${unitText}</small>
          </span>
        </div>
      </div>
    `;
  }, []);

  const updatePreviewForRow = useCallback((tr: HTMLTableRowElement) => {
    const amtInput = tr.querySelector('input[data-k="amount_btc"]') as HTMLInputElement;
    const levInput = tr.querySelector('input[data-k="leverage"]') as HTMLInputElement;
    const holder = tr.querySelector('[data-size]') as HTMLElement;
    
    if (!amtInput || !levInput || !holder) return;

    const qty = floorQty(parseFloat(amtInput.value) || 0);
    const lev = Math.max(1, parseInt(levInput.value || '3', 10));
    
    // 실시간 가격 데이터 사용
    const currentUpbitPrice = kimp.upbit_price || 0;
    const currentBinancePrice = kimp.binance_price || 0;
    
    // 디버깅: 가격 데이터 확인
    /*
    console.log('🔍 미리보기 가격 데이터:', {
      kimp_full: kimp,
      currentUpbitPrice,
      currentBinancePrice,
      qty,
      lev
    });
    */
    
    // 현재 가격 정보가 없으면 기본 표시
    if (!isNum(currentUpbitPrice) || !isNum(currentBinancePrice) || qty <= 0) {
      holder.innerHTML = '<span class="badge">-</span>';
      return;
    }

    const UPBIT_TAKER_FEE = 0.0005;
    const BINANCE_TAKER_FEE = 0.0004; // 가정치: 필요 시 서버 설정과 동기화
    const krwGross = Math.ceil((qty * currentUpbitPrice) / (1 - UPBIT_TAKER_FEE));
    const usdtMargin = ((qty * currentBinancePrice) / (1 - BINANCE_TAKER_FEE)) / lev;

    // 원형 차트 크기 계산 (상대적 크기)
    const kN = krwGross / 1_000_000; // 백만원 단위
    const uN = usdtMargin / 100; // 100달러 단위
    const maxN = Math.max(kN, uN, 0.0001);
    // 원 크기 상향 (가독성 향상)
    const base = 44, span = 72;
    const kSize = Math.round(base + span * (kN / maxN));
    const uSize = Math.round(base + span * (uN / maxN));

    const krwFull = formatKRW(krwGross);
    const usdFull = formatUSD(usdtMargin);
    const krwCompact = formatCompact(krwGross, 1);
    const usdCompact = formatCompact(usdtMargin, 2);
    holder.innerHTML = `
      <div class="circle-wrap" style="display:flex;gap:0;align-items:center;justify-content:flex-start" title="가격과 레버리지에 따라 미리보기가 변합니다.">
        ${createCircleHTML('Upbit KRW', `${krwCompact}`, '₩', kSize, `${krwFull} 원`)}
        ${createCircleHTML('Binance USDT', `${usdCompact}`, '$', uSize, `$ ${usdFull}`, 'margin-left:-10px;')}
      </div>
    `;
  }, [kimp.upbit_price, kimp.binance_price, createCircleHTML]);

  // ===== Data Fetching & Polling Functions =====
  const tickLight = useCallback(async () => {
    try {
      const k = await fetchJson('/current');
      if (!k) return; // Abort 등으로 undefined일 때 조용히 무시
      setKimp(k);
      if (isNum(k.kimp)) {
        setSparkData(prev => {
          const next = { t: Date.now(), v: Number(k.kimp) };
          const newData = [...prev, next];
          // 최대 5000 포인트 유지 (메모리 보호)
          return newData.slice(-5000);
        });
      }
      
      // 가격 업데이트 시 모든 밴드 행의 미리보기 업데이트
      setTimeout(() => {
        const bandRows = document.querySelectorAll('#band-tbody tr');
        bandRows.forEach((row) => {
          if (row instanceof HTMLTableRowElement) {
            updatePreviewForRow(row);
          }
        });
      }, 0);
    } catch (e) { 
      console.error('tickLight 오류:', e); 
    }
  }, [fetchJson, updatePreviewForRow]);

  // ===== 진입 증거금 계산 =====
  // Fallback: 서버 bands가 없을 때 로컬 mock 포지션으로 추정
  const updateUsedMarginFromMock = useCallback(() => {
    try {
      const usedKrwEl = document.querySelector('#used-krw');
      if (!usedKrwEl) return;

      const uid = String(effectiveUserId ?? localStorage.getItem('userId') ?? '1');
      const saved = localStorage.getItem(`mock-positions-${uid}`);
      const positions = saved ? JSON.parse(saved) : [];
      const open = Array.isArray(positions) ? positions.filter((p: any) => p?.status === 'open') : [];
      if (!open.length) { usedKrwEl.textContent = '-'; return; }

      const fallbackPrice = isNum(kimp.binance_price) ? Number(kimp.binance_price) : 0;
      let total = 0;
      for (const p of open) {
        const lev = Math.max(1, parseInt(p?.leverage ?? 3, 10));
        const qty = Number(p?.binanceQuantity || 0);
        const price = Number(p?.binancePrice || fallbackPrice || 0);
        if (qty > 0 && price > 0 && isFinite(lev)) total += (qty * price) / lev;
      }
      const usdkrw = isNum(kimp.usdkrw) ? Number(kimp.usdkrw) : 0;
      usedKrwEl.textContent = total > 0 && usdkrw > 0 ? loc(total * usdkrw) : '-';
    } catch {}
  }, [effectiveUserId, kimp.binance_price]);
  const updateUsedMarginFromStatus = useCallback((status: any) => {
    try {
      const usedKrwEl = document.querySelector('#used-krw');
      if (!usedKrwEl) return;

      const bands = Array.isArray(status?.bands) ? status.bands : [];
      if (!bands.length) {
        // 서버에 런타임 밴드가 없으면 mock 포지션으로 추정
        updateUsedMarginFromMock();
        return;
      }

      // 최신 바이낸스 선물가격 사용
      const binancePrice = isNum(kimp.binance_price) ? kimp.binance_price : NaN;
      if (!isNum(binancePrice) || binancePrice <= 0) {
        updateUsedMarginFromMock();
        return;
      }

      let totalUsedMargin = 0;
      const includeStates = new Set(['entered','hedging']);
      for (const band of bands) {
        const state = band?.state;
        const qty = Number(band?.filled_qty || 0);
        const leverage = Math.max(1, parseInt(band?.leverage ?? 3, 10));
        
        if (includeStates.has(state) && qty > 0 && isFinite(leverage)) {
          // 증거금 = 명목가치 / 레버리지
          totalUsedMargin += (qty * binancePrice) / leverage;
        }
      }

      const usdkrw = isNum(kimp.usdkrw) ? Number(kimp.usdkrw) : 0;
      usedKrwEl.textContent = totalUsedMargin > 0 && usdkrw > 0 ? loc(totalUsedMargin * usdkrw) : '-';
    } catch (error) {
      updateUsedMarginFromMock();
    }
  }, [kimp.binance_price, updateUsedMarginFromMock]);

  const tickHeavy = useCallback(async () => {
    try {
      // KST 자정부터 경과 분 계산 → 오늘 창으로 집계 통일
      const now = new Date();
      const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const kstMidnightUtc = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate(), -9, 0, 0);
      const minutesKstToday = Math.max(1, Math.floor((now.getTime() - kstMidnightUtc) / 60000));

      const [bal, met, kgaStat, trStat] = await Promise.all([
        fetchJson('/balance'),
        fetchJson(`/metrics?minutes=${minutesKstToday}`),
        fetchJson('/status?only=trade&group=type'), // 중요 로그만 + 타입별 그룹화
        fetchJson(`/api/trading/status/${effectiveUserId}`),
      ]);
      if (bal) setBalances(bal);
      if (met) setMetrics(met);
      if (trStat) setServerState({ running: !!trStat?.isRunning, ...trStat });
      if (kgaStat) {
        const runtimeBands = Array.isArray(kgaStat?.bands) ? kgaStat.bands : [];
        setServerStatusBands(runtimeBands);
      }

      // 로그/PNL 표시 갱신 (중요 로그 우선)
      try {
        if (kgaStat) {
          const raw = kgaStat?.logs;
          let display = '';
          if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            const pick = (k: string) => (Array.isArray(raw?.[k]) ? raw[k] : []);
            const sections = [
              { title: '체결', key: 'filled' },
              { title: '진입', key: 'entry' },
              { title: '청산', key: 'exit' },
              { title: '주문', key: 'order' },
            ];
            const lines: string[] = [];
            for (const s of sections) {
              const arr = pick(s.key) as string[];
              if (arr.length) {
                lines.push(`== ${s.title} ==`);
                lines.push(...arr.slice(0, 100));
              }
            }
            if (lines.length === 0) {
              const any = Object.values(raw).flat() as string[];
              display = (any || []).slice(-200).join('\n');
            } else {
              display = lines.join('\n');
            }
          } else if (Array.isArray(raw)) {
            display = (raw as any[]).slice(-300).join('\n');
          } else {
            display = String(raw ?? '');
          }
          setLogs(display);
          const pnl = kgaStat?.pnl || {};
          const elPnl = document.getElementById('pnl-krw-sum'); if (elPnl) elPnl.textContent = Number(pnl.profit_krw_cum ?? 0).toLocaleString();
          const elFeeUp = document.getElementById('fee-upbit-krw'); if (elFeeUp) elFeeUp.textContent = Number(pnl.fees_upbit_krw_cum ?? 0).toLocaleString();
          const elFeeBnU = document.getElementById('fee-binance-usdt'); if (elFeeBnU) elFeeBnU.textContent = (Number(pnl.fees_binance_usdt_cum ?? 0)).toFixed(3);
          const elFeeBnK = document.getElementById('fee-binance-krw'); if (elFeeBnK) elFeeBnK.textContent = Number(pnl.fees_binance_krw_cum ?? 0).toLocaleString();
        }
      } catch {}

      // 성과 요약 DOM 업데이트 (주문 합계 = 체결 + 진입 + 청산)
      try {
        const total = Number(met?.total_orders || 0) + Number(met?.entries || 0) + Number(met?.exits || 0);
        const elTotal = document.getElementById('metric-total'); if (elTotal) elTotal.textContent = loc(total);
        const elUp = document.getElementById('metric-up'); if (elUp) elUp.textContent = loc(Number(met?.upbit_orders || 0));
        const elBn = document.getElementById('metric-bn'); if (elBn) elBn.textContent = loc(Number(met?.binance_orders || 0));
        const elLoops = document.getElementById('metric-loops'); if (elLoops) elLoops.textContent = loc(Number(met?.loops || 0));
        const elErr = document.getElementById('metric-errors'); if (elErr) elErr.textContent = loc(Number(met?.errors || 0));
        const elEnt = document.getElementById('metric-entries'); if (elEnt) elEnt.textContent = loc(Number(met?.entries || 0));
        const elEx = document.getElementById('metric-exits'); if (elEx) elEx.textContent = loc(Number(met?.exits || 0));
      } catch {}

      // 진입 증거금 업데이트(런타임 상태 사용)
      if (kgaStat) updateUsedMarginFromStatus(kgaStat);
    } catch (e) { console.error(e); }
  }, [fetchJson, updateUsedMarginFromStatus, effectiveUserId]);


  // ===== Component Event Handlers =====
  const handleAddBand = useCallback(() => {
    setBands(prevBands => {
      const idx = prevBands.length + 1;
      return [...prevBands, { name: `B${idx}`, target_kimp: 0, exit_kimp: 0.2, tolerance: 0.1, leverage: 3, amount_btc: 0.001 }];
    });
  }, []);

  const handleBandChange = useCallback((index: number, key: keyof Band, value: string | number) => {
    setBands(prevBands => {
      const newBands = [...prevBands];
      const bandToUpdate = { ...newBands[index] };
      (bandToUpdate[key] as any) = value;
      newBands[index] = bandToUpdate;
      return newBands;
    });
  }, []);

  const handleSaveBands = useCallback(() => {
    try {
      localStorage.setItem('kimp_cfg_bands_v2', JSON.stringify({ bands: bands }));
      toast({ title: '설정 저장 완료', description: '브라우저 로컬에 저장되었습니다.' });
    } catch (e) {
      console.error(e);
      toast({ title: '저장 실패', description: String(e), variant: 'destructive' });
    }
  }, [bands, toast]);

  const handleLoadBands = useCallback(async () => {
    try {
      // 세션 우선: 세션/효과적 사용자 ID가 없으면 보류
      if (!user?.id && !effectiveUserId) {
        console.warn('⏸️ 세션 미확정: 서버 밴드 로드를 보류합니다.');
        return;
      }

      // 세션 기반 사용자 ID 우선
      const targetUserId = user?.id ? String(user.id) : String(effectiveUserId);

      const primary = await fetchJson(`/api/trading-strategies/${targetUserId}`);
      if (Array.isArray(primary) && primary.length > 0) {
        // 서버 investmentAmount(원화)가 클라 BTC 수량으로 잘못 들어오는 경우 보정
        let up: number | undefined = isNum(kimp.upbit_price) ? kimp.upbit_price : undefined;
        if (!up || up <= 0) {
          try {
            const cur = await fetchJson('/current');
            if (isNum(cur?.upbit_price)) up = cur.upbit_price;
          } catch {}
        }
        const raw = primary.map(mapStrategyToBand);
        const next = raw.map((b: any) => {
          const amt = normalizeAmountBtc(b?.amount_btc, up);
          return { ...b, amount_btc: amt };
        });
        setBands(next);
        try { localStorage.setItem('kimp_cfg_bands_v2', JSON.stringify({ bands: next })); } catch {}
        toast({ title: '불러오기 완료', description: '세션 사용자 전략을 적용했습니다.' });
        return;
      }
      // 2) 폴백: 6 → 1 순서로 시도
      const candidates = Array.from(new Set([effectiveUserId, '6', '1'])).filter(Boolean);
      for (const uid of candidates) {
        if (uid === effectiveUserId) continue;
        const alt = await fetchJson(`/api/trading-strategies/${uid}`);
        if (Array.isArray(alt) && alt.length > 0) {
          const next = alt.map(mapStrategyToBand);
          setBands(next);
          try {
            localStorage.setItem('x-user-id', uid);
            localStorage.setItem('kimp_cfg_bands_v2', JSON.stringify({ bands: next }));
          } catch {}
          setEffectiveUserId(uid);
          toast({ title: '불러오기 완료', description: `DB 전략을 userId=${uid}에서 불러와 적용했습니다.` });
          return;
        }
      }
      // 3) 최종 폴백: 로컬 저장
      const raw = localStorage.getItem('kimp_cfg_bands_v2');
      if (raw) {
        const j = JSON.parse(raw);
        setBands(j.bands || []);
        toast({ title: '서버 전략 없음', description: '로컬 저장본을 불러왔습니다.' });
      } else {
        toast({ title: '불러오기 실패', description: '서버/로컬에 저장된 전략이 없습니다.', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: '불러오기 실패', description: String(e), variant: 'destructive' });
    }
  }, [effectiveUserId, fetchJson, toast, user?.id, kimp.upbit_price]);

  const handleDeleteBand = useCallback((indexToDelete: number) => {
    setBands(prevBands => prevBands.filter((_, index) => index !== indexToDelete));
  }, []);

  const handleRegisterBand = useCallback(async (index: number) => {
    const band = bands[index];
    try {
      setRegisteringIndex(index);
      const payload = {
        // 서버 스키마에 맞춘 필드명 매핑
        name: band.name || '김치 프리미엄 전략',
        strategyType: 'positive_kimchi',
        entryRate: String(band.target_kimp ?? 0),
        exitRate: String(band.exit_kimp ?? 0),
        toleranceRate: String(band.tolerance ?? 0.1),
        leverage: Number(band.leverage ?? 3),
        // 서버는 KRW 금액을 기대하므로 BTC 수량 → KRW로 변환하여 저장
        investmentAmount: (() => {
          const qty = Number(band.amount_btc ?? 0) || 0;
          const up = isNum(kimp.upbit_price) ? kimp.upbit_price : 0;
          const krw = up > 0 ? Math.max(0, Math.round(qty * up)) : 0;
          return String(krw);
        })(),
        isActive: true,
        symbol: 'BTC',
      } as const;
      console.log('🔍 서버 등록 요청:', payload);
      const result = await fetchJson(`/api/trading-strategies/${effectiveUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('✅ 서버 등록 성공:', result);
      toast({ title: '서버 등록 완료', description: `${band.name} 전략이 서버에 저장되었습니다.` });
      // 서버 ID를 즉시 로컬 상태에 반영하고 상태 배지를 갱신
      const newId = result?.strategy?.id ?? result?.id;
      if (newId != null) {
        setBands(prev => {
          const copy = [...prev];
          const b = { ...(copy[index] || {}) } as Band;
          b.serverId = String(newId);
          copy[index] = b;
          try { localStorage.setItem('kimp_cfg_bands_v2', JSON.stringify({ bands: copy })); } catch {}
          return copy;
        });
        // DOM 강제 업데이트 제거: React 상태에 의해 표시됨
      }
      refreshServerBands();
    } catch (e) {
      console.error('❌ 서버 등록 실패:', e);
      toast({ title: '서버 등록 실패', description: String(e), variant: 'destructive' });
    } finally {
      setRegisteringIndex(null);
    }
  }, [bands, fetchJson, refreshServerBands, toast, effectiveUserId, kimp.upbit_price]);

  const handleUnregisterBandAt = useCallback(async (index: number) => {
    const band = bands[index];
    if (!band) return;
    // serverId가 있으면 우선 사용, 없으면 이름으로 서버 목록에서 검색
    setUnregisteringIndex(index);
    let targetId = band.serverId ?? serverBands.find(sb => sb.name === (band.name || ''))?.id;
    if (targetId == null) {
      try {
        await refreshServerBands();
        const refetched = serverBands.find(sb => sb.name === (band.name || ''))?.id;
        if (refetched != null) targetId = refetched;
      } catch {}
    }
    try {
      if (targetId != null) {
        await fetchJson(`/api/trading-strategies/${targetId}`, { method: 'DELETE' });
        toast({ title: '등록 취소 완료', description: `${band.name || '-'} 전략이 서버에서 삭제되었습니다.` });
      } else {
        toast({ title: '서버 기록 없음', description: '서버에 해당 전략 ID를 찾지 못했습니다. 로컬에서 제거합니다.', variant: 'destructive' });
      }
      // UI 목록에서도 해당 밴드 삭제
      setBands(prev => {
        const next = prev.filter((_, i) => i !== index);
        try { localStorage.setItem('kimp_cfg_bands_v2', JSON.stringify({ bands: next })); } catch {}
        return next;
      });
      // 서버 상태/보드 동기화
      refreshServerBands();
      tickHeavy();
    } catch (e) {
      console.error(e);
      toast({ title: '서버 등록 취소 실패', description: String(e), variant: 'destructive' });
    }
    finally {
      setUnregisteringIndex(null);
    }
  }, [bands, serverBands, fetchJson, refreshServerBands, tickHeavy, toast]);

  // ===== Band Board Optimistic Actions =====
  const removeBoardRowOptimistic = useCallback((id: string | number) => {
    const key = String(id);
    setServerStatusBands(prev => prev.filter((x: any) => String(x?.id) !== key));
    // 구성 목록에서도 같은 id가 있으면 제거(일관성)
    setServerBands(prev => Array.isArray(prev) ? prev.filter((x: any) => String(x?.id) !== key) : prev);
  }, []);

  const handleBoardClose = useCallback(async (id: string | number) => {
    console.log(`[레거시 클라이언트] '청산' 버튼 클릭. 전략 ID: ${id}`);
    try {
      setBoardActingId(id);
      console.log(`[레거시 클라이언트] 서버에 청산 요청 전송: DELETE /api/trading-strategies/${id}`);
      // 서버에서 전략 삭제
      await fetchJson(`/api/trading-strategies/${id}`, { method: 'DELETE' });
      // 낙관적 제거
      removeBoardRowOptimistic(id);
      console.log(`[레거시 클라이언트] 서버 요청 성공 후 UI에서 해당 전략 제거됨.`);
      toast({ title: '청산 완료', description: `전략 #${id}가 삭제되었습니다.` });
    } catch (e) {
      console.error(`[레거시 클라이언트] 청산 요청 실패. 전략 ID: ${id}`, e);
      toast({ title: '청산 실패', description: String(e), variant: 'destructive' });
    } finally {
      setBoardActingId(null);
      try { 
        console.log(`[레거시 클라이언트] 청산 프로세스 완료 후 데이터 새로고침 시도.`);
        tickHeavy(); 
      } catch {}
    }
  }, [removeBoardRowOptimistic, fetchJson, tickHeavy, toast]);

  const handleBoardCancelWaiting = useCallback(async (id: string | number) => {
    try {
      setBoardActingId(id);
      await fetchJson(`/api/trading-strategies/${id}`, { method: 'DELETE' });
      removeBoardRowOptimistic(id);
      toast({ title: '대기 취소', description: `전략 #${id}가 삭제되었습니다.` });
    } catch (e) {
      console.error(e);
      toast({ title: '대기 취소 실패', description: String(e), variant: 'destructive' });
    } finally {
      setBoardActingId(null);
      try { tickHeavy(); } catch {}
    }
  }, [removeBoardRowOptimistic, fetchJson, tickHeavy, toast]);
  
  const handleStart = useCallback(async () => {
    if (serverState.running || starting) {
      toast({ title: '이미 실행 중', description: '자동매매가 실행 상태입니다.' });
      return;
    }
    setStarting(true);
    try {
      await fetchJson(`/api/trading/start/${effectiveUserId}`, { method: 'POST', headers: { 'X-Trace-Id': `cli-${Date.now()}` } });
      toast({ title: '전략 시작', description: '자동매매가 시작되었습니다.' });
    } catch (e) {
      console.error(e);
      try {
        const stat = await fetchJson(`/api/trading/status/${effectiveUserId}`);
        if (stat?.isRunning) {
          toast({ title: '이미 실행 중', description: '자동매매가 이미 실행 중입니다.' });
        } else {
          toast({ title: '시작 실패', description: String(e), variant: 'destructive' });
        }
      } catch {
        toast({ title: '시작 실패', description: String(e), variant: 'destructive' });
      }
    } finally {
      tickHeavy();
      setStarting(false);
    }
  }, [fetchJson, tickHeavy, toast, effectiveUserId, serverState.running, starting]);

  const handleStop = useCallback(async () => {
    try {
      await fetchJson(`/api/trading/stop/${effectiveUserId}`, { method: 'POST' });
      toast({ title: '전략 중지', description: '자동매매가 중지되었습니다.' });
      tickHeavy();
    } catch (e) {
      console.error(e);
      toast({ title: '중지 실패', description: String(e), variant: 'destructive' });
    }
  }, [fetchJson, tickHeavy, toast, effectiveUserId]);

  const handleCheckSession = useCallback(async () => {
    try {
      const data = await apiFetchJson('/api/auth/me', { method: 'GET' });
      setSessionInfo(data);
      setShowSessionInfo(true);
      toast({
        title: "세션 조회 성공",
        description: `현재 로그인된 사용자: ${data.username}`,
      });
    } catch (error: any) {
      setSessionInfo(null);
      setShowSessionInfo(true);
      toast({
        title: "세션 없음",
        description: "현재 로그인된 사용자가 없거나 인증이 만료되었습니다",
        variant: "destructive",
      });
    }
  }, [toast]);

  // ===== Render Functions =====
  const renderBands = (): JSX.Element | JSX.Element[] => {
    if (!bands || bands.length === 0) {
      return <tr><td colSpan={10} className="muted">밴드를 추가하세요</td></tr>;
    }
    return bands.map((b, index) => {
      const configured = b.serverId != null ? undefined : configuredByName.get(String(b.name || ''));
      const isRegistered = !!(b.serverId != null || configured);
      const runtime = b.serverId != null
        ? statusById.get(String(b.serverId))
        : statusByName.get(String(b.name || ''));
      const stateText: string | undefined = runtime?.state ? String(runtime.state) : (isRegistered ? '대기중' : undefined);
      const stateClass = stateText === 'entered' ? 'good' : (stateText === 'waiting' ? 'warn' : '');
      return (
        <tr key={index} ref={el => {
          bandRefs.current[index] = el;
          // 행이 렌더링된 후 미리보기 업데이트
          if (el) {
            setTimeout(() => updatePreviewForRow(el), 0);
          }
        }}>
          <td><input className="ctrl" data-k="name" value={b.name || ''} onChange={(e) => handleBandChange(index, 'name', e.target.value)} /></td>
          <td><input className="ctrl" data-k="target_kimp" type="number" step="0.01" value={b.target_kimp || ''} onChange={(e) => handleBandChange(index, 'target_kimp', e.target.value)} /></td>
          <td><input className="ctrl" data-k="exit_kimp" type="number" step="0.01" value={b.exit_kimp || ''} onChange={(e) => handleBandChange(index, 'exit_kimp', e.target.value)} /></td>
          <td><input className="ctrl" data-k="tolerance" type="number" step="0.01" value={b.tolerance ?? 0.1} onChange={(e) => handleBandChange(index, 'tolerance', e.target.value)} /></td>
          <td><input className="ctrl" data-k="leverage" type="number" step="1" value={b.leverage ?? 3} onChange={(e) => {
            handleBandChange(index, 'leverage', e.target.value);
            const tr = bandRefs.current[index];
            if (tr) setTimeout(() => updatePreviewForRow(tr), 0);
          }} /></td>
          <td><input className="ctrl" data-k="amount_btc" type="number" step="0.001" value={b.amount_btc ?? 0.001} onChange={(e) => {
            handleBandChange(index, 'amount_btc', e.target.value);
            const tr = bandRefs.current[index];
            if (tr) setTimeout(() => updatePreviewForRow(tr), 0);
          }} /></td>
          <td data-size>-</td>
          <td><span className={`badge ${stateClass}`} data-state>{stateText ?? '미등록'}</span></td>
          <td className="pos-actions">
            <div className="row" style={{ flexDirection: 'column', gap: '6px' }}>
              <button className="btn" onClick={() => handleRegisterBand(index)} disabled={registeringIndex === index}>{registeringIndex === index ? '등록 중…' : '서버 등록'}</button>
              <button className="btn secondary" onClick={() => handleUnregisterBandAt(index)} disabled={unregisteringIndex === index}>{unregisteringIndex === index ? '취소 중…' : '등록 취소'}</button>
            </div>
          </td>
          <td><button className="btn secondary" onClick={() => handleDeleteBand(index)}>삭제</button></td>
        </tr>
      );
    });
  };

  // ===== 활성 전략들의 포지션 상태 확인 (중복 진입 방지) =====
  const checkActiveStrategiesPositions = useCallback(async (strategies: any[]) => {
    try {
      console.log('🔒 활성 전략들의 포지션 상태 확인 시작');
      const positionsResponse = await fetch('/api/positions', { credentials: 'include' });
      
      if (positionsResponse.ok) {
        const positions = await positionsResponse.json();
        console.log('📊 현재 포지션 목록:', positions);
        
        const activeStrategies = strategies.filter(s => s.isActive);
        console.log('🎯 활성 전략 목록:', activeStrategies.map(s => ({ id: s.id, name: s.name })));
        
        for (const strategy of activeStrategies) {
          const activePosition = positions.find((p: any) => 
            p.status === 'open' && 
            p.strategyId === parseInt(strategy.id) && 
            p.symbol === (strategy.crypto || 'BTC')
          );
          
          if (activePosition) {
            const entryTime = new Date(activePosition.entryTime);
            const elapsed = Date.now() - entryTime.getTime();
            const remainMinutes = Math.ceil((600000 - elapsed) / 60000); // 10분 쿨다운
            
            console.log(`🔒 전략 "${strategy.name}" 쿨다운 상태:`, {
              positionId: activePosition.id,
              entryTime: entryTime.toISOString(),
              elapsed: Math.floor(elapsed / 1000) + 's',
              remainMinutes: remainMinutes > 0 ? remainMinutes + 'min' : '완료'
            });
            
            if (elapsed < 600000) { // 10분 미경과
              console.log(`⏳ 전략 "${strategy.name}" 쿨다운 중 (${remainMinutes}분 남음)`);
              // 자동으로 전략 비활성화 (UI 반영)
              strategy.isActive = false;
              
              // 🔄 쿨다운 완료 시 자동 활성화 타이머 설정
              const remainingTime = 600000 - elapsed;
              setTimeout(() => {
                console.log(`✅ 전략 "${strategy.name}" 쿨다운 완료 - 자동 활성화`);
                setStrategies(prev => prev.map(s => 
                  s.id === strategy.id ? { ...s, isActive: true } : s
                ));
                toast({
                  title: '전략 활성화',
                  description: `${strategy.name} 전략의 쿨다운이 완료되어 자동으로 활성화되었습니다.`
                });
              }, remainingTime);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ 포지션 상태 확인 실패:', error);
    }
  }, []);

  // ===== 실제 전략 목록 불러오기 (세션 기반) =====
  const loadStrategiesFromDB = useCallback(async (opts: { force?: boolean } = {}) => {
    if (!opts.force && hasLoadedStrategiesRef.current) return;
    try {
      // 세션 우선: 세션/효과적 사용자 ID가 없으면 조회 보류
      if (!user?.id && !effectiveUserId) {
        console.warn('⏸️ 세션 사용자 미확정으로 전략 조회를 보류합니다.');
        toast({ title: '전략 조회 보류', description: '세션 확인 후 다시 시도합니다.', variant: 'destructive' });
        return;
      }

      // 1. 세션에서 인증된 사용자 정보 우선 사용
      const userId = user?.id ? String(user.id) : String(effectiveUserId);
      console.log('🔍 세션에서 사용자 ID 확인:', userId);
      
      // 3. 해당 사용자의 전략 목록 조회
      console.log('📊 전략 조회 요청 - 사용자 ID:', userId);
      console.log('🔗 API URL:', `/api/trading-strategies/${userId}`);
      
      const dbStrategies = await fetchJson(`/api/trading-strategies/${userId}`);
      if (dbStrategies == null) {
        console.log('⏭️ 전략 조회가 취소됨(Abort) - 기존 화면 상태 유지');
        return;
      }
      console.log('📥 API 응답 데이터:', dbStrategies);
      
      if (Array.isArray(dbStrategies)) {
        const formattedStrategies = dbStrategies.map(s => ({
          id: String(s.id),
          name: s.name,
          crypto: s.symbol,
          entryCondition: String(s.entryRate),
          takeProfitCondition: String(s.exitRate),
          investmentAmount: String(s.investmentAmount),
          leverage: String(s.leverage),
          tolerance: String(s.toleranceRate || TRADING_CONSTANTS.DEFAULT_TOLERANCE), // DB에서 로드하거나 기본값
          riskLevel: 'moderate',
          isActive: s.isActive,
          profitRate: s.totalProfit > 0 ? `+${s.totalProfit}` : String(s.totalProfit || '+0.00'),
          executionCount: s.totalTrades || 0
        }));
        
        // 🔒 전략 로드 후 활성 전략들의 포지션 상태 확인
        await checkActiveStrategiesPositions(formattedStrategies);
        
        setStrategies(formattedStrategies);
        console.log(`✅ 사용자 ${userId}의 전략 ${formattedStrategies.length}개 로드 완료:`, formattedStrategies);
        hasLoadedStrategiesRef.current = true;
        
        if (formattedStrategies.length === 0) {
          console.log('ℹ️ 등록된 전략이 없습니다. 새 전략을 추가해보세요.');
        }
      } else {
        console.log('⚠️ 전략 데이터 형식이 올바르지 않습니다:', dbStrategies);
        // 실패 시 토스트 대신 로딩 상태 유지 (UI에서 스피너)
        setStrategies((prev) => prev); // no-op to avoid clearing UI
      }
    } catch (error) {
      console.error('❌ 전략 목록 로드 실패:', error);
      // 실패 시 토스트 미노출, 화면은 로딩 상태로 유지
    }
  }, [fetchJson, effectiveUserId, user?.id, toast]);

  // ===== Lifecycle Hooks =====
  useEffect(() => {
    hasLoadedStrategiesRef.current = false; // 초기 진입 시 한번 허용
    refreshServerBands();
    
    // 페이지 로드 시 즉시 세션 확인 및 전략 로드 시도
    if (!hasScheduledInitialLoadRef.current) {
      hasScheduledInitialLoadRef.current = true;
      setTimeout(async () => {
        try {
          console.log('🔄 페이지 로드 - 세션 직접 확인');
          const sessionData = await apiFetchJson('/api/auth/me');
          if (sessionData.id) {
            console.log('✅ 페이지 로드 - 세션 확인됨:', sessionData.id);
            setEffectiveUserId(String(sessionData.id));
            loadStrategiesFromDB();
          } else {
            console.log('❌ 페이지 로드 - 세션 없음, 로그인 필요');
          }
        } catch (error) {
          console.log('❌ 페이지 로드 - 세션 확인 실패:', error);
        }
      }, 500); // 0.5초 후 시도
    }
  }, [refreshServerBands, loadStrategiesFromDB]);

  // 사용자 정보나 effectiveUserId가 변경될 때 전략 목록 다시 로드
  useEffect(() => {
    console.log('👤 사용자 정보 변경 감지, 전략 목록 다시 로드');
    console.log('🔍 현재 사용자 상태:', { 
      userFromAuth: user?.id, 
      effectiveUserId,
      sessionUser: user,
      isAuthenticated: !!user,
      userLoading: !user && effectiveUserId
    });
    
    // 세션에서 사용자 정보가 있을 때만 전략 로드
    if (user?.id) {
      console.log('🚀 세션 사용자 기반으로 전략 로드 시도:', user.id);
      setEffectiveUserId(String(user.id)); // 세션 사용자 ID로 설정
      hasLoadedStrategiesRef.current = false; // 사용자 변경 시 한 번 더 허용
      loadStrategiesFromDB();
    } else {
      console.log('⚠️ 세션에 사용자 정보가 없습니다. 조회 보류');
    }
  }, [user?.id]);

  // 웹소켓 메시지 핸들러 등록
  useEffect(() => {
    const unsubscribeKimchi = subscribe('kimchi-premium', (data: any[]) => {
      console.log('📨 김치프리미엄 데이터 수신:', data.length, '개');
      // 실시간 김치프리미엄 데이터를 kimp 상태에 반영
      if (data && data.length > 0) {
        const btcData = data.find(item => item.symbol === 'BTC');
        if (btcData) {
          setKimp({
            kimp: btcData.premiumRate,
            upbit_price: btcData.upbitPrice,
            binance_price: btcData.binanceFuturesPrice,
            usdkrw: btcData.usdKrwRate || btcData.exchangeRate
          });
        }
      }
    });

    return () => {
      if (unsubscribeKimchi) unsubscribeKimchi();
    };
  }, [subscribe]);

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    const startPolling = () => {
      stopPolling();
      intervals.push(setInterval(tickLight, 900));
      intervals.push(setInterval(tickHeavy, 2500));
      tickLight();
      tickHeavy();
    };
    const stopPolling = () => {
      intervals.forEach(clearInterval);
      cancelInflight();
    };
    startPolling();
    const onVis = () => { if (document.hidden) { stopPolling(); } else { startPolling(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); stopPolling(); };
  }, [tickLight, tickHeavy, cancelInflight]);


  // ===== 차트 그리기 로직 =====
  const drawSpark = useCallback(() => {
    const c = sparkCanvasRef.current;
    const data = getChartData();
    if (!c || data.length === 0) return;

    const ctx = c.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth || 300;
    const h = c.clientHeight || 60;

    // Canvas 크기 설정
    if (c.width !== w * dpr) c.width = w * dpr;
    if (c.height !== h * dpr) c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 배경 클리어
    ctx.clearRect(0, 0, w, h);

    if (data.length === 0) return;

    // 최소/최대값 계산 (값 기준)
    const min = Math.min(...data.map(d => d.v));
    const max = Math.max(...data.map(d => d.v));
    const span = Math.max(1e-9, max - min);

    // 최소/최대값 표시 업데이트
    const sparkMinEl = document.querySelector('#spark-min');
    const sparkMaxEl = document.querySelector('#spark-max');
    if (sparkMinEl) sparkMinEl.textContent = min.toFixed(2);
    if (sparkMaxEl) sparkMaxEl.textContent = max.toFixed(2);

    // 차트 그리기
    const pad = 6;
    ctx.beginPath();
    
    const firstT = data[0].t;
    const lastT = data[data.length - 1].t;
    const tSpan = Math.max(1, lastT - firstT);
    data.forEach((point, index) => {
      const x = pad + (w - 2 * pad) * ((point.t - firstT) / tSpan);
      const y = h - pad - (h - 2 * pad) * ((point.v - min) / span);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7aa2ff';
    ctx.stroke();
  }, [getChartData]);

  useEffect(() => {
    drawSpark(); // sparkData가 변경될 때마다 차트를 다시 그립니다.
    window.addEventListener('resize', drawSpark);
    return () => window.removeEventListener('resize', drawSpark);
  }, [drawSpark]);

  // 디버깅 로그
  console.log('🔍 LegacyAutoTradingPage 상태:', { 
    isLoading, 
    isAuthenticated, 
    user: user?.id,
    effectiveUserId 
  });

  // 로딩 중이거나 인증되지 않은 경우 처리
  if (isLoading) {
    console.log('⏳ 로딩 중...');
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p>인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ 인증되지 않음');
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <p>로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  console.log('✅ 정상 렌더링 시작');

  
  return (
    <>
      <header>
        <div className="nav">
          <div className="brand">
            <div className="logo" aria-hidden="true">₿</div>
            <div>
              김치프리미엄 자동매매<br/>
              <span className="sub">Pro Dashboard+ · Multi-Band + Queue (강제진입 없음)</span>
            </div>
          </div>

          <span id="run-badge" className={`chip ${serverState.running ? 'ok' : ''}`} title="전략 실행 상태">
            <i className={`dot ${serverState.running ? 'ok' : ''}`}></i>
            <span>{serverState.running ? '실행중' : '중지됨'}</span>
          </span>
          <span id="arm-badge" className="chip" title="진입 정책"><i className={`dot ${serverState.running ? 'ok' : 'danger'}`}></i><span>정확한 일치 시 자동 대기→진입</span></span>
          <span className="chip" title="수수료 기준"><i className="dot ok"></i>추정 비용 ≈ 0.18%p</span>
          <span id="net-badge" className="chip" title="네트워크 상태">
            <i className={`dot ${netOk ? 'ok' : (errCount > 0 ? 'warn' : 'danger')}`}></i>
            <span>{netMs != null ? `NET ${netMs}ms` : 'NET …'}</span>
          </span>

          <div className="grow"></div>
          <button 
            onClick={handleCheckSession}
            className="chip"
            style={{ cursor: 'pointer', marginRight: '10px' }}
            title="현재 세션 정보 확인"
          >
            <i className="dot ok"></i>
            <span>세션 확인</span>
          </button>
          <span id="kimp-brief" className="kimp-brief mono" aria-live="polite">
            {`김프 ${fx(kimp.kimp, 3)}% · 업비트 ${loc(kimp.upbit_price)} KRW · 바이낸스 ${fx(kimp.binance_price, 2)} USDT · 환율 ${fx(kimp.usdkrw, 2)}`}
          </span>
        </div>
      </header>
      <div className="wrap">
        <div className="grid">
          {/* 세션 정보 표시 */}
          {showSessionInfo && (
            <section style={{gridColumn: 'span 12', marginBottom: '20px'}}>
              <div className="card" style={{padding: '15px', backgroundColor: sessionInfo ? '#e8f5e8' : '#ffe8e8'}}>
                <h3 style={{margin: '0 0 10px 0', color: sessionInfo ? '#2d5a2d' : '#8b0000'}}>
                  세션 정보
                </h3>
                {sessionInfo ? (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px'}}>
                    <div>
                      <strong>로그인 상태:</strong> <span style={{color: '#2d5a2d'}}>활성</span>
                    </div>
                    <div>
                      <strong>사용자명:</strong> {sessionInfo.username}
                    </div>
                    <div>
                      <strong>권한:</strong> {sessionInfo.role}
                    </div>
                    <div>
                      <strong>사용자 ID:</strong> {sessionInfo.id}
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign: 'center', color: '#8b0000'}}>
                    <strong>로그인 상태: 비활성</strong><br/>
                    <small>로그인이 필요합니다</small>
                  </div>
                )}
              </div>
            </section>
          )}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{gridColumn: 'span 12'}}>
            <div className="lg:col-span-2 bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">자동매매 전략</h2>
                <div className="flex items-center space-x-2">
                  {!isAuthenticated && !isLoading && (
                    <button 
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                      onClick={() => checkSession()}
                    >
                      <i className="fas fa-sync-alt mr-2"></i>세션 조회
                    </button>
                  )}
                  <button 
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" 
                    data-testid="button-add-strategy" type="button" onClick={() => {
                      // 새 전략 추가 → 편집 모드 해제 및 폼 초기화
                      setEditingStrategyId(null);
                      setNewStrategy({
                        name: '',
                        crypto: '',
                        entryCondition: '3.0',
                        takeProfitCondition: '2.0',
                        baseAmount: '500000',
                        investmentAmount: '0.003',
                        leverage: '3',
                        tolerance: String(TRADING_CONSTANTS.DEFAULT_TOLERANCE),
                        riskLevel: 'moderate',
                        activateImmediately: false
                      });
                      setShowCreateModal(true);
                    }}
                    disabled={!isAuthenticated}
                    title={!isAuthenticated ? "로그인 후 사용할 수 있습니다" : ""}
                  >
                    <i className="fas fa-plus mr-2"></i>새 전략 추가
                  </button>
                </div>
              </div>
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2" style={{scrollbarWidth: 'thin', scrollbarColor: '#64748b #1e293b'}}>
                {strategies.map((strategy) => (
                  <div key={strategy.id} className="border border-border rounded-lg p-4 hover:border-primary transition-colors" data-testid={`card-strategy-${strategy.id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${strategy.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        <h3 className="font-medium" data-testid={`text-strategy-name-${strategy.id}`}>
                          {strategy.name}
                        </h3>
                        <button 
                          type="button" 
                          role="switch" 
                          aria-checked={strategy.isActive} 
                          data-state={strategy.isActive ? "checked" : "unchecked"} 
                          className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400" 
                          data-testid={`switch-status-${strategy.id}`}
                          onClick={async () => {
                            const newActiveState = !strategy.isActive;
                            
                            // 세션 우선: 세션/효과적 사용자 ID가 없으면 중단
                            if (!user?.id && !effectiveUserId) {
                              console.warn('⏸️ 세션 미확정: 전략 상태 변경 요청을 보류합니다.');
                              toast({ title: '세션 확인 필요', description: '로그인/세션 확인 후 다시 시도하세요.', variant: 'destructive' });
                              return;
                            }

                            // 🔒 활성화 시 기존 포지션 확인 (중복 진입 방지)
                            if (newActiveState) {
                              try {
                                const positionsResponse = await fetch('/api/positions', { credentials: 'include' });
                                if (positionsResponse.ok) {
                                  const positions = await positionsResponse.json();
                                  const activePosition = positions.find((p: any) => 
                                    p.status === 'open' && 
                                    p.strategyId === strategy.id && 
                                    p.symbol === (strategy.crypto || 'BTC')
                                  );
                                  
                                  if (activePosition) {
                                    const entryTime = new Date(activePosition.entryTime);
                                    const elapsed = Date.now() - entryTime.getTime();
                                    const remainMinutes = Math.ceil((600000 - elapsed) / 60000); // 10분 쿨다운
                                    
                                    if (elapsed < 600000) { // 10분 미경과
                                      toast({ 
                                        title: '쿨다운 진행중', 
                                        description: `이 전략은 ${remainMinutes}분 후 다시 활성화할 수 있습니다.`,
                                        variant: 'destructive' 
                                      });
                                      return;
                                    }
                                  }
                                }
                              } catch (error) {
                                console.error('포지션 확인 실패:', error);
                              }
                            }

                            // UI 즉시 업데이트
                            setStrategies(prev => prev.map(s => 
                              s.id === strategy.id 
                                ? {...s, isActive: newActiveState}
                                : s
                            ));
                            
                            // DB에 저장 (기존 허용오차/설정값 보존)
                            try {
                              const payload = {
                                name: strategy.name,
                                strategyType: strategy.strategyType || 'positive_kimchi',
                                entryRate: strategy.entryCondition,
                                exitRate: strategy.takeProfitCondition,
                                toleranceRate: String(strategy.tolerance ?? strategy.toleranceRate ?? TRADING_CONSTANTS.DEFAULT_TOLERANCE),
                                leverage: parseInt(strategy.leverage) || 3,
                                investmentAmount: strategy.investmentAmount?.toString() || '0.003',
                                symbol: strategy.crypto || 'BTC',
                                isActive: newActiveState,
                                isAutoTrading: newActiveState,
                                tolerance: String(strategy.tolerance ?? strategy.toleranceRate ?? TRADING_CONSTANTS.DEFAULT_TOLERANCE)
                              };
                              
                              // 세션 기반: 서버에서 세션 사용자로 처리 (무파라미터 라우트 미구현이면 기존 경로 유지)
                              await fetchJson(`/api/trading-strategies/${user?.id ? String(user.id) : String(effectiveUserId)}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                              });
                              
                              toast({
                                title: `전략 ${newActiveState ? '활성화' : '비활성화'}`,
                                description: `${strategy.name} 전략이 ${newActiveState ? '활성화' : '비활성화'}되었습니다.`,
                              });
                              loadStrategiesFromDB();
                            } catch (error) {
                              console.error('전략 상태 변경 실패:', error);
                              setStrategies(prev => prev.map(s => 
                                s.id === strategy.id 
                                  ? {...s, isActive: strategy.isActive}
                                  : s
                              ));
                              toast({ title: '상태 변경 실패', description: '서버 저장에 실패했습니다.', variant: 'destructive' });
                            }
                          }}
                        >
                          <span 
                            data-state={strategy.isActive ? "checked" : "unchecked"} 
                            className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                          ></span>
                        </button>
                        <span className={`text-xs font-medium ${strategy.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {strategy.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-red-600 text-white hover:bg-red-700 h-9 rounded-md px-3" 
                          data-testid={`button-delete-${strategy.id}`}
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none'
                          }}
                          onClick={async () => {
                            if (!confirm(`"${strategy.name}" 전략을 정말 삭제하시겠습니까?`)) {
                              return;
                            }
                            
                            // UI에서 즉시 제거
                            setStrategies(prev => prev.filter(s => s.id !== strategy.id));
                            
                            // DB에서 삭제 시도
                            try {
                              await fetchJson(`/api/trading-strategies/${strategy.id}`, {
                                method: 'DELETE'
                              });
                              
                              console.log('✅ 전략 삭제 성공:', strategy.id);
                              toast({ title: '전략 삭제 완료', description: `${strategy.name} 전략이 삭제되었습니다.` });
                              // DB 삭제 성공 시 UI에서 제거 상태 유지 (이미 제거됨)
                            } catch (error) {
                              console.error('❌ 전략 삭제 실패:', error);
                              // 실패 시 UI에 다시 추가 (롤백)
                              setStrategies(prev => [...prev, strategy]);
                              toast({ title: '전략 삭제 실패', description: '서버에서 삭제에 실패했습니다.', variant: 'destructive' });
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">코인</p>
                        <p className="font-medium" data-testid={`text-crypto-${strategy.id}`}>{strategy.crypto}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">진입 조건 (정확한 일치)</p>
                        <p className="font-medium text-green-500" data-testid={`text-entry-${strategy.id}`}>
                          {strategy.entryCondition}% ± {strategy.tolerance || '0.01'}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">익절 조건 (정확한 일치)</p>
                        <p className="font-medium text-primary" data-testid={`text-take-profit-${strategy.id}`}>
                          {strategy.takeProfitCondition}% ± {strategy.tolerance || '0.01'}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">투자 수량</p>
                        <p className="font-medium" data-testid={`text-amount-${strategy.id}`}>
                          {Math.floor(Number(strategy.investmentAmount || 0) * 1000) / 1000} BTC
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">수익률: </span>
                        <span className="text-green-500 font-medium" data-testid={`text-profit-rate-${strategy.id}`}>{strategy.profitRate}%</span>
                        <span className="text-muted-foreground ml-4">실행 횟수: </span>
                        <span className="font-medium" data-testid={`text-execution-count-${strategy.id}`}>{strategy.executionCount}회</span>
                      </div>
                      <button 
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3" 
                        data-testid={`button-details-${strategy.id}`}
                        onClick={() => {
                          // 해당 전략 데이터를 모달에 로드
                          setNewStrategy({
                            name: strategy.name,
                            crypto: strategy.crypto,
                            entryCondition: strategy.entryCondition,
                            takeProfitCondition: strategy.takeProfitCondition,
                            baseAmount: '500000',
                            investmentAmount: strategy.investmentAmount?.toString() || '0.003',
                            leverage: strategy.leverage,
                            tolerance: strategy.tolerance || '0.01',
                            riskLevel: strategy.riskLevel,
                            activateImmediately: strategy.isActive
                          });
                          setEditingStrategyId(strategy.id);
                          setShowCreateModal(true);
                        }}
                      >
                        상세 보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* 일일 거래 통계 */}
            <div className="mt-4 pt-4 border-t border-slate-600">
              <h4 className="text-slate-400 text-sm mb-3">오늘의 거래 통계</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-400">{dailyStats.totalTrades}</p>
                  <p className="text-xs text-slate-400">총 거래</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-400">{dailyStats.upbitTrades}</p>
                  <p className="text-xs text-slate-400">업비트 거래</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-400">{dailyStats.binanceTrades}</p>
                  <p className="text-xs text-slate-400">바이낸스 거래</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-400">{dailyStats.activePositions}</p>
                  <p className="text-xs text-slate-400">활성 포지션</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-yellow-400">₩{dailyStats.totalFees.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">총 수수료</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${dailyStats.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dailyStats.realizedPnl >= 0 ? '+' : ''}₩{dailyStats.realizedPnl.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">실현 손익</p>
                </div>
              </div>
            </div>
          </section>

          {/* 모의 거래 시스템 */}
          <section className="card col-12">
            <MockTradingSystem 
              strategies={strategies}
              currentKimchiData={kimp}
              userId={user?.id ? String(user.id) : "1"}
              onDailyStatsUpdate={setDailyStats}
              onStrategyStatsUpdate={(stats) => {
                // UI의 strategies 상태에 실행 횟수/수익률을 반영 (서버값이 없으면 로컬 값 사용)
                setStrategies(prev => prev.map(s => {
                  const st = stats[s.id];
                  return st ? { ...s, executionCount: st.executionCount, profitRate: Number(st.profitRate.toFixed(2)) } : s;
                }));
              }}
            />
          </section>

          {/* 시장 스냅샷 */}
          <section className="card col-6">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 border-border">
              <h3 className="text-xl font-semibold mb-6 text-slate-200 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                시장 스냅샷
              </h3>
              
              {/* 김프율 - 하이라이트 */}
              <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">김치프리미엄</span>
                  <div className="flex items-center gap-3">
                    <span id="kimp" className="text-2xl font-bold text-white" style={{fontWeight: 800}}>
                      {fx(kimp.kimp, 3)}%
                    </span>
                    <span id="kimp-sign" className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      kimp.kimp < 0 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {kimp.kimp < 0 ? '역프' : '정프'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 가격 정보 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                    <span className="text-sm text-slate-400">업비트</span>
                    <span className="text-lg font-bold text-green-400" id="upbit_price">{loc(kimp.upbit_price)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                    <span className="text-sm text-slate-400">바이낸스</span>
                    <span className="text-lg font-bold text-orange-400" id="binance_price">{loc(kimp.binance_price)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                    <span className="text-sm text-slate-400">환율</span>
                    <span className="text-lg font-bold text-blue-400" id="usdkrw">{loc(kimp.usdkrw)}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                    <span className="text-sm text-slate-400">Upbit KRW</span>
                    <span className="text-lg font-bold text-yellow-400" id="bal-krw">{loc(balances.real.krw)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                    <span className="text-sm text-slate-400">Upbit BTC</span>
                    <span className="text-lg font-bold text-purple-400" id="bal-btc">{fx(balances.real.btc_upbit, 6)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                    <span className="text-sm text-slate-400">Binance USDT</span>
                    <span className="text-lg font-bold text-cyan-400" id="bal-usdt">{loc(balances.real.usdt)}</span>
                  </div>
                </div>
              </div>

              {/* 진입 증거금 (KRW) */}
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">진입 증거금(KRW)</span>
                  <span className="text-lg font-bold text-pink-400" id="used-krw">-</span>
                </div>
              </div>
            </div>
          </section>

          {/* 김치프리미엄 차트 */}
          <section className="card col-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 border-border" data-testid="card-premium-chart">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">김치프리미엄 차트</h2>
              <div className="flex space-x-2">
                <button 
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 ${
                    chartTimeframe === '1H' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
                  data-testid="button-timeframe-1H"
                  onClick={() => setChartTimeframe('1H')}
                >
                  1H
                </button>
                <button 
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 ${
                    chartTimeframe === '4H' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
                  data-testid="button-timeframe-4H"
                  onClick={() => setChartTimeframe('4H')}
                >
                  4H
                </button>
                <button 
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 ${
                    chartTimeframe === '1D' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
                  data-testid="button-timeframe-1D"
                  onClick={() => setChartTimeframe('1D')}
                >
                  1D
                </button>
              </div>
            </div>
            <div className="h-64 bg-muted rounded-lg p-4">
              <canvas 
                ref={(canvas) => {
                  if (canvas) {
                    // 김치프리미엄 차트 그리기
                    const ctx = canvas.getContext('2d');
                    const chartData = getChartData();
                    if (ctx && chartData.length > 0) {
                      const dpr = window.devicePixelRatio || 1;
                      const w = canvas.clientWidth || 300;
                      const h = canvas.clientHeight || 200;
                      
                      canvas.width = w * dpr;
                      canvas.height = h * dpr;
                      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                      
                      // 배경 클리어
                      ctx.fillStyle = '#1e293b';
                      ctx.fillRect(0, 0, w, h);
                      
                      if (chartData.length > 1) {
                        const min = Math.min(...chartData.map(p => p.v));
                        const max = Math.max(...chartData.map(p => p.v));
                        const span = Math.max(0.01, max - min);

                        // 여백 설정 (좌측 y축 라벨 공간 확보)
                        const leftPad = 44;
                        const rightPad = 8;
                        const topPad = 8;
                        const bottomPad = 12;
                        const plotW = Math.max(1, w - leftPad - rightPad);
                        const plotH = Math.max(1, h - topPad - bottomPad);

                        // 그리드 + y축 라벨
                        ctx.strokeStyle = '#374151';
                        ctx.lineWidth = 1;
                        ctx.fillStyle = '#9fb0c9';
                        ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
                        ctx.textAlign = 'right';
                        ctx.textBaseline = 'middle';

                        const gridCount = 5;
                        for (let i = 0; i <= gridCount; i++) {
                          const ratio = i / gridCount; // 0(bottom) → 1(top)
                          const y = topPad + plotH * (1 - ratio);
                          // 라인
                          ctx.beginPath();
                          ctx.moveTo(leftPad, y);
                          ctx.lineTo(w - rightPad, y);
                          ctx.stroke();
                          // 라벨 값 (min → max 선형)
                          const labelVal = min + span * ratio;
                          ctx.fillText(`${labelVal.toFixed(2)}%`, leftPad - 6, y);
                        }

                        // 데이터 라인 그리기
                        ctx.beginPath();
                        ctx.strokeStyle = '#10b981';
                        ctx.lineWidth = 2;

                        const t0 = chartData[0].t;
                        const t1 = chartData[chartData.length - 1].t;
                        const tSpan = Math.max(1, t1 - t0);
                        chartData.forEach((point, index) => {
                          const x = leftPad + (plotW * (point.t - t0)) / tSpan;
                          const y = topPad + plotH * (1 - ((point.v - min) / span));
                          if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                        });
                        ctx.stroke();

                        // 현재 값 포인트
                        const lastPoint = chartData[chartData.length - 1];
                        const lastX = leftPad + plotW;
                        const lastY = topPad + plotH * (1 - ((lastPoint.v - min) / span));
                        ctx.beginPath();
                        ctx.fillStyle = '#10b981';
                        ctx.arc(lastX - 5, lastY, 4, 0, 2 * Math.PI);
                        ctx.fill();
                      }
                    }
                  }
                }}
                className="w-full h-full rounded"
                style={{backgroundColor: '#1e293b'}}
                key={`chart-${chartTimeframe}-${getChartData().length}`}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">평균 프리미엄</p>
                <p className="font-semibold text-primary" data-testid="text-avg-premium">
                  {(() => {
                    const data = getChartData();
                    return data.length > 0 ? (data.reduce((sum, p) => sum + p.v, 0) / data.length).toFixed(2) : '0.00';
                  })()}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">최고 프리미엄</p>
                <p className="font-semibold text-green-500" data-testid="text-max-premium">
                  {(() => {
                    const data = getChartData();
                    return data.length > 0 ? Math.max(...data.map(p => p.v)).toFixed(2) : '0.00';
                  })()}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">최저 프리미엄</p>
                <p className="font-semibold text-red-500" data-testid="text-min-premium">
                  {(() => {
                    const data = getChartData();
                    return data.length > 0 ? Math.min(...data.map(p => p.v)).toFixed(2) : '0.00';
                  })()}%
                </p>
              </div>
            </div>
          </div>
          </section>
        </div>
      </div>

      <div className="toast-wrap" id="toasts"></div>
      
      {/* 새 전략 생성 모달 */}
      {showCreateModal && (
        <div
          role="dialog"
          id="radix-:r0:"
          aria-describedby="radix-:r2:"
          aria-labelledby="radix-:r1:"
          data-state="open"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 shadow-lg rounded-lg"
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '500px',
            backgroundColor: '#0f1729',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            pointerEvents: 'auto',
            color: '#e2e8f0'
          }}
          data-testid="dialog-create-strategy"
          tabIndex={-1}
        >
          {/* 모달 헤더 */}
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h2
              id="radix-:r1:"
              className="text-lg font-semibold leading-none tracking-tight"
            >
              {editingStrategyId ? '전략 수정' : '새 자동매매 전략 생성'}
            </h2>
            <p
              id="radix-:r2:"
              className="text-sm text-muted-foreground"
            >
              {editingStrategyId ? '기존 자동매매 전략을 수정합니다.' : '새로운 자동매매 전략을 설정하고 생성합니다.'}
            </p>
          </div>

          {/* 폼 */}
          <form 
            className="space-y-4" 
            style={{color: '#e2e8f0'}}
            onSubmit={async (e) => {
              e.preventDefault();
              
              if (editingStrategyId) {
                // 기존 전략 수정
                setStrategies(prev => prev.map(strategy => 
                  strategy.id === editingStrategyId 
                    ? {
                        ...strategy,
                        name: newStrategy.name,
                        crypto: newStrategy.crypto,
                        entryCondition: newStrategy.entryCondition,
                        takeProfitCondition: newStrategy.takeProfitCondition,
                        investmentAmount: newStrategy.investmentAmount,
                        leverage: newStrategy.leverage,
                        riskLevel: newStrategy.riskLevel,
                        isActive: newStrategy.activateImmediately
                      }
                    : strategy
                ));
                
                // DB 저장 시도
                try {
                  const normalizedInvestment = (() => {
                    const n = Number(newStrategy.investmentAmount);
                    return Number.isFinite(n) && n >= 0.001 ? n.toFixed(3) : '0.003';
                  })();
                  const payload = {
                    name: newStrategy.name,
                    strategyType: 'positive_kimchi',
                    entryRate: newStrategy.entryCondition,
                    exitRate: newStrategy.takeProfitCondition,
                    toleranceRate: newStrategy.tolerance || "0.01",
                    leverage: parseInt(newStrategy.leverage) || 3,
                    // 서버에는 투자수량(BTC) 저장
                    investmentAmount: normalizedInvestment,
                    symbol: newStrategy.crypto || 'BTC',
                    isActive: newStrategy.activateImmediately,
                    isAutoTrading: newStrategy.activateImmediately,
                    tolerance: newStrategy.tolerance || "0.01"
                  };
                  
                  console.log('🔍 전략 수정 payload:', payload);
                  
                  // 세션 기반: 서버에서 세션 사용자로 처리 (무파라미터 라우트 미구현이면 기존 경로 유지)
                  await fetchJson(`/api/trading-strategies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    // 저장 요청은 취소되지 않도록 보장
                    nonCancelable: true as any
                  });
                  
                  toast({
                    title: '전략 수정 완료',
                    description: `${newStrategy.name} 전략이 업데이트되었습니다.`,
                  });
                  loadStrategiesFromDB();
                } catch (error) {
                  console.error('전략 상태 변경 실패:', error);
                  // 서버 상태와 동기화
                  loadStrategiesFromDB();
                  toast({ title: '상태 변경 실패', description: '서버 저장에 실패했습니다.', variant: 'destructive' });
                }
                
                setEditingStrategyId(null);
              } else {
                // 새 전략 생성
                const newId = `strategy-${Date.now()}`;
                const newStrategyData = {
                  id: newId,
                  name: newStrategy.name,
                  crypto: newStrategy.crypto,
                  entryCondition: newStrategy.entryCondition,
                  takeProfitCondition: newStrategy.takeProfitCondition,
                  investmentAmount: newStrategy.investmentAmount,
                  leverage: newStrategy.leverage,
                  riskLevel: newStrategy.riskLevel,
                  isActive: newStrategy.activateImmediately,
                  profitRate: '+0.00',
                  executionCount: 0
                };
                
                setStrategies(prev => [...prev, newStrategyData]);
                
                // DB 저장 시도
                try {
                  const normalizedInvestment = (() => {
                    const n = Number(newStrategy.investmentAmount);
                    return Number.isFinite(n) && n >= 0.001 ? n.toFixed(3) : '0.003';
                  })();
                  const payload = {
                    name: newStrategy.name || '새 전략',
                    strategyType: 'positive_kimchi',
                    entryRate: newStrategy.entryCondition,
                    exitRate: newStrategy.takeProfitCondition,
                    toleranceRate: newStrategy.tolerance || "0.01",
                    leverage: parseInt(newStrategy.leverage) || 3,
                    // 서버는 투자수량(BTC)을 그대로 저장
                    investmentAmount: normalizedInvestment,
                    symbol: newStrategy.crypto || 'BTC',
                    isActive: newStrategy.activateImmediately,
                    isAutoTrading: newStrategy.activateImmediately,
                    tolerance: newStrategy.tolerance || "0.01"
                  };
                  
                  console.log('🔍 전략 생성 payload:', payload);
                  console.log('🔍 newStrategy 상태:', {
                    investmentAmount: newStrategy.investmentAmount,
                    baseAmount: newStrategy.baseAmount,
                    leverage: newStrategy.leverage
                  });
                  
                  const result = await fetchJson(`/api/trading-strategies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    nonCancelable: true as any
                  });
                  
                  console.log('✅ 전략 생성 성공:', result);
                  toast({ title: '전략 생성 완료', description: '새 전략이 성공적으로 생성되었습니다.' });
                  // DB에서 최신 데이터 다시 로드
                  loadStrategiesFromDB({ force: true });
                } catch (error: any) {
                  console.error('❌ 전략 생성 실패:', error);
                  toast({ title: '전략 생성 실패', description: `서버 저장 실패: ${error.message}`, variant: 'destructive' });
                }
              }
              
              // 모달 닫기 및 폼 초기화
              setShowCreateModal(false);
              setNewStrategy({
                name: '',
                crypto: '',
                entryCondition: '3.0',
                takeProfitCondition: '2.0',
                baseAmount: '500000',
                investmentAmount: '0.001',
                leverage: '3',
                tolerance: TRADING_CONSTANTS.DEFAULT_TOLERANCE,
                riskLevel: 'moderate',
                activateImmediately: false
              });
            }}
          >
            {/* 전략 이름 */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor=":rt:-form-item"
              >
                전략 이름
              </label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                style={{
                  backgroundColor: '#0b1220',
                  border: '1px solid #1e293b',
                  color: '#dbe6ff',
                  borderRadius: '10px'
                }}
                name="name"
                placeholder="전략 이름을 입력하세요"
                data-testid="input-strategy-name"
                id=":rt:-form-item"
                aria-describedby=":rt:-form-item-description"
                aria-invalid="false"
                value={newStrategy.name}
                onChange={(e) => setNewStrategy(prev => ({...prev, name: e.target.value}))}
              />
            </div>

            {/* 코인 선택 */}
            <div className="space-y-2 relative">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor=":ru:-form-item"
              >
                코인
              </label>
              <button
                type="button"
                role="combobox"
                aria-controls="radix-:rv:"
                aria-expanded="false"
                aria-autocomplete="none"
                dir="ltr"
                data-state="closed"
                data-placeholder=""
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                style={{
                  backgroundColor: '#0b1220',
                  border: '1px solid #1e293b',
                  color: '#dbe6ff',
                  borderRadius: '10px'
                }}
                data-testid="select-crypto"
                id=":ru:-form-item"
                aria-describedby=":ru:-form-item-description"
                aria-invalid="false"
                onClick={() => {
                  const dropdown = document.getElementById('crypto-dropdown');
                  if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                  }
                }}
              >
                <span style={{pointerEvents: 'none'}}>
                  {newStrategy.crypto ? `${newStrategy.crypto} - ${newStrategy.crypto === 'BTC' ? 'Bitcoin' : newStrategy.crypto === 'ETH' ? 'Ethereum' : 'Cardano'}` : '코인을 선택하세요'}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-chevron-down h-4 w-4 opacity-50"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
              {/* 코인 선택 드롭다운 */}
              <div 
                className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg" 
                style={{
                  display: 'none',
                  zIndex: 1001,
                  backgroundColor: '#1e293b',
                  border: '1px solid #374151'
                }} 
                id="crypto-dropdown"
              >
                <div className="p-2 hover:bg-slate-700 cursor-pointer rounded-t-lg" onClick={() => {setNewStrategy(prev => ({...prev, crypto: 'BTC'})); document.getElementById('crypto-dropdown')?.style.setProperty('display', 'none');}}>
                  <div className="text-white font-medium">BTC - Bitcoin</div>
                </div>
                <div className="p-2 hover:bg-slate-700 cursor-pointer" onClick={() => {setNewStrategy(prev => ({...prev, crypto: 'ETH'})); document.getElementById('crypto-dropdown')?.style.setProperty('display', 'none');}}>
                  <div className="text-white font-medium">ETH - Ethereum</div>
                </div>
                <div className="p-2 hover:bg-slate-700 cursor-pointer rounded-b-lg" onClick={() => {setNewStrategy(prev => ({...prev, crypto: 'ADA'})); document.getElementById('crypto-dropdown')?.style.setProperty('display', 'none');}}>
                  <div className="text-white font-medium">ADA - Cardano</div>
                </div>
              </div>
            </div>

            {/* 진입/익절 조건 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor=":r10:-form-item"
                >
                  진입 조건 (%) - 정확한 일치
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  name="entryCondition"
                  placeholder="3.0"
                  data-testid="input-entry-condition"
                  id=":r10:-form-item"
                  aria-describedby=":r10:-form-item-description"
                  aria-invalid="false"
                  value={newStrategy.entryCondition}
                  onChange={(e) => setNewStrategy(prev => ({...prev, entryCondition: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor=":r11:-form-item"
                >
                  익절 조건 (%) - 정확한 일치
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  name="takeProfitCondition"
                  placeholder="2.0"
                  data-testid="input-take-profit"
                  id=":r11:-form-item"
                  aria-describedby=":r11:-form-item-description"
                  aria-invalid="false"
                  value={newStrategy.takeProfitCondition}
                  onChange={(e) => setNewStrategy(prev => ({...prev, takeProfitCondition: e.target.value}))}
                />
              </div>
            </div>

            {/* 기본투자금액과 허용오차 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor=":r12a:-form-item"
                >
                  기본 투자 금액 (원)
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  style={{
                    backgroundColor: '#0b1220',
                    border: '1px solid #1e293b',
                    color: '#dbe6ff',
                    borderRadius: '10px'
                  }}
                  name="baseAmount"
                  placeholder="500000"
                  data-testid="input-base-amount"
                  id=":r12a:-form-item"
                  key={`base-amount-${newStrategy.baseAmount}`}
                  value={newStrategy.baseAmount}
                  onChange={(e) => {
                    const baseAmount = parseFloat(e.target.value) || 500000;
                    const leverage = parseFloat(newStrategy.leverage) || 3;
                    const btcPrice = 156000000;
                    const calculatedBTC = (baseAmount / leverage / btcPrice).toFixed(3);
                    
                    setNewStrategy(prev => ({
                      ...prev, 
                      baseAmount: e.target.value,
                      investmentAmount: calculatedBTC,
                      tolerance: prev.tolerance
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="tolerance-input"
                >
                  허용오차 (%) - 정확한 일치 범위 설정
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  style={{
                    backgroundColor: '#0b1220',
                    border: '1px solid #1e293b',
                    color: '#dbe6ff',
                    borderRadius: '10px'
                  }}
                  name="tolerance"
                  type="number"
                  step={TRADING_CONSTANTS.TOLERANCE_STEP}
                  min={TRADING_CONSTANTS.MIN_TOLERANCE}
                  max={TRADING_CONSTANTS.MAX_TOLERANCE}
                  placeholder={TRADING_CONSTANTS.DEFAULT_TOLERANCE}
                  data-testid="input-tolerance"
                  id="tolerance-input"
                  value={newStrategy.tolerance}
                  onChange={(e) => setNewStrategy(prev => ({...prev, tolerance: e.target.value}))}
                />
                <p className="text-xs text-muted-foreground">
                  예: 3.0% ± {TRADING_CONSTANTS.DEFAULT_TOLERANCE}% → 2.999% ~ 3.001% 범위에서만 정확한 매매 (기본값: {TRADING_CONSTANTS.DEFAULT_TOLERANCE}%)
                </p>
              </div>
            </div>

            {/* 레버리지와 투자수량 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor=":r12b:-form-item"
                >
                  레버리지 (배)
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  style={{
                    backgroundColor: '#0b1220',
                    border: '1px solid #1e293b',
                    color: '#dbe6ff',
                    borderRadius: '10px'
                  }}
                  name="leverage"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="3"
                  data-testid="input-leverage"
                  id=":r12b:-form-item"
                  value={newStrategy.leverage}
                  onChange={(e) => {
                    const leverage = parseFloat(e.target.value) || 3;
                    const baseAmount = parseFloat(newStrategy.baseAmount) || 500000;
                    const btcPrice = 156000000; // 대략적인 BTC 가격
                    const calculatedBTC = (baseAmount / leverage / btcPrice).toFixed(3);
                    
                    setNewStrategy(prev => ({
                      ...prev, 
                      leverage: e.target.value,
                      investmentAmount: calculatedBTC
                    }));
                  }}
                />
                <div className="text-xs text-muted-foreground">
                  레버리지 {newStrategy.leverage}배 기준 권장 수량
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor=":r12:-form-item"
                >
                  투자수량 (BTC)
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  style={{
                    backgroundColor: '#0b1220',
                    border: '1px solid #1e293b',
                    color: '#dbe6ff',
                    borderRadius: '10px'
                  }}
                  name="investmentAmount"
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="10"
                  placeholder={TRADING_CONSTANTS.DEFAULT_TOLERANCE}
                  data-testid="input-investment-amount"
                  id=":r12:-form-item"
                  value={newStrategy.investmentAmount}
                  inputMode="decimal"
                  pattern="^\\d*(\\.\\d{0,3})?$"
                  onChange={(e) => {
                    // 문자열 그대로 유지하여 입력 중 포커스/커서 보존
                    setNewStrategy(prev => ({ ...prev, investmentAmount: e.target.value }));
                  }}
                />
                <div className="text-xs text-muted-foreground">
                  ₩{parseInt(newStrategy.baseAmount || '500000').toLocaleString()} ÷ {newStrategy.leverage}배 = {(parseInt(newStrategy.baseAmount || '500000') / parseInt(newStrategy.leverage || '3')).toLocaleString()}원 증거금
                </div>
              </div>
            </div>

            {/* 리스크 레벨 */}
            <div className="space-y-2 relative">
              <label 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" 
                htmlFor=":r13:-form-item"
              >
                리스크 레벨
              </label>
              <div className="text-sm text-muted-foreground mb-2">
                투자 금액 대비 위험도와 수익률을 결정합니다
              </div>
              <button 
                type="button" 
                role="combobox" 
                aria-controls="radix-:r14:" 
                aria-expanded="false" 
                aria-autocomplete="none" 
                dir="ltr" 
                data-state="closed" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1" 
                style={{
                  backgroundColor: '#0b1220',
                  border: '1px solid #1e293b',
                  color: '#dbe6ff',
                  borderRadius: '10px'
                }}
                data-testid="select-risk-level" 
                id=":r13:-form-item"
                onClick={() => {
                  const dropdown = document.getElementById('risk-dropdown');
                  if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                  }
                }}
              >
                <span style={{pointerEvents: 'none'}}>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {newStrategy.riskLevel === 'conservative' ? '보수적' : 
                       newStrategy.riskLevel === 'moderate' ? '중간' : 
                       newStrategy.riskLevel === 'aggressive' ? '공격적' : '중간'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {newStrategy.riskLevel === 'conservative' ? '안전한 투자, 낮은 수익률' : 
                       newStrategy.riskLevel === 'moderate' ? '균형잡힌 투자, 적당한 수익률' : 
                       newStrategy.riskLevel === 'aggressive' ? '고위험 투자, 높은 수익률 기대' : '균형잡힌 투자, 적당한 수익률'}
                    </span>
                  </div>
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 opacity-50" aria-hidden="true">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
              
              {/* 리스크 레벨 드롭다운 */}
              <div 
                className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg" 
                style={{
                  display: 'none',
                  zIndex: 1001,
                  backgroundColor: '#1e293b',
                  border: '1px solid #374151'
                }} 
                id="risk-dropdown"
              >
                <div className="p-3 hover:bg-slate-700 cursor-pointer rounded-t-lg" onClick={() => {setNewStrategy(prev => ({...prev, riskLevel: 'conservative'})); document.getElementById('risk-dropdown')?.style.setProperty('display', 'none');}}>
                  <div className="text-white font-medium">보수적</div>
                  <div className="text-slate-400 text-xs">안전한 투자, 낮은 수익률</div>
                </div>
                <div className="p-3 hover:bg-slate-700 cursor-pointer bg-slate-700" onClick={() => {setNewStrategy(prev => ({...prev, riskLevel: 'moderate'})); document.getElementById('risk-dropdown')?.style.setProperty('display', 'none');}}>
                  <div className="text-white font-medium flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    중간
                  </div>
                  <div className="text-slate-400 text-xs">균형잡힌 투자, 적당한 수익률</div>
                </div>
                <div className="p-3 hover:bg-slate-700 cursor-pointer rounded-b-lg" onClick={() => {setNewStrategy(prev => ({...prev, riskLevel: 'aggressive'})); document.getElementById('risk-dropdown')?.style.setProperty('display', 'none');}}>
                  <div className="text-white font-medium">공격적</div>
                  <div className="text-slate-400 text-xs">고위험 투자, 높은 수익률 기대</div>
                </div>
              </div>
            </div>

            {/* 즉시 활성화 토글 */}
            <div className="space-y-2 flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <label 
                  className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base" 
                  htmlFor=":r15:-form-item"
                >
                  즉시 활성화
                </label>
                <div className="text-sm text-muted-foreground">
                  전략 생성 후 바로 자동매매를 시작합니다
                </div>
              </div>
              <button 
                type="button" 
                role="switch" 
                aria-checked={newStrategy.activateImmediately} 
                data-state={newStrategy.activateImmediately ? "checked" : "unchecked"} 
                value="on" 
                className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input" 
                data-testid="switch-activate-strategy" 
                id=":r15:-form-item" 
                onClick={() => setNewStrategy(prev => ({...prev, activateImmediately: !prev.activateImmediately}))}
              >
                <span 
                  data-state={newStrategy.activateImmediately ? "checked" : "unchecked"} 
                  className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                ></span>
              </button>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-2">
              <button 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" 
                type="submit" 
                data-testid="button-create-strategy"
              >
                {editingStrategyId ? '전략 수정' : '전략 생성'}
              </button>
              <button 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" 
                type="button" 
                data-testid="button-cancel-create" 
                onClick={() => setShowCreateModal(false)}
              >
                취소
              </button>
            </div>
          </form>

          {/* 닫기 버튼 */}
          <button 
            type="button" 
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" 
            onClick={() => setShowCreateModal(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-4 w-4">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
      )}
      
      {/* 모달 배경 오버레이 */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setShowCreateModal(false)}
        ></div>
      )}
    </>
  );
};

export default LegacyAutoTradingPage;
