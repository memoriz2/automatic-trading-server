import { getErrorMessage } from '@/utils/error-utils';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { userIdManager } from '@/utils/user-id-manager';

interface Band {
  name?: string;
  target_kimp?: number | string;
  exit_kimp?: number | string;
  tolerance?: number | string;
  leverage?: number | string;
  amount_btc?: number | string;
  serverId?: string | number;
}

export const useLegacyTradingState = () => {
  const { user, isAuthenticated, isLoading, checkSession } = useAuth();
  const { isConnected, isConnecting: wsConnecting, connectionAttempts, lastHeartbeat, subscribe } = useWebSocket();
  const { toast } = useToast();

  // 상태들
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [currentPositions, setCurrentPositions] = useState<any[]>([]);
  const [kimp, setKimp] = useState<any>({
    upbit_price: 0,
    binance_price: 0,
    usdkrw: 0,
    kimp: 0,
    timestamp: null
  });
  const [logs, setLogs] = useState<string>('Loading...');
  const [balances, setBalances] = useState<any>({ real: {}, connected: {} });
  const [metrics, setMetrics] = useState<any>({});
  const [bands, setBands] = useState<Band[]>([]);
  const [serverBands, setServerBands] = useState<any[]>([]);
  const [serverStatusBands, setServerStatusBands] = useState<any[]>([]);
  const [registeringIndex, setRegisteringIndex] = useState<number | null>(null);
  const [unregisteringIndex, setUnregisteringIndex] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [boardActingId, setBoardActingId] = useState<string | number | null>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [realStrategies, setRealStrategies] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [serverState, setServerState] = useState<any>({
    running: false,
    status: 'stopped'
  });
  const [netMs, setNetMs] = useState<number>(0);
  const [netOk, setNetOk] = useState<boolean>(true);
  const [errCount, setErrCount] = useState<number>(0);
  const [apiConnections, setApiConnections] = useState<any>({});
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStrategy, setNewStrategy] = useState<any>(null);
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<'stable' | 'loading'>('stable');

  // Trading mode states
  const [tradingMode, setTradingMode] = useState<'live'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<Date | null>(null);

  const effectiveUserId = user?.id ? String(user.id) : userIdManager.getCurrentUserId();

  // 서버 rows → 프론트 스키마로 정규화 (원본 값 보존 우선)
  const normalizeStrategies = (rows: any[]) =>
    rows.map((row) => ({
      id: String(row.id),
      name: row.name || `전략 #${row.id}`,
      crypto: row.crypto || row.symbol || 'BTC',
      entryCondition: row.entryCondition ?? row.entry_rate ?? 0,
      takeProfitCondition: row.takeProfitCondition ?? row.exit_rate ?? 0,
      tolerance: row.tolerance ?? row.tolerance_rate ?? row.kimchi_tolerance_rate ?? 0.1,
      leverage: String(row.leverage ?? row.binance_leverage ?? 3),
      investmentAmount: String(row.investmentAmount ?? row.investment_amount ?? row.max_investment_amount ?? 0),
      isActive: Boolean(row.isActive ?? row.is_active ?? row.is_auto_trading),
      profitRate: String(row.profitRate ?? row.total_profit_rate ?? 0),
      executionCount: row.executionCount ?? row.executions ?? 0,
      strategyType: row.strategyType || row.strategy_type || 'positive_kimchi',
    }));

  // 환경 및 권한 확인
  const isLocalhost = window.location.hostname === 'localhost';
  const canUseMock = isLocalhost || isAdmin;

  // 어드민 권한 확인
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/check', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
          console.log('✅ 어드민 권한 확인:', data.isAdmin);
        }
      } catch (error) {
        console.error('어드민 권한 확인 실패:', error);
        setIsAdmin(false);
      }
    };

    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // 실거래 전략 조회 함수
  const loadRealStrategies = useCallback(async () => {
    if (tradingMode === 'live' && user) {
      try {
        setIsLoadingStrategies(true);
        setStrategiesError(null);

        // 재시도 로직 포함 (최대 3회)
        let lastError: any = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

            const response = await fetch('/api/trading-strategies', {
              credentials: 'include',
              signal: controller.signal,
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const list = Array.isArray(data) ? normalizeStrategies(data) : [];

              setRealStrategies(list);
              setLastLoadTime(new Date());
              return; // 성공 시 루프 종료

            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

          } catch (attemptError: any) {
            lastError = attemptError;
            console.warn(`⚠️ 전략 조회 시도 ${attempt} 실패:`, attemptError.message);

            if (attempt < 3) {
              // 재시도 전 대기 (지수 백오프)
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
              console.log(`⏳ ${delay}ms 후 재시도...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }

        // 모든 시도 실패
        throw lastError || new Error('전략 조회 실패');

      } catch (error: unknown) {
        console.error('❌ 전략 조회 최종 실패:', error);
        setStrategiesError(getErrorMessage(error) || '전략 조회 중 오류가 발생했습니다');

        // 기존 데이터 유지 - 에러 시 전략을 초기화하지 않음
        console.log('⚠️ 전략 조회 실패했지만 기존 전략 유지:', realStrategies.length, '개');
      } finally {
        setIsLoadingStrategies(false);
      }
    } else if (tradingMode !== 'live') {
      // Mock 모드일 때만 실거래 전략 초기화 (유저 없음 상태에서는 초기화하지 않음)
      setRealStrategies([]);
    }
  }, [tradingMode, user, realStrategies.length]);

  // 포지션 데이터 로드
  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/me/positions?status=open', { credentials: 'include' });
      if (response.ok) {
        const positions = await response.json();
        setCurrentPositions(positions);
      }
    } catch (error) {
      console.warn('포지션 데이터 로드 실패:', error);
    }
  }, []);

  useEffect(() => {
    if (effectiveUserId) {
      fetchPositions();
    }
  }, [effectiveUserId, fetchPositions]);

  return {
    // Auth 관련
    user,
    isAuthenticated,
    isLoading,
    checkSession,

    // WebSocket 관련
    isConnected,
    wsConnecting,
    connectionAttempts,
    lastHeartbeat,
    subscribe,

    // 상태들
    sessionInfo,
    setSessionInfo,
    showSessionInfo,
    setShowSessionInfo,
    currentPositions,
    setCurrentPositions,
    kimp,
    setKimp,
    logs,
    setLogs,
    balances,
    setBalances,
    metrics,
    setMetrics,
    bands,
    setBands,
    serverBands,
    setServerBands,
    serverStatusBands,
    setServerStatusBands,
    registeringIndex,
    setRegisteringIndex,
    unregisteringIndex,
    setUnregisteringIndex,
    starting,
    setStarting,
    boardActingId,
    setBoardActingId,
    strategies,
    setStrategies,
    realStrategies,
    setRealStrategies,
    dailyStats,
    setDailyStats,
    serverState,
    setServerState,
    netMs,
    setNetMs,
    netOk,
    setNetOk,
    errCount,
    setErrCount,
    apiConnections,
    setApiConnections,
    ws,
    setWs,
    refreshTrigger,
    setRefreshTrigger,
    showCreateModal,
    setShowCreateModal,
    newStrategy,
    setNewStrategy,
    editingStrategyId,
    setEditingStrategyId,
    loadingState,
    setLoadingState,

    // 유틸리티
    effectiveUserId,
    toast,
    fetchPositions,

    // Trading mode related
    tradingMode,
    setTradingMode,
    isAdmin,
    canUseMock,
    loadRealStrategies,
    isLoadingStrategies,
    strategiesError,
    lastLoadTime
  };
};