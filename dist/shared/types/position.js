/**
 * 포지션 타입 정의 (중앙 관리)
 *
 * 모든 포지션 관련 타입은 이 파일을 사용해야 합니다.
 */
// ===== 타입 가드 =====
/**
 * PositionInfo 타입 가드
 */
export function isPositionInfo(pos) {
    return (pos &&
        typeof pos.id === 'number' &&
        typeof pos.userId === 'number' &&
        typeof pos.upbitQuantity === 'number' &&
        typeof pos.binanceQuantity === 'number');
}
/**
 * PositionForPnL 타입 가드
 */
export function isPositionForPnL(pos) {
    return (pos &&
        (typeof pos.id === 'string' || typeof pos.id === 'number') &&
        typeof pos.upbitQuantity === 'number' &&
        typeof pos.upbitPrice === 'number' &&
        typeof pos.binanceQuantity === 'number' &&
        typeof pos.binancePrice === 'number' &&
        typeof pos.leverage === 'number' &&
        typeof pos.entryPremiumRate === 'number');
}
