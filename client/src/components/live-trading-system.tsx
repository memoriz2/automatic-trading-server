import { getErrorMessage } from '@/utils/error-utils';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ForceEntryModal } from '@/components/trading/ForceEntryModal';
import { LivePositionList } from '@/components/trading/LivePositionList';
import { LiveTradeHistory } from '@/components/trading/LiveTradeHistory';
import { LiveBalanceDisplay } from '@/components/trading/LiveBalanceDisplay';
import { useRealTimeBalances } from '@/hooks/useRealTimeBalances';
import { logClientTradingMode } from '@/config/trading-config';
import { formatKoreanTime } from '@/utils/datetime';
import { calculatePositionPnL } from '@/utils/pnl-calculator';
import { TRADING_CONSTANTS } from '@/constants/trading-constants';
import { saveLiveTradeToDB, apiFetch } from '@/utils/trading-api';
// import {
//   isValidPriceData,
//   checkEntryCondition,
//   checkExitCondition,
//   checkCooldown,
//   calculateTradingAmounts,
//   logEntryConditions
// } from '@/utils/trading-logic';
import { LiveBalance, LiveTrade, LivePosition, KimchiData, Strategy } from '@/types/trading';




interface LiveTradingSystemProps {
  strategies: Strategy[];
  setStrategies?: (strategies: Strategy[]) => void;
  currentKimchiData: KimchiData | null;
  userId?: string;
  onDailyStatsUpdate?: (stats: any) => void;
  isLiveMode?: boolean;
  liveBalances?: any;
  onStrategyStatsUpdate?: (stats: Record<string, { executionCount: number; realizedPnlKRW: number; investedKRW: number; profitRate: number; }>) => void;
  isLoadingStrategies?: boolean;
  strategiesError?: string | null;
}

