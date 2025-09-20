import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';

interface KimchiData {
  symbol: string;
  premiumRate: number;
  upbitPrice: number;
  binanceFuturesPrice: number;
  usdKrwRate: number;
  timestamp: string;
}

interface RealTimeDataHook {
  kimchiData: KimchiData[];
  currentExchangeRate: number | null;
  isRealTimeDataValid: (data: any) => boolean;
}

export const useRealTimeData = (): RealTimeDataHook => {
  const [kimchiData, setKimchiData] = useState<KimchiData[]>([]);
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number | null>(null);
  const { subscribe } = useWebSocket();

  // 실시간 데이터 유효성 검사
  const isRealTimeDataValid = useCallback((data: any): boolean => {
    if (!data || !Array.isArray(data)) return false;
    
    const btcData = data.find((item: any) => item.symbol === 'BTC');
    if (!btcData) return false;
    
    // 가격이 합리적인 범위인지 확인
    const { upbitPrice, binanceFuturesPrice, usdKrwRate } = btcData;
    
    return (
      upbitPrice > 50000000 && upbitPrice < 500000000 && // 5천만 ~ 5억원
      binanceFuturesPrice > 30000 && binanceFuturesPrice < 300000 && // 3만 ~ 30만 달러
      usdKrwRate > 1000 && usdKrwRate < 2000 // 1000 ~ 2000원
    );
  }, []);

  // WebSocket 메시지 구독
  useEffect(() => {
    const unsubscribeKimchi = subscribe('kimchi-premium', (data: KimchiData[]) => {
      if (isRealTimeDataValid(data)) {
        setKimchiData(data);
      }
    });

    const unsubscribeExchange = subscribe('exchange-rate', (rate: number) => {
      if (rate > 1000 && rate < 2000) {
        setCurrentExchangeRate(rate);
      }
    });

    return () => {
      unsubscribeKimchi();
      unsubscribeExchange();
    };
  }, [subscribe, isRealTimeDataValid]);

  return {
    kimchiData,
    currentExchangeRate,
    isRealTimeDataValid
  };
};
