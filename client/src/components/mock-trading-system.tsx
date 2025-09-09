import React, { useState, useEffect, useCallback } from 'react';
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
const saveMockTradeToDB = async (trade: MockTrade, userId: string) => {
  try {
    await apiFetch(`/api/mock-trades/${userId}`, {
      method: 'POST',
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
        premiumRate: trade.premiumRate
      })
    });
    console.log('✅ Mock 거래 DB 저장 성공:', trade.id);
  } catch (error) {
    console.error('❌ Mock 거래 DB 저장 실패:', error);
  }
};

const saveMockPositionToDB = async (position: MockPosition, userId: string) => {
  try {
    await apiFetch(`/api/mock-positions/${userId}`, {
      method: 'POST',
      body: JSON.stringify({
        id: position.id,
        strategyId: position.strategyId,
        symbol: position.symbol,
        entryTime: position.entryTime.toISOString(),
        entryPremiumRate: position.entryPremiumRate,
        upbitQuantity: position.upbitQuantity,
        upbitPrice: position.upbitPrice,
        binanceSpotQuantity: position.binanceSpotQuantity,
        binanceQuantity: position.binanceQuantity,
        binancePrice: position.binancePrice,
        leverage: position.leverage,
        status: position.status,
        unrealizedPnl: position.unrealizedPnl,
        realizedPnl: position.realizedPnl
      })
    });
    console.log('✅ Mock 포지션 DB 저장 성공:', position.id);
  } catch (error) {
    console.error('❌ Mock 포지션 DB 저장 실패:', error);
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
  binanceSpotQuantity: number;
  binanceQuantity: number;
  binancePrice: number;
  leverage: number;
  status: 'open' | 'closed';
  unrealizedPnl: number;
  realizedPnl: number;
}

interface MockTradingSystemProps {
  strategies: any[];
  currentKimchiData: any;
  userId?: string;
}

export const MockTradingSystem: React.FC<MockTradingSystemProps> = ({ 
  strategies, 
  currentKimchiData,
  userId = "1" // 기본 사용자 ID
}) => {
  const { toast } = useToast();
  
  // 유니크한 거래 ID 생성을 위한 카운터
  const [tradeCounter, setTradeCounter] = useState(0);
  
  // 모의 잔고 (로컬스토리지 저장)
  const [mockBalance, setMockBalance] = useState<MockBalance>(() => {
    const saved = localStorage.getItem('mock-balance');
    if (saved) {
      const parsedBalance = JSON.parse(saved);
      // 기존 데이터에 binanceBtc가 없으면 기본값 설정
      return {
        krw: parsedBalance.krw || 100000000,
        btc: parsedBalance.btc || 10.0,
        usdt: parsedBalance.usdt || 100000,
        binanceBtc: parsedBalance.binanceBtc || 5.0, // 기본값 5 BTC (선물)
        binanceSpotBtc: parsedBalance.binanceSpotBtc || 3.0 // 기본값 3 BTC (현물)
      };
    }
    return {
      krw: 100000000, // 1억원
      btc: 10.0, // 10 BTC (업비트)
      usdt: 100000, // 10만 USDT
      binanceBtc: 5.0, // 5 BTC (바이낸스 선물)
      binanceSpotBtc: 3.0 // 3 BTC (바이낸스 현물)
    };
  });

  // 모의 거래 기록
  const [mockTrades, setMockTrades] = useState<MockTrade[]>(() => {
    const saved = localStorage.getItem('mock-trades');
    return saved ? JSON.parse(saved) : [];
  });

  // 모의 포지션
  const [mockPositions, setMockPositions] = useState<MockPosition[]>(() => {
    const saved = localStorage.getItem('mock-positions');
    const positions = saved ? JSON.parse(saved) : [];
    console.log('🎯 로컬 스토리지 포지션 로드:', positions);
    console.log('🎯 활성 포지션 개수:', positions.filter((p: MockPosition) => p.status === 'open').length);
    return positions;
  });

  // 모의 거래 실행 중 상태
  const [isTrading, setIsTrading] = useState(false);
  const [lastToastMessage, setLastToastMessage] = useState('');

  // 로컬스토리지에 저장
  useEffect(() => {
    localStorage.setItem('mock-balance', JSON.stringify(mockBalance));
  }, [mockBalance]);

  useEffect(() => {
    localStorage.setItem('mock-trades', JSON.stringify(mockTrades));
  }, [mockTrades]);

  useEffect(() => {
    localStorage.setItem('mock-positions', JSON.stringify(mockPositions));
  }, [mockPositions]);

  // 김치프리미엄 기반 모의 거래 실행
  const executeMockTrade = useCallback(async (strategy: any) => {
    if (!currentKimchiData || isTrading) return;

    const currentPremium = currentKimchiData.kimp || 0;
    const entryRate = parseFloat(strategy.entryCondition);
    const exitRate = parseFloat(strategy.takeProfitCondition);

    // 기존 포지션 확인
    const existingPosition = mockPositions.find(p => 
      p.strategyId === strategy.id && p.status === 'open'
    );

    // 정확한 일치 전략 (=== 조건)
    const tolerance = parseFloat(strategy.tolerance || TRADING_CONSTANTS.DEFAULT_TOLERANCE); // 사용자 설정 허용 오차
    
    // 스크롤2 전략 특별 조건 (더 높은 진입조건)
    const isScroll2 = strategy.name === '스크롤2';
    const minKimchiRate = 5.0; // 최소 김프율 조건 (더 높게 설정)
    
    if (!existingPosition && Math.abs(currentPremium - entryRate) <= tolerance) {
      // 진입 조건 정확히 일치 - 새 포지션 생성
      console.log(`🎯 정확 진입 조건: ${strategy.name} - 김프 ${currentPremium.toFixed(3)}% ≈ ${entryRate}% (오차: ${Math.abs(currentPremium - entryRate).toFixed(3)}%)`);
      await mockEntry(strategy, currentPremium);
    } else if (existingPosition && Math.abs(currentPremium - exitRate) <= tolerance) {
      // 청산 조건 정확히 일치 - 포지션 청산
      console.log(`🎯 정확 청산 조건: ${strategy.name} - 김프 ${currentPremium.toFixed(3)}% ≈ ${exitRate}% (오차: ${Math.abs(currentPremium - exitRate).toFixed(3)}%)`);
      await mockExit(existingPosition, currentPremium);
    }
    
    // 디버깅: 조건 확인 (더 명확한 로그)
    const entryDiff = Math.abs(currentPremium - entryRate);
    console.log(`\n🔍 ===== ${strategy.name} 조건 확인 =====`);
    console.log(`📈 현재 김프율: ${currentPremium.toFixed(3)}%`);
    console.log(`🎯 진입 조건: ${entryRate}%`);
    console.log(`📏 차이: ${entryDiff.toFixed(3)}%`);
    console.log(`⚖️ 허용 오차: ${tolerance}%`);
    console.log(`🔍 조건: ${entryDiff.toFixed(3)}% <= ${tolerance}%`);
    
    // 스크롤2 전략 특별 확인
    if (strategy.name === '스크롤2') {
      console.log(`🚨 스크롤2 전략 특별 확인!`);
      console.log(`🚨 스크롤2 진입 조건: ${entryRate}%`);
      console.log(`🚨 스크롤2 허용 오차: ${tolerance}%`);
      console.log(`🚨 스크롤2 현재 김프율: ${currentPremium.toFixed(3)}%`);
      console.log(`🚨 스크롤2 차이: ${entryDiff.toFixed(3)}%`);
      console.log(`🚨 스크롤2 진입 가능: ${entryDiff <= tolerance ? 'YES' : 'NO'}`);
    }
    
    if (!existingPosition) {
      if (entryDiff <= tolerance) {
        console.log(`✅ 진입 조건 만족! 거래 실행 가능`);
      } else {
        console.log(`❌ 진입 조건 불만족 - 대기 중`);
      }
    } else {
      console.log(`📋 기존 포지션 존재 - 진입 불가`);
      const exitDiff = Math.abs(currentPremium - exitRate);
      console.log(`🎯 청산 조건: ${exitRate}% (차이: ${exitDiff.toFixed(3)}%)`);
      if (exitDiff <= tolerance) {
        console.log(`✅ 청산 조건 만족!`);
      } else {
        console.log(`❌ 청산 조건 불만족 - 대기 중`);
      }
    }
    console.log(`===============================\n`);
    // 그 외에는 대기 (정확한 조건 만족 시에만 거래)
  }, [currentKimchiData, isTrading, mockPositions, mockBalance, toast]);

  // 모의 진입
  const mockEntry = async (strategy: any, premiumRate: number) => {
    setIsTrading(true);
    
    try {
      const baseAmount = parseFloat(strategy.investmentAmount); // 기준 BTC 수량
      const leverage = parseInt(strategy.leverage);
      const upbitPrice = currentKimchiData.upbit_price || 156000000;
      const binancePrice = currentKimchiData.binance_price || 112000;

      // 1. 바이낸스 선물 숏 포지션 (기준 수량)
      const binanceShortAmount = baseAmount; // 기준 수량 (숏)
      const binanceMargin = (binanceShortAmount * binancePrice) / leverage; // 증거금
      const binanceFee = binanceShortAmount * binancePrice * 0.0004; // 0.04% 수수료

      // 2. 업비트 현물 매수 (바이낸스 USD 수량 × 레버리지 × 환율을 원화로)
      const usdKrwRate = currentKimchiData.usdkrw || 1390; // 환율
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
            title: "KRW 부족",
            description: errorMsg,
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
        const errorMsg = `증거금 부족: 필요 $${(binanceMargin + binanceFee).toFixed(2)}, 보유 $${mockBalance.usdt.toLocaleString()}`;
        if (lastToastMessage !== errorMsg) {
          setLastToastMessage(errorMsg);
          toast({
            title: "증거금 부족", 
            description: errorMsg,
            variant: "destructive"
          });
        }
        return;
      }

      // 잔고 변경
      setMockBalance(prev => ({
        ...prev,
        krw: prev.krw - totalUpbitCost, // 업비트 매수로 KRW 감소
        btc: prev.btc + upbitBuyAmountBTC, // 업비트 매수로 BTC 증가
        usdt: prev.usdt - binanceMargin - binanceFee, // 바이낸스 증거금 차감
        binanceBtc: (prev.binanceBtc || 5.0) - binanceShortAmount // 바이낸스 숏 포지션으로 BTC 감소
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
          premiumRate
        }
      ];

      setMockTrades(prev => [...prev, ...newTrades]);

      // DB에 거래 기록 저장
      newTrades.forEach(trade => {
        saveMockTradeToDB(trade, userId);
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
        binanceSpotQuantity: 0, // 바이낸스 현물 수량 (기본값 0)
        binanceQuantity: binanceShortAmount, // 숏 수량
        binancePrice,
        leverage,
        status: 'open',
        unrealizedPnl: 0,
        realizedPnl: 0
      };

      setMockPositions(prev => [...prev, newPosition]);
      
      // DB에 포지션 저장
      saveMockPositionToDB(newPosition, userId);

      toast({
        title: "모의 진입 완료",
        description: `${strategy.name} - 김프율 ${premiumRate.toFixed(3)}%에서 진입`,
      });

      console.log('✅ 모의 진입 완료:', {
        strategy: strategy.name,
        premium: premiumRate,
        upbitCost: totalUpbitCost,
        binanceMargin: binanceMargin
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
  };

  // 모의 청산
  const mockExit = async (position: MockPosition, premiumRate: number, ratio: number = 1.0) => {
    setIsTrading(true);

    try {
      const currentUpbitPrice = currentKimchiData.upbit_price || 156000000;
      const currentBinancePrice = currentKimchiData.binance_price || 112000;

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

      // PnL 계산
      const upbitPnl = netUpbitRevenue; // 업비트 매도 수익
      const binancePnl = binanceMarginReturn - binanceCoverCost - binanceFee; // 숏 포지션 손익 (USD)
      const binancePnlKRW = binancePnl * (currentKimchiData.usdkrw || 1390);
      const totalPnl = upbitPnl + binancePnlKRW;

      console.log('💰 청산 시 잔고 변화:', {
        binanceCloseQuantity,
        currentBinanceBtc: mockBalance.binanceBtc,
        newBinanceBtc: (mockBalance.binanceBtc || 5.0) + binanceCloseQuantity
      });

      // 잔고 업데이트
      setMockBalance(prev => ({
        ...prev,
        krw: prev.krw + netUpbitRevenue, // 업비트 매도 수익 추가
        btc: prev.btc - upbitSellQuantity, // 매도한 BTC 차감
        usdt: prev.usdt + binanceMarginReturn - binanceCoverCost - binanceFee, // 증거금 회수 - 청산 비용
        binanceBtc: (prev.binanceBtc || 5.0) + binanceCloseQuantity // 바이낸스 숏 커버로 BTC 증가
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
          premiumRate
        }
      ];

      setMockTrades(prev => [...prev, ...exitTrades]);

      // DB에 청산 거래 기록 저장
      exitTrades.forEach(trade => {
        saveMockTradeToDB(trade, userId);
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
      
      // DB에 포지션 업데이트 저장
      const updatedPosition = updatedPositions.find(p => p.id === position.id);
      if (updatedPosition) {
        updateMockPositionInDB(updatedPosition, userId);
      }

      const profitColor = totalPnl >= 0 ? "" : "destructive";
      toast({
        title: "모의 청산 완료",
        description: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}원 ${totalPnl >= 0 ? '수익' : '손실'}`,
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
  };

  // 김프 데이터 변경 시 즉시 매매 체크
  useEffect(() => {
    if (currentKimchiData && !isTrading) {
      const activeStrategies = strategies.filter(s => s.isActive);
      
      if (activeStrategies.length > 0) {
        console.log('⚡ 실시간 김프 변경 감지 - 즉시 매매 체크:', {
          currentPremium: currentKimchiData.kimp?.toFixed(3),
          activeStrategies: activeStrategies.length
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
    if (activeStrategies.length > 0 && currentKimchiData && !isTrading) {
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
        if (currentKimchiData && !isTrading) {
          console.log('⏰ 주기적 자동매매 체크 (30초):', {
            activeStrategies: activeStrategies.length,
            currentPremium: currentKimchiData.kimp?.toFixed(3)
          });
          
          // 비동기로 병렬 실행
          Promise.all(activeStrategies.map(strategy => executeMockTrade(strategy)));
        }
      }, 2000); // 2초마다 체크 (매매 기회 놓치지 않도록)

      return () => clearInterval(interval);
    }
  }, [strategies, currentKimchiData, isTrading, executeMockTrade]);

  // 잔고 초기화
  const resetBalance = () => {
    const initialBalance = {
      krw: 100000000, // 1억원
      btc: 10.0, // 10 BTC (업비트)
      usdt: 100000, // 10만 USDT
      binanceBtc: 5.0, // 5 BTC (바이낸스 선물)
      binanceSpotBtc: 3.0 // 3 BTC (바이낸스 현물)
    };
    setMockBalance(initialBalance);
    setMockTrades([]);
    setMockPositions([]);
    setTradeCounter(0); // 카운터도 초기화
    
    // 로컬스토리지 완전 초기화
    localStorage.removeItem('mock-balance');
    localStorage.removeItem('mock-trades');
    localStorage.removeItem('mock-positions');
    
    console.log('🧹 모의거래 데이터 완전 초기화 완료');
    
    toast({
      title: "모의 잔고 초기화",
      description: "KRW 1억원, 업비트 BTC 10개, USDT 10만달러, 바이낸스 BTC 5개(선물), 바이낸스 BTC 3개(현물)로 초기화되었습니다."
    });
  };

  // 총 수익률 계산 (실제 잔고 기준)
  const initialBalance = {
    krw: 100000000, // 1억원
    btc: 10.0, // 10 BTC (업비트)
    usdt: 100000, // 10만 USDT
    binanceBtc: 5.0, // 5 BTC (바이낸스 선물)
    binanceSpotBtc: 3.0 // 3 BTC (바이낸스 현물)
  };
  
  // 현재 잔고의 총 가치 계산 (원화 기준)
  const currentBtcPrice = currentKimchiData?.upbit_price || 156000000;
  const currentBinancePrice = currentKimchiData?.binance_price || 112000;
  const currentUsdKrw = currentKimchiData?.usdkrw || 1390;
  
  const currentTotalValue = mockBalance.krw + 
                           (mockBalance.btc * currentBtcPrice) + 
                           (mockBalance.usdt * currentUsdKrw) +
                           ((mockBalance.binanceBtc || 0) * currentBinancePrice * currentUsdKrw) +
                           ((mockBalance.binanceSpotBtc || 0) * currentBinancePrice * currentUsdKrw);
  
  const initialTotalValue = initialBalance.krw + 
                           (initialBalance.btc * currentBtcPrice) + 
                           (initialBalance.usdt * currentUsdKrw) +
                           (initialBalance.binanceBtc * currentBinancePrice * currentUsdKrw) +
                           (initialBalance.binanceSpotBtc * currentBinancePrice * currentUsdKrw);
  
  const totalPnl = currentTotalValue - initialTotalValue;
  const profitRate = ((totalPnl / initialTotalValue) * 100);

  return (
    <Card className="bg-slate-850 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          🎮 모의 거래 시스템
          <div className="flex gap-2">
            <Button 
              variant={isTrading ? "destructive" : strategies.some(s => s.isActive) ? "default" : "outline"}
              size="sm"
              disabled
            >
              {isTrading ? "거래 중..." : strategies.some(s => s.isActive) ? `${strategies.filter(s => s.isActive).length}개 전략 활성` : "활성 전략 없음"}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                console.log('🧪 강제 진입 테스트');
                if (strategies.length > 0) {
                  const strategy = strategies[0];
                  console.log('🧪 강제 진입:', strategy.name);
                  mockEntry(strategy, 3.0); // 강제로 3% 김프율에서 진입
                } else {
                  console.log('❌ 전략이 없습니다');
                }
              }}
            >
              강제 진입
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // 테스트 포지션 생성
                const testCounter = tradeCounter + 1;
                setTradeCounter(testCounter);
                const testRandomId = Math.random().toString(36).substring(2, 8);
                const testPosition: MockPosition = {
                  id: `test-position-${Date.now()}-${testCounter}-${testRandomId}`,
                  strategyId: strategies[0]?.id || 'test',
                  symbol: 'BTC',
                  entryTime: new Date(),
                  entryPremiumRate: 3.0,
                  upbitQuantity: 0.006,
                  upbitPrice: 156000000,
                  binanceSpotQuantity: 0.001,
                  binanceQuantity: 0.002,
                  binancePrice: 112000,
                  leverage: 3,
                  status: 'open',
                  unrealizedPnl: 0,
                  realizedPnl: 0
                };
                
                setMockPositions(prev => [...prev, testPosition]);
                toast({
                  title: "테스트 포지션 생성",
                  description: "청산 버튼 테스트를 위한 포지션을 생성했습니다."
                });
              }}
            >
              테스트 포지션 생성
            </Button>
            <Button variant="outline" size="sm" onClick={resetBalance}>
              잔고 초기화
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
              ₩{mockBalance.krw.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h4 className="text-slate-400 text-sm">업비트 BTC</h4>
            <p className="text-xl font-bold text-yellow-400">
              {mockBalance.btc.toFixed(6)} BTC
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h4 className="text-slate-400 text-sm">바이낸스 BTC (선물)</h4>
            <p className="text-xl font-bold text-orange-400">
              {(mockBalance.binanceBtc || 0).toFixed(6)} BTC
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h4 className="text-slate-400 text-sm">바이낸스 USDT</h4>
            <p className="text-xl font-bold text-green-400">
              ${mockBalance.usdt.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 수익률 표시 */}
        <div className="bg-slate-800 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-slate-400 text-sm">총 수익률</h4>
            <div className="text-right">
              <p className={`text-xl font-bold ${profitRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
              </p>
              <p className={`text-sm ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}₩{totalPnl.toLocaleString()}
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
              <p className="text-slate-400 text-sm mb-2">활성 포지션이 없습니다</p>
              <p className="text-slate-500 text-xs">전략을 활성화하거나 "테스트 포지션 생성"을 클릭하세요</p>
            </div>
          )}
          
          {mockPositions.filter(p => p.status === 'open').map(position => {
            const currentPremium = currentKimchiData?.kimp || 0;
            const unrealizedPnl = ((currentKimchiData?.upbit_price || 0) - position.upbitPrice) * position.upbitQuantity;
            
            return (
              <div key={position.id} className="bg-slate-800 p-3 rounded-lg mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium">
                      {strategies.find(s => s.id === position.strategyId)?.name || 'Unknown'}
                    </span>
                    <Badge variant="outline" className="ml-2">
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

        {/* 최근 거래 기록 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium">최근 거래 ({mockTrades.length}건)</h4>
            <div className="text-xs text-slate-400">
              <span className="text-blue-400">BUY💙</span> (업비트) | 
              <span className="text-yellow-400">SELL💛</span> (업비트) | 
              <span className="text-red-400">SHORT❤️</span> (바이낸스 선물) | 
              <span className="text-green-400">COVER💚</span> (바이낸스 선물)
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {mockTrades.length === 0 ? (
              <div className="bg-slate-800 p-3 rounded-lg text-center">
                <p className="text-slate-400 text-sm">거래 기록이 없습니다</p>
                <p className="text-slate-500 text-xs">전략을 활성화하면 자동으로 거래가 시작됩니다</p>
              </div>
            ) : (
              mockTrades.slice(-10).reverse().map(trade => (
                <div key={trade.id} className="bg-slate-700 p-2 rounded mb-1 text-xs border border-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-white">
                      {new Date(trade.timestamp).toLocaleTimeString()} | <span className="font-bold">{trade.exchange}</span> | <span className={`${
                        trade.type === 'buy' ? 'text-blue-400' : 
                        trade.type === 'sell' ? 'text-yellow-400' :
                        trade.type === 'short' ? 'text-red-400' :
                        'text-green-400'
                      } font-bold`}>{trade.type.toUpperCase()}</span>
                    </span>
                    <span className={`font-medium ${
                      trade.type === 'buy' ? 'text-blue-400' : 
                      trade.type === 'sell' ? 'text-yellow-400' :
                      trade.type === 'short' ? 'text-red-400' :
                      'text-green-400'
                    }`}>
                      {trade.quantity.toFixed(6)} BTC @ {trade.price.toLocaleString()}
                      {trade.exchange === 'binance' && (trade.type === 'short' || trade.type === 'cover') && ' (선물)'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
