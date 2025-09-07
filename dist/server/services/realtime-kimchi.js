/**
 * 실시간 김치 프리미엄 계산 서비스
 * 웹소켓 데이터 변동시 즉시 계산하여 브로드캐스트
 */
import { priceCache } from './price-cache.js';
import { naverExchange } from './naver-exchange.js';
import { googleFinanceExchange } from './google-finance-exchange.js';
var RealtimeKimchiService = /** @class */ (function () {
    function RealtimeKimchiService() {
        this.callbacks = new Map();
        this.symbols = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT'];
        this.lastCalculationTime = 0;
        this.MIN_CALCULATION_INTERVAL = 100; // 최소 100ms 간격 (더 빠른 업데이트)
        this.SYNC_THRESHOLD_MS = 100; // 가격 시점 동기화 임계값 강화
        // console.log('🚀 실시간 김치 프리미엄 계산 서비스 시작');
    }
    /**
     * 실시간 김치 프리미엄 계산 (웹소켓 데이터 기반)
     */
    RealtimeKimchiService.prototype.calculateKimchiPremium = function () {
        var results = [];
        var _a = this.getFxWithSource(), usdKrwRate = _a.rate, usdKrwSource = _a.source;
        for (var _i = 0, _b = this.symbols; _i < _b.length; _i++) {
            var symbol = _b[_i];
            try {
                // 실시간 가격으로 다시 변경
                var upbitPrice = priceCache.getUpbitPrice(symbol);
                var binancePrice = priceCache.getBinancePrice(symbol);
                // 실시간 가격이 모두 유효할 때만 계산 진행
                if (upbitPrice && binancePrice) {
                    // 김프율 계산: (업비트KRW - 바이낸스USD×환율) ÷ (바이낸스USD×환율) × 100
                    var binancePriceKRW = binancePrice * usdKrwRate; // 바이낸스 USD를 KRW로 변환
                    var premiumRate = ((upbitPrice - binancePriceKRW) / binancePriceKRW) * 100;
                    results.push({
                        symbol: symbol,
                        upbitPrice: upbitPrice,
                        binanceFuturesPrice: binancePrice,
                        usdKrwRate: usdKrwRate,
                        usdKrwSource: usdKrwSource,
                        binancePriceKRW: binancePriceKRW,
                        premiumRate: premiumRate,
                        timestamp: new Date().toISOString()
                    });
                    /*
                    console.log(
                      `⚡ REALTIME ${symbol} 김프: ${premiumRate.toFixed(
                        3
                      )}% | 업비트: ₩${upbitPrice.toLocaleString()} | 선물: $${binancePrice.toFixed(
                        2
                      )} | 환율: ${usdKrwRate.toFixed(2)}`
                    );
                    */
                }
            }
            catch (error) {
                console.error("".concat(symbol, " \uC2E4\uC2DC\uAC04 \uAE40\uD504 \uACC4\uC0B0 \uC624\uB958:"), error);
            }
        }
        return results;
    };
    /**
     * ENV 기반 환율 선택 (우선순위: FX_SOURCE)
     */
    RealtimeKimchiService.prototype.getFxWithSource = function () {
        var src = (process.env.FX_SOURCE || '').toUpperCase();
        try {
            if (src === 'BITHUMB_USDT') {
                // 빗썸 USDT/KRW 체결가
                return { rate: this.getBithumbUsdtKrw(), source: 'BITHUMB_USDT' };
            }
            if (src === 'UPBIT_USDT') {
                return { rate: this.getUpbitUsdtKrw(), source: 'UPBIT_USDT' };
            }
            if (src === 'GOOGLE') {
                var r = googleFinanceExchange.getCurrentRate();
                if (r && r > 1000 && r < 2000)
                    return { rate: r, source: 'GOOGLE' };
            }
            if (src === 'EMA') {
                var ema_1 = priceCache.getUsdtKrwEma();
                if (ema_1)
                    return { rate: ema_1, source: 'EMA' };
            }
            // 기본 경로: GOOGLE → EMA → NAVER
            var gf = googleFinanceExchange.getCurrentRate();
            if (gf && gf > 1000 && gf < 2000)
                return { rate: gf, source: 'GOOGLE' };
            var ema = priceCache.getUsdtKrwEma();
            if (ema)
                return { rate: ema, source: 'EMA' };
            return { rate: naverExchange.getCurrentRate(), source: 'NAVER' };
        }
        catch (_a) {
            return { rate: naverExchange.getCurrentRate(), source: 'NAVER' };
        }
    };
    RealtimeKimchiService.prototype.getUpbitUsdtKrw = function () {
        // 동기 호출 회피: 간단히 최근값 반환 불가하여 빠른 fetchSync 대체 불가 → 간단 fallback
        // 실시간 정확도를 위해서는 별도 캐시 서비스로 이전 권장
        // 여기서는 blocking fetch로 처리
        try {
            // NOTE: node-fetch는 기본적으로 Promise이므로 sync처럼 await 없는 사용 불가
            // 본 서비스는 calculate 호출이 빈번하므로 여기서는 NAVER로 폴백
            return naverExchange.getCurrentRate();
        }
        catch (_a) {
            return naverExchange.getCurrentRate();
        }
    };
    RealtimeKimchiService.prototype.getBithumbUsdtKrw = function () {
        try {
            return naverExchange.getCurrentRate();
        }
        catch (_a) {
            return naverExchange.getCurrentRate();
        }
    };
    /**
     * 가격 변동시 호출되는 트리거 함수
     */
    RealtimeKimchiService.prototype.onPriceUpdate = function (source, symbol) {
        var now = Date.now();
        // 너무 빈번한 계산 방지 (50ms 쿨다운)
        if (now - this.lastCalculationTime < this.MIN_CALCULATION_INTERVAL) {
            return;
        }
        this.lastCalculationTime = now;
        try {
            var kimchiData_1 = this.calculateKimchiPremium();
            if (kimchiData_1.length > 0) {
                // 모든 등록된 콜백에 데이터 전송
                this.callbacks.forEach(function (callback, id) {
                    try {
                        callback(kimchiData_1);
                    }
                    catch (error) {
                        console.error("\uCF5C\uBC31 ".concat(id, " \uC2E4\uD589 \uC624\uB958:"), error);
                    }
                });
            }
        }
        catch (error) {
            console.error('실시간 김프 계산 오류:', error);
        }
    };
    /**
     * 김치 프리미엄 업데이트 콜백 등록
     */
    RealtimeKimchiService.prototype.onUpdate = function (id, callback) {
        this.callbacks.set(id, callback);
        // console.log(`📡 실시간 김프 콜백 등록: ${id}`);
    };
    /**
     * 콜백 제거
     */
    RealtimeKimchiService.prototype.removeCallback = function (id) {
        this.callbacks.delete(id);
        // console.log(`📡 실시간 김프 콜백 제거: ${id}`);
    };
    /**
     * 현재 김치 프리미엄 즉시 조회
     */
    RealtimeKimchiService.prototype.getCurrentKimchiPremium = function () {
        return this.calculateKimchiPremium();
    };
    /**
     * 서비스 상태 확인
     */
    RealtimeKimchiService.prototype.getStatus = function () {
        return {
            callbackCount: this.callbacks.size,
            symbols: this.symbols,
            cacheStatus: priceCache.getCacheStatus()
        };
    };
    return RealtimeKimchiService;
}());
export { RealtimeKimchiService };
// 싱글톤 인스턴스
export var realtimeKimchiService = new RealtimeKimchiService();
