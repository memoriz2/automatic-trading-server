import { useState, useEffect } from 'react';

interface UseApiConnectionProps {
  tradingMode: 'real' | 'mock';
}

export const useApiConnection = ({ tradingMode }: UseApiConnectionProps) => {
  const [apiConnected, setApiConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  console.log('🔗 useApiConnection 상태:', { tradingMode, apiConnected, isConnecting });

  // 실거래 모드에서 API 연결 확인
  useEffect(() => {
    const checkApiConnection = async () => {
      if (tradingMode === 'real') {
        setIsConnecting(true);
        setApiConnected(false);
        
        // 거래소 API 연결 상태 확인
        try {
          console.log('🔍 거래소 API 연결 상태 확인 중...');
          
          const response = await fetch('/api/exchanges/status', { 
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            const isConnected = data.connected && data.connectedExchanges > 0;
            
            setApiConnected(isConnected);
            setIsConnecting(false);
            
            console.log('✅ 거래소 API 연결 상태:', {
              connected: isConnected,
              totalExchanges: data.totalExchanges,
              connectedExchanges: data.connectedExchanges,
              exchanges: data.exchanges
            });
            
            if (!isConnected) {
              console.warn('⚠️ 거래소 API 연결 실패:', data.message);
            }
          } else {
            setApiConnected(false);
            setIsConnecting(true); // API 확인 실패하면 계속 스피닝
            console.error('❌ API 연결 확인 실패:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('❌ API 연결 확인 오류:', error);
          setApiConnected(false);
          setIsConnecting(true); // 오류 발생하면 계속 스피닝
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
