// ===== 서버 트레이딩 상수 =====

export const LEVERAGE_CONFIG = {
  DEFAULT: 5,
  MIN: 1,
  MAX: 10
} as const;

// 레버리지 값 정규화 (서버용)
export const normalizeLeverage = (value: any): number => {
  const num = Number(value);
  if (!isFinite(num) || num < LEVERAGE_CONFIG.MIN) {
    return LEVERAGE_CONFIG.DEFAULT;
  }
  if (num > LEVERAGE_CONFIG.MAX) {
    return LEVERAGE_CONFIG.MAX;
  }
  return Math.round(num);
};
