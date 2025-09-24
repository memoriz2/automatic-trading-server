// 중앙화된 PnL 계산 함수
export interface Position {
  id: string;
  upbitQuantity: number;
  upbitPrice: number;
  binanceQuantity: number;
  binancePrice: number;
  leverage: number;
  entryPremiumRate: number;
}

export interface MarketData {
  kimp?: number;
  upbit_price?: number;
  binance_price?: number;
  usdkrw?: number;
}

export interface PnLResult {
  premiumDelta: number;
  premiumPnl: number;
  estimatedExitFees: number;
  netPnl: number;
  netEntryExposure: number;
}

/**
 * 통합 PnL 계산 함수
 * @param position 포지션 정보
 * @param marketData 현재 시장 데이터
 * @returns PnL 계산 결과
 */
export function calculatePositionPnL(position: Position, marketData: MarketData | null): PnLResult {
  // 가격 정보 부족시 경고 (디버깅 필요시에만 활성화)
  // if (position.upbitPrice === 0 || position.binancePrice === 0) {
  //   console.log(`⚠️ [${position.id}] 가격 정보 부족:`, { upbitPrice: position.upbitPrice, binancePrice: position.binancePrice });
  // }

  const currentPremium = marketData?.kimp ?? position.entryPremiumRate;
  const premiumDelta = currentPremium - position.entryPremiumRate;
  const usdkrw = marketData?.usdkrw || 1390;

  // === 업비트 계산 ===
  // upbitPrice가 0이면 현재 시장가 사용
  const effectiveUpbitPrice = position.upbitPrice || marketData?.upbit_price || 0;
  const upbitInvestmentKRW = position.upbitQuantity * effectiveUpbitPrice;
  const upbitEntryFeeKRW = upbitInvestmentKRW * 0.0005;
  const currentUpbitPrice = marketData?.upbit_price || effectiveUpbitPrice;
  const upbitSellAmountKRW = position.upbitQuantity * currentUpbitPrice;
  const upbitExitFeeKRW = upbitSellAmountKRW * 0.0005;

  // === 바이낸스 계산 ===
  // binancePrice가 0이면 현재 시장가 사용
  const effectiveBinancePrice = position.binancePrice || marketData?.binance_price || 0;
  const entryBinancePriceUsd = effectiveBinancePrice > 1000000
    ? effectiveBinancePrice / usdkrw
    : effectiveBinancePrice;
  const binanceMarginUsd = (position.binanceQuantity * entryBinancePriceUsd) / position.leverage;
  const binanceEntryFeeKRW = (position.binanceQuantity * entryBinancePriceUsd * 0.0004) * usdkrw;

  const currentBinancePriceRaw = marketData?.binance_price || position.binancePrice;
  const currentBinancePriceUsd = (currentBinancePriceRaw || 0) > 1000000
    ? (currentBinancePriceRaw as number) / usdkrw
    : (currentBinancePriceRaw as number);
  const binanceExitFeeKRW = (position.binanceQuantity * currentBinancePriceUsd * 0.0004) * usdkrw;

  // === 순투자금 계산 ===
  const upbitNetInvestment = upbitInvestmentKRW - upbitEntryFeeKRW;
  const binanceNetMarginKRW = (binanceMarginUsd * usdkrw) - binanceEntryFeeKRW;
  const netEntryExposure = upbitNetInvestment + binanceNetMarginKRW;

  // 디버깅 로그
  // DEBUG 로그 (필요시에만 활성화)
  // console.log(`DEBUG [${position.id}]: upbitInv=${upbitInvestmentKRW}, binanceMargin=${binanceMarginKRW}, total=${netEntryExposure}`);

  // === 최종 손익 계산 ===
  const premiumPnl = (premiumDelta / 100) * netEntryExposure; // 김프 증가=수익, 김프 감소=손실
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