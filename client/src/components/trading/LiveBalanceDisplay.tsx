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
  realtimeBalances?: { upbitBtc: number; binanceBtc: number; timestamp: string };
  balanceLoading?: boolean;
  btcKrwPrice?: number;
  usdtKrwRate?: number;
}

export const LiveBalanceDisplay: React.FC<LiveBalanceDisplayProps> = ({
  liveBalance,
  profitRate,
  totalPnl,
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

      {/* 수익률 표시 */}
      <div className="bg-slate-800 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <h4 className="text-slate-400 text-sm">총 투자수익금</h4>
          <div className="text-right">
            <p className={`text-xl font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : '−'}₩{isFinite(totalPnl) ? Math.floor(Math.abs(totalPnl)).toLocaleString() : '0'}
            </p>
            <p className={`text-sm ${profitRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({profitRate >= 0 ? '+' : '−'}{isFinite(profitRate) ? Math.abs(profitRate).toFixed(2) : '0.00'}%)
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
