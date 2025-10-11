/**
 * 거래 계산 로직 중앙 관리
 * 진입/청산 계산, PnL 계산, 통계 계산 등
 */

import { UPBIT_SPOT_FEE, BINANCE_FUTURES_TAKER_FEE } from '../constants/fees';
import { LEVERAGE_CONFIG } from './leverage';

// ===== 타입 정의 =====

export interface EntryTradeResult {
  binanceShortAmountBTC: number;
  binanceShortValueUSD: number;
  binanceMargin: number;
  binanceFee: number;
  upbitBuyAmountBTC: number;
  upbitBuyAmountKRW: number;
  upbitFee: number;
  totalUpbitCost: number;
  totalInvestedKRW: number;
}

export interface ExitTradeResult {
  upbitSellQuantity: number;
  binanceCloseQuantity: number;
  upbitSellRevenue: number;
  upbitFee: number;
  upbitNetRevenue: number;
  binanceFee: number;
  binanceMarginReturn: number;
  binanceNetReturn: number;
  kimchiPremiumProfit: number;
  totalEntryCostKRW: number;
  totalExitRevenueKRW: number;
  totalPnl: number;
}

export interface PnLResult {
  premiumDelta: number;
  premiumPnl: number;
  estimatedExitFees: number;
  netPnl: number;
  netEntryExposure: number;
}

export interface MarketData {
  kimp?: number;
  upbit_price?: number;
  binance_price?: number;
  usdkrw?: number;
}

export interface PositionForPnL {
  id: string | number;
  upbitQuantity: number;
  upbitPrice: number;
  binanceQuantity: number;
  binancePrice: number;
  leverage: number;
  entryPremiumRate: number;
}

// ===== 유틸리티 함수 =====

/**
 * 투자 수량 보정: 원화 금액/비정상 값을 안전한 BTC 수량으로 변환
 */
export function normalizeAmountBtc(raw: any, upbitPrice?: number): number {
  let amt = Number(raw ?? 0) || 0;

  // 원화 금액(100 이상)인 경우 BTC로 변환
  if (amt >= 100 && upbitPrice && upbitPrice > 0) {
    amt = +(amt / upbitPrice).toFixed(3);
  }

  // 유효성 검증
  if (!isFinite(amt) || amt <= 0) amt = 0.001;
  if (amt > 10) amt = 0.001; // 상식적 한도 초과 시 최소값

  return Math.max(0.001, amt);
}

/**
 * 서버 전략 → UI 밴드 매핑
 */
export function mapStrategyToBand(s: any) {
  return {
    name: s?.name,
    target_kimp: Number(s?.entryRate),
    exit_kimp: Number(s?.exitRate),
    tolerance: Number(s?.toleranceRate ?? s?.tolerance ?? 0.1),
    leverage: Number(s?.leverage ?? LEVERAGE_CONFIG.DEFAULT),
    amount_btc: Number(s?.investmentAmount ?? 0) || 0,
    serverId: s?.id,
  };
}

// ===== 진입/청산 계산 =====

/**
 * 진입 거래 계산
 * @param baseAmount 기준 BTC 수량
 * @param leverage 레버리지 배율
 * @param upbitPrice 업비트 BTC 가격
 * @param binancePrice 바이낸스 BTC 가격
 * @param entryUsdKrw 진입 시점 환율
 * @returns 진입 거래 계산 결과
 */
export function calculateEntryTrade(
  baseAmount: number,
  leverage: number,
  upbitPrice: number,
  binancePrice: number,
  entryUsdKrw: number
): EntryTradeResult {
  // 1단계: 바이낸스 선물 숏 포지션
  const binanceShortAmountBTC = baseAmount;
  const binanceShortValueUSD = binanceShortAmountBTC * binancePrice;
  const binanceMargin = binanceShortValueUSD / leverage;
  const binanceFee = binanceShortValueUSD * BINANCE_FUTURES_TAKER_FEE;

  // 2단계: 업비트 현물 매수
  const upbitBuyAmountBTC = binanceShortAmountBTC;
  const upbitBuyAmountKRW = upbitBuyAmountBTC * upbitPrice;
  const upbitFee = upbitBuyAmountKRW * UPBIT_SPOT_FEE;
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
}

