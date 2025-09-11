// ===== 환경별 거래 모드 설정 =====

export interface TradingConfig {
  isRealTradingEnabled: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  tradingMode: 'mock' | 'real';
  logLevel: string;
}

// 환경 변수 기반 설정
export const TRADING_CONFIG: TradingConfig = {
  isRealTradingEnabled: process.env.ENABLE_REAL_TRADING === "true",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  tradingMode: process.env.ENABLE_REAL_TRADING === "true" ? "real" : "mock",
  logLevel: process.env.LOG_LEVEL || "debug"
};

// 거래 모드 확인 함수
export const isMockMode = (): boolean => {
  return TRADING_CONFIG.tradingMode === "mock";
};

export const isRealTradingMode = (): boolean => {
  return TRADING_CONFIG.tradingMode === "real";
};

// 환경별 로그 출력
export const logTradingMode = (): void => {
  console.log(`🎯 [${new Date().toISOString()}] 거래 모드: ${TRADING_CONFIG.tradingMode.toUpperCase()}`);
  console.log(`🔧 [${new Date().toISOString()}] 실거래 활성화: ${TRADING_CONFIG.isRealTradingEnabled}`);
  console.log(`🌍 [${new Date().toISOString()}] 환경: ${process.env.NODE_ENV || 'development'}`);
  
  if (TRADING_CONFIG.isRealTradingEnabled) {
    console.log(`⚠️  [${new Date().toISOString()}] 🚨 실거래 모드 활성화됨 - 실제 자금으로 거래가 실행됩니다! 🚨`);
  } else {
    console.log(`✅ [${new Date().toISOString()}] 🛡️  Mock 모드 - 안전한 시뮬레이션 거래`);
  }
};
