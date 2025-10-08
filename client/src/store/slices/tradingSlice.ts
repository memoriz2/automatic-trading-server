import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LiveBalance, LiveTrade, LivePosition } from '@/types/trading';

interface TradingState {
  liveBalance: LiveBalance;
  liveTrades: LiveTrade[];
  livePositions: LivePosition[];
  isTrading: boolean;
  tradingLogs: string[];
  tradeRefreshTrigger: number;
}

const initialState: TradingState = {
  liveBalance: {
    krw: 0,
    btc: 0,
    usdt: 0,
    binanceBtc: 0,
    binanceSpotBtc: 0,
    binanceUsdt: 0,
  },
  liveTrades: [],
  livePositions: [],
  isTrading: false,
  tradingLogs: [],
  tradeRefreshTrigger: 0,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setLiveBalance: (state, action: PayloadAction<LiveBalance>) => {
      state.liveBalance = action.payload;
    },
    updateLiveBalance: (state, action: PayloadAction<Partial<LiveBalance>>) => {
      state.liveBalance = { ...state.liveBalance, ...action.payload };
    },
    setLiveTrades: (state, action: PayloadAction<LiveTrade[]>) => {
      state.liveTrades = action.payload;
    },
    addLiveTrade: (state, action: PayloadAction<LiveTrade>) => {
      state.liveTrades.unshift(action.payload);
    },
    setLivePositions: (state, action: PayloadAction<LivePosition[]>) => {
      state.livePositions = action.payload;
    },
    addLivePosition: (state, action: PayloadAction<LivePosition>) => {
      state.livePositions.push(action.payload);
    },
    updateLivePosition: (state, action: PayloadAction<{ id: string; updates: Partial<LivePosition> }>) => {
      const index = state.livePositions.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.livePositions[index] = { ...state.livePositions[index], ...action.payload.updates };
      }
    },
    removeLivePosition: (state, action: PayloadAction<string>) => {
      state.livePositions = state.livePositions.filter(p => p.id !== action.payload);
    },
    setIsTrading: (state, action: PayloadAction<boolean>) => {
      state.isTrading = action.payload;
    },
    setTradingLogs: (state, action: PayloadAction<string[]>) => {
      state.tradingLogs = action.payload;
    },
    addTradingLog: (state, action: PayloadAction<string>) => {
      state.tradingLogs.unshift(action.payload);
      // 최대 100개 로그만 유지
      if (state.tradingLogs.length > 100) {
        state.tradingLogs = state.tradingLogs.slice(0, 100);
      }
    },
    clearTradingLogs: (state) => {
      state.tradingLogs = [];
    },
    incrementTradeRefreshTrigger: (state) => {
      state.tradeRefreshTrigger += 1;
    },
    resetTradingState: () => initialState,
  },
});

export const {
  setLiveBalance,
  updateLiveBalance,
  setLiveTrades,
  addLiveTrade,
  setLivePositions,
  addLivePosition,
  updateLivePosition,
  removeLivePosition,
  setIsTrading,
  setTradingLogs,
  addTradingLog,
  clearTradingLogs,
  incrementTradeRefreshTrigger,
  resetTradingState,
} = tradingSlice.actions;

export default tradingSlice.reducer;
