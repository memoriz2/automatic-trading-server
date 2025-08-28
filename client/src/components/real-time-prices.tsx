import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StopCircle, DollarSign, Wallet, TrendingUp } from "lucide-react";
import type { KimchiPremium } from "@/types/trading";
import { BalanceDisplay } from "@/components/balance-display";

interface RealTimePricesProps {
  kimchiData: KimchiPremium[];
  currentExchangeRate: number | null;
  onEmergencyStop: () => void;
}

export function RealTimePrices({ kimchiData, currentExchangeRate, onEmergencyStop }: RealTimePricesProps) {
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
              {currentExchangeRate ? `₩${currentExchangeRate.toFixed(2)}` : '로딩중...'}
            </div>
            <div className="text-sm text-slate-400 mt-1">USD/KRW</div>
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
          {kimchiData.find(data => data.symbol === 'BTC') ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">업비트</span>
                <span className="font-mono text-blue-400">
                  ₩{kimchiData.find(data => data.symbol === 'BTC')?.upbitPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">바이낸스 선물</span>
                <span className="font-mono text-yellow-400">
                  ${kimchiData.find(data => data.symbol === 'BTC')?.binancePrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-600 pt-2">
                <span className="text-sm text-slate-400">김프율</span>
                <span className={`font-mono font-bold ${
                  (kimchiData.find(data => data.symbol === 'BTC')?.premiumRate || 0) >= 0 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {(kimchiData.find(data => data.symbol === 'BTC')?.premiumRate || 0) >= 0 ? '+' : ''}
                  {(kimchiData.find(data => data.symbol === 'BTC')?.premiumRate || 0).toFixed(3)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              가격 데이터 로딩중...
            </div>
          )}
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
}