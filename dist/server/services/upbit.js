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
import jwt from 'jsonwebtoken';
var UpbitService = /** @class */ (function () {
    function UpbitService(accessKey, secretKey) {
        this.baseUrl = 'https://api.upbit.com';
        this.accessKey = accessKey || process.env.UPBIT_ACCESS_KEY || '';
        this.secretKey = secretKey || process.env.UPBIT_SECRET_KEY || '';
    }
    UpbitService.prototype.generateAuthToken = function (query) {
        if (!this.accessKey || !this.secretKey) {
            throw new Error('Upbit API keys not configured');
        }
        var payload = {
            access_key: this.accessKey,
            nonce: Date.now().toString(),
        };
        if (query) {
            payload.query_hash = crypto.createHash('sha512').update(query, 'utf-8').digest('hex');
            payload.query_hash_alg = 'SHA512';
        }
        return jwt.sign(payload, this.secretKey);
    };
    UpbitService.prototype.getTicker = function (markets) {
        return __awaiter(this, void 0, void 0, function () {
            var marketString, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        marketString = markets.join(',');
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/v1/ticker?markets=").concat(marketString))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Upbit API error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Upbit getTicker error:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UpbitService.prototype.getOrderbook = function (markets) {
        return __awaiter(this, void 0, void 0, function () {
            var marketString, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        marketString = markets.join(',');
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/v1/orderbook?markets=").concat(marketString))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Upbit API error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Upbit getOrderbook error:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // 중복된 getAccounts 메서드 제거 - 아래쪽에 올바른 메서드가 있음
    UpbitService.prototype.getKRWBalance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, krwAccount, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        krwAccount = accounts.find(function (account) { return account.currency === 'KRW'; });
                        return [2 /*return*/, krwAccount ? parseFloat(krwAccount.balance) : 0];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Upbit getKRWBalance error:', error_3);
                        return [2 /*return*/, 0];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    UpbitService.prototype.getMarkets = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, markets, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/v1/market/all"))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Upbit API error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        markets = _a.sent();
                        return [2 /*return*/, markets.filter(function (market) { return market.market.startsWith('KRW-'); })];
                    case 3:
                        error_4 = _a.sent();
                        console.error('Upbit getMarkets error:', error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UpbitService.prototype.getAccounts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authToken, response, errorText, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        authToken = this.generateAuthToken();
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/v1/accounts"), {
                                headers: {
                                    'Authorization': "Bearer ".concat(authToken),
                                    'Accept': 'application/json'
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.error('Upbit API response:', response.status, errorText);
                        throw new Error("Upbit API error: ".concat(response.status, " - ").concat(errorText));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5:
                        error_5 = _a.sent();
                        console.error('Upbit getAccounts error:', error_5);
                        throw error_5;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    UpbitService.prototype.sendRequest = function (endpoint_1, method_1) {
        return __awaiter(this, arguments, void 0, function (endpoint, method, params) {
            var url, nonNilParams, stringParams, key, queryString, authToken, options, fullUrl, response, errorBody;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.baseUrl, "/v1/").concat(endpoint);
                        nonNilParams = Object.fromEntries(Object.entries(params).filter(function (_a) {
                            var v = _a[1];
                            return v != null;
                        }));
                        stringParams = {};
                        for (key in nonNilParams) {
                            stringParams[key] = String(nonNilParams[key]);
                        }
                        queryString = new URLSearchParams(stringParams).toString();
                        authToken = this.generateAuthToken(queryString || undefined);
                        options = {
                            method: method,
                            headers: {
                                'Authorization': "Bearer ".concat(authToken),
                                'Content-Type': 'application/json'
                            },
                        };
                        fullUrl = url;
                        if (method === 'GET' || method === 'DELETE') {
                            if (queryString)
                                fullUrl += "?".concat(queryString);
                        }
                        else if (method === 'POST') {
                            options.body = JSON.stringify(nonNilParams);
                        }
                        return [4 /*yield*/, fetch(fullUrl, options)];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorBody = _a.sent();
                        throw new Error("Upbit API error (".concat(response.status, "): ").concat(errorBody));
                    case 3: return [2 /*return*/, response.json()];
                }
            });
        });
    };
    // 지정가 매수
    UpbitService.prototype.placeBuyOrder = function (market_1, price_1) {
        return __awaiter(this, arguments, void 0, function (market, price, orderType) {
            var params;
            if (orderType === void 0) { orderType = 'price'; }
            return __generator(this, function (_a) {
                try {
                    params = {
                        market: market,
                        side: 'bid',
                        ord_type: orderType,
                    };
                    if (orderType === 'limit') {
                        params.price = price.toString();
                    }
                    else {
                        params.price = price.toString(); // 시장가 매수 시 총액
                    }
                    return [2 /*return*/, this.sendRequest('orders', 'POST', params)];
                }
                catch (error) {
                    console.error('Upbit placeBuyOrder error:', error);
                    throw new Error("\uC8FC\uBB38 \uC870\uD68C \uC2E4\uD328: ".concat(error.message));
                }
                return [2 /*return*/];
            });
        });
    };
    UpbitService.prototype.placeSellOrder = function (market, volume) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                try {
                    params = {
                        market: market,
                        side: 'ask',
                        volume: volume.toString(),
                        ord_type: 'limit',
                    };
                    return [2 /*return*/, this.sendRequest('orders', 'POST', params)];
                }
                catch (error) {
                    console.error('Upbit placeSellOrder error:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    UpbitService.prototype.cancelOrder = function (uuid) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                params = { uuid: uuid };
                return [2 /*return*/, this.sendRequest('order', 'DELETE', params)];
            });
        });
    };
    return UpbitService;
}());
export { UpbitService };
