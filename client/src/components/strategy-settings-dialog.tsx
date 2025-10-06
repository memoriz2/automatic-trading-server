import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, TrendingUp, Shield, DollarSign, Target, Play, TrendingDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { TradingSettings } from "@/types/trading";

interface StrategySettingsDialogProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StrategySettingsDialog({ userId, open, onOpenChange }: StrategySettingsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 자동매매 상태 조회
  const { data: tradingStatus } = useQuery({
    queryKey: ['/api/trading/status'],
    refetchInterval: 10000, // 10초마다 상태 확인 (API 제한으로 인한 조정)
  });

  const isNewKimchiActive = (tradingStatus as any)?.newKimchiActive || false;

  const [settings, setSettings] = useState({
    strategyType: 'positive_kimchi',  // 'positive_kimchi' 또는 'negative_kimchi'
    kimchiEntryRate: 1.1,          // 진입 김프 %
    kimchiToleranceRate: 0.1,      // 허용범위 %  
    kimchiExitRate: 1.5,           // 청산 김프 %
    binanceLeverage: 1,            // 레버리지 설정
    upbitEntryAmount: 10000000,    // 투자금액 (KRW)
  });

  // 연동 테스트 상태 관리
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  const [selectedExchange, setSelectedExchange] = useState('upbit');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  // 현재 설정 조회
  const { data: currentSettings } = useQuery<TradingSettings>({
    queryKey: [`/api/trading-settings/${userId}`],
  });

  // 설정값 로드
  useEffect(() => {
    if (currentSettings && open) {
      console.log('Dialog에서 불러온 설정:', currentSettings);
      setSettings({
        strategyType: 'positive_kimchi', // 기본값
        kimchiEntryRate: parseFloat(currentSettings.kimchiEntryRate || "1.1"),
        kimchiToleranceRate: parseFloat(currentSettings.kimchiToleranceRate || "0.1"),
        kimchiExitRate: parseFloat(currentSettings.kimchiExitRate || "1.5"),
        binanceLeverage: currentSettings.binanceLeverage || 1,
        upbitEntryAmount: parseFloat(currentSettings.upbitEntryAmount || "10000000"),
      });
    }
  }, [currentSettings, open]);

  // 설정 저장
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      console.log('API 요청 데이터:', newSettings);
      try {
        const response = await fetch(`/api/trading-settings/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSettings),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API 에러 응답:', errorData);
          throw new Error(errorData.error || '저장 실패');
        }
        
        const data = await response.json();
        console.log('API 성공 응답:', data);
        return data;
      } catch (error) {
        console.error('API 요청 에러:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('저장 성공:', data);
      toast({
        title: "전략 설정 저장 완료",
        description: "김프 차익거래 전략 설정이 저장되었습니다.",
      });
      // 캐시 즉시 무효화
      queryClient.invalidateQueries({ queryKey: [`/api/trading-settings/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      // 잠시 후 Dialog 닫기
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    },
    onError: (error: any) => {
      console.error('저장 실패 상세:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      toast({
        title: "설정 저장 실패",
        description: `설정 저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // 유효성 검증 - 전략 타입별로 다른 검증
    if (settings.strategyType === 'positive_kimchi') {
      // 양수 김프: 진입율 < 청산율 (1.0% < 1.5%)
      if (settings.kimchiEntryRate >= settings.kimchiExitRate) {
        toast({
          title: "설정 오류",
          description: "양수 김프 차익거래는 낮은 양수 김프율에서 진입하여 높은 양수 김프율에서 청산해야 합니다.",
          variant: "destructive",
        });
        return;
      }
      if (settings.kimchiEntryRate < 0 || settings.kimchiExitRate < 0) {
        toast({
          title: "설정 오류",
          description: "양수 김프 차익거래는 진입율과 청산율 모두 양수여야 합니다.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // 음수 김프: 진입율 < 청산율 (-0.6% < -0.2%)
      if (settings.kimchiEntryRate >= settings.kimchiExitRate) {
        toast({
          title: "설정 오류",
          description: "음수 김프 차익거래는 더 낮은 음수 김프율에서 진입하여 0에 가까운 값에서 청산해야 합니다.",
          variant: "destructive",
        });
        return;
      }
      if (settings.kimchiEntryRate > 0 || settings.kimchiExitRate < settings.kimchiEntryRate) {
        toast({
          title: "설정 오류",
          description: "음수 김프 차익거래는 진입율이 음수이고 청산율이 진입율보다 높아야 합니다.",
          variant: "destructive",
        });
        return;
      }
    }

    if (settings.upbitEntryAmount < 5000) {
      toast({
        title: "설정 오류", 
        description: "투자금액은 최소 5,000원 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    // 바이낸스 최소 수량 검증 (현재 비트코인 가격 기준)
    const estimatedBtcAmount = settings.upbitEntryAmount / 160000000; // 현재 BTC 가격 약 1억6천만원 기준
    if (estimatedBtcAmount < 0.001) {
      toast({
        title: "설정 오류",
        description: "투자금액이 너무 적습니다. 바이낸스 최소 거래 수량 0.001을 위해 최소 16만원 이상 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    if (settings.binanceLeverage < 1 || settings.binanceLeverage > 20) {
      toast({
        title: "설정 오류",
        description: "바이낸스 레버리지는 1~20배 사이여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (settings.kimchiToleranceRate < 0 || settings.kimchiToleranceRate > 1) {
      toast({
        title: "설정 오류",
        description: "허용범위는 0~1% 사이여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    console.log('저장할 설정:', settings);
    saveSettingsMutation.mutate({
      strategyType: settings.strategyType,
      kimchiEntryRate: settings.kimchiEntryRate.toString(),
      kimchiExitRate: settings.kimchiExitRate.toString(),
      kimchiToleranceRate: settings.kimchiToleranceRate.toString(),
      binanceLeverage: settings.binanceLeverage,
      upbitEntryAmount: settings.upbitEntryAmount.toString(),
    });
  };

  // 연동 테스트 함수
  const testExchangeConnection = async (exchange: string, apiKey: string, apiSecret: string) => {
    if (!apiKey || !apiSecret) {
      toast({
        title: "연동 테스트 실패",
        description: "API 키와 시크릿을 먼저 입력해주세요",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const response = await fetch('/api/exchanges/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange, apiKey, apiSecret })
      });

      const result = await response.json();
      setConnectionTestResult(result);

      if (result.success) {
        toast({
          title: "연동 테스트 성공! 🎉",
          description: result.message,
          variant: "default"
        });
      } else {
        toast({
          title: "연동 테스트 실패 ❌",
          description: `${result.message}: ${result.error}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || '연동 테스트 중 오류가 발생했습니다';
      setConnectionTestResult({
        success: false,
        message: '연동 테스트 실패',
        error: errorMessage
      });
      
      toast({
        title: "연동 테스트 오류",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 새로운 김프 자동매매 시작
  const startTradingMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 Dialog에서 자동매매 시작 시도:', userId);
      const response = await fetch(`/api/new-kimchi-trading/start/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Dialog API 호출 실패:', response.status, errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Dialog API 호출 성공:', result);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "새로운 김프 자동매매 시작",
        description: "업비트 롱 + 바이낸스 숏 전략이 시작되었습니다.",
      });
      // 모든 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      
      console.log('🎯 Dialog 자동매매 시작 응답:', data);
      
      // 잠시 후 Dialog 닫기
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    },
    onError: (error: any) => {
      console.error('❌ Dialog 자동매매 시작 실패:', error);
      toast({
        title: "자동매매 시작 실패",
        description: error.message || "자동매매 시작 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            김프 차익거래 전략 설정
          </DialogTitle>
          <DialogDescription className="space-y-1 text-sm">
            <div>업비트 롱 + 바이낸스 숏으로 자본을 보호하면서 순수 김프 차익만으로 수익을 내는 전략</div>
            <div className="text-orange-400 font-medium">핵심: 업비트 KRW 시장가 매수 → 수량 확인 → 바이낸스 동일 수량 숏 (레버리지 반영)</div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* 차익거래 방식 선택 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" />
              차익거래 방식
            </Label>
            <Select 
              value={settings.strategyType} 
              onValueChange={(value) => setSettings(prev => ({
                ...prev,
                strategyType: value,
                // 방식에 따른 기본값 설정
                kimchiEntryRate: value === 'positive_kimchi' ? 1.1 : -0.5,
                kimchiExitRate: value === 'positive_kimchi' ? 1.5 : -0.2,
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="차익거래 방식을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive_kimchi">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span>양수 김프 차익거래</span>
                  </div>
                </SelectItem>
                <SelectItem value="negative_kimchi">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span>음수 김프 차익거래</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground space-y-1">
              {settings.strategyType === 'positive_kimchi' ? (
                <>
                  <div>• 양수 김프: 업비트가 바이낸스보다 비쌀 때 (김프율 +1.0% 이상)</div>
                  <div>• 전략: 업비트 매도 + 바이낸스 매수로 차익 실현</div>
                </>
              ) : (
                <>
                  <div>• 음수 김프: 업비트가 바이낸스보다 쌀 때 (김프율 -0.6% 이하)</div>
                  <div>• 전략: 업비트 매수 + 바이낸스 매도로 차익 실현</div>
                </>
              )}
            </div>
          </div>

          {/* 진입 김프 % */}
          <div className="space-y-2">
            <Label htmlFor="entry-rate" className="flex items-center gap-2">
              {settings.strategyType === 'positive_kimchi' ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              진입 김프 % 
              {settings.strategyType === 'positive_kimchi' ? '(양수값)' : '(음수값)'}
            </Label>
            <Input
              id="entry-rate"
              type="number"
              step="0.1"
              min="-5"
              max="5"
              value={settings.kimchiEntryRate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                kimchiEntryRate: parseFloat(e.target.value) || 0
              }))}
              placeholder="0.5"
            />
            <div className="text-xs text-muted-foreground">
              {settings.strategyType === 'positive_kimchi' 
                ? '김프율이 이 값 이상일 때 자동 진입합니다 (양수 김프에서 매도)' 
                : '김프율이 이 값 이하일 때 자동 진입합니다 (음수 김프에서 매수)'}
            </div>
          </div>

          {/* 허용범위 % */}
          <div className="space-y-2">
            <Label htmlFor="tolerance-rate" className="flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              허용범위 %
            </Label>
            <Input
              id="tolerance-rate"
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={settings.kimchiToleranceRate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                kimchiToleranceRate: parseFloat(e.target.value) || 0
              }))}
              placeholder="0.1"
            />
            <div className="text-xs text-muted-foreground">
              {settings.strategyType === 'positive_kimchi' 
                ? `진입 김프율 - 허용범위에서 진입 (예: ${settings.kimchiEntryRate}% - ${settings.kimchiToleranceRate}% = ${(settings.kimchiEntryRate - settings.kimchiToleranceRate).toFixed(1)}%)`
                : `진입 김프율 - 허용범위에서 진입 (예: ${settings.kimchiEntryRate}% - ${settings.kimchiToleranceRate}% = ${(settings.kimchiEntryRate - settings.kimchiToleranceRate).toFixed(1)}%)`}
            </div>
          </div>

          {/* 청산 김프 % */}
          <div className="space-y-2">
            <Label htmlFor="exit-rate" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              청산 김프 % 
              {settings.strategyType === 'positive_kimchi' ? '(더 높은 양수값)' : '(0에 가까운 값)'}
            </Label>
            <Input
              id="exit-rate"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={settings.kimchiExitRate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                kimchiExitRate: parseFloat(e.target.value) || 0
              }))}
              placeholder="1.5"
            />
            <div className="text-xs text-muted-foreground">
              {settings.strategyType === 'positive_kimchi' 
                ? '김프율이 이 값 이상으로 올라가면 자동 청산합니다 (더 높은 양수 김프에서 청산)' 
                : '김프율이 이 값 이상으로 올라가면 자동 청산합니다 (0에 가까워지면 청산)'}
            </div>
          </div>

          {/* 레버리지 설정 */}
          <div className="space-y-2">
            <Label htmlFor="leverage" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              레버리지 설정
            </Label>
            <Input
              id="leverage"
              type="number"
              min="1"
              max="20"
              value={settings.binanceLeverage}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                binanceLeverage: parseInt(e.target.value) || 1
              }))}
              placeholder="1"
            />
            <div className="text-xs text-muted-foreground">
              바이낸스 선물 거래에 적용할 레버리지 (1-20배)
            </div>
          </div>

          {/* 투자금액 */}
          <div className="space-y-2">
            <Label htmlFor="entry-amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              투자금액 (KRW)
            </Label>
            <Input
              id="entry-amount"
              type="text"
              value={settings.upbitEntryAmount.toLocaleString()}
              onChange={(e) => {
                const numericValue = parseInt(e.target.value.replace(/,/g, '')) || 0;
                setSettings(prev => ({
                  ...prev,
                  upbitEntryAmount: numericValue
                }));
              }}
              placeholder="10,000,000"
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• 업비트에서 이 금액만큼 KRW로 코인을 시장가 매수합니다</div>
              <div>• 매수 완료 후 수량을 확인하여 바이낸스에서 동일 수량 숏 포지션 진입</div>
              <div>• 바이낸스 최소 수량 0.001 이상만 거래 (미만시 자동 거래 제외)</div>
              <div>• 예: 10,000,000원 → BTC 시장가 매수 → 동일 수량 바이낸스 숏</div>
            </div>
          </div>

          {/* 거래소 연동 테스트 */}
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h4 className="font-medium text-slate-200">🔗 거래소 연동 테스트</h4>
            
            {/* 거래소 선택 */}
            <div className="space-y-2">
              <Label htmlFor="exchange-select">거래소 선택</Label>
              <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                <SelectTrigger>
                  <SelectValue placeholder="거래소를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upbit">업비트 (Upbit)</SelectItem>
                  <SelectItem value="binance">바이낸스 (Binance)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* API 키 입력 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API 키를 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-secret">API Secret</Label>
                <Input
                  id="api-secret"
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="API 시크릿을 입력하세요"
                />
              </div>
            </div>

            {/* 연동테스트 버튼 */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => testExchangeConnection(selectedExchange, apiKey, apiSecret)}
                disabled={isTestingConnection || !apiKey || !apiSecret}
                variant="secondary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isTestingConnection ? '테스트 중...' : '🔗 연동테스트'}
              </Button>
              
              <div className="text-xs text-muted-foreground">
                API 키 입력 후 연동테스트를 먼저 진행하세요
              </div>
            </div>

            {/* 연동 테스트 결과 표시 */}
            {connectionTestResult && (
              <div className={`p-3 rounded-md border ${
                connectionTestResult.success 
                  ? 'bg-green-950/50 border-green-600 text-green-200' 
                  : 'bg-red-950/50 border-red-600 text-red-200'
              }`}>
                <div className="font-medium">
                  {connectionTestResult.success ? '✅' : '❌'} {connectionTestResult.message}
                </div>
                {connectionTestResult.error && (
                  <div className="text-sm mt-1 opacity-80">
                    오류: {connectionTestResult.error}
                  </div>
                )}
                {connectionTestResult.details && (
                  <div className="text-sm mt-1 opacity-80">
                    상세: {JSON.stringify(connectionTestResult.details)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 전략 요약 */}
          <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-600/30">
            <h4 className="font-medium mb-3 text-blue-300">전략 요약</h4>
            <div className="text-sm text-slate-300 space-y-1">
              <div>• <span className="text-green-400">진입</span>: 김프율 {settings.kimchiEntryRate}% ± {settings.kimchiToleranceRate}% 이하 시 (낮은 김프에서 매수)</div>
              <div>• <span className="text-red-400">청산</span>: 김프율 {settings.kimchiExitRate}% 이상 시 (높은 김프에서 매도)</div>
              <div>• <span className="text-blue-400">투자</span>: 업비트 {settings.upbitEntryAmount.toLocaleString()}원 시장가 매수</div>
              <div>• <span className="text-yellow-400">헤지</span>: 바이낸스 {settings.binanceLeverage}배 레버리지 숏 포지션</div>
              <div>• <span className="text-orange-400">제한</span>: 바이낸스 최소 수량 0.001 이상만 거래 진행</div>
              <div>• <span className="text-purple-400">예상수익</span>: 김프율 {settings.kimchiEntryRate}% → {settings.kimchiExitRate}% 상승시 약 {((settings.kimchiExitRate - settings.kimchiEntryRate) * settings.upbitEntryAmount * 0.01).toLocaleString()}원</div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              취소
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {saveSettingsMutation.isPending ? "저장 중..." : "설정 저장"}
            </Button>
            {/* 차익거래 시작 버튼 */}
            <Button 
              onClick={() => startTradingMutation.mutate()}
              disabled={startTradingMutation.isPending || isNewKimchiActive}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
            >
              <Play className="w-4 h-4 mr-2" />
              {startTradingMutation.isPending 
                ? "시작 중..." 
                : isNewKimchiActive 
                ? "매매 활성" 
                : "차익거래 시작"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}