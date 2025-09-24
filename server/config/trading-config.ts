// ===== 환경별 거래 모드 설정 =====

export interface TradingConfig {
  isLiveTradingEnabled: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  tradingMode: 'live';
  logLevel: string;
}

// 환경 변수 기반 설정 (Live 모드로 통일)
export const TRADING_CONFIG: TradingConfig = {
  isLiveTradingEnabled: true, // 항상 실거래 모드
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  tradingMode: "live", // Live 모드로 고정
  logLevel: process.env.LOG_LEVEL || "info"
};

// 거래 모드 확인 함수 (Live 모드로 통일)
export const isLiveMode = (): boolean => {
  return true; // 항상 Live 모드
};

export const isLiveTradingMode = (): boolean => {
  return true; // 항상 Live 모드
};

// 환경별 로그 출력 (Live 모드 전용) - 로그 스팸 방지로 제거
export const logTradingMode = (): void => {
  // LOG_LEVEL=WARN 설정으로 거래 모드 로그 스팸 제거
};
