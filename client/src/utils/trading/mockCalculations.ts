// Mock Trading 계산 유틸리티
import type { MockTrade, MockPosition, MockBalance } from '../../types/trading';

// 수익률 계산
export const calculateProfitRate = (
  mockBalance: MockBalance, 
  currentKimchiData: any
) => {
  const initialTotalValue = 100000000 + (100000 * (currentKimchiData?.usdkrw || 1390));
  const currentBtcPrice = currentKimchiData?.upbit_price || 156000000;
  const currentUsdKrw = currentKimchiData?.usdkrw || 1390;
  
  const currentTotalValue = mockBalance.krw + 
                           (mockBalance.btc * currentBtcPrice) + 
                           (mockBalance.usdt * currentUsdKrw);
  
  const totalPnl = currentTotalValue - initialTotalValue;
  const profitRate = isFinite(initialTotalValue) && initialTotalValue > 0 
    ? ((totalPnl / initialTotalValue) * 100) 
    : 0;

  return { totalPnl, profitRate, currentTotalValue, initialTotalValue };
};

// 일일 통계 계산
export const calculateDailyStats = (
  mockTrades: MockTrade[], 
  mockPositions: MockPosition[]
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTrades = mockTrades.filter(trade => {
    const tradeDate = new Date(trade.timestamp);
    tradeDate.setHours(0, 0, 0, 0);
    return tradeDate.getTime() === today.getTime();
  });

  const todayPositions = mockPositions.filter(position => {
    const entryDate = new Date(position.entryTime);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  const totalTrades = todayTrades.length;
  const upbitTrades = todayTrades.filter(t => t.exchange === 'upbit').length;
  const binanceTrades = todayTrades.filter(t => t.exchange === 'binance').length;
  const totalFees = todayTrades.reduce((sum, trade) => sum + (trade.fee || 0), 0);
  const totalVolume = todayTrades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
  const activePositions = mockPositions.filter(p => p.status === 'open').length;
  const realizedPnl = mockPositions
    .filter(p => p.status === 'closed')
    .reduce((sum, p) => sum + ((p as any).realizedPnl || 0), 0);
  
  return {
    totalTrades,
    upbitTrades,
    binanceTrades,
    totalFees,
    totalVolume,
    activePositions,
    realizedPnl,
    newPositions: todayPositions.length
  };
};

// 최근 거래 필터링
export const getRecentTrades = (mockTrades: MockTrade[], strategies: any[]) => {
  return mockTrades
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
    .map(trade => {
      const strategy = strategies.find(s => s.id === (trade as any).strategyId);
      return {
        ...trade,
        strategyName: strategy?.name || (trade as any).strategyName || 'Unknown'
      };
    });
};

// 활성 포지션 수량 계산
export const calculateOpenQuantities = (mockPositions: MockPosition[]) => {
  const openPositions = mockPositions.filter(p => p.status === 'open');
  
  const rawOpenUpbitQty = openPositions.reduce((sum, p) => sum + (Number(p.upbitQuantity) || 0), 0);
  const rawOpenBinanceQty = openPositions.reduce((sum, p) => sum + (Number(p.binanceQuantity) || 0), 0);
  
  return { rawOpenUpbitQty, rawOpenBinanceQty };
};
