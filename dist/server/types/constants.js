// ===== 거래소 관련 상수 =====
export const EXCHANGES = {
    UPBIT: 'upbit',
    BINANCE: 'binance'
};
// ===== 주문 관련 상수 =====
export const ORDER_SIDES = {
    BUY: 'buy',
    SELL: 'sell',
    SHORT: 'short',
    COVER: 'cover'
};
export const ORDER_TYPES = {
    MARKET: 'market',
    LIMIT: 'limit'
};
export const ORDER_STATUS = {
    PENDING: 'pending',
    FILLED: 'filled',
    PARTIALLY_FILLED: 'partially_filled',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected'
};
export const TIME_IN_FORCE = {
    GTC: 'GTC', // Good Till Cancelled
    IOC: 'IOC', // Immediate or Cancel
    FOK: 'FOK' // Fill or Kill
};
// ===== 포지션 관련 상수 =====
export const POSITION_SIDES = {
    LONG: 'long',
    SHORT: 'short'
};
export const POSITION_STATUS = {
    OPEN: 'open',
    CLOSED: 'closed',
    LIQUIDATED: 'liquidated'
};
// ===== 청산 관련 상수 =====
export const LIQUIDATION_REASONS = {
    MANUAL: 'manual',
    STOP_LOSS: 'stop_loss',
    TAKE_PROFIT: 'take_profit',
    LIQUIDATION: 'liquidation',
    EMERGENCY: 'emergency'
};
// ===== WebSocket 이벤트 상수 =====
export const WS_EVENT_TYPES = {
    BALANCE_UPDATE: 'balance_update',
    ORDER_UPDATE: 'order_update',
    TRADE_EXECUTION: 'trade_execution',
    POSITION_UPDATE: 'position_update',
    MARKET_DATA: 'market_data',
    ERROR: 'error'
};
// ===== 통화 관련 상수 =====
export const CURRENCIES = {
    KRW: 'KRW',
    USD: 'USD',
    USDT: 'USDT',
    BTC: 'BTC',
    ETH: 'ETH'
};
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
};
// ===== 수수료 관련 상수 =====
export const TRADING_FEES = {
    UPBIT: {
        MAKER: 0.0005, // 0.05%
        TAKER: 0.0005 // 0.05%
    },
    BINANCE: {
        SPOT: {
            MAKER: 0.001, // 0.1%
            TAKER: 0.001 // 0.1%
        },
        FUTURES: {
            MAKER: 0.0002, // 0.02%
            TAKER: 0.0004 // 0.04%
        }
    }
};
// ===== 레버리지 관련 상수 =====
export const LEVERAGE_LIMITS = {
    BINANCE: {
        BTC: { min: 1, max: 125 },
        ETH: { min: 1, max: 100 },
        DEFAULT: { min: 1, max: 20 }
    }
};
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
};
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
};
// ===== 기본값 상수 =====
export const DEFAULTS = {
    LEVERAGE: 1,
    SLIPPAGE_TOLERANCE: 0.01, // 1%
    MAX_POSITIONS: 10,
    MIN_ORDER_SIZE_USD: 10,
    MIN_ORDER_SIZE_KRW: 5000,
    HEARTBEAT_INTERVAL: 30000, // 30초
    RECONNECT_INTERVAL: 5000, // 5초
    MAX_RECONNECT_ATTEMPTS: 5
};
