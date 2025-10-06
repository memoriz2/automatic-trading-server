import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/use-websocket';
import { useLegacyTradingState } from '@/hooks/useLegacyTradingState';
import { useLegacyTradingHandlers } from '@/hooks/useLegacyTradingHandlers';
import { useTradingDataOperations } from '@/hooks/useTradingDataOperations';
import { useTradingUIHelpers } from '@/hooks/useTradingUIHelpers';
import { useTradingMarginHelpers } from '@/hooks/useTradingMarginHelpers';
import { useKimchiChartData } from '@/hooks/useKimchiChartData';
import { LiveTradingSystem } from '@/components/live-trading-system';
import { StrategyList } from '@/components/trading/StrategyList';
import { KimchiChart } from '@/components/trading/KimchiChart';
import { TradingHeader } from '@/components/trading/TradingHeader';
import { SessionInfoPanel } from '@/components/trading/SessionInfoPanel';
import { MarketSnapshot } from '@/components/trading/MarketSnapshot';
import { useApiConnection } from '@/hooks/useApiConnection';
import { isNum, fx, loc, formatBTCUpbit, formatPercent, floorQty, formatKRW, formatUSD, formatCompact } from '@/utils/trading/formatters';
import { normalizeAmountBtc } from '@/utils/trading/calculations';
import { getInitialStrategy, STRATEGY_DEFAULTS, getSafeLeverage } from '@/config/strategy-defaults';
import { LEVERAGE_CONFIG, parseLeverage, calculateInvestmentWithLeverage } from '@/utils/trading/leverage';
import { INFLIGHT_API, API_CACHE } from '@/utils/trading/cache';
import './legacy-auto-trading.css';
import { useToast } from '@/hooks/use-toast';
import { apiFetchJson } from '@/lib/queryClient';
import { markStrategyAsDeleted } from '@/utils/emergency-strategy-restore';
import { logger } from '@/utils/logger';
import { userIdManager } from '@/utils/user-id-manager';
import { strategyBackupManager, useStrategyBackup } from '@/utils/strategy-backup';
import { Badge } from '@/components/ui/badge';
import { DailyStatsPanel } from '@/components/trading/DailyStatsPanel';

interface Band {
  name?: string;
  target_kimp?: number | string;
  exit_kimp?: number | string;
  tolerance?: number | string;
  leverage?: number | string;
  amount_btc?: number | string;
  serverId?: string | number;
}

// 유틸리티 함수들은 별도 파일로 분리됨

