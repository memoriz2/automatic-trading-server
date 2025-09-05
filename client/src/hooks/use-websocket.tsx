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
        let host = `${baseHostname}${window.location.port ? `:${window.location.port}` : ''}`;
        
        // 로컬 개발 환경에서는 현재 포트를 그대로 사용
        if (window.location.hostname === 'localhost') {
          const currentPort = window.location.port || '5001';
          console.log(`🔍 로컬 환경 감지: 현재 포트 ${currentPort} 사용`);
          host = `localhost:${currentPort}`;
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
