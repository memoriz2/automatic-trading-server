import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Strategy } from '@/types/trading';

interface StrategyState {
  strategies: Strategy[];
  isLoading: boolean;
  error: string | null;
}

const initialState: StrategyState = {
  strategies: [],
  isLoading: false,
  error: null,
};

const strategySlice = createSlice({
  name: 'strategy',
  initialState,
  reducers: {
    setStrategies: (state, action: PayloadAction<Strategy[]>) => {
      state.strategies = action.payload;
      state.error = null;
    },
    addStrategy: (state, action: PayloadAction<Strategy>) => {
      state.strategies.push(action.payload);
    },
    updateStrategy: (state, action: PayloadAction<{ id: string; updates: Partial<Strategy> }>) => {
      const index = state.strategies.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.strategies[index] = { ...state.strategies[index], ...action.payload.updates };
      }
    },
    removeStrategy: (state, action: PayloadAction<string>) => {
      state.strategies = state.strategies.filter(s => s.id !== action.payload);
    },
    toggleStrategyActive: (state, action: PayloadAction<string>) => {
      const strategy = state.strategies.find(s => s.id === action.payload);
      if (strategy) {
        strategy.isActive = !strategy.isActive;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetStrategyState: () => initialState,
  },
});

export const {
  setStrategies,
  addStrategy,
  updateStrategy,
  removeStrategy,
  toggleStrategyActive,
  setLoading,
  setError,
  resetStrategyState,
} = strategySlice.actions;

export default strategySlice.reducer;
