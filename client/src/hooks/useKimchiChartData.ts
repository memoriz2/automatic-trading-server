import { useState, useEffect, useCallback, useRef } from 'react';

  interface ChartPoint {
    t: number;
    v: number;
    upbit?: number;
    binance?: number;
  }

  export function useKimchiChartData(symbol: string = 'BTC') {
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const lastSaveTime = useRef<number>(0); // 마지막 저장 시간 추적

    // 초기 데이터 로딩 (오전 9시부터)
    useEffect(() => {
      const loadChartData = async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/chart/kimchi-premium?symbol=${symbol}`);
          const data = await res.json();
          setChartData(data);
        } catch (error) {
          console.error('차트 데이터 로딩 실패:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadChartData();
    }, [symbol]);

    // 새 데이터 추가 및 DB 저장
    const addDataPoint = useCallback(async (
      kimp: number,
      upbitPrice: number,
      binancePrice: number,
      exchangeRate: number
    ) => {
      setChartData(prev => {
        const newPoint: ChartPoint = {
          t: Date.now(),
          v: kimp,
          upbit: upbitPrice,
          binance: binancePrice
        };
        const newData = [...prev, newPoint];

  // 변경 → 한국 시간 명시
  const koreaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul'
  }));
  const today9AM = new Date(koreaTime);
  today9AM.setHours(9, 0, 0, 0);

  // 현재가 오전 9시 이전이면 어제 9시, 아니면 오늘 9시
  const startTime = koreaTime.getTime() < today9AM.getTime()
    ? today9AM.getTime() - 24 * 60 * 60 * 1000
    : today9AM.getTime();
    
        // 오전 9시 이후 데이터만 유지
        const filtered = newData.filter(point => point.t > startTime);

        // 3분(180초)마다 DB 저장 (시간 기반)
        const now = Date.now();
        const threeMinutes = 3 * 60 * 1000; // 180000ms

        if (now - lastSaveTime.current >= threeMinutes) {
          lastSaveTime.current = now;
          fetch('/api/chart/kimchi-premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol,
              upbitPrice,
              binancePrice,
              premiumRate: kimp,
              exchangeRate,
            })
          }).catch(err => console.error('차트 데이터 저장 실패:', err));
        }

        return filtered;
      });
    }, [symbol]);

    return {
      chartData,
      isLoading,
      addDataPoint,
    };
  }