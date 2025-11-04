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
  upbitPrice: number; // 현재가 (deprecated)
  upbitEntryPrice?: number; // 업비트 진입가 (신규)
  entryUsdKrw?: number;
  binanceSpotQuantity: number;
  binanceQuantity: number;
  binancePrice: number; // 현재가 (deprecated)
  binanceEntryPrice?: number; // 바이낸스 진입가
  leverage: number;
  status: 'open' | 'closed';
  unrealizedPnl: number;
  realizedPnl: number;
  takeProfitTargets?: number; // 강제진입 익절 오프셋

  // 바이낸스 선물 상세 정보 추가
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

export interface PnLData {
  upbitPnl: number; // 업비트 손익 (KRW)
  binancePnl: number; // 바이낸스 손익 (KRW)
  binancePnlUsd: number; // 바이낸스 손익 (USD)
}

interface LivePositionListProps {
  livePositions: LivePosition[];
  strategies: Strategy[];
  lastKimchiData: KimchiData | null;
  onLiveExit: (position: LivePosition, premiumRate: number, ratio?: number, pnlData?: PnLData) => void;
}

export const LivePositionList: React.FC<LivePositionListProps> = React.memo(({
  livePositions,
  strategies,
  lastKimchiData,
  onLiveExit
}) => {
  const activePositions = livePositions.filter(p => p.status === 'open');

  const handleButtonClick = (callback: () => void) => {
    // 햅틱 피드백 (모바일)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    callback();
  };

  // (삭제) 진입가 일괄 수정 관련 로직 제거

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

        // 손익 상세 계산 (화면 표시 + 청산 시 전달용)
        const usdkrw = lastKimchiData?.usdkrw || 1400;
        const currentUpbitPrice = lastKimchiData?.upbit_price || 0;
        const currentBinancePrice = lastKimchiData?.binance_price || 0;
        const upbitQuantity = position.upbitQuantity || 0;
        const binanceQuantity = position.binanceQuantity || 0;

        // 업비트 손익
        const upEntryUnit = position.upbitEntryPrice || position.upbitPrice || 0;
        const upbitPnl = (currentUpbitPrice - upEntryUnit) * upbitQuantity;

        // 바이낸스 손익 계산
        // 바이낸스 선물 Unrealized PNL 계산 공식 (마크 가격 기준, 수수료/펀딩 미포함):
        // 롱: (markPrice - entryPrice) × |positionQty|
        // 숏: (entryPrice - markPrice) × |positionQty|
        // * 레버리지는 손익 계산에 직접 들어가지 않음 (마진/ROE만 영향)
        // * positionQty는 BTC 수량 (BTCUSDT 기준)
        // * 결과는 USDT 단위, 원화 환산은 PNL(USDT) × USD/KRW

        const binanceEntryUnitPrice = position.binanceEntryPrice || 0;
        // 선물 Mark Price 우선 (실시간 2초 갱신), 없으면 DB의 Mark Price, 최후에 현물 가격
        const binanceCurrentPrice = (lastKimchiData as any)?.binanceFuturesMarkPrice || position.binanceMarkPrice || currentBinancePrice;
        const binanceEntryTotal = binanceEntryUnitPrice * Math.abs(binanceQuantity);  // entryPrice × |qty|
        const binanceCurrentTotal = binanceCurrentPrice * Math.abs(binanceQuantity);  // markPrice × |qty|

        let binancePnlUsd = 0;

        // 각 포지션의 진입가와 수량으로 개별 계산 (binanceUnrealizedPnl은 전체 포지션 합이므로 사용하지 않음)
        if (binanceQuantity !== 0) {
          // 김프 거래는 바이낸스가 항상 숏 포지션 (업비트 롱 + 바이낸스 숏)
          // 숏: (entryPrice - markPrice) × |qty| = (진입총액 - 마크총액)
          // 가격이 오르면 손실(음수), 가격이 내리면 이익(양수)
          binancePnlUsd = binanceEntryTotal - binanceCurrentTotal;

          console.log(`[PnL Debug] 포지션 ${position.id}:`, {
            진입가: binanceEntryUnitPrice,
            현재Mark가: binanceCurrentPrice,
            수량: binanceQuantity,
            진입총액: binanceEntryTotal.toFixed(2),
            현재총액: binanceCurrentTotal.toFixed(2),
            '계산PnL(USD)': binancePnlUsd.toFixed(2),
            포지션: 'SHORT (김프 거래)',
            futuresMarkPrice: (lastKimchiData as any)?.binanceFuturesMarkPrice,
            dbMarkPrice: position.binanceMarkPrice,
            spotPrice: currentBinancePrice
          });
        }

        const binancePnl = binancePnlUsd * usdkrw;

        // 청산 시 전달할 손익 데이터
        const pnlForExit: PnLData = {
          upbitPnl,
          binancePnl,
          binancePnlUsd
        };

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
                <div className="text-[10px] text-slate-400 mt-1">
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
                
                {/* 바이낸스 선물 상세 정보 (정렬 정돈) */}
                <div className="text-[10px] text-slate-400 mt-2 space-y-1">
                  <div className="flex items-center gap-4">
                    <span>Size</span>
                    <span className="tabular-nums">${(position.binanceSizeUsdt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Margin</span>
                    <span className="tabular-nums">${(position.binanceMarginUsdt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
                  </div>
                </div>
                      
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 ml-auto">
                <div className="text-right">
                  {(() => {
                    // 총 투자금액 기준 손익 표시 (위에서 이미 계산한 값 재사용)
                    const fmtKRW = (v: number) => `₩${v >= 0 ? '+' : ''}${Math.round(v).toLocaleString()}`;
                    const upbitStr = fmtKRW(upbitPnl);
                    const binanceStrWithUsd = `${fmtKRW(binancePnl)}($${binancePnlUsd >= 0 ? '+' : ''}${binancePnlUsd.toFixed(2)})`;
                    const comparison = Math.abs(upbitPnl) > Math.abs(binancePnl) ? '>' : '<';
                    const isProfit = (upbitPnl + binancePnl) >= 0;

                    const fmtInt = (n: number) => Math.round(n).toLocaleString();
                    const fmtPrice = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const debugInfo = `U진입:₩${fmtInt(upEntryUnit)} 현재:₩${fmtInt(currentUpbitPrice)} | B진입:$${fmtPrice(binanceEntryUnitPrice)} Mark:$${fmtPrice(binanceCurrentPrice)}`;

                    return (
                      <>
                        <p className={`font-bold text-xs md:text-sm ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                          {isProfit ? '🟢' : '🔴'} 업비트 {upbitStr} {comparison} {binanceStrWithUsd} 바이낸스
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{debugInfo}</p>
                      </>
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

                      
                </div>
                <div className="flex gap-1 md:flex-col ml-auto md:ml-0 p-2 -m-2 md:p-0 md:m-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 py-1 h-6 touch-manipulation active:scale-95 active:bg-slate-600 transition-transform duration-100"
                    onClick={() => handleButtonClick(() => onLiveExit(position, pnlData.currentPremium, 0.5, pnlForExit))}
                  >
                    50% 청산
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs px-2 py-1 h-6 touch-manipulation active:scale-95 active:brightness-125 transition-transform duration-100"
                    onClick={() => handleButtonClick(() => onLiveExit(position, pnlData.currentPremium, 1.0, pnlForExit))}
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
