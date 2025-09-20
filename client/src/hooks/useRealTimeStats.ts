import { useState, useEffect } from 'react';

interface RealTimeStats {
  totalTrades: number;
  upbitTrades: number;
  binanceTrades: number;
  entries: number;
  exits: number;
  loops: number;
  errors: number;
  totalFees: number;
  totalProfitRate: number;
}

/**
 * 실시간 DB 기반 통계 훅
 * 한국시간 기준 오늘의 거래 통계를 실시간으로 제공
 */
export const useRealTimeStats = (userId?: number) => {
  const [stats, setStats] = useState<RealTimeStats>({
    totalTrades: 0,
    upbitTrades: 0,
    binanceTrades: 0,
    entries: 0,
    exits: 0,
    loops: 0,
    errors: 0,
    totalFees: 0,
    totalProfitRate: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 한국시간 자정부터 경과 분 계산
  const getKstMinutesSinceMidnight = () => {
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstMidnightUtc = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate(), -9, 0, 0);
    return Math.max(1, Math.floor((now.getTime() - kstMidnightUtc) / 60000));
  };

  // 실제 DB 통계 가져오기
  const fetchRealStats = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const minutes = getKstMinutesSinceMidnight();
      const token = localStorage.getItem('authToken');
      
      const res = await fetch(`/api/trading/daily-stats?minutes=${minutes}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'X-User-ID': String(userId),
        },
        credentials: 'include',
        cache: 'no-store',
      });

        if (res.ok) {
          const metrics = await res.json();
          console.log('📊 [useRealTimeStats] 서버 응답 원본:', metrics);
          
          const calculatedTotalTrades = Number(metrics.total_orders || 0); // 서버에서 이미 계산됨
          
          const realStats: RealTimeStats = {
            totalTrades: calculatedTotalTrades,
            upbitTrades: Number(metrics.upbit_orders || 0),
            binanceTrades: Number(metrics.binance_orders || 0),
            entries: Number(metrics.entries || 0),
            exits: Number(metrics.exits || 0),
            loops: Number(metrics.loops || 0),
            errors: Number(metrics.errors || 0),
            totalFees: Number(metrics.total_fees || 0),
            totalProfitRate: Number(metrics.total_profit_rate || 0)
          };
          
          console.log('📊 [useRealTimeStats] 상세 계산:', {
            'total_orders': metrics.total_orders,
            'entries': metrics.entries, 
            'exits': metrics.exits,
            '계산결과': calculatedTotalTrades,
            '이전상태': stats.totalTrades,
            '새상태': realStats.totalTrades
          });
          
          setStats(realStats);
          console.log('📊 [useRealTimeStats] DB 통계 업데이트:', realStats);
      } else {
        throw new Error(`API 응답 오류: ${res.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '통계 조회 실패';
      setError(errorMessage);
      console.error('❌ [useRealTimeStats] 통계 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 실시간 업데이트 (5초마다)
  useEffect(() => {
    if (!userId) return;

    // 즉시 실행
    fetchRealStats();

    // 5초마다 업데이트
    const interval = setInterval(fetchRealStats, 5000);
    
    return () => clearInterval(interval);
  }, [userId]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchRealStats
  };
};
