-- ===== 실거래 시스템용 테이블 생성 =====

-- API 키 관리 테이블
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    exchange VARCHAR(20) NOT NULL, -- 'upbit' | 'binance'
    api_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    passphrase TEXT, -- 바이낸스용 (선택사항)
    permissions JSONB, -- ['spot', 'futures', 'margin'] 등
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_exchange UNIQUE (user_id, exchange)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_api_keys_user_active ON api_keys (user_id, is_active);

-- 실거래 주문 테이블
CREATE TABLE IF NOT EXISTS real_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    strategy_id INTEGER, -- trading_strategies 테이블 참조
    position_id INTEGER, -- real_positions 테이블 참조
    exchange VARCHAR(20) NOT NULL, -- 'upbit' | 'binance'
    exchange_order_id VARCHAR(100) NOT NULL, -- 거래소에서 발급한 주문 ID
    symbol VARCHAR(20) NOT NULL, -- 'BTC-KRW', 'BTCUSDT' 등
    side VARCHAR(10) NOT NULL, -- 'buy', 'sell', 'short', 'cover'
    type VARCHAR(10) NOT NULL, -- 'market', 'limit'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'filled', 'cancelled' 등
    quantity DECIMAL(20, 8) NOT NULL,
    filled_quantity DECIMAL(20, 8) DEFAULT 0,
    remaining_quantity DECIMAL(20, 8) DEFAULT 0,
    price DECIMAL(20, 8), -- limit 주문 시
    average_price DECIMAL(20, 8),
    fee DECIMAL(20, 8) DEFAULT 0,
    fee_currency VARCHAR(10),
    time_in_force VARCHAR(10), -- 'GTC', 'IOC', 'FOK'
    client_order_id VARCHAR(100), -- 클라이언트 주문 ID
    leverage INTEGER DEFAULT 1, -- 선물 거래 시
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    filled_at TIMESTAMP,
    
    CONSTRAINT unique_exchange_order UNIQUE (exchange, exchange_order_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_real_orders_user_status ON real_orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_real_orders_strategy ON real_orders (strategy_id);
CREATE INDEX IF NOT EXISTS idx_real_orders_position ON real_orders (position_id);
CREATE INDEX IF NOT EXISTS idx_real_orders_created ON real_orders (created_at);

-- 실거래 포지션 테이블
CREATE TABLE IF NOT EXISTS real_positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    strategy_id INTEGER, -- trading_strategies 테이블 참조
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL, -- 'long', 'short'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'liquidated'
    
    -- 업비트 (현물) 정보
    upbit_quantity DECIMAL(20, 8) NOT NULL,
    upbit_entry_price DECIMAL(20, 8) NOT NULL,
    upbit_current_price DECIMAL(20, 8),
    upbit_order_id VARCHAR(100),
    
    -- 바이낸스 (선물) 정보
    binance_quantity DECIMAL(20, 8) NOT NULL,
    binance_entry_price DECIMAL(20, 8) NOT NULL,
    binance_current_price DECIMAL(20, 8),
    binance_leverage INTEGER DEFAULT 1,
    binance_order_id VARCHAR(100),
    
    -- 김치 프리미엄 정보
    entry_premium_rate DECIMAL(10, 4) NOT NULL,
    current_premium_rate DECIMAL(10, 4),
    
    -- 손익 정보
    unrealized_pnl DECIMAL(20, 2) DEFAULT 0,
    realized_pnl DECIMAL(20, 2),
    total_fees DECIMAL(20, 2) DEFAULT 0,
    
    -- 시간 정보
    entry_time TIMESTAMP DEFAULT NOW(),
    exit_time TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_real_positions_user_status ON real_positions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_real_positions_strategy ON real_positions (strategy_id);
CREATE INDEX IF NOT EXISTS idx_real_positions_symbol_status ON real_positions (symbol, status);
CREATE INDEX IF NOT EXISTS idx_real_positions_entry_time ON real_positions (entry_time);

-- 실거래 체결 테이블
CREATE TABLE IF NOT EXISTS real_trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    position_id INTEGER, -- real_positions 테이블 참조
    order_id INTEGER NOT NULL, -- real_orders 테이블 참조
    exchange VARCHAR(20) NOT NULL, -- 'upbit' | 'binance'
    exchange_trade_id VARCHAR(100) NOT NULL, -- 거래소에서 발급한 체결 ID
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL, -- 'buy', 'sell', 'short', 'cover'
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    fee_currency VARCHAR(10) NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_exchange_trade UNIQUE (exchange, exchange_trade_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_real_trades_user_executed ON real_trades (user_id, executed_at);
CREATE INDEX IF NOT EXISTS idx_real_trades_order ON real_trades (order_id);
CREATE INDEX IF NOT EXISTS idx_real_trades_position ON real_trades (position_id);

-- 실거래 잔고 스냅샷 테이블
CREATE TABLE IF NOT EXISTS balance_snapshots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    exchange VARCHAR(20) NOT NULL, -- 'upbit' | 'binance'
    currency VARCHAR(10) NOT NULL, -- 'KRW', 'BTC', 'USDT' 등
    available DECIMAL(20, 8) NOT NULL, -- 사용 가능한 잔고
    locked DECIMAL(20, 8) DEFAULT 0, -- 주문 중 잠긴 잔고
    total DECIMAL(20, 8) NOT NULL, -- 총 잔고
    usd_value DECIMAL(20, 2), -- USD 환산 가치
    krw_value DECIMAL(20, 2), -- KRW 환산 가치
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_balance_user_exchange_currency ON balance_snapshots (user_id, exchange, currency);
CREATE INDEX IF NOT EXISTS idx_balance_created ON balance_snapshots (created_at);

-- 거래소 연결 상태 테이블
CREATE TABLE IF NOT EXISTS exchange_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    exchange VARCHAR(20) NOT NULL, -- 'upbit' | 'binance'
    connected BOOLEAN DEFAULT FALSE,
    last_checked TIMESTAMP NOT NULL,
    error TEXT,
    permissions JSONB, -- 권한 정보
    balance_available BOOLEAN DEFAULT FALSE,
    trading_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_exchange_connection UNIQUE (user_id, exchange)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_exchange_conn_user_connected ON exchange_connections (user_id, connected);

-- 실거래 일일 통계 테이블
CREATE TABLE IF NOT EXISTS real_daily_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD'
    total_trades INTEGER DEFAULT 0,
    upbit_trades INTEGER DEFAULT 0,
    binance_trades INTEGER DEFAULT 0,
    active_positions INTEGER DEFAULT 0,
    total_fees DECIMAL(20, 2) DEFAULT 0,
    realized_pnl DECIMAL(20, 2) DEFAULT 0,
    unrealized_pnl DECIMAL(20, 2) DEFAULT 0,
    total_volume DECIMAL(20, 2) DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    max_drawdown DECIMAL(20, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_date_stats UNIQUE (user_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_real_daily_stats_date ON real_daily_stats (date);

-- ===== 외래 키 제약 조건 추가 =====

-- real_orders 외래 키
ALTER TABLE real_orders 
ADD CONSTRAINT fk_real_orders_strategy 
FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL;

ALTER TABLE real_orders 
ADD CONSTRAINT fk_real_orders_position 
FOREIGN KEY (position_id) REFERENCES real_positions(id) ON DELETE SET NULL;

-- real_positions 외래 키
ALTER TABLE real_positions 
ADD CONSTRAINT fk_real_positions_strategy 
FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL;

-- real_trades 외래 키
ALTER TABLE real_trades 
ADD CONSTRAINT fk_real_trades_order 
FOREIGN KEY (order_id) REFERENCES real_orders(id) ON DELETE CASCADE;

ALTER TABLE real_trades 
ADD CONSTRAINT fk_real_trades_position 
FOREIGN KEY (position_id) REFERENCES real_positions(id) ON DELETE SET NULL;

-- ===== 트리거 함수 생성 (updated_at 자동 업데이트) =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_real_orders_updated_at BEFORE UPDATE ON real_orders 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_real_positions_updated_at BEFORE UPDATE ON real_positions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_connections_updated_at BEFORE UPDATE ON exchange_connections 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_real_daily_stats_updated_at BEFORE UPDATE ON real_daily_stats 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 초기 데이터 삽입 =====

-- 기본 거래소 연결 상태 (모든 사용자에 대해)
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
