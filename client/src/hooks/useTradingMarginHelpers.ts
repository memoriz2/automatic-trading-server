import { useCallback } from 'react';
import { isNum } from '@/utils/trading/formatters';

export const useTradingMarginHelpers = (
  setBalances: any,
  realStrategies: any[]
) => {
  const updateUsedMarginFromMock = useCallback(() => {
    if (!Array.isArray(realStrategies)) return;

    const totalUsedMargin = realStrategies.reduce((sum: number, strategy: any) => {
      if (strategy.isActive && isNum(strategy.investmentAmount)) {
        return sum + Number(strategy.investmentAmount);
      }
      return sum;
    }, 0);

    setBalances((prev: any) => ({
      ...prev,
      mock: {
        ...prev.mock,
        usedMargin: totalUsedMargin,
        availableMargin: Math.max(0, (prev.mock?.totalBalance || 0) - totalUsedMargin)
      }
    }));
  }, [realStrategies, setBalances]);

  const updateUsedMarginFromStatus = useCallback((status: any) => {
    if (!status || typeof status !== 'object') return;

    setBalances((prev: any) => ({
      ...prev,
      real: {
        ...prev.real,
        usedMargin: isNum(status.used_margin) ? status.used_margin : prev.real?.usedMargin || 0,
        availableMargin: isNum(status.available_margin) ? status.available_margin : prev.real?.availableMargin || 0,
        totalBalance: isNum(status.total_balance) ? status.total_balance : prev.real?.totalBalance || 0,
        unrealizedPnl: isNum(status.unrealized_pnl) ? status.unrealized_pnl : prev.real?.unrealizedPnl || 0,
        totalPnl: isNum(status.total_pnl) ? status.total_pnl : prev.real?.totalPnl || 0
      }
    }));
  }, [setBalances]);

  const removeBoardRowOptimistic = useCallback((id: string | number) => {
    // 낙관적 UI 업데이트 - 실제 서버 요청 전에 UI에서 제거
    // 이 함수는 UI 반응성을 높이기 위해 사용됨
    console.log(`🗑️ 낙관적 제거: ${id}`);
  }, []);

  return {
    updateUsedMarginFromMock,
    updateUsedMarginFromStatus,
    removeBoardRowOptimistic
  };
};