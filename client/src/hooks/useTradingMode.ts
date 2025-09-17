import { useState, useEffect, useCallback } from 'react';

interface UseTradingModeProps {
  user: any;
}

export const useTradingMode = ({ user }: UseTradingModeProps) => {
  const [tradingMode, setTradingMode] = useState<'real' | 'mock'>('real');
  const [isAdmin, setIsAdmin] = useState(false);
  const [realStrategies, setRealStrategies] = useState<any[]>([]);

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
    if (tradingMode === 'real' && user) {
      try {
        console.log('🔍 실거래 전략 DB 조회 중...');
        
        // 모든 전략 조회 (활성화/비활성화 포함)
        const response = await fetch('/api/trading-strategies', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          
          console.log('🔍 [useTradingMode] 서버 응답 원본:', data.map((s: any) => ({
            id: s.id,
            name: s.name,
            entryCondition: s.entryCondition,
            takeProfitCondition: s.takeProfitCondition,
            tolerance: s.tolerance
          })));
          
          const list = Array.isArray(data) ? normalizeStrategies(data) : [];
          
          console.log('🔍 [useTradingMode] 정규화 후:', list.map(s => ({
            id: s.id,
            name: s.name,
            entryCondition: s.entryCondition,
            takeProfitCondition: s.takeProfitCondition,
            tolerance: s.tolerance
          })));
          
          setRealStrategies(list);
          console.log('✅ 전략 조회 완료:', list.length, '개 (활성화/비활성화 모두 포함)');
        } else {
          setRealStrategies([]);
          console.log('❌ 전략 조회 API 실패 - 빈 배열로 설정');
        }
      } catch (error) {
        console.error('❌ 실거래 전략 조회 실패:', error);
        setRealStrategies([]);
      }
    } else {
      // Mock 모드이거나 유저 없음 - 실거래 전략 초기화
      setRealStrategies([]);
      console.log('🧪 Mock 모드 또는 비로그인 - 실거래 전략 초기화');
    }
  }, [tradingMode, user]);

  // 실거래 전략 조회 실행
  useEffect(() => {
    loadRealStrategies();
  }, [loadRealStrategies]);

  // 디버깅 로그
  console.log('🔍 거래 모드 상태:', { 
    tradingMode, 
    isAdmin, 
    isLocalhost,
    canUseMock,
    hostname: window.location.hostname,
    user: user?.username,
    realStrategiesCount: realStrategies.length,
    realStrategiesData: realStrategies
  });

  return {
    tradingMode,
    setTradingMode,
    isAdmin,
    canUseMock,
    realStrategies,
    setRealStrategies,
    loadRealStrategies
  };
};
