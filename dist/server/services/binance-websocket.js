/// <reference types="ws" />
import WebSocket from 'ws';
import { priceCache } from './price-cache.js';
import { naverExchange } from './naver-exchange.js';
var BinanceWebSocketService = /** @class */ (function () {
    function BinanceWebSocketService() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectInterval = 1000; // 1초
        this.callbacks = {};
        this.connect();
    }
    BinanceWebSocketService.prototype.connect = function () {
        var _this = this;
        try {
            // ✅ 선물 aggTrade 스트림 (최종 체결가 기반)
            var symbols = ['btcusdt', 'ethusdt', 'xrpusdt', 'adausdt', 'dotusdt']
                .map(function (s) { return "".concat(s, "@aggTrade"); }) // bookTicker -> aggTrade 로 변경
                .join('/');
            var url = "wss://fstream.binance.com/stream?streams=".concat(symbols);
            // console.log('🔌 바이낸스 [선물 aggTrade] WebSocket 연결 시도...');
            // console.log('🔗 연결 URL:', url);
            this.ws = new WebSocket(url);
            this.ws.on('open', function () {
                // console.log('✅ 바이낸스 [선물 aggTrade] WebSocket 연결 성공');
                _this.isConnected = true;
            });
            this.ws.on('message', function (data) {
                try {
                    var message = JSON.parse(data.toString());
                    if (message.stream && message.data) {
                        var trade_1 = message.data;
                        if (trade_1 && trade_1.s && trade_1.p) {
                            var symbol = trade_1.s.replace('USDT', '');
                            var price = parseFloat(trade_1.p);
                            priceCache.setBinancePrice(symbol, price, 'websocket');
                            // 환율을 적용하여 원화 가격 계산
                            var usdKrwRate = priceCache.getUsdtKrwEma() || naverExchange.getCurrentRate();
                            var priceInKrw = price * usdKrwRate;
                            // console.log(`📊 바이낸스선물 ${symbol}: ₩${priceInKrw.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} (웹소켓-aggTrade)`);
                            // 콜백 호출 유지 (타입은 내부적으로만 사용되므로 외부 영향 적음)
                            Object.values(_this.callbacks).forEach(function (cb) { return cb(trade_1); });
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
            this.ws.on('error', function (error) {
                // console.error('바이낸스 WebSocket 오류:', error.message);
                _this.scheduleReconnect();
            });
            this.ws.on('close', function (code, reason) {
                // console.log(`🔌 바이낸스 WebSocket 연결 종료: 코드=${code}, 이유=${reason.toString()}`);
                _this.isConnected = false;
                _this.scheduleReconnect();
            });
        }
        catch (error) {
            // console.error('바이낸스 WebSocket 연결 설정 오류:', error);
            this.scheduleReconnect();
        }
    };
    // 💥 잘못된 가정에 기반한 subscribe 함수는 완전히 제거
    // 자동 재연결
    BinanceWebSocketService.prototype.scheduleReconnect = function () {
        var _this = this;
        if (this.ws) {
            this.ws.removeAllListeners(); // 기존 리스너들 제거
            this.ws.close(); // 연결 종료
            this.ws = null;
        }
        this.isConnected = false;
        // console.log('🔄 바이낸스 WebSocket 재연결 시도...');
        setTimeout(function () {
            // console.log('🔄 바이낸스 WebSocket 재연결 시도...');
            _this.connect();
        }, this.reconnectInterval);
    };
    // 데이터 수신 콜백 등록
    BinanceWebSocketService.prototype.onData = function (id, callback) {
        this.callbacks[id] = callback;
    };
    // 콜백 제거
    BinanceWebSocketService.prototype.removeCallback = function (id) {
        delete this.callbacks[id];
    };
    // 연결 해제
    BinanceWebSocketService.prototype.disconnect = function () {
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.callbacks = {};
        // console.log('🔌 바이낸스 WebSocket 연결 해제');
    };
    // 연결 상태 확인
    BinanceWebSocketService.prototype.getConnectionStatus = function () {
        return {
            isConnected: this.isConnected,
            callbackCount: Object.keys(this.callbacks).length
        };
    };
    return BinanceWebSocketService;
}());
export { BinanceWebSocketService };
