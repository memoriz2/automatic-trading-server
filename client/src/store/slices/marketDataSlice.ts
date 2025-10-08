import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { KimchiData, KimchiPremium } from '@/types/trading';

interface MarketDataState {
  currentKimchiData: KimchiData | null;
  dataBySymbol: Record<string, KimchiPremium>;
  selectedSymbol: string;
  spark: number[];
  lastUpdate: number | null;
}

const initialState: MarketDataState = {
  currentKimchiData: null,
  dataBySymbol: {},
  selectedSymbol: 'BTC',
  spark: [],
  lastUpdate: null,
};

const marketDataSlice = createSlice({
  name: 'marketData',
  initialState,
  reducers: {
    setCurrentKimchiData: (state, action: PayloadAction<KimchiData | null>) => {
      state.currentKimchiData = action.payload;
      state.lastUpdate = Date.now();

      // spark 배열에 김프율 추가 (최대 100개)
      if (action.payload) {
        state.spark.push(action.payload.kimp);
        if (state.spark.length > 100) {
          state.spark = state.spark.slice(-100);
        }
      }
    },
    setDataBySymbol: (state, action: PayloadAction<Record<string, KimchiPremium>>) => {
      state.dataBySymbol = action.payload;
    },
    updateSymbolData: (state, action: PayloadAction<{ symbol: string; data: KimchiPremium }>) => {
      state.dataBySymbol[action.payload.symbol] = action.payload.data;
    },
    setSelectedSymbol: (state, action: PayloadAction<string>) => {
      state.selectedSymbol = action.payload;
    },
    setSpark: (state, action: PayloadAction<number[]>) => {
      state.spark = action.payload;
    },
    clearSpark: (state) => {
      state.spark = [];
    },
    resetMarketDataState: () => initialState,
  },
});

export const {
  setCurrentKimchiData,
  setDataBySymbol,
  updateSymbolData,
  setSelectedSymbol,
  setSpark,
  clearSpark,
  resetMarketDataState,
} = marketDataSlice.actions;

export default marketDataSlice.reducer;
