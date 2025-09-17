// ===== 클라이언트 거래 모드 설정 =====

export interface ClientTradingConfig {
  isMockMode: boolean;
  tradingMode: 'mock' | 'real';
  apiEndpoint: string;
  wsEndpoint: string;
}

// 서버의 거래 모드를 동적으로 확인
const getTradingMode = (): 'mock' | 'real' => {
  // 1. Vite 환경 변수 우선 확인 (강제 설정)
  const viteMode = import.meta.env.VITE_TRADING_MODE;
  if (viteMode === 'real') return 'real';
  if (viteMode === 'mock') return 'mock';
  
  // 2. 서버 환경에서는 실거래 모드로 가정 (서버에서 ENABLE_REAL_TRADING 확인)
  const isServerEnvironment = window.location.hostname !== 'localhost';
  if (isServerEnvironment) return 'real';
  
  // 3. 로컬 개발 환경에서는 Mock 모드
  return 'mock';
};

export const CLIENT_TRADING_CONFIG: ClientTradingConfig = {
  isMockMode: getTradingMode() === 'mock',
  tradingMode: getTradingMode(),
  apiEndpoint: getTradingMode() === 'mock' ? '/api/mock' : '/api/live',
  wsEndpoint: getTradingMode() === 'mock' ? '/ws-mock' : '/ws-live'
};

// 서버에서 실제 거래 모드를 동적으로 확인하는 함수
export const getServerTradingMode = async (): Promise<'mock' | 'real'> => {
  try {
    const response = await fetch('/api/server-info');
    if (response.ok) {
      const serverInfo = await response.json();
      console.log('🔍 서버 거래 모드 확인:', serverInfo);
      return serverInfo.tradingMode === 'real' ? 'real' : 'mock';
    }
  } catch (error) {
    console.warn('⚠️ 서버 거래 모드 확인 실패, 클라이언트 설정 사용:', error);
  }
  
  // 서버 확인 실패 시 클라이언트 설정 사용
  return getTradingMode();
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
