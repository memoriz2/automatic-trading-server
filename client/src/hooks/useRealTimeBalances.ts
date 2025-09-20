import { useState, useEffect } from 'react';
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

  // 실시간 잔고 조회
  const fetchRealTimeBalances = async () => {
    if (!userId) return;

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '실시간 잔고 조회 실패';
      setError(errorMessage);
      console.error('❌ [useRealTimeBalances] 실시간 잔고 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 실시간 업데이트 (10초마다)
  useEffect(() => {
    if (!userId) return;

    // 즉시 실행
    fetchRealTimeBalances();

    // 10초마다 업데이트
    const interval = setInterval(fetchRealTimeBalances, 10000);
    
    return () => clearInterval(interval);
  }, [userId]);

  return {
    balances,
    isLoading,
    error,
    refetch: fetchRealTimeBalances
  };
};
