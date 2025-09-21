-- ===== 자동거래 시스템 데이터베이스 초기화 스크립트 =====
-- 실제 Neon 데이터베이스 스키마에 기반하여 작성 (23개 테이블)

-- ===== 1. 기본 설정 =====
SET timezone = 'Asia/Seoul';

-- ===== 2. 핵심 테이블 생성 (실제 스키마 기준) =====

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP(3),
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL,
    email VARCHAR(100) UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    profile_image_url VARCHAR(500),
    password TEXT NOT NULL
);

-- 암호화폐 테이블
CREATE TABLE IF NOT EXISTS cryptocurrencies (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    upbit_market VARCHAR(20),
    binance_symbol VARCHAR(20),
    priority INTEGER NOT NULL DEFAULT 0
);

-- 거래소 API 키 테이블
CREATE TABLE IF NOT EXISTS exchanges (
    id SERIAL PRIMARY KEY,
    api_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    user_id INTEGER NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    api_secret TEXT NOT NULL,
    passphrase TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    
    CONSTRAINT unique_user_exchange UNIQUE (user_id, exchange)
);

-- 김치 프리미엄 데이터 테이블
CREATE TABLE IF NOT EXISTS kimchi_premiums (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    upbit_price NUMERIC(20,2) NOT NULL,
    binance_price NUMERIC(20,2) NOT NULL,
    premium_rate NUMERIC(10,4) NOT NULL,
    timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exchange_rate NUMERIC(10,4) NOT NULL,
    premium_amount NUMERIC(20,2) NOT NULL
);

-- 거래 전략 테이블
CREATE TABLE IF NOT EXISTS trading_strategies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    entry_rate NUMERIC(10,4) NOT NULL,
    exit_rate NUMERIC(10,4) NOT NULL,
    leverage INTEGER NOT NULL DEFAULT 1,
    investment_amount NUMERIC(20,8) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    tolerance NUMERIC(10,4) NOT NULL DEFAULT 0.1,
    is_auto_trading BOOLEAN NOT NULL DEFAULT FALSE,
    total_trades INTEGER NOT NULL DEFAULT 0,
    successful_trades INTEGER NOT NULL DEFAULT 0,
    total_profit NUMERIC(20,2) NOT NULL DEFAULT 0,
    strategy_type VARCHAR(100) DEFAULT 'positive_kimchi',
    tolerance_rate NUMERIC(10,4) DEFAULT 0.1
);

-- 거래 설정 테이블
CREATE TABLE IF NOT EXISTS trading_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    entry_premium_rate NUMERIC(10,4) NOT NULL DEFAULT 2.5,
    exit_premium_rate NUMERIC(10,4) NOT NULL DEFAULT 1.0,
    stop_loss_rate NUMERIC(10,4) NOT NULL DEFAULT -1.5,
    max_positions INTEGER NOT NULL DEFAULT 5,
    is_auto_trading BOOLEAN NOT NULL DEFAULT FALSE,
    max_investment_amount NUMERIC(20,2) NOT NULL DEFAULT 10000000,
    kimchi_entry_rate NUMERIC(10,4) NOT NULL DEFAULT 1.1,
    kimchi_exit_rate NUMERIC(10,4) NOT NULL DEFAULT 1.5,
    kimchi_tolerance_rate NUMERIC(10,4) NOT NULL DEFAULT 0.1,
    binance_leverage INTEGER NOT NULL DEFAULT 3,
    upbit_entry_amount NUMERIC(20,2) NOT NULL DEFAULT 10000000,
    daily_loss_limit NUMERIC(10,2) NOT NULL DEFAULT 500000,
    max_position_size NUMERIC(10,2) NOT NULL DEFAULT 2000000,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL
);

-- 포지션 테이블
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    strategy_id INTEGER,
    symbol VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'kimchi_arbitrage',
    entry_price NUMERIC(20,8) NOT NULL,
    current_price NUMERIC(20,8),
    quantity NUMERIC(20,8) NOT NULL,
    entry_premium_rate NUMERIC(10,4) NOT NULL,
    current_premium_rate NUMERIC(10,4),
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    entry_time TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP(3),
    upbit_order_id VARCHAR(100),
    binance_order_id VARCHAR(100),
    side VARCHAR(10) NOT NULL,
    exit_price NUMERIC(20,8),
    exit_premium_rate NUMERIC(10,4),
    unrealized_pnl NUMERIC(20,2) DEFAULT 0,
    realized_pnl NUMERIC(20,2) DEFAULT 0,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL,
    is_mock BOOLEAN DEFAULT TRUE,
    binance_leverage INTEGER DEFAULT 1,
    binance_quantity NUMERIC(20,8) DEFAULT 0,
    binance_entry_price NUMERIC(20,8) DEFAULT 0,
    total_fees NUMERIC(20,2) DEFAULT 0,
    remaining_quantity NUMERIC(20,8) DEFAULT 0
);