export const LiveTradingSystem: React.FC<LiveTradingSystemProps> = ({
  strategies,
  setStrategies,
  currentKimchiData,
  userId = "1", // 기본 사용자 ID
  onDailyStatsUpdate,
  isLiveMode = true, // 기본값은 실거래 모드
  liveBalances, // 실제 잔고 데이터
  onStrategyStatsUpdate
}) => {
  const { toast } = useToast();

  // 실시간 잔고 동기화 (실거래 모드에서만 사용)
  const {
    balances: realtimeBalances,
    isLoading: balanceLoading,
    forceRefresh: refreshRealTimeBalances,
    setLoading: setBalanceLoading
  } = useRealTimeBalances(
    isLiveMode ? parseInt(userId) : undefined
  );
  
  // 거래 모드 (prop으로 명확하게 결정됨)
  const actualTradingMode = isLiveMode ? 'real' : 'mock';
  
  // 컴포넌트 초기화 시 거래 모드 로그
  useEffect(() => {
    logClientTradingMode();
    // LiveTradingSystem 모드 초기화
  }, []);

  // 실거래 모드에서는 liveBalances를 직접 사용 (변환 불필요)

  // 전략-포지션 불일치 감지 및 자동 복원은 livePositions 선언 후로 이동
  
  // 숫자 부드러운 변경용 유틸
  const animateNumber = useCallback((from: number, to: number, setter: (v: number) => void, durationMs: number = 300) => {
    if (!isFinite(from) || !isFinite(to)) {
      setter(to || 0);
      return;
    }
    const start = performance.now();
    const delta = to - from;
    let rafId = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
      setter(from + delta * eased);
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  // 유니크한 거래 ID 생성을 위한 카운터
  const [tradeCounter, setTradeCounter] = useState(0);
  
  // 강제진입 모달 상태
  const [showForceEntryModal, setShowForceEntryModal] = useState(false);
  const [tradeRefreshTrigger, setTradeRefreshTrigger] = useState(0); // DB 거래 기록 새로고침 트리거
  
  // 토글 방지용: 최소 보유시간
  // const EXIT_EXTRA = 0.2;     // 청산은 허용오차보다 0.2% 더 엄격 (사용하지 않음)
  const lastActionAtRef = useRef<Record<string, number>>({});
  const prevPremiumRef = useRef<number | null>(null); // 임계값 교차 감지용 이전 김프
  // 원자적 거래 처리: 거래 잠금 시스템
  const tradingLockRef = useRef<Record<number, boolean>>({}); // 전략별 거래 잠금
  const processingEntryRef = useRef<Set<string>>(new Set());
  // 재진입 차단 토스트 중복 억제
  const lastReentryToastAtRef = useRef<number>(0);

  // 컴포넌트 마운트 시 처리 상태 초기화
  useEffect(() => {
    processingEntryRef.current.clear();
    Object.keys(tradingLockRef.current).forEach(key => {
      tradingLockRef.current[parseInt(key)] = false;
    });
  }, []);

  // 거래 잔고 (실거래: 실제 잔고 사용)
  const [liveBalance, setLiveBalance] = useState<LiveBalance>(() => {
    return {
      krw: 0, // 실제 잔고는 liveBalances에서 가져옴
      btc: 0,
      usdt: 0,
      binanceBtc: 0,
      binanceSpotBtc: 0,
      binanceUsdt: 0
    };
  });

  // Live 거래 기록 (실거래: DB에서 조회)
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);

  // liveTrades 상태 변화 추적
  React.useEffect(() => {
    // const debugInfo = {
    //   count: liveTrades.length,
    //   trades: liveTrades.map(t => ({ id: t.id, type: t.type, exchange: t.exchange })),
    //   timestamp: new Date().toISOString(),
    //   stack: new Error().stack?.split('\n').slice(1, 3) // 호출 스택 추적
    // };
    
    // 콘솔과 localStorage 둘 다에 저장
    // liveTrades 상태 변경 (로그 제거)
  }, [liveTrades]);

  // Live 포지션 (DB에서만 조회 - 로컬스토리지 완전 제거)
  const [livePositions, setLivePositions] = useState<LivePosition[]>([]);
  
  // 🔒 DB 포지션 주기적 동기화 (3초마다 - 절대 로컬 메모리만 사용 금지!)
  useEffect(() => {
    if (!userId) return;

    const fetchDbPositions = async () => {
      try {
        const response = await fetch('/api/positions', {
          credentials: 'include'
        });

        if (response.ok) {
          const dbPositions = await response.json();
          // DB 포지션 조회 완료

          // DB 포지션을 LivePosition 형태로 변환
          const convertedPositions: LivePosition[] = dbPositions.map((pos: any) => {
              // 포지션 변환 처리
              return {
                id: `db-${pos.id}`,
                strategyId: pos.strategy_id,
                strategyName: pos.strategy_name || `전략 #${pos.strategy_id}`,
                symbol: pos.symbol,
              entryTime: new Date(pos.entry_time),
              exitTime: pos.exit_time ? new Date(pos.exit_time) : undefined,
              entryPremiumRate: pos.entry_premium_rate || 0,
              upbitQuantity: pos.quantity || 0,
              upbitPrice: pos.entry_price || 0,
              entryUsdKrw: 1394, // 기본값 (표시 계산 시 최신값으로 보정됨)
              binanceSpotQuantity: 0,
              binanceQuantity: pos.quantity || 0,
              // 바이낸스 진입가격: 전용 필드가 있으면 우선 사용, 없으면 보조 필드 → 최후엔 entry_price
              binancePrice: (
                pos.binance_entry_price ??
                pos.binance_price_usd ??
                pos.binance_current_price ??
                pos.entry_price
              ) || 0,
              // 레버리지 기본값 보정 (실거래 일반값 3~10배)
              leverage: pos.binance_leverage || 10,
              status: pos.status === 'open' ? 'open' : 'closed',
              unrealizedPnl: pos.unrealized_pnl || 0,
              realizedPnl: pos.realized_pnl || 0,
              upbitOrderId: pos.upbit_order_id,
              binanceOrderId: pos.binance_order_id,
              isRealTrade: true
              };
            });
            
            setLivePositions(convertedPositions);
            // DB 포지션 변환 완료
          }
        } catch (error) {
          console.error('❌ DB 포지션 조회 실패:', error);
        }
      };
      
    // 초기 조회
    fetchDbPositions();

    // 3초마다 DB 포지션 동기화 (더 빠른 동기화)
    const interval = setInterval(fetchDbPositions, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  // 잔고-포지션 일관성 검증 및 자동 수정
  useEffect(() => {
    if (livePositions.length > 0) {
      const openPositions = livePositions.filter(p => p.status === 'open');
      
      if (openPositions.length > 0) {
        // 활성 포지션의 총 BTC 수량 계산
        const totalUpbitBtc = openPositions.reduce((sum, p) => sum + (p.upbitQuantity || 0), 0);
        const totalBinanceBtc = openPositions.reduce((sum, p) => sum + (p.binanceQuantity || 0), 0);
        
        // 잔고 검증
        const currentUpbitBtc = liveBalance.btc || 0;
        const currentBinanceBtc = liveBalance.binanceBtc || 0;
        
        // BTC 잔고가 활성 포지션과 다르면 수정 (정확히 일치시킴)
        if (Math.abs(totalUpbitBtc - currentUpbitBtc) > 0.000001) {
          console.warn('🚨 업비트 BTC 잔고 불일치 감지:', {
            활성포지션BTC: totalUpbitBtc,
            현재잔고BTC: currentUpbitBtc,
            차이: totalUpbitBtc - currentUpbitBtc,
            수정필요: true
          });
          
          setLiveBalance(prev => ({
            ...prev,
            btc: totalUpbitBtc // 활성 포지션과 정확히 일치시킴
          }));
        }

        // 활성 포지션이 있는데 해당 전략이 없으면 복원
        if (setStrategies) {
          const positionStrategyIds = Array.from(new Set(openPositions.map(p => p.strategyId)));
          const currentStrategyIds = strategies.map(s => s.id);
          const missingStrategyIds = positionStrategyIds.filter(id => !currentStrategyIds.includes(id));
          
          if (missingStrategyIds.length > 0) {
            console.warn('🚨 활성 포지션의 전략 누락 감지:', missingStrategyIds);
            
            // 백업에서 누락된 전략 찾기
            const restoredStrategies: any[] = [];
            
            missingStrategyIds.forEach(strategyId => {
              const position = openPositions.find(p => p.strategyId === strategyId);
              if (position) {
                // 백업에서 원래 전략 찾기
                let originalStrategy = null;
                try {
                  const backupKeys = Object.keys(localStorage)
                    .filter(key => key.startsWith(`strategy-backup-`) && key.endsWith(`-${userId}`))
                    .sort((a, b) => parseInt(b.split('-')[2]) - parseInt(a.split('-')[2]));
                  
                  for (const backupKey of backupKeys) {
                    const backup = JSON.parse(localStorage.getItem(backupKey) || '{}');
                    originalStrategy = backup.strategies?.find((s: any) => s.id === strategyId);
                    if (originalStrategy) break;
                  }
                } catch (error) {
                  console.warn('백업 검색 실패:', error);
                }
                
                if (originalStrategy) {
                  restoredStrategies.push({
                    ...originalStrategy,
                    isActive: true // 활성 포지션이 있으므로 활성화
                  });
                }
              }
            });
            
            if (restoredStrategies.length > 0) {
              const allStrategies = [...strategies, ...restoredStrategies];
              setStrategies(allStrategies);
              localStorage.setItem(`mock-strategies-${userId}`, JSON.stringify(allStrategies));
            }
          }
        }
        
        if (Math.abs(totalBinanceBtc - currentBinanceBtc) > 0.000001) {
          setLiveBalance(prev => ({
            ...prev,
            binanceBtc: totalBinanceBtc // 활성 포지션과 정확히 일치시킴
          }));
        }
      }
    }
  }, [livePositions, liveBalance.btc, liveBalance.binanceBtc]);

  // 전략-포지션 불일치 감지 및 자동 복원 (임시 비활성화)
  useEffect(() => {
    if (false && livePositions.length > 0 && setStrategies) { // 임시 비활성화
      // 포지션에 있는 전략 ID들
      const positionStrategyIds = Array.from(new Set(livePositions.map(pos => pos.strategyId)));
      // 현재 전략 ID들  
      const currentStrategyIds = strategies.map(s => s.id);
      
      // 누락된 전략 찾기
      const missingStrategyIds = positionStrategyIds.filter(id => !currentStrategyIds.includes(id));
      
      if (missingStrategyIds.length > 0) {
        // 누락된 전략들을 포지션에서 복원
        const restoredStrategies: any[] = [];
        
        missingStrategyIds.forEach(strategyId => {
          const position = livePositions.find(pos => pos.strategyId === strategyId);
          if (position) {
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
                  originalStrategy = backup.strategies?.find((s: any) => s.id === strategyId);
                  if (originalStrategy) {
                    break;
                  }
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
            
            restoredStrategies.push(restoredStrategy);
          }
        });
        
        if (restoredStrategies.length > 0) {
          const allStrategies = [...strategies, ...restoredStrategies];
          setStrategies?.(allStrategies);
          
          // 로컬스토리지에도 저장
          localStorage.setItem(`mock-strategies-${userId}`, JSON.stringify(allStrategies));

          toast({
            title: "🛡️ 전략 자동 복원",
            description: `${restoredStrategies.length}개 전략이 포지션에서 복원되었습니다!`,
            duration: 5000,
          });
        }
      }
    }
  }, [livePositions.length, strategies.length, setStrategies, userId, toast]);

  // 모의 거래 실행 중 상태
  const [isTrading, setIsTrading] = useState(false);
  const [lastToastMessage, setLastToastMessage] = useState('');
  const [tradingLogs, setTradingLogs] = useState<string[]>([]);
  const [lastKimchiData, setLastKimchiData] = useState<any>(null);
  // 전략별 통계 집계
  const strategyStatsRef = useRef<Record<string, { executionCount: number; realizedPnlKRW: number; investedKRW: number; profitRate: number; }>>({});

  // 서버 상태 동기화 제거: 클라이언트 상태가 단일 소스 (깜빡임 방지)
  // 필요 시 단발성 복원 로직만 남기고 주기 동기화는 비활성화

  // 서버 동기화 기능 제거됨: TradingState 테이블 및 관련 API 미사용

  // 서버에서 거래 데이터 가져오기
  const fetchTradingData = useCallback(async () => {
    try {
      // 거래 데이터 동기화 시작
      
      // 거래 기록 가져오기 (수신 시 숫자 필드 정규화)
      const tradesResponse = await apiFetch('/api/trades');
      if (tradesResponse && Array.isArray(tradesResponse)) {
        const normalizedTrades = tradesResponse.map((t: any) => {
          const parsedQuantity = typeof t.quantity === 'string' ? parseFloat(t.quantity) : (t.quantity ?? 0);
          const parsedPrice = typeof t.price === 'string' ? parseFloat(t.price) : (t.price ?? 0);
          const parsedFee = typeof t.fee === 'string' ? parseFloat(t.fee) : (t.fee ?? 0);
          const side = (t.type ?? t.side ?? '').toString().toLowerCase();
          const exchange = (t.exchange ?? '').toString().toLowerCase();
          const ts = t.timestamp || t.createdAt || t.executedAt || Date.now();
          return {
            ...t,
            quantity: parsedQuantity,
            price: parsedPrice,
            fee: parsedFee,
            type: side || 'unknown',
            exchange: exchange || 'unknown',
            symbol: (t.symbol ?? 'BTC').toString().toUpperCase(),
            timestamp: new Date(ts),
          };
        });
        // 거래 기록 로드
        setLiveTrades(normalizedTrades);
      }
      
      // 포지션 가져오기 (모의거래만): 클라이언트 단일 소스 유지 → 덮어쓰지 않음
      // const positionsResponse = await apiFetch(`/api/positions?isMock=true`);
      // if (positionsResponse && Array.isArray(positionsResponse)) {
      //   console.log('🎯 포지션(서버) 수신:', positionsResponse.length, '개 (UI 덮어쓰기 안함)');
      // }
      
    } catch (error) {
      console.error('❌ 거래 데이터 동기화 실패:', error);
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchTradingData();
    
    // 거래 기록 강제 동기화 함수
    const forceSyncTrades = () => {
      const tradeKey = `mock-trades-${userId}`;
      const savedTrades = localStorage.getItem(tradeKey);
      
      // forceSyncTrades 실행
      
      if (savedTrades && savedTrades !== '[]' && savedTrades !== 'null') {
        try {
          const parsed = JSON.parse(savedTrades);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // 거래 기록 강제 동기화
            setLiveTrades(parsed);
            return true;
          }
        } catch (error) {
          console.error('❌ 거래 기록 동기화 실패:', error);
        }
      }
      return false;
    };
    
    // 강제 업데이트 이벤트 리스너
    const handleForceUpdate = (event: any) => {
      if (event.detail && Array.isArray(event.detail)) {
        setLiveTrades(event.detail);
      }
    };
    
    window.addEventListener('forceMockTradesUpdate', handleForceUpdate);
    
    // 즉시 동기화 시도
    forceSyncTrades();
    
    // 1초 후 한번 더 시도 (컴포넌트 완전 로드 후)
    const syncTimeout = setTimeout(() => {
      // 1초 후 재동기화 시도
      if (liveTrades.length === 0) {
        forceSyncTrades();
      }
    }, 1000);
    
    // 5초 후 마지막 시도
    const finalSyncTimeout = setTimeout(() => {
      // 5초 후 최종 동기화 시도
      if (liveTrades.length === 0) {
        forceSyncTrades();
      }
    }, 5000);
    
    // 30초마다 주기적 동기화
    const interval = setInterval(() => {
      fetchTradingData();
      if (liveTrades.length === 0) {
        forceSyncTrades();
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('forceMockTradesUpdate', handleForceUpdate);
      clearTimeout(syncTimeout);
      clearTimeout(finalSyncTimeout);
      clearInterval(interval);
    };
  }, [fetchTradingData, userId]);

  // 로컬스토리지에 저장 (전체 삭제 - Mock 모드 없음)
  // useEffect(() => {
  //   const storageKey = `live-balance-${userId}`;
  //   localStorage.setItem(storageKey, JSON.stringify(liveBalance));
  // }, [liveBalance, userId]);

  // useEffect(() => {
  //   const storageKey = `mock-trades-${userId}`;
  //   // 거래 기록 로컬스토리지 저장
  //
  //   // 빈 배열로 덮어쓰는 것을 방지 (기존 데이터가 있는 경우)
  //   const existing = localStorage.getItem(storageKey);
  //   if (liveTrades.length === 0 && existing && existing !== '[]' && existing !== 'null') {
  //     // 빈 배열로 덮어쓰기 방지
  //
  //     // 기존 데이터를 다시 로드하여 상태와 동기화
  //     try {
  //       const existingParsed = JSON.parse(existing);
  //       if (Array.isArray(existingParsed) && existingParsed.length > 0) {
  //         // 덮어쓰기 방지 중 자동 복원
  //         setLiveTrades(existingParsed);
  //       }
  //     } catch (error) {
  //       console.error('❌ 덮어쓰기 방지 중 복원 실패:', error);
  //     }
  //     return;
  //   }
  //
  //   localStorage.setItem(storageKey, JSON.stringify(liveTrades));
  // }, [liveTrades, userId]);

  // useEffect(() => {
  //   const storageKey = `live-positions-${userId}`;
  //   localStorage.setItem(storageKey, JSON.stringify(livePositions));
  // }, [livePositions, userId]);

  // 거래 로그 추가 함수
  const addTradingLog = useCallback((message: string) => {
    const timestamp = formatKoreanTime();
    const logMessage = `[${timestamp}] ${message}`;
    setTradingLogs(prev => [...prev.slice(-9), logMessage]); // 최근 10개만 유지
  }, []);


  // Live 진입 (원자적 처리)
  const liveEntry = useCallback(async (strategy: any, premiumRate: number) => {
    const strategyId = String(strategy.id);

    // 거래 잠금 확인 (전략별 체크만)
    if (tradingLockRef.current[strategy.id]) {
      return;
    }

    // 거래 잠금 먼저 설정 (동기적) - 전략별 잠금
    tradingLockRef.current[strategy.id] = true;
    setIsTrading(true); // 이후 비동기 상태 업데이트

    try {
      if (!currentKimchiData) {
        console.error('❌ currentKimchiData is null in liveEntry');
        return; // finally에서 lock 해제
      }

      // 🔒 DB에서 활성 포지션 중복 체크 (동일 전략+심볼)
      const dbCheckResponse = await fetch(`/api/positions/check-active?strategyId=${strategy.id}&symbol=BTC`, {
        credentials: 'include'
      });
      if (dbCheckResponse.ok) {
        const { hasActivePosition } = await dbCheckResponse.json();
        if (hasActivePosition) {
          console.warn(`🚫 [${strategy.name}] DB에 이미 활성 포지션 존재 - 진입 취소`);
          return;
        }
      }

      const baseAmount = parseFloat(strategy.investmentAmount); // 기준 BTC 수량
      const leverage = parseInt(strategy.leverage);
      const upbitPrice = currentKimchiData?.upbit_price || 156000000;
      const binancePrice = currentKimchiData?.binance_price || 112000;
      const entryUsdKrw = currentKimchiData?.usdkrw || 1390;

      // 1단계: 바이낸스 선물 숏 포지션 먼저 결정 (기준 수량)
      const binanceShortAmountBTC = baseAmount; // 바이낸스 BTC 숏 수량 (기준)
      const binanceShortValueUSD = binanceShortAmountBTC * binancePrice; // USD 가치
      const binanceMargin = binanceShortValueUSD / leverage; // 필요 증거금 (USDT)
      const binanceFee = binanceShortValueUSD * 0.0004; // 바이낸스 진입 수수료 (0.04%)

      // 2단계: 바이낸스 숏 수량에 맞춰 업비트에서 동일한 BTC 수량 매수
      const upbitBuyAmountBTC = binanceShortAmountBTC; // 바이낸스와 동일한 BTC 수량
      const upbitBuyAmountKRW = upbitBuyAmountBTC * upbitPrice; // 업비트 매수 금액 (KRW)
      const upbitFee = upbitBuyAmountKRW * 0.0005; // 업비트 매수 수수료 (0.05%)
      const totalUpbitCost = upbitBuyAmountKRW + upbitFee; // 총 업비트 비용

      // 거래 기록 추가
      const currentCounter = tradeCounter + 1;
      setTradeCounter(currentCounter);
      const randomId = Math.random().toString(36).substring(2, 8);
      const tradeId = `trade-${Date.now()}-${currentCounter}-${randomId}`;

      // 🚀 실거래 모드: 실제 거래소 API 호출
      let upbitOrderId = `${isLiveMode ? 'live' : 'mock'}-upbit-${tradeId}`;
      let binanceOrderId = `${isLiveMode ? 'live' : 'mock'}-binance-${tradeId}`;
      
      if (isLiveMode) {
        try {
          // 실거래 모드 - 실제 거래소 주문 실행 시작

          // 1. 바이낸스 BTC 숏 주문 (먼저 실행 - 중요!)
          const binanceOrderResponse = await fetch('/api/trading/binance/short', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              symbol: 'BTCUSDT',
              quantity: binanceShortAmountBTC,
              leverage: leverage,
              strategyId: strategy?.id // 전략 ID 추가
            })
          });
          
          if (!binanceOrderResponse.ok) {
            const binanceErrorData = await binanceOrderResponse.json().catch(() => ({ error: '알 수 없는 오류' }));
            
            // 재진입 차단인 경우 상세 정보 포함
            if (binanceOrderResponse.status === 409 && binanceErrorData.existingPosition) {
              const pos = binanceErrorData.existingPosition;
              const entryTime = new Date(pos.entryTime).toLocaleString('ko-KR');
              
              throw new Error(`재진입 차단: 포지션 ID ${pos.id} (진입: ${entryTime}, 수량: ${pos.remainingQuantity} BTC)`);
            } else {
              throw new Error(`바이낸스 숏 주문 실패: ${binanceErrorData.error || '알 수 없는 오류'}`);
            }
          }
          
          const binanceResult = await binanceOrderResponse.json();
          binanceOrderId = binanceResult.orderId || binanceResult.uuid || binanceOrderId;

          // 2. 바이낸스 성공 후 업비트 BTC 매수 주문
          const upbitOrderResponse = await fetch('/api/trading/upbit/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              market: 'KRW-BTC',
              volume: upbitBuyAmountBTC,
              price: Math.round(upbitBuyAmountBTC * (currentKimchiData?.upbit_price || 160000000)), // BTC 수량을 원화로 변환
              ord_type: 'market',
              strategyId: strategy?.id // 전략 ID 추가
            })
          });
          
          if (!upbitOrderResponse.ok) {
            // 업비트 실패 시 바이낸스 주문 취소 필요 (향후 구현)
            const upbitError = await upbitOrderResponse.text();
            console.error('❌ 업비트 매수 실패, 바이낸스 주문 취소 필요:', upbitError);
            throw new Error(`업비트 매수 주문 실패: ${upbitError}`);
          }
          
          const upbitResult = await upbitOrderResponse.json();
          upbitOrderId = upbitResult.uuid || upbitResult.orderId || upbitOrderId;

          // 🔄 거래 완료 후 즉시 잔고 새로고침
          setTimeout(async () => {
            try {
              // 로딩 상태 시작 (스피너 표시)
              setBalanceLoading && setBalanceLoading(true);

              // 병렬로 잔고 새로고침 실행
              await Promise.all([
                fetch('/api/v2/balance/refresh', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ forceRefresh: true })
                }),
                // 실시간 잔고 즉시 새로고침
                refreshRealTimeBalances && refreshRealTimeBalances()
              ]);

              // DB 거래 기록도 새로고침
              setTradeRefreshTrigger(prev => prev + 1);
            } catch (refreshError) {
              console.error('❌ 잔고 새로고침 실패:', refreshError);
            } finally {
              // 로딩 상태 종료 (1.5초 후 - 사용자가 볼 수 있도록)
              setTimeout(() => {
                setBalanceLoading && setBalanceLoading(false);
              }, 1500);
            }
          }, 500); // 0.5초 후 새로고침 (더 빠르게)
          
        } catch (realTradingError) {
          const msg = (realTradingError as any)?.message || '';
          const isReentryBlock = msg.includes('재진입 차단') || msg.includes('OPEN 포지션') || msg.includes('이미');
          // 재진입 차단/반복 주문 실패 토스트 억제
          if (isReentryBlock) {
            const now = Date.now();
            if (now - lastReentryToastAtRef.current < TRADING_CONSTANTS.REENTRY_TOAST_INTERVAL_MS || lastToastMessage === 'reentry-block') {
              // 로그/토스트 모두 생략
              return;
            }
            lastReentryToastAtRef.current = now;
            setLastToastMessage('reentry-block');
            console.warn('🔒 재진입 차단: 동일 오류 토스트 억제 중');
            toast({ title: '🔒 재진입 차단', description: '기존 포지션이 활성 상태입니다.', variant: 'default' });
          } else {
            console.error('❌ 실거래 주문 실패:', realTradingError);
            if (lastToastMessage !== msg) {
              setLastToastMessage(msg);
              toast({
                title: "실거래 주문 실패",
                description: `거래소 주문 중 오류: ${msg}`,
                variant: "destructive"
              });
            }
          }
          return; // 실거래 실패 시 포지션 생성 중단
        }
      }

      // 잔고 확인
      const availableKrw = isLiveMode ? (liveBalances?.real?.krw || 0) : liveBalance.krw;
      if (availableKrw < totalUpbitCost) {
        const errorMsg = `KRW 부족: 필요 ₩${totalUpbitCost.toLocaleString()}, 보유 ₩${availableKrw.toLocaleString()}`;
        if (lastToastMessage !== errorMsg) {
          setLastToastMessage(errorMsg);
          toast({
            title: "💸 원화 부족!",
            description: `🏦 ${errorMsg} → ${isLiveMode ? '실제 잔고를' : '더 많은 자금이'} 확인해주세요!`,
            variant: "destructive"
          });
        }
        return;
      }

      const availableUsdt = isLiveMode ? (liveBalances?.real?.usdt || 0) : liveBalance.usdt;
      if (availableUsdt < binanceMargin + binanceFee) {
        const errorMsg = `증거금 부족: 필요 $${(binanceMargin + binanceFee).toFixed(2)}, 보유 $${availableUsdt.toLocaleString()}`;
        if (lastToastMessage !== errorMsg) {
          setLastToastMessage(errorMsg);
          toast({
            title: "💵 USDT 증거금 부족!", 
            description: `⚠️ ${errorMsg} → ${isLiveMode ? '실제 바이낸스' : '바이낸스'} 잔고를 확인해주세요!`,
            variant: "destructive"
          });
        }
        return;
      }

      // 잔고 변경 (실거래는 실제 잔고 사용)
      if (!isLiveMode) {
        setLiveBalance(prev => {
        const newBalance = {
          ...prev,
          krw: Math.max(0, prev.krw - totalUpbitCost), // 음수 방지
          btc: Math.max(0, (prev.btc || 0) + upbitBuyAmountBTC), // 음수 방지
          usdt: Math.max(0, prev.usdt - binanceMargin - binanceFee), // 음수 방지
          binanceUsdt: Math.max(0, (prev.binanceUsdt || 0) - binanceMargin - binanceFee), // 음수 방지
          // 선물 숏 진입 시 숏 포지션 수량 증가 (양수)
          binanceBtc: Math.max(0, (prev.binanceBtc || 0) + binanceShortAmountBTC)
        };

        return newBalance;
        });
      }

      // 거래 기록 생성
      const tradeTimestamp = new Date(); // 거래 시점 고정
      const newTrades: LiveTrade[] = [
        {
          id: `${tradeId}-binance`,
          timestamp: tradeTimestamp,
          type: 'short', // SHORT 포지션 진입
          symbol: 'BTC',
          quantity: binanceShortAmountBTC,
          price: binancePrice,
          fee: binanceFee,
          exchange: 'binance',
          strategyId: strategy.id,
          strategyName: strategy.name,
          premiumRate
        },
        {
          id: `${tradeId}-upbit`,
          timestamp: tradeTimestamp, // 동일한 거래 시점 사용
          type: 'buy',
          symbol: 'BTC',
          quantity: upbitBuyAmountBTC,
          price: upbitPrice,
          fee: upbitFee,
          exchange: 'upbit',
          strategyId: strategy.id,
          strategyName: strategy.name,
          premiumRate
        }
      ];

      setLiveTrades(prev => [...prev, ...newTrades]);
      
      // 거래 기록 저장
      newTrades.forEach(trade => {
        saveLiveTradeToDB(trade, userId);
      });

      // 포지션은 DB에서만 관리 (로컬 상태 추가 제거)
      // DB에 저장된 포지션은 3초마다 자동 동기화됨
      
      // 전략별 집계: 실행 횟수 + 총 투자원금 합산 (업비트 + 바이낸스)
      const upbitInvestedKRW = upbitBuyAmountBTC * upbitPrice;
      const binanceInvestedKRW = ((binanceShortAmountBTC * binancePrice) / leverage) * entryUsdKrw;
      const totalInvestedKRW = upbitInvestedKRW + binanceInvestedKRW;
      
      const cur = strategyStatsRef.current[strategy.id] || { executionCount: 0, realizedPnlKRW: 0, investedKRW: 0, profitRate: 0 };
      const updated = { 
        executionCount: cur.executionCount + 1,
        realizedPnlKRW: cur.realizedPnlKRW,
        investedKRW: cur.investedKRW + totalInvestedKRW,
        profitRate: cur.investedKRW + totalInvestedKRW > 0 ? (cur.realizedPnlKRW / (cur.investedKRW + totalInvestedKRW)) * 100 : 0
      };
      strategyStatsRef.current[strategy.id] = updated;
      onStrategyStatsUpdate?.({ ...strategyStatsRef.current });

      addTradingLog(`✅ ${strategy.name} 진입 완료! 김프 ${premiumRate.toFixed(3)}%`);
      
      toast({
        title: "🚀 진입 신호 포착!",
        description: `🎯 ${strategy.name} 전략 → 김프율 ${premiumRate.toFixed(3)}%에서 완벽 진입! 💎`,
      });

    } catch (error: unknown) {
      console.error(`❌ ${isLiveMode ? '실거래' : '모의'} 진입 실패:`, error);
      
      // 재진입 차단 에러인 경우 활성 포지션 정보 표시
      const errorMsg = getErrorMessage(error);
      if (errorMsg?.includes('재진입 차단') || errorMsg?.includes('이미') || errorMsg?.includes('OPEN 포지션')) {
        // 중복 토스트 방지: 최근 N초 내에 동일 유형 토스트가 있었다면 표시 생략
        const now = Date.now();
        if (now - lastReentryToastAtRef.current < TRADING_CONSTANTS.REENTRY_TOAST_INTERVAL_MS || lastToastMessage === 'reentry-block') {
          // 메시지 상태만 업데이트하고 토스트는 생략
          setLastToastMessage('reentry-block');
          return;
        }
        lastReentryToastAtRef.current = now;
        setLastToastMessage('reentry-block');
        // 활성 포지션 정보 조회
        const activePosition = livePositions.find(p => p.status === 'open' && p.symbol === 'BTC');
        
        let description = '🚫 이미 활성 포지션이 있어 새로운 진입이 차단되었습니다.';
        
        if (activePosition) {
          const entryTime = new Date(activePosition.entryTime).toLocaleTimeString('ko-KR');
          const currentPnl = activePosition.unrealizedPnl || 0;
          const pnlColor = currentPnl >= 0 ? '🟢' : '🔴';
          
          description += `\n\n📍 활성 포지션:\n`;
          description += `🎯 전략: ${activePosition.strategyName}\n`;
          description += `⏰ 진입: ${entryTime}\n`;
          description += `📊 김프율: ${activePosition.entryPremiumRate?.toFixed(3)}%\n`;
          description += `${pnlColor} 수익: ${currentPnl >= 0 ? '+' : ''}${currentPnl.toFixed(2)}원`;
        }
        
        toast({
          title: "🔒 재진입 차단",
          description,
          variant: "default"
        });
      } else {
        // 일반 에러
        toast({
          title: `${isLiveMode ? '실거래' : '모의'} 진입 실패`,
          description: getErrorMessage(error),
          variant: "destructive"
        });
      }
    } finally {
      tradingLockRef.current[strategy.id] = false; // 전략별 거래 잠금 해제
      processingEntryRef.current.delete(strategyId); // 처리 상태 해제 (중요!)
      setIsTrading(false);
    }
  }, [
    currentKimchiData, 
    liveBalance, 
    isLiveMode, 
    userId, 
    toast, 
    tradeCounter,
    liveTrades,
    livePositions,
    addTradingLog,
    onStrategyStatsUpdate,
    lastToastMessage,
  ]);

  // 강제진입 처리 함수 (DB 우선 저장)
  const handleForceEntry = useCallback(async (forceSettings: { margin: string; leverage: string; investmentAmount: string }) => {
    const currentKimp = currentKimchiData?.kimp || 0;

    try {
      // 1. 먼저 DB에 포지션 저장하여 실제 ID 받기
      const response = await fetch('/api/force-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          margin: forceSettings.margin,
          leverage: forceSettings.leverage,
          investmentAmount: forceSettings.investmentAmount,
          currentKimp: currentKimp,
          symbol: 'BTC'
        })
      });
      
      if (!response.ok) {
        throw new Error('강제진입 API 호출 실패');
      }
      
      const result = await response.json();
      const dbPositionId = result.position.id;
      const strategyName = result.strategyName; // "강제진입207" 형식

      // 2. DB ID를 사용한 강제진입 전략 생성
      const forceStrategy = {
        id: `force-entry-${dbPositionId}`,
        name: strategyName, // "강제진입207" 형식
        entryCondition: String(currentKimp),
        takeProfitCondition: String(Math.max(0.1, currentKimp + 0.5)),
        tolerance: '0.001',
        investmentAmount: forceSettings.investmentAmount,
        leverage: forceSettings.leverage,
        isActive: true
      };
      
      // 3. 실제 거래 진입 (DB ID 포함)
      liveEntry(forceStrategy, currentKimp);
      
      toast({
        title: '🧪 강제진입 완료',
        description: `${strategyName} 포지션이 생성되었습니다.`,
      });
      
    } catch (error) {
      console.error('❌ 강제진입 실패:', error);
      toast({
        title: '강제진입 실패',
        description: '강제진입 실행 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    }
  }, [currentKimchiData, liveEntry, toast]);

  // 모의 청산 (원자적 처리)
  const liveExit = useCallback(async (position: LivePosition, premiumRate: number, ratio: number = 1.0) => {
    // 청산은 긴급 작업이므로 기존 잠금 무시하고 강제 실행
    // 즉시 새로운 잠금 설정 (원자적 작업)
    tradingLockRef.current[Number(position.strategyId)] = true;
    setIsTrading(true);

    // 청산 시작 시 잔고 로딩 스피너 활성화
    setBalanceLoading?.(true);

    try {
      if (!currentKimchiData) {
        console.error('❌ currentKimchiData is null in liveExit');
        return; // finally에서 lock 해제
      }

      // 실거래 모드에서는 실제 API 호출
      if (actualTradingMode === 'real') {
        try {
          const liquidationResults = [];

          // 1. 실시간 거래소 잔고 조회 (업비트 + 바이낸스)
          let actualUpbitBalance = 0;
          let actualBinanceBalance = 0;
          try {
            // 실시간 거래소 잔고 조회
            const balanceResponse = await fetch('/api/realtime-balances', {
              method: 'GET',
              credentials: 'include'
            });

            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();

              // upbitBtc 필드에서 BTC 잔고 추출
              actualUpbitBalance = parseFloat(balanceData.upbitBtc || '0');
              // binanceBtc 필드에서 BTC 포지션 추출 (숏은 음수)
              actualBinanceBalance = Math.abs(parseFloat(balanceData.binanceBtc || '0'));
            } else {
              console.error('❌ 잔고 조회 실패');
            }
          } catch (error) {
            console.error('❌ 실시간 잔고 조회 오류:', error);
          }

          // 잔고가 모두 0이면 청산 불필요
          if (actualUpbitBalance <= 0 && actualBinanceBalance <= 0) {
            toast({
              title: "청산 완료",
              description: `전략 #${position.strategyId}는 이미 청산되었습니다.`,
            });
            return;
          }

          // 2. 업비트 매도 (잔고가 있는 경우만)
          const UPBIT_MIN_BTC_UNIT = 0.00008;
          const finalSellQuantity = actualUpbitBalance * ratio;

          if (finalSellQuantity >= UPBIT_MIN_BTC_UNIT) {
            try {

              const upbitSellResponse = await fetch('/api/trading/upbit/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  market: `KRW-${position.symbol}`,
                  volume: finalSellQuantity,
                  ord_type: 'market'
                })
              });
              
              if (upbitSellResponse.ok) {
                const upbitResult = await upbitSellResponse.json();

                // 실제 매도된 수량 확인
                parseFloat(upbitResult.executed_volume || upbitResult.volume || '0');

                // 매도 후 잔고 재확인 (남은 수량 추적)
                setTimeout(async () => {
                  try {
                    const afterSellBalance = await fetch('/api/trading/upbit/balance', {
                      method: 'GET',
                      credentials: 'include'
                    });
                    if (afterSellBalance.ok) {
                      const afterBalanceData = await afterSellBalance.json();
                      const afterBtcBalance = afterBalanceData.find((b: any) => b.currency === position.symbol);
                      parseFloat(afterBtcBalance?.balance || '0');
                    }
                  } catch (error) {
                    console.warn('⚠️ 매도 후 잔고 재확인 실패:', error);
                  }
                }, 2000); // 2초 후 확인

                liquidationResults.push({ type: 'upbit_sell', result: upbitResult });
              } else {
                const errorText = await upbitSellResponse.text();
                console.error(`❌ 업비트 개별 매도 실패:`, errorText);
                
                // 잔고 부족 오류 = 이미 청산된 것으로 간주
                if (errorText.includes('insufficient_funds_ask') || errorText.includes('주문 가능한 금액')) {
                  liquidationResults.push({ type: 'upbit_already_closed', result: 'already_liquidated' });
                } else {
                  liquidationResults.push({ type: 'upbit_error', error: errorText });
                }
              }
            } catch (upbitError: any) {
              console.error(`❌ 업비트 매도 오류:`, upbitError);
              liquidationResults.push({ type: 'upbit_error', error: upbitError.message });
            }
          } else {
            liquidationResults.push({ type: 'upbit_skip', reason: 'below_minimum_trade_unit', quantity: finalSellQuantity });
          }

          // 3. 바이낸스 선물 청산 (실제 잔고 기준)
          const finalBinanceQuantity = actualBinanceBalance * ratio;

          if (finalBinanceQuantity > 0.00001) {
            try {

              const binanceCloseResponse = await fetch('/api/trading/binance/close-short', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  symbol: `${position.symbol}USDT`,
                  quantity: finalBinanceQuantity
                })
              });
              
              if (binanceCloseResponse.ok) {
                const binanceResult = await binanceCloseResponse.json();
                liquidationResults.push({ type: 'binance_close', result: binanceResult });
              } else {
                const errorText = await binanceCloseResponse.text();
                console.error(`❌ 바이낸스 개별 청산 실패:`, errorText);
                
                // ReduceOnly 오류 = 이미 청산된 것으로 간주
                if (errorText.includes('ReduceOnly Order is rejected') || errorText.includes('-2022')) {
                  liquidationResults.push({ type: 'binance_already_closed', result: 'already_liquidated' });
                } else {
                  liquidationResults.push({ type: 'binance_error', error: errorText });
                }
              }
            } catch (binanceError: any) {
              console.error(`❌ 바이낸스 청산 오류:`, binanceError);
              liquidationResults.push({ type: 'binance_error', error: binanceError.message });
            }
          }

          // 성공한 청산이나 이미 청산된 경우 UI 업데이트
          if (liquidationResults.some(r =>
            r.type === 'upbit_sell' || r.type === 'binance_close' ||
            r.type === 'upbit_already_closed' || r.type === 'binance_already_closed'
          )) {
            // 실시간 잔고 갱신
            await refreshRealTimeBalances?.();

            // 부분 청산인 경우 수량 조정, 전체 청산인 경우 상태 변경
            if (ratio < 1.0) {
              // 부분 청산: 실제 남은 잔고 기준으로 수량 조정
              const remainingUpbit = actualUpbitBalance * (1 - ratio);
              const remainingBinance = actualBinanceBalance * (1 - ratio);

              // 부분 청산 손익 계산
              const pnlResult = calculatePositionPnL(position, currentKimchiData);
              const partialPnl = pnlResult.netPnl * ratio;

              console.log(`💰 부분 청산 손익 계산 (${Math.round(ratio * 100)}%):`, {
                positionId: position.id,
                partialPnl: partialPnl,
                totalPnl: pnlResult.netPnl
              });

              setLivePositions(prev =>
                prev.map(p =>
                  p.id === position.id
                    ? {
                        ...p,
                        upbitQuantity: remainingUpbit,
                        binanceQuantity: remainingBinance,
                        realizedPnl: (p.realizedPnl || 0) + partialPnl
                      }
                    : p
                )
              );

              // DB 업데이트
              try {
                await fetch(`/api/positions/${position.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    upbitQuantity: remainingUpbit,
                    binanceQuantity: remainingBinance,
                    realizedPnl: (position.realizedPnl || 0) + partialPnl
                  })
                });
                console.log(`✅ 포지션 ${position.id} 부분 청산 DB 업데이트 완료 (손익: ${partialPnl.toFixed(2)}원)`);
              } catch (dbError) {
                console.error('❌ 부분 청산 DB 업데이트 실패:', dbError);
              }

              toast({
                title: `${Math.round(ratio * 100)}% 청산 완료`,
                description: `전략 #${position.strategyId}의 일부가 실제로 청산되었습니다. 손익: ${partialPnl >= 0 ? '+' : ''}${Math.round(partialPnl).toLocaleString()}원`,
              });
            } else {
              // 전체 청산: 상태 변경 및 정확한 손익 계산
              const exitTime = new Date();

              // PnL 계산기를 사용하여 정확한 손익 계산
              const pnlResult = calculatePositionPnL(position, currentKimchiData);
              const realizedPnl = pnlResult.netPnl;

              console.log(`💰 청산 손익 계산:`, {
                positionId: position.id,
                netPnl: realizedPnl,
                premiumPnl: pnlResult.premiumPnl,
                estimatedExitFees: pnlResult.estimatedExitFees
              });

              setLivePositions(prev =>
                prev.map(p =>
                  p.id === position.id
                    ? {
                        ...p,
                        status: 'closed' as const,
                        exitTime: exitTime,
                        realizedPnl: realizedPnl
                      }
                    : p
                )
              );

              // DB에 청산 정보 저장
              try {
                await fetch(`/api/positions/${position.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    status: 'closed',
                    exitTime: exitTime.toISOString(),
                    realizedPnl: realizedPnl
                  })
                });
                console.log(`✅ 포지션 ${position.id} DB 업데이트 완료 (손익: ${realizedPnl.toFixed(2)}원)`);
              } catch (dbError) {
                console.error('❌ DB 업데이트 실패:', dbError);
              }

              toast({
                title: realizedPnl >= 0 ? "💰 수익 실현!" : "📉 손실 확정",
                description: `전략 #${position.strategyId} 청산 완료. 손익: ${realizedPnl >= 0 ? '+' : ''}${Math.round(realizedPnl).toLocaleString()}원`,
                variant: realizedPnl >= 0 ? "default" : "destructive"
              });
            }

            return; // 실거래 처리 완료, Mock 로직 실행하지 않음
          } else {
            toast({
              title: "개별 청산 실패",
              description: "포지션 청산에 실패했습니다.",
              variant: "destructive"
            });
            return;
          }
          
        } catch (realTradeError: any) {
          console.error('❌ 실거래 개별 청산 실패:', realTradeError);
          toast({
            title: "실거래 청산 오류",
            description: `청산 중 오류가 발생했습니다: ${realTradeError.message}`,
            variant: "destructive"
          });
          return; // finally에서 lock 해제
        }

        return; // 실거래 처리 완료 후 mock 로직 실행하지 않음
      }

      // Mock 모드: 기존 로직 계속 실행

      const currentUpbitPrice = currentKimchiData?.upbit_price || 156000000;
      const currentBinancePrice = currentKimchiData?.binance_price || 112000;

      // 청산: 진입의 반대 거래 (비율 적용)
      const exitRatio = ratio; // 0.5 = 반절, 1.0 = 전체
      
      // 1. 업비트 매도 (보유 BTC → KRW)
      const upbitSellQuantity = position.upbitQuantity * exitRatio;
      const upbitRevenue = upbitSellQuantity * currentUpbitPrice;
      const upbitFee = upbitRevenue * 0.0005;

      // 2. 바이낸스 숏 청산 (롱 매수로 커버)
      const binanceCloseQuantity = position.binanceQuantity * exitRatio;

      const binanceCoverCost = binanceCloseQuantity * currentBinancePrice;
      const binanceFee = binanceCoverCost * 0.0004;
      const binanceMarginReturn = (binanceCloseQuantity * position.binancePrice) / position.leverage;

      // 실제 잔고 변화 기준 PnL 계산 (정확한 계산)
      const usdKrwRate = (currentKimchiData?.usdkrw ?? 1390);
      const entryUsdKrw = position.entryUsdKrw || usdKrwRate;
      
      // 진입 시 총 비용 (KRW 기준)
      const entryUpbitCost = position.upbitQuantity * position.upbitPrice; // 업비트 매수 원금
      const entryUpbitFee = entryUpbitCost * 0.0005; // 진입 매수 수수료
      const entryBinanceMargin = (position.binanceQuantity * position.binancePrice) / position.leverage; // 바이낸스 증거금
      const entryBinanceFee = position.binanceQuantity * position.binancePrice * 0.0004; // 바이낸스 진입 수수료
      const totalEntryCostKRW = (entryUpbitCost + entryUpbitFee) + ((entryBinanceMargin + entryBinanceFee) * entryUsdKrw);
      
      // 바이낸스 순 회수액 계산 (레버리지 적용)
      const binancePriceChange = position.binancePrice - currentBinancePrice; // 가격 변화 (숏이므로 가격 하락 시 수익)
      const binancePnlPerBtc = binancePriceChange * position.leverage; // 레버리지 적용된 BTC당 수익
      const binanceTotalPnl = binanceCloseQuantity * binancePnlPerBtc; // 총 수익
      const binanceNetReturn = binanceMarginReturn + binanceTotalPnl - binanceFee; // 증거금 + 수익 - 수수료
      
      // 청산 시 총 회수액 (KRW 기준)
      const exitUpbitRevenue = upbitSellQuantity * currentUpbitPrice; // 업비트 매도 총액
      const exitUpbitNet = exitUpbitRevenue - upbitFee; // 업비트 순수익
      const exitBinanceNet = binanceNetReturn * usdKrwRate; // 바이낸스 순회수액 (KRW 환산)
      const totalExitRevenueKRW = exitUpbitNet + exitBinanceNet;
      
      // 실제 손익 = 회수액 - 투입액
      const totalPnl = totalExitRevenueKRW - totalEntryCostKRW;

      // 청산 시 정확한 잔고 업데이트
      const upbitSellRevenue = upbitSellQuantity * currentUpbitPrice; // 업비트 매도 총액
      const upbitNetRevenue = upbitSellRevenue - upbitFee; // 업비트 매도 수수료 차감
      
      setLiveBalance(prev => {
        const newBalance = {
          ...prev,
          krw: Math.max(0, prev.krw + upbitNetRevenue), // 음수 방지
          btc: Math.max(0, (prev.btc || 0) - upbitSellQuantity), // 음수 방지
          usdt: prev.usdt, // 변경 없음 (바이낸스는 별도 관리)
          binanceUsdt: Math.max(0, (prev.binanceUsdt || 0) + (binanceNetReturn)), // 바이낸스는 USD로 추가
          // 선물 커버(청산) 시 숏 포지션 수량 감소
          binanceBtc: Math.max(0, (prev.binanceBtc || 0) - binanceCloseQuantity) // 음수 방지
        };

        return newBalance;
      });

      // 거래 기록 추가
      const currentCounter = tradeCounter + 1;
      setTradeCounter(currentCounter);
      const randomId = Math.random().toString(36).substring(2, 8);
      const tradeId = `exit-${Date.now()}-${currentCounter}-${randomId}`;
      const exitTimestamp = new Date(); // 청산 시점 고정
      const exitTrades: LiveTrade[] = [
        {
          id: `${tradeId}-upbit`,
          timestamp: exitTimestamp,
          type: 'sell',
          symbol: 'BTC',
          quantity: upbitSellQuantity,
          price: currentUpbitPrice,
          fee: upbitFee,
          exchange: 'upbit',
          strategyId: position.strategyId,
          strategyName: strategies.find(s => s.id === position.strategyId)?.name,
          premiumRate
        },
        {
          id: `${tradeId}-binance`,
          timestamp: exitTimestamp, // 동일한 청산 시점 사용
          type: 'cover', // SHORT 커버 (청산)
          symbol: 'BTC',
          quantity: binanceCloseQuantity,
          price: currentBinancePrice,
          fee: binanceFee,
          exchange: 'binance',
          strategyId: position.strategyId,
          strategyName: strategies.find(s => s.id === position.strategyId)?.name,
          premiumRate
        }
      ];

      setLiveTrades(prev => [...prev, ...exitTrades]);
      
      // 청산 거래 기록 저장
      exitTrades.forEach(trade => {
        saveLiveTradeToDB(trade, userId);
      });

      // 포지션 업데이트 (비율에 따라 부분/전체 청산)
      const updatedPositions = livePositions.map(p => 
        p.id === position.id 
          ? exitRatio >= 1.0 
            ? {...p, status: 'closed' as const, realizedPnl: totalPnl} // 전체 청산
            : {...p, // 부분 청산 - 수량 감소
                upbitQuantity: p.upbitQuantity * (1 - exitRatio),
                binanceQuantity: p.binanceQuantity * (1 - exitRatio),
                realizedPnl: (p.realizedPnl || 0) + totalPnl
              }
          : p
      );
      
      setLivePositions(updatedPositions);

      // DB에 청산 정보 저장
      if (exitRatio >= 1.0) {
        try {
          await fetch(`/api/positions/${position.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              status: 'closed',
              exitTime: exitTimestamp.toISOString(),
              realizedPnl: totalPnl
            })
          });
          console.log(`✅ 포지션 ${position.id} DB 업데이트 완료`);
        } catch (dbError) {
          console.error('❌ DB 업데이트 실패:', dbError);
        }
      } else {
        // 부분 청산의 경우 수량과 실현손익 업데이트
        const updatedPosition = updatedPositions.find(p => p.id === position.id);
        if (updatedPosition) {
          try {
            await fetch(`/api/positions/${position.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                upbitQuantity: updatedPosition.upbitQuantity,
                binanceQuantity: updatedPosition.binanceQuantity,
                realizedPnl: updatedPosition.realizedPnl
              })
            });
            console.log(`✅ 포지션 ${position.id} 부분 청산 DB 업데이트 완료`);
          } catch (dbError) {
            console.error('❌ 부분 청산 DB 업데이트 실패:', dbError);
          }
        }
      }

      // 전략별 집계: 실현손익 반영 및 수익률 갱신 (정확한 계산)
      const curStats = strategyStatsRef.current[position.strategyId] || { executionCount: 0, realizedPnlKRW: 0, investedKRW: 0, profitRate: 0 };
      const updatedRealizedPnl = (curStats.realizedPnlKRW || 0) + totalPnl;
      const updatedProfitRate = curStats.investedKRW > 0 ? (updatedRealizedPnl / curStats.investedKRW) * 100 : 0;

      strategyStatsRef.current[position.strategyId] = {
        ...curStats,
        realizedPnlKRW: updatedRealizedPnl,
        profitRate: updatedProfitRate
      };
      onStrategyStatsUpdate?.({ ...strategyStatsRef.current });
      
      addTradingLog(
        `✅ 청산 | 투입액: ${Math.round(totalEntryCostKRW).toLocaleString()}원, 회수액: ${Math.round(totalExitRevenueKRW).toLocaleString()}원, 손익: ${(totalPnl>=0?'+':'')}${Math.round(totalPnl).toLocaleString()}원`
      );
      
      const profitColor = totalPnl >= 0 ? "" : "destructive";
      toast({
        title: totalPnl >= 0 ? `💰 수익 실현! +₩${Math.round(totalPnl).toLocaleString()}` : `📉 손실 확정 -₩${Math.abs(Math.round(totalPnl)).toLocaleString()}`,
        description: totalPnl >= 0 ? "🎉 성공적인 거래였습니다! 축하드려요!" : "📊 다음 기회를 노려보세요!",
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
      tradingLockRef.current[Number(position.strategyId)] = false; // 전략별 거래 잠금 해제
      setIsTrading(false);
    }
  }, [
    currentKimchiData,
    liveBalance,
    tradeCounter,
    liveTrades,
    isLiveMode,
    userId,
    strategies,
    livePositions,
    onStrategyStatsUpdate,
    addTradingLog,
    toast,
    setBalanceLoading,
    refreshRealTimeBalances
  ]);

  // 중복 경고 방지를 위한 ref
  const lastPriceDataWarningRef = useRef<number>(0);

  // 김치프리미엄 기반 실거래 실행
  const executeRealTrade = useCallback(async (strategy: any, _forceEntry = false) => {
    if (!currentKimchiData) {
      console.warn(`🚫 [${strategy.name}] 김치데이터 없음`);
      return;
    }

    // 실거래 모드: 가격 데이터 검증
    if (!currentKimchiData.upbit_price || !currentKimchiData.binance_price) {
      const now = Date.now();
      // 30초마다 한 번만 경고 출력 (스팸 방지)
      if (now - lastPriceDataWarningRef.current > TRADING_CONSTANTS.PRICE_DATA_WARNING_INTERVAL) {
        console.warn('⚠️ 실거래 모드: 가격 데이터 부족으로 거래 대기 중', {
          upbit_price: currentKimchiData.upbit_price,
          binance_price: currentKimchiData.binance_price,
          timestamp: new Date().toLocaleString()
        });
        lastPriceDataWarningRef.current = now;
      }
      return;
    }

    const strategyId = String(strategy.id);

    // 원자적 중복 진입 방지 (더 강화된 체크) - 전략별 체크
    if (processingEntryRef.current.has(strategyId) || tradingLockRef.current[strategy.id]) {
      return;
    }

    // 즉시 처리 상태로 마킹하여 동시 호출 차단
    processingEntryRef.current.add(strategyId);

    // 자동 정리를 위한 타임아웃 (10초 후 강제 정리)
    const timeoutId = setTimeout(() => {
      processingEntryRef.current.delete(strategyId);
    }, TRADING_CONSTANTS.DEFAULTS.TIMEOUT_CLEANUP);

    try {
      // executeRealTrade 호출 로그 제거

      const currentPremium = currentKimchiData.kimp || 0;
      const prevPremium = prevPremiumRef.current ?? currentPremium;
      const entryRate = parseFloat(strategy.entryCondition);
      const exitRate = parseFloat(strategy.takeProfitCondition);

      // 🔒 DB에서 기존 포지션 확인 (절대 로컬 메모리 사용 금지!)
      let currentPosition: LivePosition | undefined = undefined;
      try {
        const posCheckRes = await fetch(`/api/positions/check-active?strategyId=${strategy.id}&symbol=BTC`, {
          credentials: 'include'
        });
        if (posCheckRes.ok) {
          const { hasActivePosition, position } = await posCheckRes.json();
          // DB raw 데이터를 LivePosition 형태로 변환
          if (hasActivePosition && position) {
            currentPosition = {
              id: position.id,
              strategyId: position.strategy_id,
              strategyName: position.strategy_name || `전략 #${position.strategy_id}`,
              symbol: position.symbol,
              entryTime: new Date(position.entry_time),
              entryPremiumRate: position.entry_premium_rate || 0,
              upbitQuantity: position.quantity || 0,
              upbitPrice: position.entry_price || 0,
              entryUsdKrw: 1394,
              binanceQuantity: position.binance_quantity || 0,
              binancePrice: position.binance_entry_price || 0,
              binanceSpotQuantity: position.binance_spot_quantity || 0,
              leverage: position.leverage || 1,
              side: position.side as 'long' | 'short',
              status: position.status as 'open' | 'closed',
              unrealizedPnl: 0,
              unrealizedPnlKrw: 0,
              realizedPnl: 0,
              currentPremiumRate: 0
            } as LivePosition;
          }
        }
      } catch (error) {
        console.error('❌ DB 포지션 조회 실패:', error);
        return; // DB 조회 실패시 진입/청산 중단
      }

      // 허용오차 설정
      const tolerance = parseFloat(strategy.tolerance || String(TRADING_CONSTANTS.TOLERANCE.DEFAULT));
      
      const now = Date.now();
      const diffEntry = Math.abs(currentPremium - entryRate);
      const crossedEntry = (prevPremium - entryRate) * (currentPremium - entryRate) <= 0 && Math.abs(prevPremium - entryRate) > tolerance;

      // 진입 조건: 허용오차 범위 내 또는 교차점 통과 (포지션이 없을 때만)
      let entryOk = !currentPosition && (diffEntry <= tolerance || crossedEntry);

      // 청산 후 10초 텀 체크 (진입할 때만)
      if (entryOk) {
        const lastAction = lastActionAtRef.current[strategy.id] || 0;
        const cooldownTime = 10000; // 10초
        if (now - lastAction < cooldownTime) {
          entryOk = false;
        }
      }

      // 청산 조건: 익절조건 이상이면 청산 (포지션이 있을 때만)
      const exitOk = currentPosition && (currentPremium >= exitRate);

      if (entryOk) {
        addTradingLog(`🎯 ${strategy.name} 진입 조건 만족! 김프 ${currentPremium.toFixed(3)}% → ${entryRate}%`);

        try {
          await liveEntry(strategy, currentPremium);
        } finally {
          // liveEntry 완료 후 무조건 처리 상태 정리
          clearTimeout(timeoutId);
          processingEntryRef.current.delete(strategyId);
        }
      } else if (exitOk && currentPosition) {
        // 거래 잠금 상태 확인 (ref만 체크 - 동기적) - 전략별 체크
        if (tradingLockRef.current[strategy.id]) {
          return;
        }

        addTradingLog(`🎯 ${strategy.name} 청산 조건 만족! 김프 ${currentPremium.toFixed(3)}% → ${exitRate}%`);

        await liveExit(currentPosition, currentPremium);

        lastActionAtRef.current[strategy.id] = now; // 현재 시각 저장 (진입 시 10초 체크)
      }
      prevPremiumRef.current = currentPremium; // 마지막에 갱신
      
      // 모든 디버깅 로그 제거
      // 그 외에는 대기 (정확한 조건 만족 시에만 거래)
    } finally {
      // liveEntry를 호출하지 않은 경우에만 처리 상태 정리
      if (processingEntryRef.current.has(strategyId)) {
        clearTimeout(timeoutId); // 타임아웃 취소
        processingEntryRef.current.delete(strategyId);
      }
    }
  }, [currentKimchiData, isTrading, livePositions, liveBalance, toast, liveEntry, liveExit, addTradingLog]);

  // 가격 데이터 유효성 검증 함수
  const isValidPriceData = useCallback((data: any) => {
    return data && 
           typeof data.kimp === 'number' && 
           data.upbit_price > 0 && 
           data.binance_price > 0 && 
           data.usdkrw > 0;
  }, []);

  // 김프 데이터 업데이트 및 저장 (무한 루프 방지 - 값 기반 비교)
  useEffect(() => {
    if (currentKimchiData && typeof currentKimchiData.kimp === 'number') {
      // 실거래 모드에서는 더 엄격한 검증
      if (isLiveMode && !isValidPriceData(currentKimchiData)) {
        // 유효하지 않은 데이터는 업데이트하지 않음 (이전 데이터 유지)
        return;
      }
      
      setLastKimchiData((prev: any) => {
        // 이전 값과 비교하여 실제 변화가 있을 때만 업데이트
        if (!prev || 
            prev.kimp !== currentKimchiData.kimp ||
            prev.upbit_price !== currentKimchiData.upbit_price ||
            prev.binance_price !== currentKimchiData.binance_price) {
          return currentKimchiData;
        }
        return prev; // 변화 없으면 이전 값 유지
      });
    }
  }, [currentKimchiData?.kimp, currentKimchiData?.upbit_price, currentKimchiData?.binance_price, isLiveMode, isValidPriceData]);

  // 김프 데이터 변경 시 즉시 매매 체크
  useEffect(() => {
    if (currentKimchiData && !isTrading) {
      const activeStrategies = strategies.filter(s => s.isActive);
      
      if (activeStrategies.length > 0) {
        // 실시간 김프 변경 감지 로그 제거
        
        // 비동기로 즉시 병렬 실행
        Promise.all(activeStrategies.map(strategy => executeRealTrade(strategy)));
      }
    }
  }, [currentKimchiData?.kimp, strategies, isTrading, executeRealTrade]);

  // 실시간 데이터 연결 상태 모니터링 (실거래 모드 전용)
  useEffect(() => {
    if (!isLiveMode) return;

    const monitorInterval = setInterval(async () => {
      try {
        // 서버에서 가격 캐시 상태 확인
        const response = await fetch('/api/debug/price-cache-status');
        if (response.ok) {
          const status = await response.json();
          
          // 가격 데이터가 없거나 오래된 경우 경고
          const hasValidData = status.currentKimchiData?.some((data: any) => 
            data.upbitPrice > 0 && data.binanceFuturesPrice > 0
          );
          
          if (!hasValidData) {
            console.warn('⚠️ 서버 가격 캐시 상태 불량:', status);
          }
        }
      } catch (error) {
        console.warn('가격 캐시 상태 확인 실패:', error);
      }
    }, 30000); // 30초마다 확인

    return () => clearInterval(monitorInterval);
  }, [isLiveMode]);

  // 포지션 균형 자동 체크 (거래 후)
  useEffect(() => {
    const activePositions = livePositions.filter(p => p.status === 'open');
    if (activePositions.length > 0) {
      const totalUpbitQty = activePositions.reduce((sum, p) => sum + (p.upbitQuantity || 0), 0);
      const totalBinanceQty = activePositions.reduce((sum, p) => sum + (p.binanceQuantity || 0), 0);
      const imbalance = totalUpbitQty - totalBinanceQty;
      
      // 0.001 BTC 이상 불균형 시 경고
      if (Math.abs(imbalance) > 0.001) {
        console.warn('⚠️ 포지션 불균형 감지:', {
          totalUpbitQty: totalUpbitQty.toFixed(6),
          totalBinanceQty: totalBinanceQty.toFixed(6),
          imbalance: imbalance.toFixed(6),
          riskAmount: Math.abs(imbalance * (currentKimchiData?.upbit_price || 160000000)).toLocaleString()
        });
      }
    }
  }, [livePositions, currentKimchiData]);

  // 전략 상태 변경 시 즉시 체크 + 2초마다 주기적 체크
  useEffect((): (() => void) | void => {
    const activeStrategies = strategies.filter(s => s.isActive);

    // 전략 상태 변경 감지

    // 즉시 한번 체크 (전략 활성화 직후)
    if (activeStrategies.length > 0 && currentKimchiData) {
      // 즉시 자동매매 체크 로그 제거

      // 비동기로 즉시 병렬 실행
      Promise.all(activeStrategies.map(strategy => executeRealTrade(strategy)));
    }

    // 주기적 체크 설정
    if (activeStrategies.length > 0) {
      const interval = setInterval(() => {
        if (currentKimchiData) {
          // 주기적 자동매매 체크 로그 제거

          // 비동기로 병렬 실행
          Promise.all(activeStrategies.map(strategy => executeRealTrade(strategy)));
        }
      }, 2000); // 2초마다 체크 (매매 기회 놓치지 않도록)

      return () => clearInterval(interval);
    }
  }, [strategies, currentKimchiData, executeRealTrade]);



  // 잔고 초기화 (전략은 보존)
  const resetBalance = () => {
    const currentBalance = liveBalance;
    const activePositions = livePositions.filter(p => p.status === 'open').length;
    const totalTrades = liveTrades.length;
    const totalFees = dailyStats.totalFees;
    const currentPnL = totalPnl;
    
    const confirmMessage = `⚠️ 잔고를 초기화하시겠습니까?\n\n현재 상태:\n• KRW: ₩${(currentBalance.krw || 0).toLocaleString()}\n• 업비트 BTC: ${(currentBalance.btc || 0).toFixed(6)} BTC\n• 바이낸스 USDT: $${(currentBalance.binanceUsdt || 0).toLocaleString()}\n• 활성 포지션: ${activePositions}개\n• 총 거래: ${totalTrades}회\n• 총 수수료: ₩${Math.round(totalFees).toLocaleString()}\n• 현재 손익: ${currentPnL >= 0 ? '+' : ''}₩${Math.round(currentPnL).toLocaleString()}\n\n초기화될 데이터:\n✅ 잔고 (1억원으로 리셋)\n✅ 거래 기록\n✅ 포지션 정보\n❌ 전략 설정 (보존됨)\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`;
    
    if (!confirm(confirmMessage)) {
      return; // 사용자가 취소한 경우
    }
    
    // 1. 잔고 초기화
    const initialBalance = {
      krw: 100000000, // 1억원
      btc: 0, // 0 BTC (업비트)
      usdt: 100000, // 10만 USDT
      binanceBtc: 0, // 0 BTC (바이낸스 선물)
      binanceSpotBtc: 0, // 0 BTC (바이낸스 현물)
      binanceUsdt: 100000 // 10만 USDT (바이낸스)
    };
    setLiveBalance(initialBalance);
    
    // 2. 거래 기록 초기화
    setLiveTrades([]);
    
    // 3. 포지션 초기화
    setLivePositions([]);
    
    // 4. 카운터 초기화
    setTradeCounter(0);
    
    // 5. 거래 로그 초기화
    setTradingLogs([]);
    
    // 6. 전략별 통계 초기화
    strategyStatsRef.current = {};
    onStrategyStatsUpdate?.({});
    
    // 7. 토스트 메시지 상태 초기화
    setLastToastMessage('');
    
    // 8. 로컬스토리지 초기화 (전략은 보존)
    localStorage.removeItem(`live-balance-${userId}`);
    localStorage.removeItem(`mock-trades-${userId}`);
    localStorage.removeItem(`live-positions-${userId}`);
    
    // 전략 데이터는 보존 (실수로 삭제 방지)

    // 9. 강제진입 관련 로컬스토리지도 초기화
    localStorage.removeItem('forceEntrySettings');

    toast({
      title: "🧹 Mock 데이터 완전 초기화!",
      description: "💸 잔고, 거래기록, 포지션, 수수료, 통계 등 모든 데이터가 깔끔하게 리셋되었습니다! 새 출발! ✨",
      variant: "destructive"
    });
  };

  // 수익률 계산 - 초기 잔고 대비 변화율 (수정됨)
  const currentUsdKrw = currentKimchiData?.usdkrw || 1390;
  // 현재 잔고의 총 가치 계산 (원화 기준)
  
  // === 🎯 개별 포지션 PnL 계산 (수수료 제외 방식) ===
  const openPositions = livePositions.filter(p => p.status === 'open');

  // 🎯 중앙화된 PnL 계산 함수 사용
  const totalPositionPnl = openPositions
    .reduce((sum, position) => {
      const pnlResult = calculatePositionPnL(position, currentKimchiData);
      return sum + pnlResult.netPnl;
    }, 0);
  
  // === ⚠️ 총 수익률은 현재 활성 포지션만 계산 (실현손익 제외) ===
  const totalPnl = totalPositionPnl; // 실현손익 제외, 활성 포지션 PnL만 사용


  // === 총 순투자금 계산 (활성 포지션만) ===
  const activePositions = livePositions.filter(p => p.status === 'open');


  // === 💰 총 순투자금 계산 (수수료 제외 방식으로 일관성 유지) ===
  const totalActiveInvestment = activePositions
    .reduce((sum, position) => {
      const currentUsdKrw = currentKimchiData?.usdkrw || 1390;

      // 🔧 포지션 가격이 0인 경우 시장 데이터 사용 (PnL 계산기와 동일한 로직)
      const effectiveUpbitPrice = position.upbitPrice || currentKimchiData?.upbit_price || 0;
      const effectiveBinancePrice = position.binancePrice || currentKimchiData?.binance_price || 0;

      // 업비트 순투자금 계산 (실시간 매도 수수료 적용)
      const upbitGrossAmount = position.upbitQuantity * effectiveUpbitPrice;  // 업비트 총 매수금액 (KRW)
      const upbitEntryFee = upbitGrossAmount * 0.0005;                        // 업비트 진입 수수료 (매수 0.05%) - 고정

      const upbitNetInvestment = upbitGrossAmount - upbitEntryFee;            // 업비트 순투자금 = 매수금액 - 진입수수료만

      // 바이낸스 순투자금 계산 (실시간 매도 수수료 적용)
      // 바이낸스 가격이 큰 값(KRW)인 경우 USD로 변환
      const entryBinancePriceUsd = effectiveBinancePrice > 1000000
        ? effectiveBinancePrice / currentUsdKrw
        : effectiveBinancePrice;
      const binanceGrossMargin = (position.binanceQuantity * entryBinancePriceUsd) / position.leverage; // 바이낸스 증거금 (USD)
      const binanceEntryFee = (position.binanceQuantity * entryBinancePriceUsd * 0.0004); // 바이낸스 진입 수수료 (USD)

      const binanceNetMargin = binanceGrossMargin - binanceEntryFee;          // 바이낸스 순증거금 = 증거금 - 진입수수료만
      const binanceNetMarginKRW = binanceNetMargin * currentUsdKrw;           // 바이낸스 순증거금 (KRW)


      return sum + upbitNetInvestment + binanceNetMarginKRW;                  // 순투자금만 누적 (수수료 차감 후)
    }, 0);

  // === 총 수익률 계산 (현재 활성 포지션만) ===
  const profitRate = totalActiveInvestment > 0
    ? ((totalPnl / totalActiveInvestment) * 100)                              // 현재 포지션 손익만으로 수익률 계산
    : 0;

  // 수익률 계산 완료 - 디버깅이 필요한 경우에만 활성화
  // console.log('📊 수익률:', { investment: Math.round(totalActiveInvestment), pnl: Math.round(totalPnl), rate: profitRate.toFixed(2) + '%' });
  
  // 수익률 계산 완료 (로그 제거)
    
  // 수익률 계산 완료 (상세 로그 제거)

  // 실제 투자 기준 수익률도 계산 (청산된 포지션들의 투자액 대비)

  // 일일 통계 계산 (useMemo로 최적화)
  const dailyStats = useMemo(() => {
    // 현재 김치 데이터에서 가격 정보 추출
    const currentUsdKrw = currentKimchiData?.usdkrw || 1390;

    // 오전 9시 기준 거래일 계산
    const now = new Date();
    const today = new Date();
    if (now.getHours() < 9) {
      // 오전 9시 이전이면 전날 거래일
      today.setDate(today.getDate() - 1);
    }
    today.setHours(9, 0, 0, 0);

    const todayTrades = liveTrades.filter(trade => {
      const tradeDate = new Date(trade.timestamp);
      if (tradeDate.getHours() < 9) {
        tradeDate.setDate(tradeDate.getDate() - 1);
      }
      tradeDate.setHours(9, 0, 0, 0);
      return tradeDate.getTime() === today.getTime();
    });

    // 오늘 진입한 포지션 (진입 시간 기준)
    const todayEntryPositions = livePositions.filter(position => {
      const entryDate = new Date(position.entryTime);
      if (entryDate.getHours() < 9) {
        entryDate.setDate(entryDate.getDate() - 1);
      }
      entryDate.setHours(9, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    // 오늘 청산한 포지션 (청산 시간 기준) - 총 수익금 계산용
    const todayExitPositions = livePositions.filter(position => {
      // 디버깅: 최근 5개의 closed 포지션 체크
      if (position.status === 'closed' && Number(position.id) >= 940) {
        console.log(`🔍 포지션 ${position.id} 초기 체크:`, {
          status: position.status,
          exitTime: position.exitTime,
          hasExitTime: !!position.exitTime,
          exitTimeType: typeof position.exitTime
        });
      }

      if (position.status !== 'closed' || !position.exitTime) return false;

      const exitDate = new Date(position.exitTime);

      // 유효하지 않은 날짜 체크
      if (isNaN(exitDate.getTime())) {
        console.warn('⚠️ 잘못된 exitTime:', position.id, position.exitTime);
        return false;
      }

      const originalExitDate = new Date(exitDate);

      if (exitDate.getHours() < 9) {
        exitDate.setDate(exitDate.getDate() - 1);
      }
      exitDate.setHours(9, 0, 0, 0);

      const isToday = exitDate.getTime() === today.getTime();

      // 디버깅: 최근 5개만 로그
      if (Number(position.id) >= 940) {
        console.log(`🔍 포지션 ${position.id} 체크:`, {
          exitTime: position.exitTime,
          originalDate: originalExitDate.toISOString(),
          adjustedDate: exitDate.toISOString(),
          todayDate: today.toISOString(),
          isToday
        });
      }

      return isToday;
    });

    // 거래 통계
    const totalTrades = todayTrades.length;
    const upbitTrades = todayTrades.filter(t => t.exchange === 'upbit').length;
    const binanceTrades = todayTrades.filter(t => t.exchange === 'binance').length;
    
    // 수수료 통계 (완료된 거래 + 활성 포지션 예상 매도 수수료)
    const completedFees = todayTrades.reduce((sum, trade) => {
      if (trade.exchange === 'upbit') {
        return sum + trade.fee; // 업비트 수수료 (KRW)
      } else {
        return sum + (trade.fee * (currentUsdKrw || 1390)); // 바이낸스 수수료 (USDT → KRW)
      }
    }, 0);

    // 완료된 거래의 실제 수수료만 표시 (예상 매도 수수료 제외)
    const totalFees = completedFees;

    // 오늘 청산한 포지션의 실현 수익 합계
    const realizedPnl = todayExitPositions
      .reduce((sum, p) => sum + (p.realizedPnl || 0), 0);

    // 디버깅: 총 수익금이 0인 이유 확인
    if (todayExitPositions.length > 0) {
      console.log('📊 오늘 청산 포지션:', todayExitPositions.length, '개');
      console.log('📊 청산 포지션 상세:', todayExitPositions.slice(0, 5).map(p => ({
        id: p.id,
        exitTime: p.exitTime,
        status: p.status,
        realizedPnl: p.realizedPnl
      })));
      console.log('📊 총 수익금:', realizedPnl);
    } else {
      console.log('❌ 오늘 청산한 포지션 없음');
      console.log('전체 포지션:', livePositions.length, '개');
      const closedPositions = livePositions.filter(p => p.status === 'closed');
      console.log('closed 포지션 총 개수:', closedPositions.length);
      console.log('closed 포지션 샘플 (최근 5개):', closedPositions.slice(0, 5).map(p => ({
        id: p.id,
        status: p.status,
        exitTime: p.exitTime,
        exitTimeType: typeof p.exitTime,
        entryTime: p.entryTime,
        realizedPnl: p.realizedPnl
      })));
      console.log('오늘 기준 시간:', today);
      console.log('현재 시간:', now);
    }

    // 활성 포지션 수
    const activePositions = livePositions.filter(p => p.status === 'open').length;

    return {
      totalTrades,
      upbitTrades,
      binanceTrades,
      totalFees,
      realizedPnl,
      activePositions,
      newPositions: todayEntryPositions.length
    };
  }, [liveTrades, livePositions, currentUsdKrw, currentKimchiData]);

  // 일일 통계가 변경될 때 부모 컴포넌트에 전달 (무한 루프 방지)
  useEffect(() => {
    if (onDailyStatsUpdate && dailyStats) {
      onDailyStatsUpdate(dailyStats);
    }
  }, [dailyStats.totalFees, dailyStats.totalTrades, dailyStats.realizedPnl]); // 특정 값만 의존성으로

  // 최근 거래(진입+청산) 10건 (시간 내림차순)
  const recentTrades = useMemo(() => {
    // 최근 거래 계산 시작
    
    const filteredTrades = liveTrades
      .filter(t => {
        const isValidType = ['buy', 'sell', 'short', 'cover'].includes((t.type || '').toLowerCase());
        // 거래 필터링
        return isValidType;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // 최근 거래 계산 완료

    return filteredTrades;
  }, [liveTrades]);

  // 활성 포지션 합산 수량 (표시용)
  const rawOpenUpbitQty = useMemo(() => {
    return livePositions
      .filter(p => p.status === 'open')
      .reduce((sum, p) => sum + (Number(p.upbitQuantity) || 0), 0);
  }, [livePositions]);

  const rawOpenBinanceQty = useMemo(() => {
    return livePositions
      .filter(p => p.status === 'open')
      .reduce((sum, p) => sum + (Number(p.binanceQuantity) || 0), 0);
  }, [livePositions]);

  const [openUpbitQty, setOpenUpbitQty] = useState(0);
  const [openBinanceQty, setOpenBinanceQty] = useState(0);

  // 비동기 트윈 업데이트
  useEffect(() => {
    const cancel = animateNumber(openUpbitQty, rawOpenUpbitQty, setOpenUpbitQty, 300);
    return () => { if (typeof cancel === 'function') cancel(); };
  }, [rawOpenUpbitQty]);

  useEffect(() => {
    const cancel = animateNumber(openBinanceQty, rawOpenBinanceQty, setOpenBinanceQty, 300);
    return () => { if (typeof cancel === 'function') cancel(); };
  }, [rawOpenBinanceQty]);

  // 버튼 텍스트 깜박임 방지를 위한 안정화된 값들
  const stableButtonText = useMemo(() => {
    const openPositions = livePositions.filter(p => p.status === 'open');
    if (openPositions.length > 0) {
      return `✅ ${openPositions.length}개 포지션 진입 중`;
    }
    return "❌ 진입 포지션 없음";
  }, [livePositions]);

  return (
    <>
    <Card className="bg-slate-850 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center justify-between md:justify-start md:gap-3">
            <span>자동 매매 시스템</span>
            {isLiveMode && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isValidPriceData(currentKimchiData) ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}></div>
                <span className={`text-xs ${
                  isValidPriceData(currentKimchiData) ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isValidPriceData(currentKimchiData) ? '실시간 데이터 연결됨' : '데이터 연결 대기 중'}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className={`h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm flex-1 md:flex-none min-w-0 md:min-w-[200px] ${livePositions.some(p => p.status === 'open') ? 'bg-orange-600 hover:bg-orange-600 text-white border-orange-600' : ''}`}
            >
              {stableButtonText === "loading" ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  전략 로딩 중...
                </span>
              ) : stableButtonText === "error" ? (
                <span className="text-red-400">⚠️ 전략 로드 실패</span>
              ) : (
                stableButtonText
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowForceEntryModal(true)}
              className="h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm flex-1 md:flex-none"
            >
              🧪 강제 진입
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm flex-1 md:flex-none" 
              onClick={async () => {
                // 활성 포지션 전체 청산 (실제 API 호출 포함)
                const activePositions = livePositions.filter(p => p.status === 'open');
                if (activePositions.length === 0) {
                  toast({
                    title: "청산할 포지션 없음",
                    description: "활성 포지션이 없습니다.",
                    variant: "destructive"
                  });
                  return;
                }

                // 실거래 모드에서는 실제 API 호출
                if (actualTradingMode === 'real') {
                  try {
                    // 각 포지션별로 실제 청산 API 호출
                    const liquidationResults = [];
                    
                    for (const position of activePositions) {
                      try {
                        // 1. 업비트 현물 매도 (보유량이 있으면)
                        if (position.upbitQuantity > 0.00001) {
                          const upbitSellResponse = await fetch('/api/trading/upbit/sell', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              market: `KRW-${position.symbol}`,
                              volume: position.upbitQuantity,
                              ord_type: 'market'
                            })
                          });
                          
                          if (upbitSellResponse.ok) {
                            const upbitResult = await upbitSellResponse.json();
                            liquidationResults.push({ type: 'upbit_sell', symbol: position.symbol, result: upbitResult });
                          } else {
                            console.error(`❌ 업비트 매도 실패:`, await upbitSellResponse.text());
                          }
                        }
                        
                        // 2. 바이낸스 선물 청산 (포지션이 있으면)
                        if (Math.abs(position.binanceQuantity) > 0.00001) {
                          const binanceCloseResponse = await fetch('/api/trading/binance/close-short', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              symbol: `${position.symbol}USDT`,
                              quantity: Math.abs(position.binanceQuantity)
                            })
                          });
                          
                          if (binanceCloseResponse.ok) {
                            const binanceResult = await binanceCloseResponse.json();
                            liquidationResults.push({ type: 'binance_close', symbol: position.symbol, result: binanceResult });
                          } else {
                            console.error(`❌ 바이낸스 청산 실패:`, await binanceCloseResponse.text());
                          }
                        }
                        
                      } catch (positionError: any) {
                        console.error(`❌ 포지션 ${position.symbol} 청산 실패:`, positionError);
                        liquidationResults.push({ type: 'error', symbol: position.symbol, error: positionError.message });
                      }
                    }

                    // 성공한 청산이 있으면 실제 거래소 상태 확인 후 UI 업데이트
                    if (liquidationResults.some(r => r.type !== 'error')) {
                      // 3초 후 실제 거래소 상태 확인
                      setTimeout(async () => {
                        try {
                          // 바이낸스 포지션 확인
                          const binanceResponse = await fetch('/api/test/binance-balance', { credentials: 'include' });
                          const binanceData = await binanceResponse.json();
                          const btcPosition = binanceData.summary?.positions?.find((p: any) => p.symbol === 'BTCUSDT');
                          const hasBinancePosition = btcPosition && Math.abs(parseFloat(btcPosition.positionAmt || '0')) > 0.00001;
                          
                          // 업비트 잔고 확인  
                          const upbitResponse = await fetch('/api/test/upbit-balance', { credentials: 'include' });
                          const upbitData = await upbitResponse.json();
                          const upbitBtc = parseFloat(upbitData.summary?.btc?.balance || '0');

                          // 실제 거래소에 포지션이 없으면 UI에서도 제거
                          setLivePositions(prev =>
                            prev.map(p => {
                              if (p.status === 'open') {
                                const shouldClose =
                                  (p.symbol === 'BTC' && !hasBinancePosition && p.binanceQuantity !== 0) ||
                                  (p.symbol === 'BTC' && upbitBtc < 0.001 && p.upbitQuantity !== 0);

                                if (shouldClose) {
                                  return {
                                    ...p,
                                    status: 'closed' as const,
                                    exitTime: new Date(),
                                    realizedPnl: p.unrealizedPnl || 0
                                  };
                                }
                              }
                              return p;
                            })
                          );
                          
                          toast({
                            title: "실거래 청산 확인 완료",
                            description: `거래소 상태와 동기화되었습니다.`,
                          });
                          
                        } catch (syncError: any) {
                          console.error('❌ 거래소 상태 동기화 실패:', syncError);
                        }
                      }, 3000);
                      
                      // 즉시 UI 업데이트 (낙관적 업데이트)
                      const closedPositions = activePositions.map(position => ({
                        ...position,
                        status: 'closed' as const,
                        exitTime: new Date(),
                        realizedPnl: position.unrealizedPnl || 0
                      }));
                      
                      setLivePositions(prev => 
                        prev.map(p => 
                          activePositions.find(ap => ap.id === p.id) 
                            ? closedPositions.find(cp => cp.id === p.id)! 
                            : p
                        )
                      );
                      
                      toast({
                        title: "실거래 청산 완료",
                        description: `${liquidationResults.filter(r => r.type !== 'error').length}개 포지션이 실제로 청산되었습니다.`,
                      });
                      
                      // 🔄 청산 완료 후 즉시 잔고 새로고침
                      setTimeout(async () => {
                        try {
                          // 로딩 상태 시작 (스피너 표시)
                          setBalanceLoading && setBalanceLoading(true);

                          // 병렬로 잔고 새로고침 실행
                          await Promise.all([
                            fetch('/api/v2/balance/refresh', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ forceRefresh: true })
                            }),
                            // 실시간 잔고 즉시 새로고침
                            refreshRealTimeBalances && refreshRealTimeBalances()
                          ]);

                          // DB 거래 기록도 새로고침
                          setTradeRefreshTrigger(prev => prev + 1);
                        } catch (refreshError) {
                          console.error('❌ 청산 후 잔고 새로고침 실패:', refreshError);
                        } finally {
                          // 로딩 상태 종료 (1.5초 후 - 사용자가 볼 수 있도록)
                          setTimeout(() => {
                            setBalanceLoading && setBalanceLoading(false);
                          }, 1500);
                        }
                      }, 500); // 0.5초 후 새로고침 (더 빠르게)
                    } else {
                      toast({
                        title: "청산 실패",
                        description: "모든 포지션 청산에 실패했습니다.",
                        variant: "destructive"
                      });
                    }
                    
                  } catch (error: unknown) {
                    console.error('❌ 실거래 전체 청산 실패:', error);
                    toast({
                      title: "청산 오류",
                      description: `청산 중 오류가 발생했습니다: ${getErrorMessage(error)}`,
                      variant: "destructive"
                    });
                  }
                } else {
                  // Mock 모드: 기존 로직 (DB 상태만 변경)
                  const closedPositions = activePositions.map(position => ({
                    ...position,
                    status: 'closed' as const,
                    exitTime: new Date(),
                    realizedPnl: position.unrealizedPnl || 0
                  }));
                  
                  setLivePositions(prev => 
                    prev.map(p => 
                      activePositions.find(ap => ap.id === p.id) 
                        ? closedPositions.find(cp => cp.id === p.id)! 
                        : p
                    )
                  );
                  
                  toast({
                    title: "Mock 청산 완료",
                    description: `${activePositions.length}개 포지션이 청산되었습니다 (Mock 모드).`
                  });
                }
              }}
              disabled={!livePositions.some(p => p.status === 'open')}
            >
              전체 청산
            </Button>
            {/* Mock 모드 전용 기능들 */}
            {!isLiveMode && (
              <>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={resetBalance}
                  className="bg-red-600 hover:bg-red-700"
                >
                  ⚠️ 잔고 초기화
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        
        {/* 잔고 및 수익률 표시 */}
        <LiveBalanceDisplay
          liveBalance={isLiveMode ? {
            krw: liveBalances?.real?.krw || 0,
            btc: liveBalances?.real?.btc_upbit || 0,
            usdt: liveBalances?.real?.usdt || 0,
            binanceBtc: openBinanceQty, // 활성 포지션 기반
            binanceSpotBtc: 0,
            binanceUsdt: liveBalances?.real?.usdt || 0
          } : liveBalance}
          openUpbitQty={isLiveMode ? (liveBalances?.real?.btc_upbit || 0) : liveBalance.btc}
          openBinanceQty={openBinanceQty}
          profitRate={profitRate}
          totalPnl={totalPnl}
          realtimeBalances={realtimeBalances}
          balanceLoading={balanceLoading}
        />


        {/* 활성 포지션 */}
        <LivePositionList
          livePositions={livePositions}
          strategies={strategies}
          lastKimchiData={lastKimchiData}
          onLiveExit={liveExit}
        />

        {/* 거래 내역 */}
        <div>
          {recentTrades.length === 0 && (
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <p className="text-yellow-400 text-sm mb-2">⚠️ 거래 기록이 표시되지 않습니다</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const tradeKey = `mock-trades-${userId}`;
                    const savedTrades = localStorage.getItem(tradeKey);

                    if (savedTrades && savedTrades !== '[]' && savedTrades !== 'null') {
                      try {
                        const parsed = JSON.parse(savedTrades);
                        setLiveTrades(parsed);

                        // 강제 리렌더링
                        setTimeout(() => {
                          window.dispatchEvent(new Event('resize'));
                        }, 100);
                      } catch (error) {
                        console.error('❌ 수동 복원 실패:', error);
                      }
                    } else {
                    }
                  }}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded"
                >
                  거래 기록 복원
                </button>
                <button
                  onClick={() => {
                    // 자동 복원 활성화
                    const autoRestore = () => {
                      const tradeKey = `mock-trades-${userId}`;
                      const savedTrades = localStorage.getItem(tradeKey);
                      if (savedTrades && savedTrades !== '[]' && savedTrades !== 'null') {
                        try {
                          const parsed = JSON.parse(savedTrades);
                          if (parsed.length > 0) {
                            setLiveTrades(parsed);
                            return true;
                          }
                        } catch (error) {
                          console.error('❌ 자동 복원 실패:', error);
                        }
                      }
                      return false;
                    };
                    
                    // 즉시 시도 + 1초마다 5번 시도
                    let attempts = 0;
                    const maxAttempts = 5;
                    const interval = setInterval(() => {
                      attempts++;
                      if (autoRestore() || attempts >= maxAttempts) {
                        clearInterval(interval);
                      }
                    }, 1000);
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                >
                  자동 복원
                </button>
              </div>
            </div>
          )}
          <LiveTradeHistory
            tradingLogs={tradingLogs}
            recentTrades={recentTrades}
            strategies={strategies}
            refreshTrigger={tradeRefreshTrigger}
          />
        </div>
      </CardContent>
    </Card>

    {/* 강제진입 모달 */}
    <ForceEntryModal
      isOpen={showForceEntryModal}
      onClose={() => setShowForceEntryModal(false)}
      currentKimp={currentKimchiData?.kimp || 0}
      onForceEntry={handleForceEntry}
      isLiveMode={actualTradingMode === 'real'}
    />
    </>
  );
};
