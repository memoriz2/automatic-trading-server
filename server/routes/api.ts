import type { Express } from "express";
import { SimpleKimchiService } from "../services/simple-kimchi.js";
import { realtimeKimchiService } from "../services/realtime-kimchi.js";
import { KimpgaStrategyService } from "../services/kimpga-strategy.js";
import { CoinAPIService } from "../services/coinapi.js";
// import { storage } from "../storage.js"; // 현재 사용하지 않음
import { authenticateSession } from "./auth.js";

export function registerApiRoutes(app: Express): void {
  const simpleKimchiService = new SimpleKimchiService();
  // const coinAPIService = new CoinAPIService(); // 현재 사용하지 않음
  const kimpgaSvc = new KimpgaStrategyService();

  // 서버 정보
  app.get("/api/server-info", async (_req, res) => {
    try {
      res.json({
        tradingMode: process.env.ENABLE_REAL_TRADING === 'true' ? 'real' : 'mock',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      });
    } catch (error) {
      console.error("서버 정보 조회 오류:", error);
      res.status(500).json({ error: "서버 정보 조회 실패" });
    }
  });

  // 암호화폐 목록
  app.get("/api/cryptocurrencies", async (_req, res) => {
    try {
      const cryptocurrencies = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      res.json(cryptocurrencies);
    } catch (error) {
      console.error("암호화폐 목록 조회 오류:", error);
      res.status(500).json({ error: "암호화폐 목록 조회 실패" });
    }
  });

  // 김치 프리미엄 조회
  app.get("/api/kimchi-premium", async (_req, res) => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const kimchiData = await simpleKimchiService.calculateSimpleKimchi(symbols);
      res.json(kimchiData);
    } catch (error) {
      console.error("김치 프리미엄 조회 오류:", error);
      res.status(500).json({ error: "김치 프리미엄 조회 실패" });
    }
  });

  // CoinAPI 김치 프리미엄
  app.get("/api/kimchi-premium/coinapi", async (req, res) => {
    try {
      // const symbols = (req.query.symbols as string)?.split(',') || ['BTC']; // 현재 사용하지 않음
      // CoinAPI 서비스는 현재 구현되지 않음
      const data = { message: "CoinAPI 서비스 준비 중" };
      res.json(data);
    } catch (error) {
      console.error("CoinAPI 김치 프리미엄 조회 오류:", error);
      res.status(500).json({ error: "CoinAPI 김치 프리미엄 조회 실패" });
    }
  });

  // 실시간 환율 조회
  app.get("/api/exchange-rate", async (_req, res) => {
    try {
      const rate = await simpleKimchiService.getCurrentExchangeRate();
      res.json({ 
        rate,
        timestamp: new Date().toISOString(),
        source: 'google_finance'
      });
    } catch (error) {
      console.error("환율 조회 오류:", error);
      res.status(500).json({ error: "환율 조회 실패" });
    }
  });

  // 김치 프리미엄 내역 (차트용)
  app.get("/api/kimchi-premiums", async (req, res) => {
    try {
      // const minutes = parseInt(req.query.minutes as string) || 1440; // 현재 사용하지 않음
      // 히스토리컬 데이터는 현재 구현되지 않음
      const data = [];
      res.json(data);
    } catch (error) {
      console.error("김치 프리미엄 내역 조회 오류:", error);
      res.status(500).json({ error: "김치 프리미엄 내역 조회 실패" });
    }
  });

  // kimpga API
  app.get("/api/kimpga/current", async (_req, res) => {
    try {
      const realtime = realtimeKimchiService.getCurrentKimchiPremium();
      const d = realtime.find((x) => x.symbol === "BTC");
      res.json({
        kimp: d?.premiumRate ?? null,
        upbit_price: d?.upbitPrice ?? null,
        binance_price: d?.binanceFuturesPrice ?? null,
        usdkrw: d?.usdKrwRate ?? null,
      });
    } catch (e) {
      console.error("/api/kimpga/current error", e);
      res.status(500).json({ error: "failed" });
    }
  });

  app.get("/api/kimpga/status", async (_req, res) => {
    try {
      res.json(kimpgaSvc.getStatus());
    } catch (e) {
      res.status(500).json({ error: "failed" });
    }
  });

  // 일일 통계
  app.get("/api/daily-stats/:userId", authenticateSession, async (req: any, res) => {
    try {
      // const userId = req.user.id; // 현재 사용하지 않음
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 임시로 빈 배열 반환 (메서드 구현 필요)
      const todayPositions: any[] = [];
      const todayEntries = todayPositions.filter(p => p.status === 'open').length;
      const todayExits = todayPositions.filter(p => p.status === 'closed').length;

      res.json({
        date: today.toISOString(),
        total_orders: 0,
        entries: todayEntries,
        exits: todayExits,
        profit_krw: 0,
        fees_krw: 0,
        net_profit_krw: 0
      });
    } catch (error) {
      console.error("일일 통계 조회 오류:", error);
      res.status(500).json({ error: "일일 통계 조회 실패" });
    }
  });
}
