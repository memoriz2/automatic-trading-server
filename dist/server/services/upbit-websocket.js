/// <reference types="ws" />
import WebSocket from 'ws';
import { priceCache } from './price-cache.js';
export class UpbitWebSocketService {
    ws = null;
    isConnected = false;
    reconnectTimer = null;
    callbacks = new Map();
    constructor() {
        this.connect();
    }
    // WebSocket 연결
    connect() {
        try {
            // console.log('🔌 업비트 WebSocket 연결 시도...');
            // 정확한 업비트 WebSocket 주소
            this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');
            this.ws.on('open', () => {
                // console.log('✅ 업비트 WebSocket 연결 성공');
                this.isConnected = true;
                // 💥 자동 구독 로직 제거
                // const initialCodes = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOT', 'KRW-USDT'];
                // this.subscribe(initialCodes);
            });
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'ticker') {
                        // 가격 캐시에 저장 (KRW- 제거하여 심볼 정규화)
                        const symbol = message.code.replace('KRW-', '');
                        const price = message.trade_price;
                        // console.log(`📊 업비트 웹소켓 수신: ${symbol} = ₩${price.toLocaleString()}`);
                        priceCache.setUpbitPrice(symbol, price, 'websocket');
                        // 등록된 콜백들에 데이터 전송
                        this.callbacks.forEach(callback => {
                            callback(message);
                        });
                    }
                }
                catch (error) {
                    // console.error('업비트 WebSocket 메시지 파싱 오류:', error);
                }
            });
            this.ws.on('close', (code, reason) => {
                // console.log('🔌 업비트 WebSocket 연결 종료');
                this.isConnected = false;
                this.scheduleReconnect();
            });
            this.ws.on('error', (error) => {
                // console.error('❌ 업비트 WebSocket 오류:', error);
                this.isConnected = false;
                this.scheduleReconnect();
            });
        }
        catch (error) {
            // console.error('업비트 WebSocket 연결 실패:', error);
            this.scheduleReconnect();
        }
    }
    // 실시간 티커 구독 (외부에서 호출할 수 있도록 public으로 변경)
    subscribe(codes) {
        if (!this.ws || !this.isConnected) {
            // 연결이 아직 안되었으면, 연결된 직후에 구독하도록 예약
            this.ws?.on('open', () => {
                this.subscribe(codes);
            });
            return;
        }
        const subscribeMessage = [
            { ticket: 'test' },
            {
                type: 'ticker',
                codes: codes,
                isOnlyRealtime: true // 실시간 데이터만
            }
        ];
        this.ws.send(JSON.stringify(subscribeMessage));
        // console.log('🔔 업비트 실시간 티커 구독:', codes);
    }
    // 자동 재연결
    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(() => {
            // console.log('🔄 업비트 WebSocket 재연결 시도...');
            this.connect();
        }, 5000);
    }
    // 데이터 수신 콜백 등록
    onData(id, callback) {
        this.callbacks.set(id, callback);
    }
    // 콜백 제거
    removeCallback(id) {
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
        // console.log('🔌 업비트 WebSocket 연결 해제');
    }
    // 연결 상태 확인
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            callbackCount: this.callbacks.size
        };
    }
}
