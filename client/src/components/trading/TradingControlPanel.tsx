import React from 'react';
import { Badge } from '@/components/ui/badge';
import { isNum } from '@/utils/trading/formatters';

interface TradingControlPanelProps {
  serverState: any;
  starting: boolean;
  handleStart: () => void;
  handleStop: () => void;
  kimp: any;
  balances: any;
  metrics: any;
}

export const TradingControlPanel: React.FC<TradingControlPanelProps> = ({
  serverState,
  starting,
  handleStart,
  handleStop,
  kimp,
  balances,
  metrics
}) => {
  const isRunning = serverState?.running || false;

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">자동매매 제어</h3>
        <div className="flex items-center gap-2">
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? '실행중' : '정지됨'}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {/* 현재 상태 */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">김치프리미엄</div>
            <div className="text-lg font-mono">
              {isNum(kimp.kimp) ? `${Number(kimp.kimp).toFixed(3)}%` : '-'}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">상태</div>
            <div className="text-lg">
              {serverState?.status || '알 수 없음'}
            </div>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={starting}
              className="btn btn-primary flex-1"
            >
              {starting ? '시작 중...' : '자동매매 시작'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="btn btn-destructive flex-1"
            >
              자동매매 정지
            </button>
          )}
        </div>

        {/* 잔고 정보 */}
        <div className="space-y-2">
          <div className="text-sm font-medium">잔고 현황</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">KRW:</span>
              <span className="font-mono">
                {balances?.real?.krw ? Number(balances.real.krw).toLocaleString() : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">USDT:</span>
              <span className="font-mono">
                {balances?.real?.usdt ? Number(balances.real.usdt).toLocaleString() : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BTC(업비트):</span>
              <span className="font-mono">
                {balances?.real?.btc_upbit ? Number(balances.real.btc_upbit).toFixed(6) : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BTC(바이낸스):</span>
              <span className="font-mono">
                {balances?.real?.btc_binance ? Number(balances.real.btc_binance).toFixed(6) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 성과 요약 */}
        <div className="space-y-2">
          <div className="text-sm font-medium">오늘의 성과</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">총 주문:</span>
              <span className="font-mono" id="metric-total">
                {Number(metrics?.total_orders || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">진입:</span>
              <span className="font-mono" id="metric-entries">
                {Number(metrics?.entries || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">청산:</span>
              <span className="font-mono" id="metric-exits">
                {Number(metrics?.exits || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">오류:</span>
              <span className="font-mono" id="metric-errors">
                {Number(metrics?.errors || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* PNL 및 수수료 */}
        <div className="space-y-2">
          <div className="text-sm font-medium">손익 현황</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">누적 PNL:</span>
              <span className="font-mono" id="pnl-krw-sum">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">업비트 수수료:</span>
              <span className="font-mono" id="fee-upbit-krw">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">바이낸스 수수료(USDT):</span>
              <span className="font-mono" id="fee-binance-usdt">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">바이낸스 수수료(KRW):</span>
              <span className="font-mono" id="fee-binance-krw">-</span>
            </div>
          </div>
        </div>

        {/* 사용 증거금 */}
        <div className="space-y-2">
          <div className="text-sm font-medium">증거금 사용량</div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">사용 중인 증거금:</span>
            <span className="font-mono" id="used-margin-krw">-</span>
          </div>
        </div>
      </div>
    </div>
  );
};