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
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
var ExchangeTestService = /** @class */ (function () {
    function ExchangeTestService() {
    }
    // 업비트 연동 테스트
    ExchangeTestService.prototype.testUpbitConnection = function (apiKey, apiSecret) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, token, response, data, errorData, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 6, , 7]);
                        console.log('🔍 업비트 연동 테스트 시작...');
                        payload = {
                            access_key: apiKey,
                            nonce: uuidv4(),
                            timestamp: Date.now()
                        };
                        token = jwt.sign(payload, apiSecret);
                        console.log('🔑 업비트 JWT 토큰 생성 완료');
                        return [4 /*yield*/, fetch('https://api.upbit.com/v1/accounts', {
                                method: 'GET',
                                headers: {
                                    'Authorization': "Bearer ".concat(token),
                                    'Content-Type': 'application/json'
                                }
                            })];
                    case 1:
                        response = _c.sent();
                        console.log("\uD83D\uDCE1 \uC5C5\uBE44\uD2B8 API \uC751\uB2F5: ".concat(response.status, " ").concat(response.statusText));
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _c.sent();
                        console.log('✅ 업비트 연동 성공:', data);
                        return [2 /*return*/, {
                                success: true,
                                message: '업비트 연동 성공! 계정 정보를 정상적으로 조회했습니다.',
                                details: {
                                    accountCount: data.length,
                                    balance: ((_a = data[0]) === null || _a === void 0 ? void 0 : _a.balance) || 'N/A'
                                }
                            }];
                    case 3: return [4 /*yield*/, response.json().catch(function () { return ({ error: { message: '응답 파싱 실패' } }); })];
                    case 4:
                        errorData = _c.sent();
                        console.log('❌ 업비트 연동 실패:', errorData);
                        return [2 /*return*/, {
                                success: false,
                                message: '업비트 연동 실패',
                                error: ((_b = errorData.error) === null || _b === void 0 ? void 0 : _b.message) || "HTTP ".concat(response.status),
                                details: { status: response.status }
                            }];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _c.sent();
                        console.error('💥 업비트 연동 테스트 오류:', error_1);
                        return [2 /*return*/, {
                                success: false,
                                message: '업비트 연동 테스트 중 오류 발생',
                                error: error_1.message,
                                details: { error: error_1.toString() }
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // 바이낸스 연동 테스트
    ExchangeTestService.prototype.testBinanceConnection = function (apiKey, apiSecret) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, queryString, signature, response, data, errorData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        console.log('🔍 바이낸스 연동 테스트 시작...');
                        timestamp = Date.now();
                        queryString = "timestamp=".concat(timestamp);
                        signature = this.generateBinanceSignature(queryString, apiSecret);
                        console.log("\uD83D\uDCE1 \uBC14\uC774\uB0B8\uC2A4 API \uC694\uCCAD: timestamp=".concat(timestamp, ", signature=").concat(signature));
                        return [4 /*yield*/, fetch("https://fapi.binance.com/fapi/v2/account?".concat(queryString, "&signature=").concat(signature), {
                                method: 'GET',
                                headers: {
                                    'X-MBX-APIKEY': apiKey,
                                    'Content-Type': 'application/json'
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        console.log("\uD83D\uDCE1 \uBC14\uC774\uB0B8\uC2A4 API \uC751\uB2F5: ".concat(response.status, " ").concat(response.statusText));
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        console.log('✅ 바이낸스 연동 성공:', data);
                        return [2 /*return*/, {
                                success: true,
                                message: '바이낸스 연동 성공! 계정 정보를 정상적으로 조회했습니다.',
                                details: {
                                    canTrade: data.canTrade,
                                    totalWalletBalance: data.totalWalletBalance
                                }
                            }];
                    case 3: return [4 /*yield*/, response.json().catch(function () { return ({ msg: '응답 파싱 실패' }); })];
                    case 4:
                        errorData = _a.sent();
                        console.log('❌ 바이낸스 연동 실패:', errorData);
                        return [2 /*return*/, {
                                success: false,
                                message: '바이낸스 연동 실패',
                                error: errorData.msg || "HTTP ".concat(response.status),
                                details: { status: response.status }
                            }];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        console.error('💥 바이낸스 연동 테스트 오류:', error_2);
                        return [2 /*return*/, {
                                success: false,
                                message: '바이낸스 연동 테스트 중 오류 발생',
                                error: error_2.message,
                                details: { error: error_2.toString() }
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // 바이낸스 서명 생성 (HMAC-SHA256)
    ExchangeTestService.prototype.generateBinanceSignature = function (queryString, secretKey) {
        return crypto
            .createHmac('sha256', secretKey)
            .update(queryString)
            .digest('hex');
    };
    // 거래소별 연동 테스트 실행
    ExchangeTestService.prototype.testExchangeConnection = function (exchange, apiKey, apiSecret) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("\uD83D\uDE80 ".concat(exchange, " \uAC70\uB798\uC18C \uC5F0\uB3D9 \uD14C\uC2A4\uD2B8 \uC2DC\uC791..."));
                        _a = exchange.toLowerCase();
                        switch (_a) {
                            case 'upbit': return [3 /*break*/, 1];
                            case 'binance': return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [4 /*yield*/, this.testUpbitConnection(apiKey, apiSecret)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.testBinanceConnection(apiKey, apiSecret)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [2 /*return*/, {
                            success: false,
                            message: '지원하지 않는 거래소입니다',
                            error: "Unknown exchange: ".concat(exchange)
                        }];
                }
            });
        });
    };
    return ExchangeTestService;
}());
export { ExchangeTestService };
export var exchangeTestService = new ExchangeTestService();
