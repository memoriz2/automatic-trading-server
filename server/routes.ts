import type { Express } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import { KimchiService } from "./services/kimchi.js";
import { CoinAPIService } from "./services/coinapi.js";
import { SimpleKimchiService } from "./services/simple-kimchi.js";
import { TradingService } from "./services/trading.js";
import { multiStrategyTradingService } from "./services/new-kimchi-trading.js";
import { UpbitService } from "./services/upbit.js";
import { BinanceService } from "./services/binance.js";
import {
  insertTradingSettingsSchema,
  insertExchangeSchema,
  insertUserSchema,
  loginUserSchema,
} from "@shared/schema";
import { getCurrentServerIP, isReplit } from "./utils/ip.js";
import {
  authenticateToken,
  generateToken,
  validatePasswordStrength,
  validateUsername,
} from "./utils/auth.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function registerRoutes(
  app: Express,
  server: Server
): Promise<void> {
  const kimchiService = new KimchiService();
  const coinAPIService = new CoinAPIService();
  const simpleKimchiService = new SimpleKimchiService();
  const tradingService = new TradingService();

  // 🔐 Authentication Routes

  // 회원가입
  app.post("/api/auth/register", async (req, res) => {
    try {
      // CORS 헤더 추가
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      console.log("회원가입 요청 데이터:", req.body);

      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        console.log("검증 실패:", validation.error.errors);
        return res.status(400).json({
          message: "입력 데이터가 올바르지 않습니다",
          errors: validation.error.errors,
        });
      }

      const { username, password } = validation.data;
      console.log("검증 완료 - 사용자명:", username);

      // 사용자명 중복 체크
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "이미 존재하는 사용자명입니다" });
      }

      console.log("새 사용자 생성 중...");
      // 비밀번호 해시화
      // const hashedPassword = await bcrypt.hash(password, 10);

      // 사용자 생성
      const user = await storage.createUser({
        username,
        password,
        role: "user",
      });

      console.log("사용자 생성 완료:", user.id, user.username);

      // JWT 토큰 생성
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        message: "회원가입이 완료되었습니다",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      console.error("회원가입 오류:", error);
      res.status(500).json({
        message: "회원가입 처리 중 오류가 발생했습니다",
        debug: error.message,
      });
    }
  });

  // 로그인
  app.post("/api/auth/login", async (req, res) => {
    try {
      // CORS 헤더 추가
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      console.log("로그인 요청 데이터:", req.body);

      const validation = loginUserSchema.safeParse(req.body);
      if (!validation.success) {
        console.log("로그인 검증 실패:", validation.error.errors);
        return res.status(400).json({
          message: "사용자명과 비밀번호를 입력해주세요",
          errors: validation.error.errors,
        });
      }

      const { username, password } = validation.data;
      console.log("로그인 시도:", username);

      // 사용자 조회
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "사용자를 찾을 수 없습니다" });
      }

      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "비밀번호가 일치하지 않습니다" });
      }

      console.log("로그인 성공:", user.username);

      // JWT 토큰 생성
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        message: "로그인 성공",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      console.error("로그인 오류:", error);
      res.status(500).json({
        message: "로그인 처리 중 오류가 발생했습니다",
        debug: error.message,
      });
    }
  });

  // 현재 사용자 정보 조회
  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
      });
    } catch (error) {
      console.error("사용자 정보 조회 오류:", error);
      res
        .status(500)
        .json({ message: "사용자 정보 조회 중 오류가 발생했습니다" });
    }
  });

  // Download endpoint
  app.get("/api/download", (req, res) => {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(process.cwd(), "download-this-file.tar.gz");

    if (fs.existsSync(filePath)) {
      res.download(filePath, "kimchi-premium-trading.tar.gz");
    } else {
      res.status(404).send("File not found");
    }
  });

  // API Routes

  // 서버 정보 조회 (IP 주소 등)
  app.get("/api/server-info", async (req, res) => {
    try {
      const serverIP = await getCurrentServerIP();
      const isReplitEnv = isReplit();

      res.json({
        ip: serverIP,
        isReplit: isReplitEnv,
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      console.error("Failed to get server info:", error);
      res.status(500).json({ error: "Failed to fetch server info" });
    }
  });

  // 암호화폐 목록 조회
  app.get("/api/cryptocurrencies", async (req, res) => {
    try {
      const cryptocurrencies = await storage.getAllCryptocurrencies();
      res.json(cryptocurrencies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cryptocurrencies" });
    }
  });

  // 최신 김프율 조회 (대시보드용)
  app.get("/api/kimchi-premium", async (req, res) => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const kimchiData = await kimchiService.calculateKimchiPremium(symbols);
      res.json(kimchiData);
    } catch (error) {
      console.error("Error calculating kimchi premium:", error);
      res.status(500).json({ error: "Failed to fetch kimchi premiums" });
    }
  });

  // CoinAPI 기반 실시간 김프율 조회 (고정밀도)
  app.get("/api/kimchi-premium/coinapi", async (req, res) => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const results = [];

      for (const symbol of symbols) {
        try {
          const data = await coinAPIService.calculateKimchiPremium(symbol);
          results.push({
            symbol,
            upbitPrice: data.upbitPrice,
            binancePrice: data.binancePriceKRW,
            premiumRate: data.premiumRate,
            timestamp: new Date().toISOString(),
            source: "CoinAPI",
          });
        } catch (error) {
          console.warn(`CoinAPI ${symbol} 조회 실패:`, error);
          // 개별 코인 실패시 빈 값으로 처리하지 않고 건너뛰기
        }
      }

      res.json(results);
    } catch (error) {
      console.error("CoinAPI kimchi premium calculation error:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch CoinAPI kimchi premiums" });
    }
  });

  // 단순 김프율 계산 (업비트 + 바이낸스 선물 + 구글 환율)
  app.get("/api/kimchi-premium/simple", async (req, res) => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const results = await simpleKimchiService.calculateSimpleKimchi(symbols);
      res.json(results);
    } catch (error) {
      console.error("Simple kimchi premium calculation error:", error);
      res.status(500).json({ error: "Failed to fetch simple kimchi premiums" });
    }
  });

  // 김프 데이터 API 엔드포인트 (프론트엔드 호환성)
  app.get("/api/kimchi-data", async (req, res) => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const simpleKimchiData = await simpleKimchiService.calculateSimpleKimchi(
        symbols
      );

      // SimpleKimchiData를 KimchiData 형식으로 변환
      const kimchiData = simpleKimchiData.map((data) => ({
        symbol: data.symbol,
        upbitPrice: data.upbitPrice,
        binancePrice: data.binancePriceKRW,
        binancePriceUSD: data.binanceFuturesPrice,
        premiumRate: data.premiumRate,
        timestamp: new Date(data.timestamp),
        exchangeRate: data.usdKrwRate,
        exchangeRateSource: "Google Finance (실시간 환율)",
      }));

      res.json(kimchiData);
    } catch (error) {
      console.error("Kimchi data API error:", error);
      res.status(500).json({ error: "Failed to fetch kimchi data" });
    }
  });

  // 최신 김프율 조회 (저장된 데이터)
  app.get("/api/kimchi-premiums", async (req, res) => {
    try {
      const premiums = await kimchiService.getLatestKimchiPremiums();
      res.json(premiums);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kimchi premiums" });
    }
  });

  // 김프율 히스토리 조회
  app.get("/api/kimchi-premiums/:symbol/history", async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const history = await kimchiService.getKimchiPremiumHistory(
        symbol,
        limit
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kimchi premium history" });
    }
  });

  // 거래 설정 조회
  app.get("/api/trading-settings/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      console.log(`거래 설정 조회 요청: userId=${userId}`);

      const settings = await storage.getTradingSettingsByUserId(userId);
      console.log(`조회된 설정:`, settings);

      if (!settings) {
        // 기본 설정 생성
        console.log("기본 설정 생성 중...");
        const defaultSettings = await storage.createTradingSettings({
          userId: parseInt(userId),
          entryPremiumRate: "2.5",
          exitPremiumRate: "1.0",
          stopLossRate: "-1.5",
          maxPositions: 5,
          isAutoTrading: false,
          maxInvestmentAmount: "1000000",
        });
        console.log("기본 설정 생성 완료:", defaultSettings);
        res.json(defaultSettings);
      } else {
        res.json(settings);
      }
    } catch (error: any) {
      console.error("거래 설정 조회 오류:", error);
      res.status(500).json({
        error: "Failed to fetch trading settings",
        debug: error.message,
      });
    }
  });

  // 거래 설정 업데이트
  app.put("/api/trading-settings/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const settingsData = insertTradingSettingsSchema.parse(req.body);

      const settings = await storage.updateTradingSettings(
        userId,
        settingsData
      );
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid trading settings data" });
    }
  });

  // 활성 포지션 조회
  app.get("/api/positions/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const positions = await storage.getActivePositions(userId);
      res.json(positions);
    } catch (error) {
      console.error("포지션 조회 오류:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  // 포지션 청산
  app.post("/api/positions/:id/close", async (req, res) => {
    try {
      const positionId = parseInt(req.params.id);
      const position = await storage.closePosition(positionId);

      if (!position) {
        res.status(404).json({ error: "Position not found" });
        return;
      }

      res.json(position);
    } catch (error) {
      res.status(500).json({ error: "Failed to close position" });
    }
  });

  // 거래 내역 조회
  app.get("/api/trades/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const limit = parseInt(req.query.limit as string) || 50;
      const trades = await storage.getTradesByUserId(userId, limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  // 시스템 알림 조회
  app.get("/api/alerts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const alerts = await storage.getSystemAlerts(limit);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // 알림 읽음 처리
  app.put("/api/alerts/:id/read", async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const alert = await storage.markAlertAsRead(alertId);

      if (!alert) {
        res.status(404).json({ error: "Alert not found" });
        return;
      }

      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });

  // 자동매매 시작
  app.post("/api/trading/start/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const { strategyType = "positive_kimchi" } = req.body;

      console.log(`[자동매매 시작] 사용자: ${userId}, 전략: ${strategyType}`);

      // 사용자별 거래 설정 확인
      const settings = await storage.getTradingSettingsByUserId(userId);
      if (!settings) {
        return res.status(400).json({ error: "거래 설정을 먼저 구성해주세요" });
      }

      // 다중 전략 자동매매 시작
      // 임시로 주석 처리 - 구현 필요
      // const result = await multiStrategyTradingService.startTrading(userId, strategyType);
      const result = {
        success: true,
        message: "자동매매 시작 (구현중)",
        activeStrategies: 1,
      };

      if (result.success) {
        console.log(
          `[자동매매 시작 성공] 사용자: ${userId}, 활성 전략: ${result.activeStrategies}`
        );
        res.json({
          message: "자동매매가 시작되었습니다",
          activeStrategies: result.activeStrategies,
          settings: settings,
        });
      } else {
        res.status(400).json({ error: "자동매매 시작 실패" });
      }
    } catch (error) {
      console.error("자동매매 시작 오류:", error);
      res.status(500).json({ error: "자동매매 시작 중 오류가 발생했습니다" });
    }
  });

  // 자동매매 중지
  app.post("/api/trading/stop/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리

      console.log(`[자동매매 중지] 사용자: ${userId}`);

      // 다중 전략 자동매매 중지
      // 임시로 주석 처리 - 구현 필요
      // const result = await multiStrategyTradingService.stopTrading(userId);
      const result = { success: true, message: "자동매매 중지 완료" };

      if (result.success) {
        console.log(`[자동매매 중지 완료] 사용자: ${userId}`);
        res.json({
          message: "자동매매가 중지되었습니다",
          stoppedStrategies: 0,
        });
      } else {
        res.status(400).json({ error: "자동매매 중지 실패" });
      }
    } catch (error) {
      console.error("자동매매 중지 오류:", error);
      res.status(500).json({ error: "자동매매 중지 중 오류가 발생했습니다" });
    }
  });

  // 자동매매 상태 조회
  app.get("/api/trading/status/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리

      // 임시로 주석 처리 - 구현 필요
      // const isRunning = multiStrategyTradingService.isTrading(userId);
      const isRunning = false;
      const strategies = await storage.getTradingStrategiesByUserId(userId);

      res.json({
        isRunning,
        strategies,
        activeStrategies: isRunning
          ? strategies.filter((s) => s.isActive).length
          : 0,
      });
    } catch (error) {
      console.error("자동매매 상태 조회 오류:", error);
      res
        .status(500)
        .json({ error: "자동매매 상태 조회 중 오류가 발생했습니다" });
    }
  });

  // 거래소 계정 연결 정보 조회
  app.get("/api/exchanges/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      console.log(
        `[${new Date().toISOString()}] 거래소 정보 조회 요청 - 사용자: ${userId}`
      );
      const exchanges = await storage.getExchangesByUserId(userId);
      console.log(
        `[${new Date().toISOString()}] 조회된 거래소 수: ${exchanges.length}`
      );
      console.log(
        `[${new Date().toISOString()}] 조회된 거래소 데이터:`,
        exchanges
      );

      // 보안을 위해 API 키는 앞 8자리만 표시
      const safeExchanges = exchanges.map((exchange: any) => ({
        id: exchange.id,
        name: exchange.exchange || "Unknown", // exchange 컬럼 사용
        isActive: exchange.isActive,
        apiKeyStart: exchange.apiKey.substring(0, 8) + "...",
        hasApiKey: !!exchange.apiKey,
        hasApiSecret: !!exchange.apiSecret,
      }));

      console.log(
        `[${new Date().toISOString()}] 안전하게 필터링된 거래소 데이터:`,
        safeExchanges
      );
      res.json(safeExchanges);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] 거래소 정보 조회 오류 - 사용자: ${
          req.params.userId
        }:`,
        error
      );
      console.error(`[${new Date().toISOString()}] 오류 상세 정보:`, {
        message: (error as any).message,
        stack: (error as any).stack,
        code: (error as any).code,
        detail: (error as any).detail,
        hint: (error as any).hint,
        fullError: error,
      });
      res.status(500).json({
        error: "거래소 정보 조회 중 오류가 발생했습니다",
        details: (error as any).message,
      });
    }
  });

  // 거래소 API 키 설정
  app.post("/api/exchanges/:userId", async (req, res) => {
    // ✅ 강제 로그 출력 - 모든 로그를 console.log로 변경
    console.log(
      `🚀 [${new Date().toISOString()}] *** API 키 저장 요청 수신됨 *** - URL: ${
        req.url
      }`
    );
    console.log(
      `📋 [${new Date().toISOString()}] 요청 메서드: ${req.method}, 요청 헤더:`,
      req.headers
    );
    console.log(
      `📝 [${new Date().toISOString()}] 요청 바디 (민감 정보 제외):`,
      {
        userId: req.params.userId,
        exchange: req.body.exchange,
      }
    );
    console.log(
      `🔐 [${new Date().toISOString()}] 요청 바디 상세 (민감 정보 마스킹):`,
      {
        name: req.body.name,
        apiKey: req.body.apiKey
          ? req.body.apiKey.substring(0, 8) + "..."
          : "없음",
        apiSecretPresent: !!(req.body.apiSecret || req.body.secretKey),
        apiSecretSource: req.body.apiSecret
          ? "apiSecret"
          : req.body.secretKey
          ? "secretKey"
          : "none",
      }
    );
    try {
      const userId = req.params.userId; // string으로 처리
      const { exchange, apiKey, apiSecret, secretKey } = req.body;
      const resolvedSecret = apiSecret ?? secretKey;

      console.log(
        `💾 [${new Date().toISOString()}] API 키 저장 요청 수신 - 사용자: ${userId}, 거래소: ${exchange}`
      );
      console.log(
        `🔑 [${new Date().toISOString()}] API 키 시작 부분: ${
          apiKey ? apiKey.substring(0, 8) + "..." : "없음"
        }`
      );

      if (!exchange || !apiKey || !resolvedSecret) {
        console.log(
          `❌ [${new Date().toISOString()}] 필수 정보 누락 - exchange: ${!!exchange}, apiKey: ${!!apiKey}, apiSecret: ${!!resolvedSecret}`
        );
        return res
          .status(400)
          .json({ error: "거래소명, API 키, Secret 키를 모두 입력해주세요" });
      }

      console.log(
        `⏳ [${new Date().toISOString()}] API 키 저장 중... - 사용자: ${userId}, 거래소: ${exchange}`
      );
      console.log(
        `⏳ [${new Date().toISOString()}] storage.createOrUpdateExchange 호출 시작...`
      );

      // storage 객체 테스트
      console.log(`🔍 [${new Date().toISOString()}] storage 객체 테스트:`, {
        storageType: typeof storage,
        hasCreateOrUpdateExchange: typeof storage.createOrUpdateExchange,
        storageMethods: Object.getOwnPropertyNames(
          Object.getPrototypeOf(storage)
        ),
        storageKeys: Object.keys(storage),
      });

      const exchangeRecord = await storage.createOrUpdateExchange({
        userId: parseInt(userId),
        exchange: exchange,
        apiKey,
        apiSecret: resolvedSecret,
        // isActive: true // 스키마에서 제외
      });

      console.log(
        `🔍 [${new Date().toISOString()}] storage.createOrUpdateExchange 결과:`,
        {
          exchangeRecord: exchangeRecord,
          type: typeof exchangeRecord,
          hasId: !!exchangeRecord?.id,
          id: exchangeRecord?.id,
          userId: exchangeRecord?.userId,
          exchange: exchangeRecord?.exchange,
          isActive: exchangeRecord?.isActive,
        }
      );

      if (!exchangeRecord) {
        console.error(
          `❌ [${new Date().toISOString()}] exchangeRecord가 undefined입니다!`
        );
        return res.status(500).json({
          error: "거래소 정보 저장에 실패했습니다",
          details: "저장된 거래소 정보를 가져올 수 없습니다",
        });
      }

      console.log(
        `✅ [${new Date().toISOString()}] API 키 저장 성공 - 사용자: ${userId}, 거래소: ${exchange}, ID: ${
          exchangeRecord.id
        }`
      );

      // 저장된 데이터 확인을 위한 추가 로그
      console.log(
        `🔍 [${new Date().toISOString()}] 저장된 거래소 데이터 상세:`,
        {
          id: exchangeRecord.id,
          userId: exchangeRecord.userId,
          exchange: exchangeRecord.exchange,
          apiKeyLength: exchangeRecord.apiKey?.length || 0,
          apiSecretLength: exchangeRecord.apiSecret?.length || 0,
          isActive: exchangeRecord.isActive,
          createdAt: exchangeRecord.createdAt,
          updatedAt: exchangeRecord.updatedAt,
        }
      );

      // 저장 후 즉시 조회해서 실제 저장 확인
      try {
        const savedExchange = await storage.getExchangesByUserId(userId);
        console.log(
          `🔍 [${new Date().toISOString()}] 저장 후 즉시 조회 결과:`,
          {
            totalExchanges: savedExchange.length,
            savedExchange: savedExchange.map((ex) => ({
              id: ex.id,
              exchange: ex.exchange,
              userId: ex.userId,
              hasApiKey: !!ex.apiKey,
              hasApiSecret: !!ex.apiSecret,
              isActive: ex.isActive,
            })),
          }
        );
      } catch (verifyError) {
        console.error(
          `❌ [${new Date().toISOString()}] 저장 후 조회 실패:`,
          verifyError
        );
      }

      res.json({
        message: `${exchange} 거래소 연결이 완료되었습니다`,
        exchange: {
          id: exchangeRecord.id,
          exchange: exchangeRecord.exchange,
          apiKeyStart: apiKey.substring(0, 8) + "...",
        },
      });
    } catch (error) {
      console.error(
        `💥 [${new Date().toISOString()}] 거래소 연결 오류 - 사용자: ${
          req.params.userId
        }, 거래소: ${req.body.exchange || req.body.name || "알 수 없음"}:`,
        error
      );
      console.error(`🔍 [${new Date().toISOString()}] 오류 상세 정보:`, {
        message: (error as any).message,
        stack: (error as any).stack,
        code: (error as any).code,
        detail: (error as any).detail,
        hint: (error as any).hint,
        requestBody: req.body,
        requestParams: req.params,
        requestHeaders: req.headers,
      });
      res.status(500).json({
        error: "거래소 연결 중 오류가 발생했습니다",
        details: (error as any).message,
        requestBody: req.body,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 거래소 연결 테스트
  app.post("/api/exchanges/:userId/test", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const exchanges = await storage.getExchangesByUserId(userId);
      const results = [];

      for (const exchange of exchanges) {
        try {
          if (exchange.exchange === "upbit") {
            const upbitService = new UpbitService(
              exchange.apiKey,
              exchange.apiSecret
            );
            const accounts = await upbitService.getAccounts();
            results.push({
              exchange: "upbit",
              connected: true,
              accounts: accounts.length,
              message: `업비트 연결 성공 (${accounts.length}개 계정)`,
            });
          } else if (exchange.exchange === "binance") {
            const binanceService = new BinanceService(
              exchange.apiKey,
              exchange.apiSecret
            );
            const accountInfo = await binanceService.getAccount();
            results.push({
              exchange: "binance",
              connected: true,
              balances: accountInfo.balances?.length || 0,
              message: `바이낸스 연결 성공`,
            });
          }
        } catch (error: any) {
          results.push({
            exchange: exchange.exchange,
            connected: false,
            error: error.message,
            message: `${exchange.exchange} 연결 실패: ${error.message}`,
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error("거래소 연결 테스트 오류:", error);
      res
        .status(500)
        .json({ error: "거래소 연결 테스트 중 오류가 발생했습니다" });
    }
  });

  // 잔고 조회
  app.get("/api/balances/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      console.log(
        `[${new Date().toISOString()}] Fetching balances for user ${userId}`
      );

      const exchanges = await storage.getExchangesByUserId(userId);
      console.log(
        `[${new Date().toISOString()}] Retrieved ${
          exchanges.length
        } exchanges for user ${userId}`
      );

      // 보안을 위해 API 키 정보 로깅
      const exchangeDebugInfo = exchanges.map((ex) => ({
        id: ex.id,
        name: ex.exchange || "Unknown",
        hasApiKey: !!ex.apiKey,
        hasApiSecret: !!ex.apiSecret,
        apiKeyStart: ex.apiKey ? ex.apiKey.substring(0, 8) + "..." : "none",
      }));
      console.log(
        `[${new Date().toISOString()}] Exchange details:`,
        exchangeDebugInfo
      );

      const balances: any = {
        upbit: { krw: 0, connected: false },
        binance: { usdt: 0, connected: false },
      };

      for (const exchange of exchanges) {
        const exchangeInfo = {
          id: exchange.id,
          name: exchange.exchange || "Unknown",
          hasApiKey: !!exchange.apiKey,
          hasApiSecret: !!exchange.apiSecret,
          isActive: exchange.isActive,
          apiKeyStart: exchange.apiKey
            ? exchange.apiKey.substring(0, 8) + "..."
            : "none",
        };
        console.log(
          `[${new Date().toISOString()}] Processing exchange:`,
          exchangeInfo
        );

        try {
          if (exchange.exchange === "upbit") {
            console.log(
              `[${new Date().toISOString()}] Trying to connect to Upbit with API key: ${exchange.apiKey.substring(
                0,
                8
              )}...`
            );
            const upbitService = new UpbitService(
              exchange.apiKey,
              exchange.apiSecret
            );
            const accounts = await upbitService.getAccounts();

            const krwAccount = accounts.find(
              (account) => account.currency === "KRW"
            );
            balances.upbit = {
              krw: krwAccount ? parseFloat(krwAccount.balance) : 0,
              connected: true,
            };
          } else if (exchange.exchange === "binance") {
            console.log(
              `[${new Date().toISOString()}] Trying to connect to Binance with API key: ${exchange.apiKey.substring(
                0,
                8
              )}...`
            );
            const binanceService = new BinanceService(
              exchange.apiKey,
              exchange.apiSecret
            );
            const usdtBalance = await binanceService.getUSDTBalance();

            console.log(
              `[${new Date().toISOString()}] Binance connection successful, USDT balance: ${usdtBalance}`
            );
            balances.binance = {
              usdt: usdtBalance,
              connected: true,
            };
          }
        } catch (error: any) {
          console.error(
            `[${new Date().toISOString()}] Error fetching ${
              exchange.exchange || "unknown"
            } balance:`,
            error
          );
          console.error(`[${new Date().toISOString()}] Full error details:`, {
            message: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            fullError: error,
          });

          balances[exchange.exchange || "unknown"] = {
            [exchange.exchange === "upbit" ? "krw" : "usdt"]: 0,
            connected: false,
            error: error.message,
          };
        }
      }

      res.json(balances);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] 잔고 조회 오류:`, error);
      console.error(`[${new Date().toISOString()}] 오류 상세 정보:`, {
        message: (error as any).message,
        stack: (error as any).stack,
        code: (error as any).code,
        detail: (error as any).detail,
        hint: (error as any).hint,
        fullError: error,
      });
      res.status(500).json({
        error: "잔고 조회 중 오류가 발생했습니다",
        details: (error as any).message,
      });
    }
  });

  // 거래 전략 목록 조회
  app.get("/api/trading-strategies/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const strategies = await storage.getTradingStrategiesByUserId(userId);
      res.json(strategies);
    } catch (error) {
      console.error("거래 전략 조회 오류:", error);
      res.status(500).json({ error: "거래 전략 조회 중 오류가 발생했습니다" });
    }
  });

  // 거래 전략 생성/수정
  app.post("/api/trading-strategies/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const strategyData = { ...req.body, userId };

      console.log("거래 전략 생성/수정 요청:", strategyData);

      const strategy = await storage.createOrUpdateTradingStrategy(
        strategyData
      );

      res.json({
        message: "거래 전략이 저장되었습니다",
        strategy,
      });
    } catch (error: any) {
      console.error("거래 전략 생성/수정 오류:", error);
      res.status(500).json({
        error: "거래 전략 저장 중 오류가 발생했습니다",
        details: error.message,
      });
    }
  });

  // 거래 전략 삭제
  app.delete("/api/trading-strategies/:id", async (req, res) => {
    try {
      const strategyId = parseInt(req.params.id);
      const strategy = await storage.deleteTradingStrategy(strategyId);

      if (!strategy) {
        return res.status(404).json({ error: "거래 전략을 찾을 수 없습니다" });
      }

      res.json({ message: "거래 전략이 삭제되었습니다" });
    } catch (error) {
      console.error("거래 전략 삭제 오류:", error);
      res.status(500).json({ error: "거래 전략 삭제 중 오류가 발생했습니다" });
    }
  });

  // 관리자 전용: 모든 사용자 조회
  app.get("/api/admin/users", authenticateToken, async (req, res) => {
    try {
      // 관리자 권한 확인
      const currentUser = await storage.getUser((req as any).user.userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "관리자 권한이 필요합니다" });
      }

      const users = await storage.getAllUsers();

      // 비밀번호 제외하고 반환
      const safeUsers = users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      res.json(safeUsers);
    } catch (error) {
      console.error("사용자 목록 조회 오류:", error);
      res
        .status(500)
        .json({ error: "사용자 목록 조회 중 오류가 발생했습니다" });
    }
  });

  // 관리자 전용: 사용자 권한 변경
  app.put(
    "/api/admin/users/:userId/role",
    authenticateToken,
    async (req, res) => {
      try {
        // 관리자 권한 확인
        const currentUser = await storage.getUser((req as any).user.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "관리자 권한이 필요합니다" });
        }

        const userId = req.params.userId; // string으로 처리
        const { role } = req.body;

        if (!role || !["user", "admin"].includes(role)) {
          return res
            .status(400)
            .json({ message: "올바른 권한을 선택해주세요 (user 또는 admin)" });
        }

        const user = await storage.updateUserRole(userId, role);

        if (!user) {
          return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
        }

        res.json({
          message: "사용자 권한이 변경되었습니다",
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        });
      } catch (error) {
        console.error("사용자 권한 변경 오류:", error);
        res
          .status(500)
          .json({ error: "사용자 권한 변경 중 오류가 발생했습니다" });
      }
    }
  );

  // WebSocket server setup - 기존 HTTP 서버에 부착
  const wss = new WebSocketServer({ server, path: "/ws" });

  // WebSocket connection handling
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("message", (message) => {
      console.log("WebSocket message received:", message.toString());
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  // 실시간 김프율 데이터 전송
  const sendKimchiData = async () => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const kimchiData = await simpleKimchiService.calculateSimpleKimchi(
        symbols
      );

      const message = JSON.stringify({
        type: "kimchi-data",
        data: kimchiData,
        timestamp: new Date().toISOString(),
      });

      // 연결된 모든 WebSocket 클라이언트에 데이터 전송
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error("김프율 데이터 전송 오류:", error);
    }
  };

  // 10초마다 실시간 데이터 전송
  setInterval(sendKimchiData, 10000);

  // 테스트 로그 엔드포인트
  app.post("/api/test-log", async (req, res) => {
    try {
      const { message, timestamp, userId } = req.body;

      console.log(`🔍 [${timestamp}] 테스트 로그 - 사용자: ${userId}`);
      console.log(`📝 메시지: ${message}`);
      console.log(`👤 사용자 ID: ${userId}`);
      console.log(`⏰ 타임스탬프: ${timestamp}`);

      res.json({
        success: true,
        message: "로그가 서버에 기록되었습니다",
        loggedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("테스트 로그 기록 오류:", error);
      res.status(500).json({ error: "로그 기록 중 오류가 발생했습니다" });
    }
  });

  // CORS preflight 처리
  app.options("/api/auth/*", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(200);
  });

  return;
}
