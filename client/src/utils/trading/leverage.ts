// ===== 레버리지 관련 중앙 집중화 =====

export const LEVERAGE_CONFIG = {
  DEFAULT: 5,
  MIN: 1,
  MAX: 10,
  STEP: 1
} as const;

// 레버리지 값 정규화 (유효성 검증 및 기본값 적용)
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

// 레버리지 입력값 파싱 (문자열 → 숫자)
export const parseLeverage = (input: string | number | undefined | null): number => {
  if (input === undefined || input === null || input === '') {
    return LEVERAGE_CONFIG.DEFAULT;
  }
  return normalizeLeverage(input);
};

// 레버리지 유효성 검증
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

// 레버리지 기반 투자금 계산
export const calculateInvestmentWithLeverage = (
  baseAmount: number,
  leverage: number,
  btcPrice: number
): number => {
  const validLeverage = normalizeLeverage(leverage);
  return parseFloat((baseAmount / validLeverage / btcPrice).toFixed(3));
};
