import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Wallet, DollarSign, AlertTriangle } from 'lucide-react';

interface BalanceDisplayProps {
  userId: number;
}

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

export function BalanceDisplay({ userId }: BalanceDisplayProps) {
  const { data: balances, isLoading } = useQuery<BalanceData>({
    queryKey: ['/api/balances', userId],
    refetchInterval: 2500, // 2.5초마다 업데이트
    staleTime: 0, // 항상 fresh하게 처리
    gcTime: 0, // 캐시 무효화
  });

  if (isLoading || !balances) {
    return (
      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Wallet className="h-4 w-4 animate-pulse" />
          <span>잔고 업데이트 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 text-sm">
      
      {/* 업비트 KRW 잔고 */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Wallet className="h-4 w-4 text-blue-500" />
          <span className="font-medium">업비트</span>
        </div>
        {balances.upbit.connected ? (
          <Badge variant="outline" className="text-xs">
            {Math.floor(balances.upbit.krw).toLocaleString()} KRW
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
        {balances.binance.connected ? (
          <>
            {balances.binance.usdt === 0 ? (
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
                ${balances.binance.usdt.toLocaleString()} USDT
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
}