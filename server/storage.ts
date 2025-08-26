import {
  users,
  exchanges,
  cryptocurrencies,
  kimchiPremiums,
  tradingSettings,
  tradingStrategies,
  positions,
  trades,
  systemAlerts,
  type User,
  type InsertUser,
  type Exchange,
  type InsertExchange,
  type Cryptocurrency,
  type InsertCryptocurrency,
  type KimchiPremium,
  type InsertKimchiPremium,
  type TradingSettings,
  type InsertTradingSettings,
  type TradingStrategy,
  type InsertTradingStrategy,
  type Position,
  type InsertPosition,
  type Trade,
  type InsertTrade,
  type SystemAlert,
  type InsertSystemAlert,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./utils/auth";
import { encryptApiKey, decryptApiKey } from "./utils/encryption";

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

  // System Alerts
  getSystemAlerts(limit?: number): Promise<SystemAlert[]>;
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  markAlertAsRead(id: number): Promise<SystemAlert | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // 비밀번호 해시화
    const hashedPassword = await hashPassword(insertUser.password);

    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
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
    return await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.userId, parseInt(userId)));
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
      const [existingExchange] = await db
        .select()
        .from(exchanges)
        .where(
          and(
            eq(exchanges.userId, insertExchange.userId!),
            eq(exchanges.exchange, insertExchange.exchange)
          )
        );

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

        const [updatedExchange] = await db
          .update(exchanges)
          .set({
            apiKey: encryptedApiKey,
            apiSecret: encryptedSecretKey,
            isActive: true,
          })
          .where(eq(exchanges.id, existingExchange.id))
          .returning();

        console.log(`✅ [${new Date().toISOString()}] 업데이트 완료:`, {
          id: updatedExchange.id,
          userId: updatedExchange.userId,
          exchange: updatedExchange.exchange,
          isActive: updatedExchange.isActive,
          updatedAt: updatedExchange.updatedAt,
        });

        // 업데이트 직후 검증
        const verifyUpdated = await db
          .select()
          .from(exchanges)
          .where(
            and(
              eq(exchanges.userId, insertExchange.userId!),
              eq(exchanges.exchange, insertExchange.exchange)
            )
          );
        console.log(
          `🔎 [${new Date().toISOString()}] 업데이트 직후 재조회 결과:`,
          verifyUpdated
        );

        const totalAfterUpdateRes = await db.execute(
          sql`select count(*)::int as count from "exchanges" where "user_id" = ${insertExchange.userId}`
        );
        console.log(
          `📊 [${new Date().toISOString()}] 사용자별 exchanges 총건수(업데이트 후):`,
          totalAfterUpdateRes
        );

        const connInfoRes = await db.execute(
          sql`select current_database() as db, current_user as usr`
        );
        console.log(`🗄️ [${new Date().toISOString()}] 연결 정보:`, connInfoRes);

        return updatedExchange;
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

        const [newExchange] = await db
          .insert(exchanges)
          .values(insertData)
          .returning();

        console.log(`✅ [${new Date().toISOString()}] 삽입 완료:`, {
          id: newExchange.id,
          userId: newExchange.userId,
          exchange: newExchange.exchange,
          isActive: newExchange.isActive,
          createdAt: newExchange.createdAt,
        });

        // 삽입 직후 검증
        const verifyInserted = await db
          .select()
          .from(exchanges)
          .where(
            and(
              eq(exchanges.userId, insertExchange.userId!),
              eq(exchanges.exchange, insertExchange.exchange)
            )
          );
        console.log(
          `🔎 [${new Date().toISOString()}] 삽입 직후 재조회 결과:`,
          verifyInserted
        );

        const totalAfterInsertRes = await db.execute(
          sql`select count(*)::int as count from "exchanges" where "user_id" = ${insertExchange.userId}`
        );
        console.log(
          `📊 [${new Date().toISOString()}] 사용자별 exchanges 총건수(삽입 후):`,
          totalAfterInsertRes
        );

        const connInfoRes2 = await db.execute(
          sql`select current_database() as db, current_user as usr`
        );
        console.log(
          `🗄️ [${new Date().toISOString()}] 연결 정보:`,
          connInfoRes2
        );

        return newExchange;
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

  // 암호화된 API 키 복호화 메서드
  async getDecryptedExchange(
    userId: string,
    exchangeName: string
  ): Promise<{ apiKey: string; apiSecret: string } | null> {
    const [exchange] = await db
      .select()
      .from(exchanges)
      .where(
        and(
          eq(exchanges.userId, parseInt(userId)),
          eq(exchanges.exchange, exchangeName),
          eq(exchanges.isActive, true)
        )
      );

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
    const [exchange] = await db
      .update(exchanges)
      .set(updateData)
      .where(eq(exchanges.id, id))
      .returning();
    return exchange || undefined;
  }

  // Cryptocurrencies
  async getAllCryptocurrencies(): Promise<Cryptocurrency[]> {
    return await db.select().from(cryptocurrencies);
  }

  async createCryptocurrency(
    insertCrypto: InsertCryptocurrency
  ): Promise<Cryptocurrency> {
    const [crypto] = await db
      .insert(cryptocurrencies)
      .values(insertCrypto)
      .returning();
    return crypto;
  }

  // Kimchi Premiums
  async getLatestKimchiPremiums(): Promise<KimchiPremium[]> {
    return await db
      .select()
      .from(kimchiPremiums)
      .orderBy(desc(kimchiPremiums.timestamp))
      .limit(100);
  }

  async getKimchiPremiumBySymbol(
    symbol: string
  ): Promise<KimchiPremium | undefined> {
    const [premium] = await db
      .select()
      .from(kimchiPremiums)
      .where(eq(kimchiPremiums.symbol, symbol))
      .orderBy(desc(kimchiPremiums.timestamp))
      .limit(1);
    return premium || undefined;
  }

  async createKimchiPremium(
    insertPremium: InsertKimchiPremium
  ): Promise<KimchiPremium> {
    const [premium] = await db
      .insert(kimchiPremiums)
      .values(insertPremium)
      .returning();
    return premium;
  }

  async getKimchiPremiumHistory(
    symbol: string,
    limit: number = 100
  ): Promise<KimchiPremium[]> {
    return await db
      .select()
      .from(kimchiPremiums)
      .where(eq(kimchiPremiums.symbol, symbol))
      .orderBy(desc(kimchiPremiums.timestamp))
      .limit(limit);
  }

  // Trading Settings
  async getTradingSettings(
    userId: string
  ): Promise<TradingSettings | undefined> {
    const [settings] = await db
      .select()
      .from(tradingSettings)
      .where(eq(tradingSettings.userId, parseInt(userId)));
    return settings || undefined;
  }

  async saveTradingSettings(
    insertSettings: InsertTradingSettings
  ): Promise<TradingSettings> {
    // 먼저 기존 설정이 있는지 확인
    const existingSettings = await this.getTradingSettings(
      insertSettings.userId!.toString()
    );

    if (existingSettings) {
      // 기존 설정이 있으면 업데이트
      const [settings] = await db
        .update(tradingSettings)
        .set(insertSettings)
        .where(eq(tradingSettings.userId, insertSettings.userId!))
        .returning();
      return settings;
    } else {
      // 기존 설정이 없으면 새로 생성
      const [settings] = await db
        .insert(tradingSettings)
        .values(insertSettings)
        .returning();
      return settings;
    }
  }

  async getTradingSettingsByUserId(
    userId: string
  ): Promise<TradingSettings | undefined> {
    const [settings] = await db
      .select()
      .from(tradingSettings)
      .where(eq(tradingSettings.userId, parseInt(userId)));
    return settings || undefined;
  }

  async createTradingSettings(
    insertSettings: InsertTradingSettings
  ): Promise<TradingSettings> {
    const [settings] = await db
      .insert(tradingSettings)
      .values(insertSettings)
      .onConflictDoUpdate({
        target: tradingSettings.userId,
        set: insertSettings,
      })
      .returning();
    return settings;
  }

  async updateTradingSettings(
    userId: string,
    updateData: Partial<TradingSettings>
  ): Promise<TradingSettings | undefined> {
    const [settings] = await db
      .update(tradingSettings)
      .set(updateData)
      .where(eq(tradingSettings.userId, parseInt(userId)))
      .returning();
    return settings || undefined;
  }

  // Positions
  async getActivePositions(userId: string): Promise<Position[]> {
    return await db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.userId, parseInt(userId)),
          eq(positions.status, "open")
        )
      )
      .orderBy(desc(positions.entryTime));
  }

  async getPositionById(id: number): Promise<Position | undefined> {
    const [position] = await db
      .select()
      .from(positions)
      .where(eq(positions.id, id));
    return position || undefined;
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const [position] = await db
      .insert(positions)
      .values(insertPosition)
      .returning();
    return position;
  }

  async updatePosition(
    id: number,
    updateData: Partial<Position>
  ): Promise<Position | undefined> {
    const [position] = await db
      .update(positions)
      .set(updateData)
      .where(eq(positions.id, id))
      .returning();
    return position || undefined;
  }

  async closePosition(id: number): Promise<Position | undefined> {
    const [position] = await db
      .update(positions)
      .set({ status: "closed", exitTime: new Date() })
      .where(eq(positions.id, id))
      .returning();
    return position || undefined;
  }

  // Trades
  async getTradesByUserId(
    userId: string,
    limit: number = 50
  ): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.userId, parseInt(userId)))
      .orderBy(desc(trades.executedAt))
      .limit(limit);
  }

  async getTradesByPositionId(positionId: number): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.positionId, positionId))
      .orderBy(desc(trades.executedAt));
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const [trade] = await db.insert(trades).values(insertTrade).returning();
    return trade;
  }

  // Trading Strategies
  async getTradingStrategies(userId: string): Promise<TradingStrategy[]> {
    return await db
      .select()
      .from(tradingStrategies)
      .where(eq(tradingStrategies.userId, parseInt(userId)))
      .orderBy(desc(tradingStrategies.createdAt));
  }

  async getTradingStrategiesByUserId(
    userId: string
  ): Promise<TradingStrategy[]> {
    return await db
      .select()
      .from(tradingStrategies)
      .where(eq(tradingStrategies.userId, parseInt(userId)))
      .orderBy(desc(tradingStrategies.createdAt));
  }

  async createOrUpdateTradingStrategy(
    strategy: InsertTradingStrategy
  ): Promise<TradingStrategy> {
    const existingStrategy = await db
      .select()
      .from(tradingStrategies)
      .where(
        and(
          eq(tradingStrategies.userId, strategy.userId!),
          eq(tradingStrategies.name, strategy.name)
        )
      );

    if (existingStrategy.length > 0) {
      const [updatedStrategy] = await db
        .update(tradingStrategies)
        .set({ ...strategy, updatedAt: new Date() })
        .where(eq(tradingStrategies.id, existingStrategy[0].id))
        .returning();
      return updatedStrategy;
    } else {
      const [newStrategy] = await db
        .insert(tradingStrategies)
        .values(strategy)
        .returning();
      return newStrategy;
    }
  }

  async createOrUpdateExchange(exchange: InsertExchange): Promise<Exchange> {
    return this.createExchange(exchange);
  }

  async getTradingStrategy(id: number): Promise<TradingStrategy | undefined> {
    const [strategy] = await db
      .select()
      .from(tradingStrategies)
      .where(eq(tradingStrategies.id, id));
    return strategy || undefined;
  }

  async createTradingStrategy(
    insertStrategy: InsertTradingStrategy
  ): Promise<TradingStrategy> {
    const [strategy] = await db
      .insert(tradingStrategies)
      .values(insertStrategy)
      .returning();
    return strategy;
  }

  async updateTradingStrategy(
    id: number,
    updateData: Partial<TradingStrategy>
  ): Promise<TradingStrategy | undefined> {
    const [strategy] = await db
      .update(tradingStrategies)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(tradingStrategies.id, id))
      .returning();
    return strategy || undefined;
  }

  async deleteTradingStrategy(
    id: number
  ): Promise<TradingStrategy | undefined> {
    const [deletedStrategy] = await db
      .delete(tradingStrategies)
      .where(eq(tradingStrategies.id, id))
      .returning();
    return deletedStrategy || undefined;
  }

  // System Alerts
  async getSystemAlerts(limit: number = 50): Promise<SystemAlert[]> {
    return await db
      .select()
      .from(systemAlerts)
      .orderBy(desc(systemAlerts.createdAt))
      .limit(limit);
  }

  async createSystemAlert(
    insertAlert: InsertSystemAlert
  ): Promise<SystemAlert> {
    const [alert] = await db
      .insert(systemAlerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async markAlertAsRead(id: number): Promise<SystemAlert | undefined> {
    const [alert] = await db
      .update(systemAlerts)
      .set({ isRead: true })
      .where(eq(systemAlerts.id, id))
      .returning();
    return alert || undefined;
  }
  // Admin methods
  async updateUser(
    id: string,
    updates: Partial<User>
  ): Promise<User | undefined> {
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, parseInt(id)))
      .returning();

    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, parseInt(id)))
      .returning();

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    // 사용자와 관련된 모든 데이터 삭제
    await db.delete(exchanges).where(eq(exchanges.userId, parseInt(id)));
    await db
      .delete(tradingSettings)
      .where(eq(tradingSettings.userId, parseInt(id)));
    await db.delete(positions).where(eq(positions.userId, parseInt(id)));
    await db.delete(trades).where(eq(trades.userId, parseInt(id)));

    const result = await db.delete(users).where(eq(users.id, parseInt(id)));
    return (result.rowCount || 0) > 0;
  }

  async getAllUsersWithStats(): Promise<any[]> {
    const allUsers = await db.select().from(users);

    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const tradesCount = await db
          .select()
          .from(trades)
          .where(eq(trades.userId, user.id));
        const positionsCount = await db
          .select()
          .from(positions)
          .where(eq(positions.userId, user.id));
        const exchangesCount = await db
          .select()
          .from(exchanges)
          .where(eq(exchanges.userId, user.id));

        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          _count: {
            trades: tradesCount.length,
            positions: positionsCount.length,
            exchanges: exchangesCount.length,
          },
        };
      })
    );

    return usersWithStats;
  }

  async getAdminStats(): Promise<any> {
    const allUsers = await db.select().from(users);
    const activeUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true));
    const allTrades = await db.select().from(trades);
    const activePositions = await db
      .select()
      .from(positions)
      .where(eq(positions.status, "active"));

    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      totalTrades: allTrades.length,
      activePositions: activePositions.length,
      totalVolume: 0, // 실제 거래량 계산은 복잡하므로 일단 0으로
    };
  }
}

export const storage = new DatabaseStorage();
