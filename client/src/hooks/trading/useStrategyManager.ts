import { getErrorMessage } from '@/utils/error-utils';
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiFetchJson } from '@/lib/queryClient';
import { markStrategyAsDeleted } from '@/utils/emergency-strategy-restore';

interface Strategy {
  id: string;
  name: string;
  entryCondition: number;
  takeProfitCondition: number;
  tolerance: number;
  leverage: string;
  investmentAmount: string;
  isActive: boolean;
}

export const useStrategyManager = (effectiveUserId: string) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [serverBands, setServerBands] = useState<any[]>([]);
  const [boardActingId, setBoardActingId] = useState<string | number | null>(null);
  const hasLoadedStrategiesRef = useRef(false);
  const { toast } = useToast();

  // 전략 목록 저장
  const saveStrategiesToLocal = useCallback((strategiesToSave: Strategy[]) => {
    try {
      const strategyKey = `mock-strategies-${effectiveUserId}`;
      localStorage.setItem(strategyKey, JSON.stringify(strategiesToSave));
    } catch (error) {
      console.error('❌ 전략 목록 저장 실패:', error);
    }
  }, [effectiveUserId]);

  // 전략 목록 복원
  const loadStrategiesFromLocal = useCallback(() => {
    try {
      const strategyKey = `mock-strategies-${effectiveUserId}`;
      const savedStrategies = localStorage.getItem(strategyKey);
      
      if (savedStrategies && savedStrategies !== '[]') {
        const strategies = JSON.parse(savedStrategies);
        return strategies;
      }
      
      return [];
    } catch (error) {
      console.error('❌ 전략 목록 복원 실패:', error);
      return [];
    }
  }, [effectiveUserId]);

  // 전략 삭제 (청산)
  const handleBoardClose = useCallback(async (id: string | number) => {
    try {
      setBoardActingId(id);
      
      // 서버에서 전략 삭제
      await apiFetchJson(`/api/trading-strategies/${id}`, { method: 'DELETE' });
      
      // 삭제된 전략 기록 (복원 방지)
      markStrategyAsDeleted(effectiveUserId, String(id));
      
      // UI에서 제거
      setStrategies(prev => prev.filter(s => String(s.id) !== String(id)));
      setServerBands(prev => Array.isArray(prev) ? prev.filter((x: any) => String(x?.id) !== String(id)) : prev);
      
      toast({ title: '청산 완료', description: `전략 #${id}가 삭제되었습니다.` });
    } catch (e) {
      console.error(`[레거시 클라이언트] 청산 요청 실패. 전략 ID: ${id}`, e);
      toast({ title: '청산 실패', description: String(e), variant: 'destructive' });
    } finally {
      setBoardActingId(null);
    }
  }, [effectiveUserId, toast]);

  // 서버에서 전략 목록 조회
  const refreshServerBands = useCallback(async (options: { force?: boolean } = {}) => {
    if (!options.force && hasLoadedStrategiesRef.current) return;
    
    try {
      const serverData = await apiFetchJson(`/api/trading-strategies/${effectiveUserId}`);
      if (serverData == null) {
        return;
      }
      setServerBands(serverData || []);
    } catch (e: unknown) {
      const errorMsg = getErrorMessage(e);
      if (errorMsg.includes('Abort') || /aborted/i.test(errorMsg)) {
        // 서버 밴드 조회가 취소됨
      } else {
        console.error('❌ 서버 밴드 조회 실패:', e);
      }
    }
  }, [effectiveUserId]);

  return {
    strategies,
    setStrategies,
    serverBands,
    setServerBands,
    boardActingId,
    saveStrategiesToLocal,
    loadStrategiesFromLocal,
    handleBoardClose,
    refreshServerBands,
    hasLoadedStrategiesRef
  };
};
