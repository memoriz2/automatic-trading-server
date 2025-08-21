import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { KimchiPremium } from "@/types/trading";

interface CryptoPricesGridProps {
  kimchiData: KimchiPremium[];
}

export function CryptoPricesGrid({ kimchiData }: CryptoPricesGridProps) {
  return (
    <Card className="bg-slate-850 border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold">암호화폐별 실시간 김프율</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kimchiData.map((crypto) => (
            <div
              key={crypto.symbol}
              className="p-4 bg-slate-800 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-lg">{crypto.symbol}</h3>
                  <Badge variant="outline" className="text-xs">
                    {crypto.symbol === 'BTC' ? '₿' : crypto.symbol === 'ETH' ? 'Ξ' : crypto.symbol}
                  </Badge>
                </div>
                <div className={`flex items-center ${
                  crypto.premiumRate >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {crypto.premiumRate >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <span className="font-bold">
                    {crypto.premiumRate >= 0 ? '+' : ''}{crypto.premiumRate.toFixed(3)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">업비트</span>
                  <span className="font-mono text-blue-400">
                    ₩{crypto.upbitPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">바이낸스</span>
                  <span className="font-mono text-yellow-400">
                    ${crypto.binancePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-600 pt-2">
                  <span className="text-slate-500">환율 적용</span>
                  <span className="font-mono text-slate-300">
                    ₩{(crypto.binancePrice * (crypto.exchangeRate || 1370)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {kimchiData.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            실시간 데이터를 불러오는 중...
          </div>
        )}
      </CardContent>
    </Card>
  );
}