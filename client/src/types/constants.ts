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

// ===== UI 관련 상수 =====

export const TRADING_MODES = {
  MOCK: 'mock',
  REAL: 'real'
} as const;

export type TradingMode = typeof TRADING_MODES[keyof typeof TRADING_MODES];

export const THEME_COLORS = {
  SUCCESS: 'text-green-400',
  ERROR: 'text-red-400',
  WARNING: 'text-yellow-400',
  INFO: 'text-blue-400',
  NEUTRAL: 'text-slate-400'
} as const;

export const STATUS_COLORS = {
  CONNECTED: 'bg-green-500',
  DISCONNECTED: 'bg-red-500',
  PENDING: 'bg-yellow-500',
  LOADING: 'bg-blue-500'
} as const;

// ===== 수수료 관련 상수 =====
// 중앙화된 수수료율을 사용 (shared/constants/fees.ts)
export { TRADING_FEES } from '../../../shared/constants/fees';

// ===== 기본값 상수 =====

export const DEFAULTS = {
  LEVERAGE: 1,
  SLIPPAGE_TOLERANCE: 0.01, // 1%
  MAX_POSITIONS: 10,
  MIN_ORDER_SIZE_USD: 10,
  MIN_ORDER_SIZE_KRW: 5000,
  REFRESH_INTERVAL: 1000,    // 1초
  HEARTBEAT_INTERVAL: 30000, // 30초
  RECONNECT_INTERVAL: 5000,  // 5초
  MAX_RECONNECT_ATTEMPTS: 5,
  
  // Mock Trading 기본값
  MOCK_BALANCE: {
    KRW: 100000000,  // 1억원
    BTC: 0,
    USDT: 100000,    // 10만 USDT
    BINANCE_BTC: 0,
    BINANCE_SPOT_BTC: 0,
    BINANCE_USDT: 100000
  }
} as const;

// ===== 에러 메시지 상수 =====

export const ERROR_MESSAGES = {
  CONNECTION_FAILED: '거래소 연결에 실패했습니다.',
  AUTHENTICATION_FAILED: 'API 키 인증에 실패했습니다.',
  INSUFFICIENT_BALANCE: '잔고가 부족합니다.',
  ORDER_FAILED: '주문 실행에 실패했습니다.',
  POSITION_NOT_FOUND: '포지션을 찾을 수 없습니다.',
  LIQUIDATION_FAILED: '청산에 실패했습니다.',
  RATE_LIMIT_EXCEEDED: 'API 요청 한도를 초과했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
} as const;

// ===== 성공 메시지 상수 =====

export const SUCCESS_MESSAGES = {
  CONNECTION_SUCCESS: '거래소에 성공적으로 연결되었습니다.',
  ORDER_SUCCESS: '주문이 성공적으로 실행되었습니다.',
  POSITION_OPENED: '포지션이 성공적으로 열렸습니다.',
  POSITION_CLOSED: '포지션이 성공적으로 청산되었습니다.',
  STRATEGY_CREATED: '전략이 성공적으로 생성되었습니다.',
  STRATEGY_UPDATED: '전략이 성공적으로 수정되었습니다.',
  STRATEGY_DELETED: '전략이 성공적으로 삭제되었습니다.'
} as const;

// ===== 포맷팅 관련 상수 =====

export const FORMATTERS = {
  CURRENCY: {
    KRW: (value: number) => `₩${value.toLocaleString()}`,
    USD: (value: number) => `$${value.toLocaleString()}`,
    USDT: (value: number) => `${value.toLocaleString()} USDT`,
    BTC: (value: number) => `${value.toFixed(8)} BTC`
  },
  PERCENTAGE: (value: number) => `${value.toFixed(2)}%`,
  DECIMAL: (value: number, decimals: number = 2) => value.toFixed(decimals)
} as const;

// ===== 애니메이션 관련 상수 =====

export const ANIMATIONS = {
  FADE_IN: 'animate-fade-in',
  FADE_OUT: 'animate-fade-out',
  SLIDE_UP: 'animate-slide-up',
  SLIDE_DOWN: 'animate-slide-down',
  SPIN: 'animate-spin',
  PULSE: 'animate-pulse',
  BOUNCE: 'animate-bounce'
} as const;

// ===== 차트 관련 상수 =====

export const CHART_COLORS = {
  PROFIT: '#10b981',    // green-500
  LOSS: '#ef4444',      // red-500
  NEUTRAL: '#6b7280',   // gray-500
  PRIMARY: '#3b82f6',   // blue-500
  SECONDARY: '#8b5cf6', // violet-500
  GRID: '#374151'       // gray-700
} as const;
