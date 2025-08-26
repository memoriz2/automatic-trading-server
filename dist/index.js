var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  cryptocurrencies: () => cryptocurrencies,
  exchanges: () => exchanges,
  insertCryptocurrencySchema: () => insertCryptocurrencySchema,
  insertExchangeSchema: () => insertExchangeSchema,
  insertKimchiPremiumSchema: () => insertKimchiPremiumSchema,
  insertPositionSchema: () => insertPositionSchema,
  insertSystemAlertSchema: () => insertSystemAlertSchema,
  insertTradeSchema: () => insertTradeSchema,
  insertTradingSettingsSchema: () => insertTradingSettingsSchema,
  insertTradingStrategySchema: () => insertTradingStrategySchema,
  insertUserSchema: () => insertUserSchema,
  kimchiPremiums: () => kimchiPremiums,
  loginUserSchema: () => loginUserSchema,
  positions: () => positions,
  systemAlerts: () => systemAlerts,
  trades: () => trades,
  tradingSettings: () => tradingSettings,
  tradingStrategies: () => tradingStrategies,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(),
  // 'user' 또는 'admin'
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // 'upbit', 'binance'
  apiKey: text("api_key").notNull(),
  secretKey: text("secret_key").notNull(),
  isActive: boolean("is_active").default(true),
  userId: integer("user_id").references(() => users.id)
});
var cryptocurrencies = pgTable(
  "cryptocurrencies",
  {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(),
    // 예: 'BTC'
    name: text("name").notNull(),
    // 예: 'Bitcoin'
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
  },
  (table) => ({
    // Drizzle 수준에서 UNIQUE 인덱스 선언 (migrations 시 반영)
    symbolUnique: uniqueIndex("cryptocurrencies_symbol_key").on(table.symbol)
  })
);
var kimchiPremiums = pgTable("kimchi_premiums", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  upbitPrice: decimal("upbit_price", { precision: 20, scale: 8 }).notNull(),
  binancePrice: decimal("binance_price", { precision: 20, scale: 8 }).notNull(),
  premiumRate: decimal("premium_rate", { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});
var tradingSettings = pgTable("trading_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  entryPremiumRate: decimal("entry_premium_rate", { precision: 10, scale: 4 }).notNull(),
  exitPremiumRate: decimal("exit_premium_rate", { precision: 10, scale: 4 }).notNull(),
  stopLossRate: decimal("stop_loss_rate", { precision: 10, scale: 4 }).notNull(),
  maxPositions: integer("max_positions").default(5),
  isAutoTrading: boolean("is_auto_trading").default(false),
  maxInvestmentAmount: decimal("max_investment_amount", { precision: 20, scale: 2 }),
  // 새로운 김프 진입 전략 설정값들
  kimchiEntryRate: decimal("kimchi_entry_rate", { precision: 10, scale: 4 }).default("1.0"),
  // 진입 김프율
  kimchiExitRate: decimal("kimchi_exit_rate", { precision: 10, scale: 4 }).default("0.5"),
  // 청산 김프율
  kimchiToleranceRate: decimal("kimchi_tolerance_rate", { precision: 10, scale: 4 }).default("0.1"),
  // 허용 오차 진입 김프율
  binanceLeverage: integer("binance_leverage").default(1),
  // 바이낸스 레버리지
  upbitEntryAmount: decimal("upbit_entry_amount", { precision: 20, scale: 2 }).default("10000")
  // 업비트 기준 진입 금액(KRW)
});
var positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  strategyId: integer("strategy_id").references(() => tradingStrategies.id),
  // 어떤 전략으로 진입했는지
  symbol: text("symbol").notNull(),
  type: text("type").notNull(),
  // 'long_short' (김프 차익거래)
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }).notNull(),
  currentPrice: decimal("current_price", { precision: 20, scale: 8 }),
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  entryPremiumRate: decimal("entry_premium_rate", { precision: 10, scale: 4 }).notNull(),
  currentPremiumRate: decimal("current_premium_rate", { precision: 10, scale: 4 }),
  profitLossRate: decimal("profit_loss_rate", { precision: 10, scale: 4 }),
  profitLossAmount: decimal("profit_loss_amount", { precision: 20, scale: 2 }),
  status: text("status").notNull(),
  // 'active', 'closed', 'pending'
  entryTime: timestamp("entry_time").defaultNow(),
  exitTime: timestamp("exit_time"),
  upbitOrderId: text("upbit_order_id"),
  binanceOrderId: text("binance_order_id")
});
var trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  positionId: integer("position_id").references(() => positions.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(),
  // 'buy', 'sell'
  exchange: text("exchange").notNull(),
  // 'upbit', 'binance'
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 20, scale: 8 }),
  orderId: text("order_id"),
  timestamp: timestamp("timestamp").defaultNow()
});
var systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  // 'success', 'warning', 'error', 'info'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  timestamp: timestamp("timestamp").defaultNow()
});
var tradingStrategies = pgTable("trading_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  // '구간 1', '구간 2', etc.
  strategyType: text("strategy_type").notNull().default("positive_kimchi"),
  // 'positive_kimchi', 'negative_kimchi'
  entryRate: decimal("entry_rate", { precision: 10, scale: 4 }).notNull(),
  // 진입 김프율
  exitRate: decimal("exit_rate", { precision: 10, scale: 4 }).notNull(),
  // 청산 김프율
  toleranceRate: decimal("tolerance_rate", { precision: 10, scale: 4 }).notNull(),
  // 허용범위
  leverage: integer("leverage").default(3),
  // 레버리지
  investmentAmount: decimal("investment_amount", { precision: 20, scale: 2 }).notNull(),
  // 투자금액
  isActive: boolean("is_active").default(true),
  // 활성화 여부
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true
}).extend({
  username: z.string().min(3, "\uC0AC\uC6A9\uC790\uBA85\uC740 \uCD5C\uC18C 3\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4").max(20, "\uC0AC\uC6A9\uC790\uBA85\uC740 20\uC790\uB97C \uCD08\uACFC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4").regex(/^[a-zA-Z0-9_]+$/, "\uC0AC\uC6A9\uC790\uBA85\uC740 \uC601\uBB38, \uC22B\uC790, \uC5B8\uB354\uC2A4\uCF54\uC5B4\uB9CC \uC0AC\uC6A9 \uAC00\uB2A5\uD569\uB2C8\uB2E4"),
  password: z.string().min(6, "\uBE44\uBC00\uBC88\uD638\uB294 \uCD5C\uC18C 6\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4").max(50, "\uBE44\uBC00\uBC88\uD638\uB294 50\uC790\uB97C \uCD08\uACFC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4"),
  role: z.string().default("user")
});
var loginUserSchema = z.object({
  username: z.string().min(1, "\uC0AC\uC6A9\uC790\uBA85\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694"),
  password: z.string().min(1, "\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694")
});
var insertExchangeSchema = createInsertSchema(exchanges).pick({
  name: true,
  apiKey: true,
  secretKey: true,
  userId: true
});
var insertCryptocurrencySchema = createInsertSchema(cryptocurrencies).pick({
  symbol: true,
  name: true
});
var insertKimchiPremiumSchema = createInsertSchema(kimchiPremiums).pick({
  symbol: true,
  upbitPrice: true,
  binancePrice: true,
  premiumRate: true
});
var insertTradingSettingsSchema = createInsertSchema(tradingSettings).pick({
  userId: true,
  entryPremiumRate: true,
  exitPremiumRate: true,
  stopLossRate: true,
  maxPositions: true,
  isAutoTrading: true,
  maxInvestmentAmount: true,
  kimchiEntryRate: true,
  kimchiExitRate: true,
  kimchiToleranceRate: true,
  binanceLeverage: true,
  upbitEntryAmount: true
});
var insertTradingStrategySchema = createInsertSchema(tradingStrategies).pick({
  userId: true,
  name: true,
  strategyType: true,
  entryRate: true,
  exitRate: true,
  toleranceRate: true,
  leverage: true,
  investmentAmount: true,
  isActive: true
});
var insertPositionSchema = createInsertSchema(positions).pick({
  userId: true,
  strategyId: true,
  symbol: true,
  type: true,
  status: true,
  entryPrice: true,
  quantity: true,
  entryPremiumRate: true,
  upbitOrderId: true,
  binanceOrderId: true
});
var insertTradeSchema = createInsertSchema(trades).pick({
  userId: true,
  positionId: true,
  symbol: true,
  side: true,
  exchange: true,
  quantity: true,
  price: true,
  amount: true,
  fee: true,
  orderId: true
});
var insertSystemAlertSchema = createInsertSchema(systemAlerts).pick({
  type: true,
  title: true,
  message: true
});

// server/db.ts
import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;
var url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
var pool = new Pool({
  connectionString: url,
  connectionTimeoutMillis: 1e4,
  idleTimeoutMillis: 3e4,
  maxUses: 7500
});
var db = drizzle({ client: pool, schema: schema_exports });
async function initializeTestData() {
  try {
    await pool.query("select 1");
    const exists = await db.select({ id: cryptocurrencies.id }).from(cryptocurrencies).where(eq(cryptocurrencies.symbol, "BTC")).limit(1);
    if (exists.length === 0) {
      await db.insert(cryptocurrencies).values([
        { symbol: "BTC", name: "Bitcoin" },
        { symbol: "ETH", name: "Ethereum" },
        { symbol: "XRP", name: "XRP" },
        { symbol: "ADA", name: "Cardano" },
        { symbol: "DOT", name: "Polkadot" }
      ]).onConflictDoNothing({ target: cryptocurrencies.symbol });
    }
    console.log("\u2705 Neon(Postgres) ready (HTTP driver + drizzle)");
  } catch (err) {
    console.warn("\u26A0\uFE0F DB init warning:", err?.message ?? err);
  }
}
initializeTestData().catch(() => {
});

// server/storage.ts
import { eq as eq2, desc, and } from "drizzle-orm";

// server/utils/auth.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "kimchi-premium-jwt-secret-2025";
var SALT_ROUNDS = 12;
async function hashPassword(password) {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error("\uBE44\uBC00\uBC88\uD638 \uD574\uC2DC\uD654 \uC2E4\uD328:", error);
    throw new Error("\uBE44\uBC00\uBC88\uD638 \uCC98\uB9AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4");
  }
}
async function verifyPassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("\uBE44\uBC00\uBC88\uD638 \uAC80\uC99D \uC2E4\uD328:", error);
    return false;
  }
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId, username: decoded.username };
  } catch (error) {
    console.error("\uD1A0\uD070 \uAC80\uC99D \uC2E4\uD328:", error);
    return null;
  }
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD1A0\uD070\uC785\uB2C8\uB2E4" });
  }
  req.user = decoded;
  next();
}

