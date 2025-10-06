import { useState, useEffect, useRef } from 'react';

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
  totalProfitKrw: number;
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
    totalProfitRate: 0,
    totalProfitKrw: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthFailed, setIsAuthFailed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 한국시간 오전 9시부터 경과 분 계산 (KST 09:00 = UTC 00:00)
  const getKstMinutesSince9AM = () => {
    const now = new Date();

    // UTC 기준 오늘 00:00 계산 (= 한국시간 오늘 09:00)
    const today9AM_UTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));

    // 현재 UTC 시간이 오늘 00:00 이전이면 어제 00:00 사용 (= 어제 한국시간 09:00)
    if (now.getTime() < today9AM_UTC.getTime()) {
      today9AM_UTC.setUTCDate(today9AM_UTC.getUTCDate() - 1);
    }

    return Math.max(1, Math.floor((now.getTime() - today9AM_UTC.getTime()) / 60000));
  };

  // 실제 DB 통계 가져오기
  const fetchRealStats = async () => {
    if (!userId || isAuthFailed) {
      console.log(`⏸️ [useRealTimeStats] 통계 조회 건너뜀: userId=${userId}, isAuthFailed=${isAuthFailed}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const minutes = getKstMinutesSince9AM();
      const token = localStorage.getItem('authToken');

      console.log(`🔍 [useRealTimeStats] 통계 조회 시작: userId=${userId}, minutes=${minutes}`);

      const res = await fetch(`/api/trading/daily-stats?minutes=${minutes}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'X-User-ID': String(userId),
        },
        credentials: 'include',
        cache: 'no-store',
      });

      console.log(`📡 [useRealTimeStats] API 응답: status=${res.status}`);

      if (res.status === 401) {
        console.log('🔒 [useRealTimeStats] 인증 실패로 통계 조회 중단');
        setIsAuthFailed(true);
        setError('인증이 필요합니다. 다시 로그인해주세요.');
        
        // 인터벌 정리
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      if (res.ok) {
        const metrics = await res.json();

        console.log(`📊 [useRealTimeStats] 서버 응답 데이터:`, metrics);

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
            totalProfitRate: Number(metrics.total_profit_rate || 0),
            totalProfitKrw: Number(metrics.total_profit_krw || 0)
        };

        console.log(`✅ [useRealTimeStats] 통계 업데이트:`, realStats);

        setStats(realStats);
        // 성공 시 인증 실패 상태 초기화
        setIsAuthFailed(false);
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

  // 인증 실패 이벤트 리스너
  useEffect(() => {
    const handleAuthFailed = () => {
      console.log('🔒 [useRealTimeStats] 전역 인증 실패 이벤트 수신');
      setIsAuthFailed(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    window.addEventListener('auth-failed', handleAuthFailed);
    return () => window.removeEventListener('auth-failed', handleAuthFailed);
  }, []);

  // 실시간 업데이트 (5초마다)
  useEffect(() => {
    if (!userId || isAuthFailed) return;

    // 즉시 실행
    fetchRealStats();

    // 5초마다 업데이트
    intervalRef.current = setInterval(fetchRealStats, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, isAuthFailed]);

  return {
    stats,
    isLoading,
    error,
    isAuthFailed,
    refetch: fetchRealStats
  };
};
