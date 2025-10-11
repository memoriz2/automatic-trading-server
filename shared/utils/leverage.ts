/**
 * 레버리지 설정 및 계산 중앙 관리
 *
 * 모든 레버리지 관련 로직은 이 파일을 사용해야 합니다.
 */

// ===== 레버리지 설정 상수 =====

/**
 * 기본 레버리지 설정 (안전 권장 범위)
 */
export const LEVERAGE_CONFIG = {
  DEFAULT: 5,              // 기본 레버리지
  MIN: 1,                  // 최소 레버리지
  MAX: 20,                 // 권장 최대 레버리지 (안전한 범위)
  STEP: 1,                 // 레버리지 증감 단위
  BINANCE_MAX: 125         // 바이낸스 선물 최대 레버리지 (위험)
} as const;

/**
 * 상세 레버리지 한도 (거래소별)
 */
export const LEVERAGE_LIMITS = {
  MIN: 1,
  MAX: 125,               // 절대 최대값 (바이낸스 기준)
  RECOMMENDED_MAX: 20,    // 안전 권장 최대값
  DEFAULT: 5
} as const;

// ===== 레버리지 유틸리티 함수 =====

/**
 * 레버리지 값 정규화 (유효성 검증 및 기본값 적용)
 * @param value 입력 레버리지 값
 * @returns 정규화된 레버리지 값
 */
export const normalizeLeverage = (value: any): number => {
  const num = Number(value);
  if (!isFinite(num) || num < LEVERAGE_CONFIG.MIN) {
    return LEVERAGE_CONFIG.DEFAULT;
  }
  if (num > LEVERAGE_CONFIG.MAX) {
    return LEVERAGE_CONFIG.MAX;
  }
  return Math.round(num); // 정수로 반올림
};

/**
 * 레버리지 입력값 파싱 (문자열 → 숫자)
 * @param input 입력값 (문자열/숫자/null/undefined)
 * @returns 파싱된 레버리지 값
 */
export const parseLeverage = (input: string | number | undefined | null): number => {
  if (input === undefined || input === null || input === '') {
    return LEVERAGE_CONFIG.DEFAULT;
  }
  return normalizeLeverage(input);
};

/**
 * 레버리지 유효성 검증
 * @param value 검증할 레버리지 값
 * @returns 검증 결과 및 에러 메시지
 */
export const validateLeverage = (value: number): { isValid: boolean; message?: string } => {
  if (!isFinite(value)) {
    return { isValid: false, message: '레버리지는 숫자여야 합니다.' };
  }
  if (value < LEVERAGE_CONFIG.MIN) {
    return { isValid: false, message: `레버리지는 최소 ${LEVERAGE_CONFIG.MIN}배여야 합니다.` };
  }
  if (value > LEVERAGE_CONFIG.MAX) {
    return { isValid: false, message: `레버리지는 최대 ${LEVERAGE_CONFIG.MAX}배까지 가능합니다.` };
  }
  return { isValid: true };
};

/**
 * 레버리지 기반 투자금 계산
 * @param baseAmount 기본 투자 금액
 * @param leverage 레버리지 배율
 * @param btcPrice BTC 가격
 * @returns 실제 투자할 BTC 수량
 */
export const calculateInvestmentWithLeverage = (
  baseAmount: number,
  leverage: number,
  btcPrice: number
): number => {
  const validLeverage = normalizeLeverage(leverage);
  return parseFloat((baseAmount / validLeverage / btcPrice).toFixed(3));
};
