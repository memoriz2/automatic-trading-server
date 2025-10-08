import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tradingReducer from './slices/tradingSlice';
import strategyReducer from './slices/strategySlice';
import marketDataReducer from './slices/marketDataSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trading: tradingReducer,
    strategy: strategyReducer,
    marketData: marketDataReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Date 객체를 허용 (LivePosition, LiveTrade 등에서 사용)
        ignoredActions: ['trading/setLiveTrades', 'trading/addLiveTrade', 'trading/setLivePositions', 'trading/addLivePosition', 'trading/updateLivePosition'],
        ignoredPaths: ['trading.liveTrades', 'trading.livePositions', 'marketData.currentKimchiData'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
