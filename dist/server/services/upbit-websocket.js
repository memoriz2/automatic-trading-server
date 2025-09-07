/// <reference types="ws" />
import WebSocket from 'ws';
import { priceCache } from './price-cache.js';
var UpbitWebSocketService = /** @class */ (function () {
    function UpbitWebSocketService() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectTimer = null;
        this.callbacks = new Map();
        this.connect();
    }
    // WebSocket 연결
    UpbitWebSocketService.prototype.connect = function () {
        var _this = this;
        try {
            // console.log('🔌 업비트 WebSocket 연결 시도...');
            // 정확한 업비트 WebSocket 주소
            this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');
            this.ws.on('open', function () {
                // console.log('✅ 업비트 WebSocket 연결 성공');
                _this.isConnected = true;
                // 💥 자동 구독 로직 제거
                // const initialCodes = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOT', 'KRW-USDT'];
                // this.subscribe(initialCodes);
            });
            this.ws.on('message', function (data) {
                try {
                    var message_1 = JSON.parse(data.toString());
                    if (message_1.type === 'ticker') {
                        // 가격 캐시에 저장 (KRW- 제거하여 심볼 정규화)
                        var symbol = message_1.code.replace('KRW-', '');
                        var price = message_1.trade_price;
                        priceCache.setUpbitPrice(symbol, price, 'websocket');
                        // 등록된 콜백들에 데이터 전송
                        _this.callbacks.forEach(function (callback) {
                            callback(message_1);
                        });
                    }
                }
                catch (error) {
                    // console.error('업비트 WebSocket 메시지 파싱 오류:', error);
                }
            });
            this.ws.on('close', function (code, reason) {
                // console.log('🔌 업비트 WebSocket 연결 종료');
                _this.isConnected = false;
                _this.scheduleReconnect();
            });
            this.ws.on('error', function (error) {
                // console.error('❌ 업비트 WebSocket 오류:', error);
                _this.isConnected = false;
                _this.scheduleReconnect();
            });
        }
        catch (error) {
            // console.error('업비트 WebSocket 연결 실패:', error);
            this.scheduleReconnect();
        }
    };
    // 실시간 티커 구독 (외부에서 호출할 수 있도록 public으로 변경)
    UpbitWebSocketService.prototype.subscribe = function (codes) {
        var _this = this;
        var _a;
        if (!this.ws || !this.isConnected) {
            // 연결이 아직 안되었으면, 연결된 직후에 구독하도록 예약
            (_a = this.ws) === null || _a === void 0 ? void 0 : _a.on('open', function () {
                _this.subscribe(codes);
            });
            return;
        }
        var subscribeMessage = [
            { ticket: 'test' },
            {
                type: 'ticker',
                codes: codes,
                isOnlyRealtime: true // 실시간 데이터만
            }
        ];
        this.ws.send(JSON.stringify(subscribeMessage));
        // console.log('🔔 업비트 실시간 티커 구독:', codes);
    };
    // 자동 재연결
    UpbitWebSocketService.prototype.scheduleReconnect = function () {
        var _this = this;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(function () {
            // console.log('🔄 업비트 WebSocket 재연결 시도...');
            _this.connect();
        }, 5000);
    };
    // 데이터 수신 콜백 등록
    UpbitWebSocketService.prototype.onData = function (id, callback) {
        this.callbacks.set(id, callback);
    };
    // 콜백 제거
    UpbitWebSocketService.prototype.removeCallback = function (id) {
        this.callbacks.delete(id);
    };
    // 연결 해제
    UpbitWebSocketService.prototype.disconnect = function () {
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
    };
    // 연결 상태 확인
    UpbitWebSocketService.prototype.getConnectionStatus = function () {
        return {
            isConnected: this.isConnected,
            callbackCount: this.callbacks.size
        };
    };
    return UpbitWebSocketService;
}());
export { UpbitWebSocketService };
