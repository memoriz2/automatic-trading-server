import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import type { KimchiPremium } from "@/types/trading";

interface PriceChartProps {
  kimchiData: KimchiPremium[];
}

export function PriceChart({ kimchiData }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState("1분");
  const currentTime = new Date().toLocaleTimeString('ko-KR');
  
  // BTC 데이터 찾기
  const btcData = kimchiData.find(data => data.symbol === 'BTC');
  
  // 가격 포맷팅 함수
  const formatPrice = (price: number, currency: string = '원') => {
    if (currency === '원') {
      return new Intl.NumberFormat('ko-KR').format(price) + currency;
    } else {
      return '$' + new Intl.NumberFormat('en-US').format(price);
    }
  };

  return (
    <Card className="lg:col-span-2 bg-slate-850 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">실시간 김프율 차트</CardTitle>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-20 bg-slate-800 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1분">1분</SelectItem>
              <SelectItem value="5분">5분</SelectItem>
              <SelectItem value="15분">15분</SelectItem>
              <SelectItem value="1시간">1시간</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Area with Bitcoin Prices */}
        <div className="h-80 bg-slate-800 rounded-lg border border-slate-600">
          {/* Bitcoin Price Display */}
          <div className="p-4 border-b border-slate-700">
            <div className="grid grid-cols-2 gap-6">
              {/* 업비트 BTC 가격 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-400">업비트 BTC</span>
                </div>
                <div className="text-xl font-mono text-white">
                  {btcData ? formatPrice(btcData.upbitPrice) : '로딩중...'}
                </div>
                <div className="text-xs text-slate-400">현물 거래소</div>
              </div>
              
              {/* 바이낸스 BTC 가격 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-400">바이낸스 BTCUSDT</span>
                </div>
                <div className="text-xl font-mono text-white">
                  {btcData && btcData.binancePriceUSD ? formatPrice(btcData.binancePriceUSD, '$') : '로딩중...'}
                </div>
                <div className="text-xs text-slate-400">선물 거래소 (USD)</div>
              </div>
            </div>
            
            {/* 김프율 표시 */}
            {btcData && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-700">
                  <span className="text-sm text-slate-400">BTC 김프율:</span>
                  <span className={`text-lg font-bold ${btcData.premiumRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {btcData.premiumRate >= 0 ? '+' : ''}{btcData.premiumRate.toFixed(3)}%
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Chart Placeholder */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-3">실시간 김프율 차트</p>
              <div className="space-y-1">
                {kimchiData.slice(0, 3).map((data, index) => (
                  <p key={index} className="text-xs text-slate-500">
                    {data.symbol}: {data.premiumRate >= 0 ? '+' : ''}{data.premiumRate.toFixed(2)}%
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-sm text-slate-400">김프율</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm text-slate-400">진입 신호</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-danger rounded-full"></div>
              <span className="text-sm text-slate-400">청산 신호</span>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            마지막 업데이트: {currentTime}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
