// Mock 거래 상태 관리 서비스
interface MockTradingState {
  userId: string;
  isTrading: boolean;
  lastActivity: Date;
  trades: any[];
  positions: any[];
  balance: any;
}

class MockTradingStateManager {
  private states = new Map<string, MockTradingState>();

  // 사용자별 Mock 거래 상태 가져오기
  getState(userId: string): MockTradingState | null {
    return this.states.get(userId) || null;
  }

  // 사용자별 Mock 거래 상태 설정
  setState(userId: string, state: Partial<MockTradingState>): void {
    const existing = this.states.get(userId) || {
      userId,
      isTrading: false,
      lastActivity: new Date(),
      trades: [],
      positions: [],
      balance: {
        krw: 10000000,
        btc: 0,
        binanceUsdt: 10000,
        binanceBtc: 5.0,
        binanceSpotBtc: 3.0
      }
    };

    this.states.set(userId, {
      ...existing,
      ...state,
      lastActivity: new Date()
    });
  }

  // Mock 거래 시작
  startTrading(userId: string): void {
    this.setState(userId, { isTrading: true });
    console.log(`🚀 Mock 거래 시작: 사용자 ${userId}`);
  }

  // Mock 거래 중지
  stopTrading(userId: string): void {
    this.setState(userId, { isTrading: false });
    console.log(`🛑 Mock 거래 중지: 사용자 ${userId}`);
  }

  // 거래 추가
  addTrade(userId: string, trade: any): void {
    const state = this.getState(userId);
    if (state) {
      const newTrades = [...state.trades, trade];
      this.setState(userId, { trades: newTrades });
    }
  }

  // 포지션 추가/업데이트
  updatePosition(userId: string, position: any): void {
    const state = this.getState(userId);
    if (state) {
      const existingIndex = state.positions.findIndex(p => p.id === position.id);
      let newPositions;
      
      if (existingIndex >= 0) {
        newPositions = [...state.positions];
        newPositions[existingIndex] = position;
      } else {
        newPositions = [...state.positions, position];
      }
      
      this.setState(userId, { positions: newPositions });
    }
  }

  // 잔고 업데이트
  updateBalance(userId: string, balance: any): void {
    this.setState(userId, { balance });
  }

  // 모든 활성 상태 가져오기
  getAllActiveStates(): MockTradingState[] {
    return Array.from(this.states.values()).filter(state => state.isTrading);
  }

  // 비활성 상태 정리 (1시간 이상 비활성)
  cleanupInactiveStates(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [userId, state] of this.states.entries()) {
      if (state.lastActivity < oneHourAgo) {
        this.states.delete(userId);
        console.log(`🧹 비활성 Mock 거래 상태 정리: 사용자 ${userId}`);
      }
    }
  }
}

// 싱글톤 인스턴스
export const mockTradingStateManager = new MockTradingStateManager();

// 주기적으로 비활성 상태 정리
setInterval(() => {
  mockTradingStateManager.cleanupInactiveStates();
}, 30 * 60 * 1000); // 30분마다 실행
