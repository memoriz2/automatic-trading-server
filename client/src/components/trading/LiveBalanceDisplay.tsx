import React from 'react';
import { formatBTC, formatPrice, formatInteger } from '@/utils/trading/formatters';

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
}

export const LiveBalanceDisplay: React.FC<LiveBalanceDisplayProps> = ({
  liveBalance,
  openUpbitQty,
  openBinanceQty,
  profitRate,
  totalPnl
}) => {
  return (
    <>
      {/* 잔고 표시 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-slate-400 text-sm">업비트 KRW</h4>
          <p className="text-xl font-bold text-blue-400">
            ₩{Math.floor(liveBalance.krw || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-slate-400 text-sm">업비트 BTC</h4>
          <p className="text-xl font-bold text-yellow-400">
            {formatBTC(openUpbitQty || 0)} BTC
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-slate-400 text-sm">바이낸스 BTC (선물)</h4>
          <p className="text-xl font-bold text-orange-400">
            {formatBTC(openBinanceQty || 0)} BTC
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-slate-400 text-sm">바이낸스 USDT</h4>
          <p className="text-xl font-bold text-green-400">
            ${Math.floor(liveBalance.binanceUsdt || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* 수익률 표시 */}
      <div className="bg-slate-800 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <h4 className="text-slate-400 text-sm">총 수익률</h4>
          <div className="text-right">
            <p className={`text-xl font-bold ${profitRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitRate >= 0 ? '+' : ''}{isFinite(profitRate) ? profitRate.toFixed(2) : '0.00'}%
            </p>
            <p className={`text-sm ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}₩{isFinite(totalPnl) ? totalPnl.toLocaleString() : '0'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
