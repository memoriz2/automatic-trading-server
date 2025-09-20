import { useState, useEffect, useCallback } from 'react';

export interface LivePosition {
  id: string;
  strategyId: string;
  strategyName?: string;
  symbol: string;
  type: string;
  entryTime: Date;
  entryPremiumRate: number;
  upbitQuantity: number;
  upbitPrice: number;
  entryUsdKrw?: number;
  binanceSpotQuantity: number;
  binanceQuantity: number;
  binancePrice: number;
  leverage: number;
  status: 'open' | 'closed';
  exitTime?: Date;
  exitPremiumRate?: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
}

export interface PositionManagerHook {
  livePositions: LivePosition[];
  setLivePositions: (positions: LivePosition[]) => void;
  addPosition: (position: LivePosition) => void;
  updatePosition: (id: string, updates: Partial<LivePosition>) => void;
  closePosition: (id: string, exitData?: Partial<LivePosition>) => void;
  getActivePositions: () => LivePosition[];
  getPositionById: (id: string) => LivePosition | undefined;
  savePositionsToStorage: () => void;
  loadPositionsFromStorage: () => LivePosition[];
}

export const usePositionManager = (userId: string): PositionManagerHook => {
  const [livePositions, setLivePositions] = useState<LivePosition[]>(() => {
    return loadPositionsFromStorage();
  });

  // 로컬스토리지에서 포지션 로드
  function loadPositionsFromStorage(): LivePosition[] {
    try {
      const storageKey = `live-positions-${userId}`;
      const saved = localStorage.getItem(storageKey);
      const positions = saved ? JSON.parse(saved) : [];
      return positions.map((p: any) => ({
        ...p,
        entryTime: new Date(p.entryTime),
        exitTime: p.exitTime ? new Date(p.exitTime) : undefined
      }));
    } catch (error) {
      console.error('포지션 데이터 로드 실패:', error);
      return [];
    }
  }

  // 로컬스토리지에 포지션 저장
  const savePositionsToStorage = useCallback(() => {
    try {
      const storageKey = `live-positions-${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(livePositions));
    } catch (error) {
      console.error('포지션 데이터 저장 실패:', error);
    }
  }, [livePositions, userId]);

  // 포지션 추가
  const addPosition = useCallback((position: LivePosition) => {
    setLivePositions(prev => [...prev, position]);
  }, []);

  // 포지션 업데이트
  const updatePosition = useCallback((id: string, updates: Partial<LivePosition>) => {
    setLivePositions(prev => 
      prev.map(pos => 
        pos.id === id ? { ...pos, ...updates } : pos
      )
    );
  }, []);

  // 포지션 청산
  const closePosition = useCallback((id: string, exitData?: Partial<LivePosition>) => {
    setLivePositions(prev => 
      prev.map(pos => 
        pos.id === id 
          ? { 
              ...pos, 
              status: 'closed' as const,
              exitTime: new Date(),
              ...exitData 
            }
          : pos
      )
    );
  }, []);

  // 활성 포지션 조회
  const getActivePositions = useCallback(() => {
    return livePositions.filter(pos => pos.status === 'open');
  }, [livePositions]);

  // ID로 포지션 조회
  const getPositionById = useCallback((id: string) => {
    return livePositions.find(pos => pos.id === id);
  }, [livePositions]);

  // 포지션 변경 시 자동 저장
  useEffect(() => {
    savePositionsToStorage();
  }, [livePositions, savePositionsToStorage]);

  return {
    livePositions,
    setLivePositions,
    addPosition,
    updatePosition,
    closePosition,
    getActivePositions,
    getPositionById,
    savePositionsToStorage,
    loadPositionsFromStorage
  };
};
