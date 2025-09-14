import { useEffect, useRef, useState } from 'react';
import type { WebSocketMessage } from '@/types/trading';
import { formatKoreanTime } from '@/utils/datetime';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connectWebSocket = async () => {
      if (isConnecting) return; // 이미 연결 시도 중이면 중복 실행 방지
      
      try {
        setIsConnecting(true);
        setConnectionAttempts(prev => prev + 1);
        
        // 이전 연결 정리
        if (ws.current) {
          ws.current.close();
          ws.current = null;
        }
        
        // 재연결 타이머 정리
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // 환경별 WebSocket URL 결정
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const baseHostname = window.location.hostname.replace(/^www\./, '');
        const port = window.location.port || '5001';
        const host = `${baseHostname}:${port}`;
        
        console.log(`🔍 WebSocket 연결 시도 #${connectionAttempts + 1}:`, {
          protocol,
          hostname: baseHostname,
          port,
          host,
          timestamp: formatKoreanTime()
        });
        
        // 인증 토큰 추가
        const token = localStorage.getItem('authToken');
        const wsUrl = token 
          ? `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`
          : `${protocol}//${host}/ws`;
        
        ws.current = new WebSocket(wsUrl);
        
        // 연결 타임아웃 설정 (10초)
        const connectionTimeout = setTimeout(() => {
          if (ws.current?.readyState === WebSocket.CONNECTING) {
            console.warn('⏰ WebSocket 연결 타임아웃');
            ws.current?.close();
          }
        }, 10000);

        ws.current.onopen = () => {
          clearTimeout(connectionTimeout);
          setIsConnecting(false);
          setIsConnected(true);
          setConnectionAttempts(0); // 성공 시 카운터 리셋
          setLastHeartbeat(new Date());
          
          console.log('✅ WebSocket 연결 성공:', {
            timestamp: formatKoreanTime(),
            attempts: connectionAttempts + 1
          });
          
          // 연결 후 인증 메시지 전송 (URL 토큰이 없는 경우)
          if (!token && localStorage.getItem('authToken')) {
            const authToken = localStorage.getItem('authToken');
            if (authToken && ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({
                type: 'auth',
                token: authToken
              }));
              console.log('🔐 WebSocket 인증 메시지 전송');
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
            
            // 메시지 수신 시 heartbeat 업데이트
            setLastHeartbeat(new Date());
            
            console.log('📨 WebSocket 메시지 수신:', message.type, message.data);
            setLastMessage(message);
            
            // pong 메시지 처리
            if (message.type === 'pong') {
              console.log('💓 Heartbeat pong 수신');
              return;
            }
            
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

        ws.current.onclose = (event) => {
          clearTimeout(connectionTimeout);
          setIsConnecting(false);
          setIsConnected(false);
          
          console.log('❌ WebSocket 연결 종료:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            timestamp: formatKoreanTime()
          });
          
          // 재연결 지연 시간 계산 (지수 백오프)
          const delay = Math.min(1000 * Math.pow(2, Math.min(connectionAttempts, 5)), 30000);
          console.log(`🔄 ${delay}ms 후 재연결 시도...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        };

        ws.current.onerror = (error) => {
          console.error('❌ WebSocket 오류:', error);
          clearTimeout(connectionTimeout);
          setIsConnecting(false);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('❌ WebSocket 연결 실패:', error);
        setIsConnecting(false);
        setIsConnected(false);
        
        const delay = Math.min(1000 * Math.pow(2, Math.min(connectionAttempts, 5)), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      }
    };

    connectWebSocket();

    // 강화된 Heartbeat 시스템
    const heartbeatInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
        console.log('💓 Heartbeat ping 전송');
        
        // Heartbeat 타임아웃 설정 (5초 내 응답 없으면 재연결)
        heartbeatTimeoutRef.current = setTimeout(() => {
          console.warn('💔 Heartbeat 응답 없음 - 재연결 시도');
          ws.current?.close();
        }, 5000);
      }
    }, 15000); // 15초마다 heartbeat (기존 30초에서 단축)

    // Heartbeat 응답 감지
    const originalOnMessage = ws.current?.onmessage;

    return () => {
      clearInterval(heartbeatInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
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
    isConnecting,
    connectionAttempts,
    lastMessage,
    lastHeartbeat,
    subscribe,
    send,
    connected: isConnected // ✅ 호환성을 위해 추가
  };
}
