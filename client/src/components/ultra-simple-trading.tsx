import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause } from "lucide-react";

interface UltraSimpleTradingProps {
  userId: number;
  isActive: boolean;
}

export function UltraSimpleTrading({ userId, isActive }: UltraSimpleTradingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 🚀 울트라 간단 시작/중지 시스템
  const toggleMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop') => {
      console.log(`🚀 김프 차익거래 ${action === 'start' ? '시작' : '중지'}!`);
      
      if (action === 'start') {
        // Step 1: 자동매매 시작
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
        console.log('🎯 차익거래 시작 성공!', result);
        return result;
      } else {
        // 중지
        const stopRes = await fetch('/api/new-kimchi-trading/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!stopRes.ok) throw new Error('중지 실패');
        return stopRes.json();
      }
    },
    onSuccess: (_, action) => {
      toast({
        title: action === 'start' ? "🎉 김프 차익거래 시작!" : "차익거래 중지",
        description: action === 'start' ? "업비트 롱 + 바이낸스 숏 헤지 전략 활성화" : "안전하게 중지되었습니다.",
        variant: action === 'stop' ? "destructive" : "default",
      });
      
      // 모든 관련 쿼리 즉시 무효화 및 재호출
      queryClient.removeQueries({ queryKey: ['/api/positions', 1] });
      queryClient.removeQueries({ queryKey: ['/api/trading/status'] });
      
      // 즉시 새로운 데이터 페치
      queryClient.prefetchQuery({ queryKey: ['/api/positions', 1] });
      queryClient.prefetchQuery({ queryKey: ['/api/trading/status'] });
      
      // 추가 안전장치: 1초 후 한번 더 갱신
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/positions', 1] });
        queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      }, 1000);
    },
    onError: (error: any, action) => {
      console.error(`❌ ${action} 실패:`, error);
      toast({
        title: `${action === 'start' ? '시작' : '중지'} 실패`,
        description: error.message || `차익거래 ${action === 'start' ? '시작' : '중지'}에 실패했습니다.`,
        variant: "destructive",
      });
    },
  });

  const handleToggle = () => {
    const action = isActive ? 'stop' : 'start';
    toggleMutation.mutate(action);
  };

  return (
    <Button 
      onClick={handleToggle}
      disabled={toggleMutation.isPending}
      variant={isActive ? "destructive" : "default"}
      className={isActive ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
    >
      {toggleMutation.isPending ? (
        "처리 중..."
      ) : isActive ? (
        <>
          <Pause className="w-4 h-4 mr-2" />
          차익거래 중지
        </>
      ) : (
        <>
          <Play className="w-4 h-4 mr-2" />
          차익거래 시작
        </>
      )}
    </Button>
  );
}