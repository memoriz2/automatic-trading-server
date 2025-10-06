import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBTC, formatPrice, formatInteger } from '@/utils/trading/formatters';
import { calculatePositionPnL } from '@/utils/pnl-calculator';

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
                    const strategy = strategies.find(s => String(s.id) === String(position.strategyId));
                    return strategy?.takeProfitCondition ? `수익구간 ${parseFloat(parseFloat(strategy.takeProfitCondition).toFixed(3))}% ≤ 김프율` : '-';
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto md:ml-0">
                <div className="text-right">
                  {/* 차익거래 수익 표시 (김프율 증가 = 수익) */}
                  <p className={`font-bold flex justify-end text-right gap-1 ${
                    pnlData.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {pnlData.unrealizedPnl >= 0 ? '🟢' : '🔴'}
                    {pnlData.unrealizedPnl >= 0 ? '+' : '−'}₩{Math.max(1, Math.round(Math.abs(pnlData.unrealizedPnl))).toLocaleString()}
                  </p>
                  <p className={`text-xs ${
                    pnlData.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(() => {
                      // 중앙화된 계산 함수 사용 (중복 계산 제거)
                      const pnlResult = calculatePositionPnL(position, lastKimchiData);
                      const netPnlKRW = pnlResult.netPnl;
                      const premiumPnlPercentRaw = pnlResult.netEntryExposure > 0 ? (netPnlKRW / pnlResult.netEntryExposure * 100) : 0;

                      // 디버깅용 로그
                      // Position PnL 계산됨

                      const premiumPnlPercent = Math.abs(premiumPnlPercentRaw);

                      // 실제 손익에 따라 표시
                      const isProfit = netPnlKRW >= 0;
                      const directionText = isProfit ? '차익거래 수익' : '차익거래 손실';
                      const sign = isProfit ? '+' : '−';

                      return `${directionText}: ${sign}₩${Math.max(1, Math.round(Math.abs(netPnlKRW))).toLocaleString()} (${sign}${premiumPnlPercent.toFixed(3)}%)`;
                    })()}
                  </p>
                      <p className="text-xs text-slate-400">
                        업비트: {formatBTC(position.upbitQuantity)} BTC
                      </p>
                      <p className="text-xs text-slate-400">
                        바이낸스 선물: {formatBTC(position.binanceQuantity)} BTC (숏) × {position.leverage}배
                      </p>
                </div>
              </div>
              <div className="flex gap-1 ml-auto md:ml-0">
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
        );
      })}
    </div>
  );
});
