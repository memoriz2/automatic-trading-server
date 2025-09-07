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
import fetch from 'node-fetch';
var CoinAPIService = /** @class */ (function () {
    function CoinAPIService() {
        this.baseUrl = 'https://rest.coinapi.io/v1';
        // CoinAPI 무료 계정: 100 requests/day
        this.apiKey = process.env.COINAPI_KEY || 'demo-key';
    }
    CoinAPIService.prototype.fetchFromCoinAPI = function (endpoint) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.baseUrl).concat(endpoint);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch(url, {
                                headers: { "X-CoinAPI-Key": this.apiKey },
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("CoinAPI request failed: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Error fetching from CoinAPI:", error_1);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // 실시간 환율 조회 (USDT/KRW)
    CoinAPIService.prototype.getUSDTKRWRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var headers, response, data, rate, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        headers = {
                            'X-CoinAPI-Key': this.apiKey,
                            'Accept': 'application/json'
                        };
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/exchangerate/USDT/KRW"), { headers: headers })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        rate = data.rate;
                        console.log("CoinAPI USDT/KRW \uD658\uC728: ".concat(rate, "\uC6D0"));
                        return [2 /*return*/, rate];
                    case 3: throw new Error("CoinAPI USDT/KRW \uC870\uD68C \uC2E4\uD328: ".concat(response.status));
                    case 4:
                        error_2 = _a.sent();
                        console.warn('CoinAPI USDT/KRW 조회 실패, 대체값 사용:', error_2);
                        return [2 /*return*/, 1358]; // 대체값
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CoinAPIService.prototype.getExchangeRate = function (baseAsset, quoteAsset) {
        return __awaiter(this, void 0, void 0, function () {
            var endpoint, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        endpoint = "/v1/exchangerate/".concat(baseAsset, "/").concat(quoteAsset);
                        return [4 /*yield*/, this.fetchFromCoinAPI(endpoint)];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data.rate];
                }
            });
        });
    };
    CoinAPIService.prototype.getCryptoPrice = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var endpoint, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        endpoint = "/v1/ohlcv/".concat(symbol, "/latest?period_id=1MIN");
                        return [4 /*yield*/, this.fetchFromCoinAPI(endpoint)];
                    case 1:
                        data = _a.sent();
                        if (data && data.length > 0) {
                            return [2 /*return*/, data[0].price_close];
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    CoinAPIService.prototype.getBinanceFuturesPrice = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var endpoint, data, price;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        endpoint = "/v1/trades/BINANCE_FTS_PERP_".concat(symbol, "USD/latest?limit=1");
                        return [4 /*yield*/, this.fetchFromCoinAPI(endpoint)];
                    case 1:
                        data = _a.sent();
                        if (data && data.length > 0) {
                            price = data[0].price;
                            return [2 /*return*/, price];
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    CoinAPIService.prototype.getUpbitPrice = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var endpoint, data, price;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        endpoint = "/v1/trades/UPBIT_SPOT_".concat(symbol, "_KRW/latest?limit=1");
                        return [4 /*yield*/, this.fetchFromCoinAPI(endpoint)];
                    case 1:
                        data = _a.sent();
                        if (data && data.length > 0) {
                            price = data[0].price;
                            return [2 /*return*/, price];
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    // 업비트 직접 API 호출 (CoinAPI 실패시 대체)
    CoinAPIService.prototype.getUpbitPriceDirect = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var market, response, data, price, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        market = "KRW-".concat(symbol);
                        return [4 /*yield*/, fetch("https://api.upbit.com/v1/ticker?markets=".concat(market))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (data && data.length > 0) {
                            price = data[0].trade_price;
                            console.log("".concat(symbol, " \uC5C5\uBE44\uD2B8 \uC9C1\uC811\uC870\uD68C: ").concat(price.toLocaleString(), "\uC6D0"));
                            return [2 /*return*/, price];
                        }
                        _a.label = 3;
                    case 3: throw new Error("\uC5C5\uBE44\uD2B8 \uC9C1\uC811 API ".concat(symbol, " \uC870\uD68C \uC2E4\uD328"));
                    case 4:
                        error_3 = _a.sent();
                        console.error("\uC5C5\uBE44\uD2B8 ".concat(symbol, " \uC870\uD68C \uC644\uC804 \uC2E4\uD328:"), error_3);
                        return [2 /*return*/, 0];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // 김치프리미엄 계산 (CoinAPI 기반)
    CoinAPIService.prototype.calculateKimchiPremium = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, upbitPrice, binanceFuturesPrice, usdtKrwRate, binancePriceKRW, premiumRate, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                this.getUpbitPrice(symbol),
                                this.getBinanceFuturesPrice(symbol),
                                this.getUSDTKRWRate()
                            ])];
                    case 1:
                        _a = _b.sent(), upbitPrice = _a[0], binanceFuturesPrice = _a[1], usdtKrwRate = _a[2];
                        if (upbitPrice === null || binanceFuturesPrice === null) {
                            throw new Error("Failed to fetch prices for ".concat(symbol));
                        }
                        binancePriceKRW = binanceFuturesPrice * usdtKrwRate;
                        premiumRate = ((upbitPrice - binancePriceKRW) / binancePriceKRW) * 100;
                        console.log("\n".concat(symbol, " \uAE40\uD504\uC728 \uACC4\uC0B0 (CoinAPI \uAE30\uC900):"), {
                            업비트가격: "".concat(upbitPrice.toLocaleString(), "\uC6D0"),
                            바이낸스선물가격USD: "$".concat(binanceFuturesPrice.toLocaleString()),
                            환율USDTKRW: "".concat(usdtKrwRate, "\uC6D0"),
                            바이낸스선물가격KRW: "".concat(binancePriceKRW.toLocaleString(), "\uC6D0"),
                            김프율: "".concat(premiumRate.toFixed(3), "%")
                        });
                        return [2 /*return*/, {
                                upbitPrice: upbitPrice,
                                binanceFuturesPrice: binanceFuturesPrice,
                                usdtKrwRate: usdtKrwRate,
                                binancePriceKRW: binancePriceKRW,
                                premiumRate: premiumRate
                            }];
                    case 2:
                        error_4 = _b.sent();
                        console.error("CoinAPI \uAE40\uD504\uC728 \uACC4\uC0B0 \uC2E4\uD328 (".concat(symbol, "):"), error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // API 한도 확인
    CoinAPIService.prototype.checkAPILimit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var headers, response, remainingRequests, resetTime, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        headers = {
                            'X-CoinAPI-Key': this.apiKey,
                            'Accept': 'application/json'
                        };
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/metadata"), { headers: headers })];
                    case 1:
                        response = _a.sent();
                        if (response.ok) {
                            remainingRequests = parseInt(response.headers.get('x-ratelimit-remaining') || '0');
                            resetTime = response.headers.get('x-ratelimit-reset') || 'unknown';
                            console.log("CoinAPI \uB0A8\uC740 \uC694\uCCAD\uC218: ".concat(remainingRequests, ", \uB9AC\uC14B\uC2DC\uAC04: ").concat(resetTime));
                            return [2 /*return*/, { remainingRequests: remainingRequests, resetTime: resetTime }];
                        }
                        throw new Error('API 한도 확인 실패');
                    case 2:
                        error_5 = _a.sent();
                        console.warn('CoinAPI 한도 확인 실패:', error_5);
                        return [2 /*return*/, { remainingRequests: 0, resetTime: 'unknown' }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return CoinAPIService;
}());
export { CoinAPIService };