const LegacyAutoTradingPage = () => {
  // 유틸리티 함수들
  const mapStrategyToBand = (strategy: any) => ({
    ...strategy,
    band: strategy.band || 'default'
  });

  // 상수들
  const TRADING_CONSTANTS = {
    DEFAULT_TOLERANCE: '0.1'
  };

  // 레거시 트레이딩 상태 관리 (모든 useState들이 여기 포함됨)
  const {
    // Auth 관련
    user, isAuthenticated, isLoading, checkSession,
    // WebSocket 관련
    isConnected, wsConnecting, connectionAttempts, lastHeartbeat, subscribe,
    // 상태들
    sessionInfo, setSessionInfo, showSessionInfo, setShowSessionInfo,
    currentPositions, setCurrentPositions, kimp, setKimp,
    logs, setLogs, balances, setBalances, metrics, setMetrics, bands, setBands,
    serverBands, setServerBands, serverStatusBands, setServerStatusBands,
    registeringIndex, setRegisteringIndex, unregisteringIndex, setUnregisteringIndex,
    starting, setStarting, boardActingId, setBoardActingId, strategies, setStrategies,
    realStrategies, setRealStrategies, dailyStats, setDailyStats, serverState, setServerState,
    netMs, setNetMs, netOk, setNetOk, errCount, setErrCount, tradingMode, setTradingMode,
    apiConnections, setApiConnections, ws, setWs, refreshTrigger, setRefreshTrigger,
    showCreateModal, setShowCreateModal, newStrategy, setNewStrategy,
    editingStrategyId, setEditingStrategyId, loadingState, setLoadingState,
    // 유틸리티
    effectiveUserId, toast, fetchPositions,
    // Trading mode related
    isAdmin, canUseMock, loadRealStrategies, isLoadingStrategies, strategiesError, lastLoadTime
  } = useLegacyTradingState();

  // 김치 프리미엄 차트 데이터 관리
  const { chartData, isLoading: chartLoading, addDataPoint } = useKimchiChartData('BTC');

  // 사용자 ID 통일 및 데이터 마이그레이션
  useEffect(() => {
    if (user?.id) {
      const authUserId = String(user.id);
      const stableUserId = userIdManager.getStableUserId();
      
      // 인증된 사용자 ID와 안정 사용자 ID가 다르면 데이터 마이그레이션
      if (authUserId !== stableUserId) {
        // 사용자 ID 통일 및 데이터 마이그레이션
        
        // 안정 사용자 ID의 데이터를 인증 사용자 ID로 마이그레이션
        const stableStrategies = localStorage.getItem(`mock-strategies-${stableUserId}`);
        if (stableStrategies && stableStrategies !== '[]') {
          const authStrategies = localStorage.getItem(`mock-strategies-${authUserId}`) || '[]';
          const stableParsed = JSON.parse(stableStrategies);
          const authParsed = JSON.parse(authStrategies);
          
          // 중복 제거하며 병합
          const merged = [...authParsed];
          stableParsed.forEach((strategy: any) => {
            if (!merged.find(s => s.id === strategy.id)) {
              merged.push(strategy);
            }
          });
          
          localStorage.setItem(`mock-strategies-${authUserId}`, JSON.stringify(merged));
          // 전략 데이터 마이그레이션 완료
        }
        
        // 안정 사용자 ID 업데이트
        userIdManager.setUserId(authUserId);
      }
    }
  }, [user?.id]);

  // localStorage 정리 (차트 데이터 마이그레이션)
  useEffect(() => {
    // 기존 localStorage의 차트 데이터 삭제 (이제 DB 사용)
    Object.keys(localStorage)
      .filter(k => k.includes('kimchi-chart-data'))
      .forEach(k => {
        localStorage.removeItem(k);
      });
  }, []);

  // 🔍 컴포넌트 마운트 시 사라진 전략 데이터 자동 복구
  useEffect(() => {
    const recoverStrategies = async () => {
      try {
        const recovered: any[] = []; // recoverLostData 제거
        
        if (recovered.length > 0) {
          // 사라진 전략 데이터 발견
          
          // 현재 전략 목록과 병합
          const currentKey = `mock-strategies-${effectiveUserId}`;
          const currentData = localStorage.getItem(currentKey);
          const currentStrategies = currentData ? JSON.parse(currentData) : [];
          
          // 중복 제거하며 병합
          const mergedStrategies = [...currentStrategies];
          for (const strategy of recovered) {
            if (!mergedStrategies.some(existing => existing.id === strategy.id)) {
              mergedStrategies.push(strategy);
            }
          }
          
          // 복구된 데이터 저장
          localStorage.setItem(currentKey, JSON.stringify(mergedStrategies));
          
          // 전략 데이터 복구 완료
          
          // UI 알림 (토스트 메시지)
          if (typeof toast === 'function') {
            toast({
              title: '전략 데이터 복구 완료',
              description: `${recovered.length}개의 전략을 복구했습니다.`,
              variant: 'default'
            });
          }
          
          // 복구 후 즉시 백업 생성
          setTimeout(() => {
            const backupKey = strategyBackupManager.createBackup();
            if (backupKey) {
              // 복구 후 백업 생성 완료
            }
          }, 1000);
        }
      } catch (error) {
        console.error('❌ 전략 데이터 복구 실패:', error);
        
        // 복구 실패 시 긴급 복구 시도
        try {
          // 긴급 복구 시도
          const restored = strategyBackupManager.emergencyRestore();
          if (restored) {
            toast({
              title: '긴급 복구 성공',
              description: '백업에서 전략 데이터를 복구했습니다.',
              variant: 'default'
            });
          }
        } catch (emergencyError) {
          console.error('❌ 긴급 복구도 실패:', emergencyError);
          toast({
            title: '데이터 복구 실패',
            description: '전략 데이터를 복구할 수 없습니다. 새로 시작해주세요.',
            variant: 'destructive'
          });
        }
      }
    };
    
    // 컴포넌트 마운트 후 1초 뒤에 복구 시도 (초기화 완료 후)
    const timer = setTimeout(recoverStrategies, 1000);
    return () => clearTimeout(timer);
  }, [effectiveUserId, toast]);

  // 타입 정의 (hook에서 이미 상태는 관리됨)
  type SparkPoint = { t: number; v: number };
  
  // 🛡️ 전략 데이터 백업 시스템
  const { 
    isAutoBackupEnabled, 
    createBackup, 
    getAllBackups, 
    restoreFromBackup, 
    emergencyRestore,
    exportBackup,
    importBackup 
  } = useStrategyBackup();

  // 실시간 거래 모드: 로딩 상태 단순화
  
  // 실시간 데이터 유효성 검증 (단순화)
  const isRealTimeDataValid = (kimchiData: any) => {
    return !!(
      kimchiData?.upbit_price && 
      kimchiData?.binance_price && 
      kimchiData?.usdkrw &&
      kimchiData.upbit_price > 0 &&
      kimchiData.binance_price > 0
    );
  };


  // 실시간 데이터 유효성을 단순하게 판단
  const hasValidRealTimeData = isRealTimeDataValid(kimp);
  const dataAge = kimp?.timestamp ? Date.now() - new Date(kimp.timestamp).getTime() : 0;




  // 로컬스토리지 변경 감지 (디버깅용)
  useEffect(() => {
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;
    
    localStorage.setItem = function(key, value) {
      // localStorage.setItem 호출
      return originalSetItem.call(this, key, value);
    };
    
    localStorage.removeItem = function(key) {
      // localStorage.removeItem 호출
      return originalRemoveItem.call(this, key);
    };
    
    localStorage.clear = function() {
      // localStorage.clear() 호출
      return originalClear.call(this);
    };
    
    return () => {
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
      localStorage.clear = originalClear;
    };
  }, []);

  // 컴포넌트 마운트 시 거래 기록 및 전략 복원
  useEffect(() => {
    // 컴포넌트 마운트 - 데이터 복원 시작
    
    // 거래 기록 복원 (즉시 + 1초 후 한번 더)
    const restoredTrades = restoreTradesFromPositions();
    
    // 1초 후 한번 더 시도 (컴포넌트가 완전히 로드된 후)
    const retryTimeout = setTimeout(() => {
      // 거래 기록 복원 재시도
      restoreTradesFromPositions();
    }, 1000);
    
    // 전략 목록 복원
    const restoredStrategies = loadStrategiesFromLocal();
    if (restoredStrategies.length > 0) {
      setStrategies(restoredStrategies);
      // 전략 목록 복원 완료
    }
    
    // 데이터 복원 완료
    
    return () => clearTimeout(retryTimeout);
  }, []); // 마운트 시 한 번만 실행
  
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

  // 차트 관련 상태는 KimchiChart 컴포넌트로 이동됨


  // 투자수량 변경 시 기본투자금액 자동 계산 (비동기 처리로 깜박임 방지)
  useEffect(() => {
    if (!newStrategy) return; // null 체크 추가

    const timeoutId = setTimeout(() => {
      const raw = newStrategy.investmentAmount;
      if (raw == null || raw === '') return;

      const n = Number(raw);
      if (!Number.isFinite(n)) return;

      // 기본투자금액만 업데이트 (투자수량은 건드리지 않음)
      const btcAmount = n || parseFloat(STRATEGY_DEFAULTS.INVESTMENT_AMOUNT);
      const leverage = getSafeLeverage(newStrategy.leverage);
      const btcPrice = Number(kimp?.upbit_price) || 0;
      const calculatedBaseAmount = Math.round(btcAmount * leverage * btcPrice);

      if (String(calculatedBaseAmount) !== newStrategy.baseAmount) {
        setNewStrategy(prev => ({ ...prev, baseAmount: String(calculatedBaseAmount) }));
      }
    }, 800); // 800ms 디바운스로 깜박임 방지

    return () => clearTimeout(timeoutId);
  }, [newStrategy?.investmentAmount, newStrategy?.leverage, kimp?.upbit_price]);

  // 전략 목록 상태는 위에서 이미 선언됨 (line 118)

  
  // 실제 DB 기반 통계는 DailyStatsPanel 컴포넌트로 이동됨

  // 거래 모드는 이미 hook에서 관리됨


  // 실시간 거래 모드: 전략 변경 시 자동 DB 동기화
  useEffect(() => {
    if (effectiveUserId && strategies.length > 0) {
      // 전략 상태 변경 감지
      // 실시간 거래에서는 DB가 단일 진실 소스이므로 별도 저장 불필요
    }
  }, [strategies, effectiveUserId]);

  // 전략 복원 완료 추적
  const hasRestoredRef = useRef(false);

  // 실시간 거래 모드: DB가 단일 진실 소스이므로 복원 로직 불필요

  // API 연결 상태 관리 (커스텀 훅)
  const { apiConnected, isConnecting } = useApiConnection({ tradingMode });

  // 실시간 거래 모드: 데이터 유효성만 체크
  useEffect(() => {
    const isDataValid = isRealTimeDataValid(kimp);
    setLoadingState(isDataValid ? 'stable' : 'loading');
  }, [kimp]);

  // 실제 DB 기반 통계는 useRealTimeStats 훅으로 이동됨

  // 중복 로직들이 커스텀 훅으로 이동됨

  // ===== Memoized maps for O(1) lookups =====

  // DOM 요소 참조 (useRef)
  const bandTbodyRef = useRef<HTMLTableSectionElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // --- REFS ---
  const bandRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const abortersRef = useRef<Array<AbortController>>([]);
  const hasLoadedStrategiesRef = useRef<boolean>(false);
  const hasScheduledInitialLoadRef = useRef<boolean>(false);

  const cancelInflight = useCallback(() => {
    try { 
      abortersRef.current.forEach((a) => { 
        try { 
          if (a && !a.signal.aborted) {
            a.abort(); 
          }
        } catch (e) {
          console.warn('AbortController 정리 중 오류:', e);
        }
      }); 
    } catch (e) {
      console.warn('cancelInflight 오류:', e);
    } finally { 
      abortersRef.current = []; 
    }
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
    const normalized = url;
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
        // API 응답 상태 로그 제거
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

  // Trading handlers
  const {
    handleAddBand,
    handleBandChange,
    handleSaveBands,
    handleLoadBands,
    handleDeleteBand,
    handleRegisterBand,
    handleUnregisterBandAt,
    handleStart,
    handleStop,
    handleCheckSession
  } = useLegacyTradingHandlers(
    setBands,
    toast,
    bands,
    user,
    effectiveUserId,
    fetchJson,
    setRegisteringIndex,
    setUnregisteringIndex,
    setStarting,
    serverState
  );

  // Data operations hook
  const {
    restoreTradesFromPositions,
    saveStrategiesToLocal,
    loadStrategiesFromLocal
  } = useTradingDataOperations(
    setStrategies,
    strategies,
    effectiveUserId,
    currentPositions
  );

  // UI helpers hook
  const {
    configuredByName,
    statusById,
    statusByName,
    createCircleHTML,
    updatePreviewForRow
  } = useTradingUIHelpers(
    serverBands,
    serverStatusBands
  );

  // Margin helpers hook
  const {
    updateUsedMarginFromMock,
    updateUsedMarginFromStatus,
    removeBoardRowOptimistic
  } = useTradingMarginHelpers(
    setBalances,
    realStrategies
  );

  const refreshServerBands = useCallback(async (options: { force?: boolean } = {}) => {
    if (!options.force && hasLoadedStrategiesRef.current) return;
    try {
      const serverData = await fetchJson(`/api/trading-strategies/${effectiveUserId}`);
      if (serverData == null) {
        // 서버 밴드 조회가 취소/중단됨
        return;
      }
      setServerBands(serverData || []);
      // NOTE: 게이트는 실제 전략 목록 로드에서만 설정합니다
    } catch (e: any) {
      // AbortError는 정상적인 취소이므로 오류 로그 생략
      if (e?.name === 'AbortError' || /aborted/i.test(String(e?.message))) {
        // 서버 밴드 조회가 취소됨
      } else {
        console.error('❌ 서버 밴드 조회 실패:', e);
      }
    }
  }, [fetchJson, effectiveUserId]);

  // ===== 미리보기 원형 차트 =====


  // ===== Data Fetching & Polling Functions =====
  const tickLight = useCallback(async () => {
    try {
      const k = await fetchJson('/api/kimpga/current');
      if (!k) return; // Abort 등으로 undefined일 때 조용히 무시
      setKimp(k);
      if (isNum(k.kimp) && k.upbit_price && k.binance_price && k.usdkrw) {
        // 차트 데이터 추가 (DB 저장 포함)
        addDataPoint(
          Number(k.kimp),
          Number(k.upbit_price),
          Number(k.binance_price),
          Number(k.usdkrw)
        );
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
    } catch (e: any) { 
      // AbortError는 정상적인 취소이므로 오류 로그 생략
      if (e?.name !== 'AbortError' && !/aborted/i.test(String(e?.message))) {
        console.error('❌ tickLight 오류:', e); 
      }
    }
  }, [fetchJson, updatePreviewForRow]);

  // ===== 진입 증거금 계산 =====

  const tickHeavy = useCallback(async () => {
    try {
      // KST 자정부터 경과 분 계산 → 오늘 창으로 집계 통일
      const now = new Date();
      const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const kstMidnightUtc = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate(), -9, 0, 0);
      const minutesKstToday = Math.max(1, Math.floor((now.getTime() - kstMidnightUtc) / 60000));

      const [bal, met, kgaStat, trStat] = await Promise.all([
        fetchJson('/api/v2/balance'), // 새로운 잔고 API 사용
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
          const elPnl = document.getElementById('pnl-krw-sum'); if (elPnl) elPnl.textContent = Number(pnl.profit_krw_cum ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 });
          const elFeeUp = document.getElementById('fee-upbit-krw'); if (elFeeUp) elFeeUp.textContent = Number(pnl.fees_upbit_krw_cum ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 });
          const elFeeBnU = document.getElementById('fee-binance-usdt'); if (elFeeBnU) elFeeBnU.textContent = Math.round(Number(pnl.fees_binance_usdt_cum ?? 0)).toLocaleString('en-US');
          const elFeeBnK = document.getElementById('fee-binance-krw'); if (elFeeBnK) elFeeBnK.textContent = Number(pnl.fees_binance_krw_cum ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 });
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
    } catch (e: any) { 
      // AbortError는 정상적인 취소이므로 오류 로그 생략
      if (e?.name !== 'AbortError' && !/aborted/i.test(String(e?.message))) {
        console.error('❌ tickHeavy 오류:', e); 
      }
    }
  }, [fetchJson, updateUsedMarginFromStatus, effectiveUserId]);


  // ===== Component Event Handlers =====
  // All handler functions moved to useLegacyTradingHandlers hook









  // ===== Render Functions =====


  // ===== 활성 전략들의 포지션 상태 확인 (중복 진입 방지) =====
  const checkActiveStrategiesPositions = useCallback(async (strategies: any[]) => {
    try {
      const positionsResponse = await fetch('/api/positions', { credentials: 'include' });

      if (positionsResponse.ok) {
        const positions = await positionsResponse.json();
        setCurrentPositions(positions);

        const activeStrategies = strategies.filter(s => s.isActive);

        for (const strategy of activeStrategies) {
          const activePosition = positions.find((p: any) =>
            p.status === 'open' &&
            p.strategyId === parseInt(strategy.id) &&
            p.symbol === (strategy.crypto || 'BTC')
          );

          if (activePosition) {
            // 활성 포지션이 있으면 전략 비활성화 (청산 전까지 재진입 방지)
            if (activePosition.status === 'open') {
              strategy.isActive = false;
            }
          }
        }
      }
    } catch (error) {
      // 에러 발생 시 조용히 처리 (로그 스팸 방지)
    }
  }, [setCurrentPositions]);

  // 간단한 전략 로드 함수
  const loadStrategiesFromDB = useCallback(async (opts: { force?: boolean; userId?: string | number } = {}) => {
    const targetUserId = opts.userId || user?.id;
    logger.debug('📋 [전략로드] loadStrategiesFromDB 시작:', { 
      force: opts.force, 
      hasLoaded: hasLoadedStrategiesRef.current,
      userId: targetUserId,
      providedUserId: opts.userId 
    });
    
    if (!opts.force && hasLoadedStrategiesRef.current) {
      // 이미 로드됨 - 건너뜀
      return [];
    }
    
    // 로딩 상태는 useTradingMode 훅에서 관리
    try {
      if (!targetUserId) {
        logger.warn('❌ [전략로드] 사용자 ID 없음');
        return [];
      }
      
      const userId = String(targetUserId);
      // API 호출
      
      let dbStrategies: any;
      try {
        dbStrategies = await fetchJson(`/api/trading-strategies/${userId}`);
        // DB 응답 받음
        
        if (Array.isArray(dbStrategies) && dbStrategies.length > 0) {
          // 전략 상세 확인됨
        }
      } catch (fetchError) {
        console.error('❌ [전략로드] fetchJson 에러:', fetchError);
        throw fetchError;
      }
      
      if (Array.isArray(dbStrategies)) {
        const formattedStrategies = dbStrategies.map((s: any) => {
          // 안전한 숫자 변환 함수
          const safeNumber = (value: any, defaultValue: number) => {
            const num = parseFloat(value);
            return isNaN(num) ? defaultValue : num;
          };
          
          const safeString = (value: any, defaultValue: string) => {
            // null이나 undefined인 경우에만 기본값 사용
            if (value === null || value === undefined) return defaultValue;
            // 0도 유효한 값으로 처리
            const num = parseFloat(value);
            return isNaN(num) ? defaultValue : String(num);
          };
          
          const entryValue = safeString(s.entry_rate, '0');
          const exitValue = safeString(s.exit_rate, '0');

          return {
            id: String(s.id),
            name: s.name || '이름 없음',
            crypto: s.symbol || 'BTC',
            entryCondition: entryValue,
            takeProfitCondition: exitValue,
            investmentAmount: safeString(s.investment_amount, '0.001'),
            leverage: safeString(s.leverage, '5'),
            tolerance: safeString(s.tolerance_rate || s.tolerance, '0.05'),
            riskLevel: 'moderate',
            isActive: Boolean(s.is_active),
            profitRate: s.total_profit > 0 ? `+${s.total_profit}` : String(s.total_profit || '+0.00'),
            executionCount: s.total_trades || 0,
            created_at: s.created_at
          };
        });
        
        hasLoadedStrategiesRef.current = true;
        // 포맷팅 완료
        // 전략 목록 확인됨
        return formattedStrategies;
      }
      // DB 응답이 배열이 아님
      return [];
    } catch (error) {
      console.error('❌ [전략로드] 전략 로드 실패:', error);
      return [];
    } finally {
      // 로딩 상태는 useTradingMode 훅에서 관리
    }
  }, [fetchJson, user?.id]);

  // ===== Lifecycle Hooks =====
  useEffect(() => {
    hasLoadedStrategiesRef.current = false; // 초기 진입 시 한번 허용
    refreshServerBands();
    
    // 페이지 로드 시 즉시 세션 확인 및 전략 로드 시도
    if (!hasScheduledInitialLoadRef.current) {
      hasScheduledInitialLoadRef.current = true;
      setTimeout(async () => {
        try {
          // 페이지 로드 - 세션 직접 확인 시작
          const sessionData = await apiFetchJson('/api/auth/me');
          
          if (sessionData.id) {
            // 실시간 거래 모드: DB에서 전략 로드 (useTradingMode 훅 사용)
            loadRealStrategies().catch(error => {
              console.error('❌ [전략로드] loadRealStrategies 실패:', error);
            });
          }
        } catch (error) {
          // 페이지 로드 - 세션 확인 실패
        }
      }, 500); // 0.5초 후 시도
    }
  }, [refreshServerBands, loadStrategiesFromDB]);

  // 사용자 정보나 effectiveUserId가 변경될 때 전략 목록 다시 로드
  useEffect(() => {
    // 사용자 정보 변경 감지
    
    // 세션에서 사용자 정보가 있을 때만 전략 로드
    if (user?.id) {
      // 실시간 거래 모드: DB에서 전략 로드 (useTradingMode 훅 사용)
      loadRealStrategies().catch(error => {
        console.error('❌ [전략로드] 사용자 변경 시 loadRealStrategies 실패:', error);
      });
      // 실시간 거래 모드 - DB에서 전략 로드
    } else {
      // 세션에 사용자 정보가 없음
    }
  }, [user?.id, loadRealStrategies]);

  // 웹소켓 메시지 핸들러 등록
  useEffect(() => {
    const unsubscribeKimchi = subscribe('kimchi-premium', (data: any[]) => {
      // 김치프리미엄 데이터 수신
      // 실시간 김치프리미엄 데이터를 kimp 상태에 반영
      if (data && data.length > 0) {
        const btcData = data.find(item => item.symbol === 'BTC');
        if (btcData) {
          const newKimpData = {
            kimp: btcData.premiumRate,
            upbit_price: btcData.upbitPrice,
            binance_price: btcData.binanceFuturesPrice,
            usdkrw: btcData.usdKrwRate || btcData.exchangeRate,
            timestamp: new Date().toISOString()
          };
          
          setKimp(newKimpData);
          
          // 웹소켓 데이터도 차트에 추가 (DB 저장 포함)
          if (isNum(btcData.premiumRate) && btcData.upbitPrice && btcData.binanceFuturesPrice && btcData.usdKrwRate) {
            addDataPoint(
              Number(btcData.premiumRate),
              Number(btcData.upbitPrice),
              Number(btcData.binanceFuturesPrice),
              Number(btcData.usdKrwRate)
            );
          }
        }
      }
    });

    // 폴백 메커니즘: 웹소켓 데이터가 없을 때 REST API로 가격 데이터 가져오기
    const fallbackDataFetch = async () => {
      try {
        const response = await fetch('/api/kimpga/current');
        if (response.ok) {
          const data = await response.json();
          if (data && (data.upbit_price > 0 || data.binance_price > 0)) {
            setKimp(data);
          }
        }
      } catch (error) {
        console.warn('폴백 가격 데이터 로드 실패:', error);
      }
    };

    // 웹소켓 연결 실패 시 폴백 활성화
    const fallbackInterval = setInterval(() => {
      // 웹소켓이 연결되지 않았거나 최근 데이터가 없으면 폴백 실행
      const dataAge = kimp?.timestamp ? Date.now() - new Date(kimp.timestamp).getTime() : Infinity;
      if (!isConnected || dataAge > 30000) { // 30초 이상 오래된 데이터
        fallbackDataFetch();
      }
    }, 10000); // 10초마다 체크

    return () => {
      if (unsubscribeKimchi) unsubscribeKimchi();
      clearInterval(fallbackInterval);
    };
  }, [subscribe, isConnected, kimp?.timestamp]);

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    const startPolling = () => {
      stopPolling();
      intervals.push(setInterval(tickLight, 3000));  // 김치 데이터 3초
      intervals.push(setInterval(tickHeavy, 10000)); // 잔고 데이터 10초 (원래대로)
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
    return () => { 
      document.removeEventListener('visibilitychange', onVis); 
      stopPolling(); 
      
      // 페이지 종료 시 차트 데이터 저장
      try {
        const currentSparkData = JSON.parse(localStorage.getItem(`kimchi-chart-data-${effectiveUserId}`) || '[]');
        if (currentSparkData.length > 0) {
          // 페이지 종료 시 차트 데이터 유지
        }
      } catch (error) {
        console.error('페이지 종료 시 차트 데이터 확인 실패:', error);
      }
    };
  }, [tickLight, tickHeavy, cancelInflight, effectiveUserId]); // sparkData 제거 - 무한 렌더링 방지


  // 차트 그리기 로직은 KimchiChart 컴포넌트로 이동됨

  // 페이지 상태 확인 완료

  // 로딩 중이거나 인증되지 않은 경우 처리
  if (isLoading) {
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
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <p>로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  // 정상 렌더링 시작

  // 실시간 데이터 상태 (자동매매 섹션에서 사용) - 임시 비활성화
  const needsLoading = false; // 임시로 로딩 비활성화
  // 연결 상태 보정: API 훅 플래그 + 잔고 값 존재 여부로 연동 판단
  // balances 구조: { real: { krw, btc_upbit, usdt }, connected: { upbit, binance } }
  const realBalances = balances?.real || {};
  const connectedStatus = balances?.connected || {};
  
  const upbitLinked = connectedStatus.upbit === true || (
    realBalances.krw != null || realBalances.btc_upbit != null
  );
  const binanceLinked = connectedStatus.binance === true || (
    realBalances.usdt != null
  );
  
  // apiConnected가 undefined인 경우 false로 처리
  const apiConnectedSafe = apiConnected === true;
  const liveConnected = apiConnectedSafe || upbitLinked || binanceLinked;
  
  // 연결 상태 판정 완료
  const realTimeDataStatus = needsLoading ? (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {!apiConnected ? '거래소 API 연결 중' : '실시간 데이터 연결 중'}
      </h3>
      <div className="space-y-1 text-slate-400 text-sm">
        <p>🔄 WebSocket: {isConnected ? '✅ 연결됨' : wsConnecting ? '🔄 연결 중...' : '❌ 연결 끊김'}</p>
        <p>🔌 API 연결: {apiConnected ? '✅ 연결됨' : isConnecting ? '🔄 연결 중...' : '❌ 연결 끊김'}</p>
        <p>📡 연결 시도: {connectionAttempts}회</p>
        {lastHeartbeat && (
          <p>💓 마지막 Heartbeat: {Math.round((Date.now() - (lastHeartbeat?.getTime() || 0)) / 1000)}초 전</p>
        )}
        {dataAge < Infinity && (
          <p>📊 데이터 나이: {Math.round(dataAge / 1000)}초</p>
        )}
      </div>
      <div className="mt-4 p-3 bg-slate-800 rounded-lg">
        <p className="text-sm text-yellow-400">
          🚨 실거래 모드에서는 안정적인 연결이 필요합니다
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {!apiConnected ? '업비트 및 바이낸스 API 연결 중...' : '실시간 가격 데이터 수신 중...'}
        </p>
      </div>
    </div>
  ) : null;
  
  return (
    <>
      <TradingHeader
        serverState={serverState}
        netOk={netOk}
        errCount={errCount}
        netMs={netMs}
        onCheckSession={handleCheckSession}
        kimp={kimp}
      />
      <div className="wrap">
        <div className="grid">
          <SessionInfoPanel 
            showSessionInfo={showSessionInfo} 
            sessionInfo={sessionInfo} 
          />
          {/* 거래 모드별 다른 UI */}
          {false ? ( // Live 모드에서는 Mock 컴포넌트 사용 안함
            /* Mock 모드: 전략 관리 + 차트 */
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{gridColumn: 'span 12'}}>
            <div className="lg:col-span-2 bg-card rounded-lg p-6 border border-border">
                <StrategyList
                strategies={strategies} // Mock 모드: 로컬 전략
                isLoadingStrategies={isLoadingStrategies}
                onStrategyUpdate={(updatedStrategies) => {
                  setStrategies(updatedStrategies);
                  // 전략 업데이트 시 자동 저장
                  saveStrategiesToLocal(updatedStrategies);
                }}
                onStrategyEdit={(strategy) => {
                          setNewStrategy({
                            name: strategy.name,
                            crypto: strategy.crypto,
                            entryCondition: strategy.entryCondition,
                            takeProfitCondition: strategy.takeProfitCondition,
                            baseAmount: (strategy as any).baseAmount || STRATEGY_DEFAULTS.BASE_AMOUNT,
                            investmentAmount: strategy.investmentAmount?.toString() || STRATEGY_DEFAULTS.INVESTMENT_AMOUNT,
                            leverage: strategy.leverage,
                            tolerance: strategy.tolerance || STRATEGY_DEFAULTS.TOLERANCE,
                            riskLevel: strategy.riskLevel,
                            activateImmediately: strategy.isActive
                          });
                          setEditingStrategyId(strategy.id);
                          setShowCreateModal(true);
                        }}
                onCreateNew={() => {
                  setEditingStrategyId(null);
                  setNewStrategy(getInitialStrategy());
                  setShowCreateModal(true);
                }}
                fetchJson={fetchJson}
                loadStrategiesFromDB={loadStrategiesFromDB}
                user={user || undefined}
                effectiveUserId={effectiveUserId}
                isAuthenticated={isAuthenticated}
                checkSession={checkSession}
                isLoading={isLoading}
              />
            </div>
            {/* 일일 거래 통계 */}
            <div className="mt-4 pt-4 border-t border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-slate-400 text-sm">오늘의 거래 통계</h4>
                <div className="flex gap-1">
                  
                </div>
              </div>
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
                  <p className="text-lg font-bold text-yellow-400">
                    ₩{(() => {
                      // 실시간 수수료 계산 및 표시
                      const [previousFee, setPreviousFee] = React.useState(dailyStats.totalFees);
                      const [animationClass, setAnimationClass] = React.useState('');
                      
                      React.useEffect(() => {
                        if (previousFee !== dailyStats.totalFees && previousFee > 0) {
                          if (dailyStats.totalFees > previousFee) {
                            setAnimationClass('text-red-400 transition-colors duration-300');
                          } else if (dailyStats.totalFees < previousFee) {
                            setAnimationClass('text-blue-400 transition-colors duration-300');
                          }
                          
                          setTimeout(() => {
                            setAnimationClass('text-yellow-400 transition-colors duration-300');
                          }, 300);
                          
                          setPreviousFee(dailyStats.totalFees);
                        }
                      }, [dailyStats.totalFees, previousFee]);
                      
                      return (
                        <span className={animationClass || 'text-yellow-400'}>
                          {dailyStats.totalFees.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                        </span>
                      );
                    })()}
                  </p>
                  <p className="text-xs text-slate-400">총 수수료 (실시간)</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${dailyStats.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dailyStats.realizedPnl >= 0 ? '+' : ''}₩{dailyStats.realizedPnl.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-slate-400">실현 손익</p>
                </div>
              </div>
            </div>
          </section>
          ) : (
            /* 실거래 모드: DB 조회 기반 전략 표시 */
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{gridColumn: 'span 12'}}>
              <div className="lg:col-span-2 bg-card rounded-lg p-6 border border-border">
                {/* 전략 로딩 에러 표시 */}
                {strategiesError && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400">
                      <span>⚠️</span>
                      <span className="font-medium">전략 로딩 실패</span>
                    </div>
                    <p className="text-sm text-red-300 mt-1">{strategiesError}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button 
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                        onClick={() => window.location.reload()}
                      >
                        🔄 페이지 새로고침
                      </button>
                      {lastLoadTime && (
                        <span className="text-xs text-red-400">
                          마지막 성공: {lastLoadTime.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <StrategyList
                strategies={realStrategies} // 실거래 모드: DB 조회 전략
                isLoadingStrategies={isLoadingStrategies}
                onStrategyUpdate={setRealStrategies} // 실거래에서는 realStrategies 업데이트
                onStrategyEdit={(strategy: any) => {
                  
                  setNewStrategy({
                    name: strategy.name || '',
                    crypto: strategy.crypto || '',
                    entryCondition: String(strategy.entryCondition || 0),
                    takeProfitCondition: String(strategy.takeProfitCondition || 0),
                    baseAmount: String(strategy.baseAmount || 0),
                    investmentAmount: String(strategy.investmentAmount || 0),
                    leverage: String(strategy.leverage || 5),
                    tolerance: String(strategy.tolerance || 0.05),
                    riskLevel: strategy.riskLevel || 'moderate',
                    activateImmediately: strategy.isActive || false
                  });
                  setEditingStrategyId(strategy.id);
                  setShowCreateModal(true);
                }} // 실거래에서도 편집 가능
                onCreateNew={() => {
                  setEditingStrategyId(null);
                  setNewStrategy(getInitialStrategy());
                  setShowCreateModal(true);
                }} // 실거래에서도 생성 가능
                fetchJson={fetchJson}
                loadStrategiesFromDB={loadStrategiesFromDB}
                user={user || undefined}
                effectiveUserId={effectiveUserId}
                isAuthenticated={isAuthenticated}
                checkSession={checkSession}
                isLoading={isLoading}
              />
              </div>

              <div className="space-y-6">
                <DailyStatsPanel 
                  userId={user?.id} 
                  title="오늘의 실거래 통계 (DB 기반)"
                />
              </div>
            </section>
          )}

          {/* 거래 시스템 섹션 */}
          <section className="card col-12">
            
            {realTimeDataStatus ? realTimeDataStatus : (
            (liveConnected || window.location.hostname === 'localhost') ? (
              /* 실시간 거래 시스템 */
              <LiveTradingSystem 
                strategies={realStrategies} // DB 기반 전략
                currentKimchiData={{
                  kimp: Number(kimp?.kimp) || 0.5,
                  upbit_price: Number(kimp?.upbit_price) || 0,
                  binance_price: Number(kimp?.binance_price) || 0,
                  usdkrw: Number(kimp?.usdkrw) || 0,
                  isRealTimeValid: hasValidRealTimeData,
                  dataAge: Math.round(dataAge / 1000)
                }}
                userId={String(user.id)}
                onDailyStatsUpdate={setDailyStats}
                isLiveMode={true}
                liveBalances={balances}
                onStrategyStatsUpdate={(stats) => {
                  setRealStrategies(prev => prev.map(s => {
                    const st = stats[s.id];
                    return st ? { ...s, executionCount: st.executionCount, profitRate: Number(st.profitRate.toFixed(2)) } : s;
                  }));
                }}
              />
            ) : (
              /* API 연결 대기 중 */
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-white mb-2">실거래 API 연결 중</h3>
                <p className="text-slate-400">업비트 및 바이낸스 API에 연결하고 있습니다...</p>
              </div>
            )
          )}
          </section>

          <MarketSnapshot 
            kimp={kimp} 
            balances={balances} 
            isLoadingBalances={isConnecting} 
            positions={currentPositions}
            strategies={strategies}
          />

          {/* 김치프리미엄 차트 */}
          <KimchiChart sparkData={chartData} />
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
                // 기존 전략 수정 (실시간 거래 모드)
                try {
                  const normalizedInvestment = (() => {
                    const n = Number(newStrategy?.investmentAmount || 0);
                    return Number.isFinite(n) && n >= 0.001 ? n.toFixed(3) : STRATEGY_DEFAULTS.INVESTMENT_AMOUNT;
                  })();
                  const payload = {
                    name: newStrategy.name,
                    strategyType: 'positive_kimchi',
                    entryRate: newStrategy.entryCondition,
                    exitRate: newStrategy.takeProfitCondition,
                    toleranceRate: newStrategy.tolerance || STRATEGY_DEFAULTS.TOLERANCE,
                    leverage: parseInt(newStrategy.leverage) || 3,
                    investmentAmount: normalizedInvestment,
                    symbol: newStrategy.crypto || 'BTC',
                    isActive: newStrategy.activateImmediately,
                    isAutoTrading: newStrategy.activateImmediately,
                    tolerance: newStrategy.tolerance || STRATEGY_DEFAULTS.TOLERANCE
                  };

                  await fetchJson(`/api/trading-strategies/${editingStrategyId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    nonCancelable: true as any
                  });
                  
                  toast({
                    title: '전략 수정 완료! 🎉',
                    description: `${newStrategy.name} 전략이 업데이트되었습니다.`,
                  });

                  // 전략 목록 새로고침 (비동기, 로딩 스피너 포함)
                  await loadRealStrategies();

                  // 추가로 로컬 함수로도 확인 (이중 안전장치)
                  try {
                    const newStrategies = await loadStrategiesFromDB({ force: true });
                  } catch (localError) {
                    console.warn('⚠️ [전략수정] 로컬 함수 새로고침 실패:', localError);
                  }
                } catch (error) {
                  console.error('전략 수정 실패:', error);
                  toast({ 
                    title: '전략 수정 실패', 
                    description: '서버 저장에 실패했습니다.', 
                    variant: 'destructive' 
                  });
                }
                
                setEditingStrategyId(null);
              } else {
                // 새 전략 생성
                const newId = `strategy-${Date.now()}`;

                // 전략 이름 자동 생성 (중복 방지)
                const existingNames = strategies.map(s => s.name);
                let newName = newStrategy.name || `전략 #${newId.slice(-4)}`;
                let counter = 1;
                while (existingNames.includes(newName)) {
                  newName = `${newName.split(' ')[0]} #${newId.slice(-4)}-${counter}`;
                  counter++;
                }

                const newStrategyData = {
                  id: newId,
                  name: newName,
                  crypto: newStrategy.crypto,
                  entryCondition: newStrategy.entryCondition,
                  takeProfitCondition: newStrategy.takeProfitCondition,
                  investmentAmount: newStrategy.investmentAmount,
                  leverage: newStrategy.leverage,
                  tolerance: newStrategy.tolerance || STRATEGY_DEFAULTS.TOLERANCE,
                  riskLevel: newStrategy.riskLevel,
                  isActive: newStrategy.activateImmediately,
                  profitRate: '+0.00',
                  executionCount: 0
                };
                
                // 실시간 거래 모드: DB 저장
                try {
                  const normalizedInvestment = (() => {
                    const n = Number(newStrategy?.investmentAmount || 0);
                    return Number.isFinite(n) && n >= 0.001 ? n.toFixed(3) : STRATEGY_DEFAULTS.INVESTMENT_AMOUNT;
                  })();
                  const payload = {
                    name: newName, // 자동 생성된 이름 사용
                    strategyType: 'positive_kimchi',
                    entryRate: newStrategy.entryCondition,
                    exitRate: newStrategy.takeProfitCondition,
                    toleranceRate: newStrategy.tolerance || STRATEGY_DEFAULTS.TOLERANCE,
                    leverage: parseInt(newStrategy.leverage) || 3,
                    investmentAmount: normalizedInvestment,
                    symbol: newStrategy.crypto || 'BTC',
                    isActive: newStrategy.activateImmediately,
                    isAutoTrading: newStrategy.activateImmediately,
                    tolerance: newStrategy.tolerance || STRATEGY_DEFAULTS.TOLERANCE
                  };

                  const result = await fetchJson(`/api/trading-strategies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    nonCancelable: true as any
                  });

                  toast({ title: '전략 생성 완료', description: '새 전략이 성공적으로 생성되었습니다.' });

                  // 전략 목록 새로고침 (비동기, 로딩 스피너 포함)
                  await loadRealStrategies();

                  // 추가로 로컬 함수로도 확인 (이중 안전장치)
                  try {
                    const newStrategies = await loadStrategiesFromDB({ force: true });
                  } catch (localError) {
                    console.warn('⚠️ [전략생성] 로컬 함수 새로고침 실패:', localError);
                  }
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
                entryCondition: '0',      // 0으로 초기화 (사용자 직접 입력)
                takeProfitCondition: '0', // 0으로 초기화 (사용자 직접 입력)
                baseAmount: '0',          // 0으로 초기화 (사용자 직접 입력)
                investmentAmount: '0',    // 0으로 초기화 (사용자 직접 입력)
                leverage: '1',            // 1배 레버리지 기본값
                tolerance: '0.05',        // 허용오차 0.05% 기본값 (수정 가능)
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
                  onChange={(e) => {
                    setNewStrategy(prev => ({...prev, entryCondition: e.target.value}));
                  }}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor=":r11:-form-item"
                >
                  익절 조건 (%) - 이상이면 청산
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
                  onChange={(e) => {
                    setNewStrategy(prev => ({...prev, takeProfitCondition: e.target.value}));
                  }}
                />
              </div>
            </div>

            {/* 허용오차와 레버리지 */}
            <div className="grid grid-cols-2 gap-4">
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
                  step="0.01"
                  min="0.01"
                  max="10.0"
                  placeholder="0.05"
                  data-testid="input-tolerance"
                  id="tolerance-input"
                  value={newStrategy.tolerance}
                  onChange={(e) => {
                    setNewStrategy(prev => ({...prev, tolerance: e.target.value}));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  기본값: 0.05% (수정 가능) - 예: 3.0% ± 0.05% → 2.95% ~ 3.05% 범위에서 매매
                </p>
              </div>
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
                  min={LEVERAGE_CONFIG.MIN}
                  max={LEVERAGE_CONFIG.MAX}
                  placeholder={String(LEVERAGE_CONFIG.DEFAULT)}
                  data-testid="input-leverage"
                  id=":r12b:-form-item"
                  value={newStrategy.leverage}
                  onChange={(e) => {
                    const leverage = parseLeverage(e.target.value);
                    const baseAmount = parseFloat(newStrategy.baseAmount) || 0;
                    const btcPrice = Number(kimp?.upbit_price) || 0;
                    
                    // BTC 가격이 없으면 계산하지 않음
                    const calculatedBTC = btcPrice > 0 && baseAmount > 0 
                      ? calculateInvestmentWithLeverage(baseAmount, leverage, btcPrice)
                      : 0;
                    
                    setNewStrategy(prev => ({
                      ...prev, 
                      leverage: e.target.value,
                      investmentAmount: calculatedBTC > 0 ? String(calculatedBTC) : '0.000'
                    }));
                  }}
                />
                <div className="text-xs text-muted-foreground">
                  레버리지 {newStrategy.leverage}배 기준 권장 수량
                </div>
              </div>
            </div>

            {/* BTC 수량과 기본투자금액 */}
            <div className="grid grid-cols-2 gap-4">
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
                  step="0.00000001"
                  min="0.00000001"
                  max="10"
                  placeholder={TRADING_CONSTANTS.DEFAULT_TOLERANCE}
                  data-testid="input-investment-amount"
                  id=":r12:-form-item"
                  value={newStrategy?.investmentAmount || ''}
                  inputMode="decimal"
                  pattern="^\\d*(\\.\\d{0,8})?$"
                  onChange={(e) => {
                    // 입력 중에는 원본값 유지 (소수점 입력 허용)
                    setNewStrategy(prev => ({ ...prev, investmentAmount: e.target.value }));
                  }}
                  onBlur={(e) => {
                    // 입력 완료 시에만 포맷팅 적용 (업비트용 8자리)
                    const rawValue = parseFloat(e.target.value) || 0;
                    const formattedValue = formatBTCUpbit(rawValue);
                    setNewStrategy(prev => ({ ...prev, investmentAmount: formattedValue }));
                  }}
                />
                <div className="text-xs text-muted-foreground">
                  ₩{parseInt(newStrategy.baseAmount || STRATEGY_DEFAULTS.BASE_AMOUNT || '0').toLocaleString('ko-KR', { maximumFractionDigits: 0 })} ÷ {newStrategy.leverage}배 = {(parseInt(newStrategy.baseAmount || STRATEGY_DEFAULTS.BASE_AMOUNT || '0') / getSafeLeverage(newStrategy.leverage)).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원 증거금
                </div>
              </div>
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
                  placeholder="0"
                  data-testid="input-base-amount"
                  id=":r12a:-form-item"
                  key={`base-amount-${newStrategy.baseAmount}`}
                  value={newStrategy.baseAmount}
                  onChange={(e) => {
                    const baseAmount = parseFloat(e.target.value) || 0;
                    const leverage = getSafeLeverage(newStrategy.leverage);
                    const btcPrice = Number(kimp?.upbit_price) || 0;
                    
                    // BTC 가격이 없으면 계산하지 않음
                    const calculatedBTC = btcPrice > 0 && baseAmount > 0
                      ? parseFloat((baseAmount / leverage / btcPrice).toFixed(8))
                      : 0;
                    
                    setNewStrategy(prev => ({
                      ...prev,
                      baseAmount: e.target.value,
                      investmentAmount: calculatedBTC > 0 ? String(calculatedBTC) : '0.00000000',
                      tolerance: prev.tolerance
                    }));
                  }}
                />
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

