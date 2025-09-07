import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { KimchiCards } from "@/components/kimchi-cards";
import { PositionsTable } from "@/components/positions-table";
import { BalanceDisplay } from "@/components/balance-display";

import { RealTimePrices } from "@/components/real-time-prices";
import { CryptoPricesGrid } from "@/components/crypto-prices-grid";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { StopCircle, Wifi, WifiOff } from "lucide-react";
import type { KimchiPremium, Position, Trade, TradingSettings, SystemAlert } from "@/types/trading";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [kimchiData, setKimchiData] = useState<KimchiPremium[]>([]);
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number | null>(null);
  const [previousExchangeRate, setPreviousExchangeRate] = useState<number | null>(null);
  const { isConnected, subscribe } = useWebSocket();
  const { toast } = useToast();
  const { user, token } = useAuth(); // useAuth에서 token 직접 가져오기
  
  // 세션에서 로그인한 사용자 ID 사용 (로그인 필수)
  const userId = user?.id;
  
  // 디버깅 로그 제거

  // 서버 포트 동적 감지
  const getServerPort = async (): Promise<number> => {
    try {
      // 환경별 포트 감지 로직
      const isProduction = process.env.NODE_ENV === "production";
      const isServerEnvironment = window.location.hostname !== 'localhost';
      
      if (isServerEnvironment || isProduction) {
        return 5000; // 서버 환경에서는 항상 5000
      }
      
      // 로컬 환경에서는 서버 정보 API로 실제 포트 확인
      const commonPorts = [5000, 5001, 5002, 5003, 3000, 8000];
      
      for (const port of commonPorts) {
        try {
          const response = await fetch(`http://localhost:${port}/api/server-info`);
          if (response.ok) {
            const serverInfo = await response.json();
            return port;
          }
        } catch (e) {
          // 포트 확인 실패, 다음 포트 시도
        }
      }
      
      return 5000; // 기본값
    } catch (error) {
      return 5000;
    }
  };

  // 환율 데이터 쿼리 추가
  const { data: exchangeRateData, error: exchangeRateError } = useQuery({
    queryKey: ['/api/exchange-rate'],
    queryFn: async () => {
      
      // 서버 포트 동적 감지
      const serverPort = await getServerPort();
      
      // 환경별 API URL 결정
      let apiUrl = '/api/exchange-rate';
      
      // 로컬 개발 환경에서만 동적 포트 사용
      if (window.location.hostname === 'localhost' && window.location.port !== serverPort.toString()) {
        apiUrl = `http://localhost:${serverPort}/api/exchange-rate`;
      } else {
        
      }
      
      try {
        const response = await apiRequest('GET', apiUrl);
        const data = await response.json();
        return data;
      } catch (error) {
        throw error;
      }
    },
    refetchInterval: 3000, // 3초마다 환율 업데이트 (구글 파이낸스 업데이트 주기와 동일)
    refetchIntervalInBackground: true,
    retry: 3,
  });

  // Queries
  const { data: positions = [], refetch: refetchPositions, isLoading: isLoadingPositions, error: positionsError } = useQuery<Position[]>({
    queryKey: ['/api/positions', userId], // 올바른 queryKey 형식
    queryFn: async () => {
      const response = await fetch(`/api/positions`, { credentials: 'include' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch positions: ${errorText}`);
      }
      const data = await response.json();
      return data;
    },
    enabled: !!userId,
  });

  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: [`/api/trades/${userId}`],
    enabled: !!userId,
  });

  const { data: settings, refetch: refetchSettings } = useQuery<TradingSettings>({
    queryKey: [`/api/trading-settings/${userId}`],
    enabled: !!userId,
  });

  const { data: alerts = [] } = useQuery<SystemAlert[]>({
    queryKey: ['/api/alerts'],
  });

  const { data: tradingStatus } = useQuery({
    queryKey: ['/api/trading/status'],
  });

  // 오늘(한국시간) 경과 분 계산
  const getKstMinutesSinceMidnight = () => {
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const y = kstNow.getUTCFullYear();
    const m = kstNow.getUTCMonth();
    const d = kstNow.getUTCDate();
    const kstMidnightUtc = Date.UTC(y, m, d, -9, 0, 0);
    return Math.max(1, Math.floor((now.getTime() - kstMidnightUtc) / 60000));
  };

  // KST 오늘 범위 기준 지표(주문/진입/청산) 조회
  const { data: todayMetrics } = useQuery<any>({
    queryKey: ['/api/kimpga/metrics', 'today'],
    enabled: !!userId,
    refetchInterval: 5000,
    queryFn: async () => {
      const minutes = getKstMinutesSinceMidnight();
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/kimpga/metrics?minutes=${minutes}`,
        {
          method: 'GET',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'X-User-ID': String(userId),
          },
          credentials: 'include',
          cache: 'no-store',
        }
      );
      if (!res.ok) throw new Error(`${res.status}: metrics fetch failed`);
      return await res.json();
    },
  });

  // WebSocket subscriptions
  useEffect(() => {
    const unsubscribeKimchi = subscribe('kimchi-premium', (data: KimchiPremium[]) => {
      setKimchiData(data);
      // 김치프리미엄 데이터에서 환율 정보 추출 (첫 번째 데이터의 환율 사용)
      if (data && data.length > 0 && data[0].exchangeRate) {
        setCurrentExchangeRate(data[0].exchangeRate);
      }
    });

    const unsubscribeStatus = subscribe('trading-status', (data: { isActive: boolean }) => {
      setIsAutoTrading(data.isActive);
    });

    return () => {
      unsubscribeKimchi();
      unsubscribeStatus();
    };
  }, [subscribe]);

  // Update trading status from query
  useEffect(() => {
    if (tradingStatus && typeof tradingStatus === 'object' && 'isActive' in tradingStatus) {
      setIsAutoTrading(tradingStatus.isActive as boolean);
    }
  }, [tradingStatus]);

  // 환율 데이터 업데이트
  useEffect(() => {
    if (typeof exchangeRateData?.rate === 'number') {
      const newRate = exchangeRateData.rate;
      if (newRate !== currentExchangeRate) {
        setPreviousExchangeRate(currentExchangeRate);
        setCurrentExchangeRate(newRate);
      } else {
        
      }
    } else {
      
    }
  }, [exchangeRateData]);

  // 환율 에러 처리
  useEffect(() => {
    if (exchangeRateError) {
      toast({
        title: "환율 정보 오류",
        description: "실시간 환율을 가져올 수 없습니다.",
        variant: "destructive",
      });
    }
  }, [exchangeRateError, toast]);

  useEffect(() => {
    if (positionsError) {
      toast({
        title: "포지션 로딩 실패",
        description: positionsError.message,
        variant: "destructive",
      });
    }
  }, [isLoadingPositions, positionsError, toast]);

  const handleEmergencyStop = async () => {
    try {
      await apiRequest('POST', `/api/trading/emergency-stop/${userId}`);
      toast({
        title: "긴급 정지",
        description: "긴급 정지가 실행되어 모든 거래가 중단되었습니다.",
        variant: "destructive",
      });
      refetchPositions();
      refetchSettings();
    } catch (error) {
      toast({
        title: "오류",
        description: "긴급 정지 실행 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleClosePosition = async (positionId: number) => {
    try {
      const res = await fetch(`/api/positions/${positionId}/close`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.error || errorData.message || '알 수 없는 서버 오류';
        throw new Error(errorMessage);
      }

      const result = await res.json();

      toast({
        title: "성공",
        description: "포지션이 성공적으로 청산되었습니다.",
      });
      refetchPositions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "오류",
        description: `포지션 청산에 실패했습니다: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Calculate daily profit rate (mock calculation)
  const dailyProfitRate = positions.reduce((sum, pos) => {
    return sum + (parseFloat(pos.profitLossRate?.toString() || '0'));
  }, 0) / Math.max(positions.length, 1);

  // Count today's trades (KST, by logged-in user)
  const toKstDateString = (d: string | Date) =>
    new Date(
      new Date(typeof d === 'string' ? d : d.toISOString()).toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
    ).toDateString();

  const todayKst = toKstDateString(new Date());

  // 지표 기반 합산(체결+진입+청산) → 폴백은 로컬 필터
  const todayTradeCountFromMetrics = todayMetrics
    ? (Number(todayMetrics.total_orders || 0) + Number(todayMetrics.entries || 0) + Number(todayMetrics.exits || 0))
    : null;

  const todayTradeCountFallback = userId
    ? (trades || []).filter((t: any) => {
        const ts = (t as any).executedAt || (t as any).createdAt || (t as any).timestamp;
        if (!ts) return false;
        return toKstDateString(ts) === todayKst;
      }).length
    : 0;

  const todayTradeCount = todayTradeCountFromMetrics ?? todayTradeCountFallback;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">실시간 김프 모니터링</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
              <span className={`text-sm ${isConnected ? 'text-success' : 'text-danger'}`}>
                {isConnected ? '실시간 연결됨' : '연결 끊김'}
              </span>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            {/* Notification Bell */}
            <Button variant="ghost" size="sm" className="relative text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
              </svg>
              {alerts.some(alert => !alert.isRead) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-danger rounded-full"></span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* 실시간 가격 및 환율 정보 */}
        <RealTimePrices 
          kimchiData={kimchiData}
          currentExchangeRate={currentExchangeRate}
          onEmergencyStop={handleEmergencyStop}
        />

        {/* Kimchi Premium Overview */}
        <KimchiCards 
          kimchiData={kimchiData}
          positions={positions}
          dailyProfitRate={dailyProfitRate}
          todayTradeCount={todayTradeCount}
        />

        {/* 암호화폐별 실시간 가격 그리드 */}
        <CryptoPricesGrid kimchiData={kimchiData} />

        {/* Active Positions */}
        <PositionsTable 
          positions={positions}
          onRefresh={refetchPositions}
          onClosePosition={handleClosePosition}
        />
      </main>
    </div>
  );
}
