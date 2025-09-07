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
var GoogleFinanceExchangeService = /** @class */ (function () {
    function GoogleFinanceExchangeService() {
        this.currentRate = 1382.67; // 최신 알려진 환율
        this.isUpdating = false;
        this.updateInterval = null;
        // 즉시 환율 업데이트 시작
        this.updateRate();
        // 3초마다 환율 업데이트
        this.startAutoUpdate();
    }
    GoogleFinanceExchangeService.prototype.startAutoUpdate = function () {
        var _this = this;
        this.updateInterval = setInterval(function () {
            _this.updateRate();
        }, 3000); // 3초마다 업데이트
    };
    GoogleFinanceExchangeService.prototype.stopAutoUpdate = function () {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    };
    GoogleFinanceExchangeService.prototype.updateRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, html, rateMatch, rateString, rate, oldRate, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isUpdating)
                            return [2 /*return*/];
                        this.isUpdating = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('https://www.google.com/finance/quote/USD-KRW', {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                                },
                                signal: AbortSignal.timeout(10000), // 10초 타임아웃
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Google Finance HTTP ".concat(response.status));
                        }
                        return [4 /*yield*/, response.text()];
                    case 3:
                        html = _a.sent();
                        rateMatch = html.match(/data-last-price="([0-9,]+\.?[0-9]*)"/) ||
                            html.match(/([0-9,]+\.[0-9]+)/);
                        if (rateMatch) {
                            rateString = rateMatch[1] || rateMatch[0];
                            rate = parseFloat(rateString.replace(/,/g, ''));
                            if (rate && rate > 1000 && rate < 2000) {
                                oldRate = this.currentRate;
                                this.currentRate = rate;
                                if (Math.abs(oldRate - rate) > 0.1) {
                                    // console.log(`🌐 구글 파이낸스 USD/KRW 환율 업데이트: ${oldRate}원 → ${rate}원`);
                                }
                                else {
                                    // console.log(`🌐 구글 파이낸스 환율 확인: ${rate}원`);
                                }
                            }
                            else {
                                throw new Error("Invalid rate value: ".concat(rate));
                            }
                        }
                        else {
                            throw new Error('Rate not found in response');
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        error_1 = _a.sent();
                        console.error('구글 파이낸스 환율 조회 실패:', error_1);
                        return [3 /*break*/, 6];
                    case 5:
                        this.isUpdating = false;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    GoogleFinanceExchangeService.prototype.getCurrentRate = function () {
        return this.currentRate;
    };
    GoogleFinanceExchangeService.prototype.getRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // 현재 환율 반환, 필요시 즉시 업데이트
                if (!this.isUpdating) {
                    this.updateRate(); // 백그라운드에서 업데이트
                }
                return [2 /*return*/, this.currentRate];
            });
        });
    };
    return GoogleFinanceExchangeService;
}());
export { GoogleFinanceExchangeService };
// 싱글톤 인스턴스
export var googleFinanceExchange = new GoogleFinanceExchangeService();
