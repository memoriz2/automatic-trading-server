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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { prisma } from "./db.js";
import { Prisma } from "./generated/prisma";
import { hashPassword, verifyPassword } from "./utils/auth.js";
import { encryptApiKey, decryptApiKey } from "./utils/encryption.js";
var DatabaseStorage = /** @class */ (function () {
    function DatabaseStorage() {
    }
    // Users
    DatabaseStorage.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.user.findUnique({ where: { id: parseInt(id) } })];
                    case 1:
                        user = _a.sent();
                        return [2 /*return*/, user !== null && user !== void 0 ? user : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserByUsername = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.user.findUnique({ where: { username: username } })];
                    case 1:
                        user = _a.sent();
                        return [2 /*return*/, user !== null && user !== void 0 ? user : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createUser = function (insertUser) {
        return __awaiter(this, void 0, void 0, function () {
            var hashedPassword, user;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        // 비밀번호 해시화
                        if (!insertUser.password) {
                            throw new Error("비밀번호가 필요합니다.");
                        }
                        return [4 /*yield*/, hashPassword(insertUser.password)];
                    case 1:
                        hashedPassword = _f.sent();
                        return [4 /*yield*/, prisma.user.create({
                                data: {
                                    username: insertUser.username,
                                    password: hashedPassword,
                                    role: (_a = insertUser.role) !== null && _a !== void 0 ? _a : "user",
                                    email: (_b = insertUser.email) !== null && _b !== void 0 ? _b : null,
                                    firstName: (_c = insertUser.firstName) !== null && _c !== void 0 ? _c : null,
                                    lastName: (_d = insertUser.lastName) !== null && _d !== void 0 ? _d : null,
                                    profileImageUrl: (_e = insertUser.profileImageUrl) !== null && _e !== void 0 ? _e : null,
                                },
                            })];
                    case 2:
                        user = _f.sent();
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.authenticateUser = function (username, password) {
        return __awaiter(this, void 0, void 0, function () {
            var user, isValidPassword;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserByUsername(username)];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, verifyPassword(password, user.password)];
                    case 2:
                        isValidPassword = _a.sent();
                        if (!isValidPassword)
                            return [2 /*return*/, null];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    // Exchanges
    DatabaseStorage.prototype.getExchangesByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.exchange.findMany({ where: { userId: parseInt(userId) } })];
            });
        });
    };
    DatabaseStorage.prototype.createExchange = function (insertExchange) {
        return __awaiter(this, void 0, void 0, function () {
            var encryptedApiKey, encryptedSecretKey, existingExchange, updatedExchange, verifyUpdated, totalAfterUpdateRes, insertData, newExchange, verifyInserted, totalAfterInsertRes, error_1;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 10, , 11]);
                        console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] DB \uC800\uC7A5 \uC2DC\uC791 - \uC0AC\uC6A9\uC790: ").concat(insertExchange.userId, ", \uAC70\uB798\uC18C: ").concat(insertExchange.exchange));
                        console.log("\uD83D\uDD11 [".concat(new Date().toISOString(), "] \uC785\uB825 \uB370\uC774\uD130:"), {
                            userId: insertExchange.userId,
                            exchange: insertExchange.exchange,
                            apiKeyLength: ((_a = insertExchange.apiKey) === null || _a === void 0 ? void 0 : _a.length) || 0,
                            apiSecretLength: ((_b = insertExchange.apiSecret) === null || _b === void 0 ? void 0 : _b.length) || 0,
                        });
                        encryptedApiKey = encryptApiKey(insertExchange.apiKey);
                        encryptedSecretKey = encryptApiKey(insertExchange.apiSecret);
                        console.log("\uD83D\uDD10 [".concat(new Date().toISOString(), "] \uC554\uD638\uD654 \uC644\uB8CC:"), {
                            encryptedApiKeyLength: encryptedApiKey.length,
                            encryptedSecretKeyLength: encryptedSecretKey.length,
                        });
                        // 기존 거래소 설정이 있는지 확인
                        console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] \uAE30\uC874 \uAC70\uB798\uC18C \uD655\uC778 \uC911..."));
                        return [4 /*yield*/, prisma.exchange.findFirst({
                                where: {
                                    userId: insertExchange.userId,
                                    exchange: insertExchange.exchange,
                                },
                            })];
                    case 1:
                        existingExchange = _e.sent();
                        console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] \uAE30\uC874 \uAC70\uB798\uC18C \uC870\uD68C \uACB0\uACFC:"), {
                            found: !!existingExchange,
                            existingId: existingExchange === null || existingExchange === void 0 ? void 0 : existingExchange.id,
                            existingUserId: existingExchange === null || existingExchange === void 0 ? void 0 : existingExchange.userId,
                            existingExchange: existingExchange === null || existingExchange === void 0 ? void 0 : existingExchange.exchange,
                        });
                        if (!existingExchange) return [3 /*break*/, 5];
                        // 기존 데이터가 있으면 업데이트
                        console.log("\uD83D\uDD04 [".concat(new Date().toISOString(), "] \uAE30\uC874 \uAC70\uB798\uC18C \uC5C5\uB370\uC774\uD2B8 \uC911... ID: ").concat(existingExchange.id));
                        return [4 /*yield*/, prisma.exchange.update({
                                where: { id: existingExchange.id },
                                data: {
                                    apiKey: encryptedApiKey,
                                    apiSecret: encryptedSecretKey,
                                    isActive: true,
                                },
                            })];
                    case 2:
                        updatedExchange = _e.sent();
                        console.log("\u2705 [".concat(new Date().toISOString(), "] \uC5C5\uB370\uC774\uD2B8 \uC644\uB8CC:"), {
                            id: updatedExchange.id,
                            userId: updatedExchange.userId,
                            exchange: updatedExchange.exchange,
                            isActive: updatedExchange.isActive,
                            updatedAt: updatedExchange.updatedAt,
                        });
                        return [4 /*yield*/, prisma.exchange.findMany({
                                where: {
                                    userId: insertExchange.userId,
                                    exchange: insertExchange.exchange,
                                },
                            })];
                    case 3:
                        verifyUpdated = _e.sent();
                        console.log("\uD83D\uDD0E [".concat(new Date().toISOString(), "] \uC5C5\uB370\uC774\uD2B8 \uC9C1\uD6C4 \uC7AC\uC870\uD68C \uACB0\uACFC:"), verifyUpdated);
                        return [4 /*yield*/, prisma.exchange.count({
                                where: { userId: insertExchange.userId },
                            })];
                    case 4:
                        totalAfterUpdateRes = _e.sent();
                        console.log("\uD83D\uDCCA [".concat(new Date().toISOString(), "] \uC0AC\uC6A9\uC790\uBCC4 exchanges \uCD1D\uAC74\uC218(\uC5C5\uB370\uC774\uD2B8 \uD6C4):"), totalAfterUpdateRes);
                        return [2 /*return*/, updatedExchange];
                    case 5:
                        // 새로운 데이터 삽입
                        console.log("\uD83C\uDD95 [".concat(new Date().toISOString(), "] \uC0C8\uB85C\uC6B4 \uAC70\uB798\uC18C \uC0BD\uC785 \uC911..."));
                        insertData = {
                            userId: insertExchange.userId,
                            exchange: insertExchange.exchange,
                            apiKey: encryptedApiKey,
                            apiSecret: encryptedSecretKey,
                            isActive: true,
                        };
                        console.log("\uD83D\uDCDD [".concat(new Date().toISOString(), "] \uC0BD\uC785\uD560 \uB370\uC774\uD130:"), {
                            userId: insertData.userId,
                            exchange: insertData.exchange,
                            apiKeyLength: insertData.apiKey.length,
                            apiSecretLength: insertData.apiSecret.length,
                            isActive: insertData.isActive,
                        });
                        return [4 /*yield*/, prisma.exchange.create({ data: insertData })];
                    case 6:
                        newExchange = _e.sent();
                        console.log("\u2705 [".concat(new Date().toISOString(), "] \uC0BD\uC785 \uC644\uB8CC:"), {
                            id: newExchange.id,
                            userId: newExchange.userId,
                            exchange: newExchange.exchange,
                            isActive: newExchange.isActive,
                            createdAt: newExchange.createdAt,
                        });
                        return [4 /*yield*/, prisma.exchange.findMany({
                                where: {
                                    userId: insertExchange.userId,
                                    exchange: insertExchange.exchange,
                                },
                            })];
                    case 7:
                        verifyInserted = _e.sent();
                        console.log("\uD83D\uDD0E [".concat(new Date().toISOString(), "] \uC0BD\uC785 \uC9C1\uD6C4 \uC7AC\uC870\uD68C \uACB0\uACFC:"), verifyInserted);
                        return [4 /*yield*/, prisma.exchange.count({
                                where: { userId: insertExchange.userId },
                            })];
                    case 8:
                        totalAfterInsertRes = _e.sent();
                        console.log("\uD83D\uDCCA [".concat(new Date().toISOString(), "] \uC0AC\uC6A9\uC790\uBCC4 exchanges \uCD1D\uAC74\uC218(\uC0BD\uC785 \uD6C4):"), totalAfterInsertRes);
                        return [2 /*return*/, newExchange];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_1 = _e.sent();
                        console.error("\uD83D\uDCA5 [".concat(new Date().toISOString(), "] DB \uC800\uC7A5 \uC911 \uC5D0\uB7EC \uBC1C\uC0DD:"), error_1);
                        console.error("\uD83D\uDD0D [".concat(new Date().toISOString(), "] \uC5D0\uB7EC \uC0C1\uC138 \uC815\uBCF4:"), {
                            message: error_1.message,
                            stack: error_1.stack,
                            code: error_1.code,
                            detail: error_1.detail,
                            hint: error_1.hint,
                            inputData: {
                                userId: insertExchange.userId,
                                exchange: insertExchange.exchange,
                                apiKeyLength: ((_c = insertExchange.apiKey) === null || _c === void 0 ? void 0 : _c.length) || 0,
                                apiSecretLength: ((_d = insertExchange.apiSecret) === null || _d === void 0 ? void 0 : _d.length) || 0,
                            },
                        });
                        throw error_1; // 에러를 다시 던져서 routes.ts에서 처리
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.createOrUpdateExchange = function (exchange) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createExchange(exchange)];
            });
        });
    };
    // 암호화된 API 키 복호화 메서드
    DatabaseStorage.prototype.getDecryptedExchange = function (userId, exchangeName) {
        return __awaiter(this, void 0, void 0, function () {
            var exchange;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.exchange.findFirst({
                            where: {
                                userId: parseInt(userId),
                                exchange: exchangeName,
                                isActive: true,
                            },
                        })];
                    case 1:
                        exchange = _a.sent();
                        if (!exchange)
                            return [2 /*return*/, null];
                        try {
                            return [2 /*return*/, {
                                    apiKey: decryptApiKey(exchange.apiKey),
                                    apiSecret: decryptApiKey(exchange.apiSecret),
                                }];
                        }
                        catch (error) {
                            console.error("API 키 복호화 실패:", error);
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateExchange = function (id, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var exchange;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.exchange.update({
                            where: { id: id },
                            data: updateData,
                        })];
                    case 1:
                        exchange = _a.sent();
                        return [2 /*return*/, exchange !== null && exchange !== void 0 ? exchange : undefined];
                }
            });
        });
    };
    // Cryptocurrencies
    DatabaseStorage.prototype.getAllCryptocurrencies = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.cryptocurrency.findMany()];
            });
        });
    };
    DatabaseStorage.prototype.createCryptocurrency = function (insertCrypto) {
        return __awaiter(this, void 0, void 0, function () {
            var crypto;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.cryptocurrency.create({ data: insertCrypto })];
                    case 1:
                        crypto = _a.sent();
                        return [2 /*return*/, crypto];
                }
            });
        });
    };
    // Kimchi Premiums
    DatabaseStorage.prototype.getLatestKimchiPremiums = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.kimchiPremium.findMany({
                        orderBy: { timestamp: "desc" },
                        take: 100,
                    })];
            });
        });
    };
    DatabaseStorage.prototype.getKimchiPremiumBySymbol = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var premium;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.kimchiPremium.findFirst({
                            where: { symbol: symbol },
                            orderBy: { timestamp: "desc" },
                        })];
                    case 1:
                        premium = _a.sent();
                        return [2 /*return*/, premium !== null && premium !== void 0 ? premium : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createKimchiPremium = function (insertPremium) {
        return __awaiter(this, void 0, void 0, function () {
            var premium;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prisma.kimchiPremium.create({
                            data: {
                                symbol: insertPremium.symbol,
                                upbitPrice: new Prisma.Decimal(insertPremium.upbitPrice),
                                binancePrice: new Prisma.Decimal(insertPremium.binancePrice),
                                premiumRate: new Prisma.Decimal(insertPremium.premiumRate),
                                exchangeRate: new Prisma.Decimal(insertPremium.exchangeRate),
                                premiumAmount: new Prisma.Decimal(insertPremium.premiumAmount),
                                timestamp: (_a = insertPremium.timestamp) !== null && _a !== void 0 ? _a : new Date(),
                            },
                        })];
                    case 1:
                        premium = _b.sent();
                        return [2 /*return*/, premium];
                }
            });
        });
    };
    DatabaseStorage.prototype.getKimchiPremiumHistory = function (symbol_1) {
        return __awaiter(this, arguments, void 0, function (symbol, limit) {
            if (limit === void 0) { limit = 100; }
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.kimchiPremium.findMany({
                        where: { symbol: symbol },
                        orderBy: { timestamp: "desc" },
                        take: limit,
                    })];
            });
        });
    };
    // Trading Settings
    DatabaseStorage.prototype.getTradingSettings = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var settings;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prisma.tradingSetting.findUnique({
                            where: { userId: parseInt(userId) },
                        })];
                    case 1:
                        settings = _b.sent();
                        return [2 /*return*/, (_a = settings) !== null && _a !== void 0 ? _a : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.saveTradingSettings = function (insertSettings) {
        return __awaiter(this, void 0, void 0, function () {
            var data, settings;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            return __generator(this, function (_p) {
                switch (_p.label) {
                    case 0:
                        data = {
                            userId: insertSettings.userId,
                            entryPremiumRate: new Prisma.Decimal(((_a = insertSettings.entryPremiumRate) !== null && _a !== void 0 ? _a : "2.5")),
                            exitPremiumRate: new Prisma.Decimal(((_b = insertSettings.exitPremiumRate) !== null && _b !== void 0 ? _b : "1.0")),
                            stopLossRate: new Prisma.Decimal(((_c = insertSettings.stopLossRate) !== null && _c !== void 0 ? _c : "-1.5")),
                            maxPositions: (_d = insertSettings.maxPositions) !== null && _d !== void 0 ? _d : 5,
                            isAutoTrading: (_e = insertSettings.isAutoTrading) !== null && _e !== void 0 ? _e : false,
                            maxInvestmentAmount: new Prisma.Decimal(((_f = insertSettings.maxInvestmentAmount) !== null && _f !== void 0 ? _f : "10000000")),
                            kimchiEntryRate: new Prisma.Decimal(((_g = insertSettings.kimchiEntryRate) !== null && _g !== void 0 ? _g : "1.1")),
                            kimchiExitRate: new Prisma.Decimal(((_h = insertSettings.kimchiExitRate) !== null && _h !== void 0 ? _h : "1.5")),
                            kimchiToleranceRate: new Prisma.Decimal(((_j = insertSettings.kimchiToleranceRate) !== null && _j !== void 0 ? _j : "0.1")),
                            binanceLeverage: (_k = insertSettings.binanceLeverage) !== null && _k !== void 0 ? _k : 3,
                            upbitEntryAmount: new Prisma.Decimal(((_l = insertSettings.upbitEntryAmount) !== null && _l !== void 0 ? _l : "10000000")),
                            dailyLossLimit: new Prisma.Decimal(((_m = insertSettings.dailyLossLimit) !== null && _m !== void 0 ? _m : "500000")),
                            maxPositionSize: new Prisma.Decimal(((_o = insertSettings.maxPositionSize) !== null && _o !== void 0 ? _o : "2000000")),
                        };
                        return [4 /*yield*/, prisma.tradingSetting.upsert({
                                where: { userId: insertSettings.userId },
                                create: data,
                                update: data,
                            })];
                    case 1:
                        settings = _p.sent();
                        return [2 /*return*/, settings];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTradingSettingsByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var settings;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prisma.tradingSetting.findUnique({
                            where: { userId: parseInt(userId) },
                        })];
                    case 1:
                        settings = _b.sent();
                        return [2 /*return*/, (_a = settings) !== null && _a !== void 0 ? _a : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createTradingSettings = function (insertSettings) {
        return __awaiter(this, void 0, void 0, function () {
            var settings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.saveTradingSettings(insertSettings)];
                    case 1:
                        settings = _a.sent();
                        return [2 /*return*/, settings];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateTradingSettings = function (userId, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var settings;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prisma.tradingSetting.update({
                            where: { userId: parseInt(userId) },
                            data: updateData,
                        })];
                    case 1:
                        settings = _b.sent();
                        return [2 /*return*/, (_a = settings) !== null && _a !== void 0 ? _a : undefined];
                }
            });
        });
    };
    // Positions
    DatabaseStorage.prototype.getActivePositions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.position.findMany({
                        where: { userId: parseInt(userId), status: "open" },
                        orderBy: { entryTime: "desc" },
                    })];
            });
        });
    };
    DatabaseStorage.prototype.getPositionById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var position;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.position.findUnique({ where: { id: id } })];
                    case 1:
                        position = _a.sent();
                        return [2 /*return*/, position !== null && position !== void 0 ? position : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createPosition = function (insertPosition) {
        return __awaiter(this, void 0, void 0, function () {
            var position;
            var _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0: return [4 /*yield*/, prisma.position.create({
                            data: {
                                userId: insertPosition.userId,
                                strategyId: (_a = insertPosition.strategyId) !== null && _a !== void 0 ? _a : null,
                                symbol: insertPosition.symbol,
                                type: (_b = insertPosition.type) !== null && _b !== void 0 ? _b : "kimchi_arbitrage",
                                entryPrice: new Prisma.Decimal(insertPosition.entryPrice),
                                currentPrice: insertPosition.currentPrice != null ? new Prisma.Decimal(insertPosition.currentPrice) : null,
                                quantity: new Prisma.Decimal(insertPosition.quantity),
                                entryPremiumRate: new Prisma.Decimal(insertPosition.entryPremiumRate),
                                currentPremiumRate: insertPosition.currentPremiumRate != null ? new Prisma.Decimal(insertPosition.currentPremiumRate) : null,
                                status: (_c = insertPosition.status) !== null && _c !== void 0 ? _c : "open",
                                entryTime: (_d = insertPosition.entryTime) !== null && _d !== void 0 ? _d : new Date(),
                                exitTime: (_e = insertPosition.exitTime) !== null && _e !== void 0 ? _e : null,
                                upbitOrderId: (_f = insertPosition.upbitOrderId) !== null && _f !== void 0 ? _f : null,
                                binanceOrderId: (_g = insertPosition.binanceOrderId) !== null && _g !== void 0 ? _g : null,
                                side: insertPosition.side,
                                exitPrice: insertPosition.exitPrice != null ? new Prisma.Decimal(insertPosition.exitPrice) : null,
                            },
                        })];
                    case 1:
                        position = _h.sent();
                        return [2 /*return*/, position];
                }
            });
        });
    };
    DatabaseStorage.prototype.updatePosition = function (id, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var position;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.position.update({
                            where: { id: id },
                            data: __assign(__assign({}, updateData), { updatedAt: new Date() }),
                        })];
                    case 1:
                        position = _a.sent();
                        return [2 /*return*/, position !== null && position !== void 0 ? position : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.closePosition = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var now, position;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        return [4 /*yield*/, prisma.position.update({
                                where: { id: id },
                                data: { status: "closed", exitTime: now, updatedAt: now },
                            })];
                    case 1:
                        position = _a.sent();
                        return [2 /*return*/, position !== null && position !== void 0 ? position : undefined];
                }
            });
        });
    };
    // Trades
    DatabaseStorage.prototype.getTradesByUserId = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, limit) {
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.trade.findMany({
                        where: { userId: parseInt(userId) },
                        orderBy: { executedAt: "desc" },
                        take: limit,
                    })];
            });
        });
    };
    DatabaseStorage.prototype.getTradesByPositionId = function (positionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.trade.findMany({
                        where: { positionId: positionId },
                        orderBy: { executedAt: "desc" },
                    })];
            });
        });
    };
    DatabaseStorage.prototype.createTrade = function (insertTrade) {
        return __awaiter(this, void 0, void 0, function () {
            var trade;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0: return [4 /*yield*/, prisma.trade.create({
                            data: {
                                userId: insertTrade.userId,
                                positionId: (_a = insertTrade.positionId) !== null && _a !== void 0 ? _a : null,
                                symbol: insertTrade.symbol,
                                side: insertTrade.side,
                                exchange: insertTrade.exchange,
                                quantity: new Prisma.Decimal(insertTrade.quantity),
                                price: new Prisma.Decimal(insertTrade.price),
                                fee: new Prisma.Decimal(((_b = insertTrade.fee) !== null && _b !== void 0 ? _b : "0")),
                                orderType: (_c = insertTrade.orderType) !== null && _c !== void 0 ? _c : "market",
                                exchangeOrderId: (_d = insertTrade.exchangeOrderId) !== null && _d !== void 0 ? _d : null,
                                exchangeTradeId: (_e = insertTrade.exchangeTradeId) !== null && _e !== void 0 ? _e : null,
                                executedAt: (_f = insertTrade.executedAt) !== null && _f !== void 0 ? _f : new Date(),
                            },
                        })];
                    case 1:
                        trade = _g.sent();
                        return [2 /*return*/, trade];
                }
            });
        });
    };
    // Trading Strategies
    DatabaseStorage.prototype.getTradingStrategies = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.tradingStrategy.findMany({
                        where: { userId: parseInt(userId) },
                        orderBy: { createdAt: "desc" },
                    })];
            });
        });
    };
    DatabaseStorage.prototype.getTradingStrategiesByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.tradingStrategy.findMany({
                        where: { userId: parseInt(userId) },
                        orderBy: { createdAt: "desc" },
                    })];
            });
        });
    };
    DatabaseStorage.prototype.createOrUpdateTradingStrategy = function (strategy) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, strategyName, existing, defaults, updated, created;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        userId = strategy.userId;
                        strategyName = strategy.name || "김치 프리미엄 전략";
                        return [4 /*yield*/, prisma.tradingStrategy.findFirst({
                                where: { userId: userId, name: strategyName },
                            })];
                    case 1:
                        existing = _o.sent();
                        defaults = {
                            strategyType: strategy.strategyType || "positive_kimchi",
                            entryRate: new Prisma.Decimal(((_a = strategy.entryRate) !== null && _a !== void 0 ? _a : "0.5")),
                            exitRate: new Prisma.Decimal(((_b = strategy.exitRate) !== null && _b !== void 0 ? _b : "0.1")),
                            toleranceRate: new Prisma.Decimal(((_c = strategy.toleranceRate) !== null && _c !== void 0 ? _c : "0.1")),
                            leverage: (_d = strategy.leverage) !== null && _d !== void 0 ? _d : 3,
                            investmentAmount: new Prisma.Decimal(((_e = strategy.investmentAmount) !== null && _e !== void 0 ? _e : "100000")),
                            isActive: (_f = strategy.isActive) !== null && _f !== void 0 ? _f : true,
                            symbol: (_g = strategy.symbol) !== null && _g !== void 0 ? _g : "BTC",
                            tolerance: new Prisma.Decimal(((_h = strategy.tolerance) !== null && _h !== void 0 ? _h : "0.1")),
                            isAutoTrading: (_j = strategy.isAutoTrading) !== null && _j !== void 0 ? _j : false,
                            totalTrades: (_k = strategy.totalTrades) !== null && _k !== void 0 ? _k : 0,
                            successfulTrades: (_l = strategy.successfulTrades) !== null && _l !== void 0 ? _l : 0,
                            totalProfit: new Prisma.Decimal(((_m = strategy.totalProfit) !== null && _m !== void 0 ? _m : "0")),
                            updatedAt: new Date(),
                        };
                        if (!existing) return [3 /*break*/, 3];
                        return [4 /*yield*/, prisma.tradingStrategy.update({
                                where: { id: existing.id },
                                data: __assign(__assign({}, defaults), { name: strategyName }),
                            })];
                    case 2:
                        updated = _o.sent();
                        return [2 /*return*/, updated];
                    case 3: return [4 /*yield*/, prisma.tradingStrategy.create({
                            data: __assign(__assign({ userId: userId, name: strategyName }, defaults), { createdAt: new Date() }),
                        })];
                    case 4:
                        created = _o.sent();
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTradingStrategy = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var strategy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.tradingStrategy.findUnique({ where: { id: id } })];
                    case 1:
                        strategy = _a.sent();
                        return [2 /*return*/, strategy !== null && strategy !== void 0 ? strategy : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createTradingStrategy = function (insertStrategy) {
        return __awaiter(this, void 0, void 0, function () {
            var strategy;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
            return __generator(this, function (_q) {
                switch (_q.label) {
                    case 0: return [4 /*yield*/, prisma.tradingStrategy.create({
                            data: {
                                userId: insertStrategy.userId,
                                name: (_a = insertStrategy.name) !== null && _a !== void 0 ? _a : "김치 프리미엄 전략",
                                entryRate: new Prisma.Decimal(((_b = insertStrategy.entryRate) !== null && _b !== void 0 ? _b : "0.5")),
                                exitRate: new Prisma.Decimal(((_c = insertStrategy.exitRate) !== null && _c !== void 0 ? _c : "0.1")),
                                leverage: (_d = insertStrategy.leverage) !== null && _d !== void 0 ? _d : 1,
                                investmentAmount: new Prisma.Decimal(((_e = insertStrategy.investmentAmount) !== null && _e !== void 0 ? _e : "100000")),
                                isActive: (_f = insertStrategy.isActive) !== null && _f !== void 0 ? _f : true,
                                symbol: (_g = insertStrategy.symbol) !== null && _g !== void 0 ? _g : "BTC",
                                tolerance: new Prisma.Decimal(((_h = insertStrategy.tolerance) !== null && _h !== void 0 ? _h : "0.1")),
                                isAutoTrading: (_j = insertStrategy.isAutoTrading) !== null && _j !== void 0 ? _j : false,
                                totalTrades: (_k = insertStrategy.totalTrades) !== null && _k !== void 0 ? _k : 0,
                                successfulTrades: (_l = insertStrategy.successfulTrades) !== null && _l !== void 0 ? _l : 0,
                                totalProfit: new Prisma.Decimal(((_m = insertStrategy.totalProfit) !== null && _m !== void 0 ? _m : "0")),
                                strategyType: (_o = insertStrategy.strategyType) !== null && _o !== void 0 ? _o : "positive_kimchi",
                                toleranceRate: new Prisma.Decimal(((_p = insertStrategy.toleranceRate) !== null && _p !== void 0 ? _p : "0.1")),
                            },
                        })];
                    case 1:
                        strategy = _q.sent();
                        return [2 /*return*/, strategy];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateTradingStrategy = function (id, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var strategy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.tradingStrategy.update({
                            where: { id: id },
                            data: __assign(__assign({}, updateData), { updatedAt: new Date() }),
                        })];
                    case 1:
                        strategy = _a.sent();
                        return [2 /*return*/, strategy !== null && strategy !== void 0 ? strategy : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteTradingStrategy = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var deleted, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.tradingStrategy.delete({ where: { id: id } })];
                    case 1:
                        deleted = _b.sent();
                        return [2 /*return*/, deleted];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // System Alerts
    DatabaseStorage.prototype.getSystemAlerts = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.systemAlert.findMany({
                        orderBy: { createdAt: "desc" },
                        take: limit,
                    })];
            });
        });
    };
    DatabaseStorage.prototype.createSystemAlert = function (insertAlert) {
        return __awaiter(this, void 0, void 0, function () {
            var alert;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, prisma.systemAlert.create({
                            data: {
                                type: insertAlert.type,
                                title: insertAlert.title,
                                message: insertAlert.message,
                                isRead: (_a = insertAlert.isRead) !== null && _a !== void 0 ? _a : false,
                                userId: (_b = insertAlert.userId) !== null && _b !== void 0 ? _b : null,
                                data: (_c = insertAlert.data) !== null && _c !== void 0 ? _c : null,
                                priority: (_d = insertAlert.priority) !== null && _d !== void 0 ? _d : "normal",
                            },
                        })];
                    case 1:
                        alert = _e.sent();
                        return [2 /*return*/, alert];
                }
            });
        });
    };
    DatabaseStorage.prototype.markAlertAsRead = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var alert;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.systemAlert.update({
                            where: { id: id },
                            data: { isRead: true },
                        })];
                    case 1:
                        alert = _a.sent();
                        return [2 /*return*/, alert !== null && alert !== void 0 ? alert : undefined];
                }
            });
        });
    };
    // Admin methods
    DatabaseStorage.prototype.updateUser = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, user;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!updates.password) return [3 /*break*/, 2];
                        _a = updates;
                        return [4 /*yield*/, hashPassword(updates.password)];
                    case 1:
                        _a.password = _b.sent();
                        _b.label = 2;
                    case 2: return [4 /*yield*/, prisma.user.update({
                            where: { id: parseInt(id) },
                            data: __assign(__assign({}, updates), { updatedAt: new Date() }),
                        })];
                    case 3:
                        user = _b.sent();
                        return [2 /*return*/, user !== null && user !== void 0 ? user : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUserRole = function (id, role) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.user.update({
                            where: { id: parseInt(id) },
                            data: { role: role, updatedAt: new Date() },
                        })];
                    case 1:
                        user = _a.sent();
                        return [2 /*return*/, user !== null && user !== void 0 ? user : undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.user.findMany()];
            });
        });
    };
    DatabaseStorage.prototype.deleteUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        userId = parseInt(id);
                        // 연관 데이터 정리
                        return [4 /*yield*/, prisma.exchange.deleteMany({ where: { userId: userId } })];
                    case 1:
                        // 연관 데이터 정리
                        _b.sent();
                        return [4 /*yield*/, prisma.tradingSetting.deleteMany({ where: { userId: userId } })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, prisma.position.deleteMany({ where: { userId: userId } })];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, prisma.trade.deleteMany({ where: { userId: userId } })];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, prisma.user.delete({ where: { id: userId } })];
                    case 6:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 7:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllUsersWithStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allUsers, usersWithStats;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.user.findMany()];
                    case 1:
                        allUsers = _a.sent();
                        return [4 /*yield*/, Promise.all(allUsers.map(function (user) { return __awaiter(_this, void 0, void 0, function () {
                                var tradesCount, positionsCount, exchangesCount, _a, password, userWithoutPassword;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, prisma.trade.count({ where: { userId: user.id } })];
                                        case 1:
                                            tradesCount = _b.sent();
                                            return [4 /*yield*/, prisma.position.count({ where: { userId: user.id } })];
                                        case 2:
                                            positionsCount = _b.sent();
                                            return [4 /*yield*/, prisma.exchange.count({ where: { userId: user.id } })];
                                        case 3:
                                            exchangesCount = _b.sent();
                                            _a = user, password = _a.password, userWithoutPassword = __rest(_a, ["password"]);
                                            return [2 /*return*/, __assign(__assign({}, userWithoutPassword), { _count: {
                                                        trades: tradesCount,
                                                        positions: positionsCount,
                                                        exchanges: exchangesCount,
                                                    } })];
                                    }
                                });
                            }); }))];
                    case 2:
                        usersWithStats = _a.sent();
                        return [2 /*return*/, usersWithStats];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAdminStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, totalUsers, activeUsers, totalTrades, activePositions;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            prisma.user.count(),
                            prisma.user.count({ where: { isActive: true } }),
                            prisma.trade.count(),
                            prisma.position.count({ where: { status: "open" } }),
                        ])];
                    case 1:
                        _a = _b.sent(), totalUsers = _a[0], activeUsers = _a[1], totalTrades = _a[2], activePositions = _a[3];
                        return [2 /*return*/, {
                                totalUsers: totalUsers,
                                activeUsers: activeUsers,
                                totalTrades: totalTrades,
                                activePositions: activePositions,
                                totalVolume: 0,
                            }];
                }
            });
        });
    };
    return DatabaseStorage;
}());
export { DatabaseStorage };
export var storage = new DatabaseStorage();
