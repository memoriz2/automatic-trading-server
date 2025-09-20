import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface LiveBalance {
  krw: number;
  btc: number;
  usdt: number;
  binanceBtc: number;
}

export interface BalanceManagerHook {
  liveBalance: LiveBalance;
  setLiveBalance: (balance: LiveBalance) => void;
  updateBalance: (updates: Partial<LiveBalance>) => void;
  resetBalance: () => void;
  saveBalanceToStorage: () => void;
  loadBalanceFromStorage: () => LiveBalance;
}

export const useBalanceManager = (
  userId: string, 
  isLiveMode: boolean = false
): BalanceManagerHook => {
  
  // 실거래 잔고 조회
  const { data: realBalances } = useQuery({
    queryKey: [`/api/balances/${userId}`],
    refetchInterval: isLiveMode ? 60000 : false, // 실거래 모드에서만 1분마다 갱신
    enabled: isLiveMode && !!userId,
  });

  // 로컬 잔고 상태
  const [liveBalance, setLiveBalance] = useState<LiveBalance>(() => {
    if (isLiveMode) {
      // 실거래 모드: 실제 거래소 잔고 사용
      return {
        krw: 0, // 실제 잔고는 realBalances에서 가져옴
        btc: 0,
        usdt: 0,
        binanceBtc: 0,
      };
    }
    
    // Mock 모드: 로컬스토리지에서 복원
    return loadBalanceFromStorage();
  });

  // 로컬스토리지에서 잔고 로드
  const loadBalanceFromStorage = useCallback((): LiveBalance => {
    try {
      const saved = localStorage.getItem(`live-balance-${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          krw: parseFloat(parsed.krw || 0),
          btc: parseFloat(parsed.btc || 0),
          usdt: parseFloat(parsed.usdt || 0),
          binanceBtc: parseFloat(parsed.binanceBtc || 0),
        };
      }
    } catch (error) {
      console.error('잔고 데이터 로드 실패:', error);
    }
    
    // 기본 Mock 잔고
    return {
      krw: 100000000, // 1억원
      btc: 0,
      usdt: 100000, // 10만 USDT
      binanceBtc: 0,
    };
  }, [userId]);

  // 로컬스토리지에 잔고 저장
  const saveBalanceToStorage = useCallback(() => {
    if (!isLiveMode) {
      try {
        localStorage.setItem(`live-balance-${userId}`, JSON.stringify(liveBalance));
      } catch (error) {
        console.error('잔고 데이터 저장 실패:', error);
      }
    }
  }, [liveBalance, userId, isLiveMode]);

  // 잔고 업데이트
  const updateBalance = useCallback((updates: Partial<LiveBalance>) => {
    setLiveBalance(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // 잔고 초기화
  const resetBalance = useCallback(() => {
    const defaultBalance = {
      krw: 100000000,
      btc: 0,
      usdt: 100000,
      binanceBtc: 0,
    };
    setLiveBalance(defaultBalance);
    
    if (!isLiveMode) {
      localStorage.setItem(`live-balance-${userId}`, JSON.stringify(defaultBalance));
    }
  }, [userId, isLiveMode]);

  // 실거래 모드에서 실제 잔고로 업데이트
  useEffect(() => {
    if (isLiveMode && realBalances) {
      setLiveBalance(prev => ({
        ...prev,
        krw: (realBalances as any)?.upbit?.krw || 0,
        usdt: (realBalances as any)?.binance?.usdt || 0,
        // BTC 잔고는 포지션에서 계산
      }));
    }
  }, [realBalances, isLiveMode]);

  // Mock 모드에서 잔고 변경 시 자동 저장
  useEffect(() => {
    if (!isLiveMode) {
      saveBalanceToStorage();
    }
  }, [liveBalance, isLiveMode, saveBalanceToStorage]);

  return {
    liveBalance,
    setLiveBalance,
    updateBalance,
    resetBalance,
    saveBalanceToStorage,
    loadBalanceFromStorage
  };
};
