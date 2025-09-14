import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { calculateEntryTrade, calculateExitTrade } from '@/utils/trading/calculations';
import { saveTradeToDB, savePositionToDB, updatePositionInDB } from '@/utils/trading/storage';
import { formatKoreanTime } from '@/utils/datetime';

export const useMockTrading = (
  userId: string,
  isLiveMode: boolean,
  mockBalance: any,
  setMockBalance: any,
  currentKimchiData: any,
  onStrategyStatsUpdate?: any
) => {
  const { toast } = useToast();
  
  // 거래 관련 상태
  const [mockTrades, setMockTrades] = useState<any[]>(() => {
    const storageKey = `mock-trades-${userId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('거래 기록 파싱 실패:', error);
        return [];
      }
    }
    return [];
  });

  const [mockPositions, setMockPositions] = useState<any[]>(() => {
    const storageKey = `mock-positions-${userId}`;
    const saved = localStorage.getItem(storageKey);
    const positions = saved ? JSON.parse(saved) : [];
    console.log('🎯 로컬 스토리지 포지션 로드:', positions);
    return positions;
  });

  const [isTrading, setIsTrading] = useState(false);
  const [tradeCounter, setTradeCounter] = useState(0);
  const [tradingLogs, setTradingLogs] = useState<string[]>([]);
  const [lastToastMessage, setLastToastMessage] = useState('');

  // 전략별 통계
  const strategyStatsRef = useRef<Record<string, any>>({});

  // 거래 로그 추가
  const addTradingLog = useCallback((message: string) => {
    const timestamp = formatKoreanTime();
    const logMessage = `[${timestamp}] ${message}`;
    setTradingLogs(prev => [...prev.slice(-9), logMessage]);
  }, []);

  // 포지션에서 거래 로그, 거래 기록, 전략 복원
  const restoreDataFromPositions = useCallback((setStrategies?: any) => {
    const savedPositions = localStorage.getItem(`mock-positions-${userId}`);
    if (savedPositions) {
      try {
        const positions = JSON.parse(savedPositions);
        const logs: string[] = [];
        const trades: any[] = [];
        const restoredStrategies: any[] = [];
        
        positions.forEach((position: any) => {
          const entryTime = formatKoreanTime(position.entryTime);
          const premiumRate = (position.entryPremiumRate * 100).toFixed(3);
          logs.push(`[${entryTime}] ✅ 진입 완료! 김프 ${premiumRate}%`);
          
          // 백업에서 원래 전략 데이터 찾기
          let originalStrategy = null;
          try {
            const backupKeys = Object.keys(localStorage)
              .filter(key => key.startsWith(`strategy-backup-`) && key.endsWith(`-${userId}`))
              .sort((a, b) => parseInt(b.split('-')[2]) - parseInt(a.split('-')[2])); // 최신순
            
            for (const backupKey of backupKeys) {
              const backupData = localStorage.getItem(backupKey);
              if (backupData) {
                const backup = JSON.parse(backupData);
                originalStrategy = backup.strategies?.find((s: any) => s.id === position.strategyId);
                if (originalStrategy) break;
              }
            }
          } catch (error) {
            console.warn('백업에서 원래 전략 찾기 실패:', error);
          }
          
          // 원래 전략 데이터가 있으면 사용, 없으면 포지션 기반으로 추정
          const restoredStrategy = originalStrategy ? {
            ...originalStrategy,
            isActive: true, // 활성 포지션이 있으므로 활성 상태
            created_at: originalStrategy.created_at || position.entryTime || new Date().toISOString()
          } : {
            id: position.strategyId,
            name: position.strategyName || `복원된 전략 (${position.strategyId.slice(-6)})`,
            crypto: 'BTC',
            entryCondition: '0',
            takeProfitCondition: '0.2',
            investmentAmount: position.upbitQuantity?.toString() || '0.003',
            leverage: position.leverage?.toString() || '5',
            tolerance: '0.6',
            riskLevel: 'moderate',
            isActive: true,
            profitRate: 0,
            executionCount: 1,
            created_at: position.entryTime || new Date().toISOString()
          };
          
          // 중복 방지
          if (!restoredStrategies.find(s => s.id === position.strategyId)) {
            restoredStrategies.push(restoredStrategy);
          }
          
          // 포지션에서 거래 기록 복원
          const tradeId = `trade-${position.id}`;
          trades.push({
            id: `${tradeId}-upbit`,
            timestamp: new Date(position.entryTime),
            type: 'buy',
            symbol: 'BTC',
            quantity: position.upbitQuantity,
            price: position.upbitPrice,
            fee: position.upbitQuantity * position.upbitPrice * 0.0005,
            exchange: 'upbit',
            strategyId: position.strategyId,
            strategyName: restoredStrategy.name,
            premiumRate: position.entryPremiumRate
          });
          
          trades.push({
            id: `${tradeId}-binance`,
            timestamp: new Date(position.entryTime),
            type: 'short',
            symbol: 'BTC',
            quantity: position.binanceQuantity,
            price: position.binancePrice,
            fee: position.binanceQuantity * position.binancePrice * 0.0004,
            exchange: 'binance',
            strategyId: position.strategyId,
            strategyName: restoredStrategy.name,
            premiumRate: position.entryPremiumRate
          });
          
          if (position.status === 'closed' && position.exitTime) {
            const exitTime = formatKoreanTime(position.exitTime);
            const pnl = position.realizedPnl || 0;
            logs.push(`[${exitTime}] ✅ 청산 완료! 손익 ${pnl >= 0 ? '+' : ''}₩${Math.round(pnl).toLocaleString()}`);
          }
        });
        
        setTradingLogs(logs.slice(-10)); // 최근 10개만
        setMockTrades(trades); // 거래 기록 복원
        
        // 전략 목록도 복원 (부모 컴포넌트에서 setStrategies 전달받은 경우)
        if (setStrategies && restoredStrategies.length > 0) {
          setStrategies((prev: any[]) => {
            const existingIds = prev.map(s => s.id);
            const newStrategies = restoredStrategies.filter(s => !existingIds.includes(s.id));
            const allStrategies = [...prev, ...newStrategies];
            
            // 로컬스토리지에도 저장
            localStorage.setItem(`mock-strategies-${userId}`, JSON.stringify(allStrategies));
            
            return allStrategies;
          });
          console.log('🔄 전략 목록 복원:', restoredStrategies.length, '개');
        }
        
        console.log('🔄 포지션에서 데이터 복원:', { logs: logs.length, trades: trades.length, strategies: restoredStrategies.length });
      } catch (error) {
        console.error('포지션 데이터 복원 실패:', error);
      }
    }
  }, [userId]);

  // 초기 로드 시 포지션에서 거래 데이터 복원
  useEffect(() => {
    console.log('🔍 복원 조건 확인:', { 
      tradingLogsLength: tradingLogs.length, 
      mockTradesLength: mockTrades.length,
      mockPositionsLength: mockPositions.length
    });
    
    // 거래 기록이 없거나 포지션이 있는데 거래 기록이 부족한 경우 복원 시도
    if (mockTrades.length === 0 || (mockPositions.length > 0 && mockTrades.length < mockPositions.length * 2)) {
      console.log('🔄 데이터 불일치로 포지션에서 복원 시도...');
      restoreDataFromPositions();
    }
  }, [restoreDataFromPositions, mockTrades.length, mockPositions.length]);

  // 모의 진입
  const mockEntry = useCallback(async (strategy: any, premiumRate: number) => {
    console.log('🎯 mockEntry 시작:', strategy.name, premiumRate);
    
    try {
      if (!currentKimchiData) {
        console.error('❌ currentKimchiData is null in mockEntry');
        return;
      }

      const baseAmount = parseFloat(strategy.investmentAmount);
      const leverage = parseInt(strategy.leverage);
      const upbitPrice = currentKimchiData?.upbit_price || 156000000;
      const binancePrice = currentKimchiData?.binance_price || 112000;
      const entryUsdKrw = currentKimchiData?.usdkrw || 1390;

      // 거래 계산
      const calculation = calculateEntryTrade(
        baseAmount,
        leverage,
        upbitPrice,
        binancePrice,
        entryUsdKrw
      );

      // 잔고 확인
      if (mockBalance.krw < calculation.totalUpbitCost) {
        const errorMsg = `KRW 부족: 필요 ₩${calculation.totalUpbitCost.toLocaleString()}, 보유 ₩${mockBalance.krw.toLocaleString()}`;
        if (lastToastMessage !== errorMsg) {
          setLastToastMessage(errorMsg);
          toast({
            title: "💸 원화 부족!",
            description: `🏦 ${errorMsg} → 더 많은 자금이 필요해요!`,
            variant: "destructive"
          });
        }
        return;
      }

      if (mockBalance.usdt < calculation.binanceMargin + calculation.binanceFee) {
        const errorMsg = `증거금 부족: 필요 $${(calculation.binanceMargin + calculation.binanceFee).toFixed(2)}, 보유 $${(mockBalance.usdt || 0).toLocaleString()}`;
        if (lastToastMessage !== errorMsg) {
          setLastToastMessage(errorMsg);
          toast({
            title: "💵 USDT 증거금 부족!", 
            description: `⚠️ ${errorMsg} → 바이낸스 잔고를 확인해주세요!`,
            variant: "destructive"
          });
        }
        return;
      }

      // 잔고 업데이트
      setMockBalance((prev: any) => ({
        ...prev,
        // 업비트 현물: KRW로 BTC 매수
        krw: prev.krw - calculation.totalUpbitCost,
        btc: (prev.btc || 0) + calculation.upbitBuyAmountBTC,
        // 바이낸스 선물: USDT 증거금만 차감 (BTC 잔고는 변경 없음)
        usdt: prev.usdt - calculation.binanceMargin - calculation.binanceFee,
        binanceUsdt: (prev.binanceUsdt || 0) - calculation.binanceMargin - calculation.binanceFee,
        // 바이낸스 BTC는 선물이므로 실제 BTC 보유량과 별도 (변경 없음)
        binanceBtc: prev.binanceBtc || 0
      }));

      // 거래 기록 생성
      const currentCounter = tradeCounter + 1;
      setTradeCounter(currentCounter);
      const randomId = Math.random().toString(36).substring(2, 8);
      const tradeId = `trade-${Date.now()}-${currentCounter}-${randomId}`;
      
      const newTrades = [
        {
          id: `${tradeId}-binance`,
          timestamp: new Date(),
          type: 'short',
          symbol: 'BTC',
          quantity: calculation.binanceShortAmountBTC,
          price: binancePrice,
          fee: calculation.binanceFee,
          exchange: 'binance',
          strategyId: strategy.id,
          strategyName: strategy.name,
          premiumRate
        },
        {
          id: `${tradeId}-upbit`,
          timestamp: new Date(),
          type: 'buy',
          symbol: 'BTC',
          quantity: calculation.upbitBuyAmountBTC,
          price: upbitPrice,
          fee: calculation.upbitFee,
          exchange: 'upbit',
          strategyId: strategy.id,
          strategyName: strategy.name,
          premiumRate
        }
      ];

      setMockTrades(prev => [...prev, ...newTrades]);
      
      // 거래 기록 저장
      newTrades.forEach(trade => {
        saveTradeToDB(trade, userId, isLiveMode);
      });

      // 포지션 생성
      const newPosition = {
        id: `position-${Date.now()}-${currentCounter}-${randomId}`,
        strategyId: strategy.id,
        symbol: 'BTC',
        entryTime: new Date(),
        entryPremiumRate: premiumRate,
        upbitQuantity: calculation.upbitBuyAmountBTC,
        upbitPrice,
        entryUsdKrw,
        binanceSpotQuantity: 0,
        binanceQuantity: calculation.binanceShortAmountBTC,
        binancePrice,
        leverage,
        status: 'open',
        unrealizedPnl: 0,
        realizedPnl: 0
      };

      setMockPositions(prev => [...prev, newPosition]);
      
      // 전략별 통계 업데이트
      const cur = strategyStatsRef.current[strategy.id] || { executionCount: 0, realizedPnlKRW: 0, investedKRW: 0, profitRate: 0 };
      const updated = { 
        executionCount: cur.executionCount + 1,
        realizedPnlKRW: cur.realizedPnlKRW,
        investedKRW: cur.investedKRW + calculation.totalInvestedKRW,
        profitRate: cur.investedKRW + calculation.totalInvestedKRW > 0 ? (cur.realizedPnlKRW / (cur.investedKRW + calculation.totalInvestedKRW)) * 100 : 0
      };
      strategyStatsRef.current[strategy.id] = updated;
      onStrategyStatsUpdate?.({ ...strategyStatsRef.current });
      
      // 포지션 저장
      savePositionToDB(newPosition, userId, isLiveMode);

      addTradingLog(`✅ ${strategy.name} 진입 완료! 김프 ${premiumRate.toFixed(3)}%`);
      
      toast({
        title: "🚀 진입 신호 포착!",
        description: `🎯 ${strategy.name} 전략 → 김프율 ${premiumRate.toFixed(3)}%에서 완벽 진입! 💎`,
      });

    } catch (error) {
      console.error('❌ 모의 진입 실패:', error);
      toast({
        title: "모의 진입 실패",
        description: "모의 거래 실행 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsTrading(false);
    }
  }, [currentKimchiData, mockBalance, isLiveMode, userId, toast, tradeCounter, onStrategyStatsUpdate, lastToastMessage]);

  // 모의 청산
  const mockExit = useCallback(async (position: any, premiumRate: number, ratio: number = 1.0) => {
    setIsTrading(true);

    try {
      if (!currentKimchiData) {
        console.error('❌ currentKimchiData is null in mockExit');
        setIsTrading(false);
        return;
      }

      const currentUpbitPrice = currentKimchiData?.upbit_price || 156000000;
      const currentBinancePrice = currentKimchiData?.binance_price || 112000;
      const currentUsdKrw = currentKimchiData?.usdkrw || 1390;

      // 청산 계산
      const exitCalc = calculateExitTrade(
        position,
        currentUpbitPrice,
        currentBinancePrice,
        currentUsdKrw,
        ratio
      );

      // 잔고 업데이트
      setMockBalance((prev: any) => ({
        ...prev,
        // 업비트 현물: BTC 매도하여 KRW 획득
        krw: prev.krw + exitCalc.upbitNetRevenue,
        btc: (prev.btc || 0) - exitCalc.upbitSellQuantity,
        // 바이낸스 선물: 숏 포지션 청산으로 증거금 반환
        usdt: prev.usdt + exitCalc.binanceNetReturn,
        binanceUsdt: (prev.binanceUsdt || 0) + exitCalc.binanceNetReturn,
        // 바이낸스 BTC는 선물이므로 실제 BTC 보유량과 별도 (변경 없음)
        binanceBtc: prev.binanceBtc || 0
      }));

      // 청산 거래 기록 생성
      const currentCounter = tradeCounter + 1;
      setTradeCounter(currentCounter);
      const randomId = Math.random().toString(36).substring(2, 8);
      const tradeId = `exit-${Date.now()}-${currentCounter}-${randomId}`;
      
      const exitTrades = [
        {
          id: `${tradeId}-upbit`,
          timestamp: new Date(),
          type: 'sell',
          symbol: 'BTC',
          quantity: exitCalc.upbitSellQuantity,
          price: currentUpbitPrice,
          fee: exitCalc.upbitFee,
          exchange: 'upbit',
          strategyId: position.strategyId,
          strategyName: position.strategyName,
          premiumRate
        },
        {
          id: `${tradeId}-binance`,
          timestamp: new Date(),
          type: 'cover',
          symbol: 'BTC',
          quantity: exitCalc.binanceCloseQuantity,
          price: currentBinancePrice,
          fee: exitCalc.binanceFee,
          exchange: 'binance',
          strategyId: position.strategyId,
          strategyName: position.strategyName,
          premiumRate
        }
      ];

      setMockTrades(prev => [...prev, ...exitTrades]);
      
      // 청산 거래 기록 저장
      exitTrades.forEach(trade => {
        saveTradeToDB(trade, userId, isLiveMode);
      });

      // 포지션 업데이트
      const updatedPositions = mockPositions.map(p => 
        p.id === position.id 
          ? ratio >= 1.0 
            ? {...p, status: 'closed', realizedPnl: exitCalc.totalPnl}
            : {...p, 
                upbitQuantity: p.upbitQuantity * (1 - ratio),
                binanceQuantity: p.binanceQuantity * (1 - ratio),
                realizedPnl: (p.realizedPnl || 0) + exitCalc.totalPnl
              }
          : p
      );
      
      setMockPositions(updatedPositions);
      
      // 전략별 통계 업데이트
      const curStats = strategyStatsRef.current[position.strategyId] || { executionCount: 0, realizedPnlKRW: 0, investedKRW: 0, profitRate: 0 };
      const updatedRealizedPnl = (curStats.realizedPnlKRW || 0) + exitCalc.totalPnl;
      const updatedProfitRate = curStats.investedKRW > 0 ? (updatedRealizedPnl / curStats.investedKRW) * 100 : 0;
      
      strategyStatsRef.current[position.strategyId] = { 
        ...curStats, 
        realizedPnlKRW: updatedRealizedPnl, 
        profitRate: updatedProfitRate 
      };
      onStrategyStatsUpdate?.({ ...strategyStatsRef.current });
      
      // 포지션 업데이트 저장
      const updatedPosition = updatedPositions.find(p => p.id === position.id);
      if (updatedPosition) {
        updatePositionInDB(updatedPosition, userId, isLiveMode);
      }

      addTradingLog(
        `✅ 청산 | 투입액: ${Math.round(exitCalc.totalEntryCostKRW).toLocaleString()}원, 회수액: ${Math.round(exitCalc.totalExitRevenueKRW).toLocaleString()}원, 손익: ${(exitCalc.totalPnl>=0?'+':'')}${Math.round(exitCalc.totalPnl).toLocaleString()}원`
      );
      
      const profitColor = exitCalc.totalPnl >= 0 ? "" : "destructive";
      toast({
        title: exitCalc.totalPnl >= 0 ? `💰 수익 실현! +₩${Math.round(exitCalc.totalPnl).toLocaleString()}` : `📉 손실 확정 -₩${Math.abs(Math.round(exitCalc.totalPnl)).toLocaleString()}`,
        description: exitCalc.totalPnl >= 0 ? "🎉 성공적인 거래였습니다! 축하드려요!" : "📊 다음 기회를 노려보세요!",
        variant: profitColor as any
      });

    } catch (error) {
      console.error('❌ 모의 청산 실패:', error);
      toast({
        title: "모의 청산 실패",
        description: "모의 거래 청산 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsTrading(false);
    }
  }, [currentKimchiData, mockBalance, tradeCounter, mockPositions, isLiveMode, userId, onStrategyStatsUpdate, addTradingLog, toast, lastToastMessage]);

  // 전략 불일치 감지 및 복원 함수
  const checkAndRestoreStrategies = useCallback((setStrategies?: any) => {
    if (mockPositions.length > 0) {
      console.log('🔍 전략-포지션 불일치 감지, 복원 시도...');
      restoreDataFromPositions(setStrategies);
    }
  }, [mockPositions.length, restoreDataFromPositions]);

  return {
    mockTrades,
    setMockTrades,
    mockPositions,
    setMockPositions,
    isTrading,
    setIsTrading,
    tradeCounter,
    setTradeCounter,
    tradingLogs,
    setTradingLogs,
    lastToastMessage,
    setLastToastMessage,
    strategyStatsRef,
    addTradingLog,
    mockEntry,
    mockExit,
    restoreDataFromPositions,
    checkAndRestoreStrategies
  };
};
