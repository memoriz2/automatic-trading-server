import { LEVERAGE_LIMITS } from '../../../../shared/utils/leverage';

export const TRADING_CONSTANTS = {
  DEFAULT_TOLERANCE: '0.1',
  DEFAULT_LEVERAGE: String(LEVERAGE_LIMITS.MIN),   // '1'
  DEFAULT_AMOUNT_BTC: '',
  MIN_AMOUNT_BTC: 0.001,
  MAX_LEVERAGE: LEVERAGE_LIMITS.RECOMMENDED_MAX,   // 20
  SPARK_DATA_POINTS: 300, // 5시간 (300분)
  UPDATE_INTERVAL: 60000, // 1분
  RETRY_DELAY: 3000,
  MAX_RETRIES: 3
} as const;

export const UI_CONSTANTS = {
  MODAL_ANIMATION_DURATION: 200,
  TOAST_DURATION: 3000,
  LOADING_DEBOUNCE: 500
} as const;

export const API_ENDPOINTS = {
  SESSION_INFO: '/api/admin/session',
  BANDS: '/api/bands',
  MARKET_DATA: '/api/market-data',
  POSITIONS: '/api/positions'
} as const;