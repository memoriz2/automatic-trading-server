// ===== 거래소 관련 상수 =====

export const EXCHANGES = {
  UPBIT: 'upbit',
  BINANCE: 'binance'
} as const;

export type Exchange = typeof EXCHANGES[keyof typeof EXCHANGES];

// ===== 주문 관련 상수 =====

export const ORDER_SIDES = {
  BUY: 'buy',
  SELL: 'sell',
  SHORT: 'short',
  COVER: 'cover'
} as const;

export type OrderSide = typeof ORDER_SIDES[keyof typeof ORDER_SIDES];

export const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit'
} as const;

export type OrderType = typeof ORDER_TYPES[keyof typeof ORDER_TYPES];

export const ORDER_STATUS = {
  PENDING: 'pending',
  FILLED: 'filled',
  PARTIALLY_FILLED: 'partially_filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const TIME_IN_FORCE = {
  GTC: 'GTC', // Good Till Cancelled
  IOC: 'IOC', // Immediate or Cancel
  FOK: 'FOK'  // Fill or Kill
} as const;

export type TimeInForce = typeof TIME_IN_FORCE[keyof typeof TIME_IN_FORCE];

// ===== 포지션 관련 상수 =====

export const POSITION_SIDES = {
  LONG: 'long',
  SHORT: 'short'
} as const;

export type PositionSide = typeof POSITION_SIDES[keyof typeof POSITION_SIDES];

export const POSITION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  LIQUIDATED: 'liquidated'
} as const;

export type PositionStatus = typeof POSITION_STATUS[keyof typeof POSITION_STATUS];

// ===== 청산 관련 상수 =====

export const LIQUIDATION_REASONS = {
  MANUAL: 'manual',
  STOP_LOSS: 'stop_loss',
  TAKE_PROFIT: 'take_profit',
  LIQUIDATION: 'liquidation',
  EMERGENCY: 'emergency'
} as const;

export type LiquidationReason = typeof LIQUIDATION_REASONS[keyof typeof LIQUIDATION_REASONS];

// ===== WebSocket 이벤트 상수 =====

export const WS_EVENT_TYPES = {
  BALANCE_UPDATE: 'balance_update',
  ORDER_UPDATE: 'order_update',
  TRADE_EXECUTION: 'trade_execution',
  POSITION_UPDATE: 'position_update',
  MARKET_DATA: 'market_data',
  ERROR: 'error'
} as const;

export type WSEventType = typeof WS_EVENT_TYPES[keyof typeof WS_EVENT_TYPES];

// ===== 통화 관련 상수 =====

export const CURRENCIES = {
  KRW: 'KRW',
  USD: 'USD',
  USDT: 'USDT',
  BTC: 'BTC',
  ETH: 'ETH'
} as const;

export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];

// ===== 심볼 관련 상수 =====

export const SYMBOLS = {
  UPBIT: {
    BTC_KRW: 'BTC-KRW',
    ETH_KRW: 'ETH-KRW'
  },
  BINANCE: {
    BTCUSDT: 'BTCUSDT',
    ETHUSDT: 'ETHUSDT'
  }
} as const;

// ===== 수수료 관련 상수 =====
// 중앙화된 수수료율을 사용 (shared/constants/fees.ts)
export { TRADING_FEES } from '../../shared/constants/fees.js';

// ===== 레버리지 관련 상수 =====

export const LEVERAGE_LIMITS = {
  BINANCE: {
    BTC: { min: 1, max: 125 },
    ETH: { min: 1, max: 100 },
    DEFAULT: { min: 1, max: 20 }
  }
} as const;

// ===== API 제한 관련 상수 =====

export const API_LIMITS = {
  UPBIT: {
    REQUESTS_PER_SECOND: 10,
    REQUESTS_PER_MINUTE: 600,
    ORDERS_PER_SECOND: 8,
    ORDERS_PER_MINUTE: 200
  },
  BINANCE: {
    REQUESTS_PER_SECOND: 20,
    REQUESTS_PER_MINUTE: 1200,
    ORDERS_PER_SECOND: 10,
    ORDERS_PER_MINUTE: 100
  }
} as const;

// ===== 에러 코드 상수 =====

export const ERROR_CODES = {
  // 연결 관련
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // 잔고 관련
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  BALANCE_FETCH_FAILED: 'BALANCE_FETCH_FAILED',
  
  // 주문 관련
  ORDER_FAILED: 'ORDER_FAILED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_REJECTED: 'ORDER_REJECTED',
  INVALID_ORDER_SIZE: 'INVALID_ORDER_SIZE',
  INVALID_ORDER_PRICE: 'INVALID_ORDER_PRICE',
  
  // 포지션 관련
  POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
  LIQUIDATION_FAILED: 'LIQUIDATION_FAILED',
  
  // 시장 관련
  MARKET_CLOSED: 'MARKET_CLOSED',
  SYMBOL_NOT_SUPPORTED: 'SYMBOL_NOT_SUPPORTED',
  PRICE_OUT_OF_RANGE: 'PRICE_OUT_OF_RANGE',
  
  // 시스템 관련
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ===== 기본값 상수 =====

export const DEFAULTS = {
  LEVERAGE: 1,
  SLIPPAGE_TOLERANCE: 0.01, // 1%
  MAX_POSITIONS: 10,
  MIN_ORDER_SIZE_USD: 10,
  MIN_ORDER_SIZE_KRW: 5000,
  HEARTBEAT_INTERVAL: 30000, // 30초
  RECONNECT_INTERVAL: 5000,  // 5초
  MAX_RECONNECT_ATTEMPTS: 5
} as const;

// ===== 거래 관련 상수 =====

export const TRADING_CONSTANTS = {
  // BTC 최소 거래 단위
  BTC_MIN_QUANTITY: 0.0001,

  // 기본 가격 (fallback)
  DEFAULT_UPBIT_BTC_PRICE: 160000000, // 1억 6천만원
  DEFAULT_BINANCE_BTC_PRICE_USD: 115000, // 11만 5천 달러

  // 쿨다운 시간 (청산 후 재진입 대기 시간)
  MIN_ENTRY_COOLDOWN_MS: 1 * 60 * 1000, // 1분 (60초)

  // 재시도 횟수
  BALANCE_CHECK_RETRY_COUNT: 3,
  ORDER_RETRY_COUNT: 3,

  // 안전 마진
  SAFE_SELL_MARGIN: 0.99, // 99%
  SAFE_SELL_MARGIN_PRECISE: 0.999, // 99.9%

  // 최소 거래 금액
  MIN_TRADE_AMOUNT_KRW: 5000,
  MIN_TRADE_AMOUNT_USD: 10,

  // 허용 오차
  DEFAULT_TOLERANCE: 0.001,
  MIN_TOLERANCE: 0.0001,
  MAX_TOLERANCE: 1.0,

  // 재시도 지연 시간
  RETRY_DELAYS: [2000, 4000, 6000], // 2초, 4초, 6초

  // API 호출 지연
  API_CALL_DELAY: 1000, // 1초

  // 청산 비율 한계
  MIN_LIQUIDATION_RATIO: 80, // 80%

  // 수량 차이 임계값
  MIN_QUANTITY_DIFFERENCE: 0.0001
} as const;
