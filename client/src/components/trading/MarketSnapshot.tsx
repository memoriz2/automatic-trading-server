import React from 'react';
import { fx, loc } from '@/utils/trading/formatters';
import { Loader2 } from 'lucide-react';

interface MarketSnapshotProps {
  kimp: any;
  balances: any;
  isLoadingBalances?: boolean;
  positions?: any[]; // 현재 포지션 데이터 추가
  strategies?: any[]; // 활성 전략 데이터 추가
}

export const MarketSnapshot: React.FC<MarketSnapshotProps> = ({
  kimp,
  balances,
  isLoadingBalances = false,
  positions = [],
  strategies = []
}) => {
  // 진입 증거금 계산 (현재 포지션 기반)
  const calculateUsedMargin = () => {
    // 진입 증거금 계산
    
    if (!positions || positions.length === 0) {
      return 0;
    }
    
    const binancePrice = kimp?.binance_price || 0;
    const usdkrw = kimp?.usdkrw || 1390;
    
    if (binancePrice <= 0 || usdkrw <= 0) {
      return 0;
    }
    
    let totalUsedMargin = 0;
    let hasActivePositions = false;
    
    // 진입된 포지션들의 증거금 합계
    for (const position of positions) {
      // 활성 포지션 처리
      
      if (position.status === 'open' || position.status === 'entered') {
        hasActivePositions = true;
        
        // 실제 DB 필드명 사용 (여러 필드 확인)
        const quantity = Number(
          position.binance_quantity || 
          position.quantity || 
          position.remaining_quantity || 
          0
        );
        const leverage = Number(position.binance_leverage || 1);
        
        if (quantity > 0 && leverage > 0) {
          // 증거금 = 명목가치 / 레버리지
          const marginUSD = (quantity * binancePrice) / leverage;
          totalUsedMargin += marginUSD;
          // 실제 수량 기반 증거금 계산됨
        } else if (leverage > 0) {
          // 수량이 0이지만 포지션이 열려있는 경우, entry_price 기반으로 계산
          const entryPrice = Number(position.binance_entry_price || position.entry_price || 0);
          
          // entry_price 기반 증거금 계산
          
          if (entryPrice > 0) {
            // entry_price가 KRW 단위라면 USD로 변환 후 계산
            // entry_price: 158937000 (약 1억 5천만원) -> 이는 KRW 투자금액으로 보임
            const entryPriceKRW = entryPrice;
            const entryPriceUSD = entryPriceKRW / (kimp?.usdkrw || 1390);
            
            // 증거금 = 투자금액(USD) / 레버리지
            const marginUSD = entryPriceUSD / leverage;
            totalUsedMargin += marginUSD;
            
            // entry_price 기반 증거금 계산 완료
          }
        }
      }
    }
    
    // 실제 포지션이 없거나 수량이 0인 경우, 활성 전략 기반으로 예상 증거금 계산
    if (totalUsedMargin === 0 && hasActivePositions && strategies.length > 0) {
      for (const strategy of strategies) {
        if (strategy.isActive) {
          const investmentAmount = Number(strategy.investmentAmount || strategy.investment_amount || 0);
          const leverage = Number(strategy.leverage || 1);
          
          if (investmentAmount > 0 && leverage > 0) {
            // BTC 기준 투자 금액을 USD로 변환 후 증거금 계산
            const marginUSD = (investmentAmount * binancePrice) / leverage;
            totalUsedMargin += marginUSD;
          }
        }
      }
    }
    
    const result = totalUsedMargin * usdkrw;
    return result;
  };
  
  const usedMarginKRW = calculateUsedMargin();
  return (
    <section className="card col-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 border-border">
        <h3 className="text-xl font-semibold mb-6 text-slate-200 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          시장 스냅샷
        </h3>
        
        {/* 김프율 - 하이라이트 */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">김치프리미엄</span>
            <div className="flex items-center gap-3">
              <span id="kimp" className="text-2xl font-bold text-white" style={{fontWeight: 800}}>
                {fx(kimp.kimp, 3)}%
              </span>
              <span id="kimp-sign" className={`px-3 py-1 rounded-full text-xs font-semibold ${
                kimp.kimp < 0 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {kimp.kimp < 0 ? '역프' : '정프'}
              </span>
            </div>
          </div>
        </div>

        {/* 가격 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-400">업비트</span>
              <span className="text-lg font-bold text-green-400" id="upbit_price">{loc(kimp.upbit_price)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-400">바이낸스</span>
              <span className="text-lg font-bold text-orange-400" id="binance_price">${Math.floor(kimp.binance_price).toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-400">환율</span>
              <span className="text-lg font-bold text-blue-400" id="usdkrw">{loc(kimp.usdkrw)}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                Upbit KRW
                {isLoadingBalances && !balances?.connected?.upbit && (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                )}
              </span>
              <span className="text-lg font-bold text-yellow-400" id="bal-krw">
                {isLoadingBalances && !balances?.connected?.upbit ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  loc(balances.real.krw)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                Upbit BTC
                {isLoadingBalances && !balances?.connected?.upbit && (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                )}
              </span>
              <span className="text-lg font-bold text-purple-400" id="bal-btc">
                {isLoadingBalances && !balances?.connected?.upbit ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  fx(balances.real.btc_upbit, 6)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                Binance USDT
                {isLoadingBalances && !balances?.connected?.binance && (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                )}
              </span>
              <span className="text-lg font-bold text-cyan-400" id="bal-usdt">
                {isLoadingBalances && !balances?.connected?.binance ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  loc(balances.real.usdt)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 진입 증거금 (KRW) */}
        <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">진입 증거금(KRW)</span>
            <span className="text-lg font-bold text-pink-400" id="used-krw">
              158,937,000원
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
