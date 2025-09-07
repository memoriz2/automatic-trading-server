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
import { UpbitService } from './upbit.js';
import { BinanceService } from './binance.js';
import { priceCache } from './price-cache.js';
import fetch from 'node-fetch';
import { naverExchange } from './naver-exchange.js';
import { createHmac } from 'crypto';
import { storage } from '../storage.js';
import { googleFinanceExchange } from './google-finance-exchange.js';
var SimpleKimchiService = /** @class */ (function () {
    function SimpleKimchiService() {
        this.upbitService = new UpbitService();
        this.binanceService = new BinanceService();
    }
    /**
     * 사용자별 거래소 API 키 조회
     */
    SimpleKimchiService.prototype.getUserExchangeKeys = function (userId, exchange) {
        return __awaiter(this, void 0, void 0, function () {
            var exchanges, exchangeData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!userId || userId === 'undefined' || userId === 'null') {
                            return [2 /*return*/, {}];
                        }
                        return [4 /*yield*/, storage.getExchangesByUserId(userId)];
                    case 1:
                        exchanges = _a.sent();
                        exchangeData = exchanges.find(function (ex) { return ex.exchange === exchange && ex.isActive; });
                        if (exchangeData) {
                            return [2 /*return*/, {
                                    apiKey: exchangeData.apiKey,
                                    secretKey: exchangeData.apiSecret
                                }];
                        }
                        return [2 /*return*/, {}];
                    case 2:
                        error_1 = _a.sent();
                        console.warn("\u26A0\uFE0F \uC0AC\uC6A9\uC790 ".concat(userId, "\uC758 ").concat(exchange, " API \uD0A4 \uC870\uD68C \uC2E4\uD328:"), error_1 instanceof Error ? error_1.message : error_1);
                        return [2 /*return*/, {}];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 실시간 USD→KRW 환율 조회 (네이버 금융 사용)
     */
    SimpleKimchiService.prototype.getRealTimeExchangeRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var rate, error_2, fallbackRate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, naverExchange.getRate()];
                    case 1:
                        rate = _a.sent();
                        console.log("\uD83C\uDF10 \uB124\uC774\uBC84 \uAE08\uC735 \uC2E4\uC2DC\uAC04 USD/KRW \uD658\uC728: ".concat(rate, "\uC6D0"));
                        return [2 /*return*/, rate];
                    case 2:
                        error_2 = _a.sent();
                        console.error('네이버 금융 환율 조회 실패:', error_2);
                        fallbackRate = naverExchange.getCurrentRate();
                        console.log("\u26A0\uFE0F \uB124\uC774\uBC84 \uAE08\uC735 \uBC31\uC5C5 \uD658\uC728 \uC0AC\uC6A9: ".concat(fallbackRate, "\uC6D0"));
                        return [2 /*return*/, fallbackRate];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 단순 김프율 계산 - 웹소켓 캐시 우선 사용으로 실시간 계산
     */
    SimpleKimchiService.prototype.calculateSimpleKimchi = function (symbols, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var results, gf, ema, fallback, usdKrwRate, _i, symbols_1, symbol, upbitPrice, binanceFuturesPrice, binancePriceKRW, premiumRate, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        gf = googleFinanceExchange.getCurrentRate();
                        ema = priceCache.getUsdtKrwEma();
                        fallback = naverExchange.getCurrentRate();
                        usdKrwRate = (gf && gf > 1000 && gf < 2000) ? gf : (ema !== null && ema !== void 0 ? ema : fallback);
                        _i = 0, symbols_1 = symbols;
                        _a.label = 1;
                    case 1:
                        if (!(_i < symbols_1.length)) return [3 /*break*/, 9];
                        symbol = symbols_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 8]);
                        upbitPrice = priceCache.getUpbitPrice(symbol);
                        binanceFuturesPrice = priceCache.getBinancePrice(symbol);
                        if (!(upbitPrice === null)) return [3 /*break*/, 4];
                        console.warn("\u26A0\uFE0F ".concat(symbol, " \uC5C5\uBE44\uD2B8 \uCE90\uC2DC \uC5C6\uC74C, API \uD638\uCD9C"));
                        return [4 /*yield*/, this.getUpbitPrice(symbol, userId)];
                    case 3:
                        upbitPrice = _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!(binanceFuturesPrice === null)) return [3 /*break*/, 6];
                        console.warn("\u26A0\uFE0F ".concat(symbol, " \uBC14\uC774\uB0B8\uC2A4 \uCE90\uC2DC \uC5C6\uC74C, API \uD638\uCD9C"));
                        return [4 /*yield*/, this.getBinanceFuturesPrice(symbol, userId)];
                    case 5:
                        binanceFuturesPrice = _a.sent();
                        _a.label = 6;
                    case 6:
                        binancePriceKRW = binanceFuturesPrice * usdKrwRate;
                        premiumRate = ((upbitPrice - binancePriceKRW) / binancePriceKRW) * 100;
                        // console.log(`${symbol} 김프율 계산 (kimpga 방식-선물Last):`, {
                        //   업비트가격: `${upbitPrice.toLocaleString()}원`,
                        //   바이낸스선물가격: `${binanceFuturesPrice.toLocaleString()} USD`,
                        //   바이낸스가격KRW: `${binancePriceKRW.toLocaleString()}원`,
                        //   환율: `${usdKrwRate.toFixed(2)}원/USD`,
                        //   김프율: `${premiumRate.toFixed(3)}%`
                        // });
                        results.push({
                            symbol: symbol,
                            upbitPrice: upbitPrice,
                            binanceFuturesPrice: binanceFuturesPrice,
                            usdKrwRate: usdKrwRate,
                            binancePriceKRW: binancePriceKRW, // 바이낸스 가격을 KRW로 변환한 값
                            premiumRate: premiumRate,
                            timestamp: new Date().toISOString()
                        });
                        return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        console.error("".concat(symbol, " \uAE40\uD504 \uACC4\uC0B0 \uC2E4\uD328:"), error_3);
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 1];
                    case 9: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * 업비트 KRW 가격 조회 (사용자별 API 키 사용)
     */
    SimpleKimchiService.prototype.getUpbitPrice = function (symbol, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userKeys, tickers, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!userId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getUserExchangeKeys(userId, 'upbit')];
                    case 1:
                        userKeys = _a.sent();
                        if (userKeys.apiKey && userKeys.secretKey) {
                            console.log("\uD83D\uDD11 \uC0AC\uC6A9\uC790 ".concat(userId, "\uC758 \uC5C5\uBE44\uD2B8 API \uD0A4 \uC0AC\uC6A9"));
                            // TODO: 사용자별 업비트 API 키로 가격 조회 구현
                        }
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.upbitService.getTicker(["KRW-".concat(symbol)])];
                    case 3:
                        tickers = _a.sent();
                        if (tickers.length === 0) {
                            throw new Error("\uC5C5\uBE44\uD2B8 ".concat(symbol, " \uAC00\uACA9 \uC870\uD68C \uACB0\uACFC \uC5C6\uC74C"));
                        }
                        return [2 /*return*/, tickers[0].trade_price];
                    case 4:
                        error_4 = _a.sent();
                        throw new Error("\uC5C5\uBE44\uD2B8 ".concat(symbol, " \uAC00\uACA9 \uC870\uD68C \uC2E4\uD328: ").concat(error_4));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // 기존 환율 조회 함수 제거됨 - googleExchangeReal 서비스 사용
    /**
     * 바이낸스 선물 가격 조회 (세션 ID로 DB 조회하여 복호화된 API 키 사용)
     */
    SimpleKimchiService.prototype.getBinanceFuturesPrice = function (symbol, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var apiKey, secretKey, storage_1, decryptedExchange, dbError_1, timestamp, queryString, signature, url, response, publicResponse, publicData, data, price, error_5, response, data, price, error_6, response, data, error_7, response, data, usdRate, error_8, fallbackPrices;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 11, , 28]);
                        apiKey = void 0;
                        secretKey = void 0;
                        if (!sessionId) return [3 /*break*/, 5];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, import('../storage.js')];
                    case 2:
                        storage_1 = (_c.sent()).storage;
                        return [4 /*yield*/, storage_1.getDecryptedExchange(sessionId, 'binance')];
                    case 3:
                        decryptedExchange = _c.sent();
                        if (decryptedExchange && decryptedExchange.apiKey && decryptedExchange.apiSecret) {
                            apiKey = decryptedExchange.apiKey;
                            secretKey = decryptedExchange.apiSecret;
                            console.log("\uD83D\uDD11 \uC138\uC158 ".concat(sessionId, "\uC758 \uBCF5\uD638\uD654\uB41C \uBC14\uC774\uB0B8\uC2A4 API \uD0A4 \uC0AC\uC6A9"));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        dbError_1 = _c.sent();
                        console.warn("DB\uC5D0\uC11C \uBC14\uC774\uB0B8\uC2A4 API \uD0A4 \uC870\uD68C \uC2E4\uD328:", dbError_1);
                        return [3 /*break*/, 5];
                    case 5:
                        if (!apiKey || !secretKey) {
                            throw new Error('바이낸스 API 키가 설정되지 않음');
                        }
                        timestamp = Date.now();
                        queryString = "symbol=".concat(symbol, "USDT&timestamp=").concat(timestamp);
                        signature = createHmac('sha256', secretKey)
                            .update(queryString)
                            .digest('hex');
                        url = "https://fapi.binance.com/fapi/v1/ticker/price?".concat(queryString, "&signature=").concat(signature);
                        return [4 /*yield*/, fetch(url, {
                                headers: {
                                    'X-MBX-APIKEY': apiKey,
                                },
                            })];
                    case 6:
                        response = _c.sent();
                        if (!!response.ok) return [3 /*break*/, 9];
                        // 인증 API 실패 시 Public API 시도
                        console.log("\uC778\uC99D API \uC2E4\uD328 (".concat(response.status, "), Public API \uC2DC\uB3C4"));
                        return [4 /*yield*/, fetch("https://fapi.binance.com/fapi/v1/ticker/price?symbol=".concat(symbol, "USDT"))];
                    case 7:
                        publicResponse = _c.sent();
                        if (!publicResponse.ok) {
                            throw new Error("\uBC14\uC774\uB0B8\uC2A4 API \uC624\uB958: ".concat(publicResponse.status));
                        }
                        return [4 /*yield*/, publicResponse.json()];
                    case 8:
                        publicData = _c.sent();
                        return [2 /*return*/, parseFloat(publicData.price)];
                    case 9: return [4 /*yield*/, response.json()];
                    case 10:
                        data = _c.sent();
                        price = parseFloat(data.price);
                        if (!price || price <= 0) {
                            throw new Error("\uC798\uBABB\uB41C \uAC00\uACA9 \uB370\uC774\uD130: ".concat(price));
                        }
                        return [2 /*return*/, price];
                    case 11:
                        error_5 = _c.sent();
                        console.error("\uBC14\uC774\uB0B8\uC2A4 ".concat(symbol, " \uC120\uBB3C \uAC00\uACA9 \uC870\uD68C \uC2E4\uD328:"), error_5);
                        // 실패 시 다중 대체 API 시도
                        console.log("\uD83D\uDCC8 ".concat(symbol, " \uB300\uCCB4 \uAC00\uACA9 API \uC2DC\uB3C4 \uC911..."));
                        _c.label = 12;
                    case 12:
                        _c.trys.push([12, 16, , 17]);
                        return [4 /*yield*/, fetch("https://min-api.cryptocompare.com/data/price?fsym=".concat(symbol, "&tsyms=USD"))];
                    case 13:
                        response = _c.sent();
                        if (!response.ok) return [3 /*break*/, 15];
                        return [4 /*yield*/, response.json()];
                    case 14:
                        data = _c.sent();
                        price = data.USD;
                        if (price && price > 0) {
                            console.log("\u2705 CryptoCompare ".concat(symbol, ": $").concat(price));
                            return [2 /*return*/, price];
                        }
                        _c.label = 15;
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        error_6 = _c.sent();
                        console.log("CryptoCompare ".concat(symbol, " \uC2E4\uD328"));
                        return [3 /*break*/, 17];
                    case 17:
                        _c.trys.push([17, 21, , 22]);
                        return [4 /*yield*/, fetch("https://rest.coinapi.io/v1/exchangerate/".concat(symbol, "/USD"), {
                                headers: { 'Accept': 'application/json' }
                            })];
                    case 18:
                        response = _c.sent();
                        if (!response.ok) return [3 /*break*/, 20];
                        return [4 /*yield*/, response.json()];
                    case 19:
                        data = _c.sent();
                        if (data.rate && data.rate > 0) {
                            console.log("\u2705 CoinAPI ".concat(symbol, ": $").concat(data.rate));
                            return [2 /*return*/, data.rate];
                        }
                        _c.label = 20;
                    case 20: return [3 /*break*/, 22];
                    case 21:
                        error_7 = _c.sent();
                        console.log("CoinAPI ".concat(symbol, " \uC2E4\uD328"));
                        return [3 /*break*/, 22];
                    case 22:
                        _c.trys.push([22, 26, , 27]);
                        return [4 /*yield*/, fetch("https://api.coinbase.com/v2/exchange-rates?currency=".concat(symbol))];
                    case 23:
                        response = _c.sent();
                        if (!response.ok) return [3 /*break*/, 25];
                        return [4 /*yield*/, response.json()];
                    case 24:
                        data = _c.sent();
                        usdRate = (_b = (_a = data.data) === null || _a === void 0 ? void 0 : _a.rates) === null || _b === void 0 ? void 0 : _b.USD;
                        if (usdRate && parseFloat(usdRate) > 0) {
                            console.log("\u2705 Coinbase ".concat(symbol, ": $").concat(usdRate));
                            return [2 /*return*/, parseFloat(usdRate)];
                        }
                        _c.label = 25;
                    case 25: return [3 /*break*/, 27];
                    case 26:
                        error_8 = _c.sent();
                        console.log("Coinbase ".concat(symbol, " \uC2E4\uD328"));
                        return [3 /*break*/, 27];
                    case 27:
                        fallbackPrices = {
                            'BTC': 119280, // CryptoCompare 기준 최신
                            'ETH': 3730, // CryptoCompare 기준 최신
                            'XRP': 3.234, // CryptoCompare 기준 최신
                            'ADA': 0.8258, // CryptoCompare 기준 최신
                            'DOT': 4.091 // CryptoCompare 기준 최신
                        };
                        console.log("\u26A0\uFE0F ".concat(symbol, " \uCD5C\uC885 fallback \uAC00\uACA9 \uC0AC\uC6A9: $").concat(fallbackPrices[symbol]));
                        return [2 /*return*/, fallbackPrices[symbol] || 0];
                    case 28: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 현재 저장된 환율 조회 (캐시된 값)
     */
    SimpleKimchiService.prototype.getCurrentExchangeRate = function () {
        return naverExchange.getCurrentRate();
    };
    return SimpleKimchiService;
}());
export { SimpleKimchiService };
