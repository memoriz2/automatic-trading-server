import { storage } from "../storage.js";
export function registerMonitoringRoutes(app) {
    // === 거래 모니터링 API ===
    // 최근 거래 내역 (trade_logs와 조인)
    app.get('/api/monitoring/trades', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const data = await storage.getTradesWithLogs(limit);
            res.json({
                success: true,
                data,
                count: data.length
            });
        }
        catch (error) {
            console.error('거래 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 일별 거래 통계
    app.get('/api/monitoring/stats/daily', async (req, res) => {
        try {
            const days = parseInt(req.query.days) || 7;
            const data = await storage.getDailyTradeStats(days);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('일별 통계 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 거래소별 성과 분석
    app.get('/api/monitoring/stats/exchanges', async (req, res) => {
        try {
            const hours = parseInt(req.query.hours) || 24;
            const data = await storage.getExchangeStats(hours);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('거래소별 통계 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 김프 분석 (trade_logs 기반)
    app.get('/api/monitoring/kimp/analysis', async (req, res) => {
        try {
            const days = parseInt(req.query.days) || 7;
            const data = await storage.getKimpAnalysis(days);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('김프 분석 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 실시간 거래 현황 대시보드
    app.get('/api/monitoring/dashboard', async (req, res) => {
        try {
            const data = await storage.getDashboardData();
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('대시보드 데이터 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 거래 로그 분석 - 성공/실패 패턴
    app.get('/api/monitoring/logs/patterns', async (req, res) => {
        try {
            const data = await storage.getTradeLogPatterns();
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('패턴 분석 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    console.log('✅ 모니터링 API 라우터 등록 완료');
}
