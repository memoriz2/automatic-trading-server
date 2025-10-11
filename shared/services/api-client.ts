/**
 * 통합 API 클라이언트 (서버/클라이언트 공통)
 * 모든 API 호출을 중앙화하여 관리
 */

// ===== 타입 정의 =====

export interface KimchiPremiumData {
  symbol: string;
  upbitPrice: number;
  binanceFuturesPrice: number;
  usdKrwRate: number;
  premiumRate: number;
  timestamp: string;
}

export interface BalanceData {
  upbit: {
    krw: number;
    connected: boolean;
  };
  binance: {
    usdt: number;
    connected: boolean;
  };
}

export interface TradingStrategy {
  id: number;
  name: string;
  entryCondition: number;
  takeProfitCondition: number;
  tolerance: number;
  leverage: string;
  investmentAmount: string;
  isActive: boolean;
  crypto: string;
  strategyType: string;
}

export interface TradeOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell' | 'short' | 'cover';
  quantity: number;
  price: number;
  leverage?: number;
  exchange: 'upbit' | 'binance';
}

export interface TradeResult {
  success: boolean;
  orderId?: string;
  message: string;
  data?: any;
}

export interface LiveTrade {
  id: string | number;
  timestamp: Date | string;
  type: string;
  symbol: string;
  quantity: number;
  price: number;
  fee: number;
  exchange: 'upbit' | 'binance';
  strategyId?: number | string;
  premiumRate?: number;
  usdKrw?: number;
}

export interface LivePosition {
  id: string | number;
  strategyId?: number | string;
  strategyName?: string;
  symbol: string;
  entryTime: Date | string;
  entryPremiumRate: number;
  upbitQuantity: number;
  upbitPrice: number;
  entryUsdKrw?: number;
  binanceQuantity: number;
  binancePrice: number;
  status: string;
  exitTime?: Date | string | null;
  exitPremiumRate?: number | null;
  realizedPnL?: number | null;
}

// ===== API 클라이언트 클래스 =====

/**
 * API 호출 래퍼 함수 (클라이언트 전용)
 * 브라우저 환경에서만 사용 가능
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    credentials: 'include',
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
}

/**
 * 통합 API 클라이언트
 */
export class ApiClient {
  // ===== 시장 데이터 =====

  /**
   * 김치 프리미엄 조회
   */
  static async getKimchiPremium(apiFetchJson: any): Promise<KimchiPremiumData[]> {
    return await apiFetchJson('/api/kimchi-premium');
  }

  /**
   * 실시간 환율 조회
   */
  static async getExchangeRate(apiFetchJson: any): Promise<{ rate: number; timestamp: string; source: string }> {
    return await apiFetchJson('/api/exchange-rate');
  }

  // ===== 사용자 데이터 =====

  /**
   * 사용자 잔고 조회
   */
  static async getUserBalance(userId: string, apiFetchJson: any): Promise<BalanceData> {
    return await apiFetchJson(`/api/balances/${userId}`);
  }

  /**
   * 일일 통계 조회
   */
  static async getDailyStats(userId: string, apiFetchJson: any): Promise<{
    date: string;
    total_orders: number;
    entries: number;
    exits: number;
    profit_krw: number;
    fees_krw: number;
    net_profit_krw: number;
  }> {
    return await apiFetchJson(`/api/daily-stats/${userId}`);
  }

  // ===== 거래 전략 =====

  /**
   * 거래 전략 목록 조회
   */
  static async getTradingStrategies(apiFetchJson: any, userId?: string): Promise<TradingStrategy[]> {
    const endpoint = userId ? `/api/trading-strategies/${userId}` : '/api/trading-strategies';
    return await apiFetchJson(endpoint);
  }

