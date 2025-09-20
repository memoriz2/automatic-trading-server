import { useState, useCallback, useRef } from 'react';

interface SparkPoint {
  timestamp: number;
  value: number;
}

interface ChartDataHook {
  sparkData: SparkPoint[];
  setSparkData: (data: SparkPoint[]) => void;
  addSparkPoint: (value: number) => void;
  clearSparkData: () => void;
}

export const useChartData = (): ChartDataHook => {
  const [sparkData, setSparkData] = useState<SparkPoint[]>(() => {
    try {
      const saved = localStorage.getItem('spark-chart-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 1시간 이내 데이터만 복원 (오래된 데이터 제거)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        return parsed.filter((point: SparkPoint) => point.timestamp > oneHourAgo);
      }
    } catch (error) {
      console.error('차트 데이터 복원 실패:', error);
    }
    return [];
  });

  const lastSaveTimeRef = useRef<number>(0);

  // 차트 포인트 추가
  const addSparkPoint = useCallback((value: number) => {
    const now = Date.now();
    const newPoint: SparkPoint = { timestamp: now, value };
    
    setSparkData(prev => {
      const updated = [...prev, newPoint];
      // 최대 100개 포인트만 유지
      const trimmed = updated.slice(-100);
      
      // 5초마다 한 번씩만 localStorage에 저장 (성능 최적화)
      if (now - lastSaveTimeRef.current > 5000) {
        try {
          localStorage.setItem('spark-chart-data', JSON.stringify(trimmed));
          lastSaveTimeRef.current = now;
        } catch (error) {
          console.error('차트 데이터 저장 실패:', error);
        }
      }
      
      return trimmed;
    });
  }, []);

  // 차트 데이터 초기화
  const clearSparkData = useCallback(() => {
    setSparkData([]);
    localStorage.removeItem('spark-chart-data');
  }, []);

  return {
    sparkData,
    setSparkData,
    addSparkPoint,
    clearSparkData
  };
};
