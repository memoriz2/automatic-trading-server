import { useEffect, useRef, useState } from 'react';
import type { WebSocketMessage } from '@/types/trading';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        // 서버 포트 동적 감지
        const getServerPort = async (): Promise<number> => {
          try {
            const isProduction = process.env.NODE_ENV === "production";
            const isServerEnvironment = window.location.hostname !== 'localhost';
            
            if (isServerEnvironment || isProduction) {
              return 5000; // 서버 환경에서는 항상 5000
            }
            
            // 로컬 환경에서는 서버 정보 API로 실제 포트 확인
            const commonPorts = [5000, 5001, 5002, 5003, 3000, 8000];
            
            for (const port of commonPorts) {
              try {
                const response = await fetch(`http://localhost:${port}/api/server-info`);
                if (response.ok) {
                  console.log(`✅ WebSocket 서버 발견: 포트 ${port}`);
                  return port;
                }
              } catch (e) {
                // 포트 확인 실패, 다음 포트 시도
              }
            }
            
            return 5000; // 기본값
          } catch (error) {
            console.error('WebSocket 서버 포트 감지 실패:', error);
            return 5000;
          }
        };

        // 환경별 WebSocket URL 결정
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        let host = window.location.host;
        
        // 로컬 개발 환경에서만 동적 포트 사용
        if (window.location.hostname === 'localhost') {
          const serverPort = await getServerPort();
          if (window.location.port !== serverPort.toString()) {
            console.log(`로컬 개발 환경 감지: WebSocket localhost:${serverPort} 사용`);
            host = `localhost:${serverPort}`;
          } else {
            console.log('서버 환경 또는 같은 포트: WebSocket 상대 경로 사용');
          }
        }
        
        // 인증 토큰 추가
        const token = localStorage.getItem('authToken');
        const wsUrl = token 
          ? `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`
          : `${protocol}//${host}/ws`;
        
        console.log('WebSocket 연결 시도:', wsUrl);
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          
          // 연결 후 인증 메시지 전송 (URL 토큰이 없는 경우)
          if (!token && localStorage.getItem('authToken')) {
            const authToken = localStorage.getItem('authToken');
            if (authToken && ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({
                type: 'auth',
                token: authToken
              }));
              console.log('WebSocket 인증 메시지 전송');
            }
          }
        };

        ws.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            setLastMessage(message);
            
            const handler = messageHandlers.current.get(message.type);
            if (handler) {
              handler(message.data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          
          // 재연결 시도
          setTimeout(connectWebSocket, 3000);
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    // Heartbeat
    const heartbeatInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const subscribe = (messageType: string, handler: (data: any) => void) => {
    messageHandlers.current.set(messageType, handler);
    
    return () => {
      messageHandlers.current.delete(messageType);
    };
  };

  const send = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    lastMessage,
    subscribe,
    send,
    connected: isConnected // ✅ 호환성을 위해 추가
  };
}
