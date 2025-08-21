import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { KimchiCards } from "@/components/kimchi-cards";
import { PositionsTable } from "@/components/positions-table";

import { RealTimePrices } from "@/components/real-time-prices";
import { CryptoPricesGrid } from "@/components/crypto-prices-grid";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { StopCircle, Wifi, WifiOff, Download } from "lucide-react";
import type { KimchiPremium, Position, Trade, TradingSettings, SystemAlert } from "@/types/trading";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [kimchiData, setKimchiData] = useState<KimchiPremium[]>([]);
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number | null>(null);
  const { isConnected, subscribe } = useWebSocket();
  const { toast } = useToast();

  // Queries
  const { data: positions = [], refetch: refetchPositions } = useQuery<Position[]>({
    queryKey: ['/api/positions/1'], // userId = 1 for demo
  });

  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: ['/api/trades/1'],
  });

  const { data: settings, refetch: refetchSettings } = useQuery<TradingSettings>({
    queryKey: ['/api/trading-settings/1'],
  });

  const { data: alerts = [] } = useQuery<SystemAlert[]>({
    queryKey: ['/api/alerts'],
  });

  const { data: tradingStatus } = useQuery({
    queryKey: ['/api/trading/status'],
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

  const handleEmergencyStop = async () => {
    try {
      await apiRequest('POST', '/api/trading/emergency-stop/1');
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
      await apiRequest('POST', `/api/positions/${positionId}/close`);
      toast({
        title: "포지션 청산",
        description: "포지션이 성공적으로 청산되었습니다.",
      });
      refetchPositions();
    } catch (error) {
      toast({
        title: "오류",
        description: "포지션 청산 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // Calculate daily profit rate (mock calculation)
  const dailyProfitRate = positions.reduce((sum, pos) => {
    return sum + (parseFloat(pos.profitLossRate?.toString() || '0'));
  }, 0) / Math.max(positions.length, 1);

  // Count today's trades
  const today = new Date().toDateString();
  const todayTradeCount = trades.filter(trade => 
    new Date(trade.timestamp).toDateString() === today
  ).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-white">실시간 김프 모니터링</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
              <span className={`text-sm ${isConnected ? 'text-success' : 'text-danger'}`}>
                {isConnected ? '실시간 연결됨' : '연결 끊김'}
              </span>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Download Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="text-slate-400 hover:text-white border-slate-600 hover:border-slate-400"
              onClick={() => window.open('/download-this-file.tar.gz', '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              소스코드 다운로드
            </Button>
            
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
      <main className="flex-1 overflow-auto p-6 space-y-6">
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
