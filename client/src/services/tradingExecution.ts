/**
 * 거래 실행 서비스 (중앙화된 shared 모듈 사용)
 * @deprecated 이 파일은 호환성을 위해 유지되며, shared/services/api-client.ts를 사용합니다.
 */

import {
  TradingExecutionService as SharedTradingExecutionService,
  type TradeOrder,
  type TradeResult
} from '../../../shared/services/api-client';

// Re-export types
export type { TradeOrder, TradeResult };

/**
 * 래퍼 클래스 - shared 거래 실행 서비스로 위임
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
    return SharedTradingExecutionService.executeUpbitBuy(params);
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
    return SharedTradingExecutionService.executeBinanceShort(params);
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
    return SharedTradingExecutionService.executeForceEntry(params);
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
    return SharedTradingExecutionService.executePositionClose(params);
  }
}
