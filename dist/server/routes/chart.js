import { storage } from "../storage.js";
import { authenticateSession } from "./auth.js";
export function registerChartRoutes(app) {
    // 김치 프리미엄 차트 데이터 조회 (오전 9시부터) - 인증 불필요
    app.get("/api/chart/kimchi-premium", async (req, res) => {
        try {
            const symbol = req.query.symbol || 'BTC';
            // 한국 시간 오전 9시 계산 (UTC+9)
            const now = new Date();
            const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
            const today9AM = new Date(koreaTime);
            today9AM.setHours(9, 0, 0, 0);
            // 현재 한국 시간이 오전 9시 이전이면 어제 오전 9시
            const startTime = koreaTime.getTime() < today9AM.getTime()
                ? new Date(today9AM.getTime() - 24 * 60 * 60 * 1000)
                : today9AM;
            const data = await storage.getKimchiPremiumByTimeRange(symbol, startTime);
            // 차트 형식으로 변환
            const chartData = data.map(d => ({
                t: new Date(d.timestamp).getTime(),
                v: parseFloat(d.premium_rate),
                upbit: parseFloat(d.upbit_price),
                binance: parseFloat(d.binance_price),
            }));
            res.json(chartData);
        }
        catch (error) {
            console.error("차트 데이터 조회 오류:", error);
            res.status(500).json({ error: "차트 데이터 조회 실패" });
        }
    });
    // 김치 프리미엄 데이터 저장
    app.post("/api/chart/kimchi-premium", authenticateSession, async (req, res) => {
        try {
            const { symbol, upbitPrice, binancePrice, premiumRate, exchangeRate } = req.body;
            await storage.saveKimchiPremium({
                symbol: symbol || 'BTC',
                upbitPrice: parseFloat(upbitPrice),
                binancePrice: parseFloat(binancePrice),
                premiumRate: parseFloat(premiumRate),
                exchangeRate: parseFloat(exchangeRate),
                premiumAmount: parseFloat(upbitPrice) - parseFloat(binancePrice) *
                    parseFloat(exchangeRate),
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("차트 데이터 저장 오류:", error);
            res.status(500).json({ error: "차트 데이터 저장 실패" });
        }
    });
}
