// ===== 거래 저장 유틸리티 =====

// API 호출 함수
const apiFetch = async (url: string, options: RequestInit = {}) => {
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
export const saveTradeToDB = async (trade: any, userId: string, isLiveMode: boolean = false) => {
  if (!isLiveMode) {
    // Mock 모드: 로컬스토리지만 사용 (DB 저장 안함)
    console.log(`🧪 Mock 거래 - 로컬스토리지만 사용:`, trade.id);
    return;
  }
  
  // 실거래 모드: DB에 저장
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
        isMock: false, // 실거래는 항상 false
        strategyName: trade.strategyName || 'Unknown'
      })
    });
    console.log(`✅ 실거래 DB 저장 성공:`, trade.id);
  } catch (error) {
    console.error(`❌ 실거래 DB 저장 실패:`, error);
  }
};

export const savePositionToDB = async (position: any, userId: string, isLiveMode: boolean = false) => {
  if (!isLiveMode) {
    // Mock 모드: 로컬스토리지만 사용 (DB 저장 안함)
    console.log(`🧪 Mock 포지션 - 로컬스토리지만 사용:`, position.id);
    return;
  }
  
  // 실거래 모드: DB에 저장
  try {
    await apiFetch('/api/live-positions', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        ...position,
        userId: parseInt(userId),
        entryTime: position.entryTime.toISOString(),
        isMock: false // 실거래는 항상 false
      })
    });
    console.log('✅ 실거래 포지션 DB 저장 성공:', position.id);
  } catch (error) {
    console.error('❌ 실거래 포지션 DB 저장 실패:', error);
  }
};

export const updatePositionInDB = async (position: any, userId: string, isLiveMode: boolean = false) => {
  if (!isLiveMode) {
    // Mock 모드: DB 업데이트 안함
    console.log(`🧪 Mock 포지션 업데이트 - 로컬스토리지만 사용:`, position.id);
    return;
  }
  
  // 실거래 모드: DB 업데이트
  try {
    await apiFetch(`/api/live-positions/${position.id}`, {
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify({
        status: position.status,
        unrealizedPnl: position.unrealizedPnl,
        realizedPnl: position.realizedPnl
      })
    });
    console.log('✅ 실거래 포지션 DB 업데이트 성공:', position.id);
  } catch (error) {
    console.error('❌ 실거래 포지션 DB 업데이트 실패:', error);
  }
};

// 서버에서 거래 데이터 가져오기
export const fetchTradingDataFromServer = async () => {
  try {
    console.log('🔄 거래 데이터 동기화 시작...');
    
    // 거래 기록 가져오기 (수신 시 숫자 필드 정규화)
    const tradesResponse = await apiFetch('/api/trades');
    if (tradesResponse && Array.isArray(tradesResponse)) {
      const normalizedTrades = tradesResponse.map((t: any) => {
        const parsedQuantity = typeof t.quantity === 'string' ? parseFloat(t.quantity) : (t.quantity ?? 0);
        const parsedPrice = typeof t.price === 'string' ? parseFloat(t.price) : (t.price ?? 0);
        const parsedFee = typeof t.fee === 'string' ? parseFloat(t.fee) : (t.fee ?? 0);
        const side = (t.type ?? t.side ?? '').toString().toLowerCase();
        const exchange = (t.exchange ?? '').toString().toLowerCase();
        const ts = t.timestamp || t.createdAt || t.executedAt || Date.now();
        return {
          ...t,
          quantity: parsedQuantity,
          price: parsedPrice,
          fee: parsedFee,
          type: side || 'unknown',
          exchange: exchange || 'unknown',
          symbol: (t.symbol ?? 'BTC').toString().toUpperCase(),
          timestamp: new Date(ts),
        };
      });
      console.log('📈 거래 기록 로드:', normalizedTrades.length, '건');
      return normalizedTrades;
    }
    return [];
  } catch (error) {
    console.error('❌ 거래 데이터 동기화 실패:', error);
    return [];
  }
};
