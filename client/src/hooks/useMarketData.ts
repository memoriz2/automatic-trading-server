import { useState, useCallback } from 'react';

export interface SparkPoint {
  time: number;
  value: number;
}

export interface MarketData {
  kimp: any;
  balances: any;
  metrics: any;
  sparkData: SparkPoint[];
}

export function useMarketData() {
  const [sparkData, setSparkData] = useState<SparkPoint[]>(() => {
    const now = Date.now();
    const initialData: SparkPoint[] = [];
    for (let i = 299; i >= 0; i--) {
      initialData.push({
        time: now - i * 60000, // 1분 간격
        value: 0
      });
    }
    return initialData;
  });

  const [kimp, setKimp] = useState<any>({});
  const [balances, setBalances] = useState<any>({ real: {}, connected: {} });
  const [metrics, setMetrics] = useState<any>({});

  const updateSparkData = useCallback((newValue: number) => {
    setSparkData(prev => {
      const now = Date.now();
      const newData = [...prev.slice(1), { time: now, value: newValue }];
      return newData;
    });
  }, []);

  const updateMarketData = useCallback((data: Partial<MarketData>) => {
    if (data.kimp !== undefined) setKimp(data.kimp);
    if (data.balances !== undefined) setBalances(data.balances);
    if (data.metrics !== undefined) setMetrics(data.metrics);
  }, []);

  return {
    sparkData,
    setSparkData,
    kimp,
    setKimp,
    balances,
    setBalances,
    metrics,
    setMetrics,
    updateSparkData,
    updateMarketData
  };
}