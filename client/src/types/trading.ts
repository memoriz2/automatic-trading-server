// ===== 중앙화된 타입 import =====
import type { PositionDisplay } from '../../../shared/types/position';

export interface KimchiPremium {
  symbol: string;
  upbitPrice: number;
  binancePrice?: number;
  binanceFuturesPrice?: number;
  premiumRate: number;
  timestamp: string; // 혹은 Date
  exchangeRate?: number;
  usdKrwRate?: number;
  binancePriceKRW?: number;
}

// 중앙화된 Position 타입 사용 (re-export)
export type Position = PositionDisplay;

export interface Trade {
  id: number;
  userId: number;
  positionId?: number | null;
  strategyId?: number | null;
  symbol: string;
  side: 'buy' | 'sell' | 'short' | 'cover';
  exchange: 'upbit' | 'binance';
  quantity: number;
  price: number;
  fee?: number;
  orderType?: string;
  exchangeOrderId?: string;
  exchangeTradeId?: string;
  executedAt: string;
  createdAt: string;
  // 계산된 필드들
  amount?: number;
  profit?: number;
  type?: 'buy' | 'sell' | 'short' | 'cover'; // side와 동일하지만 호환성을 위해 유지
  strategyName?: string; // 전략 이름
}

export interface TradingSettings {
  id: number;
  userId: number;
  entryPremiumRate: string;
  exitPremiumRate: string;
  stopLossRate: string;
  maxPositions: number;
  isAutoTrading: boolean;
  maxInvestmentAmount?: string;
  // 새로운 김프 전략 설정값들
  kimchiEntryRate?: string;     // 진입 김프율
  kimchiExitRate?: string;      // 청산 김프율  
  kimchiToleranceRate?: string; // 허용 오차 진입 김프율
  binanceLeverage?: number;     // 바이낸스 레버리지
  upbitEntryAmount?: string;    // 업비트 기준 진입 금액(KRW)
}

export interface SystemAlert {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: 'kimchi-premium' | 'trading-status' | 'alerts' | 'ping' | 'pong';
  data?: KimchiPremium | TradingSettings | SystemAlert[] | number | null;
}

// ===== Mock Trading 관련 타입 (기존 Mock 시스템용) =====

export interface MockPosition {
  id: string;
  strategyId: string;
  symbol: string;
  status: 'open' | 'closed';
  
  // 업비트 정보
  upbitQuantity: number;
  upbitPrice: number;
  
  // 바이낸스 정보  
  binanceQuantity: number;
  binancePrice: number;
  leverage: number;
  
  // 김치 프리미엄
  entryPremiumRate: number;
  
  // 시간
  entryTime: number;
  exitTime?: number;
  
  // 메타데이터
  userId: string;
}

export interface MockBalance {
  krw: number;
  btc: number;
  usdt: number;
  binanceBtc: number;
  binanceSpotBtc: number;
  binanceUsdt: number;
}

export interface MockTrade {
  id: string;
  positionId: string;
  type: 'entry' | 'exit';
  exchange: 'upbit' | 'binance';
  side: 'buy' | 'sell' | 'short' | 'cover';
  quantity: number;
  price: number;
  timestamp: number;
  fee: number;
  userId: string;
}

// ===== Live Trading 관련 타입 =====

export interface LiveBalance {
  krw: number;
  btc: number;
  usdt: number;
  binanceBtc: number;
  binanceSpotBtc: number;
  binanceUsdt: number;
}

export interface LiveTrade {
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
  usdKrw?: number;
}

export interface LivePosition {
  id: string;
  strategyId: string;
  strategyName?: string;
  symbol: string;
  type?: string; // 포지션 타입 (force_entry 등)
  entryTime: Date;
  entryPremiumRate: number;
  upbitQuantity: number;
  upbitPrice: number;
  entryUsdKrw?: number;
  binanceSpotQuantity: number;
  binanceQuantity: number;
  binancePrice: number;
  binanceSpotPrice?: number;
  leverage: number;
  status: 'open' | 'closed';
  exitTime?: Date;
  exitPremiumRate?: number;
  realizedPnL?: number;
  realizedPnl: number; // 기존 코드와 호환성
  unrealizedPnl: number;
  upbitOrderId?: string;
  binanceOrderId?: string;
  isRealTrade?: boolean;
  takeProfitTargets?: any; // 강제진입 익절 구간
}

export interface KimchiData {
  kimp: number;
  upbit_price: number;
  binance_price: number;
  usdkrw: number;
  symbol?: string;
  timestamp?: string | Date;
  isRealTimeValid?: boolean;
  dataAge?: number;
}

export interface Strategy {
  id: string;
  name: string;
  entryCondition: string;
  takeProfitCondition: string;
  tolerance: string;
  investmentAmount: string;
  leverage: string;
  isActive: boolean;
}
