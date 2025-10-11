/**
 * PnL 계산 함수 (중앙화된 shared 모듈 사용)
 * @deprecated 이 파일은 호환성을 위해 유지되며, shared/utils/trading-calculations.ts를 re-export합니다.
 */

import type { PositionForPnL as Position } from '../../../shared/types/position';

// Re-export all from shared
export {
  calculatePositionPnL,
  type MarketData,
  type PnLResult
} from '../../../shared/utils/trading-calculations';

// 호환성을 위해 re-export
export type { Position };