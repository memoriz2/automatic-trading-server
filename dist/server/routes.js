var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import { KimchiService } from "./services/kimchi.js";
import { CoinAPIService } from "./services/coinapi.js";
import { SimpleKimchiService } from "./services/simple-kimchi.js";
import { UpbitWebSocketService } from "./services/upbit-websocket.js";
import { BinanceWebSocketService } from "./services/binance-websocket.js";
import { realtimeKimchiService } from "./services/realtime-kimchi.js";
import { priceCache } from "./services/price-cache.js";
import { TradingService } from "./services/trading.js";
import { multiStrategyTradingService } from "./services/new-kimchi-trading.js";
import { UpbitService } from "./services/upbit.js";
import { BinanceService } from "./services/binance.js";
import { KimpgaStrategyService } from "./services/kimpga-strategy.js";
import { exchangeTestService } from "./services/exchange-test.js";
import { BacktestService } from "./services/backtest.js";
import { z } from "zod";
var insertTradingSettingsSchema = z.object({
    entryPremiumRate: z.string().optional(),
    exitPremiumRate: z.string().optional(),
    stopLossRate: z.string().optional(),
    maxPositions: z.number().int().optional(),
    isAutoTrading: z.boolean().optional(),
    maxInvestmentAmount: z.string().optional(),
    kimchiEntryRate: z.string().optional(),
    kimchiExitRate: z.string().optional(),
    kimchiToleranceRate: z.string().optional(),
    binanceLeverage: z.number().int().optional(),
    upbitEntryAmount: z.string().optional(),
});
var insertExchangeSchema = z.object({
    userId: z.number(),
    exchange: z.string(),
    apiKey: z.string(),
    apiSecret: z.string(),
    passphrase: z.string().optional(),
});
var insertUserSchema = z.object({
    username: z.string(),
    password: z.string(),
});
var loginUserSchema = z.object({
    username: z.string(),
    password: z.string(),
});
import { getCurrentServerIP, isReplit } from "./utils/ip.js";
import { authenticateToken, } from "./utils/auth.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
/**
 * JWT 토큰에서 사용자 ID 추출
 */
function getUserIdFromToken(authHeader) {
    try {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        var token = authHeader.substring(7);
        var decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId || null;
    }
    catch (error) {
        console.error('JWT 토큰 검증 실패:', error);
        return null;
    }
}
/**
 * 요청에서 사용자 ID 추출 (토큰 또는 기본값)
 */
function getUserIdFromRequest(req) {
    var userId = getUserIdFromToken(req.headers.authorization);
    return userId || "1"; // 기본 사용자 ID
}
/**
 * 실제 API 키가 있는 활성 사용자를 찾기
 */
