import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, TrendingUp, Shield, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { TradingSettings } from "@/types/trading";

interface NewKimchiSettingsProps {
  userId: number;
}

export function NewKimchiSettings({ userId }: NewKimchiSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    kimchiEntryRate: 1.0,      // 진입 김프율 (%)
    kimchiExitRate: 0.5,       // 청산 김프율 (%)
    kimchiToleranceRate: 0.1,  // 허용 오차 진입 김프율 (%)
    binanceLeverage: 1,        // 바이낸스 레버리지
    upbitEntryAmount: 10000,   // 업비트 기준 진입 금액 (KRW)
    isAutoTrading: false,
  });

  // 현재 설정 조회
  const { data: currentSettings } = useQuery<TradingSettings>({
    queryKey: [`/api/trading-settings/${userId}`],
  });

  // 설정값 로드
  useEffect(() => {
    if (currentSettings) {
      setSettings({
        kimchiEntryRate: currentSettings.kimchiEntryRate || 1.0,
        kimchiExitRate: currentSettings.kimchiExitRate || 0.5,
        kimchiToleranceRate: currentSettings.kimchiToleranceRate || 0.1,
        binanceLeverage: currentSettings.binanceLeverage || 1,
        upbitEntryAmount: currentSettings.upbitEntryAmount || 10000,
        isAutoTrading: currentSettings.isAutoTrading,
      });
    }
  }, [currentSettings]);

  // 설정 저장
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      return apiRequest(`/api/trading-settings/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(newSettings),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "설정 저장 완료",
        description: "새로운 김프 전략 설정이 저장되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/trading-settings/${userId}`] });
    },
    onError: (error) => {
      toast({
        title: "설정 저장 실패",
        description: "설정 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // 유효성 검증
    if (settings.kimchiEntryRate <= settings.kimchiExitRate) {
      toast({
        title: "설정 오류",
        description: "진입 김프율은 청산 김프율보다 높아야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (settings.upbitEntryAmount < 5000) {
      toast({
        title: "설정 오류", 
        description: "업비트 진입 금액은 최소 5,000원 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (settings.binanceLeverage < 1 || settings.binanceLeverage > 10) {
      toast({
        title: "설정 오류",
        description: "바이낸스 레버리지는 1~10배 사이여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    saveSettingsMutation.mutate({
      ...currentSettings,
      ...settings,
    });
  };

  // 최소 구매 수량 계산 (0.001 이상 보장)
  const calculateMinPurchaseAmount = (coinPrice: number) => {
    return Math.ceil((0.001 * coinPrice) / 100) * 100; // 100원 단위로 올림
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          새로운 김프 전략 설정
        </CardTitle>
        <CardDescription>
          업비트 롱 + 바이낸스 숏으로 자본을 보호하면서 순수 김프 상승으로만 수익을 내는 전략
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 진입/청산 설정 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entry-rate" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              진입 김프율 (%)
            </Label>
            <Input
              id="entry-rate"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={settings.kimchiEntryRate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                kimchiEntryRate: parseFloat(e.target.value) || 0
              }))}
              placeholder="1.0"
            />
            <p className="text-xs text-muted-foreground">
              김프율이 이 값 이상일 때 자동 진입합니다
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exit-rate" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-danger" />
              청산 김프율 (%)
            </Label>
            <Input
              id="exit-rate"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={settings.kimchiExitRate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                kimchiExitRate: parseFloat(e.target.value) || 0
              }))}
              placeholder="0.5"
            />
            <p className="text-xs text-muted-foreground">
              김프율이 이 값 이하로 떨어지면 자동 청산합니다
            </p>
          </div>
        </div>

        {/* 허용 오차 및 레버리지 설정 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tolerance-rate" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-warning" />
              허용 오차 진입 김프율 (%)
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
            <p className="text-xs text-muted-foreground">
              진입 김프율 ± 허용 오차 범위에서 진입 가능
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leverage" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-info" />
              바이낸스 레버리지 (배)
            </Label>
            <Input
              id="leverage"
              type="number"
              min="1"
              max="10"
              value={settings.binanceLeverage}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                binanceLeverage: parseInt(e.target.value) || 1
              }))}
              placeholder="1"
            />
            <p className="text-xs text-muted-foreground">
              바이낸스 선물 거래에 적용할 레버리지 (1-10배)
            </p>
          </div>  
        </div>

        {/* 투자 금액 설정 */}
        <div className="space-y-2">
          <Label htmlFor="entry-amount" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-success" />
            업비트 기준 진입 금액 (KRW)
          </Label>
          <Input
            id="entry-amount"
            type="number"
            min="5000"
            max="10000000"
            step="1000"
            value={settings.upbitEntryAmount}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              upbitEntryAmount: parseInt(e.target.value) || 10000
            }))}
            placeholder="10000"
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 업비트에서 이 금액만큼 KRW로 코인을 매수합니다</p>
            <p>• 바이낸스에서 동일 수량만큼 선물 숏 포지션을 취합니다</p>
            <p>• 최소 5,000원 이상 설정 (바이낸스 최소 수량 0.001 보장)</p>
          </div>
        </div>

        {/* 자동매매 활성화 */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="auto-trading">새로운 김프 자동매매</Label>
            <p className="text-sm text-muted-foreground">
              설정된 조건에 따라 자동으로 포지션을 관리합니다
            </p>
          </div>
          <Switch
            id="auto-trading"
            checked={settings.isAutoTrading}
            onCheckedChange={(checked) => setSettings(prev => ({
              ...prev,
              isAutoTrading: checked
            }))}
          />
        </div>

        {/* 전략 요약 */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <h4 className="font-medium mb-2">전략 요약</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 진입: 김프율 {settings.kimchiEntryRate}% ± {settings.kimchiToleranceRate}% 시</p>
            <p>• 청산: 김프율 {settings.kimchiExitRate}% 이하 시</p>
            <p>• 투자: 업비트 {settings.upbitEntryAmount.toLocaleString()}원 매수</p>
            <p>• 헤지: 바이낸스 {settings.binanceLeverage}배 레버리지 숏</p>
            <p>• 수익: 순수 김프율 상승분만큼 안전한 차익거래</p>
          </div>
        </div>

        {/* 저장 버튼 */}
        <Button 
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending}
          className="w-full"
        >
          {saveSettingsMutation.isPending ? "저장 중..." : "설정 저장"}
        </Button>
      </CardContent>
    </Card>
  );
}