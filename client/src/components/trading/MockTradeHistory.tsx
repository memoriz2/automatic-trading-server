import React from 'react';
import { formatBTC } from '@/utils/trading/formatters';
import { formatKoreanTime } from '@/utils/datetime';

interface MockTrade {
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

interface MockTradeHistoryProps {
  tradingLogs: string[];
  recentTrades: MockTrade[];
  strategies: Strategy[];
}

export const MockTradeHistory: React.FC<MockTradeHistoryProps> = ({
  tradingLogs,
  recentTrades,
  strategies
}) => {
  // 디버깅: recentTrades 변화 추적
  React.useEffect(() => {
    console.log('🎯 MockTradeHistory recentTrades 업데이트:', {
      count: recentTrades.length,
      trades: recentTrades,
      isEmpty: recentTrades.length === 0,
      timestamp: new Date().toISOString()
    });
    
    // 거래 기록이 비어있으면 경고
    if (recentTrades.length === 0) {
      console.warn('⚠️ MockTradeHistory: 거래 기록이 비어있습니다!');
    }
  }, [recentTrades]);
  const getTradeTypeDisplay = (trade: MockTrade, strategy?: Strategy) => {
    return trade.type?.toUpperCase() || (strategy?.name?.includes('강제진입') ? strategy.name : 'UNKNOWN');
  };

  const getStrategyDisplay = (strategy: Strategy) => {
    return strategy.name.includes('강제진입') ? `🧪 ${strategy.name}` : strategy.name;
  };

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
          {recentTrades.length === 0 ? (
            <div className="bg-slate-800 p-3 rounded-lg text-center">
              <p className="text-slate-400 text-sm">거래 기록이 없습니다</p>
            </div>
          ) : (
            recentTrades.map(trade => {
              const strategy = strategies.find(s => s.id === trade.strategyId);
              return (
                <div key={trade.id} className="bg-slate-700 p-2 rounded mb-1 text-xs border border-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-white">
                      {formatKoreanTime(trade.timestamp)} | <span className="font-bold">{trade.exchange}</span> | <span className={`${
                        trade.type === 'buy' ? 'text-blue-400' : 
                        trade.type === 'sell' ? 'text-yellow-400' :
                        trade.type === 'short' ? 'text-red-400' :
                        'text-green-400'
                      } font-bold`}>
                        {getTradeTypeDisplay(trade, strategy)}
                      </span>
                      {strategy && (
                        <span className="text-purple-400 ml-2">
                          [{getStrategyDisplay(strategy)}]
                        </span>
                      )}
                    </span>
                    <span className={`font-medium ${
                      trade.type === 'buy' ? 'text-blue-400' : 
                      trade.type === 'sell' ? 'text-yellow-400' :
                      trade.type === 'short' ? 'text-red-400' :
                      'text-green-400'
                    }`}>
                      {formatBTC(Number(trade.quantity) || 0)} BTC @ {(Number(trade.price) || 0).toLocaleString()}
                      {trade.exchange === 'binance' && (trade.type === 'short' || trade.type === 'cover') && ' (선물)'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
