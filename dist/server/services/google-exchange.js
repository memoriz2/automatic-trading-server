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
var GoogleExchangeService = /** @class */ (function () {
    function GoogleExchangeService() {
        this.lastRate = 1372.0892; // 실제 구글 환율
        this.lastUpdate = 0;
        this.CACHE_DURATION = 30000; // 30초 캐시
    }
    /**
     * 구글 실시간 USD→KRW 환율 조회
     */
    GoogleExchangeService.prototype.getUSDKRWRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, response, data, rate, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        now = Date.now();
                        // 캐시된 값이 유효하면 반환
                        if (now - this.lastUpdate < this.CACHE_DURATION) {
                            return [2 /*return*/, this.lastRate];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch('https://api.exchangerate-api.com/v4/latest/USD')];
                    case 2:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Google Exchange API error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _b.sent();
                        rate = (_a = data.rates) === null || _a === void 0 ? void 0 : _a.KRW;
                        if (!rate || typeof rate !== 'number') {
                            throw new Error('Invalid KRW rate from Google');
                        }
                        this.lastRate = rate;
                        this.lastUpdate = now;
                        console.log("\uAD6C\uAE00 USD\u2192KRW \uD658\uC728 \uC5C5\uB370\uC774\uD2B8: ".concat(rate, "\uC6D0"));
                        return [2 /*return*/, rate];
                    case 4:
                        error_1 = _b.sent();
                        console.warn('구글 환율 조회 실패, 기존값 사용:', error_1);
                        return [2 /*return*/, this.lastRate];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 캐시된 환율 반환 (빠른 조회용)
     */
    GoogleExchangeService.prototype.getCachedRate = function () {
        return this.lastRate;
    };
    return GoogleExchangeService;
}());
export { GoogleExchangeService };
