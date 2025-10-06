  // import type { SimpleKimchiService } from "./simple-kimchi.js";
import { realtimeKimchiService } from "./realtime-kimchi.js";

type StrategyStatus = {
  running: boolean;
  position_state: string;
  trade_count: number;
  pnl: {
    profit_krw_cum: number;
    fees_upbit_krw_cum: number;
    fees_binance_usdt_cum: number;
    fees_binance_krw_cum: number;
  };
  logs: string[];
  entry_info: { upbit_qty: number; binance_qty: number };
};

export class KimpgaStrategyService {
  private running = false;
  private logs: string[] = [];
  private tradeCount = 0;
  private entryInfo = { upbit_qty: 0, binance_qty: 0 };
  private readonly maxLogs = 400;
  private loops = 0;
  private apiErrors = 0;

  constructor() {}

  private pushLog(msg: string) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    this.logs.push(line);
    if (this.logs.length > this.maxLogs) this.logs.shift();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.pushLog("🚀 실시간 전략 시작 (웹소켓 기반)");
    
    // 🚀 실시간 김치 프리미엄 업데이트 구독
    realtimeKimchiService.onUpdate('kimpga-strategy', (kimchiData) => {
      try {
        const btcData = kimchiData.find((x) => x.symbol === "BTC");
        if (btcData) {
          this.pushLog(
            `⚡ 김프=${btcData.premiumRate.toFixed(3)}% 업비트=₩${btcData.upbitPrice.toLocaleString()} 바이낸스=$${btcData.binanceFuturesPrice.toLocaleString()} FX=${btcData.usdKrwRate}`
          );
          this.loops += 1;
        }
      } catch (e: any) {
        this.pushLog(`오류: ${e?.message ?? String(e)}`);
        this.apiErrors += 1;
      }
    });
  }

  stop() {
    if (this.running) this.pushLog("🛑 실시간 전략 중지");
    this.running = false;
    
    // 실시간 김치 프리미엄 구독 해제
    realtimeKimchiService.removeCallback('kimpga-strategy');
  }

  forceExit() {
    this.pushLog("강제청산 요청 처리 (더미)");
    return { ok: true };
  }

  getStatus(): StrategyStatus {
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
