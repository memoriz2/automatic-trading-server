import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Settings, TrendingUp, AlertTriangle, Zap, DollarSign } from "lucide-react";

interface AdvancedTradingControlProps {
  userId: number;
}

interface TradingConfig {
  entryKimchiRate: number;
  exitKimchiRate: number;
  toleranceRate: number;
  leverage: number;
  investmentAmount: number;
}

export function AdvancedTradingControl({ userId }: AdvancedTradingControlProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 로컬 설정 상태
  const [config, setConfig] = useState<TradingConfig>({
    entryKimchiRate: 0.7,
    exitKimchiRate: 1.4,
    toleranceRate: 0.1,
    leverage: 3,
    investmentAmount: 1000000,
  });

  // 자동매매 상태 조회
  const { data: tradingStatus } = useQuery<{isActive: boolean, newKimchiActive: boolean, totalActive: boolean}>({
    queryKey: ['/api/trading/status'],
    refetchInterval: 10000, // 10초마다 상태 확인 (API 제한으로 인한 조정)
  });

  const isActive = tradingStatus?.newKimchiActive || false;

  // 즉시 시작 함수 (설정과 시작을 한 번에)
  const startTradingMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 고급 자동매매 즉시 시작:', { userId, config });
      
      // 1단계: 설정 저장
      const settingsResponse = await fetch(`/api/trading-settings/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          kimchiEntryRate: config.entryKimchiRate.toString(),
          kimchiExitRate: config.exitKimchiRate.toString(),
          kimchiToleranceRate: config.toleranceRate.toString(),
          binanceLeverage: config.leverage,
          upbitEntryAmount: config.investmentAmount.toString(),
        }),
      });

      if (!settingsResponse.ok) {
        throw new Error('설정 저장 실패');
      }

      console.log('✅ 설정 저장 완료');

      // 2단계: 자동매매 시작
      const startResponse = await fetch(`/api/new-kimchi-trading/start/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(`자동매매 시작 실패: ${errorText}`);
      }

      const result = await startResponse.json();
      console.log('✅ 자동매매 시작 성공:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "🎯 김프 자동매매 시작!",
        description: `${config.entryKimchiRate}% 진입, ${config.exitKimchiRate}% 청산 전략으로 시작되었습니다.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
    },
    onError: (error: any) => {
      console.error('❌ 자동매매 시작 실패:', error);
      toast({
        title: "자동매매 시작 실패",
        description: error.message || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 중지 함수
  const stopTradingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/new-kimchi-trading/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('자동매매 중지 실패');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "자동매매 중지됨",
        description: "모든 포지션이 안전하게 정리되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
    },
    onError: (error: any) => {
      toast({
        title: "중지 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 예상 수익 계산
  const expectedProfit = (config.exitKimchiRate - config.entryKimchiRate) * config.investmentAmount * 0.01;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              고급 김프 자동매매
            </CardTitle>
            <CardDescription>
              원클릭으로 시작하는 스마트 차익거래 시스템
            </CardDescription>
          </div>
          <Badge variant={isActive ? "default" : "secondary"} className="px-3 py-1">
            {isActive ? "🟢 활성" : "⚪ 대기"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 빠른 설정 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">진입 김프율 (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={config.entryKimchiRate}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  entryKimchiRate: parseFloat(e.target.value) || 0,
                }))
              }
              className="text-center"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">청산 김프율 (%)</Label>
            <Input
              type="number"
              step="0.1" 
              value={config.exitKimchiRate}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  exitKimchiRate: parseFloat(e.target.value) || 0,
                }))
              }
              className="text-center"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">레버리지 (배)</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={config.leverage}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  leverage: parseInt(e.target.value) || 1,
                }))
              }
              className="text-center"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">투자금액 (원)</Label>
            <Input
              type="number"
              step="100000"
              value={config.investmentAmount}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  investmentAmount: parseInt(e.target.value) || 0,
                }))
              }
              className="text-center"
            />
          </div>
        </div>

        {/* 전략 요약 */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 p-4 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            전략 요약
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-600 dark:text-green-400 font-medium">진입:</span> 김프율 {config.entryKimchiRate}% 이하
            </div>
            <div>
              <span className="text-red-600 dark:text-red-400 font-medium">청산:</span> 김프율 {config.exitKimchiRate}% 이상
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400 font-medium">투자:</span> {config.investmentAmount.toLocaleString()}원
            </div>
            <div>
              <span className="text-purple-600 dark:text-purple-400 font-medium">수익:</span> 약 {expectedProfit.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 핵심 제어 버튼 */}
        <div className="flex gap-3">
          {!isActive ? (
            <Button
              onClick={() => startTradingMutation.mutate()}
              disabled={startTradingMutation.isPending}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 h-12 text-lg font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              {startTradingMutation.isPending ? "시작 중..." : "🚀 즉시 시작"}
            </Button>
          ) : (
            <Button
              onClick={() => stopTradingMutation.mutate()}
              disabled={stopTradingMutation.isPending}
              variant="destructive"
              className="flex-1 h-12 text-lg font-semibold"
            >
              <Square className="w-5 h-5 mr-2" />
              {stopTradingMutation.isPending ? "중지 중..." : "🛑 매매 중지"}
            </Button>
          )}
        </div>

        {/* 실시간 상태 */}
        {isActive && (
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 dark:text-green-300 font-medium">실시간 모니터링 중</span>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              업비트 롱 포지션 + 바이낸스 숏 포지션으로 김프 차익거래 진행 중
            </div>
          </div>
        )}

        {/* 주의사항 */}
        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-medium mb-2 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="w-4 h-4" />
            중요 안내
          </h4>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <p>• 업비트와 바이낸스 API 키가 설정되어 있어야 합니다</p>
            <p>• 최소 투자금액: 100만원 이상 권장 (바이낸스 최소 수량 제한)</p>
            <p>• 자동으로 포지션 관리되며 수동 개입 불필요</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}