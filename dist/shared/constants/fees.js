/**
 * 거래소 수수료율 중앙 관리
 *
 * 모든 거래 수수료 계산은 이 파일의 상수를 사용해야 합니다.
 * 수수료율 변경 시 이 파일만 수정하면 전체 시스템에 반영됩니다.
 */
// ===== 수수료율 상수 =====
/**
 * 업비트 현물 거래 수수료 (0.05%)
 */
export const UPBIT_SPOT_FEE = 0.0005;
/**
 * 바이낸스 선물 메이커 수수료 (0.02%)
 */
export const BINANCE_FUTURES_MAKER_FEE = 0.0002;
/**
 * 바이낸스 선물 테이커 수수료 (0.04%)
 */
export const BINANCE_FUTURES_TAKER_FEE = 0.0004;
/**
 * 바이낸스 현물 메이커 수수료 (0.1%)
 */
export const BINANCE_SPOT_MAKER_FEE = 0.001;
/**
 * 바이낸스 현물 테이커 수수료 (0.1%)
 */
export const BINANCE_SPOT_TAKER_FEE = 0.001;
// ===== 수수료 구조체 (호환성 유지) =====
/**
 * 거래소별 수수료 구조 (constants.ts와 호환)
 */
export const TRADING_FEES = {
    UPBIT: {
        MAKER: UPBIT_SPOT_FEE,
        TAKER: UPBIT_SPOT_FEE
    },
    BINANCE: {
        SPOT: {
            MAKER: BINANCE_SPOT_MAKER_FEE,
            TAKER: BINANCE_SPOT_TAKER_FEE
        },
        FUTURES: {
            MAKER: BINANCE_FUTURES_MAKER_FEE,
            TAKER: BINANCE_FUTURES_TAKER_FEE
        }
    }
};
// ===== 수수료 계산 헬퍼 함수 =====
/**
 * 업비트 현물 거래 수수료 계산
 * @param amount 거래 금액 (KRW)
 * @returns 수수료 (KRW)
 */
export function calculateUpbitFee(amount) {
    return amount * UPBIT_SPOT_FEE;
}
/**
 * 바이낸스 선물 거래 수수료 계산 (테이커 기준)
 * @param amount 거래 금액 (USD)
 * @returns 수수료 (USD)
 */
export function calculateBinanceFuturesFee(amount) {
    return amount * BINANCE_FUTURES_TAKER_FEE;
}
/**
 * 바이낸스 현물 거래 수수료 계산
 * @param amount 거래 금액 (USD/USDT)
 * @param isMaker 메이커 주문 여부
 * @returns 수수료 (USD/USDT)
 */
export function calculateBinanceSpotFee(amount, isMaker = false) {
    return amount * (isMaker ? BINANCE_SPOT_MAKER_FEE : BINANCE_SPOT_TAKER_FEE);
}
