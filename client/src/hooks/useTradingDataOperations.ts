import { useCallback } from 'react';

export const useTradingDataOperations = (
  effectiveUserId: string,
  currentPositions: any[]
) => {
  const restoreTradesFromPositions = useCallback(() => {
    try {
      if (!currentPositions || currentPositions.length === 0) {
        console.log('📋 포지션 데이터가 없어 복원할 거래가 없습니다.');
        return [];
      }

      const restored = currentPositions.map((pos: any) => ({
        id: `restored-${pos.symbol}-${Date.now()}-${Math.random()}`,
        symbol: pos.symbol || 'BTC',
        side: pos.side || 'unknown',
        amount: pos.amount || 0,
        price: pos.price || 0,
        timestamp: Date.now(),
        status: 'restored',
        source: 'position-restore'
      }));

      console.log(`🔄 ${restored.length}개 포지션에서 거래 복원:`, restored);
      return restored;
    } catch (error) {
      console.error('❌ 포지션 복원 실패:', error);
      return [];
    }
  }, [currentPositions]);

  const saveStrategiesToLocal = useCallback((strategiesToSave: any[]) => {
    if (!effectiveUserId) return;
    try {
      localStorage.setItem(`mock-strategies-${effectiveUserId}`, JSON.stringify(strategiesToSave));
      console.log(`💾 ${strategiesToSave.length}개 전략을 로컬에 저장 (사용자: ${effectiveUserId})`);
    } catch (error) {
      console.error('전략 저장 실패:', error);
    }
  }, [effectiveUserId]);

  const loadStrategiesFromLocal = useCallback(() => {
    if (!effectiveUserId) return [];
    try {
      const saved = localStorage.getItem(`mock-strategies-${effectiveUserId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log(`📂 ${parsed.length}개 전략을 로컬에서 로드 (사용자: ${effectiveUserId})`);
        return parsed;
      }
    } catch (error) {
      console.error('전략 로드 실패:', error);
    }
    return [];
  }, [effectiveUserId]);

  return {
    restoreTradesFromPositions,
    saveStrategiesToLocal,
    loadStrategiesFromLocal
  };
};