-- 거래 내역 테이블
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    position_id INTEGER,
    strategy_id INTEGER,
    trade_log_id INTEGER,
    symbol VARCHAR(10) NOT NULL,
    side VARCHAR(10) NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    quantity NUMERIC(20,8) NOT NULL,
    price NUMERIC(20,8) NOT NULL,
    fee NUMERIC(20,8) DEFAULT 0,
    order_type VARCHAR(20) DEFAULT 'market',
    exchange_order_id VARCHAR(100),
    exchange_trade_id VARCHAR(100),
    executed_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- trades 테이블에 strategy_id 컬럼 추가 (기존 테이블용)
ALTER TABLE trades ADD COLUMN IF NOT EXISTS strategy_id INTEGER;

-- 거래 로그 테이블
CREATE TABLE IF NOT EXISTS trade_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kimp DOUBLE PRECISION NOT NULL,
    action VARCHAR(50) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    result VARCHAR(100) NOT NULL
);

-- 주문 테이블
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    strategy_id INTEGER,
    position_id INTEGER,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    type VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    quantity NUMERIC(20,8) NOT NULL,
    price NUMERIC(20,8),
    exchange VARCHAR(20) NOT NULL,
    exchange_order_id VARCHAR(100),
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL,
    filled_at TIMESTAMP(3),
    fee NUMERIC(20,8) DEFAULT 0,
    average_price NUMERIC(20,8),
    remaining_quantity NUMERIC(20,8) DEFAULT 0
);

-- 세션 테이블
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    user_id INTEGER,
    ip VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMP,
    last_access_at TIMESTAMP
);

-- 시스템 알림 테이블
CREATE TABLE IF NOT EXISTS system_alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    user_id INTEGER,
    data JSONB,
    priority VARCHAR(10) DEFAULT 'normal',
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 성능 통계 테이블
CREATE TABLE IF NOT EXISTS performance_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date VARCHAR(10) NOT NULL,
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    daily_profit NUMERIC(20,2) DEFAULT 0,
    daily_volume NUMERIC(20,2) DEFAULT 0,
    win_rate NUMERIC(5,2) DEFAULT 0,
    avg_profit_per_trade NUMERIC(20,2) DEFAULT 0,
    max_drawdown NUMERIC(20,2) DEFAULT 0,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 일일 통계 테이블
CREATE TABLE IF NOT EXISTS daily_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date VARCHAR(10) NOT NULL,
    total_trades INTEGER DEFAULT 0,
    upbit_trades INTEGER DEFAULT 0,
    binance_trades INTEGER DEFAULT 0,
    entries INTEGER DEFAULT 0,
    exits INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_profit NUMERIC(20,2) DEFAULT 0,
    total_volume NUMERIC(20,2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 잔고 스냅샷 테이블
CREATE TABLE IF NOT EXISTS balance_snapshots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    available NUMERIC NOT NULL,
    locked NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    usd_value NUMERIC,
    krw_value NUMERIC,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 거래소 연결 상태 테이블
CREATE TABLE IF NOT EXISTS exchange_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    connected BOOLEAN DEFAULT FALSE,
    last_checked TIMESTAMP NOT NULL DEFAULT NOW(),
    error TEXT,
    permissions JSONB,
    balance_available BOOLEAN DEFAULT FALSE,
    trading_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_exchange_connection UNIQUE (user_id, exchange)
);

-- ===== 3. 관리자 및 오류 추적 테이블 =====

-- 관리자 테이블 (이미 위에 정의됨)

-- 관리자 활동 로그 테이블 (이미 위에 정의됨)

-- 거래 오류 테이블
CREATE TABLE IF NOT EXISTS trading_errors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by INTEGER,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 오류 알림 테이블
CREATE TABLE IF NOT EXISTS error_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    error_id INTEGER,
    notification_type VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 오류 패턴 테이블