  /**
   * 거래 전략 생성
   */
  static async createTradingStrategy(userId: string, strategy: Partial<TradingStrategy>, apiFetchJson: any): Promise<TradingStrategy> {
    return await apiFetchJson(`/api/trading-strategies/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy)
    });
  }

  /**
   * 거래 전략 업데이트
   */
  static async updateTradingStrategy(strategyId: string, updates: Partial<TradingStrategy>, apiFetchJson: any): Promise<TradingStrategy> {
    return await apiFetchJson(`/api/trading-strategies/${strategyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }

  /**
   * 거래 전략 삭제
   */
  static async deleteTradingStrategy(strategyId: string, apiFetchJson: any): Promise<{ success: boolean; message: string }> {
    return await apiFetchJson(`/api/trading-strategies/${strategyId}`, {
      method: 'DELETE'
    });
  }

  // ===== 자동매매 제어 =====

  /**
   * 자동매매 시작
   */
  static async startAutoTrading(userId: string, apiFetchJson: any): Promise<{ success: boolean; message: string }> {
    return await apiFetchJson(`/api/trading/start/${userId}`, {
      method: 'POST'
    });
  }

  /**
   * 자동매매 중지
   */
  static async stopAutoTrading(userId: string, apiFetchJson: any): Promise<{ success: boolean; message: string }> {
    return await apiFetchJson(`/api/trading/stop/${userId}`, {
      method: 'POST'
    });
  }

  /**
   * 자동매매 상태 조회
   */
  static async getTradingStatus(apiFetchJson: any): Promise<{
    isRunning: boolean;
    strategies: TradingStrategy[];
    activeStrategies: number;
  }> {
    return await apiFetchJson('/api/trading/status');
  }

  // ===== 거래소 연결 =====

  /**
   * 거래소 연결 상태 확인
   */
  static async getExchangeStatus(apiFetchJson: any): Promise<{
    connected: boolean;
    totalExchanges: number;
    connectedExchanges: number;
    exchanges: Record<string, any>;
  }> {
    return await apiFetchJson('/api/v2/exchanges/status');
  }

  // ===== 거래 기록 및 포지션 =====

  /**
   * 거래 기록 조회
   */
  static async getTrades(apiFetchJson: any, userId?: string): Promise<any[]> {
    const endpoint = userId ? `/api/trades?userId=${userId}` : '/api/trades';
    return await apiFetchJson(endpoint);
  }

  /**
   * 포지션 목록 조회
   */
  static async getPositions(apiFetchJson: any, userId?: string): Promise<any[]> {
    const endpoint = userId ? `/api/positions?userId=${userId}` : '/api/positions';
    return await apiFetchJson(endpoint);
  }
}

/**
 * 실거래 데이터 저장 서비스
 */
export class LiveTradingDataService {
  /**
   * 실거래 트레이드 DB 저장
   */
  static async saveLiveTradeToDB(trade: LiveTrade, userId: string): Promise<void> {
    try {
      await apiFetch('/api/live-trades', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          id: trade.id,
          timestamp: trade.timestamp instanceof Date ? trade.timestamp.toISOString() : trade.timestamp,
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
      throw error;
    }
  }

  /**
   * 실거래 포지션 DB 저장
   */
  static async saveLivePositionToDB(position: LivePosition, userId: string): Promise<void> {
    try {
      await apiFetch('/api/live-positions', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          id: position.id,
          strategyId: position.strategyId,
          strategyName: position.strategyName,
          symbol: position.symbol,
          entryTime: position.entryTime instanceof Date ? position.entryTime.toISOString() : position.entryTime,
          entryPremiumRate: position.entryPremiumRate,
          upbitQuantity: position.upbitQuantity,
          upbitPrice: position.upbitPrice,
          entryUsdKrw: position.entryUsdKrw,
          binanceQuantity: position.binanceQuantity,
          binancePrice: position.binancePrice,
          status: position.status,
          exitTime: position.exitTime instanceof Date ? position.exitTime.toISOString() : position.exitTime,
          exitPremiumRate: position.exitPremiumRate,
          realizedPnL: position.realizedPnL,
          isMock: false,
          userId
        })
      });
    } catch (error) {
      console.error('❌ 실거래 포지션 DB 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 실거래 포지션 DB 업데이트
   */
  static async updateLivePositionInDB(position: LivePosition, userId: string): Promise<void> {
    try {
      await apiFetch(`/api/live-positions/${position.id}`, {
        method: 'PUT',
        credentials: 'include',
        body: JSON.stringify({
          strategyId: position.strategyId,
          strategyName: position.strategyName,
          symbol: position.symbol,
          entryTime: position.entryTime instanceof Date ? position.entryTime.toISOString() : position.entryTime,
          entryPremiumRate: position.entryPremiumRate,
          upbitQuantity: position.upbitQuantity,
          upbitPrice: position.upbitPrice,
          entryUsdKrw: position.entryUsdKrw,
          binanceQuantity: position.binanceQuantity,
          binancePrice: position.binancePrice,
          status: position.status,
          exitTime: position.exitTime instanceof Date ? position.exitTime.toISOString() : position.exitTime,
          exitPremiumRate: position.exitPremiumRate,
          realizedPnL: position.realizedPnL,
          isMock: false,
          userId
        })
      });
    } catch (error) {
      console.error('❌ 실거래 포지션 DB 업데이트 실패:', error);
      throw error;
    }
  }
}

/**
 * 거래 실행 서비스
 */
export class TradingExecutionService {
  /**
   * 업비트 현물 매수 주문
   */
  static async executeUpbitBuy(params: {
    symbol: string;
    quantity: number;
    userId: string;
    strategyId?: string;
  }): Promise<TradeResult> {
    try {
      const response = await apiFetch('/api/trading/upbit/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: `KRW-${params.symbol}`,
          volume: params.quantity,
          ord_type: 'market',
          strategyId: params.strategyId
        })
      });

      if (response.success) {
        return {
          success: true,
          orderId: response.orderId,
          message: '업비트 매수 주문 성공',
          data: response
        };
      } else {
        throw new Error(response.message || '업비트 매수 주문 실패');
      }
    } catch (error) {
      return {
        success: false,
        message: `업비트 매수 실패: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 바이낸스 선물 숏 주문
   */
  static async executeBinanceShort(params: {
    symbol: string;
    quantity: number;
    leverage: number;
    userId: string;
    strategyId?: string;
  }): Promise<TradeResult> {
    try {
      const response = await apiFetch('/api/trading/binance/short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: `${params.symbol}USDT`,
          quantity: params.quantity,
          leverage: params.leverage,
          strategyId: params.strategyId
        })
      });

      if (response.success) {
        return {
          success: true,
          orderId: response.orderId,
          message: '바이낸스 숏 주문 성공',
          data: response
        };
      } else {
        throw new Error(response.message || '바이낸스 숏 주문 실패');
      }
    } catch (error) {
      return {
        success: false,
        message: `바이낸스 숏 실패: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 강제 진입 실행 (업비트 매수 + 바이낸스 숏)
   * 상세 구현 버전 (tradingExecution.ts에서)
   */
  static async executeForceEntry(params: {
    symbol: string;
    upbitQuantity: number;
    binanceQuantity: number;
    leverage: number;
    userId: string;
    currentKimp: number;
    strategyId?: string;
  }): Promise<TradeResult> {
    try {
      // 1. 바이낸스 숏 주문 (먼저 실행)
      const binanceResult = await this.executeBinanceShort({
        symbol: params.symbol,
        quantity: params.binanceQuantity,
        leverage: params.leverage,
        userId: params.userId,
        strategyId: params.strategyId
      });

      if (!binanceResult.success) {
        return binanceResult;
      }

      // 2. 업비트 매수 주문
      const upbitResult = await this.executeUpbitBuy({
        symbol: params.symbol,
        quantity: params.upbitQuantity,
        userId: params.userId,
        strategyId: params.strategyId
      });

      if (!upbitResult.success) {
        return upbitResult;
      }

      return {
        success: true,
        message: '강제 진입 성공',
        data: {
          upbit: upbitResult.data,
          binance: binanceResult.data,
          kimp: params.currentKimp
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `강제 진입 실패: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 포지션 청산 (업비트 매도 + 바이낸스 커버)
   */
  static async executePositionClose(params: {
    symbol: string;
    upbitQuantity: number;
    binanceQuantity: number;
    userId: string;
    positionId: string;
  }): Promise<TradeResult> {
    try {
      // 1. 업비트 매도 주문
      const upbitSellResponse = await apiFetch('/api/trading/upbit/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: params.symbol,
          quantity: params.upbitQuantity,
          userId: params.userId,
          positionId: params.positionId
        })
      });

      // 2. 바이낸스 커버 주문
      const binanceCoverResponse = await apiFetch('/api/trading/binance/close-short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: params.symbol,
          quantity: params.binanceQuantity,
          userId: params.userId,
          positionId: params.positionId
        })
      });

      return {
        success: upbitSellResponse.success && binanceCoverResponse.success,
        message: '포지션 청산 완료',
        data: {
          upbit: upbitSellResponse,
          binance: binanceCoverResponse
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `포지션 청산 실패: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 간단한 강제 진입 API (apiClient.ts에서)
   */
  static async executeForceEntrySimple(params: {
    symbol: string;
    quantity: number;
    leverage: number;
    currentKimp: number;
    userId: string;
  }, apiFetchJson: any): Promise<{ success: boolean; message: string; data?: any }> {
    return await apiFetchJson('/api/force-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  }
}
