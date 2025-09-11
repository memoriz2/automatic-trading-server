import { prisma } from "./db.js";
import { Prisma } from "../generated/prisma";
import type {
  User,
  Exchange,
  Cryptocurrency,
  KimchiPremium,
  TradingSetting as TradingSettings,
  TradingStrategy,
  Position,
  Trade,
  TradeLog,
  SystemAlert,
} from "../generated/prisma";
import { hashPassword, verifyPassword } from "./utils/auth.js";
import { encryptApiKey, decryptApiKey } from "./utils/encryption.js";

// Insert DTO 타입 (Prisma 전환용 최소 정의)
export type InsertUser = {
  username: string;
  password: string;
  role?: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

export type InsertExchange = {
  userId: number;
  exchange: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string | null;
  isActive?: boolean;
};

export type InsertCryptocurrency = {
  symbol: string;
  name: string;
  isActive?: boolean;
  upbitMarket?: string | null;
  binanceSymbol?: string | null;
  priority?: number;
};

export type InsertKimchiPremium = {
  symbol: string;
  upbitPrice: string | number;
  binancePrice: string | number;
  premiumRate: string | number;
  exchangeRate: string | number;
  premiumAmount: string | number;
  timestamp?: Date;
};

export type InsertTradingSettings = {
  userId: number;
  entryPremiumRate?: string | number;
  exitPremiumRate?: string | number;
  stopLossRate?: string | number;
  maxPositions?: number;
  isAutoTrading?: boolean;
  maxInvestmentAmount?: string | number;
  kimchiEntryRate?: string | number;
  kimchiExitRate?: string | number;
  kimchiToleranceRate?: string | number;
  binanceLeverage?: number;
  upbitEntryAmount?: string | number;
  dailyLossLimit?: string | number;
  maxPositionSize?: string | number;
};

export type InsertTradingStrategy = {
  userId: number;
  name?: string;
  entryRate?: string | number;
  exitRate?: string | number;
  leverage?: number;
  investmentAmount?: string | number;
  isActive?: boolean;
  symbol?: string;
  tolerance?: string | number;
  isAutoTrading?: boolean;
  totalTrades?: number;
  successfulTrades?: number;
  totalProfit?: string | number;
  strategyType?: string;
  toleranceRate?: string | number;
};

export type InsertPosition = {
  userId: number;
  strategyId?: number | null;
  symbol: string;
  type?: string;
  entryPrice: string | number;
  currentPrice?: string | number | null;
  quantity: string | number;
  entryPremiumRate: string | number;
  currentPremiumRate?: string | number | null;
  status?: string;
  entryTime?: Date;
  exitTime?: Date | null;
  upbitOrderId?: string | null;
  binanceOrderId?: string | null;
  side: string;
  exitPrice?: string | number | null;
  isMock?: boolean;
};

export type InsertTrade = {
  userId: number;
  positionId?: number | null;
  tradeLogId?: number | null;
  symbol: string;
  side: string;
  exchange: string;
  quantity: string | number;
  price: string | number;
  fee?: string | number;
  orderType?: string;
  exchangeOrderId?: string | null;
  exchangeTradeId?: string | null;
  executedAt?: Date;
};

export type InsertTradeLog = {
  kimp: number;
  action: string;
  amount: number;
  result: string;
};

export type InsertSystemAlert = {
  type: string;
  title: string;
  message: string;
  isRead?: boolean;
  userId?: number | null;
  data?: any;
  priority?: string;
};

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(username: string, password: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getAllUsersWithStats(): Promise<any[]>;
  getAdminStats(): Promise<any>;

  // Exchanges
  getExchangesByUserId(userId: string): Promise<Exchange[]>;
  createExchange(exchange: InsertExchange): Promise<Exchange>;
  createOrUpdateExchange(exchange: InsertExchange): Promise<Exchange>;
  updateExchange(
    id: number,
    exchange: Partial<Exchange>
  ): Promise<Exchange | undefined>;

  // Cryptocurrencies
  getAllCryptocurrencies(): Promise<Cryptocurrency[]>;
  createCryptocurrency(crypto: InsertCryptocurrency): Promise<Cryptocurrency>;

  // Kimchi Premiums
  getLatestKimchiPremiums(): Promise<KimchiPremium[]>;
  getKimchiPremiumBySymbol(symbol: string): Promise<KimchiPremium | undefined>;
  createKimchiPremium(premium: InsertKimchiPremium): Promise<KimchiPremium>;
  getKimchiPremiumHistory(
    symbol: string,
    limit?: number
  ): Promise<KimchiPremium[]>;

  // Trading Settings
  getTradingSettings(userId: string): Promise<TradingSettings | undefined>;
  saveTradingSettings(
    settings: InsertTradingSettings
  ): Promise<TradingSettings>;
  getTradingSettingsByUserId(
    userId: string
  ): Promise<TradingSettings | undefined>;
  createTradingSettings(
    settings: InsertTradingSettings
  ): Promise<TradingSettings>;
  updateTradingSettings(
    userId: string,
    settings: Partial<TradingSettings>
  ): Promise<TradingSettings | undefined>;

  // Trading Strategies
  getTradingStrategies(userId: string): Promise<TradingStrategy[]>;
  getTradingStrategiesByUserId(userId: string): Promise<TradingStrategy[]>;
  getTradingStrategy(id: number): Promise<TradingStrategy | undefined>;
  createTradingStrategy(
    strategy: InsertTradingStrategy
  ): Promise<TradingStrategy>;
  createOrUpdateTradingStrategy(
    strategy: InsertTradingStrategy
  ): Promise<TradingStrategy>;
  updateTradingStrategy(
    id: number,
    strategy: Partial<TradingStrategy>
  ): Promise<TradingStrategy | undefined>;
  deleteTradingStrategy(id: number): Promise<TradingStrategy | undefined>;

  // Positions
  getActivePositions(userId: string): Promise<Position[]>;
  getPositionById(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(
    id: number,
    position: Partial<Position>
  ): Promise<Position | undefined>;
  closePosition(id: number): Promise<Position | undefined>;

  // Trades
  getTradesByUserId(userId: string, limit?: number): Promise<Trade[]>;
  getTradesByPositionId(positionId: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;

  // TradeLogs
  createTradeLog(tradeLog: InsertTradeLog): Promise<TradeLog>;
  getTradeLogs(limit?: number): Promise<TradeLog[]>;

  // System Alerts
  getSystemAlerts(limit?: number): Promise<SystemAlert[]>;
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  markAlertAsRead(id: number): Promise<SystemAlert | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    return user ?? undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { username } });
    return user ?? undefined;
  }

  async createUser(insertUser: InsertUser & { password?: string }): Promise<User> {
    // 비밀번호 해시화
    if (!insertUser.password) {
      throw new Error("비밀번호가 필요합니다.");
    }
    const hashedPassword = await hashPassword(insertUser.password);
    const user = await prisma.user.create({
      data: {
        username: insertUser.username,
        passwordHash: hashedPassword,
        password: hashedPassword,
        role: insertUser.role ?? "user",
        email: insertUser.email ?? null,
        firstName: insertUser.firstName ?? null,
        lastName: insertUser.lastName ?? null,
        profileImageUrl: insertUser.profileImageUrl ?? null,
      },
    });
    return user as User;
  }

  async authenticateUser(
    username: string,
    password: string
  ): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) return null;

    return user;
  }

  // Exchanges
  async getExchangesByUserId(userId: string): Promise<Exchange[]> {
    return prisma.exchange.findMany({ where: { userId: parseInt(userId) } });
  }

  async createExchange(insertExchange: InsertExchange): Promise<Exchange> {
    try {
      console.log(
        `🔍 [${new Date().toISOString()}] DB 저장 시작 - 사용자: ${
          insertExchange.userId
        }, 거래소: ${insertExchange.exchange}`
      );
      console.log(`🔑 [${new Date().toISOString()}] 입력 데이터:`, {
        userId: insertExchange.userId,
        exchange: insertExchange.exchange,
        apiKeyLength: insertExchange.apiKey?.length || 0,
        apiSecretLength: insertExchange.apiSecret?.length || 0,
      });

      // API 키와 시크릿 키 암호화
      const encryptedApiKey = encryptApiKey(insertExchange.apiKey);
      const encryptedSecretKey = encryptApiKey(insertExchange.apiSecret);

      console.log(`🔐 [${new Date().toISOString()}] 암호화 완료:`, {
        encryptedApiKeyLength: encryptedApiKey.length,
        encryptedSecretKeyLength: encryptedSecretKey.length,
      });

      // 기존 거래소 설정이 있는지 확인
      console.log(`🔍 [${new Date().toISOString()}] 기존 거래소 확인 중...`);
      const existingExchange = await prisma.exchange.findFirst({
        where: {
          userId: insertExchange.userId!,
          exchange: insertExchange.exchange,
        },
      });

      console.log(`🔍 [${new Date().toISOString()}] 기존 거래소 조회 결과:`, {
        found: !!existingExchange,
        existingId: existingExchange?.id,
        existingUserId: existingExchange?.userId,
        existingExchange: existingExchange?.exchange,
      });

      if (existingExchange) {
        // 기존 데이터가 있으면 업데이트
        console.log(
          `🔄 [${new Date().toISOString()}] 기존 거래소 업데이트 중... ID: ${
            existingExchange.id
          }`
        );

        const updatedExchange = await prisma.exchange.update({
          where: { id: existingExchange.id },
          data: {
            apiKey: encryptedApiKey,
            apiSecret: encryptedSecretKey,
            isActive: true,
          },
        });

        console.log(`✅ [${new Date().toISOString()}] 업데이트 완료:`, {
          id: updatedExchange.id,
          userId: updatedExchange.userId,
          exchange: updatedExchange.exchange,
          isActive: updatedExchange.isActive,
          updatedAt: updatedExchange.updatedAt,
        });

        // 업데이트 직후 검증
        const verifyUpdated = await prisma.exchange.findMany({
          where: {
            userId: insertExchange.userId!,
            exchange: insertExchange.exchange,
          },
        });
        console.log(
          `🔎 [${new Date().toISOString()}] 업데이트 직후 재조회 결과:`,
          verifyUpdated
        );

        const totalAfterUpdateRes = await prisma.exchange.count({
          where: { userId: insertExchange.userId! },
        });
        console.log(
          `📊 [${new Date().toISOString()}] 사용자별 exchanges 총건수(업데이트 후):`,
          totalAfterUpdateRes
        );

        return updatedExchange as unknown as Exchange;
      } else {
        // 새로운 데이터 삽입
        console.log(
          `🆕 [${new Date().toISOString()}] 새로운 거래소 삽입 중...`
        );

        const insertData = {
          userId: insertExchange.userId,
          exchange: insertExchange.exchange,
          apiKey: encryptedApiKey,
          apiSecret: encryptedSecretKey,
          isActive: true,
        };

        console.log(`📝 [${new Date().toISOString()}] 삽입할 데이터:`, {
          userId: insertData.userId,
          exchange: insertData.exchange,
          apiKeyLength: insertData.apiKey.length,
          apiSecretLength: insertData.apiSecret.length,
          isActive: insertData.isActive,
        });

        const newExchange = await prisma.exchange.create({ data: insertData });

        console.log(`✅ [${new Date().toISOString()}] 삽입 완료:`, {
          id: newExchange.id,
          userId: newExchange.userId,
          exchange: newExchange.exchange,
          isActive: newExchange.isActive,
          createdAt: newExchange.createdAt,
        });

        // 삽입 직후 검증
        const verifyInserted = await prisma.exchange.findMany({
          where: {
            userId: insertExchange.userId!,
            exchange: insertExchange.exchange,
          },
        });
        console.log(
          `🔎 [${new Date().toISOString()}] 삽입 직후 재조회 결과:`,
          verifyInserted
        );

        const totalAfterInsertRes = await prisma.exchange.count({
          where: { userId: insertExchange.userId! },
        });
        console.log(
          `📊 [${new Date().toISOString()}] 사용자별 exchanges 총건수(삽입 후):`,
          totalAfterInsertRes
        );

        return newExchange as unknown as Exchange;
      }
    } catch (error) {
      console.error(
        `💥 [${new Date().toISOString()}] DB 저장 중 에러 발생:`,
        error
      );
      console.error(`🔍 [${new Date().toISOString()}] 에러 상세 정보:`, {
        message: (error as any).message,
        stack: (error as any).stack,
        code: (error as any).code,
        detail: (error as any).detail,
        hint: (error as any).hint,
        inputData: {
          userId: insertExchange.userId,
          exchange: insertExchange.exchange,
          apiKeyLength: insertExchange.apiKey?.length || 0,
          apiSecretLength: insertExchange.apiSecret?.length || 0,
        },
      });
      throw error; // 에러를 다시 던져서 routes.ts에서 처리
    }
  }

  async createOrUpdateExchange(exchange: InsertExchange): Promise<Exchange> {
    return this.createExchange(exchange);
  }

  // 암호화된 API 키 복호화 메서드
  async getDecryptedExchange(
    userId: string,
    exchangeName: string
  ): Promise<{ apiKey: string; apiSecret: string } | null> {
    const exchange = await prisma.exchange.findFirst({
      where: {
        userId: parseInt(userId),
        exchange: exchangeName,
        isActive: true,
      },
    });

    if (!exchange) return null;

    try {
      return {
        apiKey: decryptApiKey(exchange.apiKey),
        apiSecret: decryptApiKey(exchange.apiSecret),
      };
    } catch (error) {
      console.error("API 키 복호화 실패:", error);
      return null;
    }
  }

  async updateExchange(
    id: number,
    updateData: Partial<Exchange>
  ): Promise<Exchange | undefined> {
    const exchange = await prisma.exchange.update({
      where: { id },
      data: updateData as Prisma.ExchangeUpdateInput,
    });
    return exchange ?? undefined;
  }

  // Cryptocurrencies
  async getAllCryptocurrencies(): Promise<Cryptocurrency[]> {
    return prisma.cryptocurrency.findMany();
  }

  async createCryptocurrency(
    insertCrypto: InsertCryptocurrency
  ): Promise<Cryptocurrency> {
    const crypto = await prisma.cryptocurrency.create({ data: insertCrypto });
    return crypto as Cryptocurrency;
  }

  // Kimchi Premiums
  async getLatestKimchiPremiums(): Promise<KimchiPremium[]> {
    return prisma.kimchiPremium.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });
  }

  async getKimchiPremiumBySymbol(
    symbol: string
  ): Promise<KimchiPremium | undefined> {
    const premium = await prisma.kimchiPremium.findFirst({
      where: { symbol },
      orderBy: { timestamp: "desc" },
    });
    return premium ?? undefined;
  }

  async createKimchiPremium(
    insertPremium: InsertKimchiPremium
  ): Promise<KimchiPremium> {
    const premium = await prisma.kimchiPremium.create({
      data: {
        symbol: insertPremium.symbol,
        upbitPrice: new Prisma.Decimal(insertPremium.upbitPrice as any),
        binancePrice: new Prisma.Decimal(insertPremium.binancePrice as any),
        premiumRate: new Prisma.Decimal(insertPremium.premiumRate as any),
        exchangeRate: new Prisma.Decimal(insertPremium.exchangeRate as any),
        premiumAmount: new Prisma.Decimal(insertPremium.premiumAmount as any),
        timestamp: insertPremium.timestamp ?? new Date(),
      },
    });
    return premium as KimchiPremium;
  }

  async getKimchiPremiumHistory(
    symbol: string,
    limit: number = 100
  ): Promise<KimchiPremium[]> {
    return prisma.kimchiPremium.findMany({
      where: { symbol },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  // Trading Settings
  async getTradingSettings(
    userId: string
  ): Promise<TradingSettings | undefined> {
    const settings = await prisma.tradingSetting.findUnique({
      where: { userId: parseInt(userId) },
    });
    return (settings as unknown as TradingSettings) ?? undefined;
  }

  async saveTradingSettings(
    insertSettings: InsertTradingSettings
  ): Promise<TradingSettings> {
    const data: Prisma.TradingSettingUpsertArgs["create"] = {
      userId: insertSettings.userId,
      entryPremiumRate: new Prisma.Decimal(
        (insertSettings.entryPremiumRate ?? "2.5") as any
      ),
      exitPremiumRate: new Prisma.Decimal(
        (insertSettings.exitPremiumRate ?? "1.0") as any
      ),
      stopLossRate: new Prisma.Decimal(
        (insertSettings.stopLossRate ?? "-1.5") as any
      ),
      maxPositions: insertSettings.maxPositions ?? 5,
      isAutoTrading: insertSettings.isAutoTrading ?? false,
      maxInvestmentAmount: new Prisma.Decimal(
        (insertSettings.maxInvestmentAmount ?? "10000000") as any
      ),
      kimchiEntryRate: new Prisma.Decimal(
        (insertSettings.kimchiEntryRate ?? "1.1") as any
      ),
      kimchiExitRate: new Prisma.Decimal(
        (insertSettings.kimchiExitRate ?? "1.5") as any
      ),
      kimchiToleranceRate: new Prisma.Decimal(
        (insertSettings.kimchiToleranceRate ?? "0.1") as any
      ),
      binanceLeverage: insertSettings.binanceLeverage ?? 3,
      upbitEntryAmount: new Prisma.Decimal(
        (insertSettings.upbitEntryAmount ?? "10000000") as any
      ),
      dailyLossLimit: new Prisma.Decimal(
        (insertSettings.dailyLossLimit ?? "500000") as any
      ),
      maxPositionSize: new Prisma.Decimal(
        (insertSettings.maxPositionSize ?? "2000000") as any
      ),
    };

    const settings = await prisma.tradingSetting.upsert({
      where: { userId: insertSettings.userId },
      create: data,
      update: data,
    });
    return settings as unknown as TradingSettings;
  }

  async getTradingSettingsByUserId(
    userId: string
  ): Promise<TradingSettings | undefined> {
    const settings = await prisma.tradingSetting.findUnique({
      where: { userId: parseInt(userId) },
    });
    return (settings as unknown as TradingSettings) ?? undefined;
  }

  async createTradingSettings(
    insertSettings: InsertTradingSettings
  ): Promise<TradingSettings> {
    const settings = await this.saveTradingSettings(insertSettings);
    return settings;
  }

  async updateTradingSettings(
    userId: string,
    updateData: Partial<TradingSettings>
  ): Promise<TradingSettings | undefined> {
    const settings = await prisma.tradingSetting.update({
      where: { userId: parseInt(userId) },
      data: updateData as Prisma.TradingSettingUpdateInput,
    });
    return (settings as unknown as TradingSettings) ?? undefined;
  }

  // Positions
  async getActivePositions(userId: string): Promise<Position[]> {
    return prisma.position.findMany({
      where: { userId: parseInt(userId), status: "open" },
      orderBy: { entryTime: "desc" },
    });
  }

  async getPositionById(id: number): Promise<Position | undefined> {
    const position = await prisma.position.findUnique({ where: { id } });
    return position ?? undefined;
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const position = await prisma.position.create({
      data: {
        userId: insertPosition.userId,
        strategyId: insertPosition.strategyId ?? null,
        symbol: insertPosition.symbol,
        type: insertPosition.type ?? "kimchi_arbitrage",
        entryPrice: new Prisma.Decimal(insertPosition.entryPrice as any),
        currentPrice: insertPosition.currentPrice != null ? new Prisma.Decimal(insertPosition.currentPrice as any) : null,
        quantity: new Prisma.Decimal(insertPosition.quantity as any),
        entryPremiumRate: new Prisma.Decimal(insertPosition.entryPremiumRate as any),
        currentPremiumRate: insertPosition.currentPremiumRate != null ? new Prisma.Decimal(insertPosition.currentPremiumRate as any) : null,
        status: insertPosition.status ?? "open",
        entryTime: insertPosition.entryTime ?? new Date(Date.now() + 9 * 60 * 60 * 1000), // KST 시간으로 저장
        exitTime: insertPosition.exitTime ?? null,
        upbitOrderId: insertPosition.upbitOrderId ?? null,
        binanceOrderId: insertPosition.binanceOrderId ?? null,
        side: insertPosition.side,
        exitPrice: insertPosition.exitPrice != null ? new Prisma.Decimal(insertPosition.exitPrice as any) : null,
        isMock: insertPosition.isMock ?? true, // 기본값: Mock 거래
      },
    });
    return position as Position;
  }

  async updatePosition(
    id: number,
    updateData: Partial<Position>
  ): Promise<Position | undefined> {
    const position = await prisma.position.update({
      where: { id },
      data: { ...(updateData as Prisma.PositionUpdateInput), updatedAt: new Date() },
    });
    return position ?? undefined;
  }

  async closePosition(id: number): Promise<Position | undefined> {
    const now = new Date();
    const position = await prisma.position.update({
      where: { id },
      data: { status: "closed", exitTime: now, updatedAt: now },
    });
    return position ?? undefined;
  }

  /**
   * 사용자의 활성 포지션을 조건에 따라 일괄 청산합니다.
   * - symbol, strategyId, type 필터를 선택적으로 지원합니다.
   */
  async closeAllPositionsByUser(
    userId: string,
    filters?: { symbol?: string; strategyId?: number; type?: string }
  ): Promise<{ count: number }> {
    const where: Prisma.PositionWhereInput = {
      userId: parseInt(userId),
      status: "open",
      ...(filters?.symbol ? { symbol: filters.symbol } : {}),
      ...(filters?.strategyId ? { strategyId: filters.strategyId } : {}),
      ...(filters?.type ? { type: filters.type as any } : {}),
    };

    const now = new Date();
    const result = await prisma.position.updateMany({
      where,
      data: { status: "closed", exitTime: now, updatedAt: now },
    });

    return { count: result.count };
  }

  // Trades
  async getTradesByUserId(
    userId: string,
    limit: number = 50
  ): Promise<Trade[]> {
    return prisma.trade.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { executedAt: "desc" },
      take: limit,
    });
  }

  async getTradesByPositionId(positionId: number): Promise<Trade[]> {
    return prisma.trade.findMany({
      where: { positionId },
      orderBy: { executedAt: "desc" },
    });
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const trade = await prisma.trade.create({
      data: {
        userId: insertTrade.userId,
        positionId: insertTrade.positionId ?? null,
        tradeLogId: insertTrade.tradeLogId ?? null,
        symbol: insertTrade.symbol,
        side: insertTrade.side,
        exchange: insertTrade.exchange,
        quantity: new Prisma.Decimal(insertTrade.quantity as any),
        price: new Prisma.Decimal(insertTrade.price as any),
        fee: new Prisma.Decimal((insertTrade.fee ?? "0") as any),
        orderType: insertTrade.orderType ?? "market",
        exchangeOrderId: insertTrade.exchangeOrderId ?? null,
        exchangeTradeId: insertTrade.exchangeTradeId ?? null,
        executedAt: insertTrade.executedAt ?? new Date(),
      },
    });
    return trade as Trade;
  }

  // TradeLogs
  async createTradeLog(tradeLog: InsertTradeLog): Promise<TradeLog> {
    const log = await prisma.tradeLog.create({
      data: {
        kimp: tradeLog.kimp,
        action: tradeLog.action,
        amount: tradeLog.amount,
        result: tradeLog.result,
      },
    });
    return log as TradeLog;
  }

  async getTradeLogs(limit: number = 50): Promise<TradeLog[]> {
    return prisma.tradeLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  // Trading Strategies
  async getTradingStrategies(userId: string): Promise<TradingStrategy[]> {
    return prisma.tradingStrategy.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTradingStrategiesByUserId(
    userId: string
  ): Promise<TradingStrategy[]> {
    console.log('🔍 거래 전략 조회 시작 - 사용자 ID:', userId);
    try {
      const strategies = await prisma.tradingStrategy.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { createdAt: "desc" },
      });
      console.log('✅ 거래 전략 조회 성공:', strategies.length, '개');
      return strategies;
    } catch (error) {
      console.error('❌ 거래 전략 조회 오류:', error);
      throw error;
    }
  }

  async createOrUpdateTradingStrategy(
    strategy: InsertTradingStrategy
  ): Promise<TradingStrategy> {
    const userId = typeof strategy.userId === 'string' ? parseInt(strategy.userId) : strategy.userId;
    const strategyName = (strategy as any).name || "김치 프리미엄 전략";

    const existing = await prisma.tradingStrategy.findFirst({
      where: { userId, name: strategyName },
    });

    const sanitizeInvestment = (val: any): number => {
      console.log('🔍 [DEBUG] sanitizeInvestment input (createOrUpdate):', val, 'type:', typeof val);

      // null, undefined, 빈 문자열 처리
      if (val == null || val === '') {
        console.log('🔍 [DEBUG] sanitizeInvestment: null/empty input, returning default 0.003');
        return 0.003;
      }

      const n = Number(val);
      console.log('🔍 [DEBUG] sanitizeInvestment: converted to number:', n, 'isFinite:', Number.isFinite(n));

      if (!Number.isFinite(n)) {
        console.log('🔍 [DEBUG] sanitizeInvestment: not finite, returning default 0.003');
        return 0.003;
      }

      if (n < 0) {
        console.log('🔍 [DEBUG] sanitizeInvestment: negative value:', n, 'returning default 0.003');
        return 0.003;
      }

      // 소수점 8자리로 제한 (더 정확한 방법)
      const result = Math.round(n * 100000000) / 100000000;
      console.log('🔍 [DEBUG] sanitizeInvestment result:', result, 'original:', n);

      // 0이 되는 경우를 방지 (매우 작은 값은 최소값으로)
      if (result === 0 && n > 0) {
        console.log('🔍 [DEBUG] Result became 0 but original was positive, using original value');
        return n;
      }

      return result;
    };

    const defaults = {
      strategyType: (strategy as any).strategyType || "positive_kimchi",
      entryRate: new Prisma.Decimal(((strategy as any).entryRate ?? "0.5") as any),
      exitRate: new Prisma.Decimal(((strategy as any).exitRate ?? "0.1") as any),
      toleranceRate: new Prisma.Decimal(((strategy as any).toleranceRate ?? "0.1") as any),
      leverage: (strategy as any).leverage ?? 3,
      investmentAmount: (() => {
        const rawValue = (strategy as any).investmentAmount;
        console.log('🔍 [DEBUG] Raw investmentAmount value:', rawValue, 'type:', typeof rawValue);

        const sanitized = sanitizeInvestment(rawValue);
        console.log('🔍 [DEBUG] Sanitized value:', sanitized, 'type:', typeof sanitized);

        // 실제 값 사용 (테스트용 하드코딩 제거)
        console.log('🔍 [PROD] Using sanitized value:', sanitized, 'type:', typeof sanitized);
        const decimalValue = new Prisma.Decimal(sanitized);
        console.log('🔍 [PROD] Prisma.Decimal result:', decimalValue.toString(), 'type:', typeof decimalValue);
        console.log('🔍 [PROD] Decimal value check - isDecimal:', Prisma.Decimal.isDecimal(decimalValue));
        return decimalValue;
      })(),
      isActive: (strategy as any).isActive ?? true,
      symbol: (strategy as any).symbol ?? "BTC",
      tolerance: new Prisma.Decimal(((strategy as any).tolerance ?? "0.1") as any),
      isAutoTrading: (strategy as any).isAutoTrading ?? false,
      totalTrades: (strategy as any).totalTrades ?? 0,
      successfulTrades: (strategy as any).successfulTrades ?? 0,
      totalProfit: new Prisma.Decimal(((strategy as any).totalProfit ?? "0") as any),
      updatedAt: new Date(),
    };

    console.log('🔍 [DB] Existing strategy found:', existing?.id);

    if (existing) {
      console.log('🔍 [DB] Updating existing strategy...');
      const updated = await prisma.tradingStrategy.update({
        where: { id: existing.id },
        data: { ...defaults, name: strategyName },
      });
      console.log('🔍 [DB] Update result:', {
        id: updated.id,
        investmentAmount: updated.investmentAmount?.toString(),
        name: updated.name
      });
      return updated as TradingStrategy;
    }

    console.log('🔍 [DB] Creating new strategy...');
    const created = await prisma.tradingStrategy.create({
      data: {
        userId,
        name: strategyName,
        ...defaults,
        createdAt: new Date(),
      },
    });
    console.log('🔍 [DB] Create result:', {
      id: created.id,
      investmentAmount: created.investmentAmount?.toString(),
      name: created.name
    });
    return created as TradingStrategy;
  }

  async getTradingStrategy(id: number): Promise<TradingStrategy | undefined> {
    const strategy = await prisma.tradingStrategy.findUnique({ where: { id } });
    return strategy ?? undefined;
  }

  async createTradingStrategy(
    insertStrategy: InsertTradingStrategy
  ): Promise<TradingStrategy> {
    const sanitizeInvestment = (val: any): number => {
      console.log('🔍 [DEBUG] sanitizeInvestment input (create):', val, 'type:', typeof val);

      // null, undefined, 빈 문자열 처리
      if (val == null || val === '') {
        console.log('🔍 [DEBUG] sanitizeInvestment: null/empty input, returning default 0.003');
        return 0.003;
      }

      const n = Number(val);
      console.log('🔍 [DEBUG] sanitizeInvestment: converted to number:', n, 'isFinite:', Number.isFinite(n));

      if (!Number.isFinite(n)) {
        console.log('🔍 [DEBUG] sanitizeInvestment: not finite, returning default 0.003');
        return 0.003;
      }

      if (n < 0) {
        console.log('🔍 [DEBUG] sanitizeInvestment: negative value:', n, 'returning default 0.003');
        return 0.003;
      }

      // 소수점 8자리로 제한 (더 정확한 방법)
      const result = Math.round(n * 100000000) / 100000000;
      console.log('🔍 [DEBUG] sanitizeInvestment result:', result, 'original:', n);

      // 0이 되는 경우를 방지 (매우 작은 값은 최소값으로)
      if (result === 0 && n > 0) {
        console.log('🔍 [DEBUG] Result became 0 but original was positive, using original value');
        return n;
      }

      return result;
    };
    const strategy = await prisma.tradingStrategy.create({
      data: {
        userId: insertStrategy.userId,
        name: (insertStrategy as any).name ?? "김치 프리미엄 전략",
        entryRate: new Prisma.Decimal(((insertStrategy as any).entryRate ?? "0.5") as any),
        exitRate: new Prisma.Decimal(((insertStrategy as any).exitRate ?? "0.1") as any),
        leverage: (insertStrategy as any).leverage ?? 1,
        investmentAmount: (() => {
          const rawValue = (insertStrategy as any).investmentAmount;
          console.log('🔍 [DEBUG] Raw investmentAmount value (create):', rawValue, 'type:', typeof rawValue);

          const sanitized = sanitizeInvestment(rawValue);
          console.log('🔍 [DEBUG] Sanitized value (create):', sanitized, 'type:', typeof sanitized);

          // 실제 값 사용 (테스트용 하드코딩 제거)
          console.log('🔍 [PROD] Using sanitized value (create):', sanitized, 'type:', typeof sanitized);
          const decimalValue = new Prisma.Decimal(sanitized);
          console.log('🔍 [PROD] Prisma.Decimal result (create):', decimalValue.toString(), 'type:', typeof decimalValue);
          console.log('🔍 [PROD] Decimal value check (create) - isDecimal:', Prisma.Decimal.isDecimal(decimalValue));
          return decimalValue;
        })(),
        isActive: (insertStrategy as any).isActive ?? true,
        symbol: (insertStrategy as any).symbol ?? "BTC",
        tolerance: new Prisma.Decimal(((insertStrategy as any).tolerance ?? "0.1") as any),
        isAutoTrading: (insertStrategy as any).isAutoTrading ?? false,
        totalTrades: (insertStrategy as any).totalTrades ?? 0,
        successfulTrades: (insertStrategy as any).successfulTrades ?? 0,
        totalProfit: new Prisma.Decimal(((insertStrategy as any).totalProfit ?? "0") as any),
        strategyType: (insertStrategy as any).strategyType ?? "positive_kimchi",
        toleranceRate: new Prisma.Decimal(((insertStrategy as any).toleranceRate ?? "0.1") as any),
      },
    });
    return strategy as TradingStrategy;
  }

  async updateTradingStrategy(
    id: number,
    updateData: Partial<TradingStrategy>
  ): Promise<TradingStrategy | undefined> {
    const strategy = await prisma.tradingStrategy.update({
      where: { id },
      data: { ...(updateData as Prisma.TradingStrategyUpdateInput), updatedAt: new Date() },
    });
    return strategy ?? undefined;
  }

  async deleteTradingStrategy(
    id: number
  ): Promise<TradingStrategy | undefined> {
    try {
      const deleted = await prisma.tradingStrategy.delete({ where: { id } });
      return deleted as TradingStrategy;
    } catch {
      return undefined;
    }
  }

  // System Alerts
  async getSystemAlerts(limit: number = 50): Promise<SystemAlert[]> {
    return prisma.systemAlert.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async createSystemAlert(
    insertAlert: InsertSystemAlert
  ): Promise<SystemAlert> {
    const alert = await prisma.systemAlert.create({
      data: {
        type: insertAlert.type,
        title: insertAlert.title,
        message: insertAlert.message,
        isRead: insertAlert.isRead ?? false,
        userId: insertAlert.userId ?? null,
        data: insertAlert.data ?? null,
        priority: insertAlert.priority ?? "normal",
      },
    });
    return alert as SystemAlert;
  }

  async markAlertAsRead(id: number): Promise<SystemAlert | undefined> {
    const alert = await prisma.systemAlert.update({
      where: { id },
      data: { isRead: true },
    });
    return alert ?? undefined;
  }
  // Admin methods
  async updateUser(
    id: string,
    updates: Partial<User>
  ): Promise<User | undefined> {
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { ...(updates as Prisma.UserUpdateInput), updatedAt: new Date() },
    });
    return user ?? undefined;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role, updatedAt: new Date() },
    });
    return user ?? undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return prisma.user.findMany();
  }

  async deleteUser(id: string): Promise<boolean> {
    const userId = parseInt(id);
    // 연관 데이터 정리
    await prisma.exchange.deleteMany({ where: { userId } });
    await prisma.tradingSetting.deleteMany({ where: { userId } });
    await prisma.position.deleteMany({ where: { userId } });
    await prisma.trade.deleteMany({ where: { userId } });
    try {
      await prisma.user.delete({ where: { id: userId } });
      return true;
    } catch {
      return false;
    }
  }

  async getAllUsersWithStats(): Promise<any[]> {
    const allUsers = await prisma.user.findMany();

    const usersWithStats = await Promise.all(
      allUsers.map(async (user: User) => {
        const tradesCount = await prisma.trade.count({ where: { userId: user.id } });
        const positionsCount = await prisma.position.count({ where: { userId: user.id } });
        const exchangesCount = await prisma.exchange.count({ where: { userId: user.id } });

        const { password, ...userWithoutPassword } = user as any;
        return {
          ...userWithoutPassword,
          _count: {
            trades: tradesCount,
            positions: positionsCount,
            exchanges: exchangesCount,
          },
        };
      })
    );

    return usersWithStats;
  }

  async getAdminStats(): Promise<any> {
    const [totalUsers, activeUsers, totalTrades, activePositions] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.trade.count(),
      prisma.position.count({ where: { status: "open" } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalTrades,
      activePositions,
      totalVolume: 0,
    };
  }

  // 포지션 조회
  async getPositions(whereClause: any): Promise<Position[]> {
    try {
      console.log('🔍 포지션 조회 시작:', whereClause);
      const positions = await prisma.position.findMany({
        where: whereClause,
        orderBy: { entryTime: 'desc' }
      });
      console.log('✅ 포지션 조회 성공:', positions.length, '개');
      return positions;
    } catch (error) {
      console.error('❌ 포지션 조회 오류:', error);
      throw error;
    }
  }

  // 특정 전략의 최근 포지션 조회 (쿨다운 체크용)
  async getRecentPositionByStrategy(userId: string, strategyId: number, symbol: string = "BTC"): Promise<Position | null> {
    try {
      const position = await prisma.position.findFirst({
        where: {
          userId: parseInt(userId),
          strategyId: strategyId,
          symbol: symbol
        },
        orderBy: { entryTime: 'desc' }
      });
      return position;
    } catch (error) {
      console.error('❌ 최근 포지션 조회 오류:', error);
      return null;
    }
  }

}

export const storage = new DatabaseStorage();
