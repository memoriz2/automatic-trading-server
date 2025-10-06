import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

interface LegacyDataDisplayProps {
  kimp: any;
  balances: any;
  metrics: any;
  serverState: any;
  logs: string;
  sparkData: Array<{ time: number; value: number }>;
}

export const LegacyDataDisplay = React.memo(({
  kimp,
  balances,
  metrics,
  logs
}: LegacyDataDisplayProps) => {

  const kimchiInfo = useMemo(() => {
    if (!kimp || typeof kimp.premiumRate !== 'number') {
      return { rate: 0, color: 'text-slate-400', status: '데이터 없음' };
    }

    const rate = kimp.premiumRate;
    const color = rate > 0 ? 'text-green-400' : rate < 0 ? 'text-red-400' : 'text-slate-400';
    const status = rate > 2 ? '매수기회' : rate < -2 ? '매도기회' : '보합';

    return { rate, color, status };
  }, [kimp]);

  const balanceInfo = useMemo(() => {
    const real = balances?.real || {};
    const connected = balances?.connected || {};

    return {
      upbitKRW: real.krw_upbit || 0,
      upbitBTC: real.btc_upbit || 0,
      binanceUSDT: real.usdt_binance || 0,
      binanceBTC: real.btc_binance || 0,
      isConnected: connected.upbit && connected.binance
    };
  }, [balances]);

  const performanceMetrics = useMemo(() => {
    if (!metrics) return null;

    return {
      totalPnL: metrics.totalPnL || 0,
      todayPnL: metrics.todayPnL || 0,
      winRate: metrics.winRate || 0,
      totalTrades: metrics.totalTrades || 0
    };
  }, [metrics]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      {/* 김치 프리미엄 정보 */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">김치 프리미엄</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">현재 프리미엄:</span>
            <span className={`font-bold text-lg ${kimchiInfo.color}`}>
              {kimchiInfo.rate.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">시장 상태:</span>
            <Badge variant={kimchiInfo.status === '보합' ? 'secondary' : 'default'}>
              {kimchiInfo.status}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">업비트 가격:</span>
            <span className="text-white font-mono">
              ₩{(kimp?.upbit_price || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">바이낸스 가격:</span>
            <span className="text-white font-mono">
              ${(kimp?.binance_price || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 잔고 정보 */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">잔고 현황</h3>
          <Badge variant={balanceInfo.isConnected ? "default" : "destructive"}>
            {balanceInfo.isConnected ? '연결됨' : '연결 없음'}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">업비트 KRW:</span>
            <span className="text-blue-400 font-mono">
              ₩{balanceInfo.upbitKRW.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">업비트 BTC:</span>
            <span className="text-yellow-400 font-mono">
              {balanceInfo.upbitBTC.toFixed(6)} BTC
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">바이낸스 USDT:</span>
            <span className="text-green-400 font-mono">
              ${balanceInfo.binanceUSDT.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">바이낸스 BTC:</span>
            <span className="text-orange-400 font-mono">
              {balanceInfo.binanceBTC.toFixed(6)} BTC
            </span>
          </div>
        </div>
      </div>

      {/* 성과 지표 */}
      {performanceMetrics && (
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">성과 지표</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">총 손익:</span>
              <span className={`font-bold ${performanceMetrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {performanceMetrics.totalPnL >= 0 ? '+' : ''}₩{performanceMetrics.totalPnL.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">오늘 손익:</span>
              <span className={`font-bold ${performanceMetrics.todayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {performanceMetrics.todayPnL >= 0 ? '+' : ''}₩{performanceMetrics.todayPnL.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">승률:</span>
              <span className="text-white font-bold">
                {performanceMetrics.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">총 거래:</span>
              <span className="text-white font-bold">
                {performanceMetrics.totalTrades}회
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 서버 로그 */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">서버 로그</h3>
        <div className="bg-slate-900 p-3 rounded h-40 overflow-y-auto">
          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
            {logs}
          </pre>
        </div>
      </div>
    </div>
  );
});

LegacyDataDisplay.displayName = 'LegacyDataDisplay';