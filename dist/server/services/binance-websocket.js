/// <reference types="ws" />
import WebSocket from 'ws';
import { priceCache } from './price-cache.js';
export class BinanceWebSocketService {
    ws = null;
    isConnected = false;
    reconnectInterval = 1000; // 1초
    callbacks = {};
    constructor() {
        this.connect();
    }
    connect() {
        try {
            // ✅ 선물 aggTrade 스트림 (최종 체결가 기반)
            const symbols = ['btcusdt', 'ethusdt', 'xrpusdt', 'adausdt', 'dotusdt']
                .map(s => `${s}@aggTrade`) // bookTicker -> aggTrade 로 변경
                .join('/');
            const url = `wss://fstream.binance.com/stream?streams=${symbols}`;
            // console.log('🔌 바이낸스 [선물 aggTrade] WebSocket 연결 시도...');
            // console.log('🔗 연결 URL:', url);
            this.ws = new WebSocket(url);
            this.ws.on('open', () => {
                // console.log('✅ 바이낸스 [선물 aggTrade] WebSocket 연결 성공');
                this.isConnected = true;
            });
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.stream && message.data) {
                        const trade = message.data;
                        if (trade && trade.s && trade.p) {
                            const symbol = trade.s.replace('USDT', '');
                            const price = parseFloat(trade.p);
                            // console.log(`📊 바이낸스 웹소켓 수신: ${symbol} = $${price.toLocaleString()}`);
                            priceCache.setBinancePrice(symbol, price, 'websocket');
                            // console.log(`📊 바이낸스선물 ${symbol}: ₩${priceInKrw.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} (웹소켓-aggTrade)`);
                            // 콜백 호출 유지 (타입은 내부적으로만 사용되므로 외부 영향 적음)
                            Object.values(this.callbacks).forEach(cb => cb(trade));
                        }
                    }
                    else {
                        // console.log('ℹ️ 바이낸스 WebSocket 비-거래 메시지 수신:', message);
                    }
                }
                catch (error) {
                    // console.error('바이낸스 WebSocket 메시지 처리 오류:', error, '원본 데이터:', data.toString());
                }
            });
            this.ws.on('_error', (_error) => {
                // console.error('바이낸스 WebSocket 오류:', error.message);
                this.scheduleReconnect();
            });
            this.ws.on('close', (_code, _reason) => {
                // console.log(`🔌 바이낸스 WebSocket 연결 종료: 코드=${code}, 이유=${reason.toString()}`);
                this.isConnected = false;
                this.scheduleReconnect();
            });
        }
        catch (error) {
            // console.error('바이낸스 WebSocket 연결 설정 오류:', error);
            this.scheduleReconnect();
        }
    }
    // 💥 잘못된 가정에 기반한 subscribe 함수는 완전히 제거
    // 자동 재연결
    scheduleReconnect() {
        if (this.ws) {
            this.ws.removeAllListeners(); // 기존 리스너들 제거
            this.ws.close(); // 연결 종료
            this.ws = null;
        }
        this.isConnected = false;
        // console.log('🔄 바이낸스 WebSocket 재연결 시도...');
        setTimeout(() => {
            // console.log('🔄 바이낸스 WebSocket 재연결 시도...');
            this.connect();
        }, this.reconnectInterval);
    }
    // 데이터 수신 콜백 등록
    onData(id, callback) {
        this.callbacks[id] = callback;
    }
    // 콜백 제거
    removeCallback(id) {
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
        // console.log('🔌 바이낸스 WebSocket 연결 해제');
    }
    // 연결 상태 확인
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            callbackCount: Object.keys(this.callbacks).length
        };
    }
}
