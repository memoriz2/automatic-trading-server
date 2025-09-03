import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StopCircle, DollarSign, Wallet, TrendingUp } from "lucide-react";
import type { KimchiPremium } from "@/types/trading";
import { BalanceDisplay } from "@/components/balance-display";

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
    return value.toFixed(3);
  }, [value, formatter]);

  return <>{prefix}{displayValue}{suffix}</>;
});

NumberDisplay.displayName = 'NumberDisplay';

interface RealTimePricesProps {
  kimchiData: KimchiPremium[];
  currentExchangeRate: number | null;
  onEmergencyStop: () => void;
}

export const RealTimePrices = React.memo<RealTimePricesProps>(({ kimchiData, currentExchangeRate, onEmergencyStop }) => {
  // 이전 값을 유지하는 상태 (부드러운 전환을 위해)
  const [previousBtcData, setPreviousBtcData] = useState<KimchiPremium | null>(null);
  const [previousExchangeRate, setPreviousExchangeRate] = useState<number | null>(null);
  
  // 새로운 BTC 데이터가 오면 이전 값 업데이트
  useEffect(() => {
    const btcData = kimchiData.find(data => data.symbol === 'BTC');
    if (btcData) {
      setPreviousBtcData(btcData);
    }
  }, [kimchiData]);
  
  // 새로운 환율 데이터가 오면 이전 값 업데이트
  useEffect(() => {
    if (currentExchangeRate && currentExchangeRate !== previousExchangeRate) {
      console.log('🔄 RealTimePrices 환율 업데이트:', previousExchangeRate, '→', currentExchangeRate);
      setPreviousExchangeRate(currentExchangeRate);
    }
  }, [currentExchangeRate, previousExchangeRate]);
  
  // 현재 값 또는 이전 값 사용 (부드러운 전환)
  const stableBtcData = kimchiData.find(data => data.symbol === 'BTC') || previousBtcData;
  const stableExchangeRate = currentExchangeRate || previousExchangeRate || 1394.0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 실시간 환율 */}
      <Card className="bg-slate-850 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-400" />
            실시간 환율
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 font-mono">
              ₩<NumberDisplay 
                value={stableExchangeRate}
                formatter={(v) => v.toFixed(2)}
              />
            </div>
            <div className="text-sm text-slate-400 mt-1">USD/KRW</div>
            <div className="text-xs text-slate-500 mt-1">
              현재: {currentExchangeRate?.toFixed(2) || 'null'} | 이전: {previousExchangeRate?.toFixed(2) || 'null'}
            </div>
            <Badge variant="outline" className="mt-2 text-xs">
              Google Finance (3초마다 업데이트)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 업비트 & 바이낸스 가격 */}
      <Card className="bg-slate-850 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            실시간 가격 (BTC)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* UI는 완전히 고정, 숫자만 비동기로 갱신 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">업비트</span>
              <span className="font-mono text-blue-400">
                ₩<NumberDisplay 
                  value={stableBtcData?.upbitPrice || 153906000}
                  formatter={(v) => v.toLocaleString()}
                />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">바이낸스 선물</span>
              <span className="font-mono text-yellow-400">
                $<NumberDisplay 
                  value={stableBtcData?.binancePrice || 152861189}
                  formatter={(v) => v.toLocaleString()}
                />
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-600 pt-2">
              <span className="text-sm text-slate-400">김프율</span>
              <span className="font-mono font-bold text-green-400">
                <NumberDisplay 
                  value={stableBtcData?.premiumRate || 0.684}
                  prefix={stableBtcData?.premiumRate && stableBtcData.premiumRate >= 0 ? '+' : ''}
                  suffix="%"
                  formatter={(v) => v.toFixed(3)}
                />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 잔고 및 긴급정지 */}
      <Card className="bg-slate-850 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-purple-400" />
            잔고 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 잔고 표시 */}
            <BalanceDisplay />
            
            {/* 긴급 정지 버튼 */}
            <Button 
              variant="destructive"
              onClick={onEmergencyStop}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              긴급 정지
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});