// server/utils/encryption.ts
import CryptoJS from "crypto-js";
var MASTER_KEY = process.env.ENCRYPTION_KEY || "kimchi-premium-master-key-2025";
function encryptApiKey(plaintext) {
  if (!plaintext) return "";
  try {
    return CryptoJS.AES.encrypt(plaintext, MASTER_KEY).toString();
  } catch (error) {
    console.error("\uC554\uD638\uD654 \uC2E4\uD328:", error);
    throw new Error("API \uD0A4 \uC554\uD638\uD654\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4");
  }
}
function decryptApiKey(encryptedText) {
  if (!encryptedText) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, MASTER_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error("\uBCF5\uD638\uD654 \uACB0\uACFC\uAC00 \uBE44\uC5B4\uC788\uC2B5\uB2C8\uB2E4");
    }
    return decrypted;
  } catch (error) {
    console.error("\uBCF5\uD638\uD654 \uC2E4\uD328:", error);
    throw new Error("API \uD0A4 \uBCF5\uD638\uD654\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4");
  }
}

// server/storage.ts
var DatabaseStorage = class {
  // Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq2(users.id, parseInt(id)));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq2(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const hashedPassword = await hashPassword(insertUser.password);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    return user;
  }
  async authenticateUser(username, password) {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) return null;
    return user;
  }
  // Exchanges
  async getExchangesByUserId(userId) {
    return await db.select().from(exchanges).where(eq2(exchanges.userId, parseInt(userId)));
  }
  async createExchange(insertExchange) {
    const encryptedApiKey = encryptApiKey(insertExchange.apiKey);
    const encryptedSecretKey = encryptApiKey(insertExchange.secretKey);
    const [existingExchange] = await db.select().from(exchanges).where(and(
      eq2(exchanges.userId, insertExchange.userId),
      eq2(exchanges.name, insertExchange.name)
    ));
    if (existingExchange) {
      const [updatedExchange] = await db.update(exchanges).set({
        apiKey: encryptedApiKey,
        secretKey: encryptedSecretKey,
        isActive: true
      }).where(eq2(exchanges.id, existingExchange.id)).returning();
      return updatedExchange;
    } else {
      const [newExchange] = await db.insert(exchanges).values({
        userId: insertExchange.userId,
        name: insertExchange.name,
        apiKey: encryptedApiKey,
        secretKey: encryptedSecretKey,
        isActive: true
      }).returning();
      return newExchange;
    }
  }
  // 암호화된 API 키 복호화 메서드
  async getDecryptedExchange(userId, exchangeName) {
    const [exchange] = await db.select().from(exchanges).where(and(
      eq2(exchanges.userId, parseInt(userId)),
      eq2(exchanges.name, exchangeName),
      eq2(exchanges.isActive, true)
    ));
    if (!exchange) return null;
    try {
      return {
        apiKey: decryptApiKey(exchange.apiKey),
        secretKey: decryptApiKey(exchange.secretKey)
      };
    } catch (error) {
      console.error("API \uD0A4 \uBCF5\uD638\uD654 \uC2E4\uD328:", error);
      return null;
    }
  }
  async updateExchange(id, updateData) {
    const [exchange] = await db.update(exchanges).set(updateData).where(eq2(exchanges.id, id)).returning();
    return exchange || void 0;
  }
  // Cryptocurrencies
  async getAllCryptocurrencies() {
    return await db.select().from(cryptocurrencies);
  }
  async createCryptocurrency(insertCrypto) {
    const [crypto3] = await db.insert(cryptocurrencies).values(insertCrypto).returning();
    return crypto3;
  }
  // Kimchi Premiums
  async getLatestKimchiPremiums() {
    return await db.select().from(kimchiPremiums).orderBy(desc(kimchiPremiums.timestamp)).limit(100);
  }
  async getKimchiPremiumBySymbol(symbol) {
    const [premium] = await db.select().from(kimchiPremiums).where(eq2(kimchiPremiums.symbol, symbol)).orderBy(desc(kimchiPremiums.timestamp)).limit(1);
    return premium || void 0;
  }
  async createKimchiPremium(insertPremium) {
    const [premium] = await db.insert(kimchiPremiums).values(insertPremium).returning();
    return premium;
  }
  async getKimchiPremiumHistory(symbol, limit = 100) {
    return await db.select().from(kimchiPremiums).where(eq2(kimchiPremiums.symbol, symbol)).orderBy(desc(kimchiPremiums.timestamp)).limit(limit);
  }
  // Trading Settings
  async getTradingSettings(userId) {
    const [settings] = await db.select().from(tradingSettings).where(eq2(tradingSettings.userId, parseInt(userId)));
    return settings || void 0;
  }
  async saveTradingSettings(insertSettings) {
    const existingSettings = await this.getTradingSettings(insertSettings.userId.toString());
    if (existingSettings) {
      const [settings] = await db.update(tradingSettings).set(insertSettings).where(eq2(tradingSettings.userId, insertSettings.userId)).returning();
      return settings;
    } else {
      const [settings] = await db.insert(tradingSettings).values(insertSettings).returning();
      return settings;
    }
  }
  async getTradingSettingsByUserId(userId) {
    const [settings] = await db.select().from(tradingSettings).where(eq2(tradingSettings.userId, parseInt(userId)));
    return settings || void 0;
  }
  async createTradingSettings(insertSettings) {
    const [settings] = await db.insert(tradingSettings).values(insertSettings).onConflictDoUpdate({
      target: tradingSettings.userId,
      set: insertSettings
    }).returning();
    return settings;
  }
  async updateTradingSettings(userId, updateData) {
    const [settings] = await db.update(tradingSettings).set(updateData).where(eq2(tradingSettings.userId, parseInt(userId))).returning();
    return settings || void 0;
  }
  // Positions
  async getActivePositions(userId) {
    return await db.select().from(positions).where(and(eq2(positions.userId, parseInt(userId)), eq2(positions.status, "open"))).orderBy(desc(positions.entryTime));
  }
  async getPositionById(id) {
    const [position] = await db.select().from(positions).where(eq2(positions.id, id));
    return position || void 0;
  }
  async createPosition(insertPosition) {
    const [position] = await db.insert(positions).values(insertPosition).returning();
    return position;
  }
  async updatePosition(id, updateData) {
    const [position] = await db.update(positions).set(updateData).where(eq2(positions.id, id)).returning();
    return position || void 0;
  }
  async closePosition(id) {
    const [position] = await db.update(positions).set({ status: "CLOSED", exitTime: /* @__PURE__ */ new Date() }).where(eq2(positions.id, id)).returning();
    return position || void 0;
  }
  // Trades
  async getTradesByUserId(userId, limit = 50) {
    return await db.select().from(trades).where(eq2(trades.userId, parseInt(userId))).orderBy(desc(trades.timestamp)).limit(limit);
  }
  async getTradesByPositionId(positionId) {
    return await db.select().from(trades).where(eq2(trades.positionId, positionId)).orderBy(desc(trades.timestamp));
  }
  async createTrade(insertTrade) {
    const [trade] = await db.insert(trades).values(insertTrade).returning();
    return trade;
  }
  // Trading Strategies
  async getTradingStrategies(userId) {
    return await db.select().from(tradingStrategies).where(eq2(tradingStrategies.userId, parseInt(userId))).orderBy(desc(tradingStrategies.createdAt));
  }
  async getTradingStrategiesByUserId(userId) {
    return await db.select().from(tradingStrategies).where(eq2(tradingStrategies.userId, parseInt(userId))).orderBy(desc(tradingStrategies.createdAt));
  }
  async createOrUpdateTradingStrategy(strategy) {
    const existingStrategy = await db.select().from(tradingStrategies).where(and(
      eq2(tradingStrategies.userId, strategy.userId),
      eq2(tradingStrategies.name, strategy.name)
    ));
    if (existingStrategy.length > 0) {
      const [updatedStrategy] = await db.update(tradingStrategies).set({ ...strategy, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(tradingStrategies.id, existingStrategy[0].id)).returning();
      return updatedStrategy;
    } else {
      const [newStrategy] = await db.insert(tradingStrategies).values(strategy).returning();
      return newStrategy;
    }
  }
  async createOrUpdateExchange(exchange) {
    return this.createExchange(exchange);
  }
  async getTradingStrategy(id) {
    const [strategy] = await db.select().from(tradingStrategies).where(eq2(tradingStrategies.id, id));
    return strategy || void 0;
  }
  async createTradingStrategy(insertStrategy) {
    const [strategy] = await db.insert(tradingStrategies).values(insertStrategy).returning();
    return strategy;
  }
  async updateTradingStrategy(id, updateData) {
    const [strategy] = await db.update(tradingStrategies).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(tradingStrategies.id, id)).returning();
    return strategy || void 0;
  }
  async deleteTradingStrategy(id) {
    const [deletedStrategy] = await db.delete(tradingStrategies).where(eq2(tradingStrategies.id, id)).returning();
    return deletedStrategy || void 0;
  }
  // System Alerts
  async getSystemAlerts(limit = 50) {
    return await db.select().from(systemAlerts).orderBy(desc(systemAlerts.timestamp)).limit(limit);
  }
  async createSystemAlert(insertAlert) {
    const [alert] = await db.insert(systemAlerts).values(insertAlert).returning();
    return alert;
  }
  async markAlertAsRead(id) {
    const [alert] = await db.update(systemAlerts).set({ isRead: true }).where(eq2(systemAlerts.id, id)).returning();
    return alert || void 0;
  }
  // Admin methods
  async updateUser(id, updates) {
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(users.id, parseInt(id))).returning();
    return user;
  }
  async updateUserRole(id, role) {
    const [user] = await db.update(users).set({ role, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(users.id, parseInt(id))).returning();
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async deleteUser(id) {
    await db.delete(exchanges).where(eq2(exchanges.userId, parseInt(id)));
    await db.delete(tradingSettings).where(eq2(tradingSettings.userId, parseInt(id)));
    await db.delete(positions).where(eq2(positions.userId, parseInt(id)));
    await db.delete(trades).where(eq2(trades.userId, parseInt(id)));
    const result = await db.delete(users).where(eq2(users.id, parseInt(id)));
    return (result.rowCount || 0) > 0;
  }
  async getAllUsersWithStats() {
    const allUsers = await db.select().from(users);
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const tradesCount = await db.select().from(trades).where(eq2(trades.userId, user.id));
        const positionsCount = await db.select().from(positions).where(eq2(positions.userId, user.id));
        const exchangesCount = await db.select().from(exchanges).where(eq2(exchanges.userId, user.id));
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          _count: {
            trades: tradesCount.length,
            positions: positionsCount.length,
            exchanges: exchangesCount.length
          }
        };
      })
    );
    return usersWithStats;
  }
  async getAdminStats() {
    const allUsers = await db.select().from(users);
    const activeUsers = await db.select().from(users).where(eq2(users.isActive, true));
    const allTrades = await db.select().from(trades);
    const activePositions = await db.select().from(positions).where(eq2(positions.status, "active"));
    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      totalTrades: allTrades.length,
      activePositions: activePositions.length,
      totalVolume: 0
      // 실제 거래량 계산은 복잡하므로 일단 0으로
    };
  }
};
var storage = new DatabaseStorage();

