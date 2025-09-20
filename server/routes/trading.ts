import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage.js";
import { multiStrategyTradingService } from "../services/new-kimchi-trading.js";
import { BalanceService } from "../services/BalanceService.js";
import { authenticateSession } from "./auth.js";

const insertTradingSettingsSchema = z.object({
  entryPremiumRate: z.string().optional(),
  exitPremiumRate: z.string().optional(),
  stopLossRate: z.string().optional(),
  maxPositions: z.number().int().optional(),
  isAutoTrading: z.boolean().optional(),
  maxInvestmentAmount: z.string().optional(),
  kimchiEntryRate: z.string().optional(),
  kimchiExitRate: z.string().optional(),
  kimchiToleranceRate: z.string().optional(),
  binanceLeverage: z.number().int().optional(),
  upbitEntryAmount: z.string().optional(),
});

export function registerTradingRoutes(app: Express): void {
  // 자동매매 시작
  app.post("/api/trading/start/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const traceId = req.header("X-Trace-Id") || `srv-${Date.now()}`;

      // 사용자별 거래 설정 확인
      const settings = await storage.getTradingSettingsByUserId(userId);
      if (!settings) {
        return res.status(400).json({ error: "거래 설정을 먼저 구성해주세요", traceId });
      }

      await multiStrategyTradingService.startMultiStrategyTrading(userId);

      const strategies = await storage.getTradingStrategiesByUserId(userId);
      const activeCount = strategies.filter((s) => s.isActive).length;

      // 자동매매 시작 후 잔고 즉시 갱신
      try {
        const balanceService = new BalanceService();
        await balanceService.refreshBalanceAfterTrade(Number(userId), {
          exchange: 'auto-trading',
          side: 'buy',
          symbol: 'start'
        });
      } catch (balanceError) {
        console.warn(`⚠️ [자동매매 시작] 잔고 갱신 실패:`, balanceError);
      }

      res.json({
        message: "자동매매가 시작되었습니다",
        activeStrategies: activeCount,
        settings,
        traceId,
      });
    } catch (error) {
      const traceId = req.header("X-Trace-Id") || `srv-${Date.now()}`;
      console.error(`[TRACE ${traceId}] 자동매매 시작 오류:`, error);
      res.status(500).json({ error: "자동매매 시작 중 오류가 발생했습니다", traceId });
    }
  });

  // 자동매매 중지
  app.post("/api/trading/stop/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      await multiStrategyTradingService.stopMultiStrategyTrading();

      // 자동매매 중지 후 잔고 즉시 갱신
      try {
        const balanceService = new BalanceService();
        await balanceService.refreshBalanceAfterTrade(Number(userId), {
          exchange: 'auto-trading',
          side: 'sell',
          symbol: 'stop'
        });
      } catch (balanceError) {
        console.warn(`⚠️ [자동매매 중지] 잔고 갱신 실패:`, balanceError);
      }

      res.json({ message: "자동매매가 중지되었습니다" });
    } catch (error) {
      console.error("자동매매 중지 오류:", error);
      res.status(500).json({ error: "자동매매 중지 중 오류가 발생했습니다" });
    }
  });

  // 자동매매 상태 조회
  app.get("/api/trading/status", async (_req, res) => {
    try {
      const isRunning = false; // TODO: multiStrategyTradingService.isRunning() 구현 필요
      const strategies = await storage.getTradingStrategies(1); // TODO: 전체 전략 조회 메서드 구현
      const activeStrategies = strategies.filter((s) => s.isActive).length;

      res.json({
        isRunning,
        strategies,
        activeStrategies,
        newKimchiActive: false,
        totalActive: isRunning && activeStrategies > 0
      });
    } catch (error) {
      console.error("거래 상태 조회 오류:", error);
      res.status(500).json({ error: "거래 상태 조회 중 오류가 발생했습니다" });
    }
  });

  // 거래 설정 조회
  app.get("/api/trading-settings/:userId", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getTradingSettingsByUserId(String(userId));
      
      if (!settings) {
        return res.status(404).json({ error: "거래 설정을 찾을 수 없습니다" });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("거래 설정 조회 오류:", error);
      res.status(500).json({ error: "거래 설정 조회 중 오류가 발생했습니다" });
    }
  });

  // 거래 설정 업데이트
  app.put("/api/trading-settings/:userId", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parseResult = insertTradingSettingsSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "잘못된 요청 데이터", 
          details: parseResult.error.issues 
        });
      }

      const updatedSettings = await storage.updateTradingSettings(String(userId), parseResult.data);
      res.json(updatedSettings);
    } catch (error) {
      console.error("거래 설정 업데이트 오류:", error);
      res.status(500).json({ error: "거래 설정 업데이트 중 오류가 발생했습니다" });
    }
  });
}
