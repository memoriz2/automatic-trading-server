import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBTC, formatPrice, formatInteger } from '@/utils/trading/formatters';

interface LivePosition {
  id: string;
  strategyId: string;
  strategyName?: string; // 전략 이름 추가
  symbol: string;
  type?: string;
  entryTime: Date;
  entryPremiumRate: number;
  upbitQuantity: number;
  upbitPrice: number;
  entryUsdKrw?: number;
  binanceSpotQuantity: number;
  binanceQuantity: number;
  binancePrice: number;
  leverage: number;
  status: 'open' | 'closed';
  unrealizedPnl: number;
  realizedPnl: number;
}

interface Strategy {
  id: string;
  name: string;
}

interface KimchiData {
  kimp: number;
  upbit_price: number;
  binance_price: number;
  usdkrw: number;
  isRealTimeValid?: boolean;
  dataAge?: number;
}

interface LivePositionListProps {
  livePositions: LivePosition[];
  strategies: Strategy[];
  lastKimchiData: KimchiData | null;
  onLiveExit: (position: LivePosition, premiumRate: number, ratio?: number) => void;
}

export const LivePositionList: React.FC<LivePositionListProps> = React.memo(({
  livePositions,
  strategies,
  lastKimchiData,
  onLiveExit
}) => {
  const activePositions = livePositions.filter(p => p.status === 'open');

  const getStrategyName = (position: LivePosition): string => {
    const idStr = String(position.strategyId);
    const idPart = idStr.replace(/^force-entry-/, '');
    // 일반 전략도 무조건 전략 ID로 표기 (이름 대신 ID 중심)
    return idStr.startsWith('force-entry')
      ? `🧪 강제진입 #${idPart}`
      : `전략 #${idPart}`;
  };

  const calculatePnL = (position: LivePosition) => {
    // === 현재 시장 데이터 ===
    const currentPremium = lastKimchiData?.kimp ?? position.entryPremiumRate; // 현재 김치프리미엄 (%)
    const effectiveLeverage = position.leverage && position.leverage > 0 ? position.leverage : 5; // 안전 기본값
    
    // === 김치 프리미엄 변화량 계산 ===
    const premiumDelta = (currentPremium - position.entryPremiumRate);        // 김프 변화량 (현재김프 - 진입김프)
    
    // === 실제 투자금 계산 (진입 수수료로 마이너스 시작) ===
    const upbitInvestment = position.upbitQuantity * position.upbitPrice;     // 업비트 실제 투자금액 (KRW)
    const usdKrw = lastKimchiData?.usdkrw || 1390;
    // 바이낸스 가격 단위 가드: KRW처럼 매우 큰 값이면 USD로 보정
    const entryBinancePriceUsd = (position.binancePrice || 0) > 1000000 
      ? position.binancePrice / usdKrw 
      : position.binancePrice;                                                // USD로 정규화
    const binanceMarginUsd = (position.binanceQuantity * entryBinancePriceUsd) / effectiveLeverage; // 바이낸스 실제 증거금 (USD)
    const binanceMarginKRW = binanceMarginUsd * usdKrw;                       // 바이낸스 증거금 (KRW)
    // 총투자금 기반 계산은 사용하지 않음(정확도 개선 위해 순노출액 기준 사용)
    
    // === 총 매매 수수료 (진입+청산) ===
    const upbitEntryFee = upbitInvestment * 0.0005;                          // 업비트 진입 수수료 (매수 0.05%) - 고정
    
    // 🔄 업비트 매도 수수료: 현재 가격 기준으로 실시간 계산
    const currentUpbitPrice = lastKimchiData?.upbit_price || position.upbitPrice; // 현재 업비트 BTC 가격
    const currentUpbitSellAmount = position.upbitQuantity * currentUpbitPrice; // 현재 가격 기준 매도 금액
    const upbitExitFee = currentUpbitSellAmount * 0.0005;                    // 실시간 매도 수수료 (0.05%)
    const upbitTotalFee = upbitEntryFee + upbitExitFee;                      // 업비트 총 수수료
    
    const binanceEntryFee = (position.binanceQuantity * entryBinancePriceUsd * 0.0004) * usdKrw; // 바이낸스 진입 수수료 (KRW)
    
    // 🔄 바이낸스 매도 수수료: 현재 가격 기준으로 실시간 계산  
    const currentBinanceRaw = lastKimchiData?.binance_price || position.binancePrice; // 현재 바이낸스 BTC 가격(원시)
    const currentBinancePriceUsd = (currentBinanceRaw || 0) > 1000000 
      ? (currentBinanceRaw as number) / usdKrw 
      : (currentBinanceRaw as number);
    const currentBinanceSellAmountUsd = position.binanceQuantity * (currentBinancePriceUsd || 0); // 현재 가격 기준 매도 금액 (USD)
    const binanceExitFee = (currentBinanceSellAmountUsd * 0.0004) * usdKrw;     // 실시간 매도 수수료 (KRW)
    
    // === 순투자금(진입 시점 수수료만 차감) ===
    const upbitNetInvestment = upbitInvestment - upbitEntryFee;              // 업비트: 진입 수수료 차감
    const binanceNetMarginKRW = (binanceMarginUsd * usdKrw) - binanceEntryFee; // 바이낸스: 진입 수수료 차감
    const netEntryExposureKRW = upbitNetInvestment + binanceNetMarginKRW;    // 진입 시점 순노출액
    
    // === 김프 변화 손익(진입 순노출액 기준) − (예상 청산 수수료) ===
    const premiumPnl = (-premiumDelta / 100) * netEntryExposureKRW;          // 김프 하락=수익
    const estimatedExitFeesKRW = upbitExitFee + binanceExitFee;              // 실시간 매도 수수료 합
    const unrealizedPnl = premiumPnl - estimatedExitFeesKRW;                 // 순손익(예상치)
    
    return {
      currentPremium,      // 현재 김치프리미엄 (%)
      premiumDelta,        // 김프 변화량 (%)  
      unrealizedPnl,       // 미실현 손익 (KRW)
      isRising: premiumDelta > 0,   // 김프 상승 여부
      isFalling: premiumDelta < 0   // 김프 하락 여부
    };
  };

  return (
    <div className="mb-4">
      <h4 className="text-white font-medium mb-2">활성 포지션 ({activePositions.length}개)</h4>
      
      {/* 포지션이 없을 때 안내 */}
      {activePositions.length === 0 && (
        <div className="bg-slate-800 p-3 rounded-lg text-center">
          <p className="text-slate-400 text-sm">전략 조건을 수정해주세요.</p>
        </div>
      )}
      
      {/* 활성 포지션 목록 */}
      {activePositions.map(position => {
        const pnlData = calculatePnL(position);
        
        return (
          <div key={position.id} className="bg-slate-800 p-3 rounded-lg mb-2">
            <div className="flex items-center gap-3 justify-between">
              <div className="text-left">
                <span className="text-white font-medium">
                  {getStrategyName(position)}
                </span>
                <Badge 
                  variant="outline" 
                  className={`ml-2 ${
                    pnlData.isFalling ? 'text-green-400 border-green-400' : // 김프율 감소 = 차익거래 수익
                    pnlData.isRising ? 'text-red-400 border-red-400' : // 김프율 증가 = 차익거래 손실
                    'text-slate-400'
                  }`}
                >
                  {pnlData.isFalling ? '📉' : pnlData.isRising ? '📈' : '➡️'} {position.entryPremiumRate.toFixed(3)}% → {pnlData.currentPremium.toFixed(3)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <div className="text-right">
                  {/* 차익거래 수익 표시 (김프율 감소 = 수익) */}
                  <p className={`font-bold flex justify-end text-right gap-1 ${
                    pnlData.isFalling ? 'text-green-400' : // 김프율 감소 = 차익거래 수익
                    pnlData.isRising ? 'text-red-400' : // 김프율 증가 = 차익거래 손실  
                    'text-slate-400'
                  }`}>
                    {pnlData.isFalling ? '🟢' : pnlData.isRising ? '🔴' : '⚪'}
                    {pnlData.isFalling ? '+' : pnlData.isRising ? '−' : ''}₩{Math.max(1, Math.round(Math.abs(pnlData.unrealizedPnl))).toLocaleString()}
                  </p>
                  <p className={`text-xs ${
                    pnlData.isFalling ? 'text-green-400' : // 김프율 감소 = 차익거래 수익
                    pnlData.isRising ? 'text-red-400' : // 김프율 증가 = 차익거래 손실
                    'text-slate-400'
                  }`}>
                    {(() => {
                      // 김치 프리미엄 변화로 인한 원화 손익 (진입 시 가격 기준)
                      const usdKrwLocal = lastKimchiData?.usdkrw || 1390;
                      const upbitInvestmentKRW = position.upbitQuantity * position.upbitPrice; // KRW
                      const upbitEntryFeeKRW = upbitInvestmentKRW * 0.0005;
                      const upbitSellAmountKRW = (lastKimchiData?.upbit_price || position.upbitPrice) * position.upbitQuantity;
                      const upbitExitFeeKRW = upbitSellAmountKRW * 0.0005;

                      const entryBinancePriceUsdLocal = (position.binancePrice || 0) > 1000000 
                        ? position.binancePrice / usdKrwLocal 
                        : position.binancePrice; // USD
                      const binanceMarginUsdLocal = (position.binanceQuantity * entryBinancePriceUsdLocal) / position.leverage;
                      const binanceEntryFeeKRW = (position.binanceQuantity * entryBinancePriceUsdLocal * 0.0004) * usdKrwLocal;

                      const currentBinancePriceUsdLocal = (lastKimchiData?.binance_price || position.binancePrice);
                      const currentBinancePriceUsd = (currentBinancePriceUsdLocal || 0) > 1000000 
                        ? (currentBinancePriceUsdLocal as number) / usdKrwLocal 
                        : (currentBinancePriceUsdLocal as number);
                      const binanceExitFeeKRW = (position.binanceQuantity * currentBinancePriceUsd * 0.0004) * usdKrwLocal;

                      const upbitNetInv = upbitInvestmentKRW - upbitEntryFeeKRW;
                      const binanceNetInvKRW = (binanceMarginUsdLocal * usdKrwLocal) - binanceEntryFeeKRW;
                      const netEntryExposure = upbitNetInv + binanceNetInvKRW;

                      const premiumPnlKRW = (-pnlData.premiumDelta / 100) * netEntryExposure;
                      const exitFees = upbitExitFeeKRW + binanceExitFeeKRW;
                      const netPnlKRW = premiumPnlKRW - exitFees;
                      const premiumPnlPercentRaw = netEntryExposure > 0 ? (netPnlKRW / netEntryExposure * 100) : 0;
                      // 소수점 3자리 절삭 + 최소 표시 단위 적용(0이 되지 않도록)
                      const absPct = Math.abs(premiumPnlPercentRaw);
                      const factor = 1000;
                      const truncated = Math.floor(absPct * factor) / factor;
                      const premiumPnlPercent = (truncated === 0 && absPct > 0) ? 0.001 : truncated;
                      
                      const directionText = pnlData.isFalling ? '차익거래 수익' : pnlData.isRising ? '차익거래 손실' : '변동없음';
                      
                      const sign = pnlData.isFalling ? '+' : pnlData.isRising ? '−' : '';
                      return `${directionText}: ${netPnlKRW >= 0 ? '+' : '−'}₩${Math.max(1, Math.round(Math.abs(netPnlKRW))).toLocaleString()} (${sign}${premiumPnlPercent.toFixed(3)}%)`;
                    })()}
                  </p>
                      <p className="text-xs text-slate-400">
                        업비트: {formatBTC(position.upbitQuantity)} BTC
                      </p>
                      <p className="text-xs text-slate-400">
                        바이낸스 선물: {formatBTC(position.binanceQuantity)} BTC (숏) × {position.leverage}배
                      </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs px-2 py-1 h-6"
                    onClick={() => onLiveExit(position, pnlData.currentPremium, 0.5)}
                  >
                    50% 청산
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="text-xs px-2 py-1 h-6"
                    onClick={() => onLiveExit(position, pnlData.currentPremium, 1.0)}
                  >
                    전체 청산
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
