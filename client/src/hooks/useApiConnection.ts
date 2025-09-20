import { useState, useEffect } from 'react';

interface UseApiConnectionProps {
  tradingMode: 'real' | 'mock' | 'live';
}

export const useApiConnection = ({ tradingMode }: UseApiConnectionProps) => {
  const [apiConnected, setApiConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // 실거래 모드에서 API 연결 확인
  useEffect(() => {
    const checkApiConnection = async () => {
      if (tradingMode === 'real') {
        setIsConnecting(true);
        setApiConnected(false);
        
        // 거래소 API 연결 상태 확인
        try {
          const response = await fetch('/api/v2/exchanges/status', { 
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            const isConnected = data.connected && data.connectedExchanges > 0;
            const wasConnected = apiConnected;
            
            setApiConnected(isConnected);
            setIsConnecting(false);
            
            // 연결 상태 변경 시에만 로그 출력
            if (wasConnected !== isConnected) {
              if (isConnected) {
                console.log(`✅ 거래소 API 연결 성공 (${data.connectedExchanges}/${data.totalExchanges})`);
              } else {
                console.warn('⚠️ 거래소 API 연결 실패:', data.message);
              }
            }
          } else {
            setApiConnected(false);
            setIsConnecting(true);
            if (apiConnected) { // 이전에 연결되어 있었다면 로그 출력
              console.error('❌ API 연결 확인 실패:', response.status, response.statusText);
            }
          }
        } catch (error) {
          setApiConnected(false);
          setIsConnecting(true);
          if (apiConnected) { // 이전에 연결되어 있었다면 로그 출력
            console.error('❌ API 연결 확인 오류:', error);
          }
        }
      } else {
        // Mock 모드에서는 연결 상태 초기화
        setIsConnecting(false);
        setApiConnected(false);
      }
    };

    checkApiConnection();
    
    // 실거래 모드에서 주기적으로 연결 상태 확인 (30초마다)
    let intervalId: NodeJS.Timeout | null = null;
    if (tradingMode === 'real') {
      intervalId = setInterval(checkApiConnection, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [tradingMode]);

  return {
    apiConnected,
    isConnecting
  };
};