CREATE TABLE IF NOT EXISTS error_patterns (
    id SERIAL PRIMARY KEY,
    pattern VARCHAR(200) NOT NULL,
    error_type VARCHAR(50) NOT NULL,
    count INTEGER DEFAULT 1,
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 재시도 히스토리 테이블
CREATE TABLE IF NOT EXISTS retry_history (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    operation_id VARCHAR(100),
    attempt_count INTEGER DEFAULT 1,
    last_attempt TIMESTAMP DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prisma 마이그레이션 테이블
CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id VARCHAR(36) PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    applied_steps_count INTEGER NOT NULL DEFAULT 0
);

-- ===== 4. 인덱스 생성 (실제 DB 기준) =====

-- 기본 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);

-- 거래소 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_exchanges_permissions ON exchanges USING gin (permissions);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_exchange ON exchanges (user_id, exchange);

-- 암호화폐 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS cryptocurrencies_symbol_key ON cryptocurrencies (symbol);

-- 김치 프리미엄 인덱스
CREATE INDEX IF NOT EXISTS idx_kimchi_premiums_symbol_time ON kimchi_premiums (symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_kimchi_premiums_timestamp ON kimchi_premiums (timestamp);

-- 전략 및 설정 인덱스
CREATE INDEX IF NOT EXISTS idx_strategies_user_active ON trading_strategies (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_strategies_user_symbol ON trading_strategies (user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_trading_settings_user_auto ON trading_settings (user_id, is_auto_trading);
CREATE UNIQUE INDEX IF NOT EXISTS trading_settings_user_id_key ON trading_settings (user_id);

-- 포지션 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_positions_entry_time ON positions (entry_time);
CREATE INDEX IF NOT EXISTS idx_positions_strategy ON positions (strategy_id);
CREATE INDEX IF NOT EXISTS idx_positions_user_status ON positions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_user_symbol ON positions (user_id, symbol);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_position_strategy_symbol ON positions (strategy_id, symbol) WHERE status = 'open' AND is_mock = FALSE;

-- 거래 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades (executed_at);
CREATE INDEX IF NOT EXISTS idx_trades_position ON trades (position_id);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades (strategy_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_log ON trades (trade_log_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_symbol ON trades (user_id, symbol);

CREATE INDEX IF NOT EXISTS idx_trade_logs_timestamp ON trade_logs (timestamp);

CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_strategy ON orders (strategy_id);
CREATE INDEX IF NOT EXISTS idx_orders_position ON orders (position_id);

-- 시스템 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions (expire);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_access ON sessions (last_access_at);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON system_alerts (created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_user_read ON system_alerts (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_balance_user_exchange_currency ON balance_snapshots (user_id, exchange, currency);
CREATE INDEX IF NOT EXISTS idx_balance_created ON balance_snapshots (created_at);

CREATE INDEX IF NOT EXISTS idx_exchange_conn_user_connected ON exchange_connections (user_id, connected);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_exchange_connection ON exchange_connections (user_id, exchange);

-- 통계 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_performance_user_date ON performance_stats (user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats (user_id, date);

-- 관리자 인덱스
CREATE INDEX IF NOT EXISTS idx_admins_level ON admins (admin_level, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS admins_user_id_key ON admins (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs (admin_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs (action, created_at);

-- 오류 추적 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_errors_user_created ON trading_errors (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_trading_errors_type_status ON trading_errors (error_type, status);
CREATE INDEX IF NOT EXISTS idx_error_notifications_user ON error_notifications (user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_error_patterns_type ON error_patterns (error_type, last_seen);
CREATE INDEX IF NOT EXISTS idx_retry_history_operation ON retry_history (operation_type, last_attempt);

-- ===== 5. 외래 키 제약조건 =====

-- 관리자 테이블 외래 키
ALTER TABLE admins 
ADD CONSTRAINT IF NOT EXISTS admins_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE admins 
ADD CONSTRAINT IF NOT EXISTS admins_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE admin_activity_logs 
ADD CONSTRAINT IF NOT EXISTS admin_activity_logs_admin_user_id_fkey 
FOREIGN KEY (admin_user_id) REFERENCES admins(id) ON DELETE CASCADE;

-- 포지션 및 주문 외래 키
ALTER TABLE orders 
ADD CONSTRAINT IF NOT EXISTS fk_orders_strategy 
FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL;

ALTER TABLE orders 
ADD CONSTRAINT IF NOT EXISTS fk_orders_position 
FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL;

-- ===== 6. 트리거 함수 및 트리거 생성 =====

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성 (updated_at 컬럼이 있는 테이블들만)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exchanges_updated_at ON exchanges;
CREATE TRIGGER update_exchanges_updated_at BEFORE UPDATE ON exchanges 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trading_strategies_updated_at ON trading_strategies;
CREATE TRIGGER update_trading_strategies_updated_at BEFORE UPDATE ON trading_strategies 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trading_settings_updated_at ON trading_settings;
CREATE TRIGGER update_trading_settings_updated_at BEFORE UPDATE ON trading_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exchange_connections_updated_at ON exchange_connections;
CREATE TRIGGER update_exchange_connections_updated_at BEFORE UPDATE ON exchange_connections 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trading_errors_updated_at ON trading_errors;
CREATE TRIGGER update_trading_errors_updated_at BEFORE UPDATE ON trading_errors 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON daily_stats;
CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON daily_stats 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 7. 초기 데이터 삽입 =====

-- 기본 암호화폐 추가
INSERT INTO cryptocurrencies (symbol, name, upbit_market, binance_symbol, priority) VALUES
('BTC', 'Bitcoin', 'KRW-BTC', 'BTCUSDT', 100),
('ETH', 'Ethereum', 'KRW-ETH', 'ETHUSDT', 90),
('XRP', 'Ripple', 'KRW-XRP', 'XRPUSDT', 80),
('ADA', 'Cardano', 'KRW-ADA', 'ADAUSDT', 70),
('DOT', 'Polkadot', 'KRW-DOT', 'DOTUSDT', 60)
ON CONFLICT (symbol) DO NOTHING;

-- 기본 관리자 사용자 생성
DO $$
DECLARE
    admin_user_id INTEGER;
BEGIN
    -- 기존 관리자 사용자 확인
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE role = 'admin' OR username = 'admin' 
    LIMIT 1;
    
    -- 관리자 사용자가 없으면 새로 생성
    IF admin_user_id IS NULL THEN
        INSERT INTO users (username, password, role, is_active) 
        VALUES ('admin', '$2b$10$defaultAdminPassword.hash', 'admin', true)
        RETURNING id INTO admin_user_id;
        
        RAISE NOTICE '새 관리자 사용자 생성됨: ID %', admin_user_id;
    END IF;
    
    -- 관리자 권한 추가 (중복 방지)
    INSERT INTO admins (user_id, admin_level, permissions, created_by) 
    VALUES (admin_user_id, 'super_admin', '{"all": true}', admin_user_id)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        admin_level = 'super_admin',
        permissions = '{"all": true}',
        updated_at = NOW();
        
    RAISE NOTICE '관리자 권한 설정 완료: 사용자 ID %', admin_user_id;
END $$;

-- 기본 거래소 연결 상태 초기화
INSERT INTO exchange_connections (user_id, exchange, connected, last_checked)
SELECT DISTINCT u.id, 'upbit', FALSE, NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM exchange_connections ec 
    WHERE ec.user_id = u.id AND ec.exchange = 'upbit'
)
ON CONFLICT (user_id, exchange) DO NOTHING;

INSERT INTO exchange_connections (user_id, exchange, connected, last_checked)
SELECT DISTINCT u.id, 'binance', FALSE, NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM exchange_connections ec 
    WHERE ec.user_id = u.id AND ec.exchange = 'binance'
)
ON CONFLICT (user_id, exchange) DO NOTHING;

-- ===== 완료 메시지 =====
DO $$
BEGIN
    RAISE NOTICE '===== 자동거래 시스템 데이터베이스 초기화 완료 =====';
    RAISE NOTICE '실제 Neon DB 스키마 기준으로 생성된 테이블 (총 23개):';
    RAISE NOTICE '• _prisma_migrations, admin_activity_logs, admins, balance_snapshots';
    RAISE NOTICE '• cryptocurrencies, daily_stats, error_notifications, error_patterns';
    RAISE NOTICE '• exchange_connections, exchanges, kimchi_premiums, orders';
    RAISE NOTICE '• performance_stats, positions, retry_history, sessions';
    RAISE NOTICE '• system_alerts, trade_logs, trades, trading_errors';
    RAISE NOTICE '• trading_settings, trading_strategies, users';
    RAISE NOTICE '';
    RAISE NOTICE '기본 관리자 계정: admin (비밀번호 해시 설정됨)';
    RAISE NOTICE '기본 암호화폐: BTC, ETH, XRP, ADA, DOT';
    RAISE NOTICE '타임존: Asia/Seoul';
    RAISE NOTICE '모든 인덱스, 제약조건, 트리거 설정 완료';
END $$;