/**
 * 청산 거래 계산
 * @param position 포지션 정보
 * @param currentUpbitPrice 현재 업비트 가격
 * @param currentBinancePrice 현재 바이낸스 가격
 * @param currentUsdKrw 현재 환율
 * @param ratio 청산 비율 (0.0 ~ 1.0)
 * @returns 청산 거래 계산 결과
 */
export function calculateExitTrade(
  position: any,
  currentUpbitPrice: number,
  currentBinancePrice: number,
  currentUsdKrw: number,
  ratio: number = 1.0
): ExitTradeResult {
  // 청산할 수량 계산
  const upbitSellQuantity = position.upbitQuantity * ratio;
  const binanceCloseQuantity = position.binanceQuantity * ratio;

  // 업비트 매도 계산
  const upbitSellRevenue = upbitSellQuantity * currentUpbitPrice;
  const upbitFee = upbitSellRevenue * UPBIT_SPOT_FEE;
  const upbitNetRevenue = upbitSellRevenue - upbitFee;

  // 바이낸스 선물 숏 포지션 청산 계산
  const binanceFee = binanceCloseQuantity * currentBinancePrice * BINANCE_FUTURES_TAKER_FEE;

  // 김치프리미엄 거래: 바이낸스 가격 변동 무시하고 증거금만 반환
  const binanceMarginReturn = (position.binanceQuantity * position.binancePrice / position.leverage) * ratio;
  const binanceNetReturn = binanceMarginReturn - binanceFee;

  // 실제 김치프리미엄 수익 = 업비트 가격 변화에서만 발생
  const kimchiPremiumProfit = upbitSellQuantity * (currentUpbitPrice - position.upbitPrice);

  // 진입 시 총 비용 (KRW 기준)
  const entryUpbitCost = position.upbitQuantity * position.upbitPrice;
  const entryUpbitFee = entryUpbitCost * UPBIT_SPOT_FEE;
  const entryBinanceMargin = (position.binanceQuantity * position.binancePrice / position.leverage);
  const entryBinanceFee = position.binanceQuantity * position.binancePrice * BINANCE_FUTURES_TAKER_FEE;
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
    binanceFee,
    binanceMarginReturn,
    binanceNetReturn,
    kimchiPremiumProfit,
    totalEntryCostKRW,
    totalExitRevenueKRW,
    totalPnl
  };
}

// ===== PnL 계산 =====

/**
 * 포지션 PnL 계산 (실시간 손익)
 * @param position 포지션 정보
 * @param marketData 현재 시장 데이터
 * @returns PnL 계산 결과
 */
export function calculatePositionPnL(position: PositionForPnL, marketData: MarketData | null): PnLResult {
  const currentPremium = marketData?.kimp ?? (typeof position.entryPremiumRate === 'number' ? position.entryPremiumRate : 0);
  const premiumDelta = currentPremium - position.entryPremiumRate;
  const usdkrw = marketData?.usdkrw || 1390;

  // 업비트 계산
  const effectiveUpbitPrice = position.upbitPrice || marketData?.upbit_price || 0;
  const upbitInvestmentKRW = position.upbitQuantity * effectiveUpbitPrice;
  const upbitEntryFeeKRW = upbitInvestmentKRW * UPBIT_SPOT_FEE;
  const currentUpbitPrice = marketData?.upbit_price || effectiveUpbitPrice;
  const upbitSellAmountKRW = position.upbitQuantity * currentUpbitPrice;
  const upbitExitFeeKRW = upbitSellAmountKRW * UPBIT_SPOT_FEE;

  // 바이낸스 계산
  const effectiveBinancePrice = position.binancePrice || marketData?.binance_price || 0;
  const entryBinancePriceUsd = effectiveBinancePrice > 1000000
    ? effectiveBinancePrice / usdkrw
    : effectiveBinancePrice;
  const binanceMarginUsd = (position.binanceQuantity * entryBinancePriceUsd) / position.leverage;
  const binanceEntryFeeKRW = (position.binanceQuantity * entryBinancePriceUsd * BINANCE_FUTURES_TAKER_FEE) * usdkrw;

  const currentBinancePriceRaw = marketData?.binance_price || position.binancePrice;
  const currentBinancePriceUsd = (currentBinancePriceRaw || 0) > 1000000
    ? (currentBinancePriceRaw as number) / usdkrw
    : (currentBinancePriceRaw as number);
  const binanceExitFeeKRW = (position.binanceQuantity * currentBinancePriceUsd * BINANCE_FUTURES_TAKER_FEE) * usdkrw;

  // 순투자금 계산
  const upbitNetInvestment = upbitInvestmentKRW - upbitEntryFeeKRW;
  const binanceNetMarginKRW = (binanceMarginUsd * usdkrw) - binanceEntryFeeKRW;
  const netEntryExposure = upbitNetInvestment + binanceNetMarginKRW;

  // 최종 손익 계산
  const premiumPnl = (premiumDelta / 100) * netEntryExposure;
  const estimatedExitFees = upbitExitFeeKRW + binanceExitFeeKRW;
  const netPnl = premiumPnl - estimatedExitFees;

  return {
    premiumDelta,
    premiumPnl,
    estimatedExitFees,
    netPnl,
    netEntryExposure
  };
}