function findActiveUserWithApiKeys() {
    return __awaiter(this, void 0, void 0, function () {
        var knownUserIds, _i, knownUserIds_1, userId, exchanges, binanceExchange, upbitExchange, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    knownUserIds = ["7", "1", "2", "3", "4", "5", "6", "8", "9", "10"];
                    _i = 0, knownUserIds_1 = knownUserIds;
                    _a.label = 1;
                case 1:
                    if (!(_i < knownUserIds_1.length)) return [3 /*break*/, 6];
                    userId = knownUserIds_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, storage.getExchangesByUserId(userId)];
                case 3:
                    exchanges = _a.sent();
                    binanceExchange = exchanges.find(function (ex) {
                        return ex.exchange === 'binance' && ex.isActive && ex.apiKey && ex.apiSecret;
                    });
                    if (binanceExchange) {
                        console.log("\uD83D\uDD0D \uD65C\uC131 \uC0AC\uC6A9\uC790 \uBC1C\uACAC: User ID ".concat(userId, " (\uBC14\uC774\uB0B8\uC2A4 API \uD0A4 \uBCF4\uC720)"));
                        return [2 /*return*/, userId];
                    }
                    upbitExchange = exchanges.find(function (ex) {
                        return ex.exchange === 'upbit' && ex.isActive && ex.apiKey && ex.apiSecret;
                    });
                    if (upbitExchange) {
                        console.log("\uD83D\uDD0D \uD65C\uC131 \uC0AC\uC6A9\uC790 \uBC1C\uACAC: User ID ".concat(userId, " (\uC5C5\uBE44\uD2B8 API \uD0A4 \uBCF4\uC720)"));
                        return [2 /*return*/, userId];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    // 해당 사용자가 없거나 오류시 다음 사용자로
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log("\u26A0\uFE0F API \uD0A4\uAC00 \uC788\uB294 \uD65C\uC131 \uC0AC\uC6A9\uC790\uB97C \uCC3E\uC9C0 \uBABB\uD568, \uAE30\uBCF8 \uC0AC\uC6A9\uC790 1 \uC0AC\uC6A9");
                    return [2 /*return*/, "1"];
                case 7:
                    error_2 = _a.sent();
                    console.error('활성 사용자 찾기 실패:', error_2);
                    return [2 /*return*/, "1"]; // 실패시 기본값
                case 8: return [2 /*return*/];
            }
        });
    });
}
export function registerRoutes(app, server) {
    return __awaiter(this, void 0, void 0, function () {
        var kimchiService, coinAPIService, simpleKimchiService, backtestService, upbitWebSocketService, binanceWebSocketService, kimpgaSvc, tradingService, wss;
        var _this = this;
        return __generator(this, function (_a) {
            kimchiService = new KimchiService();
            coinAPIService = new CoinAPIService();
            simpleKimchiService = new SimpleKimchiService();
            backtestService = new BacktestService();
            upbitWebSocketService = new UpbitWebSocketService();
            binanceWebSocketService = new BinanceWebSocketService();
            // 🚀 실시간 김치 프리미엄 계산 시스템 연결
            priceCache.onPriceUpdate(function (source, symbol, price) {
                realtimeKimchiService.onPriceUpdate(source, symbol);
            });
            // 주요 코인들 자동 구독
            setTimeout(function () {
                console.log('🔔 웹소켓 자동 구독 시작...');
                upbitWebSocketService.subscribe(['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOT', 'KRW-USDT']);
                console.log('✅ 업비트 웹소켓 구독 완료 (USDT 포함)');
                console.log('✅ 바이낸스 웹소켓 자동 연결 완료');
                console.log('🚀 실시간 김치 프리미엄 계산 시스템 활성화');
            }, 2000); // 2초 후 구독 시작
            kimpgaSvc = new KimpgaStrategyService();
            tradingService = new TradingService();
            // kimpga API (완전 통합)
            app.get("/api/kimpga/current", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var realtime, d;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    try {
                        realtime = realtimeKimchiService.getCurrentKimchiPremium();
                        d = realtime.find(function (x) { return x.symbol === "BTC"; });
                        res.json({
                            kimp: (_a = d === null || d === void 0 ? void 0 : d.premiumRate) !== null && _a !== void 0 ? _a : null,
                            upbit_price: (_b = d === null || d === void 0 ? void 0 : d.upbitPrice) !== null && _b !== void 0 ? _b : null,
                            binance_price: (_c = d === null || d === void 0 ? void 0 : d.binanceFuturesPrice) !== null && _c !== void 0 ? _c : null,
                            usdkrw: (_d = d === null || d === void 0 ? void 0 : d.usdKrwRate) !== null && _d !== void 0 ? _d : null,
                        });
                    }
                    catch (e) {
                        console.error("/api/kimpga/current error", e);
                        res.status(500).json({ error: "failed" });
                    }
                    return [2 /*return*/];
                });
            }); });
            app.get("/api/kimpga/status", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        res.json(kimpgaSvc.getStatus());
                    }
                    catch (e) {
                        res.status(500).json({ error: "failed" });
                    }
                    return [2 /*return*/];
                });
            }); });
            app.get("/api/kimpga/health", function (_req, res) {
                res.json({ thread_alive: kimpgaSvc.getStatus().running });
            });
            app.get("/api/kimpga/metrics", function (_req, res) {
                var m = kimpgaSvc.getMetrics();
                res.json(m);
            });
            app.get("/api/kimpga/balance", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var headerUserId, sessionUserId, userId, ex, up, bi, krw, btc_upbit, usdt, UpbitService_1, decryptedUpbit, upApiKey, upApiSecret, upbitService, accounts, krwAccount, btcAccount, error_3, BinanceService_1, decryptedBinance, biApiKey, biApiSecret, binanceService, error_4, e_1;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 18, , 19]);
                            headerUserId = req.headers['x-user-id'];
                            sessionUserId = getUserIdFromRequest(req);
                            userId = headerUserId || sessionUserId;
                            console.log("\uD83D\uDD0D [\uC794\uACE0 \uC870\uD68C] \uC694\uCCAD \uC0AC\uC6A9\uC790 ID: ".concat(userId, " (\uD5E4\uB354: ").concat(headerUserId, ", \uC138\uC158: ").concat(sessionUserId, ")"));
                            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                            res.setHeader('Pragma', 'no-cache');
                            res.setHeader('Expires', '0');
                            return [4 /*yield*/, storage.getExchangesByUserId(userId)];
                        case 1:
                            ex = _c.sent();
                            up = ex.find(function (e) { return e.exchange === "upbit" && e.isActive; });
                            bi = ex.find(function (e) { return e.exchange === "binance" && e.isActive; });
                            krw = 0;
                            btc_upbit = 0;
                            usdt = 0;
                            // 업비트 잔고 조회
                            console.log("\uD83D\uDD0D [\uC794\uACE0 \uC870\uD68C] \uC5C5\uBE44\uD2B8 \uC124\uC815:", up ? {
                                hasApiKey: !!up.apiKey,
                                hasApiSecret: !!up.apiSecret,
                                apiKeyLength: ((_a = up.apiKey) === null || _a === void 0 ? void 0 : _a.length) || 0
                            } : '없음');
                            if (!(up && up.apiKey && up.apiSecret)) return [3 /*break*/, 8];
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 6, , 7]);
                            console.log("\uD83D\uDCB0 [\uC794\uACE0 \uC870\uD68C] \uC5C5\uBE44\uD2B8 API \uD638\uCD9C \uC2DC\uC791");
                            return [4 /*yield*/, import('./services/upbit.js')];
                        case 3:
                            UpbitService_1 = (_c.sent()).UpbitService;
                            return [4 /*yield*/, storage.getDecryptedExchange(userId, 'upbit').catch(function () { return null; })];
                        case 4:
                            decryptedUpbit = _c.sent();
                            upApiKey = (decryptedUpbit === null || decryptedUpbit === void 0 ? void 0 : decryptedUpbit.apiKey) || up.apiKey;
                            upApiSecret = (decryptedUpbit === null || decryptedUpbit === void 0 ? void 0 : decryptedUpbit.apiSecret) || up.apiSecret;
                            upbitService = new UpbitService_1(upApiKey, upApiSecret);
                            return [4 /*yield*/, upbitService.getAccounts()];
                        case 5:
                            accounts = _c.sent();
                            console.log("\uD83D\uDCB0 [\uC794\uACE0 \uC870\uD68C] \uC5C5\uBE44\uD2B8 \uACC4\uC88C \uAC1C\uC218: ".concat(accounts.length));
                            krwAccount = accounts.find(function (account) { return account.currency === 'KRW'; });
                            btcAccount = accounts.find(function (account) { return account.currency === 'BTC'; });
                            krw = krwAccount ? parseFloat(krwAccount.balance) : 0;
                            btc_upbit = btcAccount ? parseFloat(btcAccount.balance) : 0;
                            console.log("\uD83D\uDCB0 [\uC794\uACE0 \uC870\uD68C] \uC5C5\uBE44\uD2B8 KRW: ".concat(krw, ", BTC: ").concat(btc_upbit));
                            return [3 /*break*/, 7];
                        case 6:
                            error_3 = _c.sent();
                            console.error('❌ [잔고 조회] 업비트 잔고 조회 오류:', error_3);
                            return [3 /*break*/, 7];
                        case 7: return [3 /*break*/, 9];
                        case 8:
                            console.log("\u26A0\uFE0F [\uC794\uACE0 \uC870\uD68C] \uC5C5\uBE44\uD2B8 API \uD0A4 \uC5C6\uC74C");
                            _c.label = 9;
                        case 9:
                            // 바이낸스 잔고 조회
                            console.log("\uD83D\uDD0D [\uC794\uACE0 \uC870\uD68C] \uBC14\uC774\uB0B8\uC2A4 \uC124\uC815:", bi ? {
                                hasApiKey: !!bi.apiKey,
                                hasApiSecret: !!bi.apiSecret,
                                apiKeyLength: ((_b = bi.apiKey) === null || _b === void 0 ? void 0 : _b.length) || 0
                            } : '없음');
                            if (!(bi && bi.apiKey && bi.apiSecret)) return [3 /*break*/, 16];
                            _c.label = 10;
                        case 10:
                            _c.trys.push([10, 14, , 15]);
                            console.log("\uD83D\uDCB0 [\uC794\uACE0 \uC870\uD68C] \uBC14\uC774\uB0B8\uC2A4 API \uD638\uCD9C \uC2DC\uC791");
                            return [4 /*yield*/, import('./services/binance.js')];
                        case 11:
                            BinanceService_1 = (_c.sent()).BinanceService;
                            return [4 /*yield*/, storage.getDecryptedExchange(userId, 'binance').catch(function () { return null; })];
                        case 12:
                            decryptedBinance = _c.sent();
                            biApiKey = (decryptedBinance === null || decryptedBinance === void 0 ? void 0 : decryptedBinance.apiKey) || bi.apiKey;
                            biApiSecret = (decryptedBinance === null || decryptedBinance === void 0 ? void 0 : decryptedBinance.apiSecret) || bi.apiSecret;
                            binanceService = new BinanceService_1(biApiKey, biApiSecret);
                            return [4 /*yield*/, binanceService.getUSDTBalance()];
                        case 13:
                            usdt = _c.sent();
                            console.log("\uD83D\uDCB0 [\uC794\uACE0 \uC870\uD68C] \uBC14\uC774\uB0B8\uC2A4 USDT: ".concat(usdt));
                            return [3 /*break*/, 15];
                        case 14:
                            error_4 = _c.sent();
                            console.error('❌ [잔고 조회] 바이낸스 잔고 조회 오류:', error_4);
                            return [3 /*break*/, 15];
                        case 15: return [3 /*break*/, 17];
                        case 16:
                            console.log("\u26A0\uFE0F [\uC794\uACE0 \uC870\uD68C] \uBC14\uC774\uB0B8\uC2A4 API \uD0A4 \uC5C6\uC74C");
                            _c.label = 17;
                        case 17:
                            console.log("\u2705 [\uC794\uACE0 \uC870\uD68C] \uCD5C\uC885 \uACB0\uACFC: KRW=".concat(krw, ", BTC=").concat(btc_upbit, ", USDT=").concat(usdt));
                            res.json({
                                real: { krw: krw, btc_upbit: btc_upbit, usdt: usdt },
                                connected: { upbit: !!up, binance: !!bi },
                            });
                            return [3 /*break*/, 19];
                        case 18:
                            e_1 = _c.sent();
                            console.error('❌ [잔고 조회] 전체 오류:', e_1);
                            res.json({ real: { krw: 0, btc_upbit: 0, usdt: 0 } });
                            return [3 /*break*/, 19];
                        case 19: return [2 /*return*/];
                    }
                });
            }); });
            app.post("/api/kimpga/start", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    kimpgaSvc.start();
                    res.json({ ok: true });
                    return [2 /*return*/];
                });
            }); });
            app.post("/api/kimpga/stop", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    kimpgaSvc.stop();
                    res.json({ ok: true });
                    return [2 /*return*/];
                });
            }); });
            app.post("/api/kimpga/force-exit", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    result = kimpgaSvc.forceExit();
                    res.json(result);
                    return [2 /*return*/];
                });
            }); });
            // 백테스트 실행 API
            app.post("/api/backtest", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var params, result, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            console.log("Backtest request received:", req.body);
                            params = req.body;
                            return [4 /*yield*/, backtestService.runBacktest(params)];
                        case 1:
                            result = _a.sent();
                            res.json(result);
                            return [3 /*break*/, 3];
                        case 2:
                            error_5 = _a.sent();
                            console.error("Backtest API error:", error_5);
                            res.status(500).json({ error: "Failed to run backtest", details: error_5.message });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 🔐 Authentication Routes
            // 회원가입
            app.post("/api/auth/register", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validation, _a, username, password, existingUser, user, token, error_6;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            // CORS 헤더 추가
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            console.log("회원가입 요청 데이터:", req.body);
                            validation = insertUserSchema.safeParse(req.body);
                            if (!validation.success) {
                                console.log("검증 실패:", validation.error.errors);
                                return [2 /*return*/, res.status(400).json({
                                        message: "입력 데이터가 올바르지 않습니다",
                                        errors: validation.error.errors,
                                    })];
                            }
                            _a = validation.data, username = _a.username, password = _a.password;
                            console.log("검증 완료 - 사용자명:", username);
                            return [4 /*yield*/, storage.getUserByUsername(username)];
                        case 1:
                            existingUser = _b.sent();
                            if (existingUser) {
                                return [2 /*return*/, res
                                        .status(409)
                                        .json({ message: "이미 존재하는 사용자명입니다" })];
                            }
                            console.log("새 사용자 생성 중...");
                            return [4 /*yield*/, storage.createUser({
                                    username: username,
                                    password: password,
                                    role: "user",
                                })];
                        case 2:
                            user = _b.sent();
                            console.log("사용자 생성 완료:", user.id, user.username);
                            token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
                            res.status(201).json({
                                message: "회원가입이 완료되었습니다",
                                user: {
                                    id: user.id,
                                    username: user.username,
                                    role: user.role,
                                },
                                token: token,
                            });
                            return [3 /*break*/, 4];
                        case 3:
                            error_6 = _b.sent();
                            console.error("회원가입 오류:", error_6);
                            res.status(500).json({
                                message: "회원가입 처리 중 오류가 발생했습니다",
                                debug: error_6.message,
                            });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // 로그인
            app.post("/api/auth/login", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var validation, _a, username, password, user, isPasswordValid, token, error_7;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            // CORS 헤더 추가
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
                            res.header("Access-Control-Allow-Headers", "Content-Type");
                            console.log("로그인 요청 데이터:", req.body);
                            validation = loginUserSchema.safeParse(req.body);
                            if (!validation.success) {
                                console.log("로그인 검증 실패:", validation.error.errors);
                                return [2 /*return*/, res.status(400).json({
                                        message: "사용자명과 비밀번호를 입력해주세요",
                                        errors: validation.error.errors,
                                    })];
                            }
                            _a = validation.data, username = _a.username, password = _a.password;
                            console.log("로그인 시도:", username);
                            return [4 /*yield*/, storage.getUserByUsername(username)];
                        case 1:
                            user = _b.sent();
                            if (!user) {
                                return [2 /*return*/, res.status(401).json({ message: "사용자를 찾을 수 없습니다" })];
                            }
                            return [4 /*yield*/, bcrypt.compare(password, user.password)];
                        case 2:
                            isPasswordValid = _b.sent();
                            if (!isPasswordValid) {
                                return [2 /*return*/, res
                                        .status(401)
                                        .json({ message: "비밀번호가 일치하지 않습니다" })];
                            }
                            console.log("로그인 성공:", user.username);
                            token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
                            res.json({
                                message: "로그인 성공",
                                user: {
                                    id: user.id,
                                    username: user.username,
                                    role: user.role,
                                },
                                token: token,
                            });
                            return [3 /*break*/, 4];
                        case 3:
                            error_7 = _b.sent();
                            console.error("로그인 오류:", error_7);
                            res.status(500).json({
                                message: "로그인 처리 중 오류가 발생했습니다",
                                debug: error_7.message,
                            });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // 현재 사용자 정보 조회
            app.get("/api/auth/me", authenticateToken, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, user, error_8;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.user.userId;
                            return [4 /*yield*/, storage.getUser(userId)];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                return [2 /*return*/, res.status(404).json({ message: "사용자를 찾을 수 없습니다" })];
                            }
                            res.json({
                                id: user.id,
                                username: user.username,
                                role: user.role,
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            error_8 = _a.sent();
                            console.error("사용자 정보 조회 오류:", error_8);
                            res
                                .status(500)
                                .json({ message: "사용자 정보 조회 중 오류가 발생했습니다" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Download endpoint
            app.get("/api/download", function (req, res) {
                var fs = require("fs");
                var path = require("path");
                var filePath = path.join(process.cwd(), "download-this-file.tar.gz");
                if (fs.existsSync(filePath)) {
                    res.download(filePath, "kimchi-premium-trading.tar.gz");
                }
                else {
                    res.status(404).send("File not found");
                }
            });
            // API Routes
            // 서버 정보 조회 (IP 주소 등)
            app.get("/api/server-info", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var serverIP, isReplitEnv, error_9;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, getCurrentServerIP()];
                        case 1:
                            serverIP = _a.sent();
                            isReplitEnv = isReplit();
                            res.json({
                                ip: serverIP,
                                isReplit: isReplitEnv,
                                environment: process.env.NODE_ENV || "development",
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            error_9 = _a.sent();
                            console.error("Failed to get server info:", error_9);
                            res.status(500).json({ error: "Failed to fetch server info" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 암호화폐 목록 조회
            app.get("/api/cryptocurrencies", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var cryptocurrencies, error_10;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage.getAllCryptocurrencies()];
                        case 1:
                            cryptocurrencies = _a.sent();
                            res.json(cryptocurrencies);
                            return [3 /*break*/, 3];
                        case 2:
                            error_10 = _a.sent();
                            res.status(500).json({ error: "Failed to fetch cryptocurrencies" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 최신 김프율 조회 (대시보드용) - SimpleKimchiService 사용
            app.get("/api/kimchi-premium", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var symbols, kimchiData, error_11;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
                            return [4 /*yield*/, simpleKimchiService.calculateSimpleKimchi(symbols)];
                        case 1:
                            kimchiData = _a.sent();
                            res.json(kimchiData);
                            return [3 /*break*/, 3];
                        case 2:
                            error_11 = _a.sent();
                            console.error("Error calculating kimchi premium:", error_11);
                            res.status(500).json({ error: "Failed to fetch kimchi premiums" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // CoinAPI 기반 실시간 김프율 조회 (고정밀도)
            app.get("/api/kimchi-premium/coinapi", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var symbols, results, _i, symbols_1, symbol, data, error_12, error_13;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 7, , 8]);
                            symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
                            results = [];
                            _i = 0, symbols_1 = symbols;
                            _a.label = 1;
                        case 1:
                            if (!(_i < symbols_1.length)) return [3 /*break*/, 6];
                            symbol = symbols_1[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, coinAPIService.calculateKimchiPremium(symbol)];
                        case 3:
                            data = _a.sent();
                            results.push({
                                symbol: symbol,
                                upbitPrice: data.upbitPrice,
                                binancePrice: data.binancePriceKRW,
                                premiumRate: data.premiumRate,
                                timestamp: new Date().toISOString(),
                                source: "CoinAPI",
                            });
                            return [3 /*break*/, 5];
                        case 4:
                            error_12 = _a.sent();
                            console.warn("CoinAPI ".concat(symbol, " \uC870\uD68C \uC2E4\uD328:"), error_12);
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6:
                            res.json(results);
                            return [3 /*break*/, 8];
                        case 7:
                            error_13 = _a.sent();
                            console.error("CoinAPI kimchi premium calculation error:", error_13);
                            res
                                .status(500)
                                .json({ error: "Failed to fetch CoinAPI kimchi premiums" });
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            }); });
            // 단순 김프율 계산 (업비트 + 바이낸스 선물 + 구글 환율)
            app.get("/api/kimchi-premium/simple", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, symbols, results, error_14;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = getUserIdFromRequest(req);
                            symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
                            return [4 /*yield*/, simpleKimchiService.calculateSimpleKimchi(symbols, userId)];
                        case 1:
                            results = _a.sent();
                            res.json(results);
                            return [3 /*break*/, 3];
                        case 2:
                            error_14 = _a.sent();
                            console.error("Simple kimchi premium calculation error:", error_14);
                            res.status(500).json({ error: "Failed to fetch simple kimchi premiums" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 김프 데이터 API 엔드포인트 (프론트엔드 호환성)
            app.get("/api/kimchi-data", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, symbols, simpleKimchiData, kimchiData, error_15;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = getUserIdFromRequest(req);
                            symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
                            return [4 /*yield*/, simpleKimchiService.calculateSimpleKimchi(symbols, userId)];
                        case 1:
                            simpleKimchiData = _a.sent();
                            kimchiData = simpleKimchiData.map(function (data) { return ({
                                symbol: data.symbol,
                                upbitPrice: data.upbitPrice,
                                binancePrice: data.binancePriceKRW,
                                binancePriceUSD: data.binanceFuturesPrice,
                                premiumRate: data.premiumRate,
                                timestamp: new Date(data.timestamp),
                                exchangeRate: data.usdKrwRate,
                                exchangeRateSource: "Google Finance (실시간 환율)",
                            }); });
                            res.json(kimchiData);
                            return [3 /*break*/, 3];
                        case 2:
                            error_15 = _a.sent();
                            console.error("Kimchi data API error:", error_15);
                            res.status(500).json({ error: "Failed to fetch kimchi data" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 환율 정보 조회 API
            app.get("/api/exchange-rate", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var exchangeRate;
                return __generator(this, function (_a) {
                    try {
                        exchangeRate = simpleKimchiService.getCurrentExchangeRate();
                        res.json({
                            rate: exchangeRate,
                            source: "Google Finance",
                            timestamp: new Date().toISOString()
                        });
                    }
                    catch (error) {
                        console.error("Exchange rate API error:", error);
                        res.status(500).json({ error: "Failed to fetch exchange rate" });
                    }
                    return [2 /*return*/];
                });
            }); });
            // 최신 김프율 조회 (저장된 데이터) -> KimchiService의 지연 초기화 트리거
            app.get("/api/kimchi-premiums", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var premiums, error_16;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, kimchiService.getLatestKimchiPremiums()];
                        case 1:
                            premiums = _a.sent();
                            res.json(premiums);
                            return [3 /*break*/, 3];
                        case 2:
                            error_16 = _a.sent();
                            res.status(500).json({ error: "Failed to fetch kimchi premiums" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 김프율 히스토리 조회
            app.get("/api/kimchi-premiums/:symbol/history", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var symbol, limit, history_1, error_17;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            symbol = req.params.symbol;
                            limit = parseInt(req.query.limit) || 100;
                            return [4 /*yield*/, kimchiService.getKimchiPremiumHistory(symbol, limit)];
                        case 1:
                            history_1 = _a.sent();
                            res.json(history_1);
                            return [3 /*break*/, 3];
                        case 2:
                            error_17 = _a.sent();
                            res.status(500).json({ error: "Failed to fetch kimchi premium history" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 거래 설정 조회
            app.get("/api/trading-settings/:userId", authenticateToken, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, settings, defaultSettings, error_18;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            userId = req.user.userId;
                            console.log("\uAC70\uB798 \uC124\uC815 \uC870\uD68C \uC694\uCCAD: userId=".concat(userId));
                            return [4 /*yield*/, storage.getTradingSettingsByUserId(String(userId))];
                        case 1:
                            settings = _a.sent();
                            console.log("\uC870\uD68C\uB41C \uC124\uC815:", settings);
                            if (!!settings) return [3 /*break*/, 3];
                            // 기본 설정 생성
                            console.log("기본 설정 생성 중...");
                            return [4 /*yield*/, storage.createTradingSettings({
                                    userId: parseInt(userId),
                                    entryPremiumRate: "2.5",
                                    exitPremiumRate: "1.0",
                                    stopLossRate: "-1.5",
                                    maxPositions: 5,
                                    isAutoTrading: false,
                                    maxInvestmentAmount: "1000000",
                                })];
                        case 2:
                            defaultSettings = _a.sent();
                            console.log("기본 설정 생성 완료:", defaultSettings);
                            res.json(defaultSettings);
                            return [3 /*break*/, 4];
                        case 3:
                            res.json(settings);
                            _a.label = 4;
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            error_18 = _a.sent();
                            console.error("거래 설정 조회 오류:", error_18);
                            res.status(500).json({
                                error: "Failed to fetch trading settings",
                                debug: error_18.message,
                            });
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            }); });
            // 거래 설정 업데이트 (디버깅 로그 강화)
            app.put("/api/trading-settings/:userId", authenticateToken, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var authenticatedUserId, current, snapErr_1, settingsData, normalized, settings, error_19, zodIssues;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            authenticatedUserId = req.user.userId;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 7, , 8]);
                            console.log("[".concat(new Date().toISOString(), "] PUT /api/trading-settings/").concat(authenticatedUserId, " body:"), req.body);
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, storage.getTradingSettingsByUserId(String(authenticatedUserId))];
                        case 3:
                            current = _a.sent();
                            console.log("[".concat(new Date().toISOString(), "] current settings for user ").concat(authenticatedUserId, ":"), current);
                            return [3 /*break*/, 5];
                        case 4:
                            snapErr_1 = _a.sent();
                            console.warn("[".concat(new Date().toISOString(), "] failed to fetch current settings for user ").concat(authenticatedUserId, ":"), snapErr_1);
                            return [3 /*break*/, 5];
                        case 5:
                            settingsData = insertTradingSettingsSchema.parse(req.body);
                            console.log("[".concat(new Date().toISOString(), "] parsed settingsData:"), settingsData);
                            normalized = __assign(__assign({}, settingsData), { entryPremiumRate: settingsData.entryPremiumRate, exitPremiumRate: settingsData.exitPremiumRate, stopLossRate: settingsData.stopLossRate, maxInvestmentAmount: settingsData.maxInvestmentAmount, kimchiEntryRate: settingsData.kimchiEntryRate, kimchiExitRate: settingsData.kimchiExitRate, kimchiToleranceRate: settingsData.kimchiToleranceRate, upbitEntryAmount: settingsData.upbitEntryAmount, dailyLossLimit: settingsData.dailyLossLimit, maxPositionSize: settingsData.maxPositionSize });
                            return [4 /*yield*/, storage.updateTradingSettings(String(authenticatedUserId), normalized)];
                        case 6:
                            settings = _a.sent();
                            console.log("[".concat(new Date().toISOString(), "] updated settings for user ").concat(authenticatedUserId, ":"), settings);
                            res.json(settings);
                            return [3 /*break*/, 8];
                        case 7:
                            error_19 = _a.sent();
                            zodIssues = (error_19 === null || error_19 === void 0 ? void 0 : error_19.issues) || (error_19 === null || error_19 === void 0 ? void 0 : error_19.errors)
                                ? error_19.issues || error_19.errors
                                : undefined;
                            console.error("[".concat(new Date().toISOString(), "] trading-settings update error for user ").concat(authenticatedUserId, ":"), {
                                message: error_19 === null || error_19 === void 0 ? void 0 : error_19.message,
                                name: error_19 === null || error_19 === void 0 ? void 0 : error_19.name,
                                code: error_19 === null || error_19 === void 0 ? void 0 : error_19.code,
                                issues: zodIssues,
                                body: req.body,
                            });
                            res.status(400).json({
                                error: "Invalid trading settings data",
                                message: error_19 === null || error_19 === void 0 ? void 0 : error_19.message,
                                issues: zodIssues,
                            });
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            }); });
            // 활성 포지션 조회 (인증 기반, 권장)
            app.get("/api/positions", authenticateToken, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, positions, error_20;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = String(req.user.userId);
                            return [4 /*yield*/, storage.getActivePositions(userId)];
                        case 1:
                            positions = _a.sent();
                            res.json(positions);
                            return [3 /*break*/, 3];
                        case 2:
                            error_20 = _a.sent();
                            console.error("포지션 조회 오류:", error_20);
                            res.status(500).json({ error: "Failed to fetch positions" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 활성 포지션 조회
            app.get("/api/positions/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, positions, error_21;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.params.userId;
                            return [4 /*yield*/, storage.getActivePositions(userId)];
                        case 1:
                            positions = _a.sent();
                            res.json(positions);
                            return [3 /*break*/, 3];
                        case 2:
                            error_21 = _a.sent();
                            console.error("포지션 조회 오류:", error_21);
                            res.status(500).json({ error: "Failed to fetch positions" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 포지션 청산
            app.post("/api/positions/:id/close", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var positionId, position, error_22;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            positionId = parseInt(req.params.id);
                            return [4 /*yield*/, storage.closePosition(positionId)];
                        case 1:
                            position = _a.sent();
                            if (!position) {
                                res.status(404).json({ error: "Position not found" });
                                return [2 /*return*/];
                            }
                            res.json(position);
                            return [3 /*break*/, 3];
                        case 2:
                            error_22 = _a.sent();
                            res.status(500).json({ error: "Failed to close position" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 거래 내역 조회
            app.get("/api/trades/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, limit, trades, error_23;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.params.userId;
                            limit = parseInt(req.query.limit) || 50;
                            return [4 /*yield*/, storage.getTradesByUserId(userId, limit)];
                        case 1:
                            trades = _a.sent();
                            res.json(trades);
                            return [3 /*break*/, 3];
                        case 2:
                            error_23 = _a.sent();
                            res.status(500).json({ error: "Failed to fetch trades" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 시스템 알림 조회
            app.get("/api/alerts", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var limit, alerts, error_24;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            limit = parseInt(req.query.limit) || 20;
                            return [4 /*yield*/, storage.getSystemAlerts(limit)];
                        case 1:
                            alerts = _a.sent();
                            res.json(alerts);
                            return [3 /*break*/, 3];
                        case 2:
                            error_24 = _a.sent();
                            res.status(500).json({ error: "Failed to fetch alerts" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 알림 읽음 처리
            app.put("/api/alerts/:id/read", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var alertId, alert_1, error_25;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            alertId = parseInt(req.params.id);
                            return [4 /*yield*/, storage.markAlertAsRead(alertId)];
                        case 1:
                            alert_1 = _a.sent();
                            if (!alert_1) {
                                res.status(404).json({ error: "Alert not found" });
                                return [2 /*return*/];
                            }
                            res.json(alert_1);
                            return [3 /*break*/, 3];
                        case 2:
                            error_25 = _a.sent();
                            res.status(500).json({ error: "Failed to mark alert as read" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 자동매매 시작
            app.post("/api/trading/start/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, traceId, settings, strategies, activeCount, error_26, traceId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            userId = req.params.userId;
                            traceId = req.header("X-Trace-Id") || "srv-".concat(Date.now());
                            console.log("[TRACE ".concat(traceId, "] [\uC790\uB3D9\uB9E4\uB9E4 \uC2DC\uC791] \uC0AC\uC6A9\uC790: ").concat(userId));
                            return [4 /*yield*/, storage.getTradingSettingsByUserId(userId)];
                        case 1:
                            settings = _a.sent();
                            if (!settings) {
                                return [2 /*return*/, res.status(400).json({ error: "거래 설정을 먼저 구성해주세요", traceId: traceId })];
                            }
                            return [4 /*yield*/, multiStrategyTradingService.startMultiStrategyTrading(userId)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, storage.getTradingStrategiesByUserId(userId)];
                        case 3:
                            strategies = _a.sent();
                            activeCount = strategies.filter(function (s) { return s.isActive; }).length;
                            res.json({
                                message: "자동매매가 시작되었습니다",
                                activeStrategies: activeCount,
                                settings: settings,
                                traceId: traceId,
                            });
                            return [3 /*break*/, 5];
                        case 4:
                            error_26 = _a.sent();
                            traceId = req.header("X-Trace-Id") || "srv-".concat(Date.now());
                            console.error("[TRACE ".concat(traceId, "] \uC790\uB3D9\uB9E4\uB9E4 \uC2DC\uC791 \uC624\uB958:"), error_26);
                            res.status(500).json({ error: "자동매매 시작 중 오류가 발생했습니다", traceId: traceId });
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
            // 자동매매 중지
            app.post("/api/trading/stop/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, error_27;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.params.userId;
                            console.log("[\uC790\uB3D9\uB9E4\uB9E4 \uC911\uC9C0] \uC0AC\uC6A9\uC790: ".concat(userId));
                            return [4 /*yield*/, multiStrategyTradingService.stopMultiStrategyTrading()];
                        case 1:
                            _a.sent();
                            res.json({ message: "자동매매가 중지되었습니다" });
                            return [3 /*break*/, 3];
                        case 2:
                            error_27 = _a.sent();
                            console.error("자동매매 중지 오류:", error_27);
                            res.status(500).json({ error: "자동매매 중지 중 오류가 발생했습니다" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 자동매매 상태 조회
            app.get("/api/trading/status/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, isRunning, strategies, error_28;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.params.userId;
                            isRunning = multiStrategyTradingService.getIsTrading();
                            return [4 /*yield*/, storage.getTradingStrategiesByUserId(userId)];
                        case 1:
                            strategies = _a.sent();
                            res.json({
                                isRunning: isRunning,
                                strategies: strategies,
                                activeStrategies: strategies.filter(function (s) { return s.isActive; }).length,
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            error_28 = _a.sent();
                            console.error("자동매매 상태 조회 오류:", error_28);
                            res.status(500).json({ error: "자동매매 상태 조회 중 오류가 발생했습니다" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 자동매매 긴급 정지
            app.post("/api/trading/emergency-stop/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, error_29;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            userId = req.params.userId;
                            console.log("[\uAE34\uAE09 \uC815\uC9C0] \uC0AC\uC6A9\uC790: ".concat(userId));
                            return [4 /*yield*/, multiStrategyTradingService.stopMultiStrategyTrading()];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, storage.createSystemAlert({
                                    type: "warning",
                                    title: "자동매매 긴급 정지",
                                    message: "\uC0AC\uC6A9\uC790 ".concat(userId, "\uC758 \uC790\uB3D9\uB9E4\uB9E4\uAC00 \uAE34\uAE09 \uC815\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4"),
                                })];
                        case 2:
                            _a.sent();
                            res.json({ message: "긴급 정지 완료" });
                            return [3 /*break*/, 4];
                        case 3:
                            error_29 = _a.sent();
                            console.error("긴급 정지 오류:", error_29);
                            res.status(500).json({ error: "긴급 정지 중 오류가 발생했습니다" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // 거래소 계정 연결 정보 조회
            app.get("/api/exchanges/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, exchanges, safeExchanges, error_30;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.params.userId;
                            console.log("[".concat(new Date().toISOString(), "] \uAC70\uB798\uC18C \uC815\uBCF4 \uC870\uD68C \uC694\uCCAD - \uC0AC\uC6A9\uC790: ").concat(userId));
                            return [4 /*yield*/, storage.getExchangesByUserId(userId)];
                        case 1:
                            exchanges = _a.sent();
                            console.log("[".concat(new Date().toISOString(), "] \uC870\uD68C\uB41C \uAC70\uB798\uC18C \uC218: ").concat(exchanges.length));
                            console.log("[".concat(new Date().toISOString(), "] \uC870\uD68C\uB41C \uAC70\uB798\uC18C \uB370\uC774\uD130:"), exchanges);
                            safeExchanges = exchanges.map(function (exchange) { return ({
                                id: exchange.id,
                                name: exchange.exchange || "Unknown", // exchange 컬럼 사용
                                isActive: exchange.isActive,
                                apiKeyStart: exchange.apiKey.substring(0, 8) + "...",
                                hasApiKey: !!exchange.apiKey,
                                hasApiSecret: !!exchange.apiSecret,
                            }); });
                            console.log("[".concat(new Date().toISOString(), "] \uC548\uC804\uD558\uAC8C \uD544\uD130\uB9C1\uB41C \uAC70\uB798\uC18C \uB370\uC774\uD130:"), safeExchanges);
                            res.json(safeExchanges);
                            return [3 /*break*/, 3];
                        case 2:
                            error_30 = _a.sent();
                            console.error("[".concat(new Date().toISOString(), "] \uAC70\uB798\uC18C \uC815\uBCF4 \uC870\uD68C \uC624\uB958 - \uC0AC\uC6A9\uC790: ").concat(req.params.userId, ":"), error_30);
                            console.error("[".concat(new Date().toISOString(), "] \uC624\uB958 \uC0C1\uC138 \uC815\uBCF4:"), {
                                message: error_30.message,
                                stack: error_30.stack,
                                code: error_30.code,
                                detail: error_30.detail,
                                hint: error_30.hint,
                                fullError: error_30,
                            });
                            res.status(500).json({
                                error: "거래소 정보 조회 중 오류가 발생했습니다",
                                details: error_30.message,
                            });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 거래소 API 키 설정
            app.post("/api/exchanges/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, _a, exchange, apiKey, apiSecret, secretKey, resolvedSecret, exchangeRecord, savedExchange, verifyError_1, error_31;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            // ✅ 강제 로그 출력 - 모든 로그를 console.log로 변경
                            console.log("\uD83D\uDE80 [".concat(new Date().toISOString(), "] *** API \uD0A4 \uC800\uC7A5 \uC694\uCCAD \uC218\uC2E0\uB428 *** - URL: ").concat(req.url));
                            console.log("\uD83D\uDCCB [".concat(new Date().toISOString(), "] \uC694\uCCAD \uBA54\uC11C\uB4DC: ").concat(req.method, ", \uC694\uCCAD \uD5E4\uB354:"), req.headers);
                            console.log("\uD83D\uDCDD [".concat(new Date().toISOString(), "] \uC694\uCCAD \uBC14\uB514 (\uBBFC\uAC10 \uC815\uBCF4 \uC81C\uC678):"), {
                                userId: req.params.userId,
                                exchange: req.body.exchange,
                            });
                            console.log("\uD83D\uDD10 [".concat(new Date().toISOString(), "] \uC694\uCCAD \uBC14\uB514 \uC0C1\uC138 (\uBBFC\uAC10 \uC815\uBCF4 \uB9C8\uC2A4\uD0B9):"), {
                                name: req.body.name,
                                apiKey: req.body.apiKey
                                    ? req.body.apiKey.substring(0, 8) + "..."
                                    : "없음",
                                apiSecretPresent: !!(req.body.apiSecret || req.body.secretKey),
                                apiSecretSource: req.body.apiSecret
                                    ? "apiSecret"
                                    : req.body.secretKey
                                        ? "secretKey"
                                        : "none",
                            });
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 7, , 8]);
                            userId = req.params.userId;
                            _a = req.body, exchange = _a.exchange, apiKey = _a.apiKey, apiSecret = _a.apiSecret, secretKey = _a.secretKey;
                            resolvedSecret = apiSecret !== null && apiSecret !== void 0 ? apiSecret : secretKey;
                            console.log("\uD83D\uDCBE [".concat(new Date().toISOString(), "] API \uD0A4 \uC800\uC7A5 \uC694\uCCAD - \uC0AC\uC6A9\uC790: ").concat(userId, ", \uAC70\uB798\uC18C: ").concat(exchange));
                            console.log("\uD83D\uDD11 [".concat(new Date().toISOString(), "] API \uD0A4 \uC2DC\uC791 \uBD80\uBD84: ").concat(apiKey ? apiKey.substring(0, 8) + "..." : "없음"));
                            if (!exchange || !apiKey || !resolvedSecret) {
                                console.log("\u274C [".concat(new Date().toISOString(), "] \uD544\uC218 \uC815\uBCF4 \uB204\uB77D - exchange: ").concat(!!exchange, ", apiKey: ").concat(!!apiKey, ", apiSecret: ").concat(!!resolvedSecret));
                                return [2 /*return*/, res
                                        .status(400)
                                        .json({ error: "거래소명, API 키, Secret 키를 모두 입력해주세요" })];
                            }
                            console.log("\u23F3 [".concat(new Date().toISOString(), "] API \uD0A4 \uC800\uC7A5 \uC911... - \uC0AC\uC6A9\uC790: ").concat(userId, ", \uAC70\uB798\uC18C: ").concat(exchange));
                            console.log("\u23F3 [".concat(new Date().toISOString(), "] storage.createOrUpdateExchange \uD638\uCD9C \uC2DC\uC791..."));
                            // storage 객체 테스트
                            console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] storage \uAC1D\uCCB4 \uD14C\uC2A4\uD2B8:"), {
                                storageType: typeof storage,
                                hasCreateOrUpdateExchange: typeof storage.createOrUpdateExchange,
                                storageMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(storage)),
                                storageKeys: Object.keys(storage),
                            });
                            return [4 /*yield*/, storage.createOrUpdateExchange({
                                    userId: parseInt(userId),
                                    exchange: exchange,
                                    apiKey: apiKey,
                                    apiSecret: resolvedSecret,
                                    // isActive: true // 스키마에서 제외
                                })];
                        case 2:
                            exchangeRecord = _d.sent();
                            console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] storage.createOrUpdateExchange \uACB0\uACFC:"), {
                                exchangeRecord: exchangeRecord,
                                type: typeof exchangeRecord,
                                hasId: !!(exchangeRecord === null || exchangeRecord === void 0 ? void 0 : exchangeRecord.id),
                                id: exchangeRecord === null || exchangeRecord === void 0 ? void 0 : exchangeRecord.id,
                                userId: exchangeRecord === null || exchangeRecord === void 0 ? void 0 : exchangeRecord.userId,
                                exchange: exchangeRecord === null || exchangeRecord === void 0 ? void 0 : exchangeRecord.exchange,
                                isActive: exchangeRecord === null || exchangeRecord === void 0 ? void 0 : exchangeRecord.isActive,
                            });
                            if (!exchangeRecord) {
                                console.error("\u274C [".concat(new Date().toISOString(), "] exchangeRecord\uAC00 undefined\uC785\uB2C8\uB2E4!"));
                                return [2 /*return*/, res.status(500).json({
                                        error: "거래소 정보 저장에 실패했습니다",
                                        details: "저장된 거래소 정보를 가져올 수 없습니다",
                                    })];
                            }
                            console.log("\u2705 [".concat(new Date().toISOString(), "] API \uD0A4 \uC800\uC7A5 \uC131\uACF5 - \uC0AC\uC6A9\uC790: ").concat(userId, ", \uAC70\uB798\uC18C: ").concat(exchange, ", ID: ").concat(exchangeRecord.id));
                            // 저장된 데이터 확인을 위한 추가 로그
                            console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] \uC800\uC7A5\uB41C \uAC70\uB798\uC18C \uB370\uC774\uD130 \uC0C1\uC138:"), {
                                id: exchangeRecord.id,
                                userId: exchangeRecord.userId,
                                exchange: exchangeRecord.exchange,
                                apiKeyLength: ((_b = exchangeRecord.apiKey) === null || _b === void 0 ? void 0 : _b.length) || 0,
                                apiSecretLength: ((_c = exchangeRecord.apiSecret) === null || _c === void 0 ? void 0 : _c.length) || 0,
                                isActive: exchangeRecord.isActive,
                                createdAt: exchangeRecord.createdAt,
                                updatedAt: exchangeRecord.updatedAt,
                            });
                            _d.label = 3;
                        case 3:
                            _d.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, storage.getExchangesByUserId(userId)];
                        case 4:
                            savedExchange = _d.sent();
                            console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] \uC800\uC7A5 \uD6C4 \uC989\uC2DC \uC870\uD68C \uACB0\uACFC:"), {
                                totalExchanges: savedExchange.length,
                                savedExchange: savedExchange.map(function (ex) { return ({
                                    id: ex.id,
                                    exchange: ex.exchange,
                                    userId: ex.userId,
                                    hasApiKey: !!ex.apiKey,
                                    hasApiSecret: !!ex.apiSecret,
                                    isActive: ex.isActive,
                                }); }),
                            });
                            return [3 /*break*/, 6];
                        case 5:
                            verifyError_1 = _d.sent();
                            console.error("\u274C [".concat(new Date().toISOString(), "] \uC800\uC7A5 \uD6C4 \uC870\uD68C \uC2E4\uD328:"), verifyError_1);
                            return [3 /*break*/, 6];
                        case 6:
                            res.json({
                                message: "".concat(exchange, " \uAC70\uB798\uC18C \uC5F0\uACB0\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4"),
                                exchange: {
                                    id: exchangeRecord.id,
                                    exchange: exchangeRecord.exchange,
                                    apiKeyStart: apiKey.substring(0, 8) + "...",
                                },
                            });
                            return [3 /*break*/, 8];
                        case 7:
                            error_31 = _d.sent();
                            console.error("\uD83D\uDCA5 [".concat(new Date().toISOString(), "] \uAC70\uB798\uC18C \uC5F0\uACB0 \uC624\uB958 - \uC0AC\uC6A9\uC790: ").concat(req.params.userId, ", \uAC70\uB798\uC18C: ").concat(req.body.exchange || req.body.name || "알 수 없음", ":"), error_31);
                            console.error("\uD83D\uDD0D [".concat(new Date().toISOString(), "] \uC624\uB958 \uC0C1\uC138 \uC815\uBCF4:"), {
                                message: error_31.message,
                                stack: error_31.stack,
                                code: error_31.code,
                                detail: error_31.detail,
                                hint: error_31.hint,
                                requestBody: req.body,
                                requestParams: req.params,
                                requestHeaders: req.headers,
                            });
                            res.status(500).json({
                                error: "거래소 연결 중 오류가 발생했습니다",
                                details: error_31.message,
                                requestBody: req.body,
                                timestamp: new Date().toISOString(),
                            });
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            }); });
            // 거래소 연결 테스트
            app.post("/api/exchanges/:userId/test", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, exchanges, results, _i, exchanges_1, exchange, upbitService, accounts, binanceService, accountInfo, error_32, error_33;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 11, , 12]);
                            userId = req.params.userId;
                            return [4 /*yield*/, storage.getExchangesByUserId(userId)];
                        case 1:
                            exchanges = _b.sent();
                            results = [];
                            _i = 0, exchanges_1 = exchanges;
                            _b.label = 2;
                        case 2:
                            if (!(_i < exchanges_1.length)) return [3 /*break*/, 10];
                            exchange = exchanges_1[_i];
                            _b.label = 3;
                        case 3:
                            _b.trys.push([3, 8, , 9]);
                            if (!(exchange.exchange === "upbit")) return [3 /*break*/, 5];
                            upbitService = new UpbitService(exchange.apiKey, exchange.apiSecret);
                            return [4 /*yield*/, upbitService.getAccounts()];
                        case 4:
                            accounts = _b.sent();
                            results.push({
                                exchange: "upbit",
                                connected: true,
                                accounts: accounts.length,
                                message: "\uC5C5\uBE44\uD2B8 \uC5F0\uACB0 \uC131\uACF5 (".concat(accounts.length, "\uAC1C \uACC4\uC815)"),
                            });
                            return [3 /*break*/, 7];
                        case 5:
                            if (!(exchange.exchange === "binance")) return [3 /*break*/, 7];
                            binanceService = new BinanceService(exchange.apiKey, exchange.apiSecret);
                            return [4 /*yield*/, binanceService.getAccount()];
                        case 6:
                            accountInfo = _b.sent();
                            results.push({
                                exchange: "binance",
                                connected: true,
                                balances: ((_a = accountInfo.balances) === null || _a === void 0 ? void 0 : _a.length) || 0,
                                message: "\uBC14\uC774\uB0B8\uC2A4 \uC5F0\uACB0 \uC131\uACF5",
                            });
                            _b.label = 7;
                        case 7: return [3 /*break*/, 9];
                        case 8:
                            error_32 = _b.sent();
                            results.push({
                                exchange: exchange.exchange,
                                connected: false,
                                error: error_32.message,
                                message: "".concat(exchange.exchange, " \uC5F0\uACB0 \uC2E4\uD328: ").concat(error_32.message),
                            });
                            return [3 /*break*/, 9];
                        case 9:
                            _i++;
                            return [3 /*break*/, 2];
                        case 10:
                            res.json(results);
                            return [3 /*break*/, 12];
                        case 11:
                            error_33 = _b.sent();
                            console.error("거래소 연결 테스트 오류:", error_33);
                            res
                                .status(500)
                                .json({ error: "거래소 연결 테스트 중 오류가 발생했습니다" });
                            return [3 /*break*/, 12];
                        case 12: return [2 /*return*/];
                    }
                });
            }); });
            // 잔고 조회
            app.get("/api/balances/:userId", authenticateToken, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, exchanges, exchangeDebugInfo, balances, _i, exchanges_2, exchange, exchangeInfo, decryptedExchange, upbitService, accounts, krwAccount, decryptedExchange, binanceService, usdtBalance, error_34, error_35;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 13, , 14]);
                            userId = req.user.userId;
                            console.log("[".concat(new Date().toISOString(), "] Fetching balances for user ").concat(userId));
                            return [4 /*yield*/, storage.getExchangesByUserId(String(userId))];
                        case 1:
                            exchanges = _b.sent();
                            console.log("[".concat(new Date().toISOString(), "] Retrieved ").concat(exchanges.length, " exchanges for user ").concat(userId));
                            exchangeDebugInfo = exchanges.map(function (ex) { return ({
                                id: ex.id,
                                name: ex.exchange || "Unknown",
                                hasApiKey: !!ex.apiKey,
                                hasApiSecret: !!ex.apiSecret,
                                apiKeyStart: ex.apiKey ? ex.apiKey.substring(0, 8) + "..." : "none",
                            }); });
                            console.log("[".concat(new Date().toISOString(), "] Exchange details:"), exchangeDebugInfo);
                            balances = {
                                upbit: { krw: 0, connected: false },
                                binance: { usdt: 0, connected: false },
                            };
                            _i = 0, exchanges_2 = exchanges;
                            _b.label = 2;
                        case 2:
                            if (!(_i < exchanges_2.length)) return [3 /*break*/, 12];
                            exchange = exchanges_2[_i];
                            exchangeInfo = {
                                id: exchange.id,
                                name: exchange.exchange || "Unknown",
                                hasApiKey: !!exchange.apiKey,
                                hasApiSecret: !!exchange.apiSecret,
                                isActive: exchange.isActive,
                                apiKeyStart: exchange.apiKey
                                    ? exchange.apiKey.substring(0, 8) + "..."
                                    : "none",
                            };
                            console.log("[".concat(new Date().toISOString(), "] Processing exchange:"), exchangeInfo);
                            _b.label = 3;
                        case 3:
                            _b.trys.push([3, 10, , 11]);
                            if (!(exchange.exchange === "upbit")) return [3 /*break*/, 6];
                            console.log("[".concat(new Date().toISOString(), "] Trying to connect to Upbit with API key: ").concat(exchange.apiKey.substring(0, 8), "..."));
                            return [4 /*yield*/, storage.getDecryptedExchange(String(userId), 'upbit')];
                        case 4:
                            decryptedExchange = _b.sent();
                            if (!decryptedExchange) {
                                throw new Error('복호화된 API 키를 찾을 수 없습니다');
                            }
                            console.log("[".concat(new Date().toISOString(), "] \uBCF5\uD638\uD654\uB41C API \uD0A4 \uAE38\uC774: ").concat(decryptedExchange.apiKey.length, ", Secret \uAE38\uC774: ").concat(decryptedExchange.apiSecret.length));
                            upbitService = new UpbitService(decryptedExchange.apiKey, decryptedExchange.apiSecret);
                            console.log("[".concat(new Date().toISOString(), "] UpbitService \uC0DD\uC131 \uC644\uB8CC, getAccounts \uD638\uCD9C \uC2DC\uC791..."));
                            return [4 /*yield*/, upbitService.getAccounts()];
                        case 5:
                            accounts = _b.sent();
                            console.log("[".concat(new Date().toISOString(), "] getAccounts \uC131\uACF5, \uACC4\uC815 \uC218: ").concat(accounts.length));
                            krwAccount = accounts.find(function (account) { return account.currency === "KRW"; });
                            balances.upbit = {
                                krw: krwAccount ? parseFloat(krwAccount.balance) : 0,
                                connected: true,
                            };
                            return [3 /*break*/, 9];
                        case 6:
                            if (!(exchange.exchange === "binance")) return [3 /*break*/, 9];
                            console.log("[".concat(new Date().toISOString(), "] Trying to connect to Binance with session ID: ").concat(userId, "..."));
                            return [4 /*yield*/, storage.getDecryptedExchange(String(userId), 'binance')];
                        case 7:
                            decryptedExchange = _b.sent();
                            if (!decryptedExchange) {
                                throw new Error('복호화된 바이낸스 API 키를 찾을 수 없습니다');
                            }
                            console.log("[".concat(new Date().toISOString(), "] \uBCF5\uD638\uD654\uB41C \uBC14\uC774\uB0B8\uC2A4 API \uD0A4 \uAE38\uC774: ").concat(decryptedExchange.apiKey.length, ", Secret \uAE38\uC774: ").concat(decryptedExchange.apiSecret.length));
                            binanceService = new BinanceService(decryptedExchange.apiKey, decryptedExchange.apiSecret);
                            return [4 /*yield*/, binanceService.getUSDTBalance()];
                        case 8:
                            usdtBalance = _b.sent();
                            console.log("[".concat(new Date().toISOString(), "] Binance connection successful, USDT balance: ").concat(usdtBalance));
                            balances.binance = {
                                usdt: usdtBalance,
                                connected: true,
                            };
                            _b.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            error_34 = _b.sent();
                            console.error("[".concat(new Date().toISOString(), "] Error fetching ").concat(exchange.exchange || "unknown", " balance:"), error_34);
                            console.error("[".concat(new Date().toISOString(), "] Full error details:"), {
                                message: error_34.message,
                                stack: error_34.stack,
                                code: error_34.code,
                                detail: error_34.detail,
                                hint: error_34.hint,
                                fullError: error_34,
                            });
                            balances[exchange.exchange || "unknown"] = (_a = {},
                                _a[exchange.exchange === "upbit" ? "krw" : "usdt"] = 0,
                                _a.connected = false,
                                _a.error = error_34.message,
                                _a);
                            return [3 /*break*/, 11];
                        case 11:
                            _i++;
                            return [3 /*break*/, 2];
                        case 12:
                            res.json(balances);
                            return [3 /*break*/, 14];
                        case 13:
                            error_35 = _b.sent();
                            console.error("[".concat(new Date().toISOString(), "] \uC794\uACE0 \uC870\uD68C \uC624\uB958:"), error_35);
                            console.error("[".concat(new Date().toISOString(), "] \uC624\uB958 \uC0C1\uC138 \uC815\uBCF4:"), {
                                message: error_35.message,
                                stack: error_35.stack,
                                code: error_35.code,
                                detail: error_35.detail,
                                hint: error_35.hint,
                                fullError: error_35,
                            });
                            res.status(500).json({
                                error: "잔고 조회 중 오류가 발생했습니다",
                                details: error_35.message,
                            });
                            return [3 /*break*/, 14];
                        case 14: return [2 /*return*/];
                    }
                });
            }); });
            // 거래 전략 목록 조회
            app.get("/api/trading-strategies/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, strategies, error_36;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.params.userId;
                            return [4 /*yield*/, storage.getTradingStrategiesByUserId(userId)];
                        case 1:
                            strategies = _a.sent();
                            res.json(strategies);
                            return [3 /*break*/, 3];
                        case 2:
                            error_36 = _a.sent();
                            console.error("거래 전략 조회 오류:", error_36);
                            res.status(500).json({ error: "거래 전략 조회 중 오류가 발생했습니다" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 임시 디버깅: 테이블 구조 확인
            // 제거됨: Prisma 전환으로 pool 의존성 삭제
            // 거래 전략 생성/수정
            app.post("/api/trading-strategies/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, strategyData, strategy, error_37;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.params.userId;
                            strategyData = __assign(__assign({}, req.body), { userId: userId });
                            console.log("거래 전략 생성/수정 요청:", strategyData);
                            return [4 /*yield*/, storage.createOrUpdateTradingStrategy(strategyData)];
                        case 1:
                            strategy = _a.sent();
                            res.json({
                                message: "거래 전략이 저장되었습니다",
                                strategy: strategy,
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            error_37 = _a.sent();
                            console.error("거래 전략 생성/수정 오류:", error_37);
                            res.status(500).json({
                                error: "거래 전략 저장 중 오류가 발생했습니다",
                                details: error_37.message,
                            });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 거래 전략 삭제
            app.delete("/api/trading-strategies/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var strategyId, strategy, error_38;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            strategyId = parseInt(req.params.id);
                            return [4 /*yield*/, storage.deleteTradingStrategy(strategyId)];
                        case 1:
                            strategy = _a.sent();
                            if (!strategy) {
                                return [2 /*return*/, res.status(404).json({ error: "거래 전략을 찾을 수 없습니다" })];
                            }
                            res.json({ message: "거래 전략이 삭제되었습니다" });
                            return [3 /*break*/, 3];
                        case 2:
                            error_38 = _a.sent();
                            console.error("거래 전략 삭제 오류:", error_38);
                            res.status(500).json({ error: "거래 전략 삭제 중 오류가 발생했습니다" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // 관리자 전용: 모든 사용자 조회
            app.get("/api/admin/users", authenticateToken, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var currentUser, users, safeUsers, error_39;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, storage.getUser(req.user.userId)];
                        case 1:
                            currentUser = _a.sent();
                            if (!currentUser || currentUser.role !== "admin") {
                                return [2 /*return*/, res.status(403).json({ message: "관리자 권한이 필요합니다" })];
                            }
                            return [4 /*yield*/, storage.getAllUsers()];
                        case 2:
                            users = _a.sent();
                            safeUsers = users.map(function (user) { return ({
                                id: user.id,
                                username: user.username,
                                role: user.role,
                                createdAt: user.createdAt,
                                updatedAt: user.updatedAt,
                            }); });
                            res.json(safeUsers);
                            return [3 /*break*/, 4];
                        case 3:
                            error_39 = _a.sent();
                            console.error("사용자 목록 조회 오류:", error_39);
                            res
                                .status(500)
                                .json({ error: "사용자 목록 조회 중 오류가 발생했습니다" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // 관리자 전용: 사용자 권한 변경
            app.put("/api/admin/users/:userId/role", authenticateToken, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var currentUser, userId, role, user, error_40;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, storage.getUser(req.user.userId)];
                        case 1:
                            currentUser = _a.sent();
                            if (!currentUser || currentUser.role !== "admin") {
                                return [2 /*return*/, res.status(403).json({ message: "관리자 권한이 필요합니다" })];
                            }
                            userId = req.params.userId;
                            role = req.body.role;
                            if (!role || !["user", "admin"].includes(role)) {
                                return [2 /*return*/, res
                                        .status(400)
                                        .json({ message: "올바른 권한을 선택해주세요 (user 또는 admin)" })];
                            }
                            return [4 /*yield*/, storage.updateUserRole(userId, role)];
                        case 2:
                            user = _a.sent();
                            if (!user) {
                                return [2 /*return*/, res.status(404).json({ message: "사용자를 찾을 수 없습니다" })];
                            }
                            res.json({
                                message: "사용자 권한이 변경되었습니다",
                                user: {
                                    id: user.id,
                                    username: user.username,
                                    role: user.role,
                                },
                            });
                            return [3 /*break*/, 4];
                        case 3:
                            error_40 = _a.sent();
                            console.error("사용자 권한 변경 오류:", error_40);
                            res
                                .status(500)
                                .json({ error: "사용자 권한 변경 중 오류가 발생했습니다" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            wss = new WebSocketServer({ server: server, path: "/ws" });
            // 🚀 실시간 김치 프리미엄 데이터를 모든 클라이언트에게 전송
            realtimeKimchiService.onUpdate('websocket-broadcast', function (kimchiData) {
                if (kimchiData.length > 0) {
                    var message_1 = JSON.stringify({
                        type: "kimchi-premium",
                        data: kimchiData,
                        timestamp: new Date().toISOString(),
                    });
                    wss.clients.forEach(function (client) {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(message_1);
                        }
                    });
                    // 실시간 데이터 전송 로그 (필요시 활성화)
                    // console.log(`📤 WebSocket 김프율 데이터 전송: ${kimchiData.length}개 심볼`);
                }
            });
            wss.on("connection", function (ws, req) {
                console.log("WebSocket client connected");
                // 첫 클라이언트 연결 시 KimchiService의 지연 초기화를 트리거
                kimchiService.getLatestKimchiPremiums();
                // URL 쿼리에서 토큰 추출 시도
                var url = new URL(req.url || '', "http://".concat(req.headers.host));
                var token = url.searchParams.get('token');
                if (token) {
                    var userId = getUserIdFromToken("Bearer ".concat(token));
                    if (userId) {
                        // wsUserMap.set(ws, userId); // 이 부분은 더 이상 필요 없으므로 제거
                        console.log("WebSocket \uC0AC\uC6A9\uC790 \uC5F0\uACB0: User ID ".concat(userId));
                    }
                }
                ws.on("message", function (message) {
                    var messageStr = message.toString();
                    console.log("WebSocket message received:", messageStr);
                    // 인증 메시지 처리
                    try {
                        var msg = JSON.parse(messageStr);
                        if (msg.type === 'auth' && msg.token) {
                            var userId = getUserIdFromToken("Bearer ".concat(msg.token));
                            if (userId) {
                                // wsUserMap.set(ws, userId); // 이 부분은 더 이상 필요 없으므로 제거
                                console.log("WebSocket \uC0AC\uC6A9\uC790 \uC778\uC99D: User ID ".concat(userId));
                            }
                        }
                    }
                    catch (error) {
                        // JSON 파싱 실패시 무시
                    }
                });
                ws.on("close", function () {
                    // const userId = wsUserMap.get(ws); // 이 부분은 더 이상 필요 없으므로 제거
                    // if (userId) {
                    //   console.log(`WebSocket 사용자 연결 해제: User ID ${userId}`);
                    //   wsUserMap.delete(ws);
                    // } else {
                    console.log("WebSocket client disconnected");
                    // }
                });
            });
            // 💥💥💥 아래의 중복되고 오래된 실시간 데이터 처리 로직은 모두 제거합니다. 💥💥💥
            // 실시간 김프율 데이터 전송 (WebSocket 기반)
            // const sendKimchiData = async () => {
            //   try {
            //     const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
            //     const kimchiData = [];
            //     // 데이터 상태 확인
            //     console.log(`🔍 데이터 상태 확인 - 업비트: ${upbitPrices.size}개, 바이낸스: ${binancePrices.size}개`);
            //     // 활성 사용자 찾기 (바이낸스 API 키용)
            //     const activeUserId = await findActiveUserWithApiKeys();
            //     // 완전한 WebSocket 기반 (API 호출 없음)
            //     for (const symbol of symbols) {
            //       const upbitPrice = upbitPrices.get(symbol);
            //       const binancePrice = binancePrices.get(symbol);
            //       if (upbitPrice && binancePrice) {
            //         const exchangeRate = simpleKimchiService.getCurrentExchangeRate();
            //         const premiumRate = ((upbitPrice.price - (binancePrice.price * exchangeRate)) / (binancePrice.price * exchangeRate)) * 100;
            //         kimchiData.push({
            //           symbol,
            //           upbitPrice: upbitPrice.price,
            //           binancePrice: binancePrice.price * exchangeRate,
            //           binancePriceUSD: binancePrice.price,
            //           premiumRate: premiumRate,
            //           timestamp: new Date(),
            //           exchangeRate: exchangeRate,
            //           exchangeRateSource: "Google Finance (실시간 환율)",
            //         });
            //         console.log(`📊 ${symbol}: 업비트 ₩${upbitPrice.price.toLocaleString()}, 바이낸스 $${binancePrice.price.toLocaleString()}, 김프 ${premiumRate.toFixed(3)}%`);
            //       }
            //     }
            //     // 데이터가 있을 때만 전송
            //     if (kimchiData.length > 0) {
            //       const message = JSON.stringify({
            //         type: "kimchi-premium",
            //         data: kimchiData,
            //         timestamp: new Date().toISOString(),
            //       });
            //       // 연결된 모든 WebSocket 클라이언트에 데이터 전송
            //       wss.clients.forEach((client) => {
            //         if (client.readyState === WebSocket.OPEN) {
            //           client.send(message);
            //         }
            //       });
            //       console.log(`📤 WebSocket 김프율 데이터 전송: ${kimchiData.length}개 심볼`);
            //     }
            //   } catch (error) {
            //     console.error("김프율 데이터 전송 오류:", error);
            //   }
            // };
            // setInterval(sendKimchiData, 100); // 이 부분은 더 이상 필요 없으므로 제거
            // 거래소 연동 테스트 API (중요: 이 라우트는 /api/exchanges/:userId 보다 먼저 선언되어야 함)
            app.post("/api/test-exchange-connection", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, exchange, userId, decryptedExchange, apiKey, apiSecret, testResult, error_41;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            _a = req.body, exchange = _a.exchange, userId = _a.userId;
                            if (!exchange || !userId) {
                                return [2 /*return*/, res.status(400).json({
                                        error: '필수 정보가 누락되었습니다',
                                        details: '거래소와 사용자 ID를 입력해주세요'
                                    })];
                            }
                            console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] \uAC70\uB798\uC18C \uC5F0\uB3D9 \uD14C\uC2A4\uD2B8 \uC2DC\uC791:"), {
                                exchange: exchange,
                                userId: userId,
                                userIdType: typeof userId
                            });
                            return [4 /*yield*/, storage.getDecryptedExchange(userId.toString(), exchange)];
                        case 1:
                            decryptedExchange = _b.sent();
                            if (!decryptedExchange) {
                                console.log("\u274C [".concat(new Date().toISOString(), "] API \uD0A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC74C:"), {
                                    userId: userId,
                                    exchange: exchange
                                });
                                return [2 /*return*/, res.status(400).json({
                                        error: 'API 키를 찾을 수 없습니다',
                                        details: "".concat(exchange, " \uAC70\uB798\uC18C\uC758 API \uD0A4\uAC00 \uB4F1\uB85D\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4")
                                    })];
                            }
                            apiKey = decryptedExchange.apiKey, apiSecret = decryptedExchange.apiSecret;
                            console.log("\uD83D\uDD11 [".concat(new Date().toISOString(), "] API \uD0A4 \uC870\uD68C \uC131\uACF5:"), {
                                exchange: exchange,
                                apiKeyLength: apiKey.length,
                                apiSecretLength: apiSecret.length
                            });
                            return [4 /*yield*/, exchangeTestService.testExchangeConnection(exchange, apiKey, apiSecret)];
                        case 2:
                            testResult = _b.sent();
                            console.log("\u2705 [".concat(new Date().toISOString(), "] \uC5F0\uB3D9 \uD14C\uC2A4\uD2B8 \uC644\uB8CC:"), {
                                exchange: exchange,
                                success: testResult.success,
                                message: testResult.message
                            });
                            res.json(testResult);
                            return [3 /*break*/, 4];
                        case 3:
                            error_41 = _b.sent();
                            console.error("\uD83D\uDCA5 [".concat(new Date().toISOString(), "] \uC5F0\uB3D9 \uD14C\uC2A4\uD2B8 \uC911 \uC5D0\uB7EC:"), error_41);
                            res.status(500).json({
                                error: '연동 테스트 중 오류가 발생했습니다',
                                details: error_41.message
                            });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // 테스트 로그 엔드포인트
            app.post("/api/test-log", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, message, timestamp, userId;
                return __generator(this, function (_b) {
                    try {
                        _a = req.body, message = _a.message, timestamp = _a.timestamp, userId = _a.userId;
                        console.log("\uD83D\uDD0D [".concat(timestamp, "] \uD14C\uC2A4\uD2B8 \uB85C\uADF8 - \uC0AC\uC6A9\uC790: ").concat(userId));
                        console.log("\uD83D\uDCDD \uBA54\uC2DC\uC9C0: ".concat(message));
                        console.log("\uD83D\uDC64 \uC0AC\uC6A9\uC790 ID: ".concat(userId));
                        console.log("\u23F0 \uD0C0\uC784\uC2A4\uD0EC\uD504: ".concat(timestamp));
                        res.json({
                            success: true,
                            message: "로그가 서버에 기록되었습니다",
                            loggedAt: new Date().toISOString(),
                        });
                    }
                    catch (error) {
                        console.error("테스트 로그 기록 오류:", error);
                        res.status(500).json({ error: "로그 기록 중 오류가 발생했습니다" });
                    }
                    return [2 /*return*/];
                });
            }); });
            // CORS preflight 처리
            app.options("/api/auth/*", function (req, res) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                res.sendStatus(200);
            });
            return [2 /*return*/];
        });
    });
}
