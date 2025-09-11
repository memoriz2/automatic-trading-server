// ===== 클라이언트 거래 모드 설정 =====

export interface ClientTradingConfig {
  isMockMode: boolean;
  tradingMode: 'mock' | 'real';
  apiEndpoint: string;
  wsEndpoint: string;
}

// 환경 변수 또는 기본값으로 설정
const getTradingMode = (): 'mock' | 'real' => {
  // Vite 환경 변수 확인
  const viteMode = import.meta.env.VITE_TRADING_MODE;
  if (viteMode === 'real') return 'real';
  
  // 개발 환경에서는 기본적으로 Mock 모드
  if (import.meta.env.DEV) return 'mock';
  
  // 프로덕션에서는 실거래 모드
  return import.meta.env.PROD ? 'real' : 'mock';
};

export const CLIENT_TRADING_CONFIG: ClientTradingConfig = {
  isMockMode: getTradingMode() === 'mock',
  tradingMode: getTradingMode(),
  apiEndpoint: getTradingMode() === 'mock' ? '/api/mock' : '/api/live',
  wsEndpoint: getTradingMode() === 'mock' ? '/ws-mock' : '/ws-live'
};

// 거래 모드 확인 함수들
export const isMockMode = (): boolean => {
  return CLIENT_TRADING_CONFIG.isMockMode;
};

export const isRealTradingMode = (): boolean => {
  return !CLIENT_TRADING_CONFIG.isMockMode;
};

// 환경 정보 로그
export const logClientTradingMode = (): void => {
  console.log(`🎯 클라이언트 거래 모드: ${CLIENT_TRADING_CONFIG.tradingMode.toUpperCase()}`);
  console.log(`🔧 Mock 모드: ${CLIENT_TRADING_CONFIG.isMockMode}`);
  console.log(`🌐 API 엔드포인트: ${CLIENT_TRADING_CONFIG.apiEndpoint}`);
  
  if (CLIENT_TRADING_CONFIG.isMockMode) {
    console.log(`✅ 🛡️  안전한 Mock 모드 - 시뮬레이션 거래만 실행`);
  } else {
    console.log(`⚠️  🚨 실거래 모드 - 실제 자금으로 거래 실행! 🚨`);
  }
};
