import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBTC} from '@/utils/trading/formatters';
import { calculatePositionPnL } from '@/utils/pnl-calculator';

interface LivePosition {
  id: string;
  strategyId: string;
  strategyName?: string; // 전략 이름 추가
  symbol: string;
  type?: string;
  side?: 'long' | 'short' | 'LONG' | 'SHORT';
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
  takeProfitTargets?: number; // 강제진입 익절 오프셋

  // 바이낸스 선물 상세 정보 추가
  binanceEntryPrice?: number; // 진입가 (바이낸스 API)
  binanceMarkPrice?: number; // 마크 가격
  binanceLiquidationPrice?: number; // 청산 가격
  binanceSizeUsdt?: number; // Size (USDT) - 진입가 기준 명목 가치
  binanceMarginUsdt?: number; // Margin (USDT) - 실제 투자 금액
  binanceMarginRatio?: number; // 마진 비율 (%)
  binanceMarginType?: 'cross' | 'isolated'; // 마진 모드
  binanceUnrealizedPnl?: number; // 미실현 손익 (USDT)
}

interface Strategy {
  id: string;
  name: string;
  takeProfitCondition?: string;
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
  const [isFixing, setIsFixing] = React.useState(false);

  const handleButtonClick = (callback: () => void) => {
    // 햅틱 피드백 (모바일)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    callback();
  };

