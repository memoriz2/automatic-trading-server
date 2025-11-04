import React, { useEffect, useState } from 'react';
import { formatBTC } from '@/utils/trading/formatters';
import { useAuth } from '@/hooks/useAuth';

interface LiveTrade {
  id: string;
  timestamp: Date;
  type: 'buy' | 'sell' | 'spot' | 'short' | 'cover';
  symbol: string;
  quantity: number;
  price: number;
  fee: number;
  exchange: 'upbit' | 'binance';
  strategyId: string;
  strategyName?: string;
  premiumRate: number;
}

interface Strategy {
  id: string;
  name: string;
}

interface LiveTradeHistoryProps {
  tradingLogs: string[];
  recentTrades: LiveTrade[];
  strategies: Strategy[];
  refreshTrigger?: number; // 거래 후 DB 새로고침 트리거
}

export const LiveTradeHistory: React.FC<LiveTradeHistoryProps> = ({ 
  tradingLogs, 
  recentTrades, 
  strategies,
  refreshTrigger = 0
}) => {
  const { user } = useAuth();
  const [dbTrades, setDbTrades] = useState<LiveTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // DB에서 최근 거래 조회 (고정된 시간 사용)
  const fetchRecentTrades = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/recent-trades?limit=10`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const trades = await response.json();
        const formattedTrades = trades.map((trade: any) => ({
          ...trade,
          timestamp: new Date(trade.timestamp) // DB의 고정된 거래 시간
        }));
        setDbTrades(formattedTrades);
        console.log('✅ DB 거래 기록 조회 완료:', formattedTrades.length);
      }
    } catch (error) {
      console.error('❌ DB 거래 기록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 및 refreshTrigger 변경 시 조회
  useEffect(() => {
    fetchRecentTrades();
  }, [user?.id, refreshTrigger]);

  // DB 거래가 있으면 DB 데이터 우선 사용 (고정된 시간)
  const displayTrades = dbTrades.length > 0 ? dbTrades : recentTrades;

  // 개발 환경에서만 의미 있는 경고 출력 (컴포넌트 로드 후 5초 뒤에도 거래 기록이 없을 때만)
  React.useEffect((): (() => void) | void => {
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        if (recentTrades.length === 0) {
          console.warn('⚠️ LiveTradeHistory: 5초 후에도 거래 기록이 없습니다. 거래 시스템 상태를 확인하세요.');
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []); // 의존성 배열을 빈 배열로 변경하여 마운트 시 한 번만 실행

  // 전략별로 그룹화
  const groupedByStrategy = displayTrades.reduce((acc: { [key: string]: LiveTrade[] }, trade) => {
    const strategyKey = trade.strategyId || 'unknown';
    if (!acc[strategyKey]) {
      acc[strategyKey] = [];
    }
    acc[strategyKey].push(trade);
    return acc;
  }, {});

  return (
    <>
      {/* 실시간 거래 로그 */}
      {tradingLogs.length > 0 && (
        <div className="mb-4">
          <h4 className="text-white font-medium mb-2">실시간 거래 로그</h4>
          <div className="bg-slate-900 p-3 rounded-lg max-h-32 overflow-y-auto">
            {tradingLogs.map((log, index) => (
              <div key={index} className="text-xs text-green-400 font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 거래 기록 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium">최근 거래 ({recentTrades.length}건)</h4>
          <div className="text-xs text-slate-400">
            <span className="text-blue-400">BUY💙</span> (업비트) | 
            <span className="text-yellow-400">SELL💛</span> (업비트) | 
            <span className="text-red-400">SHORT❤️</span> (바이낸스 선물) | 
            <span className="text-green-400">COVER💚</span> (바이낸스 선물)
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {displayTrades.length === 0 ? (
            <div className="bg-slate-800 p-3 rounded-lg text-center">
              <p className="text-slate-400 text-sm">
                {isLoading ? '거래 기록 로딩 중...' : '거래 기록이 없습니다'}
              </p>
            </div>
          ) : (
            Object.entries(groupedByStrategy).map(([strategyId, trades]) => {
              const strategy = strategies.find(s => s.id === strategyId);
              const strategyName = strategy?.name || (strategyId !== 'unknown' ? `전략 #${strategyId}` : '전략 정보 없음');

              // 매수(buy+short)와 청산(sell+cover)로 그룹화
              const entryTrades = trades.filter(t => t.type === 'buy' || t.type === 'short');
              const exitTrades = trades.filter(t => t.type === 'sell' || t.type === 'cover');

              const entryTotal = entryTrades.reduce((sum, t) => sum + Number(t.quantity || 0), 0);
              const exitTotal = exitTrades.reduce((sum, t) => sum + Number(t.quantity || 0), 0);
              const totalFee = trades.reduce((sum, t) => sum + Number(t.fee || 0), 0);

              return (
                <div key={strategyId} className="mb-3 border border-slate-600 rounded-lg p-3 bg-slate-900">
                  <h5 className="text-sm font-semibold text-slate-300 mb-2">{strategyName}</h5>

                  {/* 매수 */}
                  {entryTrades.length > 0 && (
                    <div className="flex items-center justify-between py-1 text-xs">
                      <span className="text-blue-400 font-semibold">매수</span>
                      <span className="text-white font-semibold">{formatBTC(entryTotal)}</span>
                    </div>
                  )}

                  {/* 청산 */}
                  {exitTrades.length > 0 && (
                    <div className="flex items-center justify-between py-1 text-xs">
                      <span className="text-red-400 font-semibold">청산</span>
                      <span className="text-white font-semibold">{formatBTC(exitTotal)}</span>
                    </div>
                  )}

                  {/* 수수료 */}
                  {totalFee > 0 && (
                    <div className="flex items-center justify-between py-1 text-xs">
                      <span className="text-slate-400 font-semibold">수수료</span>
                      <span className="text-orange-400 font-semibold">-{totalFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
