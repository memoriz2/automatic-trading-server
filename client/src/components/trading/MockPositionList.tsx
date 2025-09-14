import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBTC } from '@/utils/trading/formatters';

interface MockPosition {
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

interface MockPositionListProps {
  mockPositions: MockPosition[];
  strategies: Strategy[];
  lastKimchiData: KimchiData | null;
  onMockExit: (position: MockPosition, premiumRate: number, ratio?: number) => void;
}

export const MockPositionList: React.FC<MockPositionListProps> = ({
  mockPositions,
  strategies,
  lastKimchiData,
  onMockExit
}) => {
  const activePositions = mockPositions.filter(p => p.status === 'open');

  const getStrategyName = (position: MockPosition): string => {
    // 1. 포지션에 저장된 이름 우선 사용
    if (position.strategyName) {
      return position.strategyName;
    }
    
    // 2. strategies 배열에서 찾기
    const strategy = strategies.find(s => s.id === position.strategyId);
    if (strategy?.name) {
      return strategy.name;
    }
    
    // 3. 폴백
    if (String(position.strategyId).startsWith('force-entry')) {
      return '🧪 강제진입';
    }
    return `전략 #${String(position.strategyId).slice(-4)}`; // ID 기반으로 표시
  };

  const calculatePnL = (position: MockPosition) => {
    const currentPremium = lastKimchiData?.kimp ?? position.entryPremiumRate;
    
    // 김프 상승 시 수익이 +로 보이도록: 김프 차이 기반 근사 PnL (진입가 기준 노출)
    const premiumDelta = (currentPremium - position.entryPremiumRate); // 상승(+)
    const baseNotionalKRW = position.upbitQuantity * position.upbitPrice; // 진입 시 원화 노출 기준
    
    // 진입 수수료 + (예상) 청산 수수료까지 반영
    const currentUpbitPriceEst = lastKimchiData?.upbit_price || position.upbitPrice;
    const currentBinancePriceEst = lastKimchiData?.binance_price || position.binancePrice;
    const usdKrwEst = lastKimchiData?.usdkrw || position.entryUsdKrw || 1390;
    const entryUpbitBuyFee = (position.upbitQuantity * position.upbitPrice) * 0.0005;
    const entryBinanceShortFeeKRW = (position.binanceQuantity * position.binancePrice * 0.0004) * usdKrwEst;
    const estUpbitSellFee = (position.upbitQuantity * currentUpbitPriceEst) * 0.0005;
    const estBinanceCoverFeeKRW = (position.binanceQuantity * currentBinancePriceEst * 0.0004) * usdKrwEst;
    const unrealizedGross = (premiumDelta / 100) * baseNotionalKRW;
    const unrealizedPnl = unrealizedGross - (entryUpbitBuyFee + entryBinanceShortFeeKRW + estUpbitSellFee + estBinanceCoverFeeKRW);
    
    return {
      currentPremium,
      premiumDelta,
      unrealizedPnl,
      isRising: premiumDelta > 0,
      isFalling: premiumDelta < 0
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
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-medium">
                  {getStrategyName(position)}
                </span>
                <Badge 
                  variant="outline" 
                  className={`ml-2 ${
                    pnlData.isRising ? 'text-red-400' : 
                    pnlData.isFalling ? 'text-blue-400' : 
                    ''
                  }`}
                >
                  {position.entryPremiumRate.toFixed(3)}% → {pnlData.currentPremium.toFixed(3)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className={`font-bold ${pnlData.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnlData.unrealizedPnl >= 0 ? '+' : ''}₩{pnlData.unrealizedPnl.toLocaleString()}
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
                    onClick={() => onMockExit(position, pnlData.currentPremium, 0.5)}
                  >
                    50% 청산
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="text-xs px-2 py-1 h-6"
                    onClick={() => onMockExit(position, pnlData.currentPremium, 1.0)}
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
};