// ===== 통계 계산 (Mock Trading) =====

/**
 * 수익률 계산
 */
export function calculateProfitRate(
  mockBalance: any,
  currentKimchiData: any
) {
  const initialTotalValue = 100000000 + (100000 * (currentKimchiData?.usdkrw || 1390));
  const currentBtcPrice = currentKimchiData?.upbit_price || 156000000;
  const currentUsdKrw = currentKimchiData?.usdkrw || 1390;

  const currentTotalValue = mockBalance.krw +
                           (mockBalance.btc * currentBtcPrice) +
                           (mockBalance.usdt * currentUsdKrw);

  const totalPnl = currentTotalValue - initialTotalValue;
  const profitRate = isFinite(initialTotalValue) && initialTotalValue > 0
    ? ((totalPnl / initialTotalValue) * 100)
    : 0;

  return { totalPnl, profitRate, currentTotalValue, initialTotalValue };
}

/**
 * 일일 통계 계산
 */
export function calculateDailyStats(mockTrades: any[], mockPositions: any[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTrades = mockTrades.filter(trade => {
    const tradeDate = new Date(trade.timestamp);
    tradeDate.setHours(0, 0, 0, 0);
    return tradeDate.getTime() === today.getTime();
  });

  const todayPositions = mockPositions.filter(position => {
    const entryDate = new Date(position.entryTime);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  const totalTrades = todayTrades.length;
  const upbitTrades = todayTrades.filter((t: any) => t.exchange === 'upbit').length;
  const binanceTrades = todayTrades.filter((t: any) => t.exchange === 'binance').length;
  const totalFees = todayTrades.reduce((sum, trade) => sum + (trade.fee || 0), 0);
  const totalVolume = todayTrades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
  const activePositions = mockPositions.filter((p: any) => p.status === 'open').length;
  const realizedPnl = mockPositions
    .filter((p: any) => p.status === 'closed')
    .reduce((sum, p) => sum + ((p as any).realizedPnl || 0), 0);

  return {
    totalTrades,
    upbitTrades,
    binanceTrades,
    totalFees,
    totalVolume,
    activePositions,
    realizedPnl,
    newPositions: todayPositions.length
  };
}

/**
 * 활성 포지션 수량 계산
 */
export function calculateOpenQuantities(mockPositions: any[]) {
  const openPositions = mockPositions.filter((p: any) => p.status === 'open');

  const rawOpenUpbitQty = openPositions.reduce((sum, p) => sum + (Number(p.upbitQuantity) || 0), 0);
  const rawOpenBinanceQty = openPositions.reduce((sum, p) => sum + (Number(p.binanceQuantity) || 0), 0);

  return { rawOpenUpbitQty, rawOpenBinanceQty };
}

/**
 * 최근 거래 필터링
 */
export function getRecentTrades(mockTrades: any[], strategies: any[]) {
  return mockTrades
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
    .map(trade => {
      const strategy = strategies.find((s: any) => s.id === (trade as any).strategyId);
      return {
        ...trade,
        strategyName: strategy?.name || (trade as any).strategyName || 'Unknown'
      };
    });
}
