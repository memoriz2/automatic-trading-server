/**
 * 거래 관련 상수 정의
 */

export const TRADING_LIMITS = {
  BTC: {
    MIN_QUANTITY: 0.0001,
    MAX_QUANTITY: 10,
    MIN_PRICE: 50000000,   // 5천만원
    MAX_PRICE: 500000000,  // 5억원
  },
  ETH: {
    MIN_QUANTITY: 0.001,
    MAX_QUANTITY: 100,
    MIN_PRICE: 1000000,    // 100만원
    MAX_PRICE: 20000000,   // 2천만원
  },
  USDT: {
    MIN_BALANCE: 10,
    MAX_BALANCE: 1000000,
  },
  KRW: {
    MIN_BALANCE: 5000,
    MAX_BALANCE: 1000000000,
  }
} as const;

export const LEVERAGE_LIMITS = {
  MIN: 1,
  MAX: 125,
  RECOMMENDED_MAX: 20,
  DEFAULT: 5
} as const;

export const PREMIUM_RATE_LIMITS = {
  MIN: -50,
  MAX: 50,
  TOLERANCE_MIN: 0.01,
  TOLERANCE_MAX: 5
} as const;

export const TRADING_INTERVALS = {
  PRICE_UPDATE: 3000,      // 3초
  BALANCE_UPDATE: 60000,   // 1분
  STRATEGY_CHECK: 5000,    // 5초
  HEARTBEAT: 15000,        // 15초
  RECONNECT_BASE: 3000,    // 3초
  RECONNECT_MAX: 30000     // 30초
} as const;

export const STORAGE_KEYS = {
  BALANCE: (userId: string) => `live-balance-${userId}`,
  POSITIONS: (userId: string) => `live-positions-${userId}`,
  TRADES: (userId: string) => `live-trades-${userId}`,
  STRATEGIES: (userId: string) => `mock-strategies-${userId}`,
  CHART_DATA: 'spark-chart-data',
  FORCE_ENTRY_SETTINGS: 'force-entry-settings',
  AUTH_TOKEN: 'authToken',
  USER_ID: 'x-user-id'
} as const;

export const API_ENDPOINTS = {
  // 인증
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  
  // 거래
  KIMCHI_PREMIUM: '/api/kimchi-premium',
  EXCHANGE_RATE: '/api/exchange-rate',
  TRADING_START: (userId: string) => `/api/trading/start/${userId}`,
  TRADING_STOP: (userId: string) => `/api/trading/stop/${userId}`,
  TRADING_STATUS: '/api/trading/status',
  
  // 잔고 및 포지션
  BALANCES: (userId: string) => `/api/balances/${userId}`,
  POSITIONS: '/api/positions',
  TRADES: '/api/trades',
  
  // 전략
  STRATEGIES: (userId?: string) => userId ? `/api/trading-strategies/${userId}` : '/api/trading-strategies',
  STRATEGY: (id: string) => `/api/trading-strategies/${id}`,
  
  // 거래소
  EXCHANGES_STATUS: '/api/v2/exchanges/status',
  EXCHANGE_TEST: '/api/v2/exchanges/test',
  
  // 기타
  FORCE_ENTRY: '/api/force-entry',
  DAILY_STATS: (userId: string) => `/api/daily-stats/${userId}`
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요',
  AUTH_REQUIRED: '로그인이 필요합니다',
  INSUFFICIENT_BALANCE: '잔고가 부족합니다',
  INVALID_QUANTITY: '거래 수량이 올바르지 않습니다',
  INVALID_LEVERAGE: '레버리지 설정이 올바르지 않습니다',
  STRATEGY_NOT_FOUND: '전략을 찾을 수 없습니다',
  POSITION_NOT_FOUND: '포지션을 찾을 수 없습니다',
  TRADING_ALREADY_RUNNING: '이미 자동매매가 실행 중입니다',
  TRADING_NOT_RUNNING: '자동매매가 실행되지 않고 있습니다'
} as const;

export const SUCCESS_MESSAGES = {
  TRADING_STARTED: '자동매매가 시작되었습니다',
  TRADING_STOPPED: '자동매매가 중지되었습니다',
  STRATEGY_CREATED: '전략이 생성되었습니다',
  STRATEGY_UPDATED: '전략이 업데이트되었습니다',
  STRATEGY_DELETED: '전략이 삭제되었습니다',
  POSITION_CLOSED: '포지션이 청산되었습니다',
  FORCE_ENTRY_SUCCESS: '강제 진입이 완료되었습니다'
} as const;

export const WEBSOCKET_CONFIG = {
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000,
  HEARTBEAT_INTERVAL: 15000,
  HEARTBEAT_TIMEOUT: 10000,
  CONNECTION_TIMEOUT: 10000
} as const;
