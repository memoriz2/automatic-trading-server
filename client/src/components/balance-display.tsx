import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Wallet, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// 숫자만 갱신하는 컴포넌트
const NumberDisplay = React.memo<{ 
  value: number; 
  formatter?: (v: number) => string;
  suffix?: string;
}>(({ value, formatter, suffix = '' }) => {
  const displayValue = React.useMemo(() => {
    if (formatter) {
      return formatter(value);
    }
    return value.toFixed(3);
  }, [value, formatter]);

  return <>{displayValue}{suffix}</>;
});

NumberDisplay.displayName = 'NumberDisplay';

interface BalanceData {
  upbit: {
    krw: number;
    connected: boolean;
  };
  binance: {
    usdt: number;
    connected: boolean;
  };
}

export const BalanceDisplay = React.memo(() => {
  const { user } = useAuth();
  const userId = user?.id;
  
  // 이전 값을 유지하는 상태 (부드러운 전환을 위해)
  const [previousBalances, setPreviousBalances] = useState<BalanceData | null>(null);
  
  const { data: balances, isLoading, error } = useQuery<BalanceData>({
    queryKey: [`/api/balances/${userId}`],
    refetchInterval: 60000, // 60초마다 잔고 조회 (API 제한으로 인한 조정)
    staleTime: 0, // 항상 fresh하게 처리
    gcTime: 0, // 캐시 무효화
    enabled: !!userId, // 로그인한 경우에만 API 호출
  });

  // 새로운 잔고 데이터가 오면 이전 값 업데이트
  useEffect(() => {
    if (balances) {
      setPreviousBalances(balances);
    }
  }, [balances]);

  // 현재 값 또는 이전 값 사용 (부드러운 전환)
  const stableBalances = balances || previousBalances;

  // 개발 환경에서만 디버깅 로그 출력
  if (process.env.NODE_ENV === 'development' && error) {
    console.error('❌ BalanceDisplay 오류:', error);
  }

  // 로그인하지 않은 경우
  if (!userId) {
    return (
      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Wallet className="h-4 w-4" />
          <span>로그인이 필요합니다</span>
        </div>
      </div>
    );
  }

  // UI는 항상 표시 (로딩 메시지 제거)

  return (
    <div className="flex items-center space-x-4 text-sm">
      
      {/* 업비트 KRW 잔고 */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Wallet className="h-4 w-4 text-blue-500" />
          <span className="font-medium">업비트</span>
        </div>
        {isLoading && !stableBalances?.upbit.connected ? (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            로딩중
          </Badge>
        ) : stableBalances?.upbit.connected ? (
          <Badge variant="outline" className="text-xs">
            ₩<NumberDisplay 
              value={Math.floor(stableBalances.upbit.krw)}
              formatter={(v) => Math.floor(v).toLocaleString()}
              suffix=""
            />
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            연결안됨
          </Badge>
        )}
      </div>

      {/* 바이낸스 선물 USDT 잔고 */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <DollarSign className="h-4 w-4 text-yellow-500" />
          <span className="font-medium">바이낸스 선물</span>
        </div>
        {isLoading && !stableBalances?.binance.connected ? (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            로딩중
          </Badge>
        ) : stableBalances?.binance.connected ? (
          <>
            {(stableBalances.binance.usdt || 0) === 0 ? (
              <>
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                  잔고 조회 제한
                </Badge>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">바이낸스 지역 제한으로 실시간 잔고 조회가 불가능합니다.<br/>
                    실제 USDT 잔고는 바이낸스 웹사이트에서 직접 확인하세요.<br/>
                    김프 계산은 fallback 가격으로 정상 작동합니다.</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <Badge variant="outline" className="text-xs">
                $<NumberDisplay 
                  value={stableBalances.binance.usdt}
                  formatter={(v) => Math.floor(v).toLocaleString()}
                  suffix=""
                />
              </Badge>
            )}
          </>
        ) : (
          <Badge variant="secondary" className="text-xs">
            연결안됨
          </Badge>
        )}
      </div>
    </div>
  );
});