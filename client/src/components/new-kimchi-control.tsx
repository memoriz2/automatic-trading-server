import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, AlertTriangle, TrendingUp, TrendingDown, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { TradingSettings } from "@/types/trading";

interface NewKimchiControlProps {
  userId: number;
}

export function NewKimchiControl({ userId }: NewKimchiControlProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // 자동매매 상태 조회
  const { data: tradingStatus } = useQuery<{isActive: boolean, newKimchiActive: boolean, totalActive: boolean}>({
    queryKey: ['/api/trading/status'],
    refetchInterval: 10000, // 10초마다 상태 확인 (API 제한으로 인한 조정)
  });

  // 전략 설정 조회
  const { data: settings, isLoading: settingsLoading } = useQuery<TradingSettings>({
    queryKey: [`/api/trading-settings/${userId}`],
    refetchInterval: 3000, // 3초마다 새로고침
    staleTime: 0, // 항상 최신 데이터 가져오기
  });

  const isNewKimchiActive = tradingStatus?.newKimchiActive || false;

  // 새로운 김프 자동매매 시작
  const startTradingMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 자동매매 시작 시도:', userId);
      const response = await fetch(`/api/new-kimchi-trading/start/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 호출 실패:', response.status, errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ API 호출 성공:', result);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "새로운 김프 자동매매 시작",
        description: "업비트 롱 + 바이낸스 숏 전략이 시작되었습니다.",
      });
      // 모든 관련 캐시 무효화하여 실시간 업데이트 보장
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      
      console.log('🎯 자동매매 시작 응답:', data);
    },
    onError: (error: any) => {
      toast({
        title: "자동매매 시작 실패",
        description: error.message || "자동매매 시작 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsStarting(false);
      console.log('🔄 자동매매 시작 뮤테이션 완료');
    }
  });

  // 새로운 김프 자동매매 중지
  const stopTradingMutation = useMutation({
    mutationFn: async () => {
      console.log('🛑 자동매매 중지 시도');
      const response = await fetch('/api/new-kimchi-trading/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 호출 실패:', response.status, errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ API 호출 성공:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "새로운 김프 자동매매 중지",
        description: "자동매매가 안전하게 중지되었습니다.",
      });
      // 모든 관련 캐시 무효화하여 실시간 업데이트 보장
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
    },
    onError: (error: any) => {
      toast({
        title: "자동매매 중지 실패",
        description: error.message || "자동매매 중지 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsStopping(false);
      console.log('🔄 자동매매 중지 뮤테이션 완료');
    }
  });

  const handleStart = () => {
    startTradingMutation.mutate();
  };

  const handleStop = () => {
    stopTradingMutation.mutate();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            새로운 김프 자동매매
          </div>
          <Badge variant={isNewKimchiActive ? "default" : "secondary"}>
            {isNewKimchiActive ? "실행 중" : "중지됨"}
          </Badge>
        </CardTitle>
        <CardDescription>
          업비트 롱 + 바이낸스 숏으로 자본을 보호하면서 순수 김프 상승으로만 수익을 내는 안전한 차익거래
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 현재 전략 설정 표시 */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-blue-400" />
            <h4 className="font-medium text-blue-300">현재 설정된 전략</h4>
            {settingsLoading && <div className="ml-2 animate-spin w-3 h-3">⚪</div>}
          </div>
          
          {settings && settings.kimchiEntryRate ? (
            <div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-400">진입:</span> {settings.kimchiEntryRate}% 이하
                </div>
                <div>
                  <span className="text-red-400">청산:</span> {settings.kimchiExitRate}% 이상
                </div>
                <div>
                  <span className="text-blue-400">투자:</span> {parseInt(settings.upbitEntryAmount || '0').toLocaleString()}원
                </div>
                <div>
                  <span className="text-yellow-400">레버리지:</span> {settings.binanceLeverage}배
                </div>
              </div>
              <div className="mt-2 text-xs text-purple-400">
                예상수익: {((parseFloat(settings.kimchiExitRate || '0') - parseFloat(settings.kimchiEntryRate || '0')) * parseInt(settings.upbitEntryAmount || '0') * 0.01).toLocaleString()}원
              </div>
            </div>
          ) : (
            <div className="text-yellow-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>전략 설정이 필요합니다. 우측 상단 '전략 설정' 버튼을 클릭하세요.</span>
            </div>
          )}
        </div>

        {/* 전략 설명 */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            전략 개요
          </h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>업비트 롱:</strong> KRW로 코인 현물 매수 (자동 롱 포지션)</p>
            <p>• <strong>바이낸스 숏:</strong> 동일 수량으로 선물 숏 포지션</p>
            <p>• <strong>자본 보호:</strong> 코인 가격 변동에 중립적</p>
            <p>• <strong>수익 창출:</strong> 순수 김프율 상승으로만 수익</p>
          </div>
        </div>

        {/* 상태 표시 및 중지 버튼 */}
        <div className="flex gap-3">
          {isNewKimchiActive ? (
            <Button
              onClick={handleStop}
              disabled={isStopping}
              variant="destructive"
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-2" />
              {isStopping ? "중지 중..." : "자동매매 중지"}
            </Button>
          ) : (
            <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                차익거래를 시작하려면 우측 상단 "전략 설정" 버튼을 클릭하세요
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                설정 완료 후 Dialog 내에서 "차익거래 시작" 버튼으로 시작 가능
              </div>
            </div>
          )}
        </div>

        {/* 현재 상태 */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-lg font-bold text-success">업비트 롱</div>
            <div className="text-xs text-muted-foreground">KRW 현물 매수</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-lg font-bold text-danger">바이낸스 숏</div>
            <div className="text-xs text-muted-foreground">선물 숏 포지션</div>
          </div>
        </div>

        {/* 주의사항 */}
        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="w-4 h-4" />
            주의사항
          </h4>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <p>• 바이낸스 최소 수량 제한: 0.001 이상 구매 가능한 금액 설정 필요</p>
            <p>• 업비트와 바이낸스 API 키가 모두 설정되어 있어야 합니다</p>
            <p>• 레버리지 사용 시 주의: 자본 관리 철저히</p>
            <p>• 김프율 변동에 따른 자동 진입/청산</p>
          </div>
        </div>

        {isNewKimchiActive && (
          <div className="text-center text-sm text-muted-foreground">
            <div className="animate-pulse">🔄 실시간 김프율 모니터링 중...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}