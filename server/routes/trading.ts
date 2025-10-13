import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage.js";
import { multiStrategyTradingService } from "../services/new-kimchi-trading.js";
import { BalanceService } from "../services/BalanceService.js";
import { authenticateSession } from "./auth.js";
import { ApiKeysRepository } from "../repositories/ApiKeysRepository.js";
import { UpbitAdapter } from "../adapters/UpbitAdapter.js";
import { BinanceAdapter } from "../adapters/BinanceAdapter.js";

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
  app.post("/api/trading/start/:userId", async (req, res): Promise<void> => {
    try {
      const userId = req.params.userId;
      const traceId = req.header("X-Trace-Id") || `srv-${Date.now()}`;

      // 사용자별 거래 설정 확인
      const settings = await storage.getTradingSettingsByUserId(userId);
      if (!settings) {
        res.status(400).json({ error: "거래 설정을 먼저 구성해주세요", traceId });
        return;
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
  app.get("/api/trading-settings/:userId", authenticateSession, async (req: any, res): Promise<void> => {
    try {
      const userId = req.user.id;
      const settings = await storage.getTradingSettingsByUserId(String(userId));

      if (!settings) {
        res.status(404).json({ error: "거래 설정을 찾을 수 없습니다" });
        return;
      }

      res.json(settings);
    } catch (error) {
      console.error("거래 설정 조회 오류:", error);
      res.status(500).json({ error: "거래 설정 조회 중 오류가 발생했습니다" });
    }
  });

  // 거래 설정 업데이트
  app.put("/api/trading-settings/:userId", authenticateSession, async (req: any, res): Promise<void> => {
    try {
      const userId = req.user.id;
      const parseResult = insertTradingSettingsSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({
          error: "잘못된 요청 데이터",
          details: parseResult.error.issues
        });
        return;
      }

      const updatedSettings = await storage.updateTradingSettings(Number(userId), parseResult.data);
      res.json(updatedSettings);
    } catch (error) {
      console.error("거래 설정 업데이트 오류:", error);
      res.status(500).json({ error: "거래 설정 업데이트 중 오류가 발생했습니다" });
    }
  });

  // 거래내역 조회
  app.get("/api/trades/history", authenticateSession, async (req: any, res): Promise<void> => {
    console.log('🚨🚨🚨 [TRACE] /api/trades/history 엔드포인트 호출됨!');
    try {
      const userId = req.user.id;
      const exchange = req.query.exchange as string | undefined; // 'upbit', 'binance', 'all'
      const symbol = req.query.symbol as string | undefined;
      const upbitLimit = 100; // 업비트 최신 100건 (API 최대치)
      const binanceLimit = 50; // 바이낸스 최신 50건

      console.log(`📊 거래내역 조회 요청 - 사용자: ${userId}, 거래소: ${exchange || 'all'}, 심볼: ${symbol || 'all'}`);

      const apiKeysRepo = new ApiKeysRepository();
      const apiKeys = await apiKeysRepo.findActiveByUserId(userId);

      if (apiKeys.length === 0) {
        res.status(404).json({ error: "등록된 API 키가 없습니다" });
        return;
      }

      const allTrades: any[] = [];

      // 실시간 USDT/KRW 환율 조회 (업비트에서) - 필수
      const upbitAdapter = new UpbitAdapter();
      const usdtKrwRate = await upbitAdapter.getCurrentPrice('USDT');
      console.log(`💱 실시간 USDT/KRW 환율: ${usdtKrwRate}원`);

      // 업비트 거래내역 조회 (단순화 - 최신 50건)
      if (!exchange || exchange === 'all' || exchange === 'upbit') {
        const upbitKey = apiKeys.find(key => key.exchange === 'upbit');
        if (upbitKey) {
          try {
            const upbitAdapter = new UpbitAdapter();
            upbitAdapter.setCredentials(upbitKey.apiKey, upbitKey.secretKey);

            // 업비트 API 직접 호출 - done 상태만
            const upbitOrders = await upbitAdapter.getTrades(symbol, upbitLimit);

            console.log(`✅ 업비트 원본 데이터: ${upbitOrders.length}건`);
            console.log(`   - 매수: ${upbitOrders.filter(t => t.side === 'buy').length}건`);
            console.log(`   - 매도: ${upbitOrders.filter(t => t.side === 'sell').length}건`);

            // 그대로 추가
            allTrades.push(...upbitOrders.map(trade => ({
              ...trade,
              exchange: 'upbit'
            })));

          } catch (error: any) {
            console.error('❌ 업비트 거래내역 조회 실패:', error.message);
          }
        }
      }

      // 바이낸스 거래내역 조회 (50건)
      if (!exchange || exchange === 'all' || exchange === 'binance') {
        const binanceKey = apiKeys.find(key => key.exchange === 'binance');
        if (binanceKey) {
          try {
            const binanceAdapter = new BinanceAdapter();
            binanceAdapter.setCredentials(binanceKey.apiKey, binanceKey.secretKey);

            // 심볼이 지정되지 않으면 주요 코인들 조회
            const symbols = symbol ? [symbol] : ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
            const perSymbolLimit = Math.ceil(binanceLimit / (symbols.length * 2)); // 현물 + 선물 = 2배

            for (const sym of symbols) {
              try {
                // 현물 거래내역 (심볼당 제한)
                const spotTrades = await binanceAdapter.getTrades(sym, perSymbolLimit);
                allTrades.push(...spotTrades.map(trade => ({
                  ...trade,
                  exchange: 'binance',
                  type: 'spot',
                  usdtKrwRate // 실시간 환율 추가
                })));

                // 선물 거래내역 (심볼당 제한)
                const futuresTrades = await binanceAdapter.getFuturesTrades(sym, perSymbolLimit);
                allTrades.push(...futuresTrades.map(trade => ({
                  ...trade,
                  exchange: 'binance',
                  type: 'futures',
                  usdtKrwRate // 실시간 환율 추가
                })));
              } catch (error: any) {
                console.warn(`⚠️  바이낸스 ${sym} 거래내역 조회 실패:`, error.message);
              }
            }

            console.log(`✅ 바이낸스 거래내역: ${allTrades.filter(t => t.exchange === 'binance').length}건`);
          } catch (error: any) {
            console.error('❌ 바이낸스 거래내역 조회 실패:', error.message);
          }
        }
      }

      // 시간순 정렬 (최신순) - 필터링 없이 그대로 반환
      allTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log(`📊 최종 거래내역:`);
      console.log(`   - 업비트: ${allTrades.filter(t => t.exchange === 'upbit').length}건 (매수: ${allTrades.filter(t => t.exchange === 'upbit' && t.side === 'buy').length}, 매도: ${allTrades.filter(t => t.exchange === 'upbit' && t.side === 'sell').length})`);
      console.log(`   - 바이낸스: ${allTrades.filter(t => t.exchange === 'binance').length}건`);
      console.log(`   - 총합: ${allTrades.length}건`);

      if (allTrades.length > 0) {
        console.log(`📅 최신 거래: ${allTrades[0].exchange} ${allTrades[0].side} ${allTrades[0].symbol} at ${allTrades[0].timestamp}`);
      }

      res.json({
        success: true,
        count: allTrades.length,
        trades: allTrades
      });
    } catch (error: any) {
      console.error("거래내역 조회 오류:", error);
      res.status(500).json({
        success: false,
        error: "거래내역 조회 중 오류가 발생했습니다",
        details: error.message
      });
    }
  });
}
