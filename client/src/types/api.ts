// ===== API 연결 관련 타입 =====

export interface ApiKeyForm {
  exchange: 'upbit' | 'binance';
  apiKey: string;
  secretKey: string;
  passphrase?: string; // 바이낸스용
}

export interface ExchangeConnection {
  exchange: 'upbit' | 'binance';
  connected: boolean;
  lastChecked: string;
  error?: string;
  permissions?: string[];
  balanceAvailable: boolean;
  tradingEnabled: boolean;
}

export interface ExchangeStatus {
  connected: boolean;
  totalExchanges: number;
  connectedExchanges: number;
  exchanges: {
    upbit: ExchangeConnection;
    binance: ExchangeConnection;
  };
  message?: string;
}

// ===== 잔고 관련 타입 =====

export interface Balance {
  exchange: 'upbit' | 'binance';
  currency: string;
  available: number;
  locked: number;
  total: number;
  usdValue?: number;
  krwValue?: number;
}

export interface BalanceInfo {
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
    upbit: Balance[];
    binance: Balance[];
  };
  lastUpdated: string;
}

// ===== 주문 관련 타입 =====

export interface OrderRequest {
  exchange: 'upbit' | 'binance';
  symbol: string;
  side: 'buy' | 'sell' | 'short' | 'cover';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  leverage?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  clientOrderId?: string;
}

export interface OrderInfo {
  id: number;
  userId: number;
  exchange: 'upbit' | 'binance';
  exchangeOrderId: string;
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
  createdAt: string;
  updatedAt: string;
  filledAt?: string;
}

// ===== 포지션 관련 타입 =====

export interface PositionInfo {
  id: number;
  userId: number;
  strategyId?: number;
  symbol: string;
  side: 'long' | 'short';
  status: 'open' | 'closed' | 'liquidated';
  
  // 업비트 정보
  upbitQuantity: number;
  upbitEntryPrice: number;
  upbitCurrentPrice?: number;
  upbitOrderId?: string;
  
  // 바이낸스 정보
  binanceQuantity: number;
  binanceEntryPrice: number;
  binanceCurrentPrice?: number;
  binanceLeverage: number;
  binanceOrderId?: string;
  
  // 김치 프리미엄 정보
  entryPremiumRate: number;
  currentPremiumRate?: number;
  
  // 손익 정보
  unrealizedPnl: number;
  realizedPnl?: number;
  totalFees: number;
  
  // 시간 정보
  entryTime: string;
  exitTime?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface PositionSummary {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  totalFees: number;
  totalInvestment: number;
  profitRate: number;
}

// ===== 거래 관련 타입 =====

export interface TradeInfo {
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
  executedAt: string;
  createdAt: string;
}

// ===== 청산 관련 타입 =====

export interface LiquidationRequest {
  positionId?: number;
  symbol?: string;
  percentage?: number;
  reason: 'manual' | 'stop_loss' | 'take_profit' | 'liquidation' | 'emergency';
}

export interface LiquidationResult {
  success: boolean;
  positionId: number;
  upbitOrderId?: string;
  binanceOrderId?: string;
  realizedPnl: number;
  totalFees: number;
  message: string;
  executedAt: string;
}

// ===== API 응답 타입 =====

export interface ApiError {
  code: string;
  message: string;
  exchange?: 'upbit' | 'binance';
  orderId?: string;
  details?: any;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  requestId?: string;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ===== 실시간 데이터 타입 =====

export interface MarketData {
  symbol: string;
  upbitPrice: number;
  binancePrice: number;
  kimchiPremium: number;
  usdKrw: number;
  timestamp: string;
}

export interface WebSocketEvent {
  type: 'balance_update' | 'order_update' | 'trade_execution' | 'position_update' | 'market_data' | 'error';
  userId: number;
  data: any;
  timestamp: string;
}

// ===== 전략 관련 타입 =====

export interface StrategyInfo {
  id: number;
  userId: number;
  name: string;
  symbol: string;
  isActive: boolean;
  
  // 진입 조건
  entryPremiumRate: number;
  entryAmount: number;
  leverage: number;
  tolerance: number;
  
  // 청산 조건
  takeProfitRate: number;
  stopLossRate?: number;
  
  // 통계
  executionCount: number;
  totalProfit: number;
  profitRate: number;
  
  createdAt: string;
  updatedAt: string;
}

// ===== 유틸리티 타입 =====

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ===== 타입 가드 함수들 =====

export function isApiErrorResponse(response: ApiResponse): response is ApiErrorResponse {
  return !response.success;
}

export function isApiSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success;
}
