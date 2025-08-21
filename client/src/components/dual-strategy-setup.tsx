import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Play, Square, DollarSign } from "lucide-react";

interface Strategy {
  id?: number;
  name: string;
  strategyType: 'positive_kimchi' | 'negative_kimchi';
  entryRate: number;
  exitRate: number;
  toleranceRate: number;
  leverage: number;
  investmentAmount: number;
  isActive: boolean;
}

export function DualStrategySetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [positiveStrategy, setPositiveStrategy] = useState<Strategy>({
    name: '양수 김프 전략',
    strategyType: 'positive_kimchi',
    entryRate: 1.1,
    exitRate: 1.5,
    toleranceRate: 0.1,
    leverage: 3,
    investmentAmount: 10000000,
    isActive: true
  });

  const [negativeStrategy, setNegativeStrategy] = useState<Strategy>({
    name: '음수 김프 전략',
    strategyType: 'negative_kimchi',
    entryRate: -0.5,
    exitRate: -0.2,
    toleranceRate: 0.1,
    leverage: 3,
    investmentAmount: 10000000,
    isActive: true
  });

  const [selectedStrategy, setSelectedStrategy] = useState<'positive' | 'negative'>('positive');

  // 전략 생성/시작
  const startStrategyMutation = useMutation({
    mutationFn: async (strategy: Strategy) => {
      // 1. 전략 생성
      const createResponse = await fetch('/api/trading-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          ...strategy
        })
      });

      if (!createResponse.ok) {
        throw new Error('전략 생성 실패');
      }

      // 2. 자동매매 시작
      const startResponse = await fetch('/api/new-kimchi-trading/start/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!startResponse.ok) {
        throw new Error('자동매매 시작 실패');
      }

      return startResponse.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "자동매매 시작",
        description: `${variables.name}이 시작되었습니다.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions/1'] });
    },
    onError: (error: any) => {
      toast({
        title: "자동매매 시작 실패",
        description: error.message || "자동매매 시작 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 자동매매 중지
  const stopTradingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/new-kimchi-trading/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('자동매매 중지 실패');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "자동매매 중지",
        description: "모든 자동매매가 중지되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions/1'] });
    },
    onError: (error: any) => {
      toast({
        title: "자동매매 중지 실패",
        description: error.message || "자동매매 중지 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleStartStrategy = () => {
    const strategy = selectedStrategy === 'positive' ? positiveStrategy : negativeStrategy;
    
    // 유효성 검증
    if (strategy.strategyType === 'positive_kimchi') {
      if (strategy.entryRate <= 0 || strategy.exitRate <= strategy.entryRate) {
        toast({
          title: "설정 오류",
          description: "양수 김프는 진입율과 청산율이 모두 양수이고, 청산율이 진입율보다 높아야 합니다.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (strategy.entryRate >= 0 || strategy.exitRate <= strategy.entryRate) {
        toast({
          title: "설정 오류",
          description: "음수 김프는 진입율이 음수이고, 청산율이 진입율보다 높아야 합니다.",
          variant: "destructive",
        });
        return;
      }
    }

    startStrategyMutation.mutate(strategy);
  };

  const updateStrategy = (type: 'positive' | 'negative', field: keyof Strategy, value: any) => {
    if (type === 'positive') {
      setPositiveStrategy(prev => ({ ...prev, [field]: value }));
    } else {
      setNegativeStrategy(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">김치프리미엄 차익거래 전략</h2>
        <p className="text-muted-foreground">
          양수 또는 음수 김프 상황에서 자동으로 차익거래를 실행합니다
        </p>
      </div>

      {/* 전략 선택 */}
      <div className="space-y-2">
        <Label>차익거래 방식 선택</Label>
        <Select value={selectedStrategy} onValueChange={(value: 'positive' | 'negative') => setSelectedStrategy(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="positive">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span>양수 김프 차익거래</span>
              </div>
            </SelectItem>
            <SelectItem value="negative">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span>음수 김프 차익거래</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 전략 설정 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 양수 김프 전략 */}
        <Card className={`${selectedStrategy === 'positive' ? 'ring-2 ring-green-400' : 'opacity-50'} transition-all`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              양수 김프 차익거래
            </CardTitle>
            <CardDescription>
              김프율이 +1.1% 이상일 때 진입
              <br />
              전략: 업비트 매수 + 바이낸스 숏 (헷지)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pos-entry">진입율 (%)</Label>
                <Input
                  id="pos-entry"
                  type="number"
                  step="0.1"
                  value={positiveStrategy.entryRate}
                  onChange={(e) => updateStrategy('positive', 'entryRate', parseFloat(e.target.value) || 0)}
                  disabled={selectedStrategy !== 'positive'}
                />
              </div>
              <div>
                <Label htmlFor="pos-exit">청산율 (%)</Label>
                <Input
                  id="pos-exit"
                  type="number"
                  step="0.1"
                  value={positiveStrategy.exitRate}
                  onChange={(e) => updateStrategy('positive', 'exitRate', parseFloat(e.target.value) || 0)}
                  disabled={selectedStrategy !== 'positive'}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pos-tolerance">허용범위 (%)</Label>
                <Input
                  id="pos-tolerance"
                  type="number"
                  step="0.01"
                  value={positiveStrategy.toleranceRate}
                  onChange={(e) => updateStrategy('positive', 'toleranceRate', parseFloat(e.target.value) || 0)}
                  disabled={selectedStrategy !== 'positive'}
                />
              </div>
              <div>
                <Label htmlFor="pos-leverage">레버리지 (배수)</Label>
                <Select 
                  value={positiveStrategy.leverage.toString()} 
                  onValueChange={(value) => updateStrategy('positive', 'leverage', parseInt(value))}
                  disabled={selectedStrategy !== 'positive'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1배 (무레버리지)</SelectItem>
                    <SelectItem value="2">2배</SelectItem>
                    <SelectItem value="3">3배</SelectItem>
                    <SelectItem value="5">5배</SelectItem>
                    <SelectItem value="10">10배</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="pos-amount">투자금액 (원)</Label>
              <Input
                id="pos-amount"
                type="text"
                value={positiveStrategy.investmentAmount.toLocaleString()}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(numericValue))) {
                    updateStrategy('positive', 'investmentAmount', parseInt(numericValue) || 0);
                  }
                }}
                disabled={selectedStrategy !== 'positive'}
                placeholder="10,000,000"
              />
            </div>
          </CardContent>
        </Card>

        {/* 음수 김프 전략 */}
        <Card className={`${selectedStrategy === 'negative' ? 'ring-2 ring-red-400' : 'opacity-50'} transition-all`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              음수 김프 차익거래
            </CardTitle>
            <CardDescription>
              김프율이 -0.4% 이하일 때 진입
              <br />
              전략: 업비트 매수 + 바이낸스 숏 (헷지)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="neg-entry">진입율 (%)</Label>
                <Input
                  id="neg-entry"
                  type="number"
                  step="0.1"
                  value={negativeStrategy.entryRate}
                  onChange={(e) => updateStrategy('negative', 'entryRate', parseFloat(e.target.value) || 0)}
                  disabled={selectedStrategy !== 'negative'}
                />
              </div>
              <div>
                <Label htmlFor="neg-exit">청산율 (%)</Label>
                <Input
                  id="neg-exit"
                  type="number"
                  step="0.1"
                  value={negativeStrategy.exitRate}
                  onChange={(e) => updateStrategy('negative', 'exitRate', parseFloat(e.target.value) || 0)}
                  disabled={selectedStrategy !== 'negative'}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="neg-tolerance">허용범위 (%)</Label>
                <Input
                  id="neg-tolerance"
                  type="number"
                  step="0.01"
                  value={negativeStrategy.toleranceRate}
                  onChange={(e) => updateStrategy('negative', 'toleranceRate', parseFloat(e.target.value) || 0)}
                  disabled={selectedStrategy !== 'negative'}
                />
              </div>
              <div>
                <Label htmlFor="neg-leverage">레버리지 (배수)</Label>
                <Select 
                  value={negativeStrategy.leverage.toString()} 
                  onValueChange={(value) => updateStrategy('negative', 'leverage', parseInt(value))}
                  disabled={selectedStrategy !== 'negative'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1배 (무레버리지)</SelectItem>
                    <SelectItem value="2">2배</SelectItem>
                    <SelectItem value="3">3배</SelectItem>
                    <SelectItem value="5">5배</SelectItem>
                    <SelectItem value="10">10배</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="neg-amount">투자금액 (원)</Label>
              <Input
                id="neg-amount"
                type="text"
                value={negativeStrategy.investmentAmount.toLocaleString()}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(numericValue))) {
                    updateStrategy('negative', 'investmentAmount', parseInt(numericValue) || 0);
                  }
                }}
                disabled={selectedStrategy !== 'negative'}
                placeholder="10,000,000"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 실행 버튼 */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={handleStartStrategy}
          disabled={startStrategyMutation.isPending}
          size="lg"
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {selectedStrategy === 'positive' ? '양수 김프' : '음수 김프'} 자동매매 시작
        </Button>
        
        <Button 
          onClick={() => stopTradingMutation.mutate()}
          disabled={stopTradingMutation.isPending}
          size="lg"
          variant="destructive"
          className="flex items-center gap-2"
        >
          <Square className="w-4 h-4" />
          자동매매 중지
        </Button>
      </div>

      {/* 설명 */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">전략 설명</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          {selectedStrategy === 'positive' ? (
            <>
              <p>• 헷지 전략: 업비트 매수 + 바이낸스 숏으로 BTC 가격 변동 중립</p>
              <p>• 진입: 김프율이 +{positiveStrategy.entryRate}% 이상일 때</p>
              <p>• 청산: 김프율이 +{positiveStrategy.exitRate}% 이상일 때</p>
              <p>• 수익: 김프 상승폭만큼 차익 실현 (BTC 가격 무관)</p>
            </>
          ) : (
            <>
              <p>• 헷지 전략: 업비트 매수 + 바이낸스 숏으로 BTC 가격 변동 중립</p>
              <p>• 진입: 김프율이 {negativeStrategy.entryRate}% 이하일 때</p>
              <p>• 청산: 김프율이 {negativeStrategy.exitRate}% 이상일 때</p>
              <p>• 수익: 김프 회복폭만큼 차익 실현 (BTC 가격 무관)</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}