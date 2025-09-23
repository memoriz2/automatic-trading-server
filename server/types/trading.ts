// ===== 거래소 연결 관련 DTO =====

export interface ApiKeyDto {
  id?: number;
  userId: number;
  exchange: 'upbit' | 'binance';
  apiKey: string;
  secretKey: string;
  passphrase?: string; // 바이낸스에서 사용
  isActive: boolean;
  permissions?: string[]; // ['spot', 'futures', 'margin'] 등
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExchangeConnectionDto {
  exchange: 'upbit' | 'binance';
  connected: boolean;
  lastChecked: Date;
  error?: string;
  permissions?: string[];
  balanceAvailable: boolean;
  tradingEnabled: boolean;
}

export interface ExchangeStatusResponseDto {
  connected: boolean;
  totalExchanges: number;
  connectedExchanges: number;
  exchanges: {
    upbit: ExchangeConnectionDto;
    binance: ExchangeConnectionDto;
  };
  message?: string;
}

// ===== 잔고 관련 DTO =====

export interface BalanceDto {
  exchange: 'upbit' | 'binance';
  currency: string; // 'KRW', 'BTC', 'USDT' 등
  available: number; // 사용 가능한 잔고
  locked: number; // 주문 중 잠긴 잔고
  total: number; // 총 잔고 (available + locked)
  usdValue?: number; // USD 환산 가치
  krwValue?: number; // KRW 환산 가치
}

export interface BalanceResponseDto {
  real: {
    krw?: number;
    btc_upbit?: number;
    usdt?: number;
    [key: string]: number | undefined;
  };
  connected: {
    upbit: boolean;
    binance: boolean;
  };
  balances?: {
    upbit: BalanceDto[];
    binance: BalanceDto[];
  };
  lastUpdated: Date;
}

// ===== 주문 관련 DTO =====

export interface OrderRequestDto {
  userId: number;
  exchange: 'upbit' | 'binance';
  symbol: string; // 'BTC-KRW', 'BTCUSDT' 등
  side: 'buy' | 'sell' | 'short' | 'cover';
  type: 'market' | 'limit';
  quantity: number;
  price?: number; // limit 주문 시 필수
  leverage?: number; // 선물 거래 시 사용
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  clientOrderId?: string; // 클라이언트 주문 ID
}

export interface OrderResponseDto {
  id: number;
  userId: number;
  exchange: 'upbit' | 'binance';
  exchangeOrderId: string; // 거래소에서 발급한 주문 ID
  symbol: string;
  side: 'buy' | 'sell' | 'short' | 'cover';
  type: 'market' | 'limit';
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  price?: number;
  averagePrice?: number;
  fee: number;
  feeCurrency: string;
  createdAt: Date;
  updatedAt: Date;
  filledAt?: Date;
}

// ===== 포지션 관련 DTO =====

export interface PositionDto {
  id: number;
  userId: number;
  strategyId?: number;
  symbol: string;
  type: string;
  side: 'long' | 'short';
  status: 'open' | 'closed' | 'liquidated';
  entryPrice: number;
  currentPrice?: number;
  quantity: number;

  // 바이낸스 선물 정보
  binanceQuantity?: number;
  binanceEntryPrice?: number;
  binanceLeverage?: number;
  
  // 김치 프리미엄 정보
  entryPremiumRate: number;
  currentPremiumRate?: number;
  
  // 손익 정보
  unrealizedPnl: number;
  realizedPnl?: number;
  totalFees: number;
  
  // 재진입 방지용 (부분 청산 추적)
  remainingQuantity?: number;
  
  // 시간 정보
  entryTime: Date;
  exitTime?: Date;
  
  // 거래소 주문 ID
  upbitOrderId?: string;
  binanceOrderId?: string;
  
  // 디바이스 정보 (어떤 디바이스에서 진입했는지)
  ip?: string;
  deviceType?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PositionSummaryDto {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  totalFees: number;
  totalInvestment: number;
  profitRate: number;
}

// ===== 체결 관련 DTO =====

export interface TradeDto {
  id: number;
  userId: number;
  positionId?: number;
  orderId: number;
  exchange: 'upbit' | 'binance';
  exchangeTradeId: string;
  symbol: string;
  side: 'buy' | 'sell' | 'short' | 'cover';
  quantity: number;
  price: number;
  fee: number;
  feeCurrency: string;
  executedAt: Date;
  createdAt: Date;
}

// ===== 청산 관련 DTO =====

export interface LiquidationRequestDto {
  userId: number;
  positionId?: number; // 특정 포지션 청산
  symbol?: string; // 특정 심볼 전체 청산
  percentage?: number; // 부분 청산 비율 (1-100)
  reason: 'manual' | 'stop_loss' | 'take_profit' | 'liquidation' | 'emergency';
}

export interface LiquidationResponseDto {
  success: boolean;
  positionId: number;
  upbitOrderId?: string;
  binanceOrderId?: string;
  realizedPnl: number;
  totalFees: number;
  message: string;
  executedAt: Date;
}

// ===== 에러 관련 DTO =====

export interface TradingErrorDto {
  code: string;
  message: string;
  exchange?: 'upbit' | 'binance';
  orderId?: string;
  details?: any;
  timestamp: Date;
}

export interface ApiErrorResponseDto {
  success: false;
  error: TradingErrorDto;
  requestId?: string;
}

// ===== 공통 응답 DTO =====

export interface ApiSuccessResponseDto<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: Date;
}

export type ApiResponseDto<T = any> = ApiSuccessResponseDto<T> | ApiErrorResponseDto;

// ===== 실시간 데이터 DTO =====

export interface MarketDataDto {
  symbol: string;
  upbitPrice: number;
  binancePrice: number;
  kimchiPremium: number;
  usdKrw: number;
  timestamp: Date;
}

export interface WebSocketEventDto {
  type: 'balance_update' | 'order_update' | 'trade_execution' | 'position_update' | 'market_data' | 'error';
  userId: number;
  data: any;
  timestamp: Date;
}

// ===== 포지션 관련 DTO =====

// ===== 전략 관련 DTO =====

export interface StrategyDto {
  id: number;
  userId: number;
  name: string;
  symbol: string;
  isActive: boolean;
  
  // 진입 조건
  entryPremiumRate: number;
  entryAmount: number; // KRW 기준
  leverage: number;
  tolerance: number; // 허용 오차
  
  // 청산 조건
  takeProfitRate: number;
  stopLossRate?: number;
  
  // 통계
  executionCount: number;
  totalProfit: number;
  profitRate: number;
  
  createdAt: Date;
  updatedAt: Date;
}
