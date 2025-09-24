import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge"; // 사용하지 않음
import { useToast } from "@/hooks/use-toast";
import { ForceEntryModal } from '@/components/trading/ForceEntryModal';
import { RollbackSettingsModal } from '@/components/trading/RollbackSettingsModal';
import { LivePositionList } from '@/components/trading/LivePositionList';
import { LiveTradeHistory } from '@/components/trading/LiveTradeHistory';
import { LiveBalanceDisplay } from '@/components/trading/LiveBalanceDisplay';
import { logClientTradingMode } from '@/config/trading-config';
import { formatKoreanTime } from '@/utils/datetime';
import { calculatePositionPnL } from '@/utils/pnl-calculator';

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

// 거래 저장 함수들
const saveLiveTradeToDB = async (trade: LiveTrade, userId: string, isLiveMode: boolean = false) => {
  if (!isLiveMode) {
    // Mock 모드: 로컬스토리지만 사용 (DB 저장 안함)
    // Mock 거래는 로컬스토리지만 사용
    return;
  }
  
  // 실거래 모드: DB에 저장
  try {
    await apiFetch('/api/live-trades', {
      method: 'POST',
      credentials: 'include',
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
        isMock: false, // 실거래는 항상 false
        strategyName: trade.strategyName || 'Unknown'
      })
    });
    // 실거래 DB 저장 성공
  } catch (error) {
    console.error(`❌ 실거래 DB 저장 실패:`, error);
  }
};

const saveLivePositionToDB = async (position: LivePosition, userId: string, isLiveMode: boolean = false) => {
  if (!isLiveMode) {
    // Mock 모드: 로컬스토리지만 사용 (DB 저장 안함)
    // Mock 포지션은 로컬스토리지만 사용
    return;
  }
  
  // 실거래 모드: DB에 저장
  try {
    await apiFetch('/api/live-positions', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        ...position,
        userId: parseInt(userId),
        entryTime: position.entryTime.toISOString(),
        isMock: false // 실거래는 항상 false
      })
    });
    // 실거래 포지션 DB 저장 성공
  } catch (error) {
    console.error('❌ 실거래 포지션 DB 저장 실패:', error);
  }
};

const updateLivePositionInDB = async (position: LivePosition, userId: string, isLiveMode: boolean = false) => {
  if (!isLiveMode) {
    // Mock 모드: DB 업데이트 안함
    // Mock 포지션 업데이트는 로컬스토리지만 사용
    return;
  }
  
  // 실거래 모드: DB 업데이트
  try {
    await apiFetch(`/api/live-positions/${position.id}`, {
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify({
        status: position.status,
        unrealizedPnl: position.unrealizedPnl,
        realizedPnl: position.realizedPnl
      })
    });
    // 실거래 포지션 DB 업데이트 성공
  } catch (error) {
    console.error('❌ 실거래 포지션 DB 업데이트 실패:', error);
  }
};

// Live 거래 타입 정의
interface LiveBalance {
  krw: number;
  btc: number;
  usdt: number;
  binanceBtc: number;
  binanceSpotBtc: number;
  binanceUsdt: number; // 바이낸스 USDT
}

