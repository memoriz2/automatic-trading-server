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
import crypto from 'crypto';
var BinanceService = /** @class */ (function () {
    function BinanceService(apiKey, secretKey) {
        this.baseUrl = 'https://api.binance.com';
        this.futuresBaseUrl = 'https://fapi.binance.com';
        // 지역 제한 우회를 위한 대체 엔드포인트
        this.proxyUrl = 'https://api1.binance.com'; // 또는 다른 지역별 엔드포인트
        this.apiKey = apiKey || '';
        this.secretKey = secretKey || '';
    }
    BinanceService.prototype.generateSignature = function (queryString) {
        if (!this.secretKey) {
            throw new Error('Binance secret key not configured');
        }
        return crypto.createHmac('sha256', this.secretKey).update(queryString).digest('hex');
    };
    BinanceService.prototype.getTicker = function (symbols) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, symbols_1, symbol, response, endpoints, _a, endpoints_1, endpoint, endpointError_1, data, fallbackPrice, symbolError_1, fallbackPrice, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 17, , 18]);
                        results = [];
                        _i = 0, symbols_1 = symbols;
                        _b.label = 1;
                    case 1:
                        if (!(_i < symbols_1.length)) return [3 /*break*/, 16];
                        symbol = symbols_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 13, , 15]);
                        response = void 0;
                        endpoints = [this.proxyUrl, this.baseUrl, 'https://api2.binance.com', 'https://api3.binance.com'];
                        _a = 0, endpoints_1 = endpoints;
                        _b.label = 3;
                    case 3:
                        if (!(_a < endpoints_1.length)) return [3 /*break*/, 8];
                        endpoint = endpoints_1[_a];
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, fetch("".concat(endpoint, "/api/v3/ticker/price?symbol=").concat(symbol, "USDT"), {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                                }
                            })];
                    case 5:
                        response = _b.sent();
                        if (response.ok) {
                            return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        endpointError_1 = _b.sent();
                        console.warn("Endpoint ".concat(endpoint, " failed for ").concat(symbol, ":"), endpointError_1 instanceof Error ? endpointError_1.message : String(endpointError_1));
                        return [3 /*break*/, 7];
                    case 7:
                        _a++;
                        return [3 /*break*/, 3];
                    case 8:
                        if (!(response && response.ok)) return [3 /*break*/, 10];
                        return [4 /*yield*/, response.json()];
                    case 9:
                        data = _b.sent();
                        results.push(data);
                        return [3 /*break*/, 12];
                    case 10:
                        console.warn("All endpoints failed for ".concat(symbol, ", using CoinGecko as fallback"));
                        return [4 /*yield*/, this.getFallbackPrice(symbol)];
                    case 11:
                        fallbackPrice = _b.sent();
                        results.push({
                            symbol: "".concat(symbol, "USDT"),
                            price: fallbackPrice.toString()
                        });
                        _b.label = 12;
                    case 12: return [3 /*break*/, 15];
                    case 13:
                        symbolError_1 = _b.sent();
                        console.warn("Error getting ".concat(symbol, " price:"), symbolError_1);
                        return [4 /*yield*/, this.getFallbackPrice(symbol)];
                    case 14:
                        fallbackPrice = _b.sent();
                        results.push({
                            symbol: "".concat(symbol, "USDT"),
                            price: fallbackPrice.toString()
                        });
                        return [3 /*break*/, 15];
                    case 15:
                        _i++;
                        return [3 /*break*/, 1];
                    case 16: return [2 /*return*/, results];
                    case 17:
                        error_1 = _b.sent();
                        console.error('Binance getTicker error:', error_1);
                        throw error_1;
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    BinanceService.prototype.getFuturesTicker = function (symbols) {
        return __awaiter(this, void 0, void 0, function () {
            var results, symbolsParams, _i, symbolsParams_1, symbol, response, data, lastPrice, error_2, spotPrice, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 12, , 13]);
                        results = [];
                        symbolsParams = symbols.map(function (s) { return "".concat(s, "USDT"); });
                        _i = 0, symbolsParams_1 = symbolsParams;
                        _a.label = 1;
                    case 1:
                        if (!(_i < symbolsParams_1.length)) return [3 /*break*/, 11];
                        symbol = symbolsParams_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 10]);
                        return [4 /*yield*/, fetch("".concat(this.futuresBaseUrl, "/fapi/v1/ticker/price?symbol=").concat(symbol))];
                    case 3:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        results.push({
                            symbol: data.symbol,
                            price: data.price
                        });
                        return [3 /*break*/, 7];
                    case 5:
                        console.warn("Failed to get futures last price for ".concat(symbol, ": ").concat(response.status, ", falling back to spot last price."));
                        return [4 /*yield*/, this.getSymbolPrice(symbol)];
                    case 6:
                        lastPrice = _a.sent();
                        results.push({ symbol: symbol, price: lastPrice.toString() });
                        _a.label = 7;
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        error_2 = _a.sent();
                        console.warn("Error getting futures last price for ".concat(symbol, ", falling back to spot price."), error_2);
                        return [4 /*yield*/, this.getSymbolPrice(symbol)];
                    case 9:
                        spotPrice = _a.sent();
                        results.push({
                            symbol: symbol,
                            price: spotPrice.toString()
                        });
                        return [3 /*break*/, 10];
                    case 10:
                        _i++;
                        return [3 /*break*/, 1];
                    case 11: return [2 /*return*/, results];
                    case 12:
                        error_3 = _a.sent();
                        console.error('Binance getFuturesTicker error:', error_3);
                        throw error_3;
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    // 단일 심볼 가격 조회
    BinanceService.prototype.getSymbolPrice = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var tickers, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 4]);
                        return [4 /*yield*/, this.getTicker([symbol.replace('USDT', '')])];
                    case 1:
                        tickers = _a.sent();
                        return [2 /*return*/, tickers.length > 0 ? parseFloat(tickers[0].price) : 0];
                    case 2:
                        error_4 = _a.sent();
                        console.warn("\uBC14\uC774\uB0B8\uC2A4 ".concat(symbol, " \uAC00\uACA9 \uC870\uD68C \uC2E4\uD328:"), error_4);
                        return [4 /*yield*/, this.getFallbackPrice(symbol.replace('USDT', ''))];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // 다중 소스를 통한 정확한 대체 가격 조회
    BinanceService.prototype.getFallbackPrice = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, price_1, error_5, coinMap, coinId, response, data, price_2, error_6, currentMarketPrices, price;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch("https://min-api.cryptocompare.com/data/price?fsym=".concat(symbol, "&tsyms=USD"))];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _b.sent();
                        price_1 = data.USD;
                        if (price_1 && price_1 > 0) {
                            console.log("".concat(symbol, " CryptoCompare \uAC00\uACA9: $").concat(price_1));
                            return [2 /*return*/, price_1];
                        }
                        _b.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_5 = _b.sent();
                        console.warn('CryptoCompare API 실패:', error_5);
                        return [3 /*break*/, 5];
                    case 5:
                        _b.trys.push([5, 9, , 10]);
                        coinMap = {
                            'BTC': 'bitcoin',
                            'ETH': 'ethereum',
                            'XRP': 'ripple',
                            'ADA': 'cardano',
                            'DOT': 'polkadot'
                        };
                        coinId = coinMap[symbol];
                        if (!coinId) return [3 /*break*/, 8];
                        return [4 /*yield*/, fetch("https://api.coingecko.com/api/v3/simple/price?ids=".concat(coinId, "&vs_currencies=usd"))];
                    case 6:
                        response = _b.sent();
                        if (!response.ok) return [3 /*break*/, 8];
                        return [4 /*yield*/, response.json()];
                    case 7:
                        data = _b.sent();
                        price_2 = (_a = data[coinId]) === null || _a === void 0 ? void 0 : _a.usd;
                        if (price_2 && price_2 > 0) {
                            console.log("".concat(symbol, " CoinGecko \uAC00\uACA9: $").concat(price_2));
                            return [2 /*return*/, price_2];
                        }
                        _b.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_6 = _b.sent();
                        console.warn('CoinGecko API 실패:', error_6);
                        return [3 /*break*/, 10];
                    case 10:
                        currentMarketPrices = {
                            'BTC': 118430, // 실제 시장가 기준 (2025-07-24)
                            'ETH': 3628, // 실제 시장가 기준
                            'XRP': 2.36, // 실제 시장가 기준
                            'ADA': 1.06, // 실제 시장가 기준
                            'DOT': 8.55 // 실제 시장가 기준
                        };
                        price = currentMarketPrices[symbol] || 1;
                        console.log("".concat(symbol, " \uC2DC\uC7A5 \uAE30\uC900 \uB300\uCCB4 \uAC00\uACA9: $").concat(price));
                        return [2 /*return*/, price];
                }
            });
        });
    };
    BinanceService.prototype.getOrderbook = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/api/v3/depth?symbol=").concat(symbol, "USDT&limit=5"))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Binance API error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, {
                                symbol: "".concat(symbol, "USDT"),
                                bids: data.bids,
                                asks: data.asks
                            }];
                    case 3:
                        error_7 = _a.sent();
                        console.error('Binance getOrderbook error:', error_7);
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BinanceService.prototype.getAccount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, queryString, signature, response, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!this.apiKey || !this.secretKey) {
                            throw new Error('Binance API keys not configured');
                        }
                        timestamp = Date.now();
                        queryString = "timestamp=".concat(timestamp);
                        signature = this.generateSignature(queryString);
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/api/v3/account?").concat(queryString, "&signature=").concat(signature), {
                                headers: {
                                    'X-MBX-APIKEY': this.apiKey,
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Binance account API error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_8 = _a.sent();
                        console.error('Binance getAccount error:', error_8);
                        throw error_8;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BinanceService.prototype.getUSDTBalance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var account, usdtBalance, timestamp, queryString, signature, response, account, usdtBalance, spotBalance, error_9, futuresAccount, usdtAsset, futuresBalance, error_10;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 9, , 10]);
                        if (!(!this.apiKey || !this.secretKey)) return [3 /*break*/, 2];
                        console.log('바이낸스 API 키 없음, 스팟 계정 시도');
                        return [4 /*yield*/, this.getAccount()];
                    case 1:
                        account = _b.sent();
                        usdtBalance = account.balances.find(function (balance) { return balance.asset === 'USDT'; });
                        return [2 /*return*/, usdtBalance ? parseFloat(usdtBalance.free) : 0];
                    case 2:
                        timestamp = Date.now();
                        queryString = "timestamp=".concat(timestamp);
                        signature = crypto.createHmac('sha256', this.secretKey)
                            .update(queryString)
                            .digest('hex');
                        return [4 /*yield*/, fetch("https://fapi.binance.com/fapi/v2/account?".concat(queryString, "&signature=").concat(signature), {
                                headers: {
                                    'X-MBX-APIKEY': this.apiKey,
                                },
                            })];
                    case 3:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 7];
                        console.log("\uD83D\uDCCA \uC120\uBB3C \uACC4\uC815 \uC870\uD68C \uC2E4\uD328 (".concat(response.status, "): \uC9C0\uC5ED \uC81C\uD55C\uC73C\uB85C \uCD94\uC815"));
                        console.log("\uD83D\uDCCA \uBC14\uC774\uB0B8\uC2A4 \uC120\uBB3C USDT \uC794\uACE0: \uC9C0\uC5ED \uC81C\uD55C\uC73C\uB85C \uC870\uD68C \uBD88\uAC00 (\uC2E4\uC81C \uC794\uACE0\uB294 \uBC14\uC774\uB0B8\uC2A4\uC5D0\uC11C \uD655\uC778)");
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.getAccount()];
                    case 5:
                        account = _b.sent();
                        usdtBalance = account.balances.find(function (balance) { return balance.asset === 'USDT'; });
                        spotBalance = usdtBalance ? parseFloat(usdtBalance.free) : 0;
                        console.log("\uD83D\uDCCA \uBC14\uC774\uB0B8\uC2A4 \uC2A4\uD31F USDT \uC794\uACE0: $".concat(spotBalance));
                        return [2 /*return*/, spotBalance];
                    case 6:
                        error_9 = _b.sent();
                        console.log("\uD83D\uDCCA \uC2A4\uD31F \uACC4\uC815\uB3C4 \uC9C0\uC5ED \uC81C\uD55C, \uC794\uACE0 \uC870\uD68C \uBD88\uAC00");
                        return [2 /*return*/, 0];
                    case 7: return [4 /*yield*/, response.json()];
                    case 8:
                        futuresAccount = _b.sent();
                        usdtAsset = (_a = futuresAccount.assets) === null || _a === void 0 ? void 0 : _a.find(function (asset) { return asset.asset === 'USDT'; });
                        futuresBalance = usdtAsset ? parseFloat(usdtAsset.walletBalance) : 0;
                        console.log("\uD83D\uDCCA \uBC14\uC774\uB0B8\uC2A4 \uC120\uBB3C USDT \uC794\uACE0: $".concat(futuresBalance));
                        return [2 /*return*/, futuresBalance];
                    case 9:
                        error_10 = _b.sent();
                        console.error('Binance getUSDTBalance error:', error_10);
                        return [2 /*return*/, 0];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    BinanceService.prototype.getUSDTKRWRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, rate, error_11;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch('https://api.upbit.com/v1/ticker?markets=KRW-USDT')];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) {
                            console.warn("USDT/KRW rate API error: ".concat(response.status));
                            return [2 /*return*/, 1359]; // 현재 실제 환율 기본값
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _b.sent();
                        rate = (_a = data[0]) === null || _a === void 0 ? void 0 : _a.trade_price;
                        if (rate && rate > 1000 && rate < 2000) { // 합리적인 범위 체크
                            console.log("USDT/KRW \uD658\uC728 \uC5C5\uB370\uC774\uD2B8: ".concat(rate, "\uC6D0"));
                            return [2 /*return*/, rate];
                        }
                        return [2 /*return*/, 1359]; // 현재 실제 환율 기본값
                    case 3:
                        error_11 = _b.sent();
                        console.error('USDT/KRW rate error:', error_11);
                        return [2 /*return*/, 1359]; // 현재 실제 환율 기본값
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BinanceService.prototype.placeShortOrder = function (symbol, quantity) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, params, queryString, signature, response, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!this.apiKey) {
                            throw new Error('Binance API key not configured');
                        }
                        timestamp = Date.now();
                        params = {
                            symbol: "".concat(symbol, "USDT"),
                            side: 'SELL',
                            type: 'MARKET',
                            quantity: quantity.toString(),
                            timestamp: timestamp.toString()
                        };
                        queryString = new URLSearchParams(params).toString();
                        signature = this.generateSignature(queryString);
                        return [4 /*yield*/, fetch("".concat(this.futuresBaseUrl, "/fapi/v1/order?").concat(queryString, "&signature=").concat(signature), {
                                method: 'POST',
                                headers: {
                                    'X-MBX-APIKEY': this.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Binance futures order error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_12 = _a.sent();
                        console.error('Binance placeShortOrder error:', error_12);
                        throw error_12;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BinanceService.prototype.closeLongOrder = function (symbol, quantity) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, params, queryString, signature, response, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!this.apiKey) {
                            throw new Error('Binance API key not configured');
                        }
                        timestamp = Date.now();
                        params = {
                            symbol: "".concat(symbol, "USDT"),
                            side: 'BUY',
                            type: 'MARKET',
                            quantity: quantity.toString(),
                            timestamp: timestamp.toString()
                        };
                        queryString = new URLSearchParams(params).toString();
                        signature = this.generateSignature(queryString);
                        return [4 /*yield*/, fetch("".concat(this.futuresBaseUrl, "/fapi/v1/order?").concat(queryString, "&signature=").concat(signature), {
                                method: 'POST',
                                headers: {
                                    'X-MBX-APIKEY': this.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Binance futures order error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_13 = _a.sent();
                        console.error('Binance closeLongOrder error:', error_13);
                        throw error_13;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // 새로운 김프 전략용 메소드들
    // 레버리지 설정
    BinanceService.prototype.setLeverage = function (symbol, leverage) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, params, queryString, signature, response, errorText, error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        if (!this.apiKey) {
                            throw new Error('Binance API key not configured');
                        }
                        timestamp = Date.now();
                        params = {
                            symbol: "".concat(symbol, "USDT"),
                            leverage: leverage.toString(),
                            timestamp: timestamp.toString()
                        };
                        queryString = new URLSearchParams(params).toString();
                        signature = this.generateSignature(queryString);
                        return [4 /*yield*/, fetch("".concat(this.futuresBaseUrl, "/fapi/v1/leverage?").concat(queryString, "&signature=").concat(signature), {
                                method: 'POST',
                                headers: {
                                    'X-MBX-APIKEY': this.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.warn("Binance setLeverage warning (".concat(response.status, "):"), errorText);
                        // 레버리지 설정 실패는 치명적이지 않으므로 경고만 출력
                        return [2 /*return*/, { success: false, message: errorText }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5:
                        error_14 = _a.sent();
                        console.error('Binance setLeverage error:', error_14);
                        return [2 /*return*/, { success: false, message: error_14 instanceof Error ? error_14.message : 'Unknown error' }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // 선물 숏 포지션 진입 (시장가)
    BinanceService.prototype.placeFuturesShortOrder = function (symbol, quantity) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, params, queryString, signature, response, errorText, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        if (!this.apiKey) {
                            throw new Error('Binance API key not configured');
                        }
                        timestamp = Date.now();
                        params = {
                            symbol: "".concat(symbol, "USDT"),
                            side: 'SELL',
                            type: 'MARKET',
                            quantity: quantity.toString(),
                            timestamp: timestamp.toString()
                        };
                        queryString = new URLSearchParams(params).toString();
                        signature = this.generateSignature(queryString);
                        return [4 /*yield*/, fetch("".concat(this.futuresBaseUrl, "/fapi/v1/order?").concat(queryString, "&signature=").concat(signature), {
                                method: 'POST',
                                headers: {
                                    'X-MBX-APIKEY': this.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        throw new Error("Binance futures short order error (".concat(response.status, "): ").concat(errorText));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5:
                        error_15 = _a.sent();
                        console.error('Binance placeFuturesShortOrder error:', error_15);
                        throw error_15;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // 선물 포지션 청산 (숏 포지션 커버)
    BinanceService.prototype.closeFuturesPosition = function (symbol, quantity) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, params, queryString, signature, response, errorText, error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        if (!this.apiKey) {
                            throw new Error('Binance API key not configured');
                        }
                        timestamp = Date.now();
                        params = {
                            symbol: "".concat(symbol, "USDT"),
                            side: 'BUY', // 숏 포지션 청산은 매수
                            type: 'MARKET',
                            quantity: quantity.toString(),
                            timestamp: timestamp.toString()
                        };
                        queryString = new URLSearchParams(params).toString();
                        signature = this.generateSignature(queryString);
                        return [4 /*yield*/, fetch("".concat(this.futuresBaseUrl, "/fapi/v1/order?").concat(queryString, "&signature=").concat(signature), {
                                method: 'POST',
                                headers: {
                                    'X-MBX-APIKEY': this.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        throw new Error("Binance futures close position error (".concat(response.status, "): ").concat(errorText));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5:
                        error_16 = _a.sent();
                        console.error('Binance closeFuturesPosition error:', error_16);
                        throw error_16;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // 현재 포지션 정보 조회
    BinanceService.prototype.getFuturesPositions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, params, queryString, signature, response, positions, error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!this.apiKey) {
                            throw new Error('Binance API key not configured');
                        }
                        timestamp = Date.now();
                        params = {
                            timestamp: timestamp.toString()
                        };
                        queryString = new URLSearchParams(params).toString();
                        signature = this.generateSignature(queryString);
                        return [4 /*yield*/, fetch("".concat(this.futuresBaseUrl, "/fapi/v2/positionRisk?").concat(queryString, "&signature=").concat(signature), {
                                headers: {
                                    'X-MBX-APIKEY': this.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Binance futures positions error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        positions = _a.sent();
                        // 포지션이 있는 것만 필터링
                        return [2 /*return*/, positions.filter(function (pos) { return parseFloat(pos.positionAmt) !== 0; })];
                    case 3:
                        error_17 = _a.sent();
                        console.error('Binance getFuturesPositions error:', error_17);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 세션 ID로 DB에서 복호화된 바이낸스 API 키를 사용하여 잔고 조회
     */
    BinanceService.prototype.getUSDTBalanceWithSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var storage, decryptedExchange, timestamp, queryString, signature, response, futuresAccount, usdtAsset, futuresBalance, error_18;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, import('../storage.js')];
                    case 1:
                        storage = (_b.sent()).storage;
                        return [4 /*yield*/, storage.getDecryptedExchange(sessionId, 'binance')];
                    case 2:
                        decryptedExchange = _b.sent();
                        if (!decryptedExchange || !decryptedExchange.apiKey || !decryptedExchange.apiSecret) {
                            console.log('세션에서 바이낸스 API 키를 찾을 수 없음');
                            return [2 /*return*/, 0];
                        }
                        console.log("\uD83D\uDD11 \uC138\uC158 ".concat(sessionId, "\uC758 \uBCF5\uD638\uD654\uB41C \uBC14\uC774\uB0B8\uC2A4 API \uD0A4 \uC0AC\uC6A9"));
                        timestamp = Date.now();
                        queryString = "timestamp=".concat(timestamp);
                        signature = crypto.createHmac('sha256', decryptedExchange.apiSecret)
                            .update(queryString)
                            .digest('hex');
                        return [4 /*yield*/, fetch("https://fapi.binance.com/fapi/v2/account?".concat(queryString, "&signature=").concat(signature), {
                                headers: {
                                    'X-MBX-APIKEY': decryptedExchange.apiKey,
                                },
                            })];
                    case 3:
                        response = _b.sent();
                        if (!response.ok) {
                            console.log("\uD83D\uDCCA \uC120\uBB3C \uACC4\uC815 \uC870\uD68C \uC2E4\uD328 (".concat(response.status, "): \uC9C0\uC5ED \uC81C\uD55C\uC73C\uB85C \uCD94\uC815"));
                            console.log("\uD83D\uDCCA \uBC14\uC774\uB0B8\uC2A4 \uC120\uBB3C USDT \uC794\uACE0: \uC9C0\uC5ED \uC81C\uD55C\uC73C\uB85C \uC870\uD68C \uBD88\uAC00 (\uC2E4\uC81C \uC794\uACE0\uB294 \uBC14\uC774\uB0B8\uC2A4\uC5D0\uC11C \uD655\uC778)");
                            return [2 /*return*/, 0];
                        }
                        return [4 /*yield*/, response.json()];
                    case 4:
                        futuresAccount = _b.sent();
                        usdtAsset = (_a = futuresAccount.assets) === null || _a === void 0 ? void 0 : _a.find(function (asset) { return asset.asset === 'USDT'; });
                        futuresBalance = usdtAsset ? parseFloat(usdtAsset.walletBalance) : 0;
                        console.log("\uD83D\uDCCA \uBC14\uC774\uB0B8\uC2A4 \uC120\uBB3C USDT \uC794\uACE0: $".concat(futuresBalance));
                        return [2 /*return*/, futuresBalance];
                    case 5:
                        error_18 = _b.sent();
                        console.error('Binance getUSDTBalanceWithSession error:', error_18);
                        return [2 /*return*/, 0];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return BinanceService;
}());
export { BinanceService };
