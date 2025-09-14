// ===== 계산 유틸리티 함수들 =====
import { LEVERAGE_CONFIG } from './leverage';

// 투자 수량 보정: 서버 원화 금액/비정상 값이 들어왔을 때 안전한 BTC 수량으로 변환
export const normalizeAmountBtc = (raw: any, upbitPrice?: number): number => {
  let amt = Number(raw ?? 0) || 0;
  // 원화 금액(100 이상) 또는 과도한 수량은 변환/클램프
  if (amt >= 100 && upbitPrice && upbitPrice > 0) {
    amt = +(amt / upbitPrice).toFixed(3);
  }
  if (!isFinite(amt) || amt <= 0) amt = 0.001;
  if (amt > 10) amt = 0.001; // 상식적 한도 초과 시 최소값
  return Math.max(0.001, amt);
};

// 서버 전략 → UI 밴드 매핑
export const mapStrategyToBand = (s: any) => ({
  name: s?.name,
  target_kimp: Number(s?.entryRate),
  exit_kimp: Number(s?.exitRate),
  tolerance: Number(s?.toleranceRate ?? s?.tolerance ?? 0.1),
  leverage: Number(s?.leverage ?? LEVERAGE_CONFIG.DEFAULT),
  // 현재 서버는 BTC 수량을 investmentAmount로 보관 중 → 역매핑
  amount_btc: Number(s?.investmentAmount ?? 0) || 0,
  serverId: s?.id,
});

// 진입 거래 계산
export const calculateEntryTrade = (
  baseAmount: number,
  leverage: number,
  upbitPrice: number,
  binancePrice: number,
  entryUsdKrw: number
) => {
  // 1단계: 바이낸스 선물 숏 포지션 (기준 수량)
  const binanceShortAmountBTC = baseAmount;
  const binanceShortValueUSD = binanceShortAmountBTC * binancePrice;
  const binanceMargin = binanceShortValueUSD / leverage;
  const binanceFee = binanceShortValueUSD * 0.0004;

  // 2단계: 업비트 현물 매수 (동일 수량)
  const upbitBuyAmountBTC = binanceShortAmountBTC;
  const upbitBuyAmountKRW = upbitBuyAmountBTC * upbitPrice;
  const upbitFee = upbitBuyAmountKRW * 0.0005;
  const totalUpbitCost = upbitBuyAmountKRW + upbitFee;

  // 총 투자 원금 (KRW 기준)
  const totalInvestedKRW = totalUpbitCost + (binanceMargin + binanceFee) * entryUsdKrw;

  return {
    binanceShortAmountBTC,
    binanceShortValueUSD,
    binanceMargin,
    binanceFee,
    upbitBuyAmountBTC,
    upbitBuyAmountKRW,
    upbitFee,
    totalUpbitCost,
    totalInvestedKRW
  };
};

// 청산 거래 계산
export const calculateExitTrade = (
  position: any,
  currentUpbitPrice: number,
  currentBinancePrice: number,
  currentUsdKrw: number,
  ratio: number = 1.0
) => {
  // 청산할 수량 계산
  const upbitSellQuantity = position.upbitQuantity * ratio;
  const binanceCloseQuantity = position.binanceQuantity * ratio;

  // 업비트 매도 계산
  const upbitSellRevenue = upbitSellQuantity * currentUpbitPrice;
  const upbitFee = upbitSellRevenue * 0.0005;
  const upbitNetRevenue = upbitSellRevenue - upbitFee;

  // 바이낸스 선물 커버 계산
  const binanceCoverCost = binanceCloseQuantity * currentBinancePrice;
  const binanceFee = binanceCoverCost * 0.0004;
  const binanceMarginReturn = (position.binanceQuantity * position.binancePrice / position.leverage) * ratio;
  const binanceNetReturn = binanceMarginReturn - binanceCoverCost - binanceFee;

  // 진입 시 총 비용 (KRW 기준)
  const entryUpbitCost = position.upbitQuantity * position.upbitPrice;
  const entryUpbitFee = entryUpbitCost * 0.0005;
  const entryBinanceMargin = (position.binanceQuantity * position.binancePrice / position.leverage);
  const entryBinanceFee = position.binanceQuantity * position.binancePrice * 0.0004;
  const totalEntryCostKRW = (entryUpbitCost + entryUpbitFee) + ((entryBinanceMargin + entryBinanceFee) * position.entryUsdKrw);

  // 청산 시 총 회수액 (KRW 기준)
  const totalExitRevenueKRW = upbitNetRevenue + (binanceNetReturn * currentUsdKrw);

  // 총 손익 (KRW 기준)
  const totalPnl = totalExitRevenueKRW - (totalEntryCostKRW * ratio);

  return {
    upbitSellQuantity,
    binanceCloseQuantity,
    upbitSellRevenue,
    upbitFee,
    upbitNetRevenue,
    binanceCoverCost,
    binanceFee,
    binanceMarginReturn,
    binanceNetReturn,
    totalEntryCostKRW,
    totalExitRevenueKRW,
    totalPnl
  };
};
