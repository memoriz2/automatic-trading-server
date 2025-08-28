-- CreateTable
CREATE TABLE "public"."TradeLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kimp" DOUBLE PRECISION NOT NULL,
    "action" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "result" TEXT NOT NULL,

    CONSTRAINT "TradeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "email" VARCHAR(100),
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "profile_image_url" VARCHAR(500),
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cryptocurrencies" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upbit_market" VARCHAR(20),
    "binance_symbol" VARCHAR(20),
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cryptocurrencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exchanges" (
    "id" SERIAL NOT NULL,
    "api_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" INTEGER NOT NULL,
    "exchange" VARCHAR(20) NOT NULL,
    "api_secret" TEXT NOT NULL,
    "passphrase" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kimchi_premiums" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "upbit_price" DECIMAL(20,2) NOT NULL,
    "binance_price" DECIMAL(20,2) NOT NULL,
    "premium_rate" DECIMAL(10,4) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exchange_rate" DECIMAL(10,4) NOT NULL,
    "premium_amount" DECIMAL(20,2) NOT NULL,

    CONSTRAINT "kimchi_premiums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."performance_stats" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "successful_trades" INTEGER NOT NULL DEFAULT 0,
    "daily_profit" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "daily_volume" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "win_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avg_profit_per_trade" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "max_drawdown" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."positions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "strategy_id" INTEGER,
    "symbol" VARCHAR(10) NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'kimchi_arbitrage',
    "entry_price" DECIMAL(20,8) NOT NULL,
    "current_price" DECIMAL(20,8),
    "quantity" DECIMAL(20,8) NOT NULL,
    "entry_premium_rate" DECIMAL(10,4) NOT NULL,
    "current_premium_rate" DECIMAL(10,4),
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "entry_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_time" TIMESTAMP(3),
    "upbit_order_id" VARCHAR(100),
    "binance_order_id" VARCHAR(100),
    "side" VARCHAR(10) NOT NULL,
    "exit_price" DECIMAL(20,8),
    "exit_premium_rate" DECIMAL(10,4),
    "unrealized_pnl" DECIMAL(20,2) DEFAULT 0,
    "realized_pnl" DECIMAL(20,2) DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "sid" TEXT NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "public"."system_alerts" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER,
    "data" JSONB,
    "priority" VARCHAR(10) NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trades" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "position_id" INTEGER,
    "symbol" VARCHAR(10) NOT NULL,
    "side" VARCHAR(10) NOT NULL,
    "exchange" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "fee" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "order_type" VARCHAR(20) NOT NULL DEFAULT 'market',
    "exchange_order_id" VARCHAR(100),
    "exchange_trade_id" VARCHAR(100),
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trading_settings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "entry_premium_rate" DECIMAL(10,4) NOT NULL DEFAULT 2.5,
    "exit_premium_rate" DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    "stop_loss_rate" DECIMAL(10,4) NOT NULL DEFAULT -1.5,
    "max_positions" INTEGER NOT NULL DEFAULT 5,
    "is_auto_trading" BOOLEAN NOT NULL DEFAULT false,
    "max_investment_amount" DECIMAL(20,2) NOT NULL DEFAULT 10000000,
    "kimchi_entry_rate" DECIMAL(10,4) NOT NULL DEFAULT 1.1,
    "kimchi_exit_rate" DECIMAL(10,4) NOT NULL DEFAULT 1.5,
    "kimchi_tolerance_rate" DECIMAL(10,4) NOT NULL DEFAULT 0.1,
    "binance_leverage" INTEGER NOT NULL DEFAULT 3,
    "upbit_entry_amount" DECIMAL(20,2) NOT NULL DEFAULT 10000000,
    "daily_loss_limit" DECIMAL(10,2) NOT NULL DEFAULT 500000,
    "max_position_size" DECIMAL(10,2) NOT NULL DEFAULT 2000000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trading_strategies" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "entry_rate" DECIMAL(10,4) NOT NULL,
    "exit_rate" DECIMAL(10,4) NOT NULL,
    "leverage" INTEGER NOT NULL DEFAULT 1,
    "investment_amount" DECIMAL(20,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "tolerance" DECIMAL(10,4) NOT NULL DEFAULT 0.1,
    "is_auto_trading" BOOLEAN NOT NULL DEFAULT false,
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "successful_trades" INTEGER NOT NULL DEFAULT 0,
    "total_profit" DECIMAL(20,2) NOT NULL DEFAULT 0,

    CONSTRAINT "trading_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cryptocurrencies_symbol_key" ON "public"."cryptocurrencies"("symbol");

-- CreateIndex
CREATE INDEX "idx_exchanges_user_exchange" ON "public"."exchanges"("user_id", "exchange");

-- CreateIndex
CREATE INDEX "idx_kimchi_premiums_symbol_time" ON "public"."kimchi_premiums"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "idx_kimchi_premiums_timestamp" ON "public"."kimchi_premiums"("timestamp");

-- CreateIndex
CREATE INDEX "idx_performance_user_date" ON "public"."performance_stats"("user_id", "date");

-- CreateIndex
CREATE INDEX "idx_positions_entry_time" ON "public"."positions"("entry_time");

-- CreateIndex
CREATE INDEX "idx_positions_strategy" ON "public"."positions"("strategy_id");

-- CreateIndex
CREATE INDEX "idx_positions_user_status" ON "public"."positions"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_positions_user_symbol" ON "public"."positions"("user_id", "symbol");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "public"."sessions"("expire");

-- CreateIndex
CREATE INDEX "idx_alerts_created_at" ON "public"."system_alerts"("created_at");

-- CreateIndex
CREATE INDEX "idx_alerts_user_read" ON "public"."system_alerts"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_trades_executed_at" ON "public"."trades"("executed_at");

-- CreateIndex
CREATE INDEX "idx_trades_position" ON "public"."trades"("position_id");

-- CreateIndex
CREATE INDEX "idx_trades_user_symbol" ON "public"."trades"("user_id", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "trading_settings_user_id_key" ON "public"."trading_settings"("user_id");

-- CreateIndex
CREATE INDEX "idx_trading_settings_user_auto" ON "public"."trading_settings"("user_id", "is_auto_trading");

-- CreateIndex
CREATE INDEX "idx_strategies_user_active" ON "public"."trading_strategies"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_strategies_user_symbol" ON "public"."trading_strategies"("user_id", "symbol");