interface LiveTrade {
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

interface LivePosition {
  id: string;
  strategyId: string;
  strategyName?: string;
  symbol: string;
  type?: string; // 포지션 타입 (force_entry 등)
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
  upbitOrderId?: string; // 실제 업비트 주문 ID
  binanceOrderId?: string; // 실제 바이낸스 주문 ID
  isRealTrade?: boolean; // 실거래 여부
}

interface KimchiData {
  kimp: number;
  upbit_price: number;
  binance_price: number;
  usdkrw: number;
  isRealTimeValid?: boolean;
  dataAge?: number;
}

interface LiveTradingSystemProps {
  strategies: any[];
  setStrategies?: (strategies: any[]) => void; // 전략 복원을 위해 추가
  currentKimchiData: KimchiData | null;
  userId?: string;
  onDailyStatsUpdate?: (stats: any) => void;
  isLiveMode?: boolean; // 실거래 모드 여부
  liveBalances?: any; // 실제 잔고 데이터 (실거래 모드용)
  onStrategyStatsUpdate?: (stats: Record<string, { executionCount: number; realizedPnlKRW: number; investedKRW: number; profitRate: number; }>) => void;
  isLoadingStrategies?: boolean; // 전략 로딩 상태
  strategiesError?: string | null; // 전략 로딩 에러
}

export const LiveTradingSystem: React.FC<LiveTradingSystemProps> = ({ 
  strategies, 
  setStrategies,
  currentKimchiData,
  userId = "1", // 기본 사용자 ID
  onDailyStatsUpdate,
  isLiveMode = false, // 기본값은 Mock 모드
  liveBalances, // 실제 잔고 데이터
  onStrategyStatsUpdate,
  isLoadingStrategies = false,
  strategiesError = null
}) => {
  const { toast } = useToast();
  
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
  
  // 롤백 설정 모달 상태
  const [showRollbackSettingsModal, setShowRollbackSettingsModal] = useState(false);
  const [tradeRefreshTrigger, setTradeRefreshTrigger] = useState(0); // DB 거래 기록 새로고침 트리거
  
  // 토글 방지용: 최소 보유시간
  const MIN_HOLD_MS = 30_000; // 진입 후 최소 보유 30초
  // const EXIT_EXTRA = 0.2;     // 청산은 허용오차보다 0.2% 더 엄격 (사용하지 않음)
  const COOLDOWN_MS = 800;    // 동일 전략 연속 액션 쿨다운(민감도 향상)
  const lastActionAtRef = useRef<Record<string, number>>({});
  const prevPremiumRef = useRef<number | null>(null); // 임계값 교차 감지용 이전 김프
  // 원자적 거래 처리: 거래 잠금 시스템
  const tradingLockRef = useRef<boolean>(false);
  const processingEntryRef = useRef<Set<string>>(new Set());
  // 재진입 차단 토스트 중복 억제
  const lastReentryToastAtRef = useRef<number>(0);
  const REENTRY_TOAST_INTERVAL_MS = 10000; // 10초 이내 중복 차단
  

  // 거래 잔고 (실거래: 실제 잔고 사용, Mock: 로컬스토리지)
  const [liveBalance, setLiveBalance] = useState<LiveBalance>(() => {
    // 실거래 모드: 실제 거래소 잔고 사용 (로컬스토리지 무시)
    if (isLiveMode) {
      // 실거래 모드: 실제 거래소 잔고 사용
      return {
        krw: 0, // 실제 잔고는 liveBalances에서 가져옴
        btc: 0,
        usdt: 0,
        binanceBtc: 0,
        binanceSpotBtc: 0,
        binanceUsdt: 0
      };
    }
    
    // Mock 모드: 간단한 기본 잔고
    console.log('🧪 Mock 모드: 기본 잔고 사용');
    
    // Mock 모드 기본 잔고
    return {
      krw: 100000000,
      btc: 0,
      usdt: 100000,
      binanceBtc: 0,
      binanceSpotBtc: 0,
      binanceUsdt: 100000
    };
  });

  // Live 거래 기록 (실거래: DB에서 조회, Mock: 간단한 로컬 저장)
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>(() => {
    // 실거래 모드: DB에서 조회하므로 빈 배열로 시작
    if (isLiveMode) {
      // 실거래 모드: 거래 기록은 DB에서 조회
      return [];
    }
    
    // Mock 모드: 간단한 로컬스토리지 사용
    try {
      const storageKey = `live-trades-${userId}`;
      const saved = localStorage.getItem(storageKey);
      
      console.log('🔄 liveTrades 초기화 (강화):', {
        userId,
        storageKey,
        hasSavedData: !!saved,
        savedData: saved,
        savedDataType: typeof saved,
        savedDataLength: saved?.length
      });

      // 저장된 데이터가 있고 빈 문자열이 아닌 경우
      if (saved && saved.trim() !== '' && saved !== '[]' && saved !== 'null' && saved !== 'undefined') {
        try {
          const parsed = JSON.parse(saved);
          
          // 배열이고 요소가 있는 경우
          if (Array.isArray(parsed) && parsed.length > 0) {
            // 각 거래 객체가 유효한지 검증
            const validTrades = parsed.filter(trade => 
              trade && 
              typeof trade === 'object' && 
              trade.id && 
              trade.type && 
              trade.exchange
            );
            
            if (validTrades.length > 0) {
              // 거래 기록 로드 성공
              return validTrades;
            }
          }
        } catch (parseError) {
          console.error('❌ 거래 기록 파싱 실패:', parseError, saved);
        }
      }
      
      console.log('📭 유효한 저장된 거래 기록 없음');
      return [];
    } catch (error) {
      console.error('❌ liveTrades 초기화 전체 실패:', error);
      return [];
    }
  });

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
  
  // 모든 디바이스에서 DB 포지션만 사용 (PC/모바일 통일)
  useEffect(() => {
    if (userId) {
      const fetchDbPositions = async () => {
        try {
          console.log('🔍 DB 포지션 조회 중... (PC/모바일 통일, 로컬스토리지 미사용)');
          const response = await fetch('/api/positions', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const dbPositions = await response.json();
            console.log('📊 DB 포지션 조회 결과:', dbPositions);
            
            // DB 포지션을 LivePosition 형태로 변환
            const convertedPositions: LivePosition[] = dbPositions.map((pos: any) => {
              console.log('🔍 포지션 변환:', { id: pos.id, strategy_id: pos.strategy_id, strategy_name: pos.strategy_name });
              return {
                id: `db-${pos.id}`,
                strategyId: pos.strategy_id,
                strategyName: pos.strategy_name || `전략 #${pos.strategy_id}`,
                symbol: pos.symbol,
              entryTime: new Date(pos.entry_time),
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
            console.log('✅ DB 포지션을 LivePosition으로 변환 완료:', convertedPositions.length, '개');
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
    }
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
          
          console.log('✅ 업비트 BTC 잔고 정확히 수정:', currentUpbitBtc, '→', totalUpbitBtc);
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
                  console.log('📋 활성 포지션 전략 복원:', originalStrategy.name);
                }
              }
            });
            
            if (restoredStrategies.length > 0) {
              const allStrategies = [...strategies, ...restoredStrategies];
              setStrategies(allStrategies);
              localStorage.setItem(`mock-strategies-${userId}`, JSON.stringify(allStrategies));
              console.log('✅ 활성 포지션 전략 자동 복원:', restoredStrategies.length, '개');
            }
          }
        }
        
        if (Math.abs(totalBinanceBtc - currentBinanceBtc) > 0.000001) {
          console.warn('🚨 바이낸스 BTC 잔고 불일치 감지:', {
            활성포지션BTC: totalBinanceBtc,
            현재잔고BTC: currentBinanceBtc,
            차이: totalBinanceBtc - currentBinanceBtc,
            수정필요: true
          });
          
          setLiveBalance(prev => ({
            ...prev,
            binanceBtc: totalBinanceBtc // 활성 포지션과 정확히 일치시킴
          }));
          
          console.log('✅ 바이낸스 BTC 잔고 정확히 수정:', currentBinanceBtc, '→', totalBinanceBtc);
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
        console.log('🚨 전략-포지션 불일치 감지:', {
          포지션전략: positionStrategyIds,
          현재전략: currentStrategyIds,
          누락전략: missingStrategyIds
        });
        
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
                    console.log(`📋 백업에서 원래 전략 발견: ${originalStrategy.name}`);
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
          
          console.log('🔄 전략 자동 복원 완료:', restoredStrategies.length, '개');
          
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
      console.log('🔄 강제 업데이트 이벤트 수신:', event.detail);
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

  // 로컬스토리지에 저장 (사용자별)
  useEffect(() => {
    const storageKey = `live-balance-${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(liveBalance));
  }, [liveBalance, userId]);

  useEffect(() => {
    const storageKey = `mock-trades-${userId}`;
    // 거래 기록 로컬스토리지 저장
    
    // 빈 배열로 덮어쓰는 것을 방지 (기존 데이터가 있는 경우)
    const existing = localStorage.getItem(storageKey);
    if (liveTrades.length === 0 && existing && existing !== '[]' && existing !== 'null') {
      // 빈 배열로 덮어쓰기 방지
      
      // 기존 데이터를 다시 로드하여 상태와 동기화
      try {
        const existingParsed = JSON.parse(existing);
        if (Array.isArray(existingParsed) && existingParsed.length > 0) {
          // 덮어쓰기 방지 중 자동 복원
          setLiveTrades(existingParsed);
        }
      } catch (error) {
        console.error('❌ 덮어쓰기 방지 중 복원 실패:', error);
      }
      return;
    }
    
    localStorage.setItem(storageKey, JSON.stringify(liveTrades));
  }, [liveTrades, userId]);

  useEffect(() => {
    const storageKey = `live-positions-${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(livePositions));
  }, [livePositions, userId]);

  // 거래 로그 추가 함수
  const addTradingLog = useCallback((message: string) => {
    const timestamp = formatKoreanTime();
    const logMessage = `[${timestamp}] ${message}`;
    setTradingLogs(prev => [...prev.slice(-9), logMessage]); // 최근 10개만 유지
  }, []);


  // Live 진입 (원자적 처리)
  const liveEntry = useCallback(async (strategy: any, premiumRate: number) => {
    console.log('🎯 liveEntry 시작:', strategy.name, premiumRate);
    
    // 거래 잠금 확인
    if (tradingLockRef.current) {
      console.warn('⏸️ 다른 거래 진행 중 - 진입 대기');
      return;
    }
    
    try {
      tradingLockRef.current = true; // 거래 잠금
      processingEntryRef.current.add(String(strategy.id));

      if (!currentKimchiData) {
        console.error('❌ currentKimchiData is null in liveEntry');
        return;
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

      console.log('🔥 1단계 - 바이낸스 선물 숏:', {
        binanceShortAmountBTC,
        binancePrice,
        binanceShortValueUSD,
        binanceMargin,
        binanceFee
      });

      // 2단계: 바이낸스 숏 수량에 맞춰 업비트에서 동일한 BTC 수량 매수
      const upbitBuyAmountBTC = binanceShortAmountBTC; // 바이낸스와 동일한 BTC 수량
      const upbitBuyAmountKRW = upbitBuyAmountBTC * upbitPrice; // 업비트 매수 금액 (KRW)
      const upbitFee = upbitBuyAmountKRW * 0.0005; // 업비트 매수 수수료 (0.05%)
      const totalUpbitCost = upbitBuyAmountKRW + upbitFee; // 총 업비트 비용
      
      // 균형 검증 로그
      console.log('⚖️ 포지션 균형 검증:', {
        binanceShortAmountBTC: binanceShortAmountBTC.toFixed(6),
        upbitBuyAmountBTC: upbitBuyAmountBTC.toFixed(6),
        isBalanced: Math.abs(binanceShortAmountBTC - upbitBuyAmountBTC) < 0.000001,
        difference: (binanceShortAmountBTC - upbitBuyAmountBTC).toFixed(8)
      });

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
          console.log('📉 바이낸스 BTC 숏 주문 (1단계):', {
            symbol: 'BTCUSDT',
            quantity: binanceShortAmountBTC,
            leverage: leverage
          });
          
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
          console.log('✅ 바이낸스 숏 주문 성공 (1단계 완료):', binanceOrderId);
          
          // 2. 바이낸스 성공 후 업비트 BTC 매수 주문
          console.log('📈 업비트 BTC 매수 주문 (2단계):', {
            symbol: 'BTC',
            quantity: upbitBuyAmountBTC,
            estimatedCost: totalUpbitCost
          });
          
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
          console.log('✅ 업비트 매수 주문 성공 (2단계 완료):', upbitOrderId);
          
          console.log('🎉 실거래 주문 모두 완료! (바이낸스 → 업비트)', { binanceOrderId, upbitOrderId });
          
          // 🔄 거래 완료 후 즉시 잔고 새로고침 (React Query 캐시 무효화)
          setTimeout(async () => {
            try {
              // 잔고 관련 캐시 무효화
              await fetch('/api/v2/balance/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ forceRefresh: true })
              });
              
              // 실시간 잔고도 즉시 업데이트
              await fetch('/api/realtime-balances', { credentials: 'include' });
              
              console.log('🔄 거래 후 잔고 새로고침 완료');
              
              // DB 거래 기록도 새로고침
              setTradeRefreshTrigger(prev => prev + 1);
            } catch (refreshError) {
              console.error('❌ 잔고 새로고침 실패:', refreshError);
            }
          }, 2000);
          
        } catch (realTradingError) {
          const msg = (realTradingError as any)?.message || '';
          const isReentryBlock = msg.includes('재진입 차단') || msg.includes('OPEN 포지션') || msg.includes('이미');
          // 재진입 차단/반복 주문 실패 토스트 억제
          if (isReentryBlock) {
            const now = Date.now();
            if (now - lastReentryToastAtRef.current < REENTRY_TOAST_INTERVAL_MS || lastToastMessage === 'reentry-block') {
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

      console.log('📈 2단계 - 업비트 현물 매수:', {
        upbitBuyAmountBTC,
        upbitPrice,
        upbitBuyAmountKRW,
        upbitFee,
        totalUpbitCost
      });

      // 잔고 확인 (실거래: 실제 잔고, Mock: 로컬 잔고)
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

      console.log('💰 증거금 계산:', {
        binanceShortAmountBTC,
        binancePrice,
        leverage,
        binanceMargin,
        binanceFee,
        totalNeeded: binanceMargin + binanceFee,
        currentUSDT: liveBalance.usdt
      });

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

      // 잔고 변경 (Mock 모드에서만, 실거래는 실제 잔고 사용)
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
        
        // 잔고 검증 로그
        console.log('💰 진입 후 잔고 업데이트:', {
          이전잔고: { krw: prev.krw, btc: prev.btc, usdt: prev.usdt },
          새잔고: { krw: newBalance.krw, btc: newBalance.btc, usdt: newBalance.usdt },
          거래정보: { upbitBTC: upbitBuyAmountBTC, 비용: totalUpbitCost }
        });
        
        return newBalance;
        
        // 진입 후 균형 검증
        console.log('⚖️ 진입 후 잔고 균형 검증:', {
          upbitBtc: newBalance.btc.toFixed(6),
          binanceBtc: newBalance.binanceBtc.toFixed(6),
          upbitBtcAbs: Math.abs(newBalance.btc).toFixed(6),
          binanceBtcAbs: Math.abs(newBalance.binanceBtc).toFixed(6),
          isBalanced: Math.abs(Math.abs(newBalance.btc) - Math.abs(newBalance.binanceBtc)) < 0.001,
          difference: (Math.abs(newBalance.btc) - Math.abs(newBalance.binanceBtc)).toFixed(6)
        });
        
        return newBalance;
        });
      }

      console.log('💰 진입 시 잔고 변화:', {
        upbitCost: totalUpbitCost,
        binanceMargin,
        binanceFee,
        totalCost: totalUpbitCost + (binanceMargin + binanceFee) * entryUsdKrw
      });

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
      
      // 거래 기록 저장 (실거래만 DB, Mock은 로컬스토리지만)
      newTrades.forEach(trade => {
        saveLiveTradeToDB(trade, userId, isLiveMode);
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

      console.log(`✅ ${isLiveMode ? '실거래' : '모의'} 진입 완료:`, {
        strategy: strategy.name,
        premium: premiumRate,
        upbitCost: totalUpbitCost,
        binanceMargin,
        mode: isLiveMode ? 'REAL' : 'MOCK',
        upbitOrderId,
        binanceOrderId
      });

    } catch (error: any) {
      console.error(`❌ ${isLiveMode ? '실거래' : '모의'} 진입 실패:`, error);
      
      // 재진입 차단 에러인 경우 활성 포지션 정보 표시
      if (error?.message?.includes('재진입 차단') || error?.message?.includes('이미') || error?.message?.includes('OPEN 포지션')) {
        // 중복 토스트 방지: 최근 N초 내에 동일 유형 토스트가 있었다면 표시 생략
        const now = Date.now();
        if (now - lastReentryToastAtRef.current < REENTRY_TOAST_INTERVAL_MS || lastToastMessage === 'reentry-block') {
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
          description: error?.message || `${isLiveMode ? '실거래' : '모의'} 거래 실행 중 오류가 발생했습니다.`,
          variant: "destructive"
        });
      }
    } finally {
      tradingLockRef.current = false; // 거래 잠금 해제
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
      console.log('🧪 강제 진입 실행:', { 
        kimp: currentKimp.toFixed(3) + '%',
        settings: forceSettings
      });
      
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
      
      console.log('✅ DB 포지션 생성 완료:', { dbPositionId, strategyName });
      
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
    // 거래 잠금 확인
    if (tradingLockRef.current) {
      console.warn('⏸️ 다른 거래 진행 중 - 청산 대기');
      return;
    }
    
    setIsTrading(true);
    tradingLockRef.current = true; // 거래 잠금

    try {
      if (!currentKimchiData) {
        console.error('❌ currentKimchiData is null in liveExit');
        setIsTrading(false);
        return;
      }

      console.log(`🔄 포지션 청산 시작: ${position.symbol} (${ratio === 1.0 ? '전체' : Math.round(ratio * 100) + '%'} 청산)`);

      // 실거래 모드에서는 실제 API 호출
      if (actualTradingMode === 'real') {
        try {
          const exitUpbitQuantity = position.upbitQuantity * ratio;
          const exitBinanceQuantity = Math.abs(position.binanceQuantity) * ratio;
          
          console.log(`🚨 실거래 개별 포지션 청산:`, {
            포지션ID: position.id,
            심볼: position.symbol,
            업비트청산: exitUpbitQuantity,
            바이낸스청산: exitBinanceQuantity,
            청산비율: Math.round(ratio * 100) + '%'
          });
          
          const liquidationResults = [];
          
          // 1. 업비트 실제 잔고 조회 후 전량 매도
          let actualUpbitBalance = 0;
          try {
            // 업비트 BTC 잔고 조회
            const balanceResponse = await fetch('/api/trading/upbit/balance', {
              method: 'GET',
              credentials: 'include'
            });

            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();
              console.log(`🔍 업비트 전체 잔고 정보:`, balanceData);

              const btcBalance = balanceData.find((b: any) => b.currency === position.symbol);
              console.log(`🔍 ${position.symbol} 잔고 상세:`, btcBalance);

              actualUpbitBalance = parseFloat(btcBalance?.balance || '0');
              console.log(`📊 업비트 실제 ${position.symbol} 잔고: ${actualUpbitBalance} (원래 포지션 수량: ${position.upbitQuantity})`);

              // 실제 잔고와 포지션 수량이 다르면 DB 업데이트
              if (Math.abs(actualUpbitBalance - position.upbitQuantity) > 0.00001) {
                console.log(`🔄 포지션 수량 업데이트: ${position.upbitQuantity} → ${actualUpbitBalance}`);
                try {
                  await fetch(`/api/positions/${position.id}/upbit-quantity`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ actualQuantity: actualUpbitBalance })
                  });
                } catch (updateError) {
                  console.warn('⚠️ 포지션 수량 업데이트 실패:', updateError);
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ 업비트 잔고 조회 실패, 포지션 수량 사용:', error);
            actualUpbitBalance = exitUpbitQuantity;
          }

          // 업비트 BTC 최소 거래 단위: 0.00008 BTC
          const UPBIT_MIN_BTC_UNIT = 0.00008;

          // 실제 잔고 기준으로 매도 (전량 청산을 위해 실제 잔고 우선)
          const finalSellQuantity = actualUpbitBalance > 0.00001 ? actualUpbitBalance : exitUpbitQuantity;

          console.log(`🔍 청산 수량 분석:`, {
            포지션저장수량: position.upbitQuantity,
            계산된청산수량: exitUpbitQuantity,
            API실제잔고: actualUpbitBalance,
            최종매도수량: finalSellQuantity,
            청산비율: `${Math.round(ratio * 100)}%`,
            최소거래단위: UPBIT_MIN_BTC_UNIT,
            최소거래가능여부: finalSellQuantity >= UPBIT_MIN_BTC_UNIT
          });

          // 0.000957 BTC와 같은 특정 케이스 분석
          if (finalSellQuantity > 0.0009 && finalSellQuantity < 0.001) {
            console.log(`🔍 특별 분석 - ${finalSellQuantity} BTC 케이스:`, {
              최소거래단위대비: `${(finalSellQuantity / UPBIT_MIN_BTC_UNIT).toFixed(2)}배`,
              원화환산예상: `약 ${(finalSellQuantity * 100000000).toFixed(0)}원 (BTC가 1억원 가정)`
            });
          }

          if (finalSellQuantity >= UPBIT_MIN_BTC_UNIT) {
            try {
              console.log(`🔄 업비트 매도 실행: 포지션수량(${exitUpbitQuantity}) vs 실제잔고(${actualUpbitBalance}) → 최종매도(${finalSellQuantity})`);

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
                console.log(`✅ 업비트 개별 매도 완료:`, upbitResult);

                // 실제 매도된 수량 확인
                const executedVolume = parseFloat(upbitResult.executed_volume || upbitResult.volume || '0');
                console.log(`📊 실제 매도된 수량: ${executedVolume} BTC (요청: ${finalSellQuantity} BTC)`);

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
                      const remainingBalance = parseFloat(afterBtcBalance?.balance || '0');
                      console.log(`🔍 매도 후 남은 ${position.symbol} 잔고: ${remainingBalance} BTC`);

                      if (remainingBalance > 0.00001) {
                        console.log(`⚠️ 청산 후에도 ${remainingBalance} BTC가 남아있음 - 부분 체결 또는 최소 거래 단위 미달 가능성`);
                      }
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
                  console.log(`✅ 업비트 BTC 이미 청산됨 - 포지션 자동 닫기`);
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
            console.log(`⚠️ 업비트 매도 수량이 최소 거래 단위보다 작음: ${finalSellQuantity} BTC (최소: ${UPBIT_MIN_BTC_UNIT} BTC)`);
            console.log(`📝 소액 BTC 잔고 ${finalSellQuantity}는 수수료보다 작아서 자동으로 남겨둡니다.`);
            liquidationResults.push({ type: 'upbit_skip', reason: 'below_minimum_trade_unit', quantity: finalSellQuantity });
          }

          // 2. 바이낸스 선물 청산 (포지션이 있으면)
          if (exitBinanceQuantity > 0.00001) {
            try {
              const binanceCloseResponse = await fetch('/api/trading/binance/close-short', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  symbol: `${position.symbol}USDT`,
                  quantity: exitBinanceQuantity
                })
              });
              
              if (binanceCloseResponse.ok) {
                const binanceResult = await binanceCloseResponse.json();
                console.log(`✅ 바이낸스 개별 청산 완료:`, binanceResult);
                liquidationResults.push({ type: 'binance_close', result: binanceResult });
              } else {
                const errorText = await binanceCloseResponse.text();
                console.error(`❌ 바이낸스 개별 청산 실패:`, errorText);
                
                // ReduceOnly 오류 = 이미 청산된 것으로 간주
                if (errorText.includes('ReduceOnly Order is rejected') || errorText.includes('-2022')) {
                  console.log(`✅ 바이낸스 BTC 포지션 이미 청산됨 - 포지션 자동 닫기`);
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
          
          console.log('🏁 개별 포지션 청산 결과:', liquidationResults);
          
          // 성공한 청산이나 이미 청산된 경우 UI 업데이트
          if (liquidationResults.some(r => 
            r.type === 'upbit_sell' || r.type === 'binance_close' || 
            r.type === 'upbit_already_closed' || r.type === 'binance_already_closed'
          )) {
            // 부분 청산인 경우 수량 조정, 전체 청산인 경우 상태 변경
            if (ratio < 1.0) {
              // 부분 청산: 수량만 조정
              setLivePositions(prev => 
                prev.map(p => 
                  p.id === position.id 
                    ? {
                        ...p,
                        upbitQuantity: p.upbitQuantity * (1 - ratio),
                        binanceQuantity: p.binanceQuantity * (1 - ratio),
                        unrealizedPnl: p.unrealizedPnl * (1 - ratio)
                      }
                    : p
                )
              );
              
              toast({
                title: `${Math.round(ratio * 100)}% 청산 완료`,
                description: `포지션 ${position.id}의 일부가 실제로 청산되었습니다.`,
              });
            } else {
              // 전체 청산: 상태 변경
              setLivePositions(prev => 
                prev.map(p => 
                  p.id === position.id 
                    ? {
                        ...p,
                        status: 'closed' as const,
                        exitTime: new Date(),
                        realizedPnl: p.unrealizedPnl || 0
                      }
                    : p
                )
              );
              
              toast({
                title: "개별 포지션 청산 완료",
                description: `포지션 ${position.id}가 실제로 청산되었습니다.`,
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
          return;
        } finally {
          setIsTrading(false);
          tradingLockRef.current = false;
        }
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
      const netUpbitRevenue = upbitRevenue - upbitFee;

      // 2. 바이낸스 숏 청산 (롱 매수로 커버)
      const binanceCloseQuantity = position.binanceQuantity * exitRatio;
      
      // 청산 시 균형 검증 로그
      console.log('⚖️ 청산 시 균형 검증:', {
        exitRatio: exitRatio.toFixed(3),
        upbitSellQuantity: upbitSellQuantity.toFixed(6),
        binanceCloseQuantity: binanceCloseQuantity.toFixed(6),
        isBalanced: Math.abs(upbitSellQuantity - binanceCloseQuantity) < 0.000001,
        difference: (upbitSellQuantity - binanceCloseQuantity).toFixed(8)
      });
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
      
      console.log('📊 PnL 계산 상세:', {
        totalEntryCostKRW: Math.round(totalEntryCostKRW),
        totalExitRevenueKRW: Math.round(totalExitRevenueKRW),
        totalPnl: Math.round(totalPnl),
        profitRate: ((totalPnl / totalEntryCostKRW) * 100).toFixed(2) + '%'
      });

      console.log('💰 청산 시 잔고 변화:', {
        binanceCloseQuantity,
        currentBinanceBtc: liveBalance.binanceBtc,
        newBinanceBtc: (liveBalance.binanceBtc || 5.0) + binanceCloseQuantity
      });

      // 청산 시 정확한 잔고 업데이트
      const upbitSellRevenue = upbitSellQuantity * currentUpbitPrice; // 업비트 매도 총액
      const upbitNetRevenue = upbitSellRevenue - upbitFee; // 업비트 매도 수수료 차감
      const binanceNetReturnForBalance = binanceNetReturn; // 바이낸스 순 회수액 (이미 계산됨)
      
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
        
        // 청산 후 잔고 검증 로그
        console.log('💰 청산 후 잔고 업데이트:', {
          이전잔고: { krw: prev.krw, btc: prev.btc, usdt: prev.usdt },
          새잔고: { krw: newBalance.krw, btc: newBalance.btc, usdt: newBalance.usdt },
          청산정보: { upbitBTC: upbitSellQuantity, 수익: upbitNetRevenue }
        });
        
        return newBalance;
        
        // 청산 후 균형 검증 및 오류 감지
        console.log('⚖️ 청산 후 잔고 균형 검증:', {
          exitRatio: exitRatio.toFixed(3),
          upbitSellQuantity: upbitSellQuantity.toFixed(6),
          binanceCloseQuantity: binanceCloseQuantity.toFixed(6),
          prevUpbitBtc: prev.btc.toFixed(6),
          prevBinanceBtc: prev.binanceBtc.toFixed(6),
          newUpbitBtc: newBalance.btc.toFixed(6),
          newBinanceBtc: newBalance.binanceBtc.toFixed(6),
          upbitBtcAbs: Math.abs(newBalance.btc).toFixed(6),
          binanceBtcAbs: Math.abs(newBalance.binanceBtc).toFixed(6),
          isBalanced: Math.abs(Math.abs(newBalance.btc) - Math.abs(newBalance.binanceBtc)) < 0.001,
          difference: (Math.abs(newBalance.btc) - Math.abs(newBalance.binanceBtc)).toFixed(6)
        });
        
        // 음수 BTC 감지 시 경고
        if (newBalance.btc < 0) {
          console.error('🚨 업비트 BTC 음수 감지!', {
            beforeBtc: prev.btc,
            sellQuantity: upbitSellQuantity,
            afterBtc: newBalance.btc,
            positionId: position.id
          });
        }
        
        // 바이낸스 BTC가 음수인 경우 경고 (숏 포지션 수량은 양수여야 함)
        if (newBalance.binanceBtc < 0) {
          console.error('🚨 바이낸스 BTC 음수 감지! (숏 포지션 수량은 양수여야 함)', {
            beforeBinanceBtc: prev.binanceBtc,
            closeQuantity: binanceCloseQuantity,
            afterBinanceBtc: newBalance.binanceBtc,
            positionId: position.id
          });
        }
        
        return newBalance;
      });

      console.log('💰 청산 시 잔고 변화:', {
        upbitSellRevenue,
        upbitFee,
        upbitNetRevenue,
        binanceMarginReturn,
        binanceCoverCost,
        binanceFee,
        binanceNetReturn: binanceNetReturnForBalance,
        totalNetPnL: upbitNetRevenue + (binanceNetReturn * (currentKimchiData?.usdkrw || 1390))
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
      
      // 청산 거래 기록 저장 (실거래만 DB, Mock은 로컬스토리지만)
      exitTrades.forEach(trade => {
        saveLiveTradeToDB(trade, userId, isLiveMode);
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
      
      // 포지션 업데이트 저장 (실거래만 DB, Mock은 로컬스토리지만)
      const updatedPosition = updatedPositions.find(p => p.id === position.id);
      if (updatedPosition) {
        updateLivePositionInDB(updatedPosition, userId, isLiveMode);
      }

      const totalFeesKRW = (entryUpbitFee + upbitFee) + ((entryBinanceFee + binanceFee) * usdKrwRate);
      
      addTradingLog(
        `✅ 청산 | 투입액: ${Math.round(totalEntryCostKRW).toLocaleString()}원, 회수액: ${Math.round(totalExitRevenueKRW).toLocaleString()}원, 손익: ${(totalPnl>=0?'+':'')}${Math.round(totalPnl).toLocaleString()}원`
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
      tradingLockRef.current = false; // 거래 잠금 해제
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
    toast
  ]);

  // 중복 경고 방지를 위한 ref
  const lastPriceDataWarningRef = useRef<number>(0);
  const PRICE_DATA_WARNING_INTERVAL = 30000; // 30초마다 한 번만 경고

  // 김치프리미엄 기반 모의 거래 실행
  const executeMockTrade = useCallback(async (strategy: any, forceEntry = false) => {
    if (!currentKimchiData) return;
    
    // 실거래 모드에서는 기본적인 데이터만 검증
    if (isLiveMode && (!currentKimchiData.upbit_price || !currentKimchiData.binance_price)) {
      const now = Date.now();
      // 30초마다 한 번만 경고 출력 (스팸 방지)
      if (now - lastPriceDataWarningRef.current > PRICE_DATA_WARNING_INTERVAL) {
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
    if (processingEntryRef.current.has(strategyId)) {
      console.warn(`⏯️ ${strategy.name} 전략은 이미 진입 처리 중입니다. 중복 호출을 건너뜁니다.`);
      return;
    }

    try {
      // executeMockTrade 호출 로그 제거

      const currentPremium = currentKimchiData.kimp || 0;
      const prevPremium = prevPremiumRef.current ?? currentPremium;
      const entryRate = parseFloat(strategy.entryCondition);
      const exitRate = parseFloat(strategy.takeProfitCondition);

      // 기존 포지션 확인
      const currentPosition: LivePosition | undefined = livePositions.find(p => 
        p.strategyId === strategy.id && p.status === 'open'
      );

      // 허용오차 설정
      const tolerance = parseFloat(strategy.tolerance || '0.1'); // 기본 허용오차 0.1%
      
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
        await liveEntry(strategy, currentPremium);
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
        await liveExit(currentPosition, currentPremium);
        lastActionAtRef.current[strategy.id] = now;
      } else if (currentPosition) {
        // 포지션이 있지만 청산 조건 불만족
        // 포지션 보유 중 로그 제거
      }
      prevPremiumRef.current = currentPremium; // 마지막에 갱신
      
      // 모든 디버깅 로그 제거
      // 그 외에는 대기 (정확한 조건 만족 시에만 거래)
    } finally {
      processingEntryRef.current.delete(strategyId);
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
        Promise.all(activeStrategies.map(strategy => executeMockTrade(strategy)));
      }
    }
  }, [currentKimchiData?.kimp, strategies, isTrading, executeMockTrade]);

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
  useEffect(() => {
    const activeStrategies = strategies.filter(s => s.isActive);
    
    // 전략 상태 변경 감지
    
    // 즉시 한번 체크 (전략 활성화 직후)
    if (activeStrategies.length > 0 && currentKimchiData) {
      // 즉시 자동매매 체크 로그 제거
      
      // 비동기로 즉시 병렬 실행
      Promise.all(activeStrategies.map(strategy => executeMockTrade(strategy)));
    }
    
    // 주기적 체크 설정
    if (activeStrategies.length > 0) {
      const interval = setInterval(() => {
        if (currentKimchiData) {
          // 주기적 자동매매 체크 로그 제거
          
          // 비동기로 병렬 실행
          Promise.all(activeStrategies.map(strategy => executeMockTrade(strategy)));
        }
      }, 2000); // 2초마다 체크 (매매 기회 놓치지 않도록)

      return () => clearInterval(interval);
    }
  }, [strategies, currentKimchiData, executeMockTrade]);



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
    console.log('💡 전략 데이터는 보존됩니다 - 잔고/거래/포지션만 초기화');
    
    // 9. 강제진입 관련 로컬스토리지도 초기화
    localStorage.removeItem('forceEntrySettings');
    
    console.log('🧹 모든 Mock 데이터 완전 초기화 완료:', {
      잔고: '초기화',
      거래기록: '삭제',
      포지션: '삭제', 
      통계: '초기화',
      로그: '삭제',
      로컬스토리지: '완전삭제'
    });
    
    toast({
      title: "🧹 Mock 데이터 완전 초기화!",
      description: "💸 잔고, 거래기록, 포지션, 수수료, 통계 등 모든 데이터가 깔끔하게 리셋되었습니다! 새 출발! ✨",
      variant: "destructive"
    });
  };

  // 수익률 계산 - 초기 잔고 대비 변화율 (수정됨)
  const INITIAL_KRW = 100000000; // 1억원
  const INITIAL_USDT = 100000;   // 10만 USDT
  const currentUsdKrw = currentKimchiData?.usdkrw || 1390;
  const initialTotalValue = INITIAL_KRW + (INITIAL_USDT * currentUsdKrw); // 초기 총 자산
  
  // 현재 잔고의 총 가치 계산 (원화 기준)
  const currentBtcPrice = currentKimchiData?.upbit_price || 156000000;
  
  // === 🎯 개별 포지션 PnL 계산 (수수료 제외 방식) ===
  const openPositions = livePositions.filter(p => p.status === 'open');
  console.log('🔍 활성 포지션 수:', openPositions.length, openPositions);

  // 🎯 중앙화된 PnL 계산 함수 사용
  const totalPositionPnl = openPositions
    .reduce((sum, position) => {
      const pnlResult = calculatePositionPnL(position, currentKimchiData);
      console.log(`🔍 [unified-calc] 포지션 ${position.id}: ${Math.round(pnlResult.netPnl)}원`);
      return sum + pnlResult.netPnl;
    }, 0);
  
  // 청산된 포지션의 실현 손익
  const realizedPnl = livePositions
    .filter(p => p.status === 'closed')
    .reduce((sum, p) => sum + (p.realizedPnl || 0), 0);
  
  // === ⚠️ 총 수익률은 현재 활성 포지션만 계산 (실현손익 제외) ===
  const totalPnl = totalPositionPnl; // 실현손익 제외, 활성 포지션 PnL만 사용

  console.log('🔍 총 수익금 계산:', {
    openPositionsCount: openPositions.length,
    totalPositionPnl,
    totalPnl
  });
  
  // === 총 순투자금 계산 (활성 포지션만) ===
  const activePositions = livePositions.filter(p => p.status === 'open');
  const closedPositions = livePositions.filter(p => p.status === 'closed');
  
  // 포지션 상태 확인 완료
  
  // === 💰 총 순투자금 계산 (수수료 제외 방식으로 일관성 유지) ===
  const totalActiveInvestment = activePositions
    .reduce((sum, position) => {
      const currentUsdKrw = currentKimchiData?.usdkrw || 1390;
      
      // 업비트 순투자금 계산 (실시간 매도 수수료 적용)
      const upbitGrossAmount = position.upbitQuantity * position.upbitPrice;  // 업비트 총 매수금액 (KRW)
      const upbitEntryFee = upbitGrossAmount * 0.0005;                        // 업비트 진입 수수료 (매수 0.05%) - 고정
      
      // 🔄 업비트 매도 수수료: 현재 가격 기준으로 실시간 계산
      const currentUpbitPrice = currentKimchiData?.upbit_price || position.upbitPrice;
      const currentUpbitSellAmount = position.upbitQuantity * currentUpbitPrice; // 현재 가격 기준 매도 금액
      const upbitExitFee = currentUpbitSellAmount * 0.0005;                   // 실시간 매도 수수료 (0.05%)
      const upbitTotalFee = upbitEntryFee + upbitExitFee;                     // 업비트 총 수수료
      const upbitNetInvestment = upbitGrossAmount - upbitEntryFee;            // 업비트 순투자금 = 매수금액 - 진입수수료만
      
      // 바이낸스 순투자금 계산 (실시간 매도 수수료 적용)
      const binanceGrossMargin = (position.binanceQuantity * position.binancePrice) / position.leverage; // 바이낸스 증거금 (USD)
      const binanceEntryFee = (position.binanceQuantity * position.binancePrice * 0.0004); // 바이낸스 진입 수수료 (USD)
      
      // 🔄 바이낸스 매도 수수료: 현재 가격 기준으로 실시간 계산
      const currentBinancePrice = currentKimchiData?.binance_price || position.binancePrice;
      const currentBinanceSellAmount = position.binanceQuantity * currentBinancePrice; // 현재 가격 기준 매도 금액 (USD)
      const binanceExitFee = currentBinanceSellAmount * 0.0004;               // 실시간 매도 수수료 (USD)
      const binanceTotalFee = binanceEntryFee + binanceExitFee;               // 바이낸스 총 수수료
      const binanceNetMargin = binanceGrossMargin - binanceEntryFee;          // 바이낸스 순증거금 = 증거금 - 진입수수료만
      const binanceNetMarginKRW = binanceNetMargin * currentUsdKrw;           // 바이낸스 순증거금 (KRW)
      
      return sum + upbitNetInvestment + binanceNetMarginKRW;                  // 순투자금만 누적 (수수료 차감 후)
    }, 0);
  
  // === 총 수익률 계산 (현재 활성 포지션만) ===
  const profitRate = totalActiveInvestment > 0 
    ? ((totalPnl / totalActiveInvestment) * 100)                              // 현재 포지션 손익만으로 수익률 계산
    : 0;
  
  // 수익률 계산 완료 (로그 제거)
    
  // 수익률 계산 완료 (상세 로그 제거)

  // 실제 투자 기준 수익률도 계산 (청산된 포지션들의 투자액 대비)
  const realizedTrades = liveTrades.filter(t => t.type === 'sell' || t.type === 'cover');
  const totalInvestedAmount = realizedTrades.reduce((sum, trade) => {
    // 각 거래의 원금 계산 (수수료 제외)
    if (trade.exchange === 'upbit') {
      return sum + (trade.quantity * trade.price); // 업비트 매도 원금
    } else {
      return sum + ((trade.quantity * trade.price) * currentUsdKrw); // 바이낸스 원금 (KRW 환산)
    }
  }, 0);
  
  const investmentBasedProfitRate = totalInvestedAmount > 0 
    ? ((totalPnl / totalInvestedAmount) * 100) 
    : 0;

  // 일일 통계 계산 (useMemo로 최적화)
  const dailyStats = useMemo(() => {
    // 현재 김치 데이터에서 가격 정보 추출
    const currentUpbitPrice = currentKimchiData?.upbit_price;
    const currentBinancePrice = currentKimchiData?.binance_price;
    const currentUsdKrw = currentKimchiData?.usdkrw || 1390;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = liveTrades.filter(trade => {
      const tradeDate = new Date(trade.timestamp);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate.getTime() === today.getTime();
    });

    const todayPositions = livePositions.filter(position => {
      const entryDate = new Date(position.entryTime);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
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

    // 🔄 활성 포지션의 실시간 예상 매도 수수료 계산 (최적화)
    let activeFees = 0;
    const todayActivePositions = todayPositions.filter(p => p.status === 'open');
    
    if (todayActivePositions.length > 0 && (currentUpbitPrice || currentBinancePrice)) {
      // 가격 정보가 있을 때만 계산 (불필요한 계산 방지)
      activeFees = todayActivePositions.reduce((sum, position) => {
        const upbitPrice = currentUpbitPrice || position.upbitPrice;
        const binancePrice = currentBinancePrice || position.binancePrice;
        
        // 업비트 예상 매도 수수료 (실시간)
        const upbitSellAmount = position.upbitQuantity * upbitPrice;
        const upbitExitFee = upbitSellAmount * 0.0005;
        
        // 바이낸스 예상 매도 수수료 (실시간)
        const binanceSellAmount = position.binanceQuantity * binancePrice;
        const binanceExitFee = (binanceSellAmount * 0.0004) * currentUsdKrw;
        
        return sum + upbitExitFee + binanceExitFee;
      }, 0);
    }

    const totalFees = completedFees + activeFees; // 완료된 수수료 + 예상 매도 수수료

    // 수익 통계 (실제로는 더 복잡한 계산이 필요하지만 간단히)
    const realizedPnl = livePositions
      .filter(p => p.status === 'closed')
      .reduce((sum, p) => sum + (p.realizedPnl || 0), 0);

    // 활성 포지션 수
    const activePositions = livePositions.filter(p => p.status === 'open').length;

    return {
      totalTrades,
      upbitTrades,
      binanceTrades,
      totalFees,
      realizedPnl,
      activePositions,
      newPositions: todayPositions.length
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
    
    const recentTradesDebug = {
      totalMockTrades: liveTrades.length,
      filteredTrades: filteredTrades.length,
      recentTradesData: filteredTrades,
      timestamp: new Date().toISOString()
    };
    
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

  return (
    <>
    <Card className="bg-slate-850 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              variant={isTrading ? "destructive" : strategies.some(s => s.isActive) ? "default" : "outline"}
              size="sm"
              disabled
              className="min-w-[200px]"
            >
              {isTrading ? (
                `🔄 ${actualTradingMode === 'real' ? '실거래' : 'Mock 거래'} 실행 중...`
              ) : isLoadingStrategies ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  전략 로딩 중...
                </span>
              ) : strategiesError ? (
                <span className="text-red-400">⚠️ 전략 로드 실패</span>
              ) : strategies.some(s => s.isActive) ? (
                `✅ ${strategies.filter(s => s.isActive).length}개 전략 활성 (${actualTradingMode === 'real' ? '실거래' : 'Mock'})`
              ) : (
                "❌ 활성 전략 없음"
              )}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowForceEntryModal(true)}
            >
              🧪 강제 진입
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowRollbackSettingsModal(true)}
              className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
            >
              🛡️ 롤백 설정
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={async () => {
                // 활성 포지션 전체 청산 (실제 API 호출 포함)
                const activePositions = livePositions.filter(p => p.status === 'open');
                if (activePositions.length === 0) {
                  console.log('❌ 청산할 포지션이 없습니다');
                  toast({
                    title: "청산할 포지션 없음",
                    description: "활성 포지션이 없습니다.",
                    variant: "destructive"
                  });
                  return;
                }

                const currentKimp = currentKimchiData?.kimp || 0;
                console.log('🔴 전체 청산 실행: 포지션', activePositions.length, '개');
                
                // 실거래 모드에서는 실제 API 호출
                if (actualTradingMode === 'real') {
                  try {
                    console.log('🚨 실거래 전체 청산 API 호출 시작...');
                    
                    // 각 포지션별로 실제 청산 API 호출
                    const liquidationResults = [];
                    
                    for (const position of activePositions) {
                      try {
                        console.log(`🔄 포지션 청산 중: ${position.symbol} (업비트: ${position.upbitQuantity}, 바이낸스: ${position.binanceQuantity})`);
                        
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
                            console.log(`✅ 업비트 매도 완료:`, upbitResult);
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
                            console.log(`✅ 바이낸스 청산 완료:`, binanceResult);
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
                    
                    console.log('🏁 실거래 청산 결과:', liquidationResults);
                    
                    // 성공한 청산이 있으면 실제 거래소 상태 확인 후 UI 업데이트
                    if (liquidationResults.some(r => r.type !== 'error')) {
                      console.log('🔍 실거래 청산 후 거래소 상태 재확인...');
                      
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
                          
                          console.log('📊 실제 거래소 상태:', {
                            바이낸스포지션: hasBinancePosition ? btcPosition.positionAmt : '없음',
                            업비트BTC: upbitBtc
                          });
                          
                          // 실제 거래소에 포지션이 없으면 UI에서도 제거
                          setLivePositions(prev => 
                            prev.map(p => {
                              if (p.status === 'open') {
                                const shouldClose = 
                                  (p.symbol === 'BTC' && !hasBinancePosition && p.binanceQuantity !== 0) ||
                                  (p.symbol === 'BTC' && upbitBtc < 0.001 && p.upbitQuantity !== 0);
                                
                                if (shouldClose) {
                                  console.log(`🔄 포지션 ${p.id} 실제 청산 확인됨 - UI 업데이트`);
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
                          await fetch('/api/v2/balance/refresh', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ forceRefresh: true })
                          });
                          
                          await fetch('/api/realtime-balances', { credentials: 'include' });
                          console.log('🔄 청산 후 잔고 새로고침 완료');
                          
                          // DB 거래 기록도 새로고침
                          setTradeRefreshTrigger(prev => prev + 1);
                        } catch (refreshError) {
                          console.error('❌ 청산 후 잔고 새로고침 실패:', refreshError);
                        }
                      }, 2000);
                    } else {
                      toast({
                        title: "청산 실패",
                        description: "모든 포지션 청산에 실패했습니다.",
                        variant: "destructive"
                      });
                    }
                    
                  } catch (error: any) {
                    console.error('❌ 실거래 전체 청산 실패:', error);
                    toast({
                      title: "청산 오류",
                      description: `청산 중 오류가 발생했습니다: ${error.message}`,
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
                    console.log('🔄 수동 복원 시도:', { tradeKey, savedTrades });
                    
                    if (savedTrades && savedTrades !== '[]' && savedTrades !== 'null') {
                      try {
                        const parsed = JSON.parse(savedTrades);
                        console.log('🔄 파싱된 거래:', parsed);
                        setLiveTrades(parsed);
                        console.log('🔄 수동 거래 기록 복원:', parsed.length, '건');
                        
                        // 강제 리렌더링
                        setTimeout(() => {
                          window.dispatchEvent(new Event('resize'));
                        }, 100);
                      } catch (error) {
                        console.error('❌ 수동 복원 실패:', error);
                      }
                    } else {
                      console.log('❌ 복원할 거래 기록이 없습니다');
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
                            console.log('🔄 자동 복원 성공:', parsed.length, '건');
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

    {/* 롤백 설정 모달 */}
    <RollbackSettingsModal
      isOpen={showRollbackSettingsModal}
      onClose={() => setShowRollbackSettingsModal(false)}
    />
    </>
  );
};
