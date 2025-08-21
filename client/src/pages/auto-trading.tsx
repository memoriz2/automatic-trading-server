import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BalanceDisplay } from "@/components/balance-display";
import { PositionsTable } from "@/components/positions-table";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Settings, Activity, Wifi, WifiOff, StopCircle, Lightbulb, BarChart3, Target, TrendingUp, Clock } from "lucide-react";
import type { TradingSettings, Position } from "@/types/trading";
import { apiRequest } from "@/lib/queryClient";
import { useAuth, authenticatedApiRequest } from "@/hooks/useAuth";

export default function AutoTrading() {
  const [newKimchiActive, setNewKimchiActive] = useState(false);
  const { isConnected } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // 인증된 사용자의 ID 사용
  const userId = user?.id;

  // 설정값 기반 단순 매매 설정
  const [config, setConfig] = useState({
    entryRate: 0,       // 진입 김프율
    exitRate: 0,        // 청산 김프율
    tolerance: 0,       // 허용오차
    leverage: 0,        // 레버리지
    amount: 0,          // 투자금액
  });

  // Queries
  const { data: positions = [], refetch: refetchPositions } = useQuery<Position[]>({
    queryKey: ['/api/positions', userId],
    refetchInterval: 1000, // 1초마다 포지션 업데이트
    staleTime: 0, // 항상 fresh하게 처리
    gcTime: 0, // 캐시 무효화 (TanStack Query v5)
    enabled: !!userId,
  });

  const { data: tradingStatus } = useQuery({
    queryKey: ['/api/trading/status'],
    refetchInterval: 2000,
  });

  // Update trading status
  useEffect(() => {
    if (tradingStatus && typeof tradingStatus === 'object') {
      if ('newKimchiActive' in tradingStatus) {
        setNewKimchiActive(tradingStatus.newKimchiActive as boolean);
      }
    }
  }, [tradingStatus]);

  // 설정값 기반 자동매매 시작
  const startTradingMutation = useMutation({
    mutationFn: async () => {
      // 입력값 검증
      if (config.amount === 0) {
        throw new Error('투자금액을 입력하세요.');
      }
      if (config.leverage === 0) {
        throw new Error('레버리지를 1배 이상 설정하세요.');
      }

      // 1. 설정 저장
      const settingsRes = await authenticatedApiRequest(`/api/trading-settings/${userId}`, {
        method: 'PATCH',
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

      // 2. 자동매매 시작
      const startRes = await authenticatedApiRequest(`/api/new-kimchi-trading/start/${userId}`, {
        method: 'POST',
      });

      if (!startRes.ok) {
        const errorText = await startRes.text();
        throw new Error(`시작 실패: ${startRes.status}`);
      }

      return startRes.json();
    },
    onSuccess: () => {
      toast({
        title: "자동매매 시작",
        description: `진입 ${config.entryRate}% → 청산 ${config.exitRate}% 활성화`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "시작 실패",
        description: error.message || "자동매매 시작에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 자동매매 중지
  const stopTradingMutation = useMutation({
    mutationFn: async () => {
      return await authenticatedApiRequest('/api/new-kimchi-trading/stop', {
        method: 'POST',
      });
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

  const handleEmergencyStop = async () => {
    try {
      await authenticatedApiRequest(`/api/trading/emergency-stop/${userId}`, {
        method: 'POST',
      });
      toast({
        title: "긴급 정지",
        description: "모든 거래가 중단되었습니다.",
        variant: "destructive",
      });
      refetchPositions();
    } catch (error) {
      toast({
        title: "오류",
        description: "긴급 정지 실행 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-7 h-7 text-yellow-400" />
              설정값 기반 자동매매
            </h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? '실시간 연결됨' : '연결 끊김'}
              </span>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <BalanceDisplay userId={1} />
            <Button 
              variant="destructive"
              onClick={handleEmergencyStop}
              className="bg-red-600 hover:bg-red-700"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              긴급 정지
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        
        {/* 설정값 기반 단순 자동매매 컨트롤 */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              설정값 기반 자동매매 제어
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* 설정 입력 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="entryRate" className="text-slate-700 dark:text-slate-300">진입 김프율 (%)</Label>
                <Input
                  id="entryRate"
                  type="number"
                  step="0.1"
                  value={config.entryRate}
                  onChange={(e) => setConfig(prev => ({...prev, entryRate: parseFloat(e.target.value) || 0}))}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">이 김프율에 도달하면 진입</p>
              </div>
              
              <div>
                <Label htmlFor="exitRate" className="text-slate-700 dark:text-slate-300">청산 김프율 (%)</Label>
                <Input
                  id="exitRate"
                  type="number"
                  step="0.1"
                  value={config.exitRate}
                  onChange={(e) => setConfig(prev => ({...prev, exitRate: parseFloat(e.target.value) || 0}))}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">이 김프율에 도달하면 청산</p>
              </div>
              
              <div>
                <Label htmlFor="amount" className="text-slate-700 dark:text-slate-300">투자금액 (원)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="100000"
                  value={config.amount}
                  onChange={(e) => setConfig(prev => ({...prev, amount: parseInt(e.target.value) || 0}))}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">{config.amount.toLocaleString()}원</p>
              </div>
              
              <div>
                <Label htmlFor="leverage" className="text-slate-700 dark:text-slate-300">레버리지 (배)</Label>
                <Input
                  id="leverage"
                  type="number"
                  min="1"
                  max="10"
                  value={config.leverage}
                  onChange={(e) => setConfig(prev => ({...prev, leverage: parseInt(e.target.value) || 1}))}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">{config.leverage}배 레버리지</p>
              </div>
              
              <div>
                <Label htmlFor="tolerance" className="text-slate-700 dark:text-slate-300">허용 오차 (%)</Label>
                <Input
                  id="tolerance"
                  type="number"
                  step="0.01"
                  value={config.tolerance}
                  onChange={(e) => setConfig(prev => ({...prev, tolerance: parseFloat(e.target.value) || 0}))}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">±{config.tolerance}% 오차 허용</p>
              </div>
            </div>

            {/* 단순 로직 설명 */}
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">💡 단순 자동매매 로직</h4>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <p>• 현재 김프율이 <strong>진입율({config.entryRate}%)</strong> 조건 만족 → 업비트 BTC 매수 + 바이낸스 BTC 숏포지션</p>
                <p>• 현재 김프율이 <strong>청산율({config.exitRate}%)</strong> 조건 만족 → 업비트 BTC 매도 + 바이낸스 숏포지션 청산</p>
                <p>• 김프 방향(양수/음수) 구분 없이 오직 설정값만 확인하여 작동</p>
                <p>• 24시간 자동 진입→청산→재진입 무한 반복</p>
              </div>
            </div>

            {/* 자동매매 시작/중지 버튼 */}
            <div className="flex flex-col gap-4">
              {!newKimchiActive ? (
                <Button
                  onClick={() => startTradingMutation.mutate()}
                  disabled={startTradingMutation.isPending}
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  <Play className="w-6 h-6 mr-3" />
                  {startTradingMutation.isPending ? "시작 중..." : "설정값 기반 자동매매 시작"}
                </Button>
              ) : (
                <Button
                  onClick={() => stopTradingMutation.mutate()}
                  disabled={stopTradingMutation.isPending}
                  variant="destructive"
                  className="w-full h-16 text-xl font-bold"
                >
                  <Pause className="w-6 h-6 mr-3" />
                  {stopTradingMutation.isPending ? "중지 중..." : "자동매매 중지"}
                </Button>
              )}
              
              {/* 현재 상태 표시 */}
              {newKimchiActive && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">설정값 기반 자동매매 실행 중</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse animation-delay-200"></div>
                  </div>
                  <div className="text-center text-sm text-green-600 dark:text-green-400">
                    진입 {config.entryRate}% → 청산 {config.exitRate}% | 투자금액 {config.amount.toLocaleString()}원 | 레버리지 {config.leverage}배
                  </div>
                </div>
              )}
              
              {/* 자동매매 실시간 상태 */}
              <TradingStatusCard newKimchiActive={newKimchiActive} config={config} />
            </div>
          </CardContent>
        </Card>

        {/* 활성 포지션 상태 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">자동매매 상태</p>
                  <p className={`text-xl font-bold ${newKimchiActive ? 'text-green-600' : 'text-slate-400'}`}>
                    {newKimchiActive ? '실행 중' : '대기 중'}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  newKimchiActive ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {newKimchiActive ? (
                    <Activity className="text-green-600" />
                  ) : (
                    <Settings className="text-slate-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">활성 포지션</p>
                  <p className="text-xl font-bold text-blue-600">
                    {positions.filter(pos => pos.status.toLowerCase() === 'open' || pos.status.toLowerCase() === 'active').length}개
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">거래소 연결</p>
                  <p className="text-xl font-bold text-green-600">정상</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Wifi className="text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 활성 포지션 테이블 */}
        {positions.length > 0 && (
          <PositionsTable 
            positions={positions}
            onRefresh={refetchPositions}
            onClosePosition={async (positionId: number) => {
              try {
                await apiRequest('POST', `/api/positions/${positionId}/close`);
                refetchPositions();
                toast({
                  title: "포지션 청산",
                  description: "포지션이 성공적으로 청산되었습니다.",
                });
              } catch (error) {
                toast({
                  title: "청산 실패",
                  description: "포지션 청산 중 오류가 발생했습니다.",
                  variant: "destructive",
                });
              }
            }}
          />
        )}
      </main>
    </div>
  );
}

// 실시간 자동매매 상태 컴포넌트
interface TradingStatusCardProps {
  newKimchiActive: boolean;
  config: {
    entryRate: number;
    exitRate: number;
    amount: number;
    leverage: number;
    tolerance: number;
  };
}

function TradingStatusCard({ newKimchiActive, config }: TradingStatusCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 실시간 김프 데이터 가져오기 (대체 엔드포인트 사용)
  const { data: kimchiData, isLoading } = useQuery({
    queryKey: ['/api/kimchi-premium/simple'],
    refetchInterval: 10000, // 10초마다 갱신
    enabled: newKimchiActive
  });

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!newKimchiActive) return null;

  const btcData = kimchiData?.find((item: any) => item.symbol === 'BTC');
  const currentRate = btcData?.premiumRate || 0;
  
  // 진입 조건 계산
  const entryDifference = Math.abs(currentRate - config.entryRate);
  const isInEntryRange = entryDifference <= config.tolerance;
  const exitDifference = Math.abs(currentRate - config.exitRate);
  const isInExitRange = exitDifference <= config.tolerance;
  
  // 상태 결정
  let status = '대기중';
  let statusColor = 'text-yellow-600 dark:text-yellow-400';
  let statusBg = 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
  let statusIcon = <Clock className="w-5 h-5" />;
  
  if (isInEntryRange) {
    status = '진입 조건 만족';
    statusColor = 'text-green-600 dark:text-green-400';
    statusBg = 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    statusIcon = <Target className="w-5 h-5" />;
  } else if (isInExitRange) {
    status = '청산 조건 만족';
    statusColor = 'text-blue-600 dark:text-blue-400';
    statusBg = 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    statusIcon = <TrendingUp className="w-5 h-5" />;
  }

  return (
    <div className={`${statusBg} border rounded-lg p-4 space-y-3`}>
      {/* 상태 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className={`font-bold ${statusColor}`}>{status}</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {currentTime.toLocaleTimeString('ko-KR')}
        </div>
      </div>
      
      {/* 실시간 데이터 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-slate-600 dark:text-slate-400">현재 BTC 김프율</div>
          <div className={`font-bold text-lg ${currentRate >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
            {isLoading ? '조회중...' : `${currentRate.toFixed(3)}%`}
          </div>
        </div>
        <div>
          <div className="text-slate-600 dark:text-slate-400">설정 진입율</div>
          <div className="font-bold text-lg text-slate-800 dark:text-slate-200">
            {config.entryRate}%
          </div>
        </div>
      </div>
      
      {/* 조건 상세 */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className={`p-2 rounded ${isInEntryRange ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
          <div className="text-slate-600 dark:text-slate-400">진입 조건</div>
          <div className={isInEntryRange ? 'text-green-700 dark:text-green-300 font-bold' : 'text-slate-700 dark:text-slate-300'}>
            차이: {entryDifference.toFixed(3)}% (허용: ±{config.tolerance}%)
          </div>
        </div>
        <div className={`p-2 rounded ${isInExitRange ? 'bg-blue-100 dark:bg-blue-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
          <div className="text-slate-600 dark:text-slate-400">청산 조건</div>
          <div className={isInExitRange ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-700 dark:text-slate-300'}>
            차이: {exitDifference.toFixed(3)}% (허용: ±{config.tolerance}%)
          </div>
        </div>
      </div>
      
      {/* 투자 정보 */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
        투자금액: {config.amount.toLocaleString()}원 | 레버리지: {config.leverage}배 | 
        범위: {(config.entryRate - config.tolerance).toFixed(2)}% ~ {(config.entryRate + config.tolerance).toFixed(2)}%
      </div>
    </div>
  );
}