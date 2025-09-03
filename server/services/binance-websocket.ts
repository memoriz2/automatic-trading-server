import WebSocket from 'ws';
import { priceCache } from './price-cache.js';

// ✅ 바이낸스 선물 bookTicker (bid/ask 중간가)
export interface BinanceBookTicker {
  s: string; // symbol
  b: string; // best bid
  a: string; // best ask
}

export class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectInterval = 1000; // 1초
  private callbacks: { [id: string]: (data: BinanceBookTicker) => void } = {};

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // ✅ 선물 bookTicker 스트림 (호가 중간가 기반, 빠른 반응)
      const symbols = ['btcusdt', 'ethusdt', 'xrpusdt', 'adausdt', 'dotusdt']
        .map(s => `${s}@bookTicker`)
        .join('/');
      const url = `wss://fstream.binance.com/stream?streams=${symbols}`;

      console.log('🔌 바이낸스 [선물 bookTicker] WebSocket 연결 시도...');
      console.log('🔗 연결 URL:', url);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log('✅ 바이낸스 [선물 bookTicker] WebSocket 연결 성공');
        this.isConnected = true;
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.stream && message.data) {
            const bt = message.data as BinanceBookTicker;
            if (bt && bt.s && bt.b && bt.a) {
              const symbol = bt.s.replace('USDT', '');
              const price = (parseFloat(bt.b) + parseFloat(bt.a)) / 2;
              priceCache.setBinancePrice(symbol, price, 'websocket');

              console.log(`📊 바이낸스선물 ${symbol}: $${price} (웹소켓-bookTicker)`);

              // 콜백 호출 유지
              Object.values(this.callbacks).forEach(cb => cb(bt));
            }
          } else {
            console.log('ℹ️ 바이낸스 WebSocket 비-티커 메시지 수신:', message);
          }
        } catch (error) {
          console.error('바이낸스 WebSocket 메시지 처리 오류:', error, '원본 데이터:', data.toString());
        }
      });

      this.ws.on('error', (error) => {
        console.error('바이낸스 WebSocket 오류:', error.message);
        this.scheduleReconnect();
      });

      this.ws.on('close', (code, reason) => {
        console.log(`🔌 바이낸스 WebSocket 연결 종료: 코드=${code}, 이유=${reason.toString()}`);
        this.isConnected = false;
        this.scheduleReconnect();
      });
    } catch (error) {
      console.error('바이낸스 WebSocket 연결 설정 오류:', error);
      this.scheduleReconnect();
    }
  }
  
  // 💥 잘못된 가정에 기반한 subscribe 함수는 완전히 제거

  // 자동 재연결
  private scheduleReconnect() {
    if (this.ws) {
      this.ws.removeAllListeners(); // 기존 리스너들 제거
      this.ws.close(); // 연결 종료
      this.ws = null;
    }

    this.isConnected = false;
    console.log('🔄 바이낸스 WebSocket 재연결 시도...');
    setTimeout(() => {
      console.log('🔄 바이낸스 WebSocket 재연결 시도...');
      this.connect();
    }, this.reconnectInterval);
  }

  // 데이터 수신 콜백 등록
  onData(id: string, callback: (data: BinanceBookTicker) => void) {
    this.callbacks[id] = callback;
  }

  // 콜백 제거
  removeCallback(id: string) {
    delete this.callbacks[id];
  }

  // 연결 해제
  disconnect() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.callbacks = {};
    console.log('🔌 바이낸스 WebSocket 연결 해제');
  }

  // 연결 상태 확인
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      callbackCount: Object.keys(this.callbacks).length
    };
  }
}
