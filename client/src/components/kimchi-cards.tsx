import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, BarChart3, Layers, ArrowLeftRight } from "lucide-react";
import type { KimchiPremium, Position } from "@/types/trading";

// 숫자만 갱신하는 컴포넌트
const NumberDisplay = React.memo<{ 
  value: number; 
  formatter?: (v: number) => string;
  prefix?: string;
  suffix?: string;
}>(({ value, formatter, prefix = '', suffix = '' }) => {
  const displayValue = React.useMemo(() => {
    if (formatter) {
      return formatter(value);
    }
    return value.toFixed(2);
  }, [value, formatter]);

  return <>{prefix}{displayValue}{suffix}</>;
});

NumberDisplay.displayName = 'NumberDisplay';

interface KimchiCardsProps {
  kimchiData: KimchiPremium[];
  positions: Position[];
  dailyProfitRate: number;
  todayTradeCount: number;
}

export const KimchiCards = React.memo<KimchiCardsProps>(({ kimchiData, positions, dailyProfitRate, todayTradeCount }) => {
  // 이전 값을 유지하는 상태 (부드러운 전환을 위해)
  const [previousBtcData, setPreviousBtcData] = useState<KimchiPremium | null>(null);
  
  // 새로운 BTC 데이터가 오면 이전 값 업데이트
  useEffect(() => {
    const btcData = kimchiData.find(data => data.symbol === 'BTC');
    if (btcData) {
      setPreviousBtcData(btcData);
    }
  }, [kimchiData]);
  
  // 현재 값 또는 이전 값 사용 (부드러운 전환)
  const stableBtcData = kimchiData.find(data => data.symbol === 'BTC') || previousBtcData;
  const mainPremiumRate = stableBtcData ? stableBtcData.premiumRate : 0;

  // 총 투자금 계산
  const totalInvestment = positions.reduce((sum, pos) => {
    return sum + (parseFloat(pos.entryPrice.toString()) * parseFloat(pos.quantity.toString()));
  }, 0);

  // 성공률 계산 (임시)
  const successRate = 83.3;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 현재 김프율 */}
      <Card className="bg-slate-850 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">현재 김프율</p>
              <p className={`text-2xl font-bold ${mainPremiumRate >= 0 ? 'text-success' : 'text-danger'}`}>
                <NumberDisplay 
                  value={mainPremiumRate}
                  prefix={mainPremiumRate >= 0 ? '+' : ''}
                  suffix="%"
                  formatter={(v) => v.toFixed(2)}
                />
              </p>
              <p className="text-xs text-slate-500 mt-1">BTC 기준</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              mainPremiumRate >= 0 ? 'bg-success/20' : 'bg-danger/20'
            }`}>
              {mainPremiumRate >= 0 ? (
                <ArrowUp className="text-success" />
              ) : (
                <ArrowDown className="text-danger" />
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {mainPremiumRate >= 0 ? (
              <ArrowUp className="text-success mr-1 w-4 h-4" />
            ) : (
              <ArrowDown className="text-danger mr-1 w-4 h-4" />
            )}
            <span className={mainPremiumRate >= 0 ? 'text-success' : 'text-danger'}>
              <NumberDisplay 
                value={Math.abs(mainPremiumRate * 0.1)}
                suffix="%"
                formatter={(v) => v.toFixed(3)}
              />
            </span>
            <span className="text-slate-400 ml-1">실시간 변동</span>
          </div>
        </CardContent>
      </Card>

      {/* 일일 수익률 */}
      <Card className="bg-slate-850 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">일일 수익률</p>
              <p className={`text-2xl font-bold ${dailyProfitRate >= 0 ? 'text-success' : 'text-danger'}`}>
                <NumberDisplay 
                  value={dailyProfitRate}
                  prefix={dailyProfitRate >= 0 ? '+' : ''}
                  suffix="%"
                  formatter={(v) => v.toFixed(2)}
                />
              </p>
            </div>
            <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-success" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-400">목표 대비</span>
            <span className="text-success ml-1">
              <NumberDisplay 
                value={(dailyProfitRate / 2) * 100}
                suffix="%"
                formatter={(v) => v.toFixed(1)}
              />
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 활성 포지션 */}
      <Card className="bg-slate-850 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">활성 포지션</p>
              <p className="text-2xl font-bold text-white">{positions.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Layers className="text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-400">총 투자금</span>
            <span className="text-white ml-1">
              ₩<NumberDisplay 
                value={totalInvestment / 10000}
                suffix="만"
                formatter={(v) => v.toFixed(0)}
              />
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 오늘 거래횟수 */}
      <Card className="bg-slate-850 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">오늘 거래횟수</p>
              <p className="text-2xl font-bold text-white">{todayTradeCount}</p>
            </div>
            <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
              <ArrowLeftRight className="text-warning" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-400">성공률</span>
            <span className="text-success ml-1">
              <NumberDisplay 
                value={successRate}
                suffix="%"
                formatter={(v) => v.toFixed(1)}
              />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
