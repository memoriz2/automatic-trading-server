import { useState, useEffect } from 'react';

// 모의 잔고 타입
export interface MockBalance {
  krw: number;
  btc: number;
  usdt: number;
  binanceBtc: number;
  binanceSpotBtc: number;
  binanceUsdt: number;
}

export const useMockBalance = (userId: string) => {
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
        return getInitialBalance();
      }
    }
    return getInitialBalance();
  });

  // 초기 잔고 설정
  const getInitialBalance = (): MockBalance => ({
    krw: 100000000,  // 1억원
    btc: 0,          // 0 BTC
    usdt: 100000,    // 10만 USDT
    binanceBtc: 0,   // 0 BTC (바이낸스 선물)
    binanceSpotBtc: 0, // 0 BTC (바이낸스 현물)
    binanceUsdt: 100000 // 10만 USDT (바이낸스)
  });

  // 로컬스토리지에 저장
  useEffect(() => {
    const storageKey = `mock-balance-${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(mockBalance));
  }, [mockBalance, userId]);

  // 잔고 초기화 함수
  const resetBalance = (
    mockTrades: any[],
    mockPositions: any[],
    dailyStats: any,
    totalPnl: number,
    onReset: () => void
  ) => {
    const currentBalance = mockBalance;
    const activePositions = mockPositions.filter(p => p.status === 'open').length;
    const totalTrades = mockTrades.length;
    const totalFees = dailyStats.totalFees;
    const currentPnL = totalPnl;
    
    const confirmMessage = `⚠️ 정말로 모든 Mock 데이터를 초기화하시겠습니까?\n\n현재 상태:\n• KRW: ₩${(currentBalance.krw || 0).toLocaleString()}\n• 업비트 BTC: ${(currentBalance.btc || 0).toFixed(3)} BTC\n• 바이낸스 USDT: $${(currentBalance.binanceUsdt || 0).toLocaleString()}\n• 활성 포지션: ${activePositions}개\n• 총 거래: ${totalTrades}회\n• 총 수수료: ₩${Math.round(totalFees).toLocaleString()}\n• 현재 손익: ${currentPnL >= 0 ? '+' : ''}₩${Math.round(currentPnL).toLocaleString()}\n\n모든 거래 기록, 포지션, 통계가 삭제됩니다!\n이 작업은 되돌릴 수 없습니다!`;
    
    if (!confirm(confirmMessage)) {
      return; // 사용자가 취소한 경우
    }
    
    // 잔고 초기화
    setMockBalance(getInitialBalance());
    
    // 로컬스토리지 완전 초기화
    localStorage.removeItem(`mock-balance-${userId}`);
    localStorage.removeItem(`mock-trades-${userId}`);
    localStorage.removeItem(`mock-positions-${userId}`);
    localStorage.removeItem('forceEntrySettings');
    
    // 부모 컴포넌트 콜백 호출
    onReset();
    
    console.log('🧹 모든 Mock 데이터 완전 초기화 완료');
  };

  return {
    mockBalance,
    setMockBalance,
    resetBalance,
    getInitialBalance
  };
};
