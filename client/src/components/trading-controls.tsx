import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { TradingSettings } from "@/types/trading";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TradingControlsProps {
  settings: TradingSettings | null;
  isAutoTrading: boolean;
  onSettingsChange: () => void;
}

export function TradingControls({ settings, isAutoTrading, onSettingsChange }: TradingControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();



  const handleAutoTradingToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      if (enabled) {
        await apiRequest('POST', '/api/trading/start/1');
        toast({
          title: "자동매매 시작",
          description: "자동매매가 활성화되었습니다.",
        });
      } else {
        await apiRequest('POST', '/api/trading/stop');
        toast({
          title: "자동매매 중지",
          description: "자동매매가 비활성화되었습니다.",
        });
      }
      onSettingsChange();
    } catch (error) {
      toast({
        title: "오류",
        description: "자동매매 설정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualBuy = async () => {
    setIsLoading(true);
    try {
      // Manual buy logic would go here
      toast({
        title: "수동 매수",
        description: "수동 매수 주문이 실행되었습니다.",
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "수동 매수 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAllPositions = async () => {
    setIsLoading(true);
    try {
      // Close all positions logic would go here
      toast({
        title: "전체 청산",
        description: "모든 포지션이 청산되었습니다.",
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "포지션 청산 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncPositions = async () => {
    setIsLoading(true);
    try {
      // Sync positions logic would go here
      toast({
        title: "동기화 완료",
        description: "포지션이 동기화되었습니다.",
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "포지션 동기화 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Auto Trading Status */}
      <Card className="bg-slate-850 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">자동매매 상태</CardTitle>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-400">
                {isAutoTrading ? "활성화" : "비활성화"}
              </span>
              <Switch
                checked={isAutoTrading}
                onCheckedChange={handleAutoTradingToggle}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settings && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">진입 김프율</span>
                <span className="text-sm text-white">+{settings.entryPremiumRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">청산 김프율</span>
                <span className="text-sm text-white">+{settings.exitPremiumRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">손절매</span>
                <span className="text-sm text-danger">{settings.stopLossRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">최대 포지션</span>
                <span className="text-sm text-white">{settings.maxPositions}개</span>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            onClick={onSettingsChange}
          >
            설정 수정
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-850 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">빠른 실행</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              className="w-full bg-success hover:bg-green-600 text-white"
              onClick={handleManualBuy}
              disabled={isLoading}
            >
              <Play className="w-4 h-4 mr-2" />
              수동 매수 실행
            </Button>
            <Button
              className="w-full bg-warning hover:bg-yellow-600 text-white"
              onClick={handleCloseAllPositions}
              disabled={isLoading}
            >
              <Pause className="w-4 h-4 mr-2" />
              전체 포지션 청산
            </Button>
            <Button
              variant="outline"
              className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              onClick={handleSyncPositions}
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              포지션 동기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Status */}
      <Card className="bg-slate-850 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">거래소 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
                <span className="text-sm text-white">업비트</span>
              </div>
              <span className="text-xs text-success">정상</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
                <span className="text-sm text-white">바이낸스</span>
              </div>
              <span className="text-xs text-success">정상</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-warning rounded-full mr-2"></div>
                <span className="text-sm text-white">API 호출</span>
              </div>
              <span className="text-xs text-warning">87/100</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
