import { useState, useCallback} from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiFetchJson } from '@/lib/queryClient';
import { TradingExecutionService } from '@/services/tradingExecution';
import { TradingValidation } from '@/utils/trading/validation';
import { useBalanceManager } from './useBalanceManager';
import { usePositionManager } from './usePositionManager';
import { useTradeHistory } from './useTradeHistory';

export interface TradingLogicHook {
  // 상태
  isTrading: boolean;
  isLoading: boolean;
  
  // 액션
  executeForceEntry: (params: ForceEntryParams) => Promise<void>;
  executePositionClose: (positionId: string) => Promise<void>;
  startAutoTrading: () => Promise<void>;
  stopAutoTrading: () => Promise<void>;
  
  // 데이터
  balanceManager: ReturnType<typeof useBalanceManager>;
  positionManager: ReturnType<typeof usePositionManager>;
  tradeHistory: ReturnType<typeof useTradeHistory>;
}

export interface ForceEntryParams {
  symbol: string;
  quantity: number;
  leverage: number;
  currentKimp: number;
  strategyId?: string;
}

export const useTradingLogic = (
  userId: string, 
  isLiveMode: boolean = false
): TradingLogicHook => {
  const [isTrading, setIsTrading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // 하위 관리자들
  const balanceManager = useBalanceManager(userId, isLiveMode);
  const positionManager = usePositionManager(userId);
  const tradeHistory = useTradeHistory(userId, isLiveMode);

  /**
   * 강제 진입 실행
   */
  const executeForceEntry = useCallback(async (params: ForceEntryParams) => {
    setIsLoading(true);
    
    try {
      // 1. 유효성 검사
      const quantityValidation = TradingValidation.validateTradeQuantity(params.quantity, params.symbol);
      if (!quantityValidation.isValid) {
        toast({ title: '유효성 검사 실패', description: quantityValidation.error, variant: 'destructive' });
        return;
      }

      const leverageValidation = TradingValidation.validateLeverage(params.leverage);
      if (!leverageValidation.isValid) {
        toast({ title: '유효성 검사 실패', description: leverageValidation.error, variant: 'destructive' });
        return;
      }

      // 2. 잔고 확인
      const { liveBalance } = balanceManager;
      const requiredKrw = params.quantity * 150000000; // 대략적인 BTC 가격
      const requiredUsdt = params.quantity * 100000; // 대략적인 USD 가격
      
      if (liveBalance.krw < requiredKrw) {
        toast({ title: '잔고 부족', description: 'KRW 잔고가 부족합니다', variant: 'destructive' });
        return;
      }
      
      if (liveBalance.usdt < requiredUsdt) {
        toast({ title: '잔고 부족', description: 'USDT 잔고가 부족합니다', variant: 'destructive' });
        return;
      }

      // 3. 거래 실행
      const result = await TradingExecutionService.executeForceEntry({
        symbol: params.symbol,
        upbitQuantity: params.quantity,
        binanceQuantity: params.quantity,
        leverage: params.leverage,
        userId,
        currentKimp: params.currentKimp,
        strategyId: params.strategyId
      });

      if (result.success) {
        // 4. 포지션 생성
        const newPosition = {
          id: `position-${Date.now()}`,
          strategyId: params.strategyId || 'force-entry',
          strategyName: '강제 진입',
          symbol: params.symbol,
          type: 'force_entry',
          entryTime: new Date(),
          entryPremiumRate: params.currentKimp,
          upbitQuantity: params.quantity,
          upbitPrice: 150000000, // TODO: 실제 체결가 사용
          binanceSpotQuantity: params.quantity,
          binanceQuantity: params.quantity,
          binancePrice: 100000, // TODO: 실제 체결가 사용
          leverage: params.leverage,
          status: 'open' as const
        };
        
        positionManager.addPosition(newPosition);

        // 5. 거래 기록 추가
        tradeHistory.addTrade({
          id: `trade-${Date.now()}-upbit`,
          timestamp: new Date(),
          type: 'buy',
          symbol: params.symbol,
          quantity: params.quantity,
          price: 150000000,
          fee: 0,
          exchange: 'upbit',
          strategyId: params.strategyId || 'force-entry',
          strategyName: '강제 진입',
          premiumRate: params.currentKimp
        });

        tradeHistory.addTrade({
          id: `trade-${Date.now()}-binance`,
          timestamp: new Date(),
          type: 'short',
          symbol: params.symbol,
          quantity: params.quantity,
          price: 100000,
          fee: 0,
          exchange: 'binance',
          strategyId: params.strategyId || 'force-entry',
          strategyName: '강제 진입',
          premiumRate: params.currentKimp
        });

        // 6. 잔고 업데이트
        balanceManager.updateBalance({
          krw: liveBalance.krw - requiredKrw,
          usdt: liveBalance.usdt - requiredUsdt,
          btc: liveBalance.btc + params.quantity,
          binanceBtc: liveBalance.binanceBtc - params.quantity
        });

        toast({ title: '강제 진입 성공', description: result.message });
      } else {
        toast({ title: '강제 진입 실패', description: result.message, variant: 'destructive' });
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: '강제 진입 오류', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, balanceManager, positionManager, tradeHistory, toast]);

  /**
   * 포지션 청산
   */
  const executePositionClose = useCallback(async (positionId: string) => {
    setIsLoading(true);
    
    try {
      const position = positionManager.getPositionById(positionId);
      if (!position) {
        toast({ title: '포지션 없음', description: '해당 포지션을 찾을 수 없습니다', variant: 'destructive' });
        return;
      }

      const result = await TradingExecutionService.executePositionClose({
        symbol: position.symbol,
        upbitQuantity: position.upbitQuantity,
        binanceQuantity: position.binanceQuantity,
        userId,
        positionId
      });

      if (result.success) {
        // 포지션 청산 처리
        positionManager.closePosition(positionId, {
          exitTime: new Date(),
          exitPremiumRate: 0, // TODO: 현재 김프율 사용
          realizedPnl: 0 // TODO: 실제 PnL 계산
        });

        toast({ title: '포지션 청산 성공', description: result.message });
      } else {
        toast({ title: '포지션 청산 실패', description: result.message, variant: 'destructive' });
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: '포지션 청산 오류', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, positionManager, toast]);

  /**
   * 자동매매 시작
   */
  const startAutoTrading = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const result = await apiFetchJson(`/api/trading/start/${userId}`, {
        method: 'POST'
      });

      if (result.message === '자동매매가 시작되었습니다') {
        setIsTrading(true);
        toast({ title: '자동매매 시작', description: result.message });
      } else {
        toast({ title: '자동매매 시작 실패', description: result.error || '알 수 없는 오류', variant: 'destructive' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: '자동매매 시작 오류', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  /**
   * 자동매매 중지
   */
  const stopAutoTrading = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const result = await apiFetchJson(`/api/trading/stop/${userId}`, {
        method: 'POST'
      });

      if (result.message === '자동매매가 중지되었습니다') {
        setIsTrading(false);
        toast({ title: '자동매매 중지', description: result.message });
      } else {
        toast({ title: '자동매매 중지 실패', description: result.error || '알 수 없는 오류', variant: 'destructive' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: '자동매매 중지 오류', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  return {
    isTrading,
    isLoading,
    executeForceEntry,
    executePositionClose,
    startAutoTrading,
    stopAutoTrading,
    balanceManager,
    positionManager,
    tradeHistory
  };
};
