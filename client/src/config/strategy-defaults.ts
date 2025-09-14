// ===== 전략 및 거래 기본값 설정 =====

export const STRATEGY_DEFAULTS = {
  // 레버리지 설정
  LEVERAGE: '1',                    // 기본 레버리지 1배
  LEVERAGE_NUMERIC: 1,              // 숫자형 기본 레버리지
  
  // 투자 관련 - 기본값 0 (사용자 입력 필요)
  BASE_AMOUNT: '0',                 // 기본 투자금액 (KRW)
  INVESTMENT_AMOUNT: '0.000',       // 기본 투자수량 (BTC) - 소수점 3자리
  
  // 진입/청산 조건
  ENTRY_CONDITION: '0.0',           // 기본 진입 조건 (%) - 소수점 1자리
  TAKE_PROFIT_CONDITION: '0.0',     // 기본 청산 조건 (%) - 소수점 1자리
  TOLERANCE: '0.05',                // 기본 허용오차 (%)
  
  // 리스크 관리
  RISK_LEVEL: 'moderate' as const,  // 기본 리스크 레벨
} as const;

// 새 전략 초기 상태
export const getInitialStrategy = () => ({
  name: '',
  crypto: 'BTC',
  entryCondition: STRATEGY_DEFAULTS.ENTRY_CONDITION,
  takeProfitCondition: STRATEGY_DEFAULTS.TAKE_PROFIT_CONDITION,
  baseAmount: STRATEGY_DEFAULTS.BASE_AMOUNT,
  investmentAmount: STRATEGY_DEFAULTS.INVESTMENT_AMOUNT,
  leverage: STRATEGY_DEFAULTS.LEVERAGE,
  tolerance: STRATEGY_DEFAULTS.TOLERANCE,
  riskLevel: STRATEGY_DEFAULTS.RISK_LEVEL,
  activateImmediately: false,
});

// 안전한 값 가져오기 함수들
export const getSafeLeverage = (value?: string | number): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return Math.max(1, parsed || STRATEGY_DEFAULTS.LEVERAGE_NUMERIC);
};

export const getSafeStrategy = (strategy: any, currentBtcPrice?: number) => {
  const safeLeverage = getSafeLeverage(strategy.leverage);
  const safeInvestmentAmount = parseFloat(strategy.investmentAmount) || 0;
  
  // baseAmount 계산: 투자수량(BTC) × BTC가격 × 레버리지
  const calculatedBaseAmount = currentBtcPrice && safeInvestmentAmount > 0 
    ? Math.round(safeInvestmentAmount * currentBtcPrice * safeLeverage)
    : (strategy.baseAmount ? parseInt(strategy.baseAmount) : 0);

  return {
    ...strategy,
    leverage: strategy.leverage || STRATEGY_DEFAULTS.LEVERAGE,
    tolerance: strategy.tolerance || STRATEGY_DEFAULTS.TOLERANCE,
    baseAmount: calculatedBaseAmount.toString(),
    investmentAmount: strategy.investmentAmount || STRATEGY_DEFAULTS.INVESTMENT_AMOUNT,
    entryCondition: strategy.entryCondition || STRATEGY_DEFAULTS.ENTRY_CONDITION,
    takeProfitCondition: strategy.takeProfitCondition || STRATEGY_DEFAULTS.TAKE_PROFIT_CONDITION,
    riskLevel: strategy.riskLevel || STRATEGY_DEFAULTS.RISK_LEVEL,
  };
};
