/**
 * 포지션 타입 정의 (중앙 관리)
 *
 * 모든 포지션 관련 타입은 이 파일을 사용해야 합니다.
 */

// ===== 공통 베이스 타입 =====

/**
 * 포지션 기본 필드 (서버/클라이언트 공통)
 */
export interface BasePosition {
  id: number | string;
  userId?: number;
  strategyId?: number | null;
  symbol: string;
  side: 'long' | 'short';
  status: 'open' | 'closed' | 'liquidated' | 'active' | 'pending';

  // 진입/청산 시간
  entryTime: Date | string;
  exitTime?: Date | string | null;

  // 김치프리미엄 정보
  entryPremiumRate: number;
  currentPremiumRate?: number | null;

  // 기타
  type?: string;
  isMock?: boolean;
  leverage?: number;
}

/**
 * 완전한 포지션 정보 (가장 상세한 필드)
 * API 응답, DB 저장용으로 사용
 */
export interface PositionInfo extends BasePosition {
  id: number;
  userId: number;

  // 업비트 정보
  upbitQuantity: number;
  upbitPrice: number;
  upbitEntryPrice?: number;
  upbitCurrentPrice?: number;
  upbitOrderId?: string | null;

  // 바이낸스 정보
  binanceQuantity: number;
  binancePrice: number;
  binanceEntryPrice?: number;
  binanceLeverage?: number;
  binanceOrderId?: string | null;

  // 환율 정보
  entryUsdKrw: number;
  currentUsdKrw?: number;

  // 손익 정보
  unrealizedPnl?: number | null;
  realizedPnl?: number | null;
  totalFees?: number;
  profitLossRate?: number;
  profitLossAmount?: number;

  // 청산 정보
  exitPrice?: number | null;
  exitPremiumRate?: number | null;

  // 재진입 방지용
  remainingQuantity?: number;

  // 디바이스 정보
  ip?: string;
  deviceType?: string;

  // 타임스탬프
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * PnL 계산용 최소 포지션 정보
 */
export interface PositionForPnL {
  id: string | number;
  upbitQuantity: number;
  upbitPrice: number;
  binanceQuantity: number;
  binancePrice: number;
  leverage: number;
  entryPremiumRate: number;
}

/**
 * UI 표시용 간소화된 포지션
 */
export interface PositionDisplay {
  id: number | string;
  symbol: string;
  type: string;
  entryPrice: number;
  currentPrice?: number;
  quantity: number;
  entryPremiumRate: number;
  currentPremiumRate?: number;
  profitLossRate?: number;
  profitLossAmount?: number;
  status: 'active' | 'closed' | 'pending';
  entryTime: Date | string;
  exitTime?: Date | string;
}

/**
 * 포지션 요약 정보
 */
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

// ===== DTO (서버 전용) =====

/**
 * 서버 포지션 DTO (데이터베이스 모델과 매핑)
 */
export interface PositionDto {
  id: number;
  userId: number;
  strategyId?: number;
  symbol: string;
  type: string;
  side: 'long' | 'short';
  status: 'open' | 'closed' | 'liquidated';
  entryPrice: number;
  currentPrice?: number;
  quantity: number;

  // 바이낸스 선물 정보
  binanceQuantity?: number;
  binanceEntryPrice?: number;
  binanceLeverage?: number;

  // 김치 프리미엄 정보
  entryPremiumRate: number;
  currentPremiumRate?: number;

  // 손익 정보
  unrealizedPnl: number;
  realizedPnl?: number;
  totalFees: number;

  // 재진입 방지용 (부분 청산 추적)
  remainingQuantity?: number;

  // 시간 정보
  entryTime: Date;
  exitTime?: Date;

  // 거래소 주문 ID
  upbitOrderId?: string;
  binanceOrderId?: string;

  // 디바이스 정보
  ip?: string;
  deviceType?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ===== 헬퍼 타입 =====

/**
 * 포지션 진입 요청
 */
export interface PositionEntryRequest {
  strategyId: number;
  symbol: string;
  side: 'buy' | 'sell' | 'short' | 'cover';
  exchange: 'upbit' | 'binance';
  deviceId?: string;
  deviceType?: string;
}

/**
 * 포지션 진입 응답
 */
export interface PositionEntryResponse {
  allowed: boolean;
  message?: string;
  error?: string;
  existingPosition?: {
    id: number;
    symbol: string;
    side: string;
    entryTime: string;
    unrealizedPnl: number;
  };
  suggestedApi?: string;
  deviceInfo?: {
    deviceId: string;
    deviceType: string;
  };
}

// ===== 타입 가드 =====

/**
 * PositionInfo 타입 가드
 */
export function isPositionInfo(pos: any): pos is PositionInfo {
  return (
    pos &&
    typeof pos.id === 'number' &&
    typeof pos.userId === 'number' &&
    typeof pos.upbitQuantity === 'number' &&
    typeof pos.binanceQuantity === 'number'
  );
}

/**
 * PositionForPnL 타입 가드
 */
export function isPositionForPnL(pos: any): pos is PositionForPnL {
  return (
    pos &&
    (typeof pos.id === 'string' || typeof pos.id === 'number') &&
    typeof pos.upbitQuantity === 'number' &&
    typeof pos.upbitPrice === 'number' &&
    typeof pos.binanceQuantity === 'number' &&
    typeof pos.binancePrice === 'number' &&
    typeof pos.leverage === 'number' &&
    typeof pos.entryPremiumRate === 'number'
  );
}
