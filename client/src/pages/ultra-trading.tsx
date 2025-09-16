import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth"; // useAuth 훅 가져오기
import { Play, Square, Settings, TrendingUp, AlertTriangle, Zap, DollarSign, Activity, Rocket } from "lucide-react";
import type { TradingSettings } from "@/types/trading";

export default function UltraTrading() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth(); // 사용자 정보 가져오기
  const userId = user?.id || 1; // 사용자 ID 사용, 없으면 기본값 1

  // 설정 상태 (음수 김프 전략)
  const [config, setConfig] = useState({
    entryRate: -0.4,    // 음수 김프 -0.4% 이하에서 진입
    exitRate: -0.1,     // 음수 김프 -0.1% 이상에서 청산
    tolerance: 0.1,
    leverage: 3,
    amount: 1000000,    // 100만원으로 테스트
  });

  // 자동매매 상태
  const { data: status } = useQuery<{isActive: boolean, newKimchiActive: boolean}>({
    queryKey: ['/api/trading/status'],
    refetchInterval: 10000, // 10초마다 상태 확인 (API 제한으로 인한 조정)
  });

  const isActive = status?.newKimchiActive || false;

  // 🚀 완전 새로운 자동매매 시작 시스템
  const ultraStartMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 울트라 자동매매 시작!', config);
      
      // Step 1: 설정 저장
      const settingsRes = await fetch(`/api/trading-settings/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          kimchiEntryRate: config.entryRate.toString(),
          kimchiExitRate: config.exitRate.toString(),
          kimchiToleranceRate: config.tolerance.toString(),
          binanceLeverage: config.leverage,
          upbitEntryAmount: config.amount.toString(),
        }),
      });

      if (!settingsRes.ok) {
        throw new Error('설정 저장 실패');
      }

      console.log('✅ 설정 저장 완료');

      // Step 2: 자동매매 시작
      const startRes = await fetch(`/api/new-kimchi-trading/start/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!startRes.ok) {
        const errorText = await startRes.text();
        console.error('❌ 시작 실패:', errorText);
        throw new Error(`시작 실패: ${startRes.status}`);
      }

      const result = await startRes.json();
      console.log('🎯 자동매매 시작 성공!', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "🎉 김프 자동매매 시작!",
        description: `${config.entryRate}% 진입 → ${config.exitRate}% 청산 전략 활성화`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
    },
    onError: (error: any) => {
      console.error('❌ 시작 실패:', error);
      toast({
        title: "시작 실패",
        description: error.message || "자동매매 시작에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 중지
  const stopMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/new-kimchi-trading/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('중지 실패');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "자동매매 중지",
        description: "안전하게 중지되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
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
  const expectedProfit = (config.exitRate - config.entryRate) * config.amount * 0.01;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
          💡 설정값 기반 단순 자동매매
        </h1>
        <p className="text-lg text-muted-foreground">
          진입율/청산율 설정만으로 작동하는 간단한 차익거래 시스템
        </p>
        <Badge variant={isActive ? "default" : "secondary"} className="mt-2 px-4 py-1 text-lg">
          {isActive ? "🔴 자동매매 실행중" : "⚫ 대기중"}
        </Badge>
      </div>

      {/* 메인 컨트롤 카드 */}
      <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-blue-900 border-2 border-blue-200 dark:border-blue-700 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl">
            <Settings className="w-8 h-8 text-green-500" />
            설정값 기반 자동매매
          </CardTitle>
          <CardDescription className="text-lg">
            사용자 설정 진입율/청산율만 보고 작동 (김프 방향 구분 없음)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* 매매 설정 */}
          <div className="bg-white dark:bg-slate-700 p-6 rounded-xl border border-green-100 dark:border-green-800 shadow-lg">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-500" />
              매매 설정 (단순 진입/청산)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 진입/청산 설정 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-blue-700 dark:text-blue-300">진입 김프율 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.entryRate}
                    onChange={(e) => setConfig(prev => ({ ...prev, entryRate: parseFloat(e.target.value) || 0 }))}
                    className="text-center text-xl font-bold border-blue-300 focus:border-blue-500"
                  />
                  <p className="text-xs text-blue-600">김프율이 이 값에 도달하면 진입</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-green-700 dark:text-green-300">청산 김프율 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.exitRate}
                    onChange={(e) => setConfig(prev => ({ ...prev, exitRate: parseFloat(e.target.value) || 0 }))}
                    className="text-center text-xl font-bold border-green-300 focus:border-green-500"
                  />
                  <p className="text-xs text-green-600">김프율이 이 값에 도달하면 청산</p>
                </div>
              </div>
              
              {/* 투자 설정 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-purple-700 dark:text-purple-300">투자금액 (원)</Label>
                  <Input
                    type="number"
                    step="100000"
                    value={config.amount}
                    onChange={(e) => setConfig(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    className="text-center text-xl font-bold border-purple-300 focus:border-purple-500"
                  />
                  <p className="text-xs text-purple-600">{config.amount.toLocaleString()}원 투자</p>
                </div>
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label className="text-base font-medium text-orange-700 dark:text-orange-300">레버리지</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={config.leverage}
                      onChange={(e) => setConfig(prev => ({ ...prev, leverage: parseInt(e.target.value) || 1 }))}
                      className="text-center text-xl font-bold border-orange-300 focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label className="text-base font-medium text-yellow-700 dark:text-yellow-300">허용오차</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.tolerance}
                      onChange={(e) => setConfig(prev => ({ ...prev, tolerance: parseFloat(e.target.value) || 0 }))}
                      className="text-center text-xl font-bold border-yellow-300 focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 매매 로직 설명 */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 p-6 rounded-xl border border-blue-200 dark:border-blue-800 shadow-lg">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              자동매매 작동 원리
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 진입 로직 */}
              <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow">
                <h4 className="text-lg font-bold text-blue-600 mb-3">📈 진입 조건</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>현재 김프율:</span>
                    <span className="font-bold">-0.74%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>설정 진입율:</span>
                    <span className="font-bold text-blue-600">{config.entryRate}%</span>
                  </div>
                  <div className="border-t pt-2">
                    <span className="text-xs text-blue-500">
                      {config.entryRate > 0 
                        ? `김프율이 ${config.entryRate}% 이상이 되면 진입`
                        : `김프율이 ${config.entryRate}% 이하가 되면 진입`
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 청산 로직 */}
              <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow">
                <h4 className="text-lg font-bold text-green-600 mb-3">💰 청산 조건</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>설정 청산율:</span>
                    <span className="font-bold text-green-600">{config.exitRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>투자금액:</span>
                    <span className="font-bold">{config.amount.toLocaleString()}원</span>
                  </div>
                  <div className="border-t pt-2">
                    <span className="text-xs text-green-500">
                      김프율이 {config.exitRate}% 이상이 되면 청산
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 매매 방식 */}
            <div className="mt-4 bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2">🔄 매매 방식 (항상 동일)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-blue-600">진입:</span>
                  <span className="ml-2">업비트 BTC 매수 + 바이낸스 BTC 숏</span>
                </div>
                <div>
                  <span className="font-semibold text-green-600">청산:</span>
                  <span className="ml-2">업비트 BTC 매도 + 바이낸스 숏 청산</span>
                </div>
              </div>
            </div>
          </div>

          {/* 핵심 컨트롤 버튼 */}
          <div className="space-y-4">
            {!isActive ? (
              <Button
                onClick={() => ultraStartMutation.mutate()}
                disabled={ultraStartMutation.isPending}
                className="w-full h-16 text-2xl font-bold bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <Rocket className="w-8 h-8 mr-3" />
                {ultraStartMutation.isPending ? "💡 시작 중..." : "💡 설정값 기반 자동매매 시작!"}
              </Button>
            ) : (
              <Button
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
                variant="destructive"
                className="w-full h-16 text-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <Square className="w-8 h-8 mr-3" />
                {stopMutation.isPending ? "중지 중..." : "🛑 자동매매 중지"}
              </Button>
            )}
          </div>

          {/* 실시간 상태 */}
          {isActive && (
            <div className="bg-green-50 dark:bg-green-950 p-6 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-lg animate-pulse">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce"></div>
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">실시간 김프 모니터링 중</span>
                <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce animation-delay-200"></div>
              </div>
              <div className="text-center">
                <div className="text-lg text-green-600 dark:text-green-400 font-medium">
                  💡 설정값 기반 자동매매 진행 중
                </div>
                <div className="text-sm text-green-500 dark:text-green-500 mt-2">
                  진입 {config.entryRate}% → 청산 {config.exitRate}% (업비트 매수 + 바이낸스 숏)
                </div>
              </div>
            </div>
          )}

          {/* 주의사항 */}
          <div className="bg-yellow-50 dark:bg-yellow-950 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800 shadow-lg">
            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="w-5 h-5" />
              중요 안내사항
            </h4>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">✅</span>
                <span>업비트와 바이낸스 API 키가 설정 페이지에서 등록되어 있어야 합니다</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">✅</span>
                <span>최소 투자금액: 100만원 이상 권장 (바이낸스 최소 수량 제한)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">✅</span>
                <span>김프 방향(양수/음수) 구분 없이 설정값만 보고 작동</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">✅</span>
                <span>24시간 자동 진입/청산으로 무인 운영 가능</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}