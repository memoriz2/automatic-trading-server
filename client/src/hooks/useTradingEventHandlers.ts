import { useCallback, useRef } from 'react';
import { Strategy } from '@/types/trading';
// import { isNum, fx, formatBTC, formatKRW, formatUSD } from '@/utils/trading/formatters';
  // import { normalizeAmountBtc } from '@/utils/trading/calculations';
// import { getInitialStrategy, getSafeLeverage } from '@/config/strategy-defaults';
// import { parseLeverage, calculateInvestmentWithLeverage } from '@/utils/trading/leverage';
// import { INFLIGHT_API, API_CACHE } from '@/utils/trading/cache';
  // import { apiFetchJson } from '@/lib/queryClient';
  // import { logger } from '@/utils/logger';

type ToastFunction = (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;

export const useTradingEventHandlers = (
  effectiveUserId: string,
  toast: ToastFunction,
  setRegisteringIndex: (index: number | null) => void,
  setUnregisteringIndex: (index: number | null) => void,
  setStarting: (starting: boolean) => void,
  setStrategies: (strategies: Strategy[]) => void,
  setRefreshTrigger: (fn: (prev: number) => number) => void
) => {
  const cooldownRef = useRef(false);

  const handleBandSubmit = useCallback(async (index: number) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 1000);

    setRegisteringIndex(index);

    try {
      const response = await fetch('/api/register-band', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ index })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: '밴드 등록 성공',
          description: result.message || '밴드가 성공적으로 등록되었습니다.',
          variant: 'default'
        });
      } else {
        throw new Error('밴드 등록 실패');
      }
    } catch (error) {
      console.error('밴드 등록 오류:', error);
      toast({
        title: '밴드 등록 실패',
        description: '밴드 등록 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setRegisteringIndex(null);
    }
  }, [setRegisteringIndex, toast]);

  const handleBandUnregister = useCallback(async (index: number) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 1000);

    setUnregisteringIndex(index);

    try {
      const response = await fetch('/api/unregister-band', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ index })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: '밴드 해제 성공',
          description: result.message || '밴드가 성공적으로 해제되었습니다.',
          variant: 'default'
        });
      } else {
        throw new Error('밴드 해제 실패');
      }
    } catch (error) {
      console.error('밴드 해제 오류:', error);
      toast({
        title: '밴드 해제 실패',
        description: '밴드 해제 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setUnregisteringIndex(null);
    }
  }, [setUnregisteringIndex, toast]);

  const handleStartTrading = useCallback(async () => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 1000);

    setStarting(true);

    try {
      const response = await fetch('/api/start-trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: '거래 시작',
          description: result.message || '자동 거래가 시작되었습니다.',
          variant: 'default'
        });
      } else {
        throw new Error('거래 시작 실패');
      }
    } catch (error) {
      console.error('거래 시작 오류:', error);
      toast({
        title: '거래 시작 실패',
        description: '거래 시작 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setStarting(false);
    }
  }, [setStarting, toast]);

  const handleAddStrategy = useCallback((newStrategy: Strategy) => {
    const strategyKey = `mock-strategies-${effectiveUserId}`;
    const existingStrategies = JSON.parse(localStorage.getItem(strategyKey) || '[]') as Strategy[];
    const updatedStrategies = [...existingStrategies, newStrategy];
    localStorage.setItem(strategyKey, JSON.stringify(updatedStrategies));
    setStrategies(updatedStrategies);
    setRefreshTrigger((prev: number) => prev + 1);
  }, [effectiveUserId, setStrategies, setRefreshTrigger]);

  const handleEditStrategy = useCallback((strategyId: string, updatedData: Partial<Strategy>) => {
    const strategyKey = `mock-strategies-${effectiveUserId}`;
    const existingStrategies = JSON.parse(localStorage.getItem(strategyKey) || '[]') as Strategy[];
    const updatedStrategies = existingStrategies.map((s) =>
      s.id === strategyId ? { ...s, ...updatedData } : s
    );
    localStorage.setItem(strategyKey, JSON.stringify(updatedStrategies));
    setStrategies(updatedStrategies);
    setRefreshTrigger((prev: number) => prev + 1);
  }, [effectiveUserId, setStrategies, setRefreshTrigger]);

  const handleDeleteStrategy = useCallback((strategyId: string) => {
    const strategyKey = `mock-strategies-${effectiveUserId}`;
    const existingStrategies = JSON.parse(localStorage.getItem(strategyKey) || '[]') as Strategy[];
    const updatedStrategies = existingStrategies.filter((s) => s.id !== strategyId);
    localStorage.setItem(strategyKey, JSON.stringify(updatedStrategies));
    setStrategies(updatedStrategies);
    setRefreshTrigger((prev: number) => prev + 1);
  }, [effectiveUserId, setStrategies, setRefreshTrigger]);

  return {
    handleBandSubmit,
    handleBandUnregister,
    handleStartTrading,
    handleAddStrategy,
    handleEditStrategy,
    handleDeleteStrategy
  };
};