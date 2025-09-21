import { apiFetch } from '@/lib/queryClient';

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

      if ((response as any).success) {
        return {
          success: true,
          orderId: (response as any).orderId,
          message: '업비트 매수 주문 성공',
          data: response
        };
      } else {
        throw new Error((response as any).message || '업비트 매수 주문 실패');
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

      if ((response as any).success) {
        return {
          success: true,
          orderId: (response as any).orderId,
          message: '바이낸스 숏 주문 성공',
          data: response
        };
      } else {
        throw new Error((response as any).message || '바이낸스 숏 주문 실패');
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
        // 바이낸스 주문 취소 시도 (롤백)
        // TODO: 바이낸스 주문 취소 로직 구현
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
        success: (upbitSellResponse as any).success && (binanceCoverResponse as any).success,
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
}
