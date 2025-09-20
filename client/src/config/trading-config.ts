// ===== 클라이언트 거래 모드 설정 =====

export interface ClientTradingConfig {
  isLiveMode: boolean;
  tradingMode: 'live';
  apiEndpoint: string;
  wsEndpoint: string;
}

// Live 모드로 통일 (Mock 모드 제거)
const getTradingMode = (): 'live' => {
  return 'live'; // 항상 Live 모드
};

export const CLIENT_TRADING_CONFIG: ClientTradingConfig = {
  isLiveMode: true, // 항상 Live 모드
  tradingMode: 'live',
  apiEndpoint: '/api/live',
  wsEndpoint: '/ws-live'
};

// 서버에서 실제 거래 모드를 동적으로 확인하는 함수
export const getServerTradingMode = async (): Promise<'live'> => {
  try {
    const response = await fetch('/api/server-info');
    if (response.ok) {
      const serverInfo = await response.json();
      // 서버 거래 모드 확인
      return 'live'; // 항상 Live 모드
    }
  } catch (error) {
    // 서버 거래 모드 확인 실패, 클라이언트 설정 사용
  }
  
  // 서버 확인 실패 시 클라이언트 설정 사용
  return getTradingMode();
};

// 거래 모드 확인 함수들 (Live 모드로 통일)
export const isLiveMode = (): boolean => {
  return CLIENT_TRADING_CONFIG.isLiveMode;
};

export const isLiveTradingMode = (): boolean => {
  return CLIENT_TRADING_CONFIG.isLiveMode;
};

// 환경 정보 로그 (개발 환경에서만)
export const logClientTradingMode = (): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 클라이언트 거래 모드: ${CLIENT_TRADING_CONFIG.tradingMode.toUpperCase()}`);
    console.log(`🔧 Live 모드: ${CLIENT_TRADING_CONFIG.isLiveMode}`);
    console.log(`🌐 API 엔드포인트: ${CLIENT_TRADING_CONFIG.apiEndpoint}`);
    
    console.log(`🚨 Live 거래 모드 - 실제 자금으로 거래 실행! 🚨`);
  }
};
