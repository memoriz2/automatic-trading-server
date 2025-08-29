import WebSocket from 'ws';

interface UpbitTickerData {
  type: string;
  code: string;
  trade_price: number;
  timestamp: number;
}

export class UpbitWebSocketService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private callbacks: Map<string, (data: UpbitTickerData) => void> = new Map();

  constructor() {
    this.connect();
  }

  // WebSocket 연결
  private connect() {
    try {
      console.log('🔌 업비트 WebSocket 연결 시도...');
      
      // 정확한 업비트 WebSocket 주소
      this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');
      
      this.ws.on('open', () => {
        console.log('✅ 업비트 WebSocket 연결 성공');
        this.isConnected = true;
        
        // 실시간 티커 구독 (BTC, ETH, XRP, ADA, DOT)
        this.subscribe(['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOT']);
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'ticker') {
            console.log(`📊 ${message.code}: ₩${message.trade_price.toLocaleString()}`);
            
            // 등록된 콜백들에 데이터 전송
            this.callbacks.forEach(callback => {
              callback(message);
            });
          }
        } catch (error) {
          console.error('업비트 WebSocket 메시지 파싱 오류:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('🔌 업비트 WebSocket 연결 종료');
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('❌ 업비트 WebSocket 오류:', error);
        this.isConnected = false;
        this.scheduleReconnect();
      });

    } catch (error) {
      console.error('업비트 WebSocket 연결 실패:', error);
      this.scheduleReconnect();
    }
  }

  // 실시간 티커 구독
  private subscribe(codes: string[]) {
    if (!this.ws || !this.isConnected) return;

    const subscribeMessage = [
      { ticket: 'test' },
      {
        type: 'ticker',
        codes: codes,
        isOnlyRealtime: true // 실시간 데이터만
      }
    ];

    this.ws.send(JSON.stringify(subscribeMessage));
    console.log('🔔 업비트 실시간 티커 구독:', codes);
  }

  // 자동 재연결
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 업비트 WebSocket 재연결 시도...');
      this.connect();
    }, 5000);
  }

  // 데이터 수신 콜백 등록
  onData(id: string, callback: (data: UpbitTickerData) => void) {
    this.callbacks.set(id, callback);
  }

  // 콜백 제거
  removeCallback(id: string) {
    this.callbacks.delete(id);
  }

  // 연결 해제
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.callbacks.clear();
    console.log('🔌 업비트 WebSocket 연결 해제');
  }

  // 연결 상태 확인
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      callbackCount: this.callbacks.size
    };
  }
}