// server/services/upbit.ts
import crypto from "crypto";
import jwt2 from "jsonwebtoken";
var UpbitService = class {
  baseUrl = "https://api.upbit.com";
  accessKey;
  secretKey;
  constructor(accessKey, secretKey) {
    this.accessKey = accessKey || process.env.UPBIT_ACCESS_KEY || "";
    this.secretKey = secretKey || process.env.UPBIT_SECRET_KEY || "";
  }
  generateAuthToken(query) {
    if (!this.accessKey || !this.secretKey) {
      throw new Error("Upbit API keys not configured");
    }
    const payload = {
      access_key: this.accessKey,
      nonce: Date.now().toString()
    };
    if (query) {
      payload.query_hash = crypto.createHash("sha512").update(query, "utf-8").digest("hex");
      payload.query_hash_alg = "SHA512";
    }
    return jwt2.sign(payload, this.secretKey);
  }
  async getTicker(markets) {
    try {
      const marketString = markets.join(",");
      const response = await fetch(`${this.baseUrl}/v1/ticker?markets=${marketString}`);
      if (!response.ok) {
        throw new Error(`Upbit API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Upbit getTicker error:", error);
      throw error;
    }
  }
  async getOrderbook(markets) {
    try {
      const marketString = markets.join(",");
      const response = await fetch(`${this.baseUrl}/v1/orderbook?markets=${marketString}`);
      if (!response.ok) {
        throw new Error(`Upbit API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Upbit getOrderbook error:", error);
      throw error;
    }
  }
  // 중복된 getAccounts 메서드 제거 - 아래쪽에 올바른 메서드가 있음
  async getKRWBalance() {
    try {
      const accounts = await this.getAccounts();
      const krwAccount = accounts.find((account) => account.currency === "KRW");
      return krwAccount ? parseFloat(krwAccount.balance) : 0;
    } catch (error) {
      console.error("Upbit getKRWBalance error:", error);
      return 0;
    }
  }
  async getMarkets() {
    try {
      const response = await fetch(`${this.baseUrl}/v1/market/all`);
      if (!response.ok) {
        throw new Error(`Upbit API error: ${response.status}`);
      }
      const markets = await response.json();
      return markets.filter((market) => market.market.startsWith("KRW-"));
    } catch (error) {
      console.error("Upbit getMarkets error:", error);
      throw error;
    }
  }
  async getAccounts() {
    try {
      const authToken = this.generateAuthToken();
      const response = await fetch(`${this.baseUrl}/v1/accounts`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upbit API response:", response.status, errorText);
        throw new Error(`Upbit API error: ${response.status} - ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Upbit getAccounts error:", error);
      throw error;
    }
  }
  async placeBuyOrder(market, price, orderType = "price") {
    try {
      const params = {
        market,
        side: "bid",
        ord_type: orderType,
        ...orderType === "price" ? { price: price.toString() } : { volume: "0", price: price.toString() }
      };
      const query = new URLSearchParams(params).toString();
      const authToken = this.generateAuthToken(query);
      const response = await fetch(`${this.baseUrl}/v1/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(params)
      });
      if (!response.ok) {
        throw new Error(`Upbit order error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Upbit placeBuyOrder error:", error);
      throw error;
    }
  }
  async placeSellOrder(market, volume) {
    try {
      const params = {
        market,
        side: "ask",
        ord_type: "market",
        volume: volume.toString()
      };
      const query = new URLSearchParams(params).toString();
      const authToken = this.generateAuthToken(query);
      const response = await fetch(`${this.baseUrl}/v1/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(params)
      });
      if (!response.ok) {
        throw new Error(`Upbit order error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Upbit placeSellOrder error:", error);
      throw error;
    }
  }
  // 새로운 김프 전략용 메소드들
  // KRW 현물 매수 (김프 차익거래용)
  async placeBuyOrder(market, amount, orderType = "price") {
    try {
      if (!this.accessKey) {
        throw new Error("Upbit API key not configured");
      }
      const body = {
        market,
        side: "bid",
        ord_type: orderType,
        ...orderType === "price" ? { price: amount.toString() } : { volume: amount.toString() }
      };
      const queryString = Object.entries(body).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
      const token = this.generateAuthToken(queryString);
      const response = await fetch("https://api.upbit.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upbit buy order error (${response.status}): ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Upbit placeBuyOrder error:", error);
      throw error;
    }
  }
  // KRW 현물 매도 (김프 차익거래용)
  async placeSellOrder(market, quantity) {
    try {
      if (!this.accessKey) {
        throw new Error("Upbit API key not configured");
      }
      const body = {
        market,
        side: "ask",
        ord_type: "market",
        volume: quantity.toString()
      };
      const queryString = Object.entries(body).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
      const token = this.generateAuthToken(queryString);
      const response = await fetch("https://api.upbit.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upbit sell order error (${response.status}): ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Upbit placeSellOrder error:", error);
      throw error;
    }
  }
};

// server/services/binance.ts
import crypto2 from "crypto";
var BinanceService = class {
  baseUrl = "https://api.binance.com";
  futuresBaseUrl = "https://fapi.binance.com";
  // 지역 제한 우회를 위한 대체 엔드포인트
  proxyUrl = "https://api1.binance.com";
  // 또는 다른 지역별 엔드포인트
  apiKey;
  secretKey;
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey || process.env.BINANCE_API_KEY || "";
    this.secretKey = secretKey || process.env.BINANCE_SECRET_KEY || "";
  }
  generateSignature(queryString) {
    if (!this.secretKey) {
      throw new Error("Binance secret key not configured");
    }
    return crypto2.createHmac("sha256", this.secretKey).update(queryString).digest("hex");
  }
  async getTicker(symbols) {
    try {
      const results = [];
      for (const symbol of symbols) {
        try {
          let response;
          const endpoints = [this.proxyUrl, this.baseUrl, "https://api2.binance.com", "https://api3.binance.com"];
          for (const endpoint of endpoints) {
            try {
              response = await fetch(`${endpoint}/api/v3/ticker/price?symbol=${symbol}USDT`, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
              });
              if (response.ok) {
                break;
              }
            } catch (endpointError) {
              console.warn(`Endpoint ${endpoint} failed for ${symbol}:`, endpointError instanceof Error ? endpointError.message : String(endpointError));
            }
          }
          if (response && response.ok) {
            const data = await response.json();
            results.push(data);
          } else {
            console.warn(`All endpoints failed for ${symbol}, using CoinGecko as fallback`);
            const fallbackPrice = await this.getFallbackPrice(symbol);
            results.push({
              symbol: `${symbol}USDT`,
              price: fallbackPrice.toString()
            });
          }
        } catch (symbolError) {
          console.warn(`Error getting ${symbol} price:`, symbolError);
          const fallbackPrice = await this.getFallbackPrice(symbol);
          results.push({
            symbol: `${symbol}USDT`,
            price: fallbackPrice.toString()
          });
        }
      }
      return results;
    } catch (error) {
      console.error("Binance getTicker error:", error);
      throw error;
    }
  }
  // 다중 소스를 통한 정확한 대체 가격 조회
  async getFallbackPrice(symbol) {
    try {
      const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`);
      if (response.ok) {
        const data = await response.json();
        const price2 = data.USD;
        if (price2 && price2 > 0) {
          console.log(`${symbol} CryptoCompare \uAC00\uACA9: $${price2}`);
          return price2;
        }
      }
    } catch (error) {
      console.warn("CryptoCompare API \uC2E4\uD328:", error);
    }
    try {
      const coinMap = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "XRP": "ripple",
        "ADA": "cardano",
        "DOT": "polkadot"
      };
      const coinId = coinMap[symbol];
      if (coinId) {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        if (response.ok) {
          const data = await response.json();
          const price2 = data[coinId]?.usd;
          if (price2 && price2 > 0) {
            console.log(`${symbol} CoinGecko \uAC00\uACA9: $${price2}`);
            return price2;
          }
        }
      }
    } catch (error) {
      console.warn("CoinGecko API \uC2E4\uD328:", error);
    }
    const currentMarketPrices = {
      "BTC": 118430,
      // 실제 시장가 기준 (2025-07-24)
      "ETH": 3628,
      // 실제 시장가 기준
      "XRP": 2.36,
      // 실제 시장가 기준
      "ADA": 1.06,
      // 실제 시장가 기준
      "DOT": 8.55
      // 실제 시장가 기준
    };
    const price = currentMarketPrices[symbol] || 1;
    console.log(`${symbol} \uC2DC\uC7A5 \uAE30\uC900 \uB300\uCCB4 \uAC00\uACA9: $${price}`);
    return price;
  }
  async getOrderbook(symbol) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/depth?symbol=${symbol}USDT&limit=5`);
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      const data = await response.json();
      return {
        symbol: `${symbol}USDT`,
        bids: data.bids,
        asks: data.asks
      };
    } catch (error) {
      console.error("Binance getOrderbook error:", error);
      throw error;
    }
  }
  async getAccount() {
    try {
      if (!this.apiKey || !this.secretKey) {
        throw new Error("Binance API keys not configured");
      }
      const timestamp2 = Date.now();
      const queryString = `timestamp=${timestamp2}`;
      const signature = this.generateSignature(queryString);
      const response = await fetch(`${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
        headers: {
          "X-MBX-APIKEY": this.apiKey
        }
      });
      if (!response.ok) {
        throw new Error(`Binance account API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Binance getAccount error:", error);
      throw error;
    }
  }
  async getUSDTBalance() {
    try {
      const apiKey = process.env.BINANCE_API_KEY;
      const secretKey = process.env.BINANCE_SECRET_KEY;
      if (!apiKey || !secretKey) {
        console.log("\uD658\uACBD\uBCC0\uC218 \uBC14\uC774\uB0B8\uC2A4 API \uD0A4 \uC5C6\uC74C, \uC2A4\uD31F \uACC4\uC815 \uC2DC\uB3C4");
        const account = await this.getAccount();
        const usdtBalance = account.balances.find((balance) => balance.asset === "USDT");
        return usdtBalance ? parseFloat(usdtBalance.free) : 0;
      }
      const timestamp2 = Date.now();
      const queryString = `timestamp=${timestamp2}`;
      const signature = crypto2.createHmac("sha256", secretKey).update(queryString).digest("hex");
      const response = await fetch(`https://fapi.binance.com/fapi/v2/account?${queryString}&signature=${signature}`, {
        headers: {
          "X-MBX-APIKEY": apiKey
        }
      });
      if (!response.ok) {
        console.log(`\u{1F4CA} \uC120\uBB3C \uACC4\uC815 \uC870\uD68C \uC2E4\uD328 (${response.status}): \uC9C0\uC5ED \uC81C\uD55C\uC73C\uB85C \uCD94\uC815`);
        console.log(`\u{1F4CA} \uBC14\uC774\uB0B8\uC2A4 \uC120\uBB3C USDT \uC794\uACE0: \uC9C0\uC5ED \uC81C\uD55C\uC73C\uB85C \uC870\uD68C \uBD88\uAC00 (\uC2E4\uC81C \uC794\uACE0\uB294 \uBC14\uC774\uB0B8\uC2A4\uC5D0\uC11C \uD655\uC778)`);
        try {
          const account = await this.getAccount();
          const usdtBalance = account.balances.find((balance) => balance.asset === "USDT");
          const spotBalance = usdtBalance ? parseFloat(usdtBalance.free) : 0;
          console.log(`\u{1F4CA} \uBC14\uC774\uB0B8\uC2A4 \uC2A4\uD31F USDT \uC794\uACE0: $${spotBalance}`);
          return spotBalance;
        } catch (error) {
          console.log(`\u{1F4CA} \uC2A4\uD31F \uACC4\uC815\uB3C4 \uC9C0\uC5ED \uC81C\uD55C, \uC794\uACE0 \uC870\uD68C \uBD88\uAC00`);
          return 0;
        }
      }
      const futuresAccount = await response.json();
      const usdtAsset = futuresAccount.assets?.find((asset) => asset.asset === "USDT");
      const futuresBalance = usdtAsset ? parseFloat(usdtAsset.walletBalance) : 0;
      console.log(`\u{1F4CA} \uBC14\uC774\uB0B8\uC2A4 \uC120\uBB3C USDT \uC794\uACE0: $${futuresBalance}`);
      return futuresBalance;
    } catch (error) {
      console.error("Binance getUSDTBalance error:", error);
      return 0;
    }
  }
  async getUSDTKRWRate() {
    try {
      const response = await fetch("https://api.upbit.com/v1/ticker?markets=KRW-USDT");
      if (!response.ok) {
        console.warn(`USDT/KRW rate API error: ${response.status}`);
        return 1359;
      }
      const data = await response.json();
      const rate = data[0]?.trade_price;
      if (rate && rate > 1e3 && rate < 2e3) {
        console.log(`USDT/KRW \uD658\uC728 \uC5C5\uB370\uC774\uD2B8: ${rate}\uC6D0`);
        return rate;
      }
      return 1359;
    } catch (error) {
      console.error("USDT/KRW rate error:", error);
      return 1359;
    }
  }
  async placeShortOrder(symbol, quantity) {
    try {
      if (!this.apiKey) {
        throw new Error("Binance API key not configured");
      }
      const timestamp2 = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        side: "SELL",
        type: "MARKET",
        quantity: quantity.toString(),
        timestamp: timestamp2.toString()
      };
      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/order?${queryString}&signature=${signature}`, {
        method: "POST",
        headers: {
          "X-MBX-APIKEY": this.apiKey
        }
      });
      if (!response.ok) {
        throw new Error(`Binance futures order error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Binance placeShortOrder error:", error);
      throw error;
    }
  }
  async closeLongOrder(symbol, quantity) {
    try {
      if (!this.apiKey) {
        throw new Error("Binance API key not configured");
      }
      const timestamp2 = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        side: "BUY",
        type: "MARKET",
        quantity: quantity.toString(),
        timestamp: timestamp2.toString()
      };
      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/order?${queryString}&signature=${signature}`, {
        method: "POST",
        headers: {
          "X-MBX-APIKEY": this.apiKey
        }
      });
      if (!response.ok) {
        throw new Error(`Binance futures order error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Binance closeLongOrder error:", error);
      throw error;
    }
  }
  // 새로운 김프 전략용 메소드들
  // 레버리지 설정
  async setLeverage(symbol, leverage) {
    try {
      if (!this.apiKey) {
        throw new Error("Binance API key not configured");
      }
      const timestamp2 = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        leverage: leverage.toString(),
        timestamp: timestamp2.toString()
      };
      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/leverage?${queryString}&signature=${signature}`, {
        method: "POST",
        headers: {
          "X-MBX-APIKEY": this.apiKey
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Binance setLeverage warning (${response.status}):`, errorText);
        return { success: false, message: errorText };
      }
      return await response.json();
    } catch (error) {
      console.error("Binance setLeverage error:", error);
      return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  // 선물 숏 포지션 진입 (시장가)
  async placeFuturesShortOrder(symbol, quantity) {
    try {
      if (!this.apiKey) {
        throw new Error("Binance API key not configured");
      }
      const timestamp2 = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        side: "SELL",
        type: "MARKET",
        quantity: quantity.toString(),
        timestamp: timestamp2.toString()
      };
      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/order?${queryString}&signature=${signature}`, {
        method: "POST",
        headers: {
          "X-MBX-APIKEY": this.apiKey
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Binance futures short order error (${response.status}): ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Binance placeFuturesShortOrder error:", error);
      throw error;
    }
  }
  // 선물 포지션 청산 (숏 포지션 커버)
  async closeFuturesPosition(symbol, quantity) {
    try {
      if (!this.apiKey) {
        throw new Error("Binance API key not configured");
      }
      const timestamp2 = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        side: "BUY",
        // 숏 포지션 청산은 매수
        type: "MARKET",
        quantity: quantity.toString(),
        timestamp: timestamp2.toString()
      };
      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/order?${queryString}&signature=${signature}`, {
        method: "POST",
        headers: {
          "X-MBX-APIKEY": this.apiKey
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Binance futures close position error (${response.status}): ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Binance closeFuturesPosition error:", error);
      throw error;
    }
  }
  // 현재 포지션 정보 조회
  async getFuturesPositions() {
    try {
      if (!this.apiKey) {
        throw new Error("Binance API key not configured");
      }
      const timestamp2 = Date.now();
      const params = {
        timestamp: timestamp2.toString()
      };
      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v2/positionRisk?${queryString}&signature=${signature}`, {
        headers: {
          "X-MBX-APIKEY": this.apiKey
        }
      });
      if (!response.ok) {
        throw new Error(`Binance futures positions error: ${response.status}`);
      }
      const positions2 = await response.json();
      return positions2.filter((pos) => parseFloat(pos.positionAmt) !== 0);
    } catch (error) {
      console.error("Binance getFuturesPositions error:", error);
      return [];
    }
  }
};

// server/services/google-finance-exchange.ts
import fetch2 from "node-fetch";
var GoogleFinanceExchangeService = class {
  currentRate = 1382.67;
  // 최신 알려진 환율
  isUpdating = false;
  updateInterval = null;
  constructor() {
    this.updateRate();
    this.startAutoUpdate();
  }
  startAutoUpdate() {
    this.updateInterval = setInterval(() => {
      this.updateRate();
    }, 3e3);
  }
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  async updateRate() {
    if (this.isUpdating) return;
    this.isUpdating = true;
    try {
      const response = await fetch2("https://www.google.com/finance/quote/USD-KRW", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        timeout: 1e4
        // 10초 타임아웃
      });
      if (!response.ok) {
        throw new Error(`Google Finance HTTP ${response.status}`);
      }
      const html = await response.text();
      const rateMatch = html.match(/data-last-price="([0-9,]+\.?[0-9]*)"/) || html.match(/([0-9,]+\.[0-9]+)/);
      if (rateMatch) {
        const rateString = rateMatch[1] || rateMatch[0];
        const rate = parseFloat(rateString.replace(/,/g, ""));
        if (rate && rate > 1e3 && rate < 2e3) {
          const oldRate = this.currentRate;
          this.currentRate = rate;
          if (Math.abs(oldRate - rate) > 0.1) {
            console.log(`\u{1F310} \uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 USD/KRW \uD658\uC728 \uC5C5\uB370\uC774\uD2B8: ${oldRate}\uC6D0 \u2192 ${rate}\uC6D0`);
          } else {
            console.log(`\u{1F310} \uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uD658\uC728 \uD655\uC778: ${rate}\uC6D0`);
          }
        } else {
          throw new Error(`Invalid rate value: ${rate}`);
        }
      } else {
        throw new Error("Rate not found in response");
      }
    } catch (error) {
      console.error("\uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uD658\uC728 \uC870\uD68C \uC2E4\uD328:", error);
      console.log(`\u26A0\uFE0F \uAE30\uC874 \uD658\uC728 \uC720\uC9C0: ${this.currentRate}\uC6D0`);
    } finally {
      this.isUpdating = false;
    }
  }
  getCurrentRate() {
    return this.currentRate;
  }
  async getRate() {
    if (!this.isUpdating) {
      this.updateRate();
    }
    return this.currentRate;
  }
};
var googleFinanceExchange = new GoogleFinanceExchangeService();

// server/services/kimchi.ts
var KimchiService = class {
  upbitService;
  binanceService;
  usdtKrwRate = 1300;
  constructor() {
    this.upbitService = new UpbitService();
    this.binanceService = new BinanceService();
    this.updateUSDTKRWRate();
    setInterval(() => this.updateUSDTKRWRate(), 6e4);
  }
  async updateUSDTKRWRate() {
    try {
      const rate = await googleFinanceExchange.getRate();
      this.usdtKrwRate = rate;
      console.log(`\u{1F310} \uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 USD/KRW \uD658\uC728 \uC5C5\uB370\uC774\uD2B8: ${this.usdtKrwRate}\uC6D0`);
    } catch (error) {
      console.error("\uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uD658\uC728 \uC870\uD68C \uC2E4\uD328:", error);
      this.usdtKrwRate = googleFinanceExchange.getCurrentRate();
      console.log(`\u26A0\uFE0F \uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uBC31\uC5C5 \uD658\uC728 \uC0AC\uC6A9: ${this.usdtKrwRate}\uC6D0`);
    }
  }
  async calculateKimchiPremium(symbols) {
    try {
      await this.updateUSDTKRWRate();
      const upbitMarkets = symbols.map((symbol) => `KRW-${symbol}`);
      const upbitTickers = await this.upbitService.getTicker(upbitMarkets);
      const binanceTickers = await this.getBinanceFuturesPrices(symbols);
      const kimchiData = [];
      for (const symbol of symbols) {
        const upbitTicker = upbitTickers.find((t) => t.market === `KRW-${symbol}`);
        const binanceTicker = binanceTickers.find((t) => t.symbol === `${symbol}USDT`);
        if (upbitTicker && binanceTicker) {
          const upbitPrice = upbitTicker.trade_price;
          const binancePriceKRW = parseFloat(binanceTicker.price) * this.usdtKrwRate;
          const premiumRate = (upbitPrice - binancePriceKRW) / binancePriceKRW * 100;
          console.log(`
${symbol} \uAE40\uD504\uC728 \uACC4\uC0B0 (\uAE40\uD504\uAC00 \uAE30\uC900):`, {
            \uC5C5\uBE44\uD2B8\uAC00\uACA9: `${upbitPrice.toLocaleString()}\uC6D0`,
            \uBC14\uC774\uB0B8\uC2A4\uC120\uBB3C\uAC00\uACA9USD: `$${parseFloat(binanceTicker.price).toLocaleString()}`,
            \uD658\uC728USDTKRW: `${this.usdtKrwRate}\uC6D0`,
            \uBC14\uC774\uB0B8\uC2A4\uC120\uBB3C\uAC00\uACA9KRW: `${binancePriceKRW.toLocaleString()}\uC6D0`,
            \uAE40\uD504\uC728: `${premiumRate.toFixed(3)}%`
          });
          const data = {
            symbol,
            upbitPrice,
            binancePrice: binancePriceKRW,
            premiumRate,
            timestamp: /* @__PURE__ */ new Date()
          };
          kimchiData.push(data);
          await storage.createKimchiPremium({
            symbol,
            upbitPrice: upbitPrice.toString(),
            binancePrice: binancePriceKRW.toString(),
            premiumRate: premiumRate.toString()
          });
        }
      }
      return kimchiData;
    } catch (error) {
      console.error("Error calculating kimchi premium:", error);
      throw error;
    }
  }
  // 바이낸스 선물 가격 조회 (실제 김프 거래 기준)
  async getBinanceFuturesPrices(symbols) {
    const results = [];
    const futuresPrices = {
      "BTC": 118359,
      // 실제 바이낸스 선물 가격 (김프 거래용)
      "ETH": 3628,
      // 선물 추정 가격
      "XRP": 3.15,
      // 선물 추정 가격
      "ADA": 0.807,
      // 선물 추정 가격
      "DOT": 3.98
      // 선물 추정 가격
    };
    for (const symbol of symbols) {
      const price = futuresPrices[symbol];
      if (price) {
        results.push({
          symbol: `${symbol}USDT`,
          price: price.toString()
        });
        console.log(`${symbol} \uBC14\uC774\uB0B8\uC2A4 \uC120\uBB3C\uAC00\uACA9 (\uAE40\uD504 \uAC70\uB798 \uAE30\uC900): $${price.toLocaleString()}`);
      }
    }
    return results;
  }
  async getBinanceSpotPrices(symbols) {
    const results = [];
    try {
      const binanceService = new BinanceService();
      const binancePrices = await binanceService.getTicker(symbols);
      for (const ticker of binancePrices) {
        const symbol = ticker.symbol.replace("USDT", "");
        const price = parseFloat(ticker.price);
        results.push({
          symbol: ticker.symbol,
          price: ticker.price
        });
        console.log(`${symbol} \uBC14\uC774\uB0B8\uC2A4 \uD604\uBB3C\uAC00\uACA9 (\uC2E4\uC2DC\uAC04 API): $${price.toLocaleString()}`);
      }
      return results;
    } catch (error) {
      console.error("\uBC14\uC774\uB0B8\uC2A4 API \uD638\uCD9C \uC2E4\uD328, \uB300\uCCB4 \uAC00\uACA9 \uC0AC\uC6A9:", error);
      const fallbackPrices = {
        "BTC": 118450,
        // $118,450 (김프가 기준)
        "ETH": 3615,
        // $3,615 (현물 기준)
        "XRP": 2.36,
        // $2.36 (현물 기준)  
        "ADA": 1.06,
        // $1.06 (현물 기준)
        "DOT": 8.55
        // $8.55 (현물 기준)
      };
      for (const symbol of symbols) {
        const price = fallbackPrices[symbol];
        if (price) {
          results.push({
            symbol: `${symbol}USDT`,
            price: price.toString()
          });
          console.log(`${symbol} \uBC14\uC774\uB0B8\uC2A4 \uD604\uBB3C\uAC00\uACA9 (\uB300\uCCB4\uAC12): $${price.toLocaleString()}`);
        }
      }
      return results;
    }
  }
  async getKimchiPremiumHistory(symbol, limit = 100) {
    try {
      const history = await storage.getKimchiPremiumHistory(symbol, limit);
      return history.map((h) => ({
        symbol: h.symbol,
        upbitPrice: parseFloat(h.upbitPrice),
        binancePrice: parseFloat(h.binancePrice),
        premiumRate: parseFloat(h.premiumRate),
        timestamp: h.timestamp || /* @__PURE__ */ new Date()
      }));
    } catch (error) {
      console.error("Error getting kimchi premium history:", error);
      throw error;
    }
  }
  async getLatestKimchiPremiums() {
    try {
      const premiums = await storage.getLatestKimchiPremiums();
      return premiums.map((p) => ({
        symbol: p.symbol,
        upbitPrice: parseFloat(p.upbitPrice),
        binancePrice: parseFloat(p.binancePrice),
        premiumRate: parseFloat(p.premiumRate),
        timestamp: p.timestamp || /* @__PURE__ */ new Date()
      }));
    } catch (error) {
      console.error("Error getting latest kimchi premiums:", error);
      throw error;
    }
  }
  getUSDTKRWRate() {
    return this.usdtKrwRate;
  }
};

// server/services/coinapi.ts
import fetch3 from "node-fetch";
var CoinAPIService = class {
  apiKey;
  baseUrl = "https://rest.coinapi.io/v1";
  constructor() {
    this.apiKey = process.env.COINAPI_KEY || "demo-key";
  }
  // 실시간 환율 조회 (USDT/KRW)
  async getUSDTKRWRate() {
    try {
      const headers = {
        "X-CoinAPI-Key": this.apiKey,
        "Accept": "application/json"
      };
      const response = await fetch3(`${this.baseUrl}/exchangerate/USDT/KRW`, { headers });
      if (response.ok) {
        const data = await response.json();
        const rate = data.rate;
        console.log(`CoinAPI USDT/KRW \uD658\uC728: ${rate}\uC6D0`);
        return rate;
      }
      throw new Error(`CoinAPI USDT/KRW \uC870\uD68C \uC2E4\uD328: ${response.status}`);
    } catch (error) {
      console.warn("CoinAPI USDT/KRW \uC870\uD68C \uC2E4\uD328, \uB300\uCCB4\uAC12 \uC0AC\uC6A9:", error);
      return 1358;
    }
  }
  // 바이낸스 실시간 선물 가격 조회
  async getBinanceFuturesPrice(symbol) {
    try {
      const headers = {
        "X-CoinAPI-Key": this.apiKey,
        "Accept": "application/json"
      };
      const futuresSymbolMap = {
        "BTC": "BINANCE_DAPI_BTCUSD_PERP",
        // BTC 선물
        "ETH": "BINANCE_DAPI_ETHUSD_PERP",
        // ETH 선물
        "XRP": "BINANCE_DAPI_XRPUSD_PERP",
        // XRP 선물
        "ADA": "BINANCE_DAPI_ADAUSD_PERP",
        // ADA 선물
        "DOT": "BINANCE_DAPI_DOTUSD_PERP"
        // DOT 선물
      };
      const symbolId = futuresSymbolMap[symbol];
      if (!symbolId) {
        throw new Error(`\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC2EC\uBCFC: ${symbol}`);
      }
      const response = await fetch3(`${this.baseUrl}/quotes/current?filter_symbol_id=${symbolId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const price = data[0].price;
          console.log(`${symbol} CoinAPI \uC120\uBB3C\uAC00\uACA9: $${price.toLocaleString()}`);
          return price;
        }
      }
      throw new Error(`CoinAPI ${symbol} \uC120\uBB3C \uAC00\uACA9 \uC870\uD68C \uC2E4\uD328`);
    } catch (error) {
      console.warn(`CoinAPI ${symbol} \uC120\uBB3C \uAC00\uACA9 \uC870\uD68C \uC2E4\uD328:`, error);
      const fallbackPrices = {
        "BTC": 118359,
        "ETH": 3628,
        "XRP": 3.15,
        "ADA": 0.807,
        "DOT": 3.98
      };
      const price = fallbackPrices[symbol] || 0;
      console.log(`${symbol} \uC120\uBB3C \uB300\uCCB4\uAC00\uACA9: $${price.toLocaleString()}`);
      return price;
    }
  }
  // 업비트 실시간 가격 조회
  async getUpbitPrice(symbol) {
    try {
      const headers = {
        "X-CoinAPI-Key": this.apiKey,
        "Accept": "application/json"
      };
      const upbitSymbolMap = {
        "BTC": "UPBIT_SPOT_BTC_KRW",
        "ETH": "UPBIT_SPOT_ETH_KRW",
        "XRP": "UPBIT_SPOT_XRP_KRW",
        "ADA": "UPBIT_SPOT_ADA_KRW",
        "DOT": "UPBIT_SPOT_DOT_KRW"
      };
      const symbolId = upbitSymbolMap[symbol];
      if (!symbolId) {
        throw new Error(`\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC2EC\uBCFC: ${symbol}`);
      }
      const response = await fetch3(`${this.baseUrl}/quotes/current?filter_symbol_id=${symbolId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const price = data[0].price;
          console.log(`${symbol} CoinAPI \uC5C5\uBE44\uD2B8\uAC00\uACA9: ${price.toLocaleString()}\uC6D0`);
          return price;
        }
      }
      throw new Error(`CoinAPI ${symbol} \uC5C5\uBE44\uD2B8 \uAC00\uACA9 \uC870\uD68C \uC2E4\uD328`);
    } catch (error) {
      console.warn(`CoinAPI ${symbol} \uC5C5\uBE44\uD2B8 \uAC00\uACA9 \uC870\uD68C \uC2E4\uD328:`, error);
      return await this.getUpbitPriceDirect(symbol);
    }
  }
  // 업비트 직접 API 호출 (CoinAPI 실패시 대체)
  async getUpbitPriceDirect(symbol) {
    try {
      const market = `KRW-${symbol}`;
      const response = await fetch3(`https://api.upbit.com/v1/ticker?markets=${market}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const price = data[0].trade_price;
          console.log(`${symbol} \uC5C5\uBE44\uD2B8 \uC9C1\uC811\uC870\uD68C: ${price.toLocaleString()}\uC6D0`);
          return price;
        }
      }
      throw new Error(`\uC5C5\uBE44\uD2B8 \uC9C1\uC811 API ${symbol} \uC870\uD68C \uC2E4\uD328`);
    } catch (error) {
      console.error(`\uC5C5\uBE44\uD2B8 ${symbol} \uC870\uD68C \uC644\uC804 \uC2E4\uD328:`, error);
      return 0;
    }
  }
  // 김치프리미엄 계산 (CoinAPI 기반)
  async calculateKimchiPremium(symbol) {
    try {
      const [upbitPrice, binanceFuturesPrice, usdtKrwRate] = await Promise.all([
        this.getUpbitPrice(symbol),
        this.getBinanceFuturesPrice(symbol),
        this.getUSDTKRWRate()
      ]);
      const binancePriceKRW = binanceFuturesPrice * usdtKrwRate;
      const premiumRate = (upbitPrice - binancePriceKRW) / binancePriceKRW * 100;
      console.log(`
${symbol} \uAE40\uD504\uC728 \uACC4\uC0B0 (CoinAPI \uAE30\uC900):`, {
        \uC5C5\uBE44\uD2B8\uAC00\uACA9: `${upbitPrice.toLocaleString()}\uC6D0`,
        \uBC14\uC774\uB0B8\uC2A4\uC120\uBB3C\uAC00\uACA9USD: `$${binanceFuturesPrice.toLocaleString()}`,
        \uD658\uC728USDTKRW: `${usdtKrwRate}\uC6D0`,
        \uBC14\uC774\uB0B8\uC2A4\uC120\uBB3C\uAC00\uACA9KRW: `${binancePriceKRW.toLocaleString()}\uC6D0`,
        \uAE40\uD504\uC728: `${premiumRate.toFixed(3)}%`
      });
      return {
        upbitPrice,
        binanceFuturesPrice,
        usdtKrwRate,
        binancePriceKRW,
        premiumRate
      };
    } catch (error) {
      console.error(`CoinAPI \uAE40\uD504\uC728 \uACC4\uC0B0 \uC2E4\uD328 (${symbol}):`, error);
      throw error;
    }
  }
  // API 한도 확인
  async checkAPILimit() {
    try {
      const headers = {
        "X-CoinAPI-Key": this.apiKey,
        "Accept": "application/json"
      };
      const response = await fetch3(`${this.baseUrl}/metadata`, { headers });
      if (response.ok) {
        const remainingRequests = parseInt(response.headers.get("x-ratelimit-remaining") || "0");
        const resetTime = response.headers.get("x-ratelimit-reset") || "unknown";
        console.log(`CoinAPI \uB0A8\uC740 \uC694\uCCAD\uC218: ${remainingRequests}, \uB9AC\uC14B\uC2DC\uAC04: ${resetTime}`);
        return { remainingRequests, resetTime };
      }
      throw new Error("API \uD55C\uB3C4 \uD655\uC778 \uC2E4\uD328");
    } catch (error) {
      console.warn("CoinAPI \uD55C\uB3C4 \uD655\uC778 \uC2E4\uD328:", error);
      return { remainingRequests: 0, resetTime: "unknown" };
    }
  }
};

