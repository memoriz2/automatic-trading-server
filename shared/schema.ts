import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(), // 'user' 또는 'admin'
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const exchanges = pgTable(
  "exchanges",
  {
    id: serial("id").primaryKey(),
    exchange: text("exchange").notNull(),
    apiKey: text("api_key").notNull(),
    apiSecret: text("api_secret").notNull(), // secretKey → apiSecret
    isActive: boolean("is_active").default(true),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    passphrase: text("passphrase"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userExchangeUnique: uniqueIndex("exchanges_user_id_exchange_key").on(
      table.userId,
      table.exchange
    ),
  })
);

export const cryptocurrencies = pgTable(
  "cryptocurrencies",
  {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(), // 예: 'BTC'
    name: text("name").notNull(), // 예: 'Bitcoin'
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Drizzle 수준에서 UNIQUE 인덱스 선언 (migrations 시 반영)
    symbolUnique: uniqueIndex("cryptocurrencies_symbol_key").on(table.symbol),
  })
);

export const kimchiPremiums = pgTable("kimchi_premiums", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  upbitPrice: decimal("upbit_price", { precision: 20, scale: 8 }).notNull(),
  binancePrice: decimal("binance_price", { precision: 20, scale: 8 }).notNull(),
  premiumRate: decimal("premium_rate", { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const tradingSettings = pgTable("trading_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  entryPremiumRate: decimal("entry_premium_rate", {
    precision: 10,
    scale: 4,
  }).notNull(),
  exitPremiumRate: decimal("exit_premium_rate", {
    precision: 10,
    scale: 4,
  }).notNull(),
  stopLossRate: decimal("stop_loss_rate", {
    precision: 10,
    scale: 4,
  }).notNull(),
  maxPositions: integer("max_positions").default(5),
  isAutoTrading: boolean("is_auto_trading").default(false),
  maxInvestmentAmount: decimal("max_investment_amount", {
    precision: 20,
    scale: 2,
  }),
  // 새로운 김프 진입 전략 설정값들
  kimchiEntryRate: decimal("kimchi_entry_rate", {
    precision: 10,
    scale: 4,
  }).default("1.0"), // 진입 김프율
  kimchiExitRate: decimal("kimchi_exit_rate", {
    precision: 10,
    scale: 4,
  }).default("0.5"), // 청산 김프율
  kimchiToleranceRate: decimal("kimchi_tolerance_rate", {
    precision: 10,
    scale: 4,
  }).default("0.1"), // 허용 오차 진입 김프율
  binanceLeverage: integer("binance_leverage").default(1), // 바이낸스 레버리지
  upbitEntryAmount: decimal("upbit_entry_amount", {
    precision: 20,
    scale: 2,
  }).default("10000"), // 업비트 기준 진입 금액(KRW)
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  strategyId: integer("strategy_id").references(() => tradingStrategies.id), // 어떤 전략으로 진입했는지
  symbol: text("symbol").notNull(),
  type: text("type").notNull().default("kimchi_arbitrage"),
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }).notNull(),
  currentPrice: decimal("current_price", { precision: 20, scale: 8 }),
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  entryPremiumRate: decimal("entry_premium_rate", {
    precision: 10,
    scale: 4,
  }).notNull(),
  currentPremiumRate: decimal("current_premium_rate", {
    precision: 10,
    scale: 4,
  }),
  status: text("status").notNull().default("open"),
  entryTime: timestamp("entry_time").defaultNow(),
  exitTime: timestamp("exit_time"),
  upbitOrderId: text("upbit_order_id"),
  binanceOrderId: text("binance_order_id"),
  // Prisma 모델과 정합: 추가 필드들
  side: text("side").notNull(),
  exitPrice: decimal("exit_price", { precision: 20, scale: 8 }),
  exitPremiumRate: decimal("exit_premium_rate", { precision: 10, scale: 4 }),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 20, scale: 2 }).default(
    "0"
  ),
  realizedPnl: decimal("realized_pnl", { precision: 20, scale: 2 }).default(
    "0"
  ),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  positionId: integer("position_id").references(() => positions.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // 'buy', 'sell'
  exchange: text("exchange").notNull(), // 'upbit', 'binance'
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0"),
  orderType: text("order_type").default("market"),
  exchangeOrderId: text("exchange_order_id"),
  exchangeTradeId: text("exchange_trade_id"),
  executedAt: timestamp("executed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'success', 'warning', 'error', 'info'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  userId: integer("user_id"),
  data: jsonb("data"),
  priority: text("priority").default("normal"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tradingStrategies = pgTable("trading_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull().default("김치 프리미엄 전략"), // '구간 1', '구간 2', etc.
  strategyType: text("strategy_type").notNull().default("positive_kimchi"), // 'positive_kimchi', 'negative_kimchi'
  entryRate: decimal("entry_rate", { precision: 10, scale: 4 }).notNull().default("0.5"), // 진입 김프율
  exitRate: decimal("exit_rate", { precision: 10, scale: 4 }).notNull().default("0.1"), // 청산 김프율
  toleranceRate: decimal("tolerance_rate", {
    precision: 10,
    scale: 4,
  }).notNull().default("0.1"), // 허용범위
  leverage: integer("leverage").default(3), // 레버리지
  investmentAmount: decimal("investment_amount", {
    precision: 20,
    scale: 2,
  }).notNull().default("100000"), // 투자금액
  isActive: boolean("is_active").default(true), // 활성화 여부
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  symbol: text("symbol").notNull().default("BTC"), // 거래 심볼
  tolerance: decimal("tolerance", { precision: 10, scale: 4 }).default("0.1"), // 허용 오차
  isAutoTrading: boolean("is_auto_trading").default(false), // 자동매매 여부
  totalTrades: integer("total_trades").default(0), // 총 거래 수
  successfulTrades: integer("successful_trades").default(0), // 성공한 거래 수
  totalProfit: decimal("total_profit", { precision: 20, scale: 2 }).default("0"), // 총 수익
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    role: true,
  })
  .extend({
    username: z
      .string()
      .min(3, "사용자명은 최소 3자 이상이어야 합니다")
      .max(20, "사용자명은 20자를 초과할 수 없습니다")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다"
      ),
    password: z
      .string()
      .min(6, "비밀번호는 최소 6자 이상이어야 합니다")
      .max(50, "비밀번호는 50자를 초과할 수 없습니다"),
    role: z.string().default("user"),
  });

export const loginUserSchema = z.object({
  username: z.string().min(1, "사용자명을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export const insertExchangeSchema = createInsertSchema(exchanges).pick({
  exchange: true,
  apiKey: true,
  apiSecret: true,
  userId: true,
});

export const insertCryptocurrencySchema = createInsertSchema(
  cryptocurrencies
).pick({
  symbol: true,
  name: true,
});

export const insertKimchiPremiumSchema = createInsertSchema(
  kimchiPremiums
).pick({
  symbol: true,
  upbitPrice: true,
  binancePrice: true,
  premiumRate: true,
});

export const insertTradingSettingsSchema = createInsertSchema(
  tradingSettings
).pick({
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
  upbitEntryAmount: true,
});

export const insertTradingStrategySchema = createInsertSchema(
  tradingStrategies
).pick({
  userId: true,
  name: true,
  strategyType: true,
  entryRate: true,
  exitRate: true,
  toleranceRate: true,
  leverage: true,
  investmentAmount: true,
  isActive: true,
}).partial({
  name: true,
  strategyType: true,
  entryRate: true,
  exitRate: true,
  toleranceRate: true,
  leverage: true,
  investmentAmount: true,
  isActive: true,
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  userId: true,
  strategyId: true,
  symbol: true,
  type: true,
  side: true,
  status: true,
  entryPrice: true,
  quantity: true,
  entryPremiumRate: true,
  upbitOrderId: true,
  binanceOrderId: true,
});

export const insertTradeSchema = createInsertSchema(trades).pick({
  userId: true,
  positionId: true,
  symbol: true,
  side: true,
  exchange: true,
  quantity: true,
  price: true,
  fee: true,
  orderType: true,
  exchangeOrderId: true,
  exchangeTradeId: true,
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).pick({
  type: true,
  title: true,
  message: true,
  userId: true,
  data: true,
  priority: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertExchange = z.infer<typeof insertExchangeSchema>;
export type Exchange = typeof exchanges.$inferSelect;

export type InsertCryptocurrency = z.infer<typeof insertCryptocurrencySchema>;
export type Cryptocurrency = typeof cryptocurrencies.$inferSelect;

export type InsertKimchiPremium = z.infer<typeof insertKimchiPremiumSchema>;
export type KimchiPremium = typeof kimchiPremiums.$inferSelect;

export type InsertTradingSettings = z.infer<typeof insertTradingSettingsSchema>;
export type TradingSettings = typeof tradingSettings.$inferSelect;

export type InsertTradingStrategy = z.infer<typeof insertTradingStrategySchema>;
export type TradingStrategy = typeof tradingStrategies.$inferSelect;

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
export type SystemAlert = typeof systemAlerts.$inferSelect;
