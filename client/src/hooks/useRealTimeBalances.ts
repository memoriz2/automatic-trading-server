import { useState, useEffect, useRef } from 'react';
import { apiFetchJson } from '@/lib/queryClient';

interface RealTimeBalances {
  upbitBtc: number;
  binanceBtc: number;
  timestamp: string;
}

/**
 * 실시간 거래소 잔고 조회 훅
 * 실제 거래소 API에서 현재 보유량을 가져와서 표시
 */
export const useRealTimeBalances = (userId?: number) => {
  const [balances, setBalances] = useState<RealTimeBalances>({
    upbitBtc: 0,
    binanceBtc: 0,
    timestamp: new Date().toISOString()
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthFailed, setIsAuthFailed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 실시간 잔고 조회
  const fetchRealTimeBalances = async () => {
    if (!userId || isAuthFailed) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetchJson('/api/realtime-balances', {
        method: 'GET',
        credentials: 'include',
      });

      setBalances({
        upbitBtc: Number(data.upbitBtc || 0),
        binanceBtc: Number(data.binanceBtc || 0),
        timestamp: data.timestamp || new Date().toISOString()
      });
      
      // 성공 시 인증 실패 상태 초기화
      setIsAuthFailed(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '실시간 잔고 조회 실패';
      
      // 인증 실패인 경우 추가 요청 중단
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        console.log('🔒 [useRealTimeBalances] 인증 실패로 실시간 잔고 조회 중단');
        setIsAuthFailed(true);
        setError('인증이 필요합니다. 다시 로그인해주세요.');
        
        // 인터벌 정리
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setError(errorMessage);
        console.error('❌ [useRealTimeBalances] 실시간 잔고 조회 실패:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 실패 이벤트 리스너
  useEffect(() => {
    const handleAuthFailed = () => {
      console.log('🔒 [useRealTimeBalances] 전역 인증 실패 이벤트 수신');
      setIsAuthFailed(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    window.addEventListener('auth-failed', handleAuthFailed);
    return () => window.removeEventListener('auth-failed', handleAuthFailed);
  }, []);

  // 실시간 업데이트 (10초마다)
  useEffect(() => {
    if (!userId || isAuthFailed) return;

    // 즉시 실행
    fetchRealTimeBalances();

    // 1분마다 업데이트 (진입/청산시 즉시 동기화로 충분)
    intervalRef.current = setInterval(fetchRealTimeBalances, 60000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, isAuthFailed]);

  return {
    balances,
    isLoading,
    error,
    isAuthFailed,
    refetch: fetchRealTimeBalances,
    forceRefresh: fetchRealTimeBalances, // 즉시 동기화용
    setLoading: setIsLoading // 외부에서 로딩 상태 제어
  };
};
