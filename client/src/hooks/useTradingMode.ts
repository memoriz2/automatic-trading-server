import { useState, useEffect, useCallback } from 'react';

interface UseTradingModeProps {
  user: any;
}

export const useTradingMode = ({ user }: UseTradingModeProps) => {
  const [tradingMode, setTradingMode] = useState<'real' | 'mock'>('real');
  const [isAdmin, setIsAdmin] = useState(false);
  const [realStrategies, setRealStrategies] = useState<any[]>([]);

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
          if (data && Array.isArray(data)) {
            // 모든 전략 사용 (활성화/비활성화 구분 없이)
            setRealStrategies(data);
            console.log('✅ 전략 조회 완료:', data.length, '개 (활성화/비활성화 모두 포함)');
            console.log('📊 전략 목록:', data.map(s => ({ id: s.id, name: s.name, is_active: s.is_active })));
          } else {
            setRealStrategies([]);
            console.log('📭 전략 없음 - 빈 배열로 설정');
          }
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
