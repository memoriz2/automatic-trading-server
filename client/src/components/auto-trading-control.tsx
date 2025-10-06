import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, AlertTriangle, Settings } from "lucide-react";

interface TradingStatus {
  isActive: boolean;
}

export function AutoTradingControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // 자동매매 상태 조회
  const { data: tradingStatus, isLoading: statusLoading } = useQuery<TradingStatus>({
    queryKey: ['/api/trading/status'],
    refetchInterval: 10000, // 10초마다 상태 확인 (API 제한으로 인한 조정)
  });

  // 자동매매 시작
  const startTradingMutation = useMutation({
    mutationFn: async () => {
      setIsStarting(true);
      return apiRequest('POST', '/api/trading/start/1');
    },
    onSuccess: () => {
      toast({
        title: "자동매매 시작",
        description: "역김프 자동매매가 시작되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: (error: any) => {
      toast({
        title: "자동매매 시작 실패",
        description: error?.error || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsStarting(false);
    }
  });

  // 자동매매 중지
  const stopTradingMutation = useMutation({
    mutationFn: async () => {
      setIsStopping(true);
      return apiRequest('POST', '/api/trading/stop');
    },
    onSuccess: () => {
      toast({
        title: "자동매매 중지",
        description: "자동매매가 중지되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: (error: any) => {
      toast({
        title: "자동매매 중지 실패",
        description: error?.error || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsStopping(false);
    }
  });

  // 긴급 정지
  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/trading/emergency-stop/1');
    },
    onSuccess: () => {
      toast({
        title: "긴급 정지 완료",
        description: "모든 포지션이 강제 청산되었습니다.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: (error: any) => {
      toast({
        title: "긴급 정지 실패",
        description: error?.error || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  const isActive = tradingStatus?.isActive || false;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              역김프 자동매매 제어
            </CardTitle>
            <CardDescription>
              현재 김프율 기준으로 자동 차익거래를 실행합니다
            </CardDescription>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>
            {statusLoading ? "확인중..." : isActive ? "실행중" : "중지됨"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 현재 상황 안내 */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>현재 역김프 상황:</strong> 모든 코인이 -0.5% ~ -1.5% 역김프 상태입니다.
            <br />
            <strong>전략:</strong> 바이낸스 선물 매수 → 업비트 현물 매도로 차익 실현
          </AlertDescription>
        </Alert>

        {/* 자동매매 기준 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">진입 기준</div>
            <div className="font-semibold">-0.5% 이하</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">청산 기준</div>
            <div className="font-semibold">-0.2% 이상</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">환율 기준</div>
            <div className="font-semibold">1372.0892원 고정</div>
          </div>
        </div>

        {/* 제어 버튼 */}
        <div className="flex gap-3">
          {!isActive ? (
            <Button
              onClick={() => startTradingMutation.mutate()}
              disabled={isStarting || startTradingMutation.isPending}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              {isStarting ? "시작중..." : "자동매매 시작"}
            </Button>
          ) : (
            <Button
              onClick={() => stopTradingMutation.mutate()}
              disabled={isStopping || stopTradingMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-2" />
              {isStopping ? "중지중..." : "자동매매 중지"}
            </Button>
          )}
          
          <Button
            onClick={() => emergencyStopMutation.mutate()}
            disabled={emergencyStopMutation.isPending}
            variant="destructive"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {emergencyStopMutation.isPending ? "정지중..." : "긴급정지"}
          </Button>
        </div>

        {/* 상태 정보 */}
        {isActive && (
          <div className="text-sm text-muted-foreground text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            💹 역김프 자동매매가 실행중입니다. 
            김프율이 -0.5% 이하로 떨어지면 자동으로 포지션을 생성합니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}