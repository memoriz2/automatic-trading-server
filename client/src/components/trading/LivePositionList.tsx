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

  const calculatePnL = (position: LivePosition) => {
    // === 현재 시장 데이터 ===
    const currentPremium = lastKimchiData?.kimp ?? position.entryPremiumRate; // 현재 김치프리미엄 (%)
    
    // === 김치 프리미엄 변화량 계산 ===
    const premiumDelta = (currentPremium - position.entryPremiumRate);        // 김프 변화량 (현재김프 - 진입김프)
    
    // === 실제 투자금 계산 (진입 수수료로 마이너스 시작) ===
    const upbitInvestment = position.upbitQuantity * position.upbitPrice;     // 업비트 실제 투자금액 (KRW)
    const binanceMargin = (position.binanceQuantity * position.binancePrice) / position.leverage; // 바이낸스 실제 증거금 (USD)
    
    // USD를 KRW로 환산
    const currentUsdKrw = lastKimchiData?.usdkrw || 1390;
    const binanceMarginKRW = binanceMargin * currentUsdKrw;                   // 바이낸스 증거금 (KRW)
    const totalInvestment = upbitInvestment + binanceMarginKRW;               // 총 실제 투자금 (KRW)
    
    // === 김치 프리미엄 변화에 따른 손익 계산 ===
    const premiumPnl = (premiumDelta / 100) * totalInvestment;               // 김프 변화 손익
    
    // === 총 매매 수수료 (진입+청산) ===
    const upbitEntryFee = upbitInvestment * 0.0005;                          // 업비트 진입 수수료 (매수 0.05%) - 고정
    
    // 🔄 업비트 매도 수수료: 현재 가격 기준으로 실시간 계산
    const currentUpbitPrice = lastKimchiData?.upbit_price || position.upbitPrice; // 현재 업비트 BTC 가격
    const currentUpbitSellAmount = position.upbitQuantity * currentUpbitPrice; // 현재 가격 기준 매도 금액
    const upbitExitFee = currentUpbitSellAmount * 0.0005;                    // 실시간 매도 수수료 (0.05%)
    const upbitTotalFee = upbitEntryFee + upbitExitFee;                      // 업비트 총 수수료
    
    const binanceEntryFee = (position.binanceQuantity * position.binancePrice * 0.0004) * currentUsdKrw; // 바이낸스 진입 수수료 (KRW)
    
    // 🔄 바이낸스 매도 수수료: 현재 가격 기준으로 실시간 계산  
    const currentBinancePrice = lastKimchiData?.binance_price || position.binancePrice; // 현재 바이낸스 BTC 가격
    const currentBinanceSellAmount = position.binanceQuantity * currentBinancePrice; // 현재 가격 기준 매도 금액 (USD)
    const binanceExitFee = (currentBinanceSellAmount * 0.0004) * currentUsdKrw;     // 실시간 매도 수수료 (KRW)
    const binanceTotalFee = binanceEntryFee + binanceExitFee;                // 바이낸스 총 수수료
    
    const totalFee = upbitTotalFee + binanceTotalFee;                        // 총 매매 수수료
    
    // === 순투자금 기준 미실현 손익 ===
    const netInvestment = totalInvestment - totalFee;                        // 순투자금 = 총투자금 - 총수수료
    const unrealizedPnl = (premiumDelta / 100) * netInvestment;              // 김프 변화율 × 순투자금 = 미실현 손익
    
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
                    {pnlData.unrealizedPnl >= 0 ? '+' : ''}₩{Math.floor(Math.abs(pnlData.unrealizedPnl)).toLocaleString()}
                  </p>
                  <p className={`text-xs ${pnlData.premiumDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(() => {
                      // 김치 프리미엄 변화로 인한 원화 손익 (진입 시 가격 기준)
                      const upbitInvestment = position.upbitQuantity * position.upbitPrice;
                      const binanceMargin = (position.binanceQuantity * position.binancePrice) / position.leverage;
                      const totalInvestment = upbitInvestment + binanceMargin;
                      const premiumPnlKRW = (pnlData.premiumDelta / 100) * totalInvestment;
                      const premiumPnlPercent = totalInvestment > 0 ? (premiumPnlKRW / totalInvestment * 100) : 0;
                      
                      return `${premiumPnlKRW >= 0 ? '+' : ''}₩${Math.floor(Math.abs(premiumPnlKRW)).toLocaleString()} (${premiumPnlPercent >= 0 ? '+' : ''}${premiumPnlPercent.toFixed(2)}%)`;
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
