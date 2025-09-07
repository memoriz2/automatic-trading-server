import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import './legacy-auto-trading.css';

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
  const { user } = useAuth();
  // userId 동적 결정: Auth → URL(?userId|uid) → localStorage(x-user-id) → 기본값('6')
  const initialUserId = (() => {
    try {
      const fromAuth = user?.id != null ? String(user.id) : undefined;
      const search = new URLSearchParams(window.location.search);
      const fromQuery = search.get('userId') || search.get('uid') || undefined;
      const fromStorage = localStorage.getItem('x-user-id') || undefined;
      return fromAuth || fromQuery || fromStorage || '6';
    } catch {
      return user?.id != null ? String(user.id) : '6';
    }
  })();
  const [effectiveUserId, setEffectiveUserId] = useState<string>(initialUserId);
  useEffect(() => {
    try {
      const search = new URLSearchParams(window.location.search);
      const fromAuth = user?.id != null ? String(user.id) : undefined;
      const fromQuery = search.get('userId') || search.get('uid') || undefined;
      const fromStorage = localStorage.getItem('x-user-id') || undefined;
      const id = fromAuth || fromQuery || fromStorage || effectiveUserId || '6';
      if (id !== effectiveUserId) setEffectiveUserId(id);
      localStorage.setItem('x-user-id', id);
    } catch {}
  }, [user?.id]);
  
  // 상태 관리 (useState)
  const [bands, setBands] = useState<Band[]>([]);
  const [sparkData, setSparkData] = useState<number[]>([]);
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
    const isApiTrading = url.startsWith('/api/trading');
    const fullUrl = isApiTrading ? url : `/api/kimpga${url}`;
    
    const token = sessionStorage.getItem('authToken');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-ID': String(effectiveUserId || ''),
      ...(opt as any)?.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const noCachePaths = ['/balance', '/metrics', '/current', '/status'];
    const isNoCacheTarget = noCachePaths.some(p => url.startsWith(p));
    const finalUrl = isNoCacheTarget ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}_=${Date.now()}` : fullUrl;

    const ctrl = new AbortController();
    abortersRef.current.push(ctrl);
    try {
      const r = await fetch(finalUrl, {
        ...opt,
        headers,
        cache: isNoCacheTarget ? 'no-store' : (opt as any)?.cache,
        signal: (opt as any)?.signal ?? ctrl.signal,
      });
      if (!r.ok) {
        const errorBody = await r.text();
        setErrCount(c => c + 1);
        console.error('API Error:', errorBody);
        throw new Error(`${finalUrl} ${r.status} ${errorBody}`);
      }
      setErrCount(0);
      return r.json();
    } catch (e: any) {
      if (e?.name === 'AbortError' || /aborted/i.test(String(e?.message))) {
        return;
      }
      throw e;
    } finally {
      abortersRef.current = abortersRef.current.filter(a => a !== ctrl);
    }
  }, [effectiveUserId]);

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
          const newData = [...prev, k.kimp];
          // 최대 180개 포인트 유지 (약 60초 분량)
          return newData.slice(-180);
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
  const updateUsedMarginFromStatus = useCallback((status: any) => {
    try {
      const usedUsdtEl = document.querySelector('#used-usdt');
      if (!usedUsdtEl) return;

      const bands = Array.isArray(status?.bands) ? status.bands : [];
      if (!bands.length) {
        usedUsdtEl.textContent = '-';
        return;
      }

      // 최신 바이낸스 선물가격 사용
      const binancePrice = isNum(kimp.binance_price) ? kimp.binance_price : NaN;
      if (!isNum(binancePrice) || binancePrice <= 0) {
        usedUsdtEl.textContent = '-';
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

      usedUsdtEl.textContent = totalUsedMargin > 0 ? totalUsedMargin.toFixed(2) : '-';
    } catch (error) {
      const usedUsdtEl = document.querySelector('#used-usdt');
      if (usedUsdtEl) usedUsdtEl.textContent = '-';
    }
  }, [kimp.binance_price]);

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

  const refreshServerBands = useCallback(async () => {
    try {
      const serverData = await fetchJson(`/api/trading-strategies/${effectiveUserId}`);
      setServerBands(serverData || []);
    } catch (e) {
      console.error('Failed to fetch server bands', e);
    }
  }, [fetchJson, effectiveUserId]);

  // ===== Toast 알림 시스템 =====
  const showToast = useCallback((title: string, message: string = '', isSuccess: boolean = true) => {
    const toastContainer = document.querySelector('#toasts');
    if (!toastContainer) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast ${isSuccess ? 'ok' : 'err'}`;
    toastEl.style.cssText = `
      position: fixed; right: 16px; bottom: 16px; 
      background: #0b1320; border: 1px solid #1e2a42; 
      padding: 10px 12px; border-radius: 12px; 
      box-shadow: 0 10px 30px rgba(0,0,0,.35); 
      max-width: 360px; z-index: 60; color: #e2e8f0;
      opacity: 1; transition: opacity 0.3s ease;
    `;
    
    toastEl.innerHTML = `
      <div style="font-weight: 800; margin-bottom: 4px">${title}</div>
      <div style="font-size: 12px; color: #9fb0c9">${message}</div>
    `;

    toastContainer.appendChild(toastEl);

    // 3.2초 후 자동 제거
    setTimeout(() => {
      toastEl.style.opacity = '0';
      setTimeout(() => {
        if (toastContainer.contains(toastEl)) {
          toastContainer.removeChild(toastEl);
        }
      }, 300);
    }, 3200);
  }, []);

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
      showToast('설정 저장 완료', '브라우저 로컬에 저장되었습니다.');
    } catch (e) {
      console.error(e);
      showToast('저장 실패', String(e), false);
    }
  }, [bands, showToast]);

  const handleLoadBands = useCallback(async () => {
    try {
      // 0) 세션(JWT) 기반 먼저 시도
      const token = localStorage.getItem('authToken');
      let primary: any[] | undefined;
      if (token) {
        try {
          primary = await fetchJson(`/api/trading-strategies`, { headers: { Authorization: `Bearer ${token}` } });
        } catch {}
      }
      // 1) 세션 결과가 없으면 현재 ID로 시도
      if (!Array.isArray(primary)) {
        primary = await fetchJson(`/api/trading-strategies/${effectiveUserId}`);
      }
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
        showToast('불러오기 완료', '세션 사용자 전략을 적용했습니다.');
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
          showToast('불러오기 완료', `DB 전략을 userId=${uid}에서 불러와 적용했습니다.`);
          return;
        }
      }
      // 3) 최종 폴백: 로컬 저장
      const raw = localStorage.getItem('kimp_cfg_bands_v2');
      if (raw) {
        const j = JSON.parse(raw);
        setBands(j.bands || []);
        showToast('서버 전략 없음', '로컬 저장본을 불러왔습니다.');
      } else {
        showToast('불러오기 실패', '서버/로컬에 저장된 전략이 없습니다.', false);
      }
    } catch (e) {
      console.error(e);
      showToast('불러오기 실패', String(e), false);
    }
  }, [effectiveUserId, fetchJson, showToast]);

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
      showToast('서버 등록 완료', `${band.name} 전략이 서버에 저장되었습니다.`);
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
      showToast('서버 등록 실패', String(e), false);
    } finally {
      setRegisteringIndex(null);
    }
  }, [bands, fetchJson, refreshServerBands, showToast, effectiveUserId]);

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
        showToast('등록 취소 완료', `${band.name || '-'} 전략이 서버에서 삭제되었습니다.`);
      } else {
        showToast('서버 기록 없음', '서버에 해당 전략 ID를 찾지 못했습니다. 로컬에서 제거합니다.', false);
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
      showToast('서버 등록 취소 실패', String(e), false);
    }
    finally {
      setUnregisteringIndex(null);
    }
  }, [bands, serverBands, fetchJson, refreshServerBands, tickHeavy, showToast]);

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
      showToast('청산 완료', `전략 #${id}가 삭제되었습니다.`);
    } catch (e) {
      console.error(`[레거시 클라이언트] 청산 요청 실패. 전략 ID: ${id}`, e);
      showToast('청산 실패', String(e), false);
    } finally {
      setBoardActingId(null);
      try { 
        console.log(`[레거시 클라이언트] 청산 프로세스 완료 후 데이터 새로고침 시도.`);
        tickHeavy(); 
      } catch {}
    }
  }, [removeBoardRowOptimistic, fetchJson, showToast, tickHeavy]);

  const handleBoardCancelWaiting = useCallback(async (id: string | number) => {
    try {
      setBoardActingId(id);
      await fetchJson(`/api/trading-strategies/${id}`, { method: 'DELETE' });
      removeBoardRowOptimistic(id);
      showToast('대기 취소', `전략 #${id}가 삭제되었습니다.`);
    } catch (e) {
      console.error(e);
      showToast('대기 취소 실패', String(e), false);
    } finally {
      setBoardActingId(null);
      try { tickHeavy(); } catch {}
    }
  }, [removeBoardRowOptimistic, fetchJson, showToast, tickHeavy]);
  
  const handleStart = useCallback(async () => {
    if (serverState.running || starting) {
      showToast('이미 실행 중', '자동매매가 실행 상태입니다.');
      return;
    }
    setStarting(true);
    try {
      await fetchJson(`/api/trading/start/${effectiveUserId}`, { method: 'POST', headers: { 'X-Trace-Id': `cli-${Date.now()}` } });
      showToast('전략 시작', '자동매매가 시작되었습니다.');
    } catch (e) {
      console.error(e);
      try {
        const stat = await fetchJson(`/api/trading/status/${effectiveUserId}`);
        if (stat?.isRunning) {
          showToast('이미 실행 중', '자동매매가 이미 실행 중입니다.');
        } else {
          showToast('시작 실패', String(e), false);
        }
      } catch {
        showToast('시작 실패', String(e), false);
      }
    } finally {
      tickHeavy();
      setStarting(false);
    }
  }, [fetchJson, tickHeavy, showToast, effectiveUserId, serverState.running, starting]);

  const handleStop = useCallback(async () => {
    try {
      await fetchJson(`/api/trading/stop/${effectiveUserId}`, { method: 'POST' });
      showToast('전략 중지', '자동매매가 중지되었습니다.');
      tickHeavy();
    } catch (e) {
      console.error(e);
      showToast('중지 실패', String(e), false);
    }
  }, [fetchJson, tickHeavy, showToast, effectiveUserId]);

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

  // ===== Lifecycle Hooks =====
  useEffect(() => {
    refreshServerBands();
  }, [refreshServerBands]);

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
    if (!c || sparkData.length === 0) return;

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

    if (sparkData.length === 0) return;

    // 최소/최대값 계산
    const min = Math.min(...sparkData);
    const max = Math.max(...sparkData);
    const span = Math.max(1e-9, max - min);

    // 최소/최대값 표시 업데이트
    const sparkMinEl = document.querySelector('#spark-min');
    const sparkMaxEl = document.querySelector('#spark-max');
    if (sparkMinEl) sparkMinEl.textContent = min.toFixed(2);
    if (sparkMaxEl) sparkMaxEl.textContent = max.toFixed(2);

    // 차트 그리기
    const pad = 6;
    ctx.beginPath();
    
    sparkData.forEach((value, index) => {
      const x = pad + (w - 2 * pad) * (index / (sparkData.length - 1));
      const y = h - pad - (h - 2 * pad) * ((value - min) / span);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7aa2ff';
    ctx.stroke();
  }, [sparkData]);

  useEffect(() => {
    drawSpark(); // sparkData가 변경될 때마다 차트를 다시 그립니다.
    window.addEventListener('resize', drawSpark);
    return () => window.removeEventListener('resize', drawSpark);
  }, [drawSpark]);

  
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
          <span id="arm-badge" className="chip" title="진입 정책"><i className={`dot ${serverState.running ? 'ok' : 'danger'}`}></i><span>조건 충족 시 자동 대기→진입</span></span>
          <span className="chip" title="수수료 기준"><i className="dot ok"></i>추정 비용 ≈ 0.18%p</span>
          <span id="net-badge" className="chip" title="네트워크 상태">
            <i className={`dot ${netOk ? 'ok' : (errCount > 0 ? 'warn' : 'danger')}`}></i>
            <span>{netMs != null ? `NET ${netMs}ms` : 'NET …'}</span>
          </span>

          <div className="grow"></div>
          <span id="kimp-brief" className="kimp-brief mono" aria-live="polite">
            {`김프 ${fx(kimp.kimp, 2)}% · 업비트 ${loc(kimp.upbit_price)} KRW · 바이낸스 ${fx(kimp.binance_price, 2)} USDT · 환율 ${fx(kimp.usdkrw, 2)}`}
          </span>
        </div>
      </header>
      <div className="wrap">
        <div className="grid">
          {/* 전략 설정: 멀티 밴드 */}
          <section className="card col-12">
            <h3>전략 설정 (멀티 밴드)</h3>
            <div className="row" style={{gap: '6px', marginBottom: '8px'}}>
              <button className="btn ghost" id="btn-add-band" onClick={() => handleAddBand()}>밴드 추가</button>
              <button className="btn ghost" id="btn-save" onClick={handleSaveBands}>설정 저장(로컬)</button>
              <button className="btn ghost" id="btn-load" onClick={handleLoadBands}>불러오기</button>
            </div>

            <div style={{marginTop: '12px', overflow: 'auto'}}>
              <table>
                <thead>
                  <tr>
                    <th style={{minWidth: '90px'}}>이름</th>
                    <th style={{minWidth: '120px'}}>진입 김프율(%)</th>
                    <th style={{minWidth: '120px'}}>청산 김프율(%)</th>
                    <th style={{minWidth: '120px'}}>허용오차(%)</th>
                    <th style={{minWidth: '120px'}}>레버리지</th>
                    <th style={{minWidth: '150px'}}>투자수량(BTC)</th>
                    <th style={{minWidth: '220px'}}>미리보기 (Upbit KRW / Binance USDT) 수수료 포함</th>
                    <th style={{minWidth: '130px'}}>상태</th>
                    <th style={{minWidth: '220px'}}>서버</th>
                    <th style={{minWidth: '80px'}}>삭제</th>
                  </tr>
                </thead>
                <tbody id="band-tbody" ref={bandTbodyRef}>
                  {renderBands()}
                </tbody>
              </table>
            </div>

            <div className="row" style={{marginTop: '12px'}}>
              <button className="btn" id="btn-start" onClick={handleStart} disabled={serverState.running}>▶ 전략 시작</button>
              <button className="btn secondary" id="btn-stop" onClick={handleStop} disabled={!serverState.running}>■ 전략 중지</button>
            </div>
            <p className="hint">※ 이 UI는 <b>강제 진입이 없습니다.</b> 각 밴드는 <b>entry_kimp±tolerance</b> 범위에 <b>도달하면 자동 진입</b>, 이후 <b>exit_kimp</b> 등 조건 충족 시 자동 청산됩니다.</p>
          </section>

          {/* 시장 스냅샷 */}
          <section className="card col-6">
            <h3>시장 스냅샷</h3>
            <div className="grid" style={{gap: '12px', gridTemplateColumns: 'repeat(12, 1fr)'}}>
              <div className="col-6">
                <div className="kv">
                  <b>김프</b><span><span id="kimp" className="mono" style={{fontWeight: 800}}>{fx(kimp.kimp, 2)}%</span> <span id="kimp-sign" className={`badge ${kimp.kimp < 0 ? 'bad' : 'good'}`}>{kimp.kimp < 0 ? '역프' : '정프'}</span></span>
                  <b>업비트</b><span className="mono" id="upbit_price">{loc(kimp.upbit_price)}</span>
                  <b>바이낸스</b><span className="mono" id="binance_price">{loc(kimp.binance_price)}</span>
                  <b>환율</b><span className="mono" id="usdkrw">{loc(kimp.usdkrw)}</span>
                  <b>Upbit KRW</b><span className="mono" id="bal-krw">{loc(balances.real.krw)}</span>
                  <b>Upbit BTC</b><span className="mono" id="bal-btc">{fx(balances.real.btc_upbit, 6)}</span>
                  <b>Binance USDT</b><span className="mono" id="bal-usdt">{loc(balances.real.usdt)}</span>
                  <b>진입 증거금(USDT)</b><span className="mono" id="used-usdt">{loc(serverState.used_balance_usdt)}</span>
                </div>
              </div>
              <div className="col-6">
                <div className="spark-wrap">
                  <canvas ref={sparkCanvasRef} id="spark" className="spark"></canvas>
                  <div className="spark-val mono">
                    <small>최근 60초 범위</small>
                    <div><span id="spark-min">-</span> ~ <span id="spark-max">-</span></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 성과 요약 */}
          <section className="card col-6">
            <h3>성과 요약</h3>
            <div className="grid" style={{gap: '12px', gridTemplateColumns: 'repeat(12, 1fr)'}}>
              <div className="col-6">
                <div className="kv">
                  <b>주문 합계(오늘)</b><span id="metric-total" className="mono">-</span>
                  <b>루프</b><span id="metric-loops" className="mono">{loc(metrics.loops)}</span>
                  <b>바이낸스 주문</b><span id="metric-bn" className="mono">{loc(metrics.binance_orders)}</span>
                  <b>업비트 주문</b><span id="metric-up" className="mono">{loc(metrics.upbit_orders)}</span>
                  <b>API 오류</b><span id="metric-errors" className="badge bad">{loc(metrics.errors)}</span>
                  <b>진입</b><span id="metric-entries" className="mono">-</span>
                  <b>청산</b><span id="metric-exits" className="mono">-</span>
                </div>
              </div>
              <div className="col-6">
                <div className="kv">
                  <b>실현 손익(누적)</b><span><span id="pnl-krw-sum" className="mono hl">0</span> KRW</span>
                  <b>Upbit 수수료(누적)</b><span id="fee-upbit-krw" className="mono">-</span>
                  <b>Binance 수수료(USDT)</b><span id="fee-binance-usdt" className="mono">-</span>
                  <b>Binance 수수료(KRW)</b><span id="fee-binance-krw" className="mono">-</span>
                </div>
              </div>
            </div>
          </section>

          {/* 밴드 보드 */}
          <section className="card col-12">
            <div className="row" style={{justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0}}>밴드 보드</h3>
              <div className="row">
                <button className="btn ghost" id="btn-refresh-bands" onClick={refreshServerBands}>서버 동기화</button>
              </div>
            </div>

            <div style={{marginTop: '10px', overflow: 'auto', maxHeight: '420px'}}>
              <table id="pos-table">
                <thead>
                  <tr>
                    <th>id</th>
                    <th>상태</th>
                    <th>엔트리 김프</th>
                    <th>허용오차</th>
                    <th>Exit 김프</th>
                    <th>Upbit 수량(BTC)</th>
                    <th>PnL(KRW)</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody id="pos-tbody">
                  {Array.isArray(serverStatusBands) && serverStatusBands.length > 0 ? (
                    serverStatusBands.map((b: any) => {
                      const cls = b?.state === 'entered' ? 'good' : (b?.state === 'waiting' ? 'warn' : '');
                      return (
                        <tr key={String(b?.id ?? Math.random())}>
                          <td className="mono">{b?.id ?? '-'}</td>
                          <td><span className={`badge ${cls}`}>{String(b?.state ?? '-')}</span></td>
                          <td className="mono">{isNum(b?.entry_kimp) ? fx(b.entry_kimp, 2) + '%' : '-'}</td>
                          <td className="mono">{isNum(b?.tolerance) ? '±' + fx(b.tolerance, 2) : '-'}</td>
                          <td className="mono">{isNum(b?.exit_kimp) ? fx(b.exit_kimp, 2) + '%' : '-'}</td>
                          <td className="mono">{isNum(b?.filled_qty) ? Number(b.filled_qty).toFixed(3) : '0.000'}</td>
                          <td className="mono">{isNum(b?.pnl_krw) ? Number(b.pnl_krw).toLocaleString() : '0'}</td>
                          <td>
                            <div className="row">
                              <button className="btn secondary" onClick={() => handleBoardClose(b?.id)} disabled={boardActingId === b?.id}>{boardActingId === b?.id ? '처리 중…' : '청산'}</button>
                              <button className="btn secondary" onClick={() => handleBoardCancelWaiting(b?.id)} disabled={boardActingId === b?.id}>{boardActingId === b?.id ? '처리 중…' : '대기 취소'}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={8} className="muted">밴드 없음</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <h4 style={{margin: '14px 0 8px 0', color: '#cbd5e1'}}>최근 로그 (상위 300)</h4>
            <div id="log" className="log" aria-live="polite">{logs}</div>
          </section>
        </div>
      </div>

      <div className="toast-wrap" id="toasts"></div>
    </>
  );
};

export default LegacyAutoTradingPage;