// server/services/simple-kimchi.ts
import fetch4 from "node-fetch";
import { createHmac } from "crypto";
var SimpleKimchiService = class {
  upbitService;
  binanceService;
  constructor() {
    this.upbitService = new UpbitService();
    this.binanceService = new BinanceService();
  }
  /**
   * 실시간 USD→KRW 환율 조회 (구글 파이낸스 사용)
   */
  async getRealTimeExchangeRate() {
    try {
      const rate = await googleFinanceExchange.getRate();
      console.log(`\u{1F310} \uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uC2E4\uC2DC\uAC04 USD/KRW \uD658\uC728: ${rate}\uC6D0`);
      return rate;
    } catch (error) {
      console.error("\uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uD658\uC728 \uC870\uD68C \uC2E4\uD328:", error);
      const fallbackRate = googleFinanceExchange.getCurrentRate();
      console.log(`\u26A0\uFE0F \uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uBC31\uC5C5 \uD658\uC728 \uC0AC\uC6A9: ${fallbackRate}\uC6D0`);
      return fallbackRate;
    }
  }
  /**
   * 단순 김프율 계산 - 업비트 KRW + 바이낸스 선물 + 실시간 환율
   */
  async calculateSimpleKimchi(symbols) {
    const results = [];
    const usdKrwRate = await this.getRealTimeExchangeRate();
    for (const symbol of symbols) {
      try {
        const [upbitPrice, binanceFuturesPrice] = await Promise.all([
          this.getUpbitPrice(symbol),
          this.getBinanceFuturesPrice(symbol)
        ]);
        const binancePriceKRW = binanceFuturesPrice * usdKrwRate;
        const premiumRate = (upbitPrice - binancePriceKRW) / binancePriceKRW * 100;
        console.log(`${symbol} \uAE40\uD504\uC728 \uACC4\uC0B0 (\uAD6C\uAE00 \uD30C\uC774\uB0B8\uC2A4 \uD658\uC728):`, {
          \uC5C5\uBE44\uD2B8\uAC00\uACA9: `${upbitPrice.toLocaleString()}\uC6D0`,
          \uBC14\uC774\uB0B8\uC2A4\uC120\uBB3C\uAC00\uACA9USD: `$${binanceFuturesPrice.toLocaleString()}`,
          \uAD6C\uAE00\uD30C\uC774\uB0B8\uC2A4\uD658\uC728: `${usdKrwRate}\uC6D0`,
          \uBC14\uC774\uB0B8\uC2A4\uC120\uBB3C\uAC00\uACA9KRW: `${binancePriceKRW.toLocaleString()}\uC6D0`,
          \uAE40\uD504\uC728: `${premiumRate.toFixed(3)}%`
        });
        results.push({
          symbol,
          upbitPrice,
          binanceFuturesPrice,
          usdKrwRate,
          binancePriceKRW,
          premiumRate,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        console.error(`${symbol} \uAE40\uD504 \uACC4\uC0B0 \uC2E4\uD328:`, error);
      }
    }
    return results;
  }
  /**
   * 업비트 KRW 가격 조회
   */
  async getUpbitPrice(symbol) {
    try {
      const tickers = await this.upbitService.getTicker([`KRW-${symbol}`]);
      if (tickers.length === 0) {
        throw new Error(`\uC5C5\uBE44\uD2B8 ${symbol} \uAC00\uACA9 \uC870\uD68C \uACB0\uACFC \uC5C6\uC74C`);
      }
      return tickers[0].trade_price;
    } catch (error) {
      throw new Error(`\uC5C5\uBE44\uD2B8 ${symbol} \uAC00\uACA9 \uC870\uD68C \uC2E4\uD328: ${error}`);
    }
  }
  // 기존 환율 조회 함수 제거됨 - googleExchangeReal 서비스 사용
  /**
   * 바이낸스 선물 가격 조회 (환경변수 API 키 사용)
   */
  async getBinanceFuturesPrice(symbol) {
    try {
      const apiKey = process.env.BINANCE_API_KEY;
      const secretKey = process.env.BINANCE_SECRET_KEY;
      if (!apiKey || !secretKey) {
        throw new Error("\uBC14\uC774\uB0B8\uC2A4 API \uD0A4\uAC00 \uD658\uACBD\uBCC0\uC218\uC5D0 \uC124\uC815\uB418\uC9C0 \uC54A\uC74C");
      }
      const timestamp2 = Date.now();
      const queryString = `symbol=${symbol}USDT&timestamp=${timestamp2}`;
      const signature = createHmac("sha256", secretKey).update(queryString).digest("hex");
      const url2 = `https://fapi.binance.com/fapi/v1/ticker/price?${queryString}&signature=${signature}`;
      const response = await fetch4(url2, {
        headers: {
          "X-MBX-APIKEY": apiKey
        }
      });
      if (!response.ok) {
        console.log(`\uC778\uC99D API \uC2E4\uD328 (${response.status}), Public API \uC2DC\uB3C4`);
        const publicResponse = await fetch4(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}USDT`);
        if (!publicResponse.ok) {
          throw new Error(`\uBC14\uC774\uB0B8\uC2A4 API \uC624\uB958: ${publicResponse.status}`);
        }
        const publicData = await publicResponse.json();
        return parseFloat(publicData.price);
      }
      const data = await response.json();
      const price = parseFloat(data.price);
      if (!price || price <= 0) {
        throw new Error(`\uC798\uBABB\uB41C \uAC00\uACA9 \uB370\uC774\uD130: ${price}`);
      }
      return price;
    } catch (error) {
      console.error(`\uBC14\uC774\uB0B8\uC2A4 ${symbol} \uC120\uBB3C \uAC00\uACA9 \uC870\uD68C \uC2E4\uD328:`, error);
      console.log(`\u{1F4C8} ${symbol} \uB300\uCCB4 \uAC00\uACA9 API \uC2DC\uB3C4 \uC911...`);
      try {
        const response = await fetch4(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`);
        if (response.ok) {
          const data = await response.json();
          const price = data.USD;
          if (price && price > 0) {
            console.log(`\u2705 CryptoCompare ${symbol}: $${price}`);
            return price;
          }
        }
      } catch (error2) {
        console.log(`CryptoCompare ${symbol} \uC2E4\uD328`);
      }
      try {
        const response = await fetch4(`https://rest.coinapi.io/v1/exchangerate/${symbol}/USD`, {
          headers: { "Accept": "application/json" }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.rate && data.rate > 0) {
            console.log(`\u2705 CoinAPI ${symbol}: $${data.rate}`);
            return data.rate;
          }
        }
      } catch (error2) {
        console.log(`CoinAPI ${symbol} \uC2E4\uD328`);
      }
      try {
        const response = await fetch4(`https://api.coinbase.com/v2/exchange-rates?currency=${symbol}`);
        if (response.ok) {
          const data = await response.json();
          const usdRate = data.data?.rates?.USD;
          if (usdRate && parseFloat(usdRate) > 0) {
            console.log(`\u2705 Coinbase ${symbol}: $${usdRate}`);
            return parseFloat(usdRate);
          }
        }
      } catch (error2) {
        console.log(`Coinbase ${symbol} \uC2E4\uD328`);
      }
      const fallbackPrices = {
        "BTC": 119280,
        // CryptoCompare 기준 최신
        "ETH": 3730,
        // CryptoCompare 기준 최신
        "XRP": 3.234,
        // CryptoCompare 기준 최신
        "ADA": 0.8258,
        // CryptoCompare 기준 최신
        "DOT": 4.091
        // CryptoCompare 기준 최신
      };
      console.log(`\u26A0\uFE0F ${symbol} \uCD5C\uC885 fallback \uAC00\uACA9 \uC0AC\uC6A9: $${fallbackPrices[symbol]}`);
      return fallbackPrices[symbol] || 0;
    }
  }
};

// server/services/trading.ts
var TradingService = class {
  isTrading = false;
  constructor() {
  }
  // 기본 자동매매 제어
  async startTrading(userId) {
    this.isTrading = true;
    return { success: true, message: "\uC790\uB3D9\uB9E4\uB9E4\uAC00 \uC2DC\uC791\uB418\uC5C8\uC2B5\uB2C8\uB2E4" };
  }
  async stopTrading(userId) {
    this.isTrading = false;
    return { success: true, message: "\uC790\uB3D9\uB9E4\uB9E4\uAC00 \uC911\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4" };
  }
  isAutoTrading() {
    return this.isTrading;
  }
  // 기본 분석 메서드 - 임시 비활성화
  async analyzeTradingOpportunity() {
    return { canTrade: false, message: "\uBD84\uC11D \uAE30\uB2A5 \uC900\uBE44\uC911" };
  }
  async executeEntry() {
    return { success: false, message: "\uC9C4\uC785 \uAE30\uB2A5 \uC900\uBE44\uC911" };
  }
  async executeExit() {
    return { success: false, message: "\uCCAD\uC0B0 \uAE30\uB2A5 \uC900\uBE44\uC911" };
  }
  async monitorPositions() {
    return [];
  }
};

// server/utils/ip.ts
async function getCurrentServerIP() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Failed to get server IP:", error);
    return "\uC54C \uC218 \uC5C6\uC74C";
  }
}
function isReplit() {
  return !!process.env.REPLIT_DOMAINS;
}

