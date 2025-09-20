import { useState, useEffect, useCallback } from 'react';

interface UseTradingModeProps {
  user: any;
}

export const useTradingMode = ({ user }: UseTradingModeProps) => {
  const [tradingMode, setTradingMode] = useState<'live'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [realStrategies, setRealStrategies] = useState<any[]>([]);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<Date | null>(null);

  // 안전 숫자 변환기
  const toNum = (v: any, d = 0) => {
    if (v === null || v === undefined) return d;
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : d;
  };

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
        // 실거래 전략 DB 조회 중
        
        // 재시도 로직 포함 (최대 3회)
        let lastError: any = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            // 전략 조회 시도
            
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
              
              // 서버 응답 확인
              
              const list = Array.isArray(data) ? normalizeStrategies(data) : [];
              
              setRealStrategies(list);
              setLastLoadTime(new Date());
              // 전략 조회 성공
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
        
      } catch (error: any) {
        console.error('❌ 전략 조회 최종 실패:', error);
        setStrategiesError(error.message || '전략 조회 중 오류가 발생했습니다');
        
        // 기존 데이터 유지 - 에러 시 전략을 초기화하지 않음
        console.log('⚠️ 전략 조회 실패했지만 기존 전략 유지:', realStrategies.length, '개');
      } finally {
        setIsLoadingStrategies(false);
      }
    } else if (tradingMode !== 'live') {
      // Mock 모드일 때만 실거래 전략 초기화 (유저 없음 상태에서는 초기화하지 않음)
      setRealStrategies([]);
      // Mock 모드 - 실거래 전략 초기화
    } else {
      // 유저 정보 로딩 중 - 전략 초기화 보류
    }
  }, [tradingMode, user]);

  // 실거래 전략 조회 실행 (자동 로드 비활성화 - legacy-auto-trading.tsx에서 수동 호출)
  // useEffect(() => {
  //   loadRealStrategies();
  // }, [loadRealStrategies]);

  // 거래 모드 상태 확인 완료

  return {
    tradingMode,
    setTradingMode,
    isAdmin,
    canUseMock,
    realStrategies,
    setRealStrategies,
    loadRealStrategies,
    isLoadingStrategies,
    strategiesError,
    lastLoadTime
  };
};
