/**
 * Mock Trading 계산 유틸리티 (중앙화된 shared 모듈 사용)
 * @deprecated 이 파일은 호환성을 위해 유지되며, shared/utils/trading-calculations.ts를 re-export합니다.
 */

// Re-export all from shared
export {
  calculateProfitRate,
  calculateDailyStats,
  getRecentTrades,
  calculateOpenQuantities
} from '../../../../shared/utils/trading-calculations';
