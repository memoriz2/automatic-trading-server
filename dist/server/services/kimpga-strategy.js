import { realtimeKimchiService } from "./realtime-kimchi.js";
var KimpgaStrategyService = /** @class */ (function () {
    function KimpgaStrategyService() {
        this.running = false;
        this.logs = [];
        this.tradeCount = 0;
        this.entryInfo = { upbit_qty: 0, binance_qty: 0 };
        this.maxLogs = 400;
        this.loops = 0;
        this.apiErrors = 0;
    }
    KimpgaStrategyService.prototype.pushLog = function (msg) {
        var line = "[".concat(new Date().toISOString(), "] ").concat(msg);
        this.logs.push(line);
        if (this.logs.length > this.maxLogs)
            this.logs.shift();
    };
    KimpgaStrategyService.prototype.start = function () {
        var _this = this;
        if (this.running)
            return;
        this.running = true;
        this.pushLog("🚀 실시간 전략 시작 (웹소켓 기반)");
        // 🚀 실시간 김치 프리미엄 업데이트 구독
        realtimeKimchiService.onUpdate('kimpga-strategy', function (kimchiData) {
            var _a;
            try {
                var btcData = kimchiData.find(function (x) { return x.symbol === "BTC"; });
                if (btcData) {
                    _this.pushLog("\u26A1 \uAE40\uD504=".concat(btcData.premiumRate.toFixed(3), "% \uC5C5\uBE44\uD2B8=\u20A9").concat(btcData.upbitPrice.toLocaleString(), " \uBC14\uC774\uB0B8\uC2A4=$").concat(btcData.binanceFuturesPrice.toLocaleString(), " FX=").concat(btcData.usdKrwRate));
                    _this.loops += 1;
                }
            }
            catch (e) {
                _this.pushLog("\uC624\uB958: ".concat((_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : String(e)));
                _this.apiErrors += 1;
            }
        });
    };
    KimpgaStrategyService.prototype.stop = function () {
        if (this.running)
            this.pushLog("🛑 실시간 전략 중지");
        this.running = false;
        // 실시간 김치 프리미엄 구독 해제
        realtimeKimchiService.removeCallback('kimpga-strategy');
    };
    KimpgaStrategyService.prototype.forceExit = function () {
        this.pushLog("강제청산 요청 처리 (더미)");
        return { ok: true };
    };
    KimpgaStrategyService.prototype.getStatus = function () {
        return {
            running: this.running,
            position_state: this.running ? "entered" : "neutral",
            trade_count: this.tradeCount,
            pnl: {
                profit_krw_cum: 0,
                fees_upbit_krw_cum: 0,
                fees_binance_usdt_cum: 0,
                fees_binance_krw_cum: 0,
            },
            logs: this.logs.slice(-this.maxLogs),
            entry_info: this.entryInfo,
        };
    };
    KimpgaStrategyService.prototype.getMetrics = function () {
        return {
            loops: this.loops,
            orders_binance: 0,
            orders_upbit: 0,
            api_errors: this.apiErrors,
        };
    };
    return KimpgaStrategyService;
}());
export { KimpgaStrategyService };
