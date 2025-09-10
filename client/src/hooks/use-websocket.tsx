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

        // 환경별 WebSocket URL 결정
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const baseHostname = window.location.hostname.replace(/^www\./, '');
        const port = window.location.port || '5001';
        const host = `${baseHostname}:${port}`;
        
        console.log(`🔍 WebSocket URL 구성:`, {
          protocol,
          hostname: baseHostname,
          port,
          host
        });
        
        // 인증 토큰 추가
        const token = localStorage.getItem('authToken');
        const wsUrl = token 
          ? `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`
          : `${protocol}//${host}/ws`;
        
        console.log('WebSocket 연결 시도:', wsUrl);
        ws.current = new WebSocket(wsUrl);
        console.log('WebSocket 객체 생성 완료, 연결 대기 중...');

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
            // JSON 파싱 시도
            let message: WebSocketMessage;
            try {
              message = JSON.parse(event.data);
            } catch {
              // JSON이 아닌 경우, kimchi-premium 메시지로 처리
              const data = event.data.trim();
              if (data && !isNaN(Number(data))) {
                message = {
                  type: 'kimchi-premium',
                  data: Number(data)
                };
              } else {
                console.warn('📨 알 수 없는 메시지 형식:', event.data);
                return;
              }
            }
            
            console.log('📨 WebSocket 메시지 수신:', message.type, message.data);
            setLastMessage(message);
            
            const handler = messageHandlers.current.get(message.type);
            if (handler) {
              handler(message.data);
            } else {
              // kimchi-premium은 기본 상태 업데이트만으로 충분하므로 경고 생략
              if (message.type !== 'kimchi-premium') {
                console.warn('📨 처리되지 않은 메시지 타입:', message.type);
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error, event.data);
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
