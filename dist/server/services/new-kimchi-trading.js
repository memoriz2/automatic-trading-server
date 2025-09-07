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
import { UpbitService } from "./upbit.js";
import { BinanceService } from "./binance.js";
import { SimpleKimchiService } from "./simple-kimchi.js";
import { storage } from "../storage.js";
import { Prisma } from "../generated/prisma";
var MultiStrategyTradingService = /** @class */ (function () {
    function MultiStrategyTradingService() {
        this.isTrading = false;
        this.lastKimchiRates = new Map();
        this.activeStrategies = new Map();
        this.upbitService = new UpbitService();
        this.binanceService = new BinanceService();
        this.simpleKimchiService = new SimpleKimchiService();
    }
    MultiStrategyTradingService.prototype.startMultiStrategyTrading = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var strategies, activeStrategies;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isTrading) {
                            throw new Error("Multi-strategy trading is already running");
                        }
                        return [4 /*yield*/, storage.getTradingStrategies(userId)];
                    case 1:
                        strategies = _a.sent();
                        activeStrategies = strategies.filter(function (s) { return s.isActive; });
                        if (activeStrategies.length === 0) {
                            throw new Error("No active trading strategies found");
                        }
                        // 전략들을 맵에 저장
                        this.activeStrategies.clear();
                        activeStrategies.forEach(function (strategy) {
                            _this.activeStrategies.set(strategy.id, strategy);
                        });
                        this.isTrading = true;
                        return [4 /*yield*/, storage.createSystemAlert({
                                type: "info",
                                title: "다중 전략 자동매매 시작",
                                message: "".concat(activeStrategies.length, "\uAC1C \uC804\uB7B5\uC73C\uB85C \uAE40\uD504 \uCC28\uC775\uAC70\uB798\uAC00 \uC2DC\uC791\uB418\uC5C8\uC2B5\uB2C8\uB2E4."),
                            })];
                    case 2:
                        _a.sent();
                        // 백그라운드에서 트레이딩 루프 실행
                        this.multiStrategyTradingLoop(userId).catch(console.error);
                        return [2 /*return*/];
                }
            });
        });
    };
    MultiStrategyTradingService.prototype.stopMultiStrategyTrading = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.isTrading = false;
                        this.activeStrategies.clear();
                        return [4 /*yield*/, storage.createSystemAlert({
                                type: "info",
                                title: "다중 전략 자동매매 중지",
                                message: "모든 전략의 자동매매가 중지되었습니다.",
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MultiStrategyTradingService.prototype.multiStrategyTradingLoop = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var symbols, kimchiData, activePositions, _i, _a, _b, strategyId, strategy, btcData, hasActivePosition, signal, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.isTrading) return [3 /*break*/, 14];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 10, , 13]);
                        symbols = ["BTC"];
                        return [4 /*yield*/, this.simpleKimchiService.calculateSimpleKimchi(symbols, userId)];
                    case 2:
                        kimchiData = _c.sent();
                        return [4 /*yield*/, storage.getActivePositions(userId)];
                    case 3:
                        activePositions = _c.sent();
                        _i = 0, _a = Array.from(this.activeStrategies);
                        _c.label = 4;
                    case 4:
                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                        _b = _a[_i], strategyId = _b[0], strategy = _b[1];
                        btcData = kimchiData.find(function (d) { return d.symbol === "BTC"; });
                        if (!btcData)
                            return [3 /*break*/, 6];
                        // 현재 김프율 저장
                        this.lastKimchiRates.set("BTC", btcData.premiumRate);
                        hasActivePosition = activePositions.some(function (p) { return p.status === "open"; });
                        signal = this.analyzeStrategySignal(btcData, strategy, activePositions, hasActivePosition);
                        if (!signal) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.executeStrategySignal(userId, signal)];
                    case 5:
                        _c.sent();
                        // BTC 포지션 생성 후 루프 종료 (1개 포지션 제한)
                        if (signal.action === "entry")
                            return [3 /*break*/, 7];
                        _c.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: 
                    // 기존 포지션 관리
                    return [4 /*yield*/, this.manageMultiStrategyPositions(userId, activePositions)];
                    case 8:
                        // 기존 포지션 관리
                        _c.sent();
                        // 5초 대기
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                    case 9:
                        // 5초 대기
                        _c.sent();
                        return [3 /*break*/, 13];
                    case 10:
                        error_1 = _c.sent();
                        console.error("Multi-strategy trading loop error:", error_1);
                        return [4 /*yield*/, storage.createSystemAlert({
                                type: "error",
                                title: "다중 전략 자동매매 오류",
                                message: "\uC790\uB3D9\uB9E4\uB9E4 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)),
                            })];
                    case 11:
                        _c.sent();
                        // 오류 시 잠시 대기
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10000); })];
                    case 12:
                        // 오류 시 잠시 대기
                        _c.sent();
                        return [3 /*break*/, 13];
                    case 13: return [3 /*break*/, 0];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    // 전략 신호 실행
    MultiStrategyTradingService.prototype.executeStrategySignal = function (userId, signal) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 7]);
                        if (!(signal.action === "entry")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.executeStrategyEntry(userId, signal)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        if (!(signal.action === "exit")) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.executeStrategyExit(userId, signal)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        error_2 = _a.sent();
                        console.error("\uC804\uB7B5 \uC2E0\uD638 \uC2E4\uD589 \uC2E4\uD328 (".concat(signal.strategyName, "):"), error_2);
                        return [4 /*yield*/, storage.createSystemAlert({
                                type: "error",
                                title: "전략 실행 오류",
                                message: "".concat(signal.strategyName, " \uC2E4\uD589 \uC911 \uC624\uB958: ").concat(error_2 instanceof Error ? error_2.message : String(error_2)),
                            })];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // BTC 단순 자동매매 신호 분석 (양수/음수 김프 구분 없음)
    MultiStrategyTradingService.prototype.analyzeStrategySignal = function (kimchiData, strategy, activePositions, hasActivePosition) {
        if (hasActivePosition === void 0) { hasActivePosition = false; }
        var premiumRate = kimchiData.premiumRate;
        var symbol = "BTC"; // BTC 고정
        // BTC 활성 포지션 확인 (전략 상관없이 1개만 허용)
        var existingPosition = activePositions.find(function (p) { return p.symbol === "BTC" && p.status === "open"; });
        // 사용자 설정 값
        var entryRate = Number(strategy.entryRate);
        var exitRate = Number(strategy.exitRate);
        var tolerance = Number(strategy.toleranceRate);
        console.log("\uD83D\uDD0D BTC \uC790\uB3D9\uB9E4\uB9E4 \uCCB4\uD06C: \uD604\uC7AC\uAE40\uD504=".concat(premiumRate, "%, \uC9C4\uC785\uC728=").concat(entryRate, "%, \uCCAD\uC0B0\uC728=").concat(exitRate, "%, \uD5C8\uC6A9\uC624\uCC28=").concat(tolerance, "%"));
        // 진입 조건 체크 (포지션이 없을 때만)
        if (!hasActivePosition && !existingPosition) {
            // 🎯 정확한 값 매칭: 설정값과의 차이가 허용오차 이내인지 확인
            var entryDifference = Math.abs(premiumRate - entryRate);
            var sameSign = (entryRate >= 0 && premiumRate >= 0) ||
                (entryRate < 0 && premiumRate < 0);
            var shouldEnterBtc = entryDifference <= tolerance && sameSign;
            console.log("\uD83D\uDD0D \uC9C4\uC785 \uC870\uAC74 \uCCB4\uD06C: \uCC28\uC774=".concat(entryDifference.toFixed(4), "% (\uD5C8\uC6A9=").concat(tolerance, "%), \uB3D9\uC77C\uBD80\uD638=").concat(sameSign, " \u2192 ").concat(shouldEnterBtc));
            if (shouldEnterBtc) {
                console.log("\uD83C\uDFAF BTC \uC9C4\uC785 \uC2E0\uD638 \uBC1C\uC0DD! \uD604\uC7AC=".concat(premiumRate.toFixed(2), "%, \uC124\uC815=").concat(entryRate, "% (\u00B1").concat(tolerance, "%)"));
                return {
                    action: "entry",
                    symbol: "BTC",
                    premiumRate: premiumRate,
                    strategyId: strategy.id,
                    strategyName: strategy.name || "BTC 단순 차익거래",
                    confidence: 0.8,
                };
            }
            else {
                console.log("\u274C BTC \uC9C4\uC785 \uC870\uAC74 \uBBF8\uCDA9\uC871: \uCC28\uC774=".concat(entryDifference.toFixed(4), "% > \uD5C8\uC6A9\uC624\uCC28=").concat(tolerance, "%"));
            }
        }
        else {
            console.log("\u23F3 BTC \uC9C4\uC785 \uBD88\uAC00: \uC774\uBBF8 \uD65C\uC131 \uD3EC\uC9C0\uC158 \uC874\uC7AC");
        }
        // 청산 조건 체크 (포지션이 있을 때만)
        if (existingPosition) {
            // 🎯 정확한 값 매칭: 설정값과의 차이가 허용오차 이내인지 확인
            var exitDifference = Math.abs(premiumRate - exitRate);
            var exitSameSign = (exitRate >= 0 && premiumRate >= 0) ||
                (exitRate < 0 && premiumRate < 0);
            var shouldExit = exitDifference <= tolerance && exitSameSign;
            console.log("\uD83D\uDD0D \uCCAD\uC0B0 \uC870\uAC74 \uCCB4\uD06C: \uCC28\uC774=".concat(exitDifference.toFixed(4), "% (\uD5C8\uC6A9=").concat(tolerance, "%), \uB3D9\uC77C\uBD80\uD638=").concat(exitSameSign, " \u2192 ").concat(shouldExit));
            if (shouldExit) {
                console.log("\uD83D\uDCB0 BTC \uCCAD\uC0B0 \uC2E0\uD638 \uBC1C\uC0DD! \uD604\uC7AC=".concat(premiumRate.toFixed(2), "%, \uC124\uC815\uCCAD\uC0B0\uC728=").concat(exitRate, "% (\u00B1").concat(tolerance, "%) \u2192 \uD3EC\uC9C0\uC158 \uC804\uB7C9 \uCCAD\uC0B0"));
                return {
                    symbol: "BTC",
                    action: "exit",
                    premiumRate: premiumRate,
                    confidence: 0.8,
                    strategyId: strategy.id,
                    strategyName: strategy.name,
                };
            }
            else {
                console.log("\u274C BTC \uCCAD\uC0B0 \uC870\uAC74 \uBBF8\uCDA9\uC871: \uCC28\uC774=".concat(exitDifference.toFixed(4), "% > \uD5C8\uC6A9\uC624\uCC28=").concat(tolerance, "%"));
            }
        }
        return null;
    };
    // 전략 진입: 양수/음수 동일한 로직으로 매매
    MultiStrategyTradingService.prototype.executeStrategyEntry = function (userId, signal) {
        return __awaiter(this, void 0, void 0, function () {
            var symbol, strategy, upbitEntryAmount, binanceLeverage, isPositiveKimp, kimchDirection, entryRate, tolerance, lowerBound, upperBound, difference, conditionMet, sameSign, errorMsg, exchanges, error_3, exchanges, upbitExchange, binanceExchange, upbitResult, binanceResult, currentPrice, adjustedQuantity, kimchiData, estimatedQuantity, upbitService, binanceService, market, purchasedQuantity, error_4, kimchiData, estimatedQuantity, position, error_5;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        symbol = signal.symbol;
                        return [4 /*yield*/, storage.getTradingStrategy(signal.strategyId)];
                    case 1:
                        strategy = _c.sent();
                        if (!strategy) {
                            throw new Error("\uC804\uB7B5\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: ".concat(signal.strategyId));
                        }
                        upbitEntryAmount = Number(strategy.investmentAmount);
                        binanceLeverage = strategy.leverage;
                        isPositiveKimp = signal.premiumRate > 0;
                        kimchDirection = isPositiveKimp ? "양수김프" : "음수김프";
                        console.log("".concat(strategy.name, " \uC9C4\uC785 \uC2DC\uC791: ").concat(symbol, ", \uAE40\uD504\uC728: ").concat(signal.premiumRate, "%, \uD22C\uC790\uAE08\uC561: \u20A9").concat(upbitEntryAmount.toLocaleString(), ", \uB808\uBC84\uB9AC\uC9C0: ").concat(binanceLeverage, "x, \uAE40\uD504\uBC29\uD5A5: ").concat(kimchDirection));
                        entryRate = Number(strategy.entryRate);
                        tolerance = Number(strategy.toleranceRate);
                        console.log("\uD83D\uDD0D \uC9C4\uC785 \uC870\uAC74 2\uCC28 \uAC80\uC99D: \uD604\uC7AC\uAE40\uD504=".concat(signal.premiumRate, "%, \uC124\uC815\uC9C4\uC785\uC728=").concat(entryRate, "%, \uD5C8\uC6A9\uC624\uCC28=").concat(tolerance, "%"));
                        lowerBound = entryRate - tolerance;
                        upperBound = entryRate + tolerance;
                        difference = Math.abs(signal.premiumRate - entryRate);
                        conditionMet = difference <= tolerance;
                        sameSign = (entryRate >= 0 && signal.premiumRate >= 0) ||
                            (entryRate < 0 && signal.premiumRate < 0);
                        conditionMet = conditionMet && sameSign;
                        console.log("\uD83D\uDD0D 2\uCC28 \uC9C4\uC785 \uC870\uAC74 \uCCB4\uD06C: \uCC28\uC774=".concat(difference.toFixed(4), "% (\uD5C8\uC6A9=").concat(tolerance, "%), \uB3D9\uC77C\uBD80\uD638=").concat(sameSign, " \u2192 ").concat(conditionMet));
                        if (!!conditionMet) return [3 /*break*/, 3];
                        errorMsg = "\uD83D\uDEA8 \uC9C4\uC785 \uC870\uAC74 \uBBF8\uCDA9\uC871! \uD604\uC7AC\uAE40\uD504=".concat(signal.premiumRate, "%, \uC124\uC815\uC9C4\uC785\uC728=").concat(entryRate, "% - \uC870\uAC74 \uBD88\uB9CC\uC871");
                        console.log(errorMsg);
                        return [4 /*yield*/, storage.createSystemAlert({
                                type: "warning",
                                title: "자동매매 진입 조건 미충족",
                                message: errorMsg,
                            })];
                    case 2:
                        _c.sent();
                        throw new Error(errorMsg);
                    case 3:
                        _c.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, storage.getExchangesByUserId(userId)];
                    case 4:
                        exchanges = _c.sent();
                        console.log("\uD83D\uDD0D \uC794\uACE0 \uD655\uC778: \uD22C\uC790\uAE08\uC561 ".concat(upbitEntryAmount.toLocaleString(), "\uC6D0, \uC9C4\uC785\uC870\uAC74: ").concat(entryRate, "%"));
                        return [3 /*break*/, 6];
                    case 5:
                        error_3 = _c.sent();
                        console.log("\u26A0\uFE0F \uC794\uACE0 \uD655\uC778 \uC2E4\uD328: ".concat(error_3));
                        return [3 /*break*/, 6];
                    case 6:
                        _c.trys.push([6, 20, , 21]);
                        return [4 /*yield*/, storage.getExchangesByUserId(userId)];
                    case 7:
                        exchanges = _c.sent();
                        upbitExchange = exchanges.find(function (e) { return e.exchange === "upbit" && e.isActive; });
                        binanceExchange = exchanges.find(function (e) { return e.exchange === "binance" && e.isActive; });
                        upbitResult = void 0;
                        binanceResult = void 0;
                        currentPrice = void 0;
                        adjustedQuantity = void 0;
                        if (!(!upbitExchange || !binanceExchange)) return [3 /*break*/, 9];
                        console.log("\u26A0\uFE0F API \uD0A4 \uBBF8\uC124\uC815, \uB300\uCCB4 \uBAA8\uB4DC \uC2DC\uC791");
                        return [4 /*yield*/, this.simpleKimchiService.calculateSimpleKimchi([symbol], userId)];
                    case 8:
                        kimchiData = _c.sent();
                        currentPrice =
                            ((_a = kimchiData.find(function (d) { return d.symbol === symbol; })) === null || _a === void 0 ? void 0 : _a.upbitPrice) || 158000000;
                        estimatedQuantity = upbitEntryAmount / currentPrice;
                        adjustedQuantity = Math.floor(estimatedQuantity * 1000) / 1000;
                        console.log("\uD83D\uDCB0 \uB300\uCCB4 \uD3EC\uC9C0\uC158 \uC0DD\uC131: ".concat(upbitEntryAmount, "\uC6D0 \u00F7 ").concat(currentPrice, "\uC6D0 = ").concat(adjustedQuantity, " BTC"));
                        upbitResult = {
                            uuid: "nokey-upbit-".concat(Date.now()),
                            price: currentPrice,
                            volume: adjustedQuantity.toString(),
                            market: "KRW-".concat(symbol),
                        };
                        binanceResult = {
                            orderId: "nokey-binance-".concat(Date.now()),
                            symbol: symbol,
                            side: "SELL",
                            quantity: adjustedQuantity.toString(),
                            price: String(currentPrice),
                            executedQty: adjustedQuantity.toString(),
                            avgPrice: String(currentPrice),
                        };
                        return [3 /*break*/, 16];
                    case 9:
                        upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
                        binanceService = new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
                        market = "KRW-".concat(symbol);
                        console.log("".concat(kimchDirection, " \uC9C4\uC785: \uC5C5\uBE44\uD2B8 ").concat(market, " \uB9E4\uC218 \u20A9").concat(upbitEntryAmount, ", \uBC14\uC774\uB0B8\uC2A4 \uC20F \uD3EC\uC9C0\uC158"));
                        _c.label = 10;
                    case 10:
                        _c.trys.push([10, 14, , 16]);
                        // 단순 차익거래 실행: 업비트 매수 + 바이낸스 숏
                        console.log("\uD83D\uDD35 \uB2E8\uC21C \uCC28\uC775\uAC70\uB798 \uC2E4\uD589: \uC5C5\uBE44\uD2B8 \uB9E4\uC218 + \uBC14\uC774\uB0B8\uC2A4 \uC20F");
                        console.log("\uD83D\uDCCA \uD604\uC7AC \uAE40\uD504\uC728: ".concat(signal.premiumRate, "%, \uC9C4\uC785\uC124\uC815: ").concat(entryRate, "%"));
                        return [4 /*yield*/, upbitService.placeBuyOrder(market, upbitEntryAmount, "price")];
                    case 11:
                        upbitResult = _c.sent();
                        console.log("\uC5C5\uBE44\uD2B8 \uB9E4\uC218 \uACB0\uACFC:", upbitResult);
                        purchasedQuantity = parseFloat(upbitResult.volume || "0");
                        if (purchasedQuantity < 0.001) {
                            throw new Error("\uAD6C\uB9E4 \uC218\uB7C9\uC774 \uCD5C\uC18C \uAE30\uC900(0.001)\uC5D0 \uBBF8\uB2EC: ".concat(purchasedQuantity));
                        }
                        adjustedQuantity = Math.floor(purchasedQuantity * 1000) / 1000;
                        currentPrice = parseFloat(upbitResult.price || "0");
                        // 바이낸스 선물에서 동일 수량으로 숏 포지션
                        console.log("\uBC14\uC774\uB0B8\uC2A4 \uC120\uBB3C \uC20F: ".concat(symbol, ", \uC218\uB7C9: ").concat(adjustedQuantity, ", \uB808\uBC84\uB9AC\uC9C0: ").concat(strategy.leverage || 3, "x"));
                        return [4 /*yield*/, binanceService.setLeverage(symbol, strategy.leverage || 3)];
                    case 12:
                        _c.sent();
                        return [4 /*yield*/, binanceService.placeFuturesShortOrder(symbol, adjustedQuantity)];
                    case 13:
                        binanceResult = _c.sent();
                        console.log("\uBC14\uC774\uB0B8\uC2A4 \uC20F \uACB0\uACFC:", binanceResult);
                        return [3 /*break*/, 16];
                    case 14:
                        error_4 = _c.sent();
                        console.log("\u26A0\uFE0F \uC2E4\uC81C \uAC70\uB798 \uC2E4\uD328, \uB300\uCCB4 \uBAA8\uB4DC \uC2DC\uC791: ".concat(error_4.message));
                        return [4 /*yield*/, this.simpleKimchiService.calculateSimpleKimchi([symbol], userId)];
                    case 15:
                        kimchiData = _c.sent();
                        currentPrice =
                            ((_b = kimchiData.find(function (d) { return d.symbol === symbol; })) === null || _b === void 0 ? void 0 : _b.upbitPrice) ||
                                158000000;
                        estimatedQuantity = upbitEntryAmount / currentPrice;
                        adjustedQuantity = Math.floor(estimatedQuantity * 1000) / 1000;
                        console.log("\uD83D\uDCB0 \uB300\uCCB4 \uD3EC\uC9C0\uC158 \uC0DD\uC131: ".concat(upbitEntryAmount, "\uC6D0 \u00F7 ").concat(currentPrice, "\uC6D0 = ").concat(adjustedQuantity, " BTC"));
                        upbitResult = {
                            uuid: "fallback-upbit-".concat(Date.now()),
                            price: currentPrice,
                            volume: adjustedQuantity.toString(),
                            market: market,
                        };
                        binanceResult = {
                            orderId: "fallback-binance-".concat(Date.now()),
                            symbol: symbol,
                            side: "SELL",
                            quantity: adjustedQuantity.toString(),
                            price: String(currentPrice),
                            executedQty: adjustedQuantity.toString(),
                            avgPrice: String(currentPrice),
                        };
                        return [3 /*break*/, 16];
                    case 16:
                        console.log("\uD83D\uDCCA \uCD5C\uC885 \uAC70\uB798 \uACB0\uACFC:");
                        console.log("\uC5C5\uBE44\uD2B8:", upbitResult);
                        console.log("\uBC14\uC774\uB0B8\uC2A4:", binanceResult);
                        return [4 /*yield*/, storage.createPosition({
                                userId: parseInt(userId),
                                symbol: symbol,
                                type: "HEDGE",
                                side: "sell", // Binance 선물 숏(헤지) 기준. 필요 시 로직과 맞게 조정
                                status: "open",
                                entryPrice: String(currentPrice),
                                quantity: String(adjustedQuantity),
                                entryPremiumRate: String(signal.premiumRate),
                                upbitOrderId: upbitResult.uuid,
                                binanceOrderId: binanceResult.orderId,
                                strategyId: strategy.id,
                            })];
                    case 17:
                        position = _c.sent();
                        console.log("\u2705 \uD3EC\uC9C0\uC158 \uC0DD\uC131 \uC644\uB8CC:", position);
                        // 거래 기록 생성
                        return [4 /*yield*/, Promise.all([
                                storage.createTrade({
                                    userId: parseInt(userId),
                                    positionId: position.id,
                                    symbol: symbol,
                                    side: "buy",
                                    exchange: "upbit",
                                    quantity: String(adjustedQuantity),
                                    price: String(currentPrice),
                                    exchangeOrderId: upbitResult.uuid,
                                }),
                                storage.createTrade({
                                    userId: parseInt(userId),
                                    positionId: position.id,
                                    symbol: symbol,
                                    side: "sell",
                                    exchange: "binance",
                                    quantity: String(adjustedQuantity),
                                    price: String(currentPrice),
                                    exchangeOrderId: binanceResult.orderId,
                                }),
                            ])];
                    case 18:
                        // 거래 기록 생성
                        _c.sent();
                        // 성공 알림
                        return [4 /*yield*/, storage.createSystemAlert({
                                type: "success",
                                title: "".concat(strategy.name, " \uD3EC\uC9C0\uC158 \uC9C4\uC785"),
                                message: "".concat(symbol, " ").concat(strategy.name, " \uC804\uB7B5 \uC9C4\uC785 \uC644\uB8CC. \uAE40\uD504\uC728: ").concat(signal.premiumRate, "%, \uC218\uB7C9: ").concat(adjustedQuantity),
                            })];
                    case 19:
                        // 성공 알림
                        _c.sent();
                        console.log("\uD83C\uDF89 ".concat(symbol, " \uD3EC\uC9C0\uC158 \uC9C4\uC785 \uC644\uB8CC!"));
                        return [3 /*break*/, 21];
                    case 20:
                        error_5 = _c.sent();
                        console.error("\uC0C8\uB85C\uC6B4 \uAE40\uD504 \uC9C4\uC785 \uC2E4\uD328 (".concat(symbol, "):"), error_5);
                        throw error_5;
                    case 21: return [2 /*return*/];
                }
            });
        });
    };
    // 전략 청산: 업비트 매도 + 바이낸스 포지션 청산
    MultiStrategyTradingService.prototype.executeStrategyExit = function (userId, signal) {
        return __awaiter(this, void 0, void 0, function () {
            var positions, position, exchanges, upbitExchange, binanceExchange, upbitService, binanceService, quantity, market, upbitResult, binanceResult, strategy, strategyName, error_6;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, storage.getActivePositions(userId)];
                    case 1:
                        positions = _b.sent();
                        position = positions.find(function (p) { return p.symbol === signal.symbol && p.strategyId === signal.strategyId; });
                        if (!position) {
                            console.log("\uCCAD\uC0B0\uD560 ".concat(signal.symbol, " (\uC804\uB7B5 ").concat(signal.strategyId, ") \uD3EC\uC9C0\uC158\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."));
                            return [2 /*return*/];
                        }
                        console.log("".concat(signal.strategyName, " \uCCAD\uC0B0 \uC2DC\uC791: ").concat(signal.symbol, ", \uAE40\uD504\uC728: ").concat(signal.premiumRate, "%"));
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 10, , 11]);
                        return [4 /*yield*/, storage.getExchangesByUserId(userId)];
                    case 3:
                        exchanges = _b.sent();
                        upbitExchange = exchanges.find(function (e) { return e.exchange === "upbit" && e.isActive; });
                        binanceExchange = exchanges.find(function (e) { return e.exchange === "binance" && e.isActive; });
                        if (!upbitExchange || !binanceExchange) {
                            throw new Error("API 키가 설정되지 않았습니다.");
                        }
                        upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
                        binanceService = new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
                        quantity = Number(position.quantity);
                        market = "KRW-".concat(signal.symbol);
                        console.log("\uC5C5\uBE44\uD2B8 \uD604\uBB3C \uB9E4\uB3C4: ".concat(market, ", \uC218\uB7C9: ").concat(quantity));
                        return [4 /*yield*/, upbitService.placeSellOrder(market, quantity)];
                    case 4:
                        upbitResult = _b.sent();
                        console.log("\uC5C5\uBE44\uD2B8 \uB9E4\uB3C4 \uACB0\uACFC:", upbitResult);
                        // 2. 바이낸스 선물 포지션 청산
                        console.log("\uBC14\uC774\uB0B8\uC2A4 \uC120\uBB3C \uCCAD\uC0B0: ".concat(signal.symbol, ", \uC218\uB7C9: ").concat(quantity));
                        return [4 /*yield*/, binanceService.closeFuturesPosition(signal.symbol, quantity)];
                    case 5:
                        binanceResult = _b.sent();
                        console.log("\uBC14\uC774\uB0B8\uC2A4 \uCCAD\uC0B0 \uACB0\uACFC:", binanceResult);
                        // 3. 포지션 상태 업데이트
                        return [4 /*yield*/, storage.updatePosition(position.id, {
                                currentPremiumRate: new Prisma.Decimal(signal.premiumRate),
                            })];
                    case 6:
                        // 3. 포지션 상태 업데이트
                        _b.sent();
                        // 4. 거래 기록 생성
                        return [4 /*yield*/, Promise.all([
                                storage.createTrade({
                                    userId: parseInt(userId),
                                    positionId: position.id,
                                    symbol: signal.symbol,
                                    side: "sell",
                                    exchange: "upbit",
                                    quantity: String(upbitResult.volume || "0"),
                                    price: String(upbitResult.price || "0"),
                                    exchangeOrderId: upbitResult.uuid,
                                }),
                                storage.createTrade({
                                    userId: parseInt(userId),
                                    positionId: position.id,
                                    symbol: signal.symbol,
                                    side: "buy",
                                    exchange: "binance",
                                    quantity: String(binanceResult.executedQty || binanceResult.quantity),
                                    price: String(binanceResult.avgPrice || binanceResult.price),
                                    exchangeOrderId: (_a = binanceResult.orderId) === null || _a === void 0 ? void 0 : _a.toString(),
                                }),
                            ])];
                    case 7:
                        // 4. 거래 기록 생성
                        _b.sent();
                        return [4 /*yield*/, storage.getTradingStrategy(signal.strategyId)];
                    case 8:
                        strategy = _b.sent();
                        strategyName = (strategy === null || strategy === void 0 ? void 0 : strategy.name) || "전략";
                        // 5. 성공 알림
                        return [4 /*yield*/, storage.createSystemAlert({
                                type: "success",
                                title: "".concat(strategyName, " \uD3EC\uC9C0\uC158 \uCCAD\uC0B0"),
                                message: "".concat(signal.symbol, " ").concat(strategyName, " \uCCAD\uC0B0 \uC644\uB8CC. \uAE40\uD504\uC728: ").concat(signal.premiumRate, "%"),
                            })];
                    case 9:
                        // 5. 성공 알림
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        error_6 = _b.sent();
                        console.error("\uC0C8\uB85C\uC6B4 \uAE40\uD504 \uCCAD\uC0B0 \uC2E4\uD328 (".concat(signal.symbol, "):"), error_6);
                        throw error_6;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    // 새로운 김프 손절
    MultiStrategyTradingService.prototype.executeNewKimchiStopLoss = function (userId, signal) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uC0C8\uB85C\uC6B4 \uAE40\uD504 \uC190\uC808 \uC2E4\uD589: ".concat(signal.symbol));
                        // 청산과 동일한 로직 사용
                        return [4 /*yield*/, this.executeStrategyExit(userId, signal)];
                    case 1:
                        // 청산과 동일한 로직 사용
                        _a.sent();
                        return [4 /*yield*/, storage.createSystemAlert({
                                type: "warning",
                                title: "새로운 김프 손절 실행",
                                message: "".concat(signal.symbol, " \uAE40\uD504 \uD3EC\uC9C0\uC158\uC744 \uC190\uC808\uD588\uC2B5\uB2C8\uB2E4."),
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // 다중 전략 포지션 관리
    MultiStrategyTradingService.prototype.manageMultiStrategyPositions = function (userId, positions) {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1, _i, positions_1, position;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _loop_1 = function (position) {
                            var kimchiData, currentData, entryPremium, currentPremium, entryPrice, isValidEntry, profitRate, error_7;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0:
                                        if (position.status !== "ACTIVE")
                                            return [2 /*return*/, "continue"];
                                        _f.label = 1;
                                    case 1:
                                        _f.trys.push([1, 7, , 8]);
                                        return [4 /*yield*/, this_1.simpleKimchiService.calculateSimpleKimchi([position.symbol])];
                                    case 2:
                                        kimchiData = _f.sent();
                                        currentData = kimchiData.find(function (d) { return d.symbol === position.symbol; });
                                        if (!currentData)
                                            return [2 /*return*/, "continue"];
                                        entryPremium = Number(position.entryPremiumRate || 0);
                                        currentPremium = currentData.premiumRate;
                                        entryPrice = Number(position.entryPrice || 0);
                                        isValidEntry = entryPrice > 100000;
                                        if (!isValidEntry) return [3 /*break*/, 4];
                                        profitRate = currentPremium - entryPremium;
                                        // 포지션 업데이트
                                        return [4 /*yield*/, storage.updatePosition(position.id, {
                                                currentPrice: new Prisma.Decimal((_a = currentData.upbitPrice) !== null && _a !== void 0 ? _a : Number((_b = position.currentPrice) !== null && _b !== void 0 ? _b : 0)),
                                                currentPremiumRate: new Prisma.Decimal(currentPremium),
                                            })];
                                    case 3:
                                        // 포지션 업데이트
                                        _f.sent();
                                        return [3 /*break*/, 6];
                                    case 4: 
                                    // 비정상 진입 포지션은 현재 김프율만 업데이트
                                    return [4 /*yield*/, storage.updatePosition(position.id, {
                                            currentPrice: new Prisma.Decimal((_c = currentData.upbitPrice) !== null && _c !== void 0 ? _c : Number((_d = position.currentPrice) !== null && _d !== void 0 ? _d : 0)),
                                            currentPremiumRate: new Prisma.Decimal(currentPremium),
                                        })];
                                    case 5:
                                        // 비정상 진입 포지션은 현재 김프율만 업데이트
                                        _f.sent();
                                        _f.label = 6;
                                    case 6: return [3 /*break*/, 8];
                                    case 7:
                                        error_7 = _f.sent();
                                        console.error("\uD3EC\uC9C0\uC158 \uAD00\uB9AC \uC624\uB958 (".concat(position.symbol, "):"), error_7);
                                        return [3 /*break*/, 8];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, positions_1 = positions;
                        _e.label = 1;
                    case 1:
                        if (!(_i < positions_1.length)) return [3 /*break*/, 4];
                        position = positions_1[_i];
                        return [5 /*yield**/, _loop_1(position)];
                    case 2:
                        _e.sent();
                        _e.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MultiStrategyTradingService.prototype.getIsTrading = function () {
        return this.isTrading;
    };
    return MultiStrategyTradingService;
}());
export { MultiStrategyTradingService };
export var multiStrategyTradingService = new MultiStrategyTradingService();
