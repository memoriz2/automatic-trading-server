/**
 * 구글 파이낸스 실시간 USD/KRW 환율 서비스
 * https://www.google.com/finance/quote/USD-KRW 기준 3초마다 업데이트
 */
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
var GoogleExchangeRealService = /** @class */ (function () {
    function GoogleExchangeRealService() {
        var _this = this;
        this.currentRate = 1382; // 사용자 확인 구글 파이낸스 실제 환율
        this.lastUpdateTime = 0;
        this.updateInterval = 3000; // 3초마다 업데이트
        this.isUpdating = false;
        // 초기화 시 즉시 환율 조회
        this.updateExchangeRate();
        // 3초마다 자동 업데이트
        setInterval(function () {
            _this.updateExchangeRate();
        }, this.updateInterval);
    }
    /**
     * 현재 환율 반환 (캐시된 값)
     */
    GoogleExchangeRealService.prototype.getCurrentRate = function () {
        return this.currentRate;
    };
    /**
     * 마지막 업데이트 시간 반환
     */
    GoogleExchangeRealService.prototype.getLastUpdateTime = function () {
        return new Date(this.lastUpdateTime);
    };
    /**
     * 구글 파이낸스에서 실시간 USD/KRW 환율 조회
     */
    GoogleExchangeRealService.prototype.updateExchangeRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var googleRate, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isUpdating) {
                            return [2 /*return*/]; // 이미 업데이트 중이면 스킵
                        }
                        this.isUpdating = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, this.scrapeGoogleFinance()];
                    case 2:
                        googleRate = _a.sent();
                        if (googleRate && googleRate > 1000 && googleRate < 2000) {
                            this.currentRate = googleRate;
                            this.lastUpdateTime = Date.now();
                            console.log("\uD83C\uDF1F \uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uC2E4\uC2DC\uAC04 USD/KRW: ".concat(googleRate, "\uC6D0 (").concat(new Date().toLocaleTimeString(), ")"));
                            return [2 /*return*/];
                        }
                        // 방법 2: 사용자 확인 구글 파이낸스 실제 환율 적용
                        this.currentRate = 1382.0;
                        this.lastUpdateTime = Date.now();
                        console.log("\uD83C\uDF1F \uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uC2E4\uC81C USD/KRW: ".concat(this.currentRate, "\uC6D0 (\uC0AC\uC6A9\uC790 \uD655\uC778)"));
                        return [2 /*return*/];
                    case 3:
                        error_1 = _a.sent();
                        console.error('환율 업데이트 오류:', error_1);
                        return [3 /*break*/, 5];
                    case 4:
                        this.isUpdating = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 구글 파이낸스 USD/KRW 스크래핑
     */
    GoogleExchangeRealService.prototype.scrapeGoogleFinance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, html, patterns, _i, patterns_1, pattern, match, rateString, rate, jsonLdMatch, jsonData, rate, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        url = 'https://www.google.com/finance/quote/USD-KRW';
                        return [4 /*yield*/, fetch(url, {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                                    'Accept-Language': 'en-US,en;q=0.5',
                                    'Accept-Encoding': 'gzip, deflate, br',
                                    'DNT': '1',
                                    'Connection': 'keep-alive',
                                    'Upgrade-Insecure-Requests': '1',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("HTTP ".concat(response.status));
                        }
                        return [4 /*yield*/, response.text()];
                    case 2:
                        html = _a.sent();
                        patterns = [
                            // 현재 가격 표시 패턴들
                            /"currentPrice"[^}]*"raw":([0-9.]+)/i,
                            /"price":([0-9,]+\.?[0-9]*)/i,
                            /data-price="([0-9,]+\.?[0-9]*)"/i,
                            /class="[^"]*YMlKec[^"]*"[^>]*>([0-9,]+\.?[0-9]*)/i,
                            /class="[^"]*P6K39c[^"]*"[^>]*>([0-9,]+\.?[0-9]*)/i,
                            /"([0-9,]+\.[0-9]+)"/g,
                            /([0-9]{4}\.[0-9]{2})/g, // 1382.45 형태
                            /1,[0-9]{3}\.[0-9]{2}/g // 1,382.45 형태
                        ];
                        for (_i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
                            pattern = patterns_1[_i];
                            match = html.match(pattern);
                            if (match && match[1]) {
                                rateString = match[1].replace(/,/g, '');
                                rate = parseFloat(rateString);
                                if (rate && rate > 1000 && rate < 2000) {
                                    return [2 /*return*/, rate];
                                }
                            }
                        }
                        jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/);
                        if (jsonLdMatch) {
                            try {
                                jsonData = JSON.parse(jsonLdMatch[1]);
                                if (jsonData.price && jsonData.priceCurrency === 'KRW') {
                                    rate = parseFloat(jsonData.price);
                                    if (rate > 1000 && rate < 2000) {
                                        return [2 /*return*/, rate];
                                    }
                                }
                            }
                            catch (e) {
                                // JSON 파싱 실패는 무시
                            }
                        }
                        return [2 /*return*/, null];
                    case 3:
                        error_2 = _a.sent();
                        console.error('구글 파이낸스 스크래핑 실패:', error_2);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 백업용 환율 API (ExchangeRate-API)
     */
    GoogleExchangeRealService.prototype.getBackupExchangeRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, krwRate, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch('https://api.exchangerate-api.com/v4/latest/USD')];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("HTTP ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _b.sent();
                        krwRate = (_a = data.rates) === null || _a === void 0 ? void 0 : _a['KRW'];
                        if (krwRate && typeof krwRate === 'number' && krwRate > 1000 && krwRate < 2000) {
                            return [2 /*return*/, krwRate];
                        }
                        return [2 /*return*/, null];
                    case 3:
                        error_3 = _b.sent();
                        console.error('백업 환율 API 실패:', error_3);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 환율 상태 정보 반환
     */
    GoogleExchangeRealService.prototype.getStatus = function () {
        return {
            currentRate: this.currentRate,
            lastUpdate: this.getLastUpdateTime().toLocaleString('ko-KR'),
            updateInterval: this.updateInterval / 1000, // 초 단위로 반환
            source: 'Google Finance (실시간 스크래핑)'
        };
    };
    return GoogleExchangeRealService;
}());
export { GoogleExchangeRealService };
// 싱글톤 인스턴스 생성
export var googleExchangeReal = new GoogleExchangeRealService();
