import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, uniqueIndex, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export var users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").default("user").notNull(), // 'user' 또는 'admin'
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export var exchanges = pgTable("exchanges", {
    id: serial("id").primaryKey(),
    exchange: text("exchange").notNull(),
    apiKey: text("api_key").notNull(),
    apiSecret: text("api_secret").notNull(), // secretKey → apiSecret
    isActive: boolean("is_active").default(true),
    userId: integer("user_id")
        .notNull()
        .references(function () { return users.id; }),
    passphrase: text("passphrase"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, function (table) { return ({
    userExchangeUnique: uniqueIndex("exchanges_user_id_exchange_key").on(table.userId, table.exchange),
}); });
export var cryptocurrencies = pgTable("cryptocurrencies", {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(), // 예: 'BTC'
    name: text("name").notNull(), // 예: 'Bitcoin'
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, function (table) { return ({
    // Drizzle 수준에서 UNIQUE 인덱스 선언 (migrations 시 반영)
    symbolUnique: uniqueIndex("cryptocurrencies_symbol_key").on(table.symbol),
}); });
export var kimchiPremiums = pgTable("kimchi_premiums", {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(),
    upbitPrice: decimal("upbit_price", { precision: 20, scale: 8 }).notNull(),
    binancePrice: decimal("binance_price", { precision: 20, scale: 8 }).notNull(),
    premiumRate: decimal("premium_rate", { precision: 10, scale: 4 }).notNull(),
    timestamp: timestamp("timestamp").defaultNow(),
});
export var tradingSettings = pgTable("trading_settings", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(function () { return users.id; }).notNull(),
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
export var positions = pgTable("positions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(function () { return users.id; }),
    strategyId: integer("strategy_id").references(function () { return tradingStrategies.id; }), // 어떤 전략으로 진입했는지
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
    unrealizedPnl: decimal("unrealized_pnl", { precision: 20, scale: 2 }).default("0"),
    realizedPnl: decimal("realized_pnl", { precision: 20, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export var trades = pgTable("trades", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(function () { return users.id; }),
    positionId: integer("position_id").references(function () { return positions.id; }),
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
export var systemAlerts = pgTable("system_alerts", {
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
export var tradingStrategies = pgTable("trading_strategies", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(function () { return users.id; }).notNull(),
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
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(function () { return new Date(); }),
    symbol: text("symbol").notNull().default("BTC"), // 거래 심볼
    tolerance: decimal("tolerance", { precision: 10, scale: 4 }).default("0.1"), // 허용 오차
    isAutoTrading: boolean("is_auto_trading").default(false), // 자동매매 여부
    totalTrades: integer("total_trades").default(0), // 총 거래 수
    successfulTrades: integer("successful_trades").default(0), // 성공한 거래 수
    totalProfit: decimal("total_profit", { precision: 20, scale: 2 }).default("0"), // 총 수익
});
// Insert schemas
export var insertUserSchema = createInsertSchema(users, {
    username: z
        .string()
        .min(3, "사용자명은 최소 3자 이상이어야 합니다")
        .max(20, "사용자명은 20자를 초과할 수 없습니다")
        .regex(/^[a-zA-Z0-9_]+$/, "사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다"),
    password: z
        .string()
        .min(6, "비밀번호는 최소 6자 이상이어야 합니다")
        .max(50, "비밀번호는 50자를 초과할 수 없습니다"),
    role: z.string().default("user"),
});
export var loginUserSchema = z.object({
    username: z.string().min(1, "사용자명을 입력해주세요"),
    password: z.string().min(1, "비밀번호를 입력해주세요"),
});
export var insertExchangeSchema = createInsertSchema(exchanges, {
    exchange: z.string(),
    apiKey: z.string(),
    apiSecret: z.string(),
    userId: z.number(),
});
export var insertCryptocurrencySchema = createInsertSchema(cryptocurrencies, {
    symbol: z.string(),
    name: z.string(),
});
export var insertKimchiPremiumSchema = createInsertSchema(kimchiPremiums, {
    symbol: z.string(),
    upbitPrice: z.string(),
    binancePrice: z.string(),
    premiumRate: z.string(),
});
export var insertTradingSettingsSchema = createInsertSchema(tradingSettings, {
    userId: z.number(),
    entryPremiumRate: z.string(),
    exitPremiumRate: z.string(),
    stopLossRate: z.string(),
    maxPositions: z.number().optional(),
    isAutoTrading: z.boolean().optional(),
    maxInvestmentAmount: z.string().optional(),
    kimchiEntryRate: z.string().optional(),
    kimchiExitRate: z.string().optional(),
    kimchiToleranceRate: z.string().optional(),
    binanceLeverage: z.number().optional(),
    upbitEntryAmount: z.string().optional(),
});
export var insertTradingStrategySchema = createInsertSchema(tradingStrategies)
    .partial()
    .extend({
    userId: z.number(),
});
export var insertPositionSchema = createInsertSchema(positions, {
    userId: z.number(),
    strategyId: z.number(),
    symbol: z.string(),
    type: z.string(),
    side: z.string(),
    status: z.string(),
    entryPrice: z.string(),
    quantity: z.string(),
    entryPremiumRate: z.string(),
    upbitOrderId: z.string().optional(),
    binanceOrderId: z.string().optional(),
});
export var insertTradeSchema = createInsertSchema(trades, {
    userId: z.number(),
    positionId: z.number(),
    symbol: z.string(),
    side: z.string(),
    exchange: z.string(),
    quantity: z.string(),
    price: z.string(),
    fee: z.string().optional(),
    orderType: z.string().optional(),
    exchangeOrderId: z.string().optional(),
    exchangeTradeId: z.string().optional(),
});
export var insertSystemAlertSchema = createInsertSchema(systemAlerts, {
    type: z.string(),
    title: z.string(),
    message: z.string(),
    userId: z.number().optional(),
    data: z.any().optional(),
    priority: z.string().optional(),
});