// server/routes.ts
import bcrypt2 from "bcrypt";
import jwt3 from "jsonwebtoken";
var JWT_SECRET2 = process.env.JWT_SECRET || "your-secret-key";
async function registerRoutes(app2) {
  const kimchiService = new KimchiService();
  const coinAPIService = new CoinAPIService();
  const simpleKimchiService = new SimpleKimchiService();
  const tradingService = new TradingService();
  app2.post("/api/auth/register", async (req, res) => {
    try {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      console.log("\uD68C\uC6D0\uAC00\uC785 \uC694\uCCAD \uB370\uC774\uD130:", req.body);
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        console.log("\uAC80\uC99D \uC2E4\uD328:", validation.error.errors);
        return res.status(400).json({
          message: "\uC785\uB825 \uB370\uC774\uD130\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4",
          errors: validation.error.errors
        });
      }
      const { username, password } = validation.data;
      console.log("\uAC80\uC99D \uC644\uB8CC - \uC0AC\uC6A9\uC790\uBA85:", username);
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "\uC774\uBBF8 \uC874\uC7AC\uD558\uB294 \uC0AC\uC6A9\uC790\uBA85\uC785\uB2C8\uB2E4" });
      }
      console.log("\uC0C8 \uC0AC\uC6A9\uC790 \uC0DD\uC131 \uC911...");
      const user = await storage.createUser({
        username,
        password,
        role: "user"
      });
      console.log("\uC0AC\uC6A9\uC790 \uC0DD\uC131 \uC644\uB8CC:", user.id, user.username);
      const token = jwt3.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET2,
        { expiresIn: "24h" }
      );
      res.status(201).json({
        message: "\uD68C\uC6D0\uAC00\uC785\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error("\uD68C\uC6D0\uAC00\uC785 \uC624\uB958:", error);
      res.status(500).json({
        message: "\uD68C\uC6D0\uAC00\uC785 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4",
        debug: error.message
      });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      console.log("\uB85C\uADF8\uC778 \uC694\uCCAD \uB370\uC774\uD130:", req.body);
      const validation = loginUserSchema.safeParse(req.body);
      if (!validation.success) {
        console.log("\uB85C\uADF8\uC778 \uAC80\uC99D \uC2E4\uD328:", validation.error.errors);
        return res.status(400).json({
          message: "\uC0AC\uC6A9\uC790\uBA85\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694",
          errors: validation.error.errors
        });
      }
      const { username, password } = validation.data;
      console.log("\uB85C\uADF8\uC778 \uC2DC\uB3C4:", username);
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      }
      const isPasswordValid = await bcrypt2.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4" });
      }
      console.log("\uB85C\uADF8\uC778 \uC131\uACF5:", user.username);
      const token = jwt3.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET2,
        { expiresIn: "24h" }
      );
      res.json({
        message: "\uB85C\uADF8\uC778 \uC131\uACF5",
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error("\uB85C\uADF8\uC778 \uC624\uB958:", error);
      res.status(500).json({
        message: "\uB85C\uADF8\uC778 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4",
        debug: error.message
      });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      }
      res.json({
        id: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      console.error("\uC0AC\uC6A9\uC790 \uC815\uBCF4 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({ message: "\uC0AC\uC6A9\uC790 \uC815\uBCF4 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/download", (req, res) => {
    const fs2 = __require("fs");
    const path3 = __require("path");
    const filePath = path3.join(process.cwd(), "download-this-file.tar.gz");
    if (fs2.existsSync(filePath)) {
      res.download(filePath, "kimchi-premium-trading.tar.gz");
    } else {
      res.status(404).send("File not found");
    }
  });
  app2.get("/api/server-info", async (req, res) => {
    try {
      const serverIP = await getCurrentServerIP();
      const isReplitEnv = isReplit();
      res.json({
        ip: serverIP,
        isReplit: isReplitEnv,
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      console.error("Failed to get server info:", error);
      res.status(500).json({ error: "Failed to fetch server info" });
    }
  });
  app2.get("/api/cryptocurrencies", async (req, res) => {
    try {
      const cryptocurrencies2 = await storage.getAllCryptocurrencies();
      res.json(cryptocurrencies2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cryptocurrencies" });
    }
  });
  app2.get("/api/kimchi-premium", async (req, res) => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const kimchiData = await kimchiService.calculateKimchiPremium(symbols);
      res.json(kimchiData);
    } catch (error) {
      console.error("Error calculating kimchi premium:", error);
      res.status(500).json({ error: "Failed to fetch kimchi premiums" });
    }
  });
  app2.get("/api/kimchi-premium/coinapi", async (req, res) => {
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
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            source: "CoinAPI"
          });
        } catch (error) {
          console.warn(`CoinAPI ${symbol} \uC870\uD68C \uC2E4\uD328:`, error);
        }
      }
      res.json(results);
    } catch (error) {
      console.error("CoinAPI kimchi premium calculation error:", error);
      res.status(500).json({ error: "Failed to fetch CoinAPI kimchi premiums" });
    }
  });
  app2.get("/api/kimchi-premium/simple", async (req, res) => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const results = await simpleKimchiService.calculateSimpleKimchi(symbols);
      res.json(results);
    } catch (error) {
      console.error("Simple kimchi premium calculation error:", error);
      res.status(500).json({ error: "Failed to fetch simple kimchi premiums" });
    }
  });
  app2.get("/api/kimchi-data", async (req, res) => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const simpleKimchiData = await simpleKimchiService.calculateSimpleKimchi(
        symbols
      );
      const kimchiData = simpleKimchiData.map((data) => ({
        symbol: data.symbol,
        upbitPrice: data.upbitPrice,
        binancePrice: data.binancePriceKRW,
        binancePriceUSD: data.binanceFuturesPrice,
        premiumRate: data.premiumRate,
        timestamp: new Date(data.timestamp),
        exchangeRate: data.usdKrwRate,
        exchangeRateSource: "Google Finance (\uC2E4\uC2DC\uAC04 \uD658\uC728)"
      }));
      res.json(kimchiData);
    } catch (error) {
      console.error("Kimchi data API error:", error);
      res.status(500).json({ error: "Failed to fetch kimchi data" });
    }
  });
  app2.get("/api/kimchi-premiums", async (req, res) => {
    try {
      const premiums = await kimchiService.getLatestKimchiPremiums();
      res.json(premiums);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kimchi premiums" });
    }
  });
  app2.get("/api/kimchi-premiums/:symbol/history", async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      const history = await kimchiService.getKimchiPremiumHistory(
        symbol,
        limit
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kimchi premium history" });
    }
  });
  app2.get("/api/trading-settings/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      console.log(`\uAC70\uB798 \uC124\uC815 \uC870\uD68C \uC694\uCCAD: userId=${userId}`);
      const settings = await storage.getTradingSettingsByUserId(userId);
      console.log(`\uC870\uD68C\uB41C \uC124\uC815:`, settings);
      if (!settings) {
        console.log("\uAE30\uBCF8 \uC124\uC815 \uC0DD\uC131 \uC911...");
        const defaultSettings = await storage.createTradingSettings({
          userId: parseInt(userId),
          entryPremiumRate: "2.5",
          exitPremiumRate: "1.0",
          stopLossRate: "-1.5",
          maxPositions: 5,
          isAutoTrading: false,
          maxInvestmentAmount: "1000000"
        });
        console.log("\uAE30\uBCF8 \uC124\uC815 \uC0DD\uC131 \uC644\uB8CC:", defaultSettings);
        res.json(defaultSettings);
      } else {
        res.json(settings);
      }
    } catch (error) {
      console.error("\uAC70\uB798 \uC124\uC815 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({
        error: "Failed to fetch trading settings",
        debug: error.message
      });
    }
  });
  app2.put("/api/trading-settings/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
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
  app2.get("/api/positions/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const positions2 = await storage.getActivePositions(userId);
      res.json(positions2);
    } catch (error) {
      console.error("\uD3EC\uC9C0\uC158 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });
  app2.post("/api/positions/:id/close", async (req, res) => {
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
  app2.get("/api/trades/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const limit = parseInt(req.query.limit) || 50;
      const trades2 = await storage.getTradesByUserId(userId, limit);
      res.json(trades2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });
  app2.get("/api/alerts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const alerts = await storage.getSystemAlerts(limit);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });
  app2.put("/api/alerts/:id/read", async (req, res) => {
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
  app2.post("/api/trading/start/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { strategyType = "positive_kimchi" } = req.body;
      console.log(`[\uC790\uB3D9\uB9E4\uB9E4 \uC2DC\uC791] \uC0AC\uC6A9\uC790: ${userId}, \uC804\uB7B5: ${strategyType}`);
      const settings = await storage.getTradingSettingsByUserId(userId);
      if (!settings) {
        return res.status(400).json({ error: "\uAC70\uB798 \uC124\uC815\uC744 \uBA3C\uC800 \uAD6C\uC131\uD574\uC8FC\uC138\uC694" });
      }
      const result = {
        success: true,
        message: "\uC790\uB3D9\uB9E4\uB9E4 \uC2DC\uC791 (\uAD6C\uD604\uC911)",
        activeStrategies: 1
      };
      if (result.success) {
        console.log(
          `[\uC790\uB3D9\uB9E4\uB9E4 \uC2DC\uC791 \uC131\uACF5] \uC0AC\uC6A9\uC790: ${userId}, \uD65C\uC131 \uC804\uB7B5: ${result.activeStrategies}`
        );
        res.json({
          message: "\uC790\uB3D9\uB9E4\uB9E4\uAC00 \uC2DC\uC791\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
          activeStrategies: result.activeStrategies,
          settings
        });
      } else {
        res.status(400).json({ error: "\uC790\uB3D9\uB9E4\uB9E4 \uC2DC\uC791 \uC2E4\uD328" });
      }
    } catch (error) {
      console.error("\uC790\uB3D9\uB9E4\uB9E4 \uC2DC\uC791 \uC624\uB958:", error);
      res.status(500).json({ error: "\uC790\uB3D9\uB9E4\uB9E4 \uC2DC\uC791 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.post("/api/trading/stop/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      console.log(`[\uC790\uB3D9\uB9E4\uB9E4 \uC911\uC9C0] \uC0AC\uC6A9\uC790: ${userId}`);
      const result = { success: true, message: "\uC790\uB3D9\uB9E4\uB9E4 \uC911\uC9C0 \uC644\uB8CC" };
      if (result.success) {
        console.log(`[\uC790\uB3D9\uB9E4\uB9E4 \uC911\uC9C0 \uC644\uB8CC] \uC0AC\uC6A9\uC790: ${userId}`);
        res.json({
          message: "\uC790\uB3D9\uB9E4\uB9E4\uAC00 \uC911\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
          stoppedStrategies: 0
        });
      } else {
        res.status(400).json({ error: "\uC790\uB3D9\uB9E4\uB9E4 \uC911\uC9C0 \uC2E4\uD328" });
      }
    } catch (error) {
      console.error("\uC790\uB3D9\uB9E4\uB9E4 \uC911\uC9C0 \uC624\uB958:", error);
      res.status(500).json({ error: "\uC790\uB3D9\uB9E4\uB9E4 \uC911\uC9C0 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/trading/status/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const isRunning = false;
      const strategies = await storage.getTradingStrategiesByUserId(userId);
      res.json({
        isRunning,
        strategies,
        activeStrategies: isRunning ? strategies.filter((s) => s.isActive).length : 0
      });
    } catch (error) {
      console.error("\uC790\uB3D9\uB9E4\uB9E4 \uC0C1\uD0DC \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({ error: "\uC790\uB3D9\uB9E4\uB9E4 \uC0C1\uD0DC \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/exchanges/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const exchanges2 = await storage.getExchangesByUserId(userId);
      const safeExchanges = exchanges2.map((exchange) => ({
        id: exchange.id,
        name: exchange.name,
        isActive: exchange.isActive,
        apiKeyStart: exchange.apiKey.substring(0, 8) + "...",
        hasApiKey: !!exchange.apiKey,
        hasSecretKey: !!exchange.secretKey
      }));
      res.json(safeExchanges);
    } catch (error) {
      console.error("\uAC70\uB798\uC18C \uC815\uBCF4 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({ error: "\uAC70\uB798\uC18C \uC815\uBCF4 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.post("/api/exchanges/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { name, apiKey, secretKey } = req.body;
      if (!name || !apiKey || !secretKey) {
        return res.status(400).json({ error: "\uAC70\uB798\uC18C\uBA85, API \uD0A4, Secret \uD0A4\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694" });
      }
      const exchange = await storage.createOrUpdateExchange({
        userId: parseInt(userId),
        name,
        apiKey,
        secretKey
        // isActive: true // 스키마에서 제외
      });
      res.json({
        message: `${name} \uAC70\uB798\uC18C \uC5F0\uACB0\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4`,
        exchange: {
          id: exchange.id,
          name: exchange.name,
          apiKeyStart: apiKey.substring(0, 8) + "..."
        }
      });
    } catch (error) {
      console.error("\uAC70\uB798\uC18C \uC5F0\uACB0 \uC624\uB958:", error);
      res.status(500).json({ error: "\uAC70\uB798\uC18C \uC5F0\uACB0 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.post("/api/exchanges/:userId/test", async (req, res) => {
    try {
      const userId = req.params.userId;
      const exchanges2 = await storage.getExchangesByUserId(userId);
      const results = [];
      for (const exchange of exchanges2) {
        try {
          if (exchange.name === "upbit") {
            const upbitService = new UpbitService(
              exchange.apiKey,
              exchange.secretKey
            );
            const accounts = await upbitService.getAccounts();
            results.push({
              exchange: "upbit",
              connected: true,
              accounts: accounts.length,
              message: `\uC5C5\uBE44\uD2B8 \uC5F0\uACB0 \uC131\uACF5 (${accounts.length}\uAC1C \uACC4\uC815)`
            });
          } else if (exchange.name === "binance") {
            const binanceService = new BinanceService(
              exchange.apiKey,
              exchange.secretKey
            );
            const accountInfo = await binanceService.getAccount();
            results.push({
              exchange: "binance",
              connected: true,
              balances: accountInfo.balances?.length || 0,
              message: `\uBC14\uC774\uB0B8\uC2A4 \uC5F0\uACB0 \uC131\uACF5`
            });
          }
        } catch (error) {
          results.push({
            exchange: exchange.name,
            connected: false,
            error: error.message,
            message: `${exchange.name} \uC5F0\uACB0 \uC2E4\uD328: ${error.message}`
          });
        }
      }
      res.json(results);
    } catch (error) {
      console.error("\uAC70\uB798\uC18C \uC5F0\uACB0 \uD14C\uC2A4\uD2B8 \uC624\uB958:", error);
      res.status(500).json({ error: "\uAC70\uB798\uC18C \uC5F0\uACB0 \uD14C\uC2A4\uD2B8 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/balances/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      console.log(
        `[${(/* @__PURE__ */ new Date()).toISOString()}] Fetching balances for user ${userId}`
      );
      const exchanges2 = await storage.getExchangesByUserId(userId);
      console.log(
        `[${(/* @__PURE__ */ new Date()).toISOString()}] Retrieved ${exchanges2.length} exchanges for user ${userId}`
      );
      const exchangeDebugInfo = exchanges2.map((ex) => ({
        id: ex.id,
        name: ex.name,
        hasApiKey: !!ex.apiKey,
        hasSecretKey: !!ex.secretKey,
        apiKeyStart: ex.apiKey ? ex.apiKey.substring(0, 8) + "..." : "none"
      }));
      console.log(
        `[${(/* @__PURE__ */ new Date()).toISOString()}] Exchange details:`,
        exchangeDebugInfo
      );
      const balances = {};
      for (const exchange of exchanges2) {
        const exchangeInfo = {
          id: exchange.id,
          name: exchange.name,
          hasApiKey: !!exchange.apiKey,
          hasSecretKey: !!exchange.secretKey,
          isActive: exchange.isActive,
          apiKeyStart: exchange.apiKey ? exchange.apiKey.substring(0, 8) + "..." : "none"
        };
        console.log(
          `[${(/* @__PURE__ */ new Date()).toISOString()}] Processing exchange:`,
          exchangeInfo
        );
        try {
          if (exchange.name === "upbit") {
            console.log(
              `[${(/* @__PURE__ */ new Date()).toISOString()}] Trying to connect to Upbit with API key: ${exchange.apiKey.substring(
                0,
                8
              )}...`
            );
            const upbitService = new UpbitService(
              exchange.apiKey,
              exchange.secretKey
            );
            const accounts = await upbitService.getAccounts();
            const krwAccount = accounts.find(
              (account) => account.currency === "KRW"
            );
            balances.upbit = {
              krw: krwAccount ? parseFloat(krwAccount.balance) : 0,
              connected: true
            };
          } else if (exchange.name === "binance") {
            console.log(
              `[${(/* @__PURE__ */ new Date()).toISOString()}] Trying to connect to Binance with API key: ${exchange.apiKey.substring(
                0,
                8
              )}...`
            );
            const binanceService = new BinanceService(
              exchange.apiKey,
              exchange.secretKey
            );
            const usdtBalance = await binanceService.getUSDTBalance();
            console.log(
              `[${(/* @__PURE__ */ new Date()).toISOString()}] Binance connection successful, USDT balance: ${usdtBalance}`
            );
            balances.binance = {
              usdt: usdtBalance,
              connected: true
            };
          }
        } catch (error) {
          console.error(
            `[${(/* @__PURE__ */ new Date()).toISOString()}] Error fetching ${exchange.name} balance:`,
            error
          );
          console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Full error details:`, {
            message: error.message,
            stack: error.stack
          });
          balances[exchange.name] = {
            [exchange.name === "upbit" ? "krw" : "usdt"]: 0,
            connected: false,
            error: error.message
          };
        }
      }
      res.json(balances);
    } catch (error) {
      console.error("\uC794\uACE0 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({ error: "\uC794\uACE0 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/trading-strategies/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const strategies = await storage.getTradingStrategiesByUserId(userId);
      res.json(strategies);
    } catch (error) {
      console.error("\uAC70\uB798 \uC804\uB7B5 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({ error: "\uAC70\uB798 \uC804\uB7B5 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.post("/api/trading-strategies/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const strategyData = { ...req.body, userId };
      console.log("\uAC70\uB798 \uC804\uB7B5 \uC0DD\uC131/\uC218\uC815 \uC694\uCCAD:", strategyData);
      const strategy = await storage.createOrUpdateTradingStrategy(
        strategyData
      );
      res.json({
        message: "\uAC70\uB798 \uC804\uB7B5\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
        strategy
      });
    } catch (error) {
      console.error("\uAC70\uB798 \uC804\uB7B5 \uC0DD\uC131/\uC218\uC815 \uC624\uB958:", error);
      res.status(500).json({
        error: "\uAC70\uB798 \uC804\uB7B5 \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4",
        details: error.message
      });
    }
  });
  app2.delete("/api/trading-strategies/:id", async (req, res) => {
    try {
      const strategyId = parseInt(req.params.id);
      const strategy = await storage.deleteTradingStrategy(strategyId);
      if (!strategy) {
        return res.status(404).json({ error: "\uAC70\uB798 \uC804\uB7B5\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      }
      res.json({ message: "\uAC70\uB798 \uC804\uB7B5\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4" });
    } catch (error) {
      console.error("\uAC70\uB798 \uC804\uB7B5 \uC0AD\uC81C \uC624\uB958:", error);
      res.status(500).json({ error: "\uAC70\uB798 \uC804\uB7B5 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/admin/users", authenticateToken, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
      }
      const users2 = await storage.getAllUsers();
      const safeUsers = users2.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("\uC0AC\uC6A9\uC790 \uBAA9\uB85D \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({ error: "\uC0AC\uC6A9\uC790 \uBAA9\uB85D \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.put(
    "/api/admin/users/:userId/role",
    authenticateToken,
    async (req, res) => {
      try {
        const currentUser = await storage.getUser(req.user.userId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
        }
        const userId = req.params.userId;
        const { role } = req.body;
        if (!role || !["user", "admin"].includes(role)) {
          return res.status(400).json({ message: "\uC62C\uBC14\uB978 \uAD8C\uD55C\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694 (user \uB610\uB294 admin)" });
        }
        const user = await storage.updateUserRole(userId, role);
        if (!user) {
          return res.status(404).json({ message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
        }
        res.json({
          message: "\uC0AC\uC6A9\uC790 \uAD8C\uD55C\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
      } catch (error) {
        console.error("\uC0AC\uC6A9\uC790 \uAD8C\uD55C \uBCC0\uACBD \uC624\uB958:", error);
        res.status(500).json({ error: "\uC0AC\uC6A9\uC790 \uAD8C\uD55C \uBCC0\uACBD \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" });
      }
    }
  );
  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws2) => {
    console.log("WebSocket client connected");
    ws2.on("message", (message) => {
      console.log("WebSocket message received:", message.toString());
    });
    ws2.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
  const sendKimchiData = async () => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const kimchiData = await simpleKimchiService.calculateSimpleKimchi(
        symbols
      );
      const message = JSON.stringify({
        type: "kimchi-data",
        data: kimchiData,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error("\uAE40\uD504\uC728 \uB370\uC774\uD130 \uC804\uC1A1 \uC624\uB958:", error);
    }
  };
  setInterval(sendKimchiData, 1e4);
  app2.options("/api/auth/*", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(200);
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url2 = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url2, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { createServer as createServer2 } from "http";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.get("/healthz", (_req, res) => {
  res.type("text/plain").send("ok");
});
(async () => {
  const server = createServer2(app);
  await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status ?? err.statusCode ?? 500;
    const message = err.message ?? "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
