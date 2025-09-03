import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { KimchiPremium } from "@/types/trading";

// 숫자만 갱신하는 컴포넌트 (안전한 처리 추가)
const NumberDisplay = React.memo<{ 
  value: number | undefined; 
  formatter?: (v: number) => string;
  prefix?: string;
  suffix?: string;
}>(({ value, formatter, prefix = '', suffix = '' }) => {
  const displayValue = React.useMemo(() => {
    // 값이 없거나 유효하지 않으면 기본값 반환
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    
    if (formatter) {
      return formatter(value);
    }
    return value.toFixed(3);
  }, [value, formatter]);

  return <>{prefix}{displayValue}{suffix}</>;
});

NumberDisplay.displayName = 'NumberDisplay';

interface CryptoPricesGridProps {
  kimchiData: KimchiPremium[];
}

export const CryptoPricesGrid = React.memo<CryptoPricesGridProps>(({ kimchiData }) => {
  // 상단에 고정된 5개 심볼 배열 (무조건 카드 생성)
  const FIXED_SYMBOLS = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT'];
  
  // 이전 값을 유지하는 상태 (부드러운 전환을 위해)
  const [previousValues, setPreviousValues] = useState<{[key: string]: KimchiPremium}>({});
  
  // 새로운 소켓 데이터가 오면 이전 값을 업데이트
  useEffect(() => {
    if (kimchiData && kimchiData.length > 0) {
      setPreviousValues(prev => {
        const newPrevious = {...prev};
        kimchiData.forEach(crypto => {
          newPrevious[crypto.symbol] = crypto;
        });
        return newPrevious;
      });
    }
  }, [kimchiData]); // previousValues 의존성 제거
  
  // 모든 심볼 목록 (고정 5개 + 추가된 것들)
  const allSymbols = React.useMemo(() => {
    const additionalSymbols = kimchiData
      .map(crypto => crypto.symbol)
      .filter(symbol => !FIXED_SYMBOLS.includes(symbol));
    
    return [...FIXED_SYMBOLS, ...additionalSymbols];
  }, [kimchiData]);
  
  // 각 심볼별로 현재 값 또는 이전 값 사용 (절대 깜빡이지 않음)
  const getStableValue = React.useCallback((symbol: string) => {
    const currentData = kimchiData.find(crypto => crypto.symbol === symbol);
    const previousData = previousValues[symbol];
    
    // 현재 데이터가 있으면 사용, 없으면 이전 값 유지
    return currentData || previousData || null;
  }, [kimchiData, previousValues]);

  return (
    <Card className="bg-slate-850 border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold">암호화폐별 실시간 김프율</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 고정 5개 + 추가 심볼, 절대 깜빡이지 않음 */}
          {allSymbols.map((symbol) => {
            const data = getStableValue(symbol);
            
            // 데이터가 없으면 카드는 만들되 로딩 표시
            if (!data) {
              return (
                <div
                  key={symbol}
                  className="p-4 bg-slate-800 rounded-lg border border-slate-600 opacity-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-lg">{symbol}</h3>
                      <Badge variant="outline" className="text-xs">
                        {symbol === 'BTC' ? '₿' : symbol === 'ETH' ? 'Ξ' : symbol}
                      </Badge>
                    </div>
                    <div className="flex items-center text-slate-500">
                      <span className="text-sm">연결 대기중...</span>
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <div
                key={data.symbol}
                className="p-4 bg-slate-800 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg">{data.symbol}</h3>
                    <Badge variant="outline" className="text-xs">
                      {data.symbol === 'BTC' ? '₿' : data.symbol === 'ETH' ? 'Ξ' : data.symbol}
                    </Badge>
                  </div>
                  <div className={`flex items-center ${data.premiumRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.premiumRate >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    <span className="font-bold">
                      <NumberDisplay 
                        value={data.premiumRate}
                        prefix={data.premiumRate >= 0 ? '+' : ''}
                        suffix="%"
                        formatter={(v) => v.toFixed(3)}
                      />
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">업비트</span>
                    <span className="font-mono text-blue-400">
                      ₩<NumberDisplay 
                        value={data.upbitPrice}
                        formatter={(v) => v.toLocaleString()}
                      />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">바이낸스(KRW)</span>
                    <span className="font-mono text-yellow-400">
                      ₩<NumberDisplay 
                        value={data.binancePriceKRW || ((data.binanceFuturesPrice || data.binancePrice || 0) * (data.usdKrwRate || data.exchangeRate || 1391))}
                        formatter={(v) => v?.toLocaleString()}
                      />
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-600 pt-2">
                    <span className="text-slate-500">바이낸스(USD)</span>
                    <span className="font-mono text-slate-300">
                      $<NumberDisplay 
                        value={data.binanceFuturesPrice || data.binancePrice}
                        formatter={(v) => v?.toLocaleString()}
                      />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});