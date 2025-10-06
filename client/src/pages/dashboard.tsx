import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { KimchiCards } from "@/components/kimchi-cards";
import { PositionsTable } from "@/components/positions-table";
import { RealTimePrices } from "@/components/real-time-prices";
import { CryptoPricesGrid } from "@/components/crypto-prices-grid";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Wifi, WifiOff } from "lucide-react";
import type { KimchiPremium, Position, TradingSettings, SystemAlert } from "@/types/trading";
import { apiRequest } from "@/lib/queryClient";
import { useRealTimeStats } from "@/hooks/useRealTimeStats";

export default function Dashboard() {
  const [kimchiData, setKimchiData] = useState<KimchiPremium[]>([]);
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number | null>(null);
  const { isConnected, subscribe } = useWebSocket();
  const { toast } = useToast();
  const { user } = useAuth(); // useAuth에서 user만 가져오기
  
  // 세션에서 로그인한 사용자 ID 사용 (로그인 필수)
  const userId = user?.id;
  
  // 실시간 통계 (legacy-auto-trading과 동일한 데이터)
  const { stats: realTimeStats } = useRealTimeStats(userId);
  
  // 디버깅 로그 제거

  // 서버 포트 고정 (CORS 오류 방지)
  const getServerPort = async (): Promise<number> => {
    // 로컬 개발환경에서는 항상 5001 포트 사용
    if (window.location.hostname === 'localhost') {
      return 5001;
    }
    // 프로덕션에서는 5000 포트
    return 5000;
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
  const { data: allPositions = [], refetch: refetchPositions, isLoading: isLoadingPositions, error: positionsError } = useQuery<Position[]>({
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

  // 활성 포지션만 필터링 (open/active 상태만)
  const positions = allPositions.filter(p => {
    const status = p.status as string;
    return status === 'open' || status === 'active';
  });

  const { refetch: refetchSettings } = useQuery<TradingSettings>({
    queryKey: [`/api/trading-settings/${userId}`],
    enabled: !!userId,
  });

  const { data: alerts = [] } = useQuery<SystemAlert[]>({
    queryKey: ['/api/alerts'],
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
  const { data: _todayMetrics } = useQuery<any>({
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

    const unsubscribeStatus = subscribe('trading-status', () => {
      // Status update handled by query
    });

    return () => {
      unsubscribeKimchi();
      unsubscribeStatus();
    };
  }, [subscribe]);


  // 환율 데이터 업데이트
  useEffect(() => {
    if (typeof exchangeRateData?.rate === 'number') {
      const newRate = exchangeRateData.rate;
      if (newRate !== currentExchangeRate) {
        setCurrentExchangeRate(newRate);
      }
    }
  }, [exchangeRateData, currentExchangeRate]);

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

      await res.json();

      toast({
        title: "성공",
        description: "포지션이 성공적으로 청산되었습니다.",
      });
      refetchPositions();
      
      // 청산 완료 후 잔고 재조회
      try {
        console.log('🔄 개별청산 후 잔고 재조회 시작...');
        await fetch('/api/realtime-balances', { 
          method: 'GET',
          credentials: 'include' 
        });
        console.log('✅ 개별청산 후 잔고 재조회 완료');
      } catch (balanceError) {
        console.warn('⚠️ 잔고 재조회 실패:', balanceError);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "오류",
        description: `포지션 청산에 실패했습니다: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Calculate daily profit rate (실제 김치 차익거래 수익률)
  const dailyProfitRate = (() => {
    if (!positions || positions.length === 0) return 0;
    
    // 현재 김치프리미엄 (화면 표시 기준)
    const currentKimchiRate = kimchiData.find(d => d.symbol === 'BTC')?.premiumRate || 0;
    
    // 포지션별 김치 변화 수익률 계산
    const totalProfitRate = positions.reduce((sum, pos) => {
      const entryKimchi = parseFloat(pos.entryPremiumRate?.toString() || '0');
      const kimchiChange = entryKimchi - currentKimchiRate; // 김프 감소가 수익
      
      // 김치 변화를 수익률로 변환 (간단한 계산)
      const positionProfitRate = kimchiChange * 0.1; // 김프 1% 감소 = 0.1% 수익률
      
      return sum + positionProfitRate;
    }, 0);
    
    return totalProfitRate / positions.length; // 평균 수익률
  })();

  // Count today's trades (KST, by logged-in user)

  // legacy-auto-trading과 동일한 총 거래 값 사용
  const todayTradeCount = realTimeStats?.totalTrades || 0;

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
