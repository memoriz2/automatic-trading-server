import React from 'react';
import { fx, loc } from '@/utils/trading/formatters';
import { Loader2 } from 'lucide-react';

interface MarketSnapshotProps {
  kimp: any;
  balances: any;
  isLoadingBalances?: boolean;
}

export const MarketSnapshot: React.FC<MarketSnapshotProps> = ({
  kimp,
  balances,
  isLoadingBalances = false
}) => {
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
              <span className="text-lg font-bold text-orange-400" id="binance_price">{loc(kimp.binance_price)}</span>
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
            <span className="text-lg font-bold text-pink-400" id="used-krw">-</span>
          </div>
        </div>
      </div>
    </section>
  );
};
