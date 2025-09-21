import { realtimeKimchiService } from "./realtime-kimchi.js";
export class KimpgaStrategyService {
    running = false;
    logs = [];
    tradeCount = 0;
    entryInfo = { upbit_qty: 0, binance_qty: 0 };
    maxLogs = 400;
    loops = 0;
    apiErrors = 0;
    constructor() { }
    pushLog(msg) {
        const line = `[${new Date().toISOString()}] ${msg}`;
        this.logs.push(line);
        if (this.logs.length > this.maxLogs)
            this.logs.shift();
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.pushLog("🚀 실시간 전략 시작 (웹소켓 기반)");
        // 🚀 실시간 김치 프리미엄 업데이트 구독
        realtimeKimchiService.onUpdate('kimpga-strategy', (kimchiData) => {
            try {
                const btcData = kimchiData.find((x) => x.symbol === "BTC");
                if (btcData) {
                    this.pushLog(`⚡ 김프=${btcData.premiumRate.toFixed(3)}% 업비트=₩${btcData.upbitPrice.toLocaleString()} 바이낸스=$${btcData.binanceFuturesPrice.toLocaleString()} FX=${btcData.usdKrwRate}`);
                    this.loops += 1;
                }
            }
            catch (e) {
                this.pushLog(`오류: ${e?.message ?? String(e)}`);
                this.apiErrors += 1;
            }
        });
    }
    stop() {
        if (this.running)
            this.pushLog("🛑 실시간 전략 중지");
        this.running = false;
        // 실시간 김치 프리미엄 구독 해제
        realtimeKimchiService.removeCallback('kimpga-strategy');
    }
    forceExit() {
        this.pushLog("강제청산 요청 처리 (더미)");
        return { ok: true };
    }
    getStatus() {
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
    }
    getMetrics() {
        return {
            loops: this.loops,
            orders_binance: 0,
            orders_upbit: 0,
            api_errors: this.apiErrors,
        };
    }
}
