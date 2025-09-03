export interface KimchiPremium {
  symbol: string;
  upbitPrice: number;
  binancePrice?: number;
  binanceFuturesPrice?: number;
  premiumRate: number;
  timestamp: string; // 혹은 Date
  exchangeRate?: number;
  usdKrwRate?: number;
  binancePriceKRW?: number;
}

export interface Position {
  id: number;
  symbol: string;
  type: string;
  entryPrice: number;
  currentPrice?: number;
  quantity: number;
  entryPremiumRate: number;
  currentPremiumRate?: number;
  profitLossRate?: number;
  profitLossAmount?: number;
  status: 'active' | 'closed' | 'pending';
  entryTime: Date;
  exitTime?: Date;
}

export interface Trade {
  id: number;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'buy' | 'sell';
  exchange: 'upbit' | 'binance';
  quantity: number;
  amount: number;
  price: number;
  fee?: number;
  profit?: number;
  timestamp: Date;
  createdAt: Date;
}

export interface TradingSettings {
  id: number;
  userId: number;
  entryPremiumRate: string;
  exitPremiumRate: string;
  stopLossRate: string;
  maxPositions: number;
  isAutoTrading: boolean;
  maxInvestmentAmount?: string;
  // 새로운 김프 전략 설정값들
  kimchiEntryRate?: string;     // 진입 김프율
  kimchiExitRate?: string;      // 청산 김프율  
  kimchiToleranceRate?: string; // 허용 오차 진입 김프율
  binanceLeverage?: number;     // 바이낸스 레버리지
  upbitEntryAmount?: string;    // 업비트 기준 진입 금액(KRW)
}

export interface SystemAlert {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: 'kimchi-premium' | 'trading-status' | 'alerts' | 'ping' | 'pong';
  data?: any;
}