  const handleFixEntryPrices = async () => {
    if (isFixing) return;

    setIsFixing(true);
    try {
      const response = await fetch('/api/monitoring/fix-entry-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ 진입가 수정 완료!\n성공: ${result.fixed}개\n실패: ${result.failed}개`);
        // 페이지 새로고침하여 업데이트된 데이터 표시
        window.location.reload();
      } else {
        alert(`❌ 수정 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('진입가 수정 실패:', error);
      alert('❌ 진입가 수정 중 오류가 발생했습니다.');
    } finally {
      setIsFixing(false);
    }
  };

  const getStrategyName = (position: LivePosition): string => {
    // 우선 position.strategyName이 있으면 사용
    if (position.strategyName) {
      return position.strategyName;
    }

    // strategies 배열에서 해당 전략의 이름 찾기
    const strategy = strategies.find(s => s.id === position.strategyId);
    if (strategy) {
      return strategy.name;
    }

    // 전략을 찾지 못한 경우 기본 표시
    const idStr = String(position.strategyId);
    const idPart = idStr.replace(/^force-entry-/, '');
    const fallbackName = idStr.startsWith('force-entry')
      ? `🧪 강제진입 #${idPart}`
      : `전략 #${idPart}`;

    return fallbackName;
  };

  const calculatePnL = (position: LivePosition) => {
    // 중앙화된 PnL 계산 함수 사용
    const pnlResult = calculatePositionPnL(position, lastKimchiData);

    // PnL 계산 완료

    return {
      currentPremium: lastKimchiData?.kimp ?? position.entryPremiumRate,
      premiumDelta: pnlResult.premiumDelta,
      unrealizedPnl: pnlResult.netPnl,
      isRising: pnlResult.premiumDelta > 0,
      isFalling: pnlResult.premiumDelta < 0
    };
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-medium">활성 포지션 ({activePositions.length}개)</h4>
        <Button
          size="sm"
          variant="outline"
          className="text-xs px-3 py-1 h-7"
          onClick={handleFixEntryPrices}
          disabled={isFixing}
        >
          {isFixing ? '🔄 수정 중...' : '🔧 진입가 수정'}
        </Button>
      </div>

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
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
              <div className="text-left">
                <div className="flex items-center">
                  <span className="text-white font-medium">
                    {getStrategyName(position)}
                  </span>
                  <Badge
                    variant="outline"
                    className={`ml-2 ${
                      pnlData.unrealizedPnl >= 0 ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'
                    }`}
                  >
                    {pnlData.isRising ? '📈' : pnlData.isFalling ? '📉' : '➡️'} {position.entryPremiumRate.toFixed(3)}% → {pnlData.currentPremium.toFixed(3)}%
                  </Badge>
                </div>
                <div className="text-[10px] text-slate-400 mt-1" style={{ float: 'left' }}>
                  {(() => {
                    // 강제진입은 익절 구간 표시 안함 (수동 청산)
                    if (position.type === 'force_entry') {
                      return '-';
                    }

                    // 일반 전략 포지션인 경우만 익절 구간 표시
                    const strategy = strategies.find(s => String(s.id) === String(position.strategyId));
                    return strategy?.takeProfitCondition ? `수익구간 ${parseFloat(parseFloat(strategy.takeProfitCondition).toFixed(3))}% ≤ 김프율` : '-';
                  })()}
                </div>
                <div className="text-[10px] text-slate-400 mt-1" style={{ float: 'left', clear: 'left' }}>
                  {(() => {
                    // 업비트 vs 바이낸스 가격 차이 비교 (현재가 - 진입가)
                    if (!lastKimchiData || !lastKimchiData.usdkrw) return null;

                    const currentUpbitPrice = lastKimchiData.upbit_price || position.upbitPrice;
                    const currentBinancePrice = lastKimchiData.binance_price || position.binancePrice;
                    const usdkrw = lastKimchiData.usdkrw;

                    // 업비트: 진입 단가(1 BTC 기준) 추정 후 가격 차이 (KRW)
                    const entryUpbitUnit = (position.upbitQuantity && position.upbitQuantity > 0)
                      ? (position.upbitPrice / position.upbitQuantity)
                      : position.upbitPrice;
                    const upbitPriceDiff = currentUpbitPrice - entryUpbitUnit; // 1 BTC 기준
                    const upbitValueDiff = upbitPriceDiff * (position.upbitQuantity || 0); // 포지션 가치 변화(KRW)

                    // 바이낸스: 가격 차이를 KRW로 환산 (숏은 진입가 - 현재가, 롱은 현재가 - 진입가)
                    const binanceEntryUsd = position.binancePrice > 1000000 ? position.binancePrice / usdkrw : position.binancePrice;
                    const binanceCurrentUsd = currentBinancePrice > 1000000 ? currentBinancePrice / usdkrw : currentBinancePrice;
                    const sideLower = String(position.side || position.type || '').toLowerCase();
                    const isShort = sideLower.includes('short');
                    const binancePriceDiffKrw = (isShort
                      ? (binanceEntryUsd - binanceCurrentUsd)
                      : (binanceCurrentUsd - binanceEntryUsd)
                    ) * usdkrw; // 1 BTC 기준 KRW
                    const binanceValueDiff = binancePriceDiffKrw * (position.binanceQuantity || 0); // 포지션 가치 변화(KRW)

                    const fmtKRW = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v).toLocaleString()} KRW`;
                    const upbitStr = fmtKRW(upbitValueDiff);
                    const binanceStr = fmtKRW(binanceValueDiff);

                    const comparison = Math.abs(upbitValueDiff) > Math.abs(binanceValueDiff) ? '>' : '<';

                    const fmtInt = (n: number) => Math.round(n).toLocaleString();
                    const debugInfo = `(
                      U진입:${fmtInt(entryUpbitUnit)} KRW, 
                      U현재:${fmtInt(currentUpbitPrice)} KRW, 
                      B진입:$${fmtInt(position.binancePrice)}, 
                      B현재:$${fmtInt(currentBinancePrice)}
                    )`;

                    return (
                      <>
                        <span>{`업비트 ${upbitStr} ${comparison} ${binanceStr} 바이낸스`}</span>
                        <br />
                        <span className="text-[9px] text-slate-600">{debugInfo}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 ml-auto">
                <div className="text-right">
                  {(() => {
                    // 우측 상단 라인에 업비트/바이낸스 가치 변화 표시
                    // (현재가 − 진입가) × 수량, 선물은 숏/롱 부호 반영, 환율 적용
                    const usdkrw = lastKimchiData?.usdkrw || 0;
                    const currentUpbitPrice = lastKimchiData?.upbit_price || position.upbitPrice;
                    const currentBinancePrice = lastKimchiData?.binance_price || position.binancePrice;

                    const entryUpbitUnit = (position.upbitQuantity && position.upbitQuantity > 0)
                      ? (position.upbitPrice / position.upbitQuantity)
                      : position.upbitPrice;
                    const upbitPriceDiff = currentUpbitPrice - entryUpbitUnit; // 1 BTC 기준
                    const upbitValueDiff = upbitPriceDiff * (position.upbitQuantity || 0);

                    const entryUsd = position.binancePrice > 1_000_000 ? position.binancePrice / (usdkrw || 1) : position.binancePrice;
                    const nowUsd = currentBinancePrice > 1_000_000 ? currentBinancePrice / (usdkrw || 1) : currentBinancePrice;
                    const sideLower = String(position.side || position.type || '').toLowerCase();
                    const isShort = sideLower.includes('short');
                    const binancePriceDiffKrw = (isShort ? (entryUsd - nowUsd) : (nowUsd - entryUsd)) * (usdkrw || 0);
                    const binanceValueDiff = binancePriceDiffKrw * (position.binanceQuantity || 0);

                    const fmtKRW = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v).toLocaleString()} KRW`;
                    const upbitStr = fmtKRW(upbitValueDiff);
                    const binanceStr = fmtKRW(binanceValueDiff);
                    const comparison = Math.abs(upbitValueDiff) > Math.abs(binanceValueDiff) ? '>' : '<';
                    const isProfit = (upbitValueDiff + binanceValueDiff) >= 0;

                    return (
                      <p className={`font-bold text-xs md:text-sm ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? '🟢' : '🔴'} 업비트 {upbitStr} {comparison} {binanceStr} 바이낸스
                      </p>
                    );
                  })()}
                      <p className="text-xs text-slate-400">
                        업비트: {formatBTC(position.upbitQuantity)} BTC
                      </p>
                      {(() => {
                        const isFutures = String(position.type || '').startsWith('futures');
                        const sideLower = String(position.side || '').toLowerCase();
                        const inferred = String(position.type || '').includes('short') ? '숏' : (String(position.type || '').includes('long') ? '롱' : undefined);
                        const sideText = sideLower === 'short' ? '숏' : sideLower === 'long' ? '롱' : inferred;
                        const hasQty = Math.abs(position.binanceQuantity || 0) > 0;
                        const showBadge = isFutures && (hasQty || !!sideText || !!position.leverage);
                        return (
                          <p className="text-xs text-slate-400">
                            바이낸스 선물: {formatBTC(position.binanceQuantity)} BTC
                            {showBadge && sideText ? <> ({sideText})</> : null}
                            {showBadge && position.leverage ? <> × {position.leverage}배</> : null}
                          </p>
                        );
                      })()}

                      {/* 바이낸스 선물 상세 정보 */}
                      <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                        <p className={position.binanceUnrealizedPnl && position.binanceUnrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                          Unrealized PNL: {position.binanceUnrealizedPnl && position.binanceUnrealizedPnl >= 0 ? '+' : ''}${(position.binanceUnrealizedPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                        </p>
                        <p>Size: ${(position.binanceSizeUsdt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</p>
                        <p>Margin: ${(position.binanceMarginUsdt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</p>
                        <p>Margin Ratio: {((position.binanceMarginRatio || 0) * 100).toFixed(2)}%</p>
                        {position.binanceMarkPrice && position.binanceMarkPrice > 0 && (
                          <p>Mark Price: ${position.binanceMarkPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        )}
                        {position.binanceLiquidationPrice && position.binanceLiquidationPrice > 0 && (
                          <p>Liq. Price: ${position.binanceLiquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        )}
                      </div>
                </div>
                <div className="flex gap-1 md:flex-col ml-auto md:ml-0 p-2 -m-2 md:p-0 md:m-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 py-1 h-6 touch-manipulation active:scale-95 active:bg-slate-600 transition-transform duration-100"
                    onClick={() => handleButtonClick(() => onLiveExit(position, pnlData.currentPremium, 0.5))}
                  >
                    50% 청산
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs px-2 py-1 h-6 touch-manipulation active:scale-95 active:brightness-125 transition-transform duration-100"
                    onClick={() => handleButtonClick(() => onLiveExit(position, pnlData.currentPremium, 1.0))}
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
