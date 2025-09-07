/**
 * 웹소켓 가격 데이터 캐시 시스템
 * REST API 대신 실시간 웹소켓 데이터를 사용하여 빠른 가격 조회 제공
 */
var PriceCacheService = /** @class */ (function () {
    function PriceCacheService() {
        this.upbitPrices = new Map();
        this.binancePrices = new Map();
        this.priceHistory = {}; // ex: 'UPBIT_BTC', 'BINANCE_BTC'
        this.SMA_WINDOW = 5; // 5개 데이터의 이동평균
        this.CACHE_EXPIRE_MS = 10000; // 10초 후 만료
        this.emaRate = null; // USDT/KRW EMA
        this.EMA_ALPHA = 2 / (5 + 1); // 5초 EMA 가중치 (대략 5틱 가정)
        this.priceUpdateCallbacks = [];
        this.namedCallbacks = new Map();
    }
    /**
     * 업비트 가격 캐시에 저장
     */
    PriceCacheService.prototype.setUpbitPrice = function (symbol, price, source) {
        if (source === void 0) { source = 'websocket'; }
        this.upbitPrices.set(symbol, {
            price: price,
            timestamp: Date.now(),
            source: source
        });
        // 이동평균을 위한 히스토리 업데이트
        var key = "UPBIT_".concat(symbol);
        if (!this.priceHistory[key])
            this.priceHistory[key] = [];
        this.priceHistory[key].push(price);
        if (this.priceHistory[key].length > this.SMA_WINDOW) {
            this.priceHistory[key].shift();
        }
        if (source === 'websocket') {
            // console.log(`📊 업비트 ${symbol}: ₩${price.toLocaleString()} (웹소켓)`);
            // USDT 환율 EMA 업데이트
            if (symbol === 'USDT') {
                if (this.emaRate == null) {
                    this.emaRate = price;
                }
                else {
                    this.emaRate = this.emaRate + this.EMA_ALPHA * (price - this.emaRate);
                }
                // console.log(`📈 USDT/KRW EMA: ${this.emaRate.toFixed(2)} (raw: ${price.toFixed(2)})`);
            }
            // 🚀 가격 변동시 실시간 김치 계산 트리거
            this.priceUpdateCallbacks.forEach(function (callback) {
                try {
                    callback('upbit', symbol, price);
                }
                catch (error) {
                    console.error('업비트 가격 변동 콜백 오류:', error);
                }
            });
        }
    };
    /**
     * 바이낸스 가격 캐시에 저장
     */
    PriceCacheService.prototype.setBinancePrice = function (symbol, price, source) {
        if (source === void 0) { source = 'websocket'; }
        this.binancePrices.set(symbol, {
            price: price,
            timestamp: Date.now(),
            source: source
        });
        // 이동평균을 위한 히스토리 업데이트
        var key = "BINANCE_".concat(symbol);
        if (!this.priceHistory[key])
            this.priceHistory[key] = [];
        this.priceHistory[key].push(price);
        if (this.priceHistory[key].length > this.SMA_WINDOW) {
            this.priceHistory[key].shift();
        }
        if (source === 'websocket') {
            // console.log(`📊 바이낸스 ${symbol}: $${price.toLocaleString()} (웹소ket)`);
            // 🚀 가격 변동시 실시간 김치 계산 트리거
            this.priceUpdateCallbacks.forEach(function (callback) {
                try {
                    callback('binance', symbol, price);
                }
                catch (error) {
                    console.error('바이낸스 가격 변동 콜백 오류:', error);
                }
            });
        }
    };
    /**
     * 업비트 가격 조회 (캐시 우선, 없으면 null)
     */
    PriceCacheService.prototype.getUpbitPrice = function (symbol) {
        var cached = this.upbitPrices.get(symbol);
        if (!cached) {
            return null;
        }
        // 캐시 만료 확인
        if (Date.now() - cached.timestamp > this.CACHE_EXPIRE_MS) {
            // console.warn(`⚠️ 업비트 ${symbol} 캐시 만료 (${Math.round((Date.now() - cached.timestamp) / 1000)}초 전)`);
            return null;
        }
        return cached.price;
    };
    /**
     * 업비트 가격+타임스탬프 조회 (만료시 null)
     */
    PriceCacheService.prototype.getUpbitPriceWithTs = function (symbol) {
        var cached = this.upbitPrices.get(symbol);
        if (!cached) {
            return null;
        }
        if (Date.now() - cached.timestamp > this.CACHE_EXPIRE_MS) {
            // console.warn(`⚠️ 업비트 ${symbol} 캐시 만료 (${Math.round((Date.now() - cached.timestamp) / 1000)}초 전)`);
            return null;
        }
        return cached;
    };
    /**
     * 바이낸스 가격 조회 (캐시 우선, 없으면 null)
     */
    PriceCacheService.prototype.getBinancePrice = function (symbol) {
        var cached = this.binancePrices.get(symbol);
        if (!cached) {
            return null;
        }
        // 캐시 만료 확인
        if (Date.now() - cached.timestamp > this.CACHE_EXPIRE_MS) {
            // console.warn(`⚠️ 바이낸스 ${symbol} 캐시 만료 (${Math.round((Date.now() - cached.timestamp) / 1000)}초 전)`);
            return null;
        }
        return cached.price;
    };
    /**
     * 바이낸스 가격+타임스탬프 조회 (만료시 null)
     */
    PriceCacheService.prototype.getBinancePriceWithTs = function (symbol) {
        var cached = this.binancePrices.get(symbol);
        if (!cached) {
            return null;
        }
        if (Date.now() - cached.timestamp > this.CACHE_EXPIRE_MS) {
            // console.warn(`⚠️ 바이낸스 ${symbol} 캐시 만료 (${Math.round((Date.now() - cached.timestamp) / 1000)}초 전)`);
            return null;
        }
        return cached;
    };
    /**
     * 업비트 SMA 가격 조회
     */
    PriceCacheService.prototype.getUpbitSma = function (symbol) {
        var key = "UPBIT_".concat(symbol);
        var history = this.priceHistory[key];
        if (!history || history.length < this.SMA_WINDOW) {
            return this.getUpbitPrice(symbol); // 데이터가 부족하면 현재가 반환
        }
        var sum = history.reduce(function (a, b) { return a + b; }, 0);
        return sum / history.length;
    };
    /**
     * 바이낸스 SMA 가격 조회
     */
    PriceCacheService.prototype.getBinanceSma = function (symbol) {
        var key = "BINANCE_".concat(symbol);
        var history = this.priceHistory[key];
        if (!history || history.length < this.SMA_WINDOW) {
            return this.getBinancePrice(symbol); // 데이터가 부족하면 현재가 반환
        }
        var sum = history.reduce(function (a, b) { return a + b; }, 0);
        return sum / history.length;
    };
    /**
     * 캐시 상태 확인
     */
    PriceCacheService.prototype.getCacheStatus = function () {
        return {
            upbitCount: this.upbitPrices.size,
            binanceCount: this.binancePrices.size,
            upbitSymbols: Array.from(this.upbitPrices.keys()),
            binanceSymbols: Array.from(this.binancePrices.keys())
        };
    };
    /**
     * USDT/KRW EMA 환율 조회 (없으면 null)
     */
    PriceCacheService.prototype.getUsdtKrwEma = function () {
        return this.emaRate;
    };
    /**
     * 가격 변동 콜백 등록
     */
    PriceCacheService.prototype.onPriceUpdate = function (callback) {
        this.priceUpdateCallbacks.push(callback);
        // console.log(`📡 가격 변동 콜백 등록 (총 ${this.priceUpdateCallbacks.length}개)`);
    };
    PriceCacheService.prototype.onUpdate = function (name, callback) {
        this.namedCallbacks.set(name, callback);
    };
    PriceCacheService.prototype.removeCallback = function (name) {
        this.namedCallbacks.delete(name);
    };
    /**
     * 만료된 캐시 정리
     */
    PriceCacheService.prototype.cleanExpiredCache = function () {
        var _this = this;
        var now = Date.now();
        // 업비트 캐시 정리
        this.upbitPrices.forEach(function (cached, symbol) {
            if (now - cached.timestamp > _this.CACHE_EXPIRE_MS) {
                _this.upbitPrices.delete(symbol);
                // console.log(`🧹 만료된 업비트 ${symbol} 캐시 삭제`);
            }
        });
        // 바이낸스 캐시 정리
        this.binancePrices.forEach(function (cached, symbol) {
            if (now - cached.timestamp > _this.CACHE_EXPIRE_MS) {
                _this.binancePrices.delete(symbol);
                // console.log(`🧹 만료된 바이낸스 ${symbol} 캐시 삭제`);
            }
        });
    };
    return PriceCacheService;
}());
export { PriceCacheService };
// 싱글톤 인스턴스
export var priceCache = new PriceCacheService();
// 5초마다 만료된 캐시 정리
setInterval(function () {
    priceCache.cleanExpiredCache();
}, 5000);
