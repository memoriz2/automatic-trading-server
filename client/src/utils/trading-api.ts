import { LiveTrade, LivePosition } from '@/types/trading';

// API 호출 함수
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

// 거래 저장 함수들
export const saveLiveTradeToDB = async (trade: LiveTrade, userId: string) => {
  try {
    await apiFetch('/api/live-trades', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        id: trade.id,
        timestamp: trade.timestamp.toISOString(),
        type: trade.type,
        symbol: trade.symbol,
        quantity: trade.quantity,
        price: trade.price,
        fee: trade.fee,
        exchange: trade.exchange,
        strategyId: trade.strategyId,
        premiumRate: trade.premiumRate,
        usdKrw: trade.usdKrw,
        isMock: false,
        userId
      })
    });
  } catch (error) {
    console.error(`❌ 실거래 DB 저장 실패:`, error);
  }
};

export const saveLivePositionToDB = async (position: LivePosition, userId: string) => {
  try {
    await apiFetch('/api/live-positions', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        id: position.id,
        strategyId: position.strategyId,
        strategyName: position.strategyName,
        symbol: position.symbol,
        entryTime: position.entryTime.toISOString(),
        entryPremiumRate: position.entryPremiumRate,
        upbitQuantity: position.upbitQuantity,
        upbitPrice: position.upbitPrice,
        entryUsdKrw: position.entryUsdKrw,
        binanceQuantity: position.binanceQuantity,
        binancePrice: position.binancePrice,
        status: position.status,
        exitTime: position.exitTime?.toISOString(),
        exitPremiumRate: position.exitPremiumRate,
        realizedPnL: position.realizedPnL,
        isMock: false,
        userId
      })
    });
  } catch (error) {
    console.error('❌ 실거래 포지션 DB 저장 실패:', error);
  }
};

export const updateLivePositionInDB = async (position: LivePosition, userId: string) => {
  try {
    await apiFetch(`/api/live-positions/${position.id}`, {
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify({
        strategyId: position.strategyId,
        strategyName: position.strategyName,
        symbol: position.symbol,
        entryTime: position.entryTime.toISOString(),
        entryPremiumRate: position.entryPremiumRate,
        upbitQuantity: position.upbitQuantity,
        upbitPrice: position.upbitPrice,
        entryUsdKrw: position.entryUsdKrw,
        binanceQuantity: position.binanceQuantity,
        binancePrice: position.binancePrice,
        status: position.status,
        exitTime: position.exitTime?.toISOString(),
        exitPremiumRate: position.exitPremiumRate,
        realizedPnL: position.realizedPnL,
        isMock: false,
        userId
      })
    });
  } catch (error) {
    console.error('❌ 실거래 포지션 DB 업데이트 실패:', error);
  }
};