import React from 'react';
import { formatBTC, formatBTCUpbit} from '@/utils/trading/formatters';

interface LiveBalance {
  krw: number;
  btc: number;
  usdt: number;
  binanceBtc: number;
  binanceSpotBtc: number;
  binanceUsdt: number;
}

interface LiveBalanceDisplayProps {
  liveBalance: LiveBalance;
  openUpbitQty: number;
  openBinanceQty: number;
  profitRate: number;
  totalPnl: number;
  upbitPnlSum?: number;      // 활성 포지션 업비트 가치 변화 합계(KRW)
  binancePnlSum?: number;    // 활성 포지션 바이낸스 가치 변화 합계(KRW)
  realtimeBalances?: { upbitBtc: number; binanceBtc: number; timestamp: string };
  balanceLoading?: boolean;
  btcKrwPrice?: number;
  usdtKrwRate?: number;
}

export const LiveBalanceDisplay: React.FC<LiveBalanceDisplayProps> = ({
  liveBalance,
  profitRate: _profitRate,
  totalPnl: _totalPnl,
  upbitPnlSum = 0,
  binancePnlSum = 0,
  realtimeBalances,
  balanceLoading,
  btcKrwPrice,
  usdtKrwRate
}) => {
  return (
    <>
      {/* 잔고 표시 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-slate-400 text-sm">업비트 KRW</h4>
          <p className="text-base md:text-xl font-bold text-blue-400">
            ₩{Math.floor(liveBalance.krw || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-slate-400 text-sm">업비트 BTC</h4>
          <div className="flex items-center gap-2">
            <p className="text-base md:text-xl font-bold text-yellow-400">
              {formatBTCUpbit(realtimeBalances?.upbitBtc || 0)} BTC
            </p>
            {balanceLoading && (
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          {btcKrwPrice && (
            <p className="text-xs text-slate-500">
              ≈ ₩{Math.floor((realtimeBalances?.upbitBtc || 0) * btcKrwPrice).toLocaleString()}
            </p>
          )}
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-slate-400 text-sm">바이낸스 BTC (선물)</h4>
          <div className="flex items-center gap-2">
            <p className="text-base md:text-xl font-bold text-orange-400">
              {formatBTC(Math.abs(realtimeBalances?.binanceBtc || 0))} BTC
              {(realtimeBalances?.binanceBtc || 0) < 0 && <span className="text-red-400 ml-1">(숏)</span>}
            </p>
            {balanceLoading && (
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          {btcKrwPrice && (
            <p className="text-xs text-slate-500">
              ≈ ₩{Math.floor(Math.abs(realtimeBalances?.binanceBtc || 0) * btcKrwPrice).toLocaleString()}
            </p>
          )}
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-slate-400 text-sm">바이낸스 USDT</h4>
          <p className="text-base md:text-xl font-bold text-green-400">
            ${Math.floor(liveBalance.binanceUsdt || 0).toLocaleString()}
          </p>
          {usdtKrwRate && (
            <p className="text-xs text-slate-500">
              ≈ ₩{Math.floor((liveBalance.binanceUsdt || 0) * usdtKrwRate).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* 활성 포지션 합계 표시 (업비트/바이낸스 분리 합산) */}
      <div className="bg-slate-800 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <h4 className="text-slate-400 text-sm">총 투자수익금</h4>
          <div className="text-right">
            {(() => {
              const total = (upbitPnlSum || 0) + (binancePnlSum || 0);
              const fmt = (v: number) => `${v >= 0 ? '+' : '−'}₩${Math.floor(Math.abs(v)).toLocaleString()}`;
              const cmp = Math.abs(upbitPnlSum || 0) > Math.abs(binancePnlSum || 0) ? '>' : '<';
              return (
                <p className={`text-base font-bold ${total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  업비트 {fmt(upbitPnlSum || 0)} {cmp} {fmt(binancePnlSum || 0)} 바이낸스
                </p>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
};
