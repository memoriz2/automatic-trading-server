/**
 * 실거래 API (중앙화된 shared 모듈 사용)
 * @deprecated 이 파일은 호환성을 위해 유지되며, shared/services/api-client.ts를 사용합니다.
 */

import {
  LiveTradingDataService,
  type LiveTrade,
  type LivePosition
} from '../../../shared/services/api-client';

// Re-export types
export type { LiveTrade, LivePosition };

/**
 * 실거래 저장 함수들 - shared 모듈로 위임
 */
export const saveLiveTradeToDB = async (trade: LiveTrade, userId: string) => {
  return LiveTradingDataService.saveLiveTradeToDB(trade, userId);
};

export const saveLivePositionToDB = async (position: LivePosition, userId: string) => {
  return LiveTradingDataService.saveLivePositionToDB(position, userId);
};

export const updateLivePositionInDB = async (position: LivePosition, userId: string) => {
  return LiveTradingDataService.updateLivePositionInDB(position, userId);
};

// apiFetch는 더 이상 필요하지 않음 (shared 모듈에서 내부적으로 처리)
// 호환성을 위해 필요하다면 shared에서 re-export 가능
export { apiFetch } from '../../../shared/services/api-client';
