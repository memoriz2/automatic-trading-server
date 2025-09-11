import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TRADING_CONSTANTS } from "@/lib/utils";

// API 호출 함수
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};

// DB 저장 함수들
const saveMockTradeToDB = async (trade: MockTrade, userId: string, isLiveMode: boolean = false) => {
  try {
    const apiEndpoint = isLiveMode ? '/api/live-trades' : '/api/mock-trades';
    
    await apiFetch(apiEndpoint, {
      method: 'POST',
      credentials: 'include', // 세션 쿠키 포함
      body: JSON.stringify({
        id: trade.id,
        timestamp: trade.timestamp.toISOString(),
        type: trade.type,
        symbol: trade.symbol,
        quantity: trade.quantity,
        price: trade.price,
        fee: trade.fee,
        exchange: trade.exchange,
        strategyId: trade.strategyId,
        premiumRate: trade.premiumRate,
        isMock: !isLiveMode, // 실거래 모드에 따라 결정
        strategyName: trade.strategyName || 'Unknown',
        mockSessionId: isLiveMode ? undefined : `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Mock 세션 ID
      })
    });
    console.log(`✅ ${isLiveMode ? '실거래' : 'Mock 거래'} DB 저장 성공:`, trade.id);
  } catch (error) {
    console.error(`❌ ${isLiveMode ? '실거래' : 'Mock 거래'} DB 저장 실패:`, error);
  }
};

const saveMockPositionToDB = async (position: MockPosition, userId: string) => {
  // 🔒 로컬스토리지에만 저장 (서버 부담 제거)
  try {
    const positionKey = `position_${position.id}`;
    localStorage.setItem(positionKey, JSON.stringify({
      ...position,
      userId: parseInt(userId),
      entryTime: position.entryTime.toISOString(),
      isMock: true
    }));
    console.log('✅ Mock 포지션 로컬스토리지 저장 성공:', position.id);
  } catch (error) {
    console.error('❌ Mock 포지션 로컬스토리지 저장 실패:', error);
  }
};

const updateMockPositionInDB = async (position: MockPosition, userId: string) => {
  try {
    await apiFetch(`/api/mock-positions/${position.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: position.status,
        unrealizedPnl: position.unrealizedPnl,
        realizedPnl: position.realizedPnl
      })
    });
    console.log('✅ Mock 포지션 DB 업데이트 성공:', position.id);
  } catch (error) {
    console.error('❌ Mock 포지션 DB 업데이트 실패:', error);
  }
};

// 모의 거래 타입 정의
interface MockBalance {
  krw: number;
  btc: number;
  usdt: number;
  binanceBtc: number;
  binanceSpotBtc: number;
  binanceUsdt: number; // 바이낸스 USDT
}

interface MockTrade {
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

interface MockPosition {
  id: string;
  strategyId: string;
  symbol: string;
  entryTime: Date;
  entryPremiumRate: number;
  upbitQuantity: number;
  upbitPrice: number;
  entryUsdKrw?: number;
  binanceSpotQuantity: number;
  binanceQuantity: number;
  binancePrice: number;
  leverage: number;
  status: 'open' | 'closed';
  unrealizedPnl: number;
  realizedPnl: number;
}

interface KimchiData {
  kimp: number;
  upbit_price: number;
  binance_price: number;
  usdkrw: number;
}

interface MockTradingSystemProps {
  strategies: any[];
  currentKimchiData: KimchiData | null;
  userId?: string;
  onDailyStatsUpdate?: (stats: any) => void;
  isLiveMode?: boolean; // 실거래 모드 여부
  onStrategyStatsUpdate?: (stats: Record<string, { executionCount: number; realizedPnlKRW: number; investedKRW: number; profitRate: number; }>) => void;
}

export const MockTradingSystem: React.FC<MockTradingSystemProps> = ({ 
  strategies, 
  currentKimchiData,
  userId = "1", // 기본 사용자 ID
  onDailyStatsUpdate,
  isLiveMode = false, // 기본값은 Mock 모드
  onStrategyStatsUpdate
}) => {
  const { toast } = useToast();
  
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
  
  // 토글 방지용: 최소 보유시간
  const MIN_HOLD_MS = 30_000; // 진입 후 최소 보유 30초
  const EXIT_EXTRA = 0.2;     // 청산은 허용오차보다 0.2% 더 엄격
  const COOLDOWN_MS = 800;    // 동일 전략 연속 액션 쿨다운(민감도 향상)
  const lastActionAtRef = useRef<Record<string, number>>({});
  const prevPremiumRef = useRef<number | null>(null); // 임계값 교차 감지용 이전 김프
  // 동시 진입 방지: 현재 처리 중인 전략 ID 집합
  const processingEntryRef = useRef<Set<string>>(new Set());
  
  // 모의 잔고 (사용자별 로컬스토리지 저장)
  const [mockBalance, setMockBalance] = useState<MockBalance>(() => {
    const storageKey = `mock-balance-${userId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsedBalance = JSON.parse(saved);
        // 바이낸스 BTC 관련 잔고는 0으로 고정
        return {
          krw: parsedBalance.krw || 100000000,
          btc: 0,
          usdt: parsedBalance.usdt || 100000,
          binanceBtc: 0,
          binanceSpotBtc: 0,
          binanceUsdt: parsedBalance.binanceUsdt || 100000
        };
      } catch (error) {
        console.error('잔고 데이터 파싱 실패:', error);
        // 파싱 실패 시에도 기본값 반환 (새로고침 시 잔고 유지)
        return {
          krw: 100000000,
          btc: 0,
          usdt: 100000,
          binanceBtc: 0,
          binanceSpotBtc: 0,
          binanceUsdt: 100000
        };
      }
    }
    // 로컬스토리지에 데이터가 없을 때만 초기값 반환
    return {
      krw: 100000000,
      btc: 0,
      usdt: 100000,
      binanceBtc: 0,
      binanceSpotBtc: 0,
      binanceUsdt: 100000
    };
  });

  // 모의 거래 기록 (사용자별 저장)
  const [mockTrades, setMockTrades] = useState<MockTrade[]>(() => {
    const storageKey = `mock-trades-${userId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('거래 기록 파싱 실패:', error);
        return []; // 파싱 실패 시 빈 배열 반환
      }
    }
    return [];
  });

  // 모의 포지션 (사용자별 저장)
  const [mockPositions, setMockPositions] = useState<MockPosition[]>(() => {
    const storageKey = `mock-positions-${userId}`;
    const saved = localStorage.getItem(storageKey);
    const positions = saved ? JSON.parse(saved) : [];
    console.log('🎯 로컬 스토리지 포지션 로드:', positions);
    console.log('🎯 활성 포지션 개수:', positions.filter((p: MockPosition) => p.status === 'open').length);
    return positions;
  });

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
      console.log('🔄 거래 데이터 동기화 시작...');
      
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
        console.log('📈 거래 기록 로드:', normalizedTrades.length, '건');
        setMockTrades(normalizedTrades);
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
    
    // 30초마다 주기적 동기화
    const interval = setInterval(fetchTradingData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchTradingData]);

  // 로컬스토리지에 저장 (사용자별)
  useEffect(() => {
    const storageKey = `mock-balance-${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(mockBalance));
  }, [mockBalance, userId]);

  useEffect(() => {
    const storageKey = `mock-trades-${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(mockTrades));
  }, [mockTrades, userId]);

  useEffect(() => {
    const storageKey = `mock-positions-${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(mockPositions));
  }, [mockPositions, userId]);

  // 거래 로그 추가 함수
  const addTradingLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setTradingLogs(prev => [...prev.slice(-9), logMessage]); // 최근 10개만 유지
  }, []);


  // 모의 진입
  const mockEntry = useCallback(async (strategy: any, premiumRate: number) => {
    console.log('🎯 mockEntry 시작:', strategy.name, premiumRate);
    
    try {
      processingEntryRef.current.add(String(strategy.id));

      if (!currentKimchiData) {
        console.error('❌ currentKimchiData is null in mockEntry');
        return;
      }

      const baseAmount = parseFloat(strategy.investmentAmount); // 기준 BTC 수량
      const leverage = parseInt(strategy.leverage);
      const upbitPrice = currentKimchiData?.upbit_price || 156000000;
      const binancePrice = currentKimchiData?.binance_price || 112000;
      const entryUsdKrw = currentKimchiData?.usdkrw || 1390;

      // 1. 바이낸스 선물 숏 포지션 (기준 수량)
      const binanceShortAmount = baseAmount; // 기준 수량 (숏)
      const binanceMargin = (binanceShortAmount * binancePrice) / leverage; // 증거금
      const binanceFee = binanceShortAmount * binancePrice * 0.0004; // 0.04% 수수료

      // 2. 업비트 현물 매수 (바이낸스 USD 수량 × 레버리지 × 환율을 원화로)
      const usdKrwRate = currentKimchiData?.usdkrw || 1390; // 환율
      const upbitBuyAmountKRW = binanceShortAmount * binancePrice * leverage * usdKrwRate; // 원화 금액
      const upbitBuyAmountBTC = upbitBuyAmountKRW / upbitPrice; // BTC 수량으로 변환
      
      const upbitCost = upbitBuyAmountKRW;
      const upbitFee = upbitCost * 0.0005; // 0.05% 수수료
      const totalUpbitCost = upbitCost + upbitFee;

      // 잔고 확인
      if (mockBalance.krw < totalUpbitCost) {
        const errorMsg = `KRW 부족: 필요 ₩${totalUpbitCost.toLocaleString()}, 보유 ₩${mockBalance.krw.toLocaleString()}`;
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

      console.log('💰 증거금 계산:', {
        binanceShortAmount,
        binancePrice,
        leverage,
        binanceMargin,
        binanceFee,
        totalNeeded: binanceMargin + binanceFee,
        currentUSDT: mockBalance.usdt
      });

      if (mockBalance.usdt < binanceMargin + binanceFee) {
        const errorMsg = `증거금 부족: 필요 $${(binanceMargin + binanceFee).toFixed(2)}, 보유 $${(mockBalance.usdt || 0).toLocaleString()}`;
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

      // 잔고 변경
      setMockBalance(prev => ({
        ...prev,
        krw: prev.krw - totalUpbitCost, // 업비트 매수로 KRW 감소
        // btc: 현금/중립 전략에서는 보유량 0 유지
        usdt: prev.usdt - binanceMargin - binanceFee, // 바이낸스 증거금 차감 (총 USDT)
        binanceUsdt: (prev.binanceUsdt || 0) - binanceMargin - binanceFee, // 표시용 바이낸스 USDT도 동기화
        // 선물 숏 진입 시 선물 BTC 익스포저 감소(음수 방향)
        binanceBtc: (prev.binanceBtc || 0) - binanceShortAmount
      }));

      // 거래 기록 추가
      const currentCounter = tradeCounter + 1;
      setTradeCounter(currentCounter);
      const randomId = Math.random().toString(36).substring(2, 8);
      const tradeId = `trade-${Date.now()}-${currentCounter}-${randomId}`;
      const newTrades: MockTrade[] = [
        {
          id: `${tradeId}-binance`,
          timestamp: new Date(),
          type: 'short', // SHORT 포지션 진입
          symbol: 'BTC',
          quantity: binanceShortAmount,
          price: binancePrice,
          fee: binanceFee,
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
          quantity: upbitBuyAmountBTC,
          price: upbitPrice,
          fee: upbitFee,
          exchange: 'upbit',
          strategyId: strategy.id,
          strategyName: strategy.name,
          premiumRate
        }
      ];

      setMockTrades(prev => [...prev, ...newTrades]);
      
      // DB에 거래 기록 저장
      newTrades.forEach(trade => {
        saveMockTradeToDB(trade, userId, isLiveMode);
      });

      // 포지션 생성
      const newPosition: MockPosition = {
        id: `position-${Date.now()}-${currentCounter}-${randomId}`,
        strategyId: strategy.id,
        symbol: 'BTC',
        entryTime: new Date(),
        entryPremiumRate: premiumRate,
        upbitQuantity: upbitBuyAmountBTC, // 매수한 수량
        upbitPrice,
        entryUsdKrw,
        binanceSpotQuantity: 0, // 바이낸스 현물 수량 (기본값 0)
        binanceQuantity: binanceShortAmount, // 숏 수량
        binancePrice,
        leverage,
        status: 'open',
        unrealizedPnl: 0,
        realizedPnl: 0
      };

      setMockPositions(prev => [...prev, newPosition]);
      // 전략별 집계: 실행 횟수 + 투자원금 합산
      const investedKRW = newPosition.upbitQuantity * newPosition.upbitPrice;
      const cur = strategyStatsRef.current[strategy.id] || { executionCount: 0, realizedPnlKRW: 0, investedKRW: 0, profitRate: 0 };
      const updated = { 
        executionCount: cur.executionCount + 1,
        realizedPnlKRW: cur.realizedPnlKRW,
        investedKRW: cur.investedKRW + investedKRW,
        profitRate: cur.investedKRW + investedKRW > 0 ? (cur.realizedPnlKRW / (cur.investedKRW + investedKRW)) * 100 : 0
      };
      strategyStatsRef.current[strategy.id] = updated;
      onStrategyStatsUpdate?.({ ...strategyStatsRef.current });
      
      // DB에 포지션 저장
      saveMockPositionToDB(newPosition, userId);

      addTradingLog(`✅ ${strategy.name} 진입 완료! 김프 ${premiumRate.toFixed(3)}%`);
      
      toast({
        title: "🚀 진입 신호 포착!",
        description: `🎯 ${strategy.name} 전략 → 김프율 ${premiumRate.toFixed(3)}%에서 완벽 진입! 💎`,
      });

      console.log('✅ 모의 진입 완료:', {
        strategy: strategy.name,
        premium: premiumRate,
        upbitCost: totalUpbitCost,
        binanceMargin
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
  }, [
    currentKimchiData, 
    mockBalance, 
    isLiveMode, 
    userId, 
    toast, 
    tradeCounter,
    mockTrades,
    mockPositions,
    addTradingLog,
    onStrategyStatsUpdate,
    lastToastMessage,
  ]);

  // 모의 청산
  const mockExit = useCallback(async (position: MockPosition, premiumRate: number, ratio: number = 1.0) => {
    setIsTrading(true);

    try {
      if (!currentKimchiData) {
        console.error('❌ currentKimchiData is null in mockExit');
        setIsTrading(false);
        return;
      }

      const currentUpbitPrice = currentKimchiData?.upbit_price || 156000000;
      const currentBinancePrice = currentKimchiData?.binance_price || 112000;

      // 청산: 진입의 반대 거래 (비율 적용)
      const exitRatio = ratio; // 0.5 = 반절, 1.0 = 전체
      
      // 1. 업비트 매도 (보유 BTC → KRW)
      const upbitSellQuantity = position.upbitQuantity * exitRatio;
      const upbitRevenue = upbitSellQuantity * currentUpbitPrice;
      const upbitFee = upbitRevenue * 0.0005;
      const netUpbitRevenue = upbitRevenue - upbitFee;

      // 2. 바이낸스 숏 청산 (롱 매수로 커버)
      const binanceCloseQuantity = position.binanceQuantity * exitRatio;
      const binanceCoverCost = binanceCloseQuantity * currentBinancePrice;
      const binanceFee = binanceCoverCost * 0.0004;
      const binanceMarginReturn = (binanceCloseQuantity * position.binancePrice) / position.leverage;

      // PnL 계산 (김치프리미엄 기반 근사: 상승일수록 +) - 진입가 기준 노출로 고정
      const entryPremium = position.entryPremiumRate;
      const exitPremium = premiumRate;
      const premiumDelta = (exitPremium - entryPremium); // 상승 시 +
      const baseNotionalKRW = position.upbitQuantity * position.upbitPrice; // 진입 시 원화 노출 기준
      const usdKrwRate = (currentKimchiData?.usdkrw ?? 1390);
      const premiumPnlKRW = (premiumDelta / 100) * baseNotionalKRW;
      const entryUsdKrw = position.entryUsdKrw || usdKrwRate;
      const entryUpbitBuyFee = (position.upbitQuantity * position.upbitPrice) * 0.0005; // 진입 매수 수수료
      const entryBinanceShortFeeKRW = (position.binanceQuantity * position.binancePrice * 0.0004) * entryUsdKrw; // 진입 숏 수수료 KRW 환산
      const exitFeeKRW = upbitFee + (binanceFee * usdKrwRate);
      const totalFeesKRW = entryUpbitBuyFee + entryBinanceShortFeeKRW + exitFeeKRW;
      const totalPnl = premiumPnlKRW - totalFeesKRW;

      console.log('💰 청산 시 잔고 변화:', {
        binanceCloseQuantity,
        currentBinanceBtc: mockBalance.binanceBtc,
        newBinanceBtc: (mockBalance.binanceBtc || 5.0) + binanceCloseQuantity
      });

      // 잔고 업데이트
      setMockBalance(prev => ({
        ...prev,
        krw: prev.krw + netUpbitRevenue, // 업비트 매도 수익 추가
        // btc: 보유량 0 유지
        usdt: prev.usdt + binanceMarginReturn - binanceCoverCost - binanceFee, // 증거금 회수 - 청산 비용
        binanceUsdt: (prev.binanceUsdt || 0) + binanceMarginReturn - binanceCoverCost - binanceFee, // 표시용 바이낸스 USDT도 동기화
        // 선물 커버(청산) 시 선물 BTC 익스포저를 줄여 0에 수렴
        binanceBtc: (prev.binanceBtc || 0) + binanceCloseQuantity
      }));

      // 거래 기록 추가
      const currentCounter = tradeCounter + 1;
      setTradeCounter(currentCounter);
      const randomId = Math.random().toString(36).substring(2, 8);
      const tradeId = `exit-${Date.now()}-${currentCounter}-${randomId}`;
      const exitTrades: MockTrade[] = [
        {
          id: `${tradeId}-upbit`,
          timestamp: new Date(),
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
          timestamp: new Date(),
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

      setMockTrades(prev => [...prev, ...exitTrades]);
      
      // DB에 청산 거래 기록 저장
      exitTrades.forEach(trade => {
        saveMockTradeToDB(trade, userId, isLiveMode);
      });

      // 포지션 업데이트 (비율에 따라 부분/전체 청산)
      const updatedPositions = mockPositions.map(p => 
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
      
      setMockPositions(updatedPositions);
      // 전략별 집계: 실현손익 반영 및 수익률 갱신
      const curStats = strategyStatsRef.current[position.strategyId] || { executionCount: 0, realizedPnlKRW: 0, investedKRW: 0, profitRate: 0 };
      const realized = (curStats.realizedPnlKRW || 0) + totalPnl;
      const profitRate = curStats.investedKRW > 0 ? (realized / curStats.investedKRW) * 100 : 0;
      strategyStatsRef.current[position.strategyId] = { ...curStats, realizedPnlKRW: realized, profitRate };
      onStrategyStatsUpdate?.({ ...strategyStatsRef.current });
      
      // DB에 포지션 업데이트 저장
      const updatedPosition = updatedPositions.find(p => p.id === position.id);
      if (updatedPosition) {
        updateMockPositionInDB(updatedPosition, userId);
      }

      addTradingLog(
        `✅ 청산 | 김프PnL: ${(premiumPnlKRW>=0?'+':'')}${Math.round(premiumPnlKRW).toLocaleString()}원, 총수수료: -${Math.round(totalFeesKRW).toLocaleString()}원, 합계: ${(totalPnl>=0?'+':'')}${Math.round(totalPnl).toLocaleString()}원`
      );
      
      const profitColor = totalPnl >= 0 ? "" : "destructive";
      toast({
        title: totalPnl >= 0 ? `💰 수익 실현! +₩${Math.round(totalPnl).toLocaleString()}` : `📉 손실 확정 -₩${Math.abs(Math.round(totalPnl)).toLocaleString()}`,
        description: totalPnl >= 0 ? "🎉 성공적인 거래였습니다! 축하드려요!" : "📊 다음 기회를 노려보세요!",
        variant: profitColor as any
      });

      console.log('✅ 모의 청산 완료:', {
        position: position.id,
        premium: premiumRate,
        pnl: totalPnl
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
  }, [
    currentKimchiData,
    mockBalance,
    tradeCounter,
    mockTrades,
    isLiveMode,
    userId,
    strategies,
    mockPositions,
    onStrategyStatsUpdate,
    addTradingLog,
    toast
  ]);

  // 김치프리미엄 기반 모의 거래 실행
  const executeMockTrade = useCallback(async (strategy: any, forceEntry = false) => {
    if (!currentKimchiData) return;

    const strategyId = String(strategy.id);
    if (processingEntryRef.current.has(strategyId)) {
      console.warn(`⏯️ ${strategy.name} 전략은 이미 진입 처리 중입니다. 중복 호출을 건너뜁니다.`);
      return;
    }

    try {
      console.log('🚀 executeMockTrade 호출:', {
        strategy: strategy.name,
        forceEntry,
        isTrading,
        currentPremium: currentKimchiData.kimp
      });

      const currentPremium = currentKimchiData.kimp || 0;
      const prevPremium = prevPremiumRef.current ?? currentPremium;
      const entryRate = parseFloat(strategy.entryCondition);
      const exitRate = parseFloat(strategy.takeProfitCondition);

      // 기존 포지션 확인
      const currentPosition: MockPosition | undefined = mockPositions.find(p => 
        p.strategyId === strategy.id && p.status === 'open'
      );

      // 허용오차 설정
      const tolerance = parseFloat(strategy.tolerance || TRADING_CONSTANTS.DEFAULT_TOLERANCE);
      
      // 스크롤2 전략 특별 조건 (더 높은 진입조건)
      const isScroll2 = strategy.name === '스크롤2';
      const minKimchiRate = 5.0; // 최소 김프율 조건 (더 높게 설정)
      
      // 쿨다운 가드
      const now = Date.now();
      const lastAction = lastActionAtRef.current[strategy.id] || 0;
      if (now - lastAction < COOLDOWN_MS) return;

      const diffEntry = Math.abs(currentPremium - entryRate);
      const crossedEntry = (prevPremium - entryRate) * (currentPremium - entryRate) <= 0 && Math.abs(prevPremium - entryRate) > tolerance;
      
      // 진입 조건: 허용오차 범위 내 또는 교차점 통과 (포지션이 없을 때만)
      const entryOk = !currentPosition && (diffEntry <= tolerance || crossedEntry);
      
      // 청산 조건: 익절조건 이상이면 청산 (포지션이 있을 때만)
      const exitOk = currentPosition && (exitRate <= currentPremium);

      if (entryOk) {
        // 진입 조건 만족 - 새 포지션 생성
        console.log(`🎯 진입 조건: ${strategy.name} - 김프 ${currentPremium.toFixed(3)}% ≈ ${entryRate}% (오차: ${Math.abs(currentPremium - entryRate).toFixed(3)}%)`);
        addTradingLog(`🎯 ${strategy.name} 진입 조건 만족! 김프 ${currentPremium.toFixed(3)}% → ${entryRate}%`);
        await mockEntry(strategy, currentPremium);
        lastActionAtRef.current[strategy.id] = now;
        console.log(`✅ 진입 완료: ${strategy.name} - 청산 전까지 재진입 제한`);
      } else if (exitOk) {
        // 청산 조건 만족 - 포지션 청산
        console.log(`📊 청산 조건 체크: ${strategy.name}`);
        console.log(`   현재 김프율: ${currentPremium.toFixed(3)}%`);
        console.log(`   익절 조건: ${exitRate}%`);
        console.log(`   청산 여부: true (${exitRate} <= ${currentPremium.toFixed(3)})`);
        
        // 최소 보유시간 가드
        const heldMs = now - new Date((currentPosition as any).entryTime).getTime();
        console.log(`   보유 시간: ${heldMs}ms (최소: ${MIN_HOLD_MS}ms)`);
        
        if (heldMs < MIN_HOLD_MS) {
          console.log(`⏰ 최소 보유시간 미달로 청산 보류`);
          return;
        }
        
        console.log(`✅ 청산 조건 만족! 청산 실행 중...`);
        addTradingLog(`🎯 ${strategy.name} 청산 조건 만족! 김프 ${currentPremium.toFixed(3)}% → ${exitRate}%`);
        await mockExit(currentPosition, currentPremium);
        lastActionAtRef.current[strategy.id] = now;
      } else if (currentPosition) {
        // 포지션이 있지만 청산 조건 불만족
        console.log(`🔒 전략 "${strategy.name}" 포지션 보유 중 - 청산 대기 (익절${exitRate}% > 김프${currentPremium.toFixed(3)}%)`);
      }
      prevPremiumRef.current = currentPremium; // 마지막에 갱신
      
      // 디버깅: 조건 확인
      const entryDiff = Math.abs(currentPremium - entryRate);
      console.log(`\n🔍 ===== ${strategy.name} 조건 확인 =====`);
      console.log(`📈 현재 김프율: ${currentPremium.toFixed(3)}%`);
      console.log(`🎯 진입 조건: ${entryRate}%`);
      console.log(`📏 차이: ${entryDiff.toFixed(3)}%`);
      console.log(`⚖️ 허용 오차: ${tolerance}%`);
      console.log(`🔍 진입 가능: ${entryDiff.toFixed(3)}% <= ${tolerance}% = ${entryDiff <= tolerance ? 'YES' : 'NO'}`);
      
      // 스크롤2 전략 특별 확인
      if (strategy.name === '스크롤2') {
        console.log(`🚨 스크롤2 전략: 김프율 ${currentPremium.toFixed(3)}%, 조건 ${entryRate}%, 진입 ${entryDiff <= tolerance ? 'OK' : 'NO'}`);
      }
      
      if (currentPosition) {
        const exitDiff = Math.abs(currentPremium - exitRate);
        console.log(`💰 청산 조건: ${exitRate}% (현재: ${currentPremium.toFixed(3)}%, 청산가능: ${exitRate <= currentPremium ? 'YES' : 'NO'})`);
      }
      console.log(`===============================\n`);
      // 그 외에는 대기 (정확한 조건 만족 시에만 거래)
    } finally {
      processingEntryRef.current.delete(strategyId);
    }
  }, [currentKimchiData, isTrading, mockPositions, mockBalance, toast, mockEntry, mockExit, addTradingLog]);

  // 김프 데이터 업데이트 및 저장
  useEffect(() => {
    if (currentKimchiData && typeof currentKimchiData.kimp === 'number') {
      setLastKimchiData(currentKimchiData);
    }
  }, [currentKimchiData]);

  // 김프 데이터 변경 시 즉시 매매 체크
  useEffect(() => {
    if (currentKimchiData && !isTrading) {
      const activeStrategies = strategies.filter(s => s.isActive);
      
      if (activeStrategies.length > 0) {
        console.log('⚡ 실시간 김프 변경 감지 - 즉시 매매 체크:', {
          currentPremium: currentKimchiData.kimp?.toFixed(3),
          activeStrategies: activeStrategies.length,
          currentTime: new Date().toLocaleTimeString()
        });
        
        // 비동기로 즉시 병렬 실행
        Promise.all(activeStrategies.map(strategy => executeMockTrade(strategy)));
      }
    }
  }, [currentKimchiData?.kimp, strategies, isTrading, executeMockTrade]);

  // 전략 상태 변경 시 즉시 체크 + 2초마다 주기적 체크
  useEffect(() => {
    const activeStrategies = strategies.filter(s => s.isActive);
    
    console.log('🔄 전략 상태 변경 감지:', {
      totalStrategies: strategies.length,
      activeStrategies: activeStrategies.length,
      activeNames: activeStrategies.map(s => s.name)
    });
    
    // 즉시 한번 체크 (전략 활성화 직후)
    if (activeStrategies.length > 0 && currentKimchiData) {
      console.log('⚡ 즉시 자동매매 체크 (전략 변경):', {
        activeStrategies: activeStrategies.length,
        currentPremium: currentKimchiData.kimp?.toFixed(3)
      });
      
      // 비동기로 즉시 병렬 실행
      Promise.all(activeStrategies.map(strategy => executeMockTrade(strategy)));
    }
    
    // 주기적 체크 설정
    if (activeStrategies.length > 0) {
      const interval = setInterval(() => {
        if (currentKimchiData) {
          console.log('⏰ 주기적 자동매매 체크 (2초):', {
            activeStrategies: activeStrategies.length,
            currentPremium: currentKimchiData.kimp?.toFixed(3)
          });
          
          // 비동기로 병렬 실행
          Promise.all(activeStrategies.map(strategy => executeMockTrade(strategy)));
        }
      }, 2000); // 2초마다 체크 (매매 기회 놓치지 않도록)

      return () => clearInterval(interval);
    }
  }, [strategies, currentKimchiData, executeMockTrade]);

  // 잔고 초기화 (안전한 확인 다이얼로그 포함)
  const resetBalance = () => {
    const currentBalance = mockBalance;
    const activePositions = mockPositions.filter(p => p.status === 'open').length;
    
    const confirmMessage = `⚠️ 정말로 잔고를 초기화하시겠습니까?\n\n현재 상태:\n• KRW: ₩${(currentBalance.krw || 0).toLocaleString()}\n• 업비트 BTC: ${(currentBalance.btc || 0).toFixed(6)} BTC\n• 바이낸스 USDT: $${(currentBalance.binanceUsdt || 0).toLocaleString()}\n• 활성 포지션: ${activePositions}개\n\n이 작업은 되돌릴 수 없습니다!`;
    
    if (!confirm(confirmMessage)) {
      return; // 사용자가 취소한 경우
    }
    
    const initialBalance = {
      krw: 100000000, // 1억원
      btc: 10.0, // 10 BTC (업비트)
      usdt: 100000, // 10만 USDT (업비트)
      binanceBtc: 5.0, // 5 BTC (바이낸스 선물)
      binanceSpotBtc: 3.0, // 3 BTC (바이낸스 현물)
      binanceUsdt: 100000 // 10만 USDT (바이낸스)
    };
    setMockBalance(initialBalance);
    setMockTrades([]);
    setMockPositions([]);
    setTradeCounter(0); // 카운터도 초기화
    
    // 로컬스토리지 완전 초기화 (사용자별 키 사용)
    localStorage.removeItem(`mock-balance-${userId}`);
    localStorage.removeItem(`mock-trades-${userId}`);
    localStorage.removeItem(`mock-positions-${userId}`);
    
    console.log('🧹 모의거래 데이터 완전 초기화 완료');
    
    toast({
      title: "🧹 잔고 완전 초기화!",
      description: "💸 모든 거래 기록이 깔끔하게 리셋되었습니다! 새 출발! ✨",
      variant: "destructive"
    });
  };

  // 총 수익률 계산 (실제 잔고 기준)
  const initialBalance = {
    krw: 100000000, // 1억원
    btc: 0, // 업비트 BTC 0 고정
    usdt: 100000, // 10만 USDT
    binanceBtc: 0, // 바이낸스 선물 BTC 0 고정
    binanceSpotBtc: 0 // 바이낸스 현물 BTC 0 고정
  };
  
  // 현재 잔고의 총 가치 계산 (원화 기준)
  const currentBtcPrice = currentKimchiData?.upbit_price || 156000000;
  const currentBinancePrice = currentKimchiData?.binance_price || 112000;
  const currentUsdKrw = currentKimchiData?.usdkrw || 1390;
  
  const currentTotalValue = mockBalance.krw + 
                           (0 * currentBtcPrice) + 
                           (mockBalance.usdt * currentUsdKrw);
  
  const initialTotalValue = initialBalance.krw + 
                           (0 * currentBtcPrice) + 
                           (initialBalance.usdt * currentUsdKrw);
  
  const totalPnl = currentTotalValue - initialTotalValue;
  const profitRate = isFinite(initialTotalValue) && initialTotalValue > 0 
    ? ((totalPnl / initialTotalValue) * 100) 
    : 0;

  // 일일 통계 계산 (useMemo로 최적화)
  const dailyStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = mockTrades.filter(trade => {
      const tradeDate = new Date(trade.timestamp);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate.getTime() === today.getTime();
    });

    const todayPositions = mockPositions.filter(position => {
      const entryDate = new Date(position.entryTime);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    // 거래 통계
    const totalTrades = todayTrades.length;
    const upbitTrades = todayTrades.filter(t => t.exchange === 'upbit').length;
    const binanceTrades = todayTrades.filter(t => t.exchange === 'binance').length;
    
    // 수수료 통계
    const totalFees = todayTrades.reduce((sum, trade) => {
      if (trade.exchange === 'upbit') {
        return sum + trade.fee; // KRW
      } else {
        return sum + (trade.fee * (currentUsdKrw || 1390)); // USDT를 KRW로 변환
      }
    }, 0);

    // 수익 통계 (실제로는 더 복잡한 계산이 필요하지만 간단히)
    const realizedPnl = mockPositions
      .filter(p => p.status === 'closed')
      .reduce((sum, p) => sum + (p.realizedPnl || 0), 0);

    // 활성 포지션 수
    const activePositions = mockPositions.filter(p => p.status === 'open').length;

    return {
      totalTrades,
      upbitTrades,
      binanceTrades,
      totalFees,
      realizedPnl,
      activePositions,
      newPositions: todayPositions.length
    };
  }, [mockTrades, mockPositions, currentUsdKrw]);

  // 일일 통계가 변경될 때 부모 컴포넌트에 전달
  useEffect(() => {
    if (onDailyStatsUpdate) {
      onDailyStatsUpdate(dailyStats);
    }
  }, [dailyStats, onDailyStatsUpdate]);

  // 최근 거래(진입+청산) 10건 (시간 내림차순)
  const recentTrades = useMemo(() => {
    return mockTrades
      .filter(t => ['buy', 'sell', 'short', 'cover'].includes((t.type || '').toLowerCase()))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [mockTrades]);

  // 활성 포지션 합산 수량 (표시용)
  const rawOpenUpbitQty = useMemo(() => {
    return mockPositions
      .filter(p => p.status === 'open')
      .reduce((sum, p) => sum + (Number(p.upbitQuantity) || 0), 0);
  }, [mockPositions]);

  const rawOpenBinanceQty = useMemo(() => {
    return mockPositions
      .filter(p => p.status === 'open')
      .reduce((sum, p) => sum + (Number(p.binanceQuantity) || 0), 0);
  }, [mockPositions]);

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

  return (
    <Card className="bg-slate-850 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          자동 매매 시스템
          <div className="flex gap-2">
            <Button 
              variant={isTrading ? "destructive" : strategies.some(s => s.isActive) ? "default" : "outline"}
              size="sm"
              disabled
            >
              {isTrading ? `🔄 ${isLiveMode ? '실거래' : 'Mock 거래'} 실행 중...` : strategies.some(s => s.isActive) ? `✅ ${strategies.filter(s => s.isActive).length}개 전략 활성 (${isLiveMode ? '실거래' : 'Mock'})` : "❌ 활성 전략 없음"}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                console.log('🔍 === 현재 상태 확인 ===');
                console.log('📊 활성 전략:', strategies.filter(s => s.isActive).length, '개');
                console.log('📊 활성 포지션:', mockPositions.filter(p => p.status === 'open').length, '개');
                console.log('📊 현재 김프율:', currentKimchiData?.kimp?.toFixed(3), '%');
                
                // 각 활성 포지션의 청산 조건 체크
                const activePositions = mockPositions.filter(p => p.status === 'open');
                activePositions.forEach(pos => {
                  const strategy = strategies.find(s => s.id === pos.strategyId);
                  if (strategy) {
                    const exitRate = parseFloat(strategy.takeProfitCondition);
                    const currentPremium = currentKimchiData?.kimp || 0;
                    const shouldExit = exitRate <= currentPremium;
                    console.log(`💰 포지션 ${pos.id}: 익절${exitRate}% ≤ 김프${currentPremium.toFixed(3)}% = ${shouldExit ? '청산가능' : '대기'}`);
                  }
                });
                
                // 강제 자동매매 체크 실행
                if (strategies.filter(s => s.isActive).length > 0) {
                  console.log('🚀 강제 자동매매 체크 실행');
                  Promise.all(strategies.filter(s => s.isActive).map(strategy => executeMockTrade(strategy)));
                }
              }}
            >
              🔍 상태확인
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                // 활성 포지션 전체 청산 (한 번에 모두 처리)
                const activePositions = mockPositions.filter(p => p.status === 'open');
                if (activePositions.length > 0) {
                  const currentKimp = currentKimchiData?.kimp || 0;
                  console.log('🔴 전체 청산 실행: 포지션', activePositions.length, '개');
                  
                  // 모든 활성 포지션을 한 번에 청산 처리
                  const closedPositions = activePositions.map(position => ({
                    ...position,
                    status: 'closed' as const,
                    exitTime: new Date(),
                    realizedPnl: position.unrealizedPnl || 0
                  }));
                  
                  // 상태를 한 번에 업데이트
                  setMockPositions(prev => 
                    prev.map(p => 
                      activePositions.find(ap => ap.id === p.id) 
                        ? closedPositions.find(cp => cp.id === p.id)! 
                        : p
                    )
                  );
                  
                  // 토스트 알림
                  toast({
                    title: "전체 청산 완료",
                    description: `${activePositions.length}개 포지션이 모두 청산되었습니다.`
                  });
                } else {
                  console.log('❌ 청산할 포지션이 없습니다');
                }
              }}
              disabled={!mockPositions.some(p => p.status === 'open')}
            >
              전체 청산
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={resetBalance}
              className="bg-red-600 hover:bg-red-700"
            >
              ⚠️ 잔고 초기화
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        
        {/* 모의 잔고 표시 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h4 className="text-slate-400 text-sm">업비트 KRW</h4>
            <p className="text-xl font-bold text-blue-400">
              ₩{(mockBalance.krw || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h4 className="text-slate-400 text-sm">업비트 BTC</h4>
            <p className="text-xl font-bold text-yellow-400">
              {(openUpbitQty || 0).toFixed(6)} BTC
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h4 className="text-slate-400 text-sm">바이낸스 BTC (선물)</h4>
            <p className="text-xl font-bold text-orange-400">
              {(openBinanceQty || 0).toFixed(6)} BTC
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h4 className="text-slate-400 text-sm">바이낸스 USDT</h4>
            <p className="text-xl font-bold text-green-400">
              ${(mockBalance.binanceUsdt || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* 수익률 표시 */}
        <div className="bg-slate-800 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-slate-400 text-sm">총 수익률</h4>
            <div className="text-right">
              <p className={`text-xl font-bold ${profitRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitRate >= 0 ? '+' : ''}{isFinite(profitRate) ? profitRate.toFixed(2) : '0.00'}%
              </p>
              <p className={`text-sm ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}₩{isFinite(totalPnl) ? totalPnl.toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>


        {/* 활성 포지션 */}
        <div className="mb-4">
          <h4 className="text-white font-medium mb-2">활성 포지션 ({mockPositions.filter(p => p.status === 'open').length}개)</h4>
          {(() => {
            console.log('🎯 현재 모든 포지션:', mockPositions);
            console.log('🎯 활성 포지션 필터링 결과:', mockPositions.filter(p => p.status === 'open'));
            return null;
          })()}
          
          {/* 포지션이 없을 때 안내 */}
          {mockPositions.filter(p => p.status === 'open').length === 0 && (
            <div className="bg-slate-800 p-3 rounded-lg text-center">
              <p className="text-slate-400 text-sm">전략 조건을 수정해주세요.</p>
            </div>
          )}
          
          {mockPositions.filter(p => p.status === 'open').map(position => {
            const currentPremium = lastKimchiData?.kimp ?? position.entryPremiumRate;
            
            // 김프 상승 시 수익이 +로 보이도록: 김프 차이 기반 근사 PnL (진입가 기준 노출)
            const premiumDelta = (currentPremium - position.entryPremiumRate); // 상승(+)
            const baseNotionalKRW = position.upbitQuantity * position.upbitPrice; // 진입 시 원화 노출 기준
            // 진입 수수료 + (예상) 청산 수수료까지 반영
            const currentUpbitPriceEst = lastKimchiData?.upbit_price || position.upbitPrice;
            const currentBinancePriceEst = lastKimchiData?.binance_price || position.binancePrice;
            const usdKrwEst = lastKimchiData?.usdkrw || position.entryUsdKrw || 1390;
            const entryUpbitBuyFee = (position.upbitQuantity * position.upbitPrice) * 0.0005;
            const entryBinanceShortFeeKRW = (position.binanceQuantity * position.binancePrice * 0.0004) * usdKrwEst;
            const estUpbitSellFee = (position.upbitQuantity * currentUpbitPriceEst) * 0.0005;
            const estBinanceCoverFeeKRW = (position.binanceQuantity * currentBinancePriceEst * 0.0004) * usdKrwEst;
            const unrealizedGross = (premiumDelta / 100) * baseNotionalKRW;
            const unrealizedPnl = unrealizedGross - (entryUpbitBuyFee + entryBinanceShortFeeKRW + estUpbitSellFee + estBinanceCoverFeeKRW);
            
            // 김프율 변화 방향 계산
            const premiumChange = currentPremium - position.entryPremiumRate;
            const isRising = premiumChange > 0;
            const isFalling = premiumChange < 0;
            
            return (
              <div key={position.id} className="bg-slate-800 p-3 rounded-lg mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium">
                      {strategies.find(s => s.id === position.strategyId)?.name || 'Unknown'}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${
                        isRising ? 'text-red-400' : 
                        isFalling ? 'text-blue-400' : 
                        ''
                      }`}
                    >
                      {position.entryPremiumRate.toFixed(3)}% → {currentPremium.toFixed(3)}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={`font-bold ${unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {unrealizedPnl >= 0 ? '+' : ''}₩{unrealizedPnl.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">
                        업비트: {position.upbitQuantity.toFixed(6)} BTC
                      </p>
                      <p className="text-xs text-slate-400">
                        바이낸스 선물: {position.binanceQuantity.toFixed(6)} BTC (숏) × {position.leverage}배
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs px-2 py-1 h-6"
                        onClick={() => mockExit(position, currentPremium, 0.5)}
                      >
                        반절청산
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="text-xs px-2 py-1 h-6"
                        onClick={() => mockExit(position, currentPremium, 1.0)}
                      >
                        전체청산
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 실시간 거래 로그 */}
        {tradingLogs.length > 0 && (
          <div className="mb-4">
            <h4 className="text-white font-medium mb-2">실시간 거래 로그</h4>
            <div className="bg-slate-900 p-3 rounded-lg max-h-32 overflow-y-auto">
              {tradingLogs.map((log, index) => (
                <div key={index} className="text-xs text-green-400 font-mono mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 최근 거래 기록 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium">최근 거래 ({recentTrades.length}건)</h4>
            <div className="text-xs text-slate-400">
              <span className="text-blue-400">BUY💙</span> (업비트) | 
              <span className="text-yellow-400">SELL💛</span> (업비트) | 
              <span className="text-red-400">SHORT❤️</span> (바이낸스 선물) | 
              <span className="text-green-400">COVER💚</span> (바이낸스 선물)
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {recentTrades.length === 0 ? (
              <div className="bg-slate-800 p-3 rounded-lg text-center">
                <p className="text-slate-400 text-sm">거래 기록이 없습니다</p>
              </div>
            ) : (
              recentTrades.map(trade => {
                const strategy = strategies.find(s => s.id === trade.strategyId);
                return (
                  <div key={trade.id} className="bg-slate-700 p-2 rounded mb-1 text-xs border border-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-white">
                        {new Date(trade.timestamp).toLocaleTimeString()} | <span className="font-bold">{trade.exchange}</span> | <span className={`${
                          trade.type === 'buy' ? 'text-blue-400' : 
                          trade.type === 'sell' ? 'text-yellow-400' :
                          trade.type === 'short' ? 'text-red-400' :
                          'text-green-400'
                        } font-bold`}>{trade.type?.toUpperCase() || 'UNKNOWN'}</span>
                        {strategy && (
                          <span className="text-purple-400 ml-2">
                            [{strategy.name}]
                          </span>
                        )}
                      </span>
                      <span className={`font-medium ${
                        trade.type === 'buy' ? 'text-blue-400' : 
                        trade.type === 'sell' ? 'text-yellow-400' :
                        trade.type === 'short' ? 'text-red-400' :
                        'text-green-400'
                      }`}>
                        {(Number(trade.quantity) || 0).toFixed(6)} BTC @ {(Number(trade.price) || 0).toLocaleString()}
                        {trade.exchange === 'binance' && (trade.type === 'short' || trade.type === 'cover') && ' (선물)'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
