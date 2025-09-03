import WebSocket from 'ws';
import { priceCache } from './price-cache.js';
import { naverExchange } from './naver-exchange.js';

// ✅ 바이낸스 선물 aggTrade (최종 체결가)
export interface BinanceAggTrade {
  s: string; // symbol
  p: string; // price
}

export class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectInterval = 1000; // 1초
  private callbacks: { [id: string]: (data: BinanceAggTrade) => void } = {};

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // ✅ 선물 aggTrade 스트림 (최종 체결가 기반)
      const symbols = ['btcusdt', 'ethusdt', 'xrpusdt', 'adausdt', 'dotusdt']
        .map(s => `${s}@aggTrade`) // bookTicker -> aggTrade 로 변경
        .join('/');
      const url = `wss://fstream.binance.com/stream?streams=${symbols}`;

      console.log('🔌 바이낸스 [선물 aggTrade] WebSocket 연결 시도...');
      console.log('🔗 연결 URL:', url);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log('✅ 바이낸스 [선물 aggTrade] WebSocket 연결 성공');
        this.isConnected = true;
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.stream && message.data) {
            const trade = message.data as BinanceAggTrade;
            if (trade && trade.s && trade.p) {
              const symbol = trade.s.replace('USDT', '');
              const price = parseFloat(trade.p);
              priceCache.setBinancePrice(symbol, price, 'websocket');

              // 환율을 적용하여 원화 가격 계산
              const usdKrwRate = priceCache.getUsdtKrwEma() || naverExchange.getCurrentRate();
              const priceInKrw = price * usdKrwRate;

              console.log(`📊 바이낸스선물 ${symbol}: ₩${priceInKrw.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} (웹소켓-aggTrade)`);

              // 콜백 호출 유지 (타입은 내부적으로만 사용되므로 외부 영향 적음)
              Object.values(this.callbacks).forEach(cb => cb(trade as any));
            }
          } else {
            console.log('ℹ️ 바이낸스 WebSocket 비-거래 메시지 수신:', message);
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
  onData(id: string, callback: (data: BinanceAggTrade) => void) {
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
