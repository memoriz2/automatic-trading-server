import WebSocket from 'ws';

interface BinanceTickerData {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  c: string; // Close price
  P: string; // Price change percent
}

export class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private callbacks: Map<string, (data: BinanceTickerData) => void> = new Map();

  constructor() {
    this.connect();
  }

  // WebSocket 연결
  private connect() {
    try {
      const symbols = 'btcusdt@ticker/ethusdt@ticker/xrpusdt@ticker/adausdt@ticker/dotusdt@ticker';
      const url = `wss://stream.binance.com/ws/${symbols}`;
      
      console.log('🔌 바이낸스 WebSocket 연결 시도...');
      console.log('🔗 연결 URL:', url);
      console.log('🌐 환경:', {
        NODE_ENV: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version
      });
      
      this.ws = new WebSocket(url);
      
      this.ws.on('open', () => {
        console.log('✅ 바이낸스 WebSocket 연결 성공');
        this.isConnected = true;
      });

      this.ws.on('message', (data) => {
        try {
          const ticker = JSON.parse(data.toString()) as BinanceTickerData;
          
          // 우리가 관심있는 심볼들만 필터링
          const targetSymbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'ADAUSDT', 'DOTUSDT'];
          
          if (ticker && ticker.s && targetSymbols.includes(ticker.s)) {
            const symbol = ticker.s.replace('USDT', '');
            const price = parseFloat(ticker.c);
            
            console.log(`📊 바이낸스 실시간 가격: ${symbol} = $${price.toLocaleString()}`);
            
            // 등록된 콜백들에 데이터 전송
            this.callbacks.forEach(callback => {
              callback(ticker);
            });
          }
        } catch (error) {
          console.error('바이낸스 WebSocket 메시지 파싱 오류:', error);
          console.log('Raw message:', data.toString());
        }
      });

      this.ws.on('close', () => {
        console.log('🔌 바이낸스 WebSocket 연결 종료');
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('❌ 바이낸스 WebSocket 오류:', error);
        console.error('❌ 오류 세부사항:', {
          message: error.message,
          code: (error as any).code,
          type: (error as any).type,
          target: (error as any).target?.url || 'unknown'
        });
        this.isConnected = false;
        this.scheduleReconnect();
      });

    } catch (error) {
      console.error('바이낸스 WebSocket 연결 실패:', error);
      console.log('🔄 대안 연결 시도 중... (포트 없이)');
      this.tryAlternativeConnection();
    }
  }

  // 대안 연결 방법
  private tryAlternativeConnection() {
    try {
      const symbols = 'btcusdt@ticker/ethusdt@ticker/xrpusdt@ticker/adausdt@ticker/dotusdt@ticker';
      const alternativeUrl = `wss://stream.binance.com/ws/${symbols}`;
      
      console.log('🔗 대안 URL:', alternativeUrl);
      
      this.ws = new WebSocket(alternativeUrl);
      
      this.ws.on('open', () => {
        console.log('✅ 바이낸스 WebSocket 대안 연결 성공');
        this.isConnected = true;
      });

      this.ws.on('message', (data) => {
        try {
          const ticker = JSON.parse(data.toString()) as BinanceTickerData;
          
          // 우리가 관심있는 심볼들만 필터링
          const targetSymbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'ADAUSDT', 'DOTUSDT'];
          
          if (ticker && ticker.s && targetSymbols.includes(ticker.s)) {
            const symbol = ticker.s.replace('USDT', '');
            const price = parseFloat(ticker.c);
            
            console.log(`📊 바이낸스 실시간 가격: ${symbol} = $${price.toLocaleString()}`);
            
            // 등록된 콜백들에 데이터 전송
            this.callbacks.forEach(callback => {
              callback(ticker);
            });
          }
        } catch (error) {
          console.error('바이낸스 WebSocket 메시지 파싱 오류:', error);
          console.log('Raw message:', data.toString());
        }
      });

      this.ws.on('close', () => {
        console.log('🔌 바이낸스 WebSocket 대안 연결 종료');
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('❌ 바이낸스 WebSocket 대안 연결 오류:', error);
        this.isConnected = false;
        this.scheduleReconnect();
      });

    } catch (error) {
      console.error('대안 연결도 실패:', error);
      this.scheduleReconnect();
    }
  }

  // 자동 재연결
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 바이낸스 WebSocket 재연결 시도...');
      this.connect();
    }, 5000);
  }

  // 데이터 수신 콜백 등록
  onData(id: string, callback: (data: BinanceTickerData) => void) {
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
    console.log('🔌 바이낸스 WebSocket 연결 해제');
  }

  // 연결 상태 확인
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      callbackCount: this.callbacks.size
    };
  }
}
