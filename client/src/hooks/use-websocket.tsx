import { useEffect, useRef, useState } from 'react';
import type { WebSocketMessage } from '@/types/trading';
import { formatKoreanTime } from '@/utils/datetime';
import { logger } from '@/utils/logger';

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
        
        // 포트 결정 로직 개선
        let port: string;
        if (window.location.port) {
          port = window.location.port;
        } else if (protocol === "wss:") {
          port = "443";
        } else {
          // HTTP 환경에서 기본 포트 결정
          port = window.location.hostname === 'localhost' ? "5001" : "5000";
        }
        
        const host = `${baseHostname}:${port}`;
        
        // 연결 시도는 첫 번째와 실패 후에만 로그
        if (connectionAttempts === 0 || connectionAttempts % 3 === 0) {
          logger.websocket.info(`🔍 WebSocket 연결 시도 #${connectionAttempts + 1}`);
        }
        
        // 인증 토큰 추가
        const token = localStorage.getItem('authToken');
        
        // URL 유효성 검사
        if (!host || host.includes('undefined')) {
          throw new Error(`Invalid WebSocket host: ${host}`);
        }
        
        const wsUrl = token 
          ? `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`
          : `${protocol}//${host}/ws`;
          
        console.log('🔍 WebSocket URL 생성:', { protocol, host, wsUrl });
        
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
          
          logger.websocket.info('✅ WebSocket 연결 성공');
          
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
            
            // WebSocket 메시지 수신
            setLastMessage(message);
            
            // pong 메시지 처리 (로그 없이 처리)
            if (message.type === 'pong') {
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
          
          // 비정상 종료만 로그로 기록
          if (!event.wasClean) {
            logger.websocket.warn(`❌ WebSocket 비정상 종료 (${event.code}): ${event.reason || '알 수 없는 오류'}`);
          }
          
          // 재연결 지연 시간 계산 (지수 백오프)
          const delay = Math.min(3000 * Math.pow(2, Math.min(connectionAttempts, 5)), 30000);
          // 재연결 로그는 실패가 반복될 때만 표시
          if (connectionAttempts > 1) {
            logger.websocket.info(`🔄 ${delay}ms 후 재연결 시도... (시도 #${connectionAttempts + 1})`);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        };

        ws.current.onerror = (error) => {
          logger.websocket.error('❌ WebSocket 오류:', error);
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

    // 강화된 Heartbeat 시스템 (로그 최소화)
    const heartbeatInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
        
        // Heartbeat 타임아웃 설정 (10초 내 응답 없으면 재연결)
        heartbeatTimeoutRef.current = setTimeout(() => {
          logger.websocket.warn('💔 Heartbeat 응답 없음 - 재연결 시도');
          ws.current?.close();
        }, 10000);
      }
    }, 15000); // 15초마다 heartbeat

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
