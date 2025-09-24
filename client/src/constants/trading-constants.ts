// Trading System Constants
export const TRADING_CONSTANTS = {
  // 쿨다운 시간 (밀리초)
  COOLDOWN_MS: 30000, // 30초

  // 경고 간격
  PRICE_DATA_WARNING_INTERVAL: 30000, // 30초
  REENTRY_TOAST_INTERVAL_MS: 10000, // 10초

  // 수수료율
  FEES: {
    UPBIT: 0.0005, // 0.05%
    BINANCE: 0.0004 // 0.04%
  },

  // 기본값
  DEFAULTS: {
    USD_KRW: 1390,
    TIMEOUT_CLEANUP: 10000 // 10초
  },

  // 허용오차
  TOLERANCE: {
    DEFAULT: 0.1, // 0.1%
    MIN_KIMCHI_RATE: 5.0 // 5.0%
  }
} as const;

// Trading Mode Types
export type TradingMode = 'real';

export const TRADING_MODES = {
  REAL: 'real' as const
} as const;