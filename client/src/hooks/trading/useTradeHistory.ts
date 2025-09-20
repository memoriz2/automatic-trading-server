import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/queryClient';

export interface LiveTrade {
  id: string;
  timestamp: Date;
  type: 'buy' | 'sell' | 'spot' | 'short' | 'cover';
  symbol: string;
  quantity: number;
  price: number;
  fee: number;
  exchange: 'upbit' | 'binance';
  strategyId: string;
  strategyName?: string;
  premiumRate: number;
}

export interface TradeHistoryHook {
  liveTrades: LiveTrade[];
  setLiveTrades: (trades: LiveTrade[]) => void;
  addTrade: (trade: LiveTrade) => void;
  getRecentTrades: (limit?: number) => LiveTrade[];
  getTradingLogs: () => string[];
  syncTradesFromServer: () => Promise<void>;
  saveTradesLocally: () => void;
}

export const useTradeHistory = (
  userId: string, 
  isLiveMode: boolean = false
): TradeHistoryHook => {

  // 거래 기록 상태
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>(() => {
    if (isLiveMode) {
      // 실거래 모드: DB에서 조회하므로 빈 배열로 시작
      return [];
    }
    
    // Mock 모드: 로컬스토리지에서 복원
    try {
      const saved = localStorage.getItem(`live-trades-${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }));
      }
    } catch (error) {
      console.error('거래 기록 로드 실패:', error);
    }
    return [];
  });

  // 거래 로그 상태 (실시간 로그용)
  const [tradingLogs, setTradingLogs] = useState<string[]>([]);

  // 거래 추가
  const addTrade = useCallback((trade: LiveTrade) => {
    setLiveTrades(prev => {
      const updated = [trade, ...prev];
      // 최대 100개 거래만 유지
      return updated.slice(0, 100);
    });

    // 거래 로그 추가
    const logMessage = `${trade.timestamp.toLocaleTimeString()} - ${trade.exchange.toUpperCase()} ${trade.type.toUpperCase()}: ${trade.quantity} ${trade.symbol} @ ${trade.price.toLocaleString()}`;
    setTradingLogs(prev => {
      const updated = [logMessage, ...prev];
      return updated.slice(0, 50); // 최대 50개 로그
    });
  }, []);

  // 최근 거래 조회
  const getRecentTrades = useCallback((limit: number = 10) => {
    return liveTrades.slice(0, limit);
  }, [liveTrades]);

  // 거래 로그 조회
  const getTradingLogs = useCallback(() => {
    return tradingLogs;
  }, [tradingLogs]);

  // 서버에서 거래 기록 동기화
  const syncTradesFromServer = useCallback(async () => {
    if (!isLiveMode) return;

    try {
      const tradesResponse = await apiFetch('/api/trades');
      if (tradesResponse && Array.isArray(tradesResponse)) {
        const normalizedTrades = tradesResponse.map((t: any) => ({
          id: String(t.id),
          timestamp: new Date(t.timestamp || t.createdAt),
          type: t.type || t.side,
          symbol: t.symbol,
          quantity: parseFloat(t.quantity || 0),
          price: parseFloat(t.price || 0),
          fee: parseFloat(t.fee || 0),
          exchange: t.exchange,
          strategyId: String(t.strategyId || ''),
          strategyName: t.strategyName || '',
          premiumRate: parseFloat(t.premiumRate || 0)
        }));
        
        setLiveTrades(normalizedTrades);
      }
    } catch (error) {
      console.error('서버 거래 기록 동기화 실패:', error);
    }
  }, [isLiveMode]);

  // 로컬 저장
  const saveTradesLocally = useCallback(() => {
    if (!isLiveMode) {
      try {
        localStorage.setItem(`live-trades-${userId}`, JSON.stringify(liveTrades));
      } catch (error) {
        console.error('거래 기록 저장 실패:', error);
      }
    }
  }, [liveTrades, userId, isLiveMode]);

  // Mock 모드에서 거래 변경 시 자동 저장
  useEffect(() => {
    if (!isLiveMode) {
      saveTradesLocally();
    }
  }, [liveTrades, isLiveMode, saveTradesLocally]);

  // 실거래 모드에서 주기적 동기화
  useEffect(() => {
    if (isLiveMode) {
      syncTradesFromServer();
      
      // 1분마다 동기화
      const interval = setInterval(syncTradesFromServer, 60000);
      return () => clearInterval(interval);
    }
  }, [isLiveMode, syncTradesFromServer]);

  return {
    liveTrades,
    setLiveTrades,
    addTrade,
    getRecentTrades,
    getTradingLogs,
    syncTradesFromServer,
    saveTradesLocally
  };
};
