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
        this.googleRate = null; // 구글 파이낸스 환율
        this.lastCalculatedRate = null; // 이전 계산된 환율
        this.isUpdating = false;
        this.updateInterval = null;
        // 즉시 환율 업데이트 시작
        this.updateRate();
        // 3초마다 환율 업데이트
        this.startAutoUpdate();
    }
    GoogleFinanceExchangeService.prototype.startAutoUpdate = function () {
        var _this = this;
        // console.log('🔄 구글 파이낸스 환율 자동 업데이트 시작 (3초 간격)');
        this.updateInterval = setInterval(function () {
            // console.log('⏰ 구글 파이낸스 환율 업데이트 시도 중...');
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
            var controller_1, timeoutId, response, html, rateMatch, rateString, rate, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isUpdating)
                            return [2 /*return*/];
                        this.isUpdating = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        controller_1 = new AbortController();
                        timeoutId = setTimeout(function () { return controller_1.abort(); }, 5000);
                        return [4 /*yield*/, fetch('https://www.google.com/finance/quote/USD-KRW', {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                    'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
                                },
                                signal: controller_1.signal
                            })];
                    case 2:
                        response = _a.sent();
                        clearTimeout(timeoutId);
                        if (!response.ok) {
                            throw new Error("HTTP ".concat(response.status));
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
                                this.googleRate = rate;
                                // console.log(`✅ 구글 파이낸스 환율: ${rate}원`);
                            }
                            else {
                                console.warn("\u274C \uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uBE44\uC815\uC0C1 \uD658\uC728 \uAC12: ".concat(rate));
                            }
                        }
                        else {
                            // console.log(`❌ 구글 파이낸스 환율 파싱 실패`);
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        error_1 = _a.sent();
                        console.error('환율 조회 실패:', error_1);
                        console.log("\u26A0\uFE0F \uD658\uC728 \uC870\uD68C \uC2E4\uD328 - \uAE30\uBCF8\uAC12 \uC0AC\uC6A9");
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
        // 구글 파이낸스 환율 사용
        if (this.googleRate) {
            // 환율 변경 감지 및 로그
            if (this.lastCalculatedRate === null) {
                var timestamp = new Date().toLocaleTimeString();
                // console.log(`💰 [${timestamp}] 초기 환율: ${this.googleRate.toFixed(2)}원 (구글 파이낸스)`);
                this.lastCalculatedRate = this.googleRate;
            }
            else if (Math.abs(this.googleRate - this.lastCalculatedRate) > 0.001) {
                var timestamp = new Date().toLocaleTimeString();
                var change = this.googleRate - this.lastCalculatedRate;
                var changeSymbol = change > 0 ? '📈' : '📉';
                // console.log(`${changeSymbol} [${timestamp}] 환율 변경: ${this.lastCalculatedRate.toFixed(2)}원 → ${this.googleRate.toFixed(2)}원 (${change > 0 ? '+' : ''}${change.toFixed(2)}원)`);
                this.lastCalculatedRate = this.googleRate;
            }
            return this.googleRate;
        }
        // 기본값 (구글 파이낸스 실패 시)
        // console.log(`⚠️ 구글 파이낸스 환율 없음 - 기본값 1394.0원 사용`);
        return 1394.0;
    };
    GoogleFinanceExchangeService.prototype.getRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // 현재 환율 반환, 필요시 즉시 업데이트
                if (!this.isUpdating) {
                    this.updateRate(); // 백그라운드에서 업데이트
                }
                return [2 /*return*/, this.getCurrentRate()];
            });
        });
    };
    return GoogleFinanceExchangeService;
}());
export { GoogleFinanceExchangeService };
// 싱글톤 인스턴스
export var naverExchange = new GoogleFinanceExchangeService();
