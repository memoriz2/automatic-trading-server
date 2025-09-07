var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import 'dotenv/config';
import { UpbitService } from './upbit.js';
import { BinanceService } from './binance.js';
import { storage } from '../storage.js';
import { UpbitWebSocketService } from './upbit-websocket.js';
import { BinanceWebSocketService } from './binance-websocket.js';
import { GoogleFinanceExchangeService } from './google-finance-exchange.js';
var KimchiService = /** @class */ (function () {
    function KimchiService() {
        this.usdtKrwRate = 1300; // 실시간 USDT 환율
        this.realtimePrices = { upbit: {}, binance: {} };
        this.latestKimchiPremiums = [];
        this.symbols = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT'];
        this.isInitialized = false;
        this.onUpdateCallback = null;
        this.exchangeRateInterval = null;
        this.upbitService = new UpbitService();
        this.binanceService = new BinanceService();
        this.googleFinanceExchangeService = new GoogleFinanceExchangeService();
    }
    KimchiService.prototype.initialize = function () {
        var _this = this;
        if (this.isInitialized)
            return;
        console.log('🚀 실시간 김프 서비스 초기화 (구글 환율 기준)');
        // 0. 환율 업데이트 시작 (💥 10초마다 -> 3초마다)
        this.updateExchangeRate(); // 즉시 1회 실행
        this.exchangeRateInterval = setInterval(function () { return _this.updateExchangeRate(); }, 3000); // 10000 -> 3000
        // 1. 웹소켓 서비스 초기화
        this.upbitWebSocketService = new UpbitWebSocketService();
        this.binanceWebSocketService = new BinanceWebSocketService();
        // 2. 업비트 데이터 수신 콜백 *먼저* 등록
        this.upbitWebSocketService.onData('kimchi-service', function (data) {
            // 💥 KRW-USDT 환율 처리 로직 제거
            var symbol = data.cd.replace('KRW-', '');
            _this.realtimePrices.upbit[symbol] = data.trade_price;
            _this.recalculateAndStorePremiums();
        });
        // 3. 바이낸스 데이터 수신 콜백 *먼저* 등록
        this.binanceWebSocketService.onData('kimchi-service', function (data) {
            var symbol = data.s.replace('USDT', '');
            // 💥 현물(c) -> 선물(p) 데이터 필드로 복귀
            _this.realtimePrices.binance[symbol] = parseFloat(data.p);
            _this.recalculateAndStorePremiums();
        });
        // 4. 모든 준비가 끝난 후, 데이터 구독 *시작*
        // 💥 KRW-USDT 구독 제거
        this.upbitWebSocketService.subscribe(['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOT']);
        // 💥 바이낸스는 연결 시 자동으로 구독되므로, 불필요한 subscribe 호출을 제거합니다.
        this.isInitialized = true;
        console.log('✅ 실시간 김프 서비스 초기화 완료.');
    };
    KimchiService.prototype.updateExchangeRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // 💥 getRate() -> getCurrentRate()로 변경하여 불필요한 호출 방지
                    this.usdtKrwRate = this.googleFinanceExchangeService.getCurrentRate();
                    // console.log(`💱 USD/KRW 환율 업데이트 (Google): ${this.usdtKrwRate}`);
                    // 환율이 업데이트 되었으므로, 프리미엄 재계산
                    this.recalculateAndStorePremiums();
                }
                catch (error) {
                    console.error('Google 환율 업데이트 실패:', error);
                }
                return [2 /*return*/];
            });
        });
    };
    KimchiService.prototype.recalculateAndStorePremiums = function () {
        var newPremiums = [];
        for (var _i = 0, _a = this.symbols; _i < _a.length; _i++) {
            var symbol = _a[_i];
            var upbitPrice = this.realtimePrices.upbit[symbol];
            var binanceUsdPrice = this.realtimePrices.binance[symbol];
            if (upbitPrice && binanceUsdPrice && this.usdtKrwRate > 0) {
                var binanceKrwPrice = binanceUsdPrice * this.usdtKrwRate;
                var premiumRate = ((upbitPrice / binanceKrwPrice) - 1) * 100;
                newPremiums.push({
                    symbol: symbol,
                    upbitPrice: upbitPrice,
                    binancePrice: binanceKrwPrice,
                    premiumRate: premiumRate,
                    timestamp: new Date()
                });
            }
        }
        if (newPremiums.length > 0) {
            this.latestKimchiPremiums = newPremiums;
            if (this.onUpdateCallback) {
                this.onUpdateCallback(this.latestKimchiPremiums);
            }
        }
    };
    KimchiService.prototype.onUpdate = function (callback) {
        this.onUpdateCallback = callback;
    };
    KimchiService.prototype.getLatestKimchiPremiums = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.isInitialized) {
                    this.initialize();
                }
                return [2 /*return*/, this.latestKimchiPremiums];
            });
        });
    };
    KimchiService.prototype.getUSDTKRWRate = function () {
        return this.usdtKrwRate;
    };
    KimchiService.prototype.getKimchiPremiumHistory = function (symbol_1) {
        return __awaiter(this, arguments, void 0, function (symbol, limit) {
            var history_1, error_1;
            if (limit === void 0) { limit = 100; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, storage.getKimchiPremiumHistory(symbol, limit)];
                    case 1:
                        history_1 = _a.sent();
                        return [2 /*return*/, history_1.map(function (h) { return ({
                                symbol: h.symbol,
                                upbitPrice: Number(h.upbitPrice),
                                binancePrice: Number(h.binancePrice),
                                premiumRate: Number(h.premiumRate),
                                timestamp: h.timestamp || new Date()
                            }); })];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error getting kimchi premium history:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return KimchiService;
}());
export { KimchiService };
