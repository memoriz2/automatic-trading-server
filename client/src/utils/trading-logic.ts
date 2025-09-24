import { TRADING_CONSTANTS } from '@/constants/trading-constants';
import { LivePosition, KimchiData, Strategy } from '@/types/trading';

// 가격 데이터 유효성 검증
export const isValidPriceData = (data: any): boolean => {
  return data &&
    typeof data.kimp === 'number' &&
    data.upbit_price > 0 &&
    data.binance_price > 0 &&
    data.usdkrw > 0;
};

// 진입 조건 체크
export const checkEntryCondition = (
  strategy: Strategy,
  currentPremium: number,
  prevPremium: number | null,
  currentPosition: LivePosition | undefined
): { entryOk: boolean; crossedEntry: boolean; diffEntry: number } => {
  const entryRate = parseFloat(strategy.entryCondition);
  const tolerance = parseFloat(strategy.tolerance || String(TRADING_CONSTANTS.TOLERANCE.DEFAULT));

  const diffEntry = Math.abs(currentPremium - entryRate);
  const crossedEntry = prevPremium !== null &&
    (prevPremium - entryRate) * (currentPremium - entryRate) <= 0 &&
    Math.abs(prevPremium - entryRate) > tolerance;

  const entryOk = !currentPosition && (diffEntry <= tolerance || crossedEntry);

  return { entryOk, crossedEntry, diffEntry };
};

// 청산 조건 체크
export const checkExitCondition = (
  strategy: Strategy,
  currentPremium: number,
  currentPosition: LivePosition | undefined
): boolean => {
  const exitRate = parseFloat(strategy.takeProfitCondition);
  return !!(currentPosition && exitRate <= currentPremium);
};

// 쿨다운 체크
export const checkCooldown = (
  strategyId: string,
  lastActionAt: { [key: string]: number }
): boolean => {
  const now = Date.now();
  const lastAction = lastActionAt[strategyId] || 0;
  return now - lastAction < TRADING_CONSTANTS.COOLDOWN_MS;
};

// 거래 계산
export const calculateTradingAmounts = (
  strategy: Strategy,
  upbitPrice: number,
  binancePrice: number,
  usdKrw: number
) => {
  const baseAmount = parseFloat(strategy.investmentAmount);
  const leverage = parseInt(strategy.leverage);

  // 바이낸스 선물 숏
  const binanceShortAmountBTC = baseAmount;
  const binanceShortValueUSD = binanceShortAmountBTC * binancePrice;
  const binanceMargin = binanceShortValueUSD / leverage;
  const binanceFee = binanceShortValueUSD * TRADING_CONSTANTS.FEES.BINANCE;

  // 업비트 현물 매수
  const upbitBuyAmountBTC = binanceShortAmountBTC;
  const upbitBuyAmountKRW = upbitBuyAmountBTC * upbitPrice;
  const upbitFee = upbitBuyAmountKRW * TRADING_CONSTANTS.FEES.UPBIT;
  const totalUpbitCost = upbitBuyAmountKRW + upbitFee;

  return {
    binanceShortAmountBTC,
    binanceShortValueUSD,
    binanceMargin,
    binanceFee,
    upbitBuyAmountBTC,
    upbitBuyAmountKRW,
    upbitFee,
    totalUpbitCost
  };
};

// 로그 디버깅 함수
export const logEntryConditions = (
  strategy: Strategy,
  currentPremium: number,
  entryRate: number,
  diffEntry: number,
  tolerance: number,
  crossedEntry: boolean,
  currentPosition: LivePosition | undefined,
  entryOk: boolean,
  livePositions: LivePosition[],
  lastActionAt: { [key: string]: number }
) => {
  if (strategy.name && diffEntry <= tolerance + 1.0) {
    const now = Date.now();
    const lastAction = lastActionAt[strategy.id] || 0;

    console.log(`🔍 [${strategy.name}] 진입 조건 체크:`, {
      현재김프: `${currentPremium.toFixed(3)}%`,
      목표진입: `${entryRate}%`,
      오차: `${diffEntry.toFixed(3)}%`,
      허용오차: `${tolerance}%`,
      오차조건만족: diffEntry <= tolerance,
      교차조건만족: crossedEntry,
      포지션없음: !currentPosition,
      포지션개수: livePositions.length,
      전략활성화: strategy.isActive !== false,
      최종진입가능: entryOk,
      쿨다운체크: `${Math.max(0, TRADING_CONSTANTS.COOLDOWN_MS - (now - lastAction))}ms 남음`
    });

    if (!entryOk) {
      const reason = [];
      if (currentPosition) reason.push('이미 포지션 보유중');
      if (diffEntry > tolerance && !crossedEntry) reason.push('허용오차 초과 및 교차점 미통과');
      console.log(`❌ [${strategy.name}] 진입 불가 이유:`, reason.join(', '));
    }
  }
};