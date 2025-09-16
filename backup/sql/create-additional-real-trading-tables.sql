-- ===== 실거래 시스템용 추가 테이블 생성 =====
-- 기존 exchanges, trades, positions 테이블은 그대로 활용
-- 필요한 추가 테이블들만 생성

-- 실거래 주문 테이블 (기존에 없던 주문 관리)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    strategy_id INTEGER, -- trading_strategies 테이블 참조
    position_id INTEGER, -- positions 테이블 참조
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

-- orders 테이블 설명 추가
COMMENT ON TABLE orders IS '실거래 주문 관리 테이블 - 거래소에 전송한 주문들을 추적';
COMMENT ON COLUMN orders.id IS '주문 고유 ID (자동증가)';
COMMENT ON COLUMN orders.user_id IS '주문을 생성한 사용자 ID';
COMMENT ON COLUMN orders.strategy_id IS '주문을 생성한 전략 ID (선택사항)';
COMMENT ON COLUMN orders.position_id IS '주문이 속한 포지션 ID (선택사항)';
COMMENT ON COLUMN orders.exchange IS '거래소명 (upbit/binance)';
COMMENT ON COLUMN orders.exchange_order_id IS '거래소에서 발급한 주문 ID';
COMMENT ON COLUMN orders.symbol IS '거래 심볼 (BTC-KRW, BTCUSDT 등)';
COMMENT ON COLUMN orders.side IS '주문 방향 (buy/sell/short/cover)';
COMMENT ON COLUMN orders.type IS '주문 타입 (market/limit)';
COMMENT ON COLUMN orders.status IS '주문 상태 (pending/filled/cancelled/rejected)';
COMMENT ON COLUMN orders.quantity IS '주문 수량';
COMMENT ON COLUMN orders.filled_quantity IS '체결된 수량';
COMMENT ON COLUMN orders.remaining_quantity IS '미체결 수량';
COMMENT ON COLUMN orders.price IS '주문 가격 (limit 주문시)';
COMMENT ON COLUMN orders.average_price IS '평균 체결가';
COMMENT ON COLUMN orders.fee IS '거래 수수료';
COMMENT ON COLUMN orders.fee_currency IS '수수료 통화';
COMMENT ON COLUMN orders.time_in_force IS '주문 유효 시간 (GTC/IOC/FOK)';
COMMENT ON COLUMN orders.client_order_id IS '클라이언트에서 생성한 주문 ID';
COMMENT ON COLUMN orders.leverage IS '레버리지 (선물 거래시)';
COMMENT ON COLUMN orders.created_at IS '주문 생성 시간';
COMMENT ON COLUMN orders.updated_at IS '주문 수정 시간';
COMMENT ON COLUMN orders.filled_at IS '주문 체결 완료 시간';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_strategy ON orders (strategy_id);
CREATE INDEX IF NOT EXISTS idx_orders_position ON orders (position_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at);

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

-- balance_snapshots 테이블 설명 추가
COMMENT ON TABLE balance_snapshots IS '거래소 잔고 스냅샷 테이블 - 특정 시점의 잔고 상태를 기록';
COMMENT ON COLUMN balance_snapshots.id IS '스냅샷 고유 ID (자동증가)';
COMMENT ON COLUMN balance_snapshots.user_id IS '잔고 소유자 사용자 ID';
COMMENT ON COLUMN balance_snapshots.exchange IS '거래소명 (upbit/binance)';
COMMENT ON COLUMN balance_snapshots.currency IS '통화 코드 (KRW/BTC/USDT/ETH 등)';
COMMENT ON COLUMN balance_snapshots.available IS '사용 가능한 잔고 수량';
COMMENT ON COLUMN balance_snapshots.locked IS '주문 중 잠긴 잔고 수량';
COMMENT ON COLUMN balance_snapshots.total IS '총 잔고 수량 (available + locked)';
COMMENT ON COLUMN balance_snapshots.usd_value IS 'USD 환산 가치';
COMMENT ON COLUMN balance_snapshots.krw_value IS 'KRW 환산 가치';
COMMENT ON COLUMN balance_snapshots.created_at IS '스냅샷 생성 시간';

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

-- exchange_connections 테이블 설명 추가
COMMENT ON TABLE exchange_connections IS '거래소 API 연결 상태 테이블 - 각 사용자의 거래소 연결 상태를 추적';
COMMENT ON COLUMN exchange_connections.id IS '연결 상태 고유 ID (자동증가)';
COMMENT ON COLUMN exchange_connections.user_id IS '사용자 ID';
COMMENT ON COLUMN exchange_connections.exchange IS '거래소명 (upbit/binance)';
COMMENT ON COLUMN exchange_connections.connected IS 'API 연결 상태 (true: 연결됨, false: 연결안됨)';
COMMENT ON COLUMN exchange_connections.last_checked IS '마지막 연결 상태 확인 시간';
COMMENT ON COLUMN exchange_connections.error IS '연결 실패시 오류 메시지';
COMMENT ON COLUMN exchange_connections.permissions IS 'API 키 권한 정보 (JSON 형태)';
COMMENT ON COLUMN exchange_connections.balance_available IS '잔고 조회 가능 여부';
COMMENT ON COLUMN exchange_connections.trading_enabled IS '거래 실행 가능 여부';
COMMENT ON COLUMN exchange_connections.created_at IS '연결 정보 생성 시간';
COMMENT ON COLUMN exchange_connections.updated_at IS '연결 정보 수정 시간';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_exchange_conn_user_connected ON exchange_connections (user_id, connected);

-- 실거래 일일 통계 테이블
CREATE TABLE IF NOT EXISTS daily_stats (
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

-- daily_stats 테이블 설명 추가
COMMENT ON TABLE daily_stats IS '실거래 일일 통계 테이블 - 사용자별 일일 거래 성과 및 통계 정보';
COMMENT ON COLUMN daily_stats.id IS '통계 고유 ID (자동증가)';
COMMENT ON COLUMN daily_stats.user_id IS '사용자 ID';
COMMENT ON COLUMN daily_stats.date IS '통계 날짜 (YYYY-MM-DD 형식)';
COMMENT ON COLUMN daily_stats.total_trades IS '총 거래 횟수';
COMMENT ON COLUMN daily_stats.upbit_trades IS '업비트 거래 횟수';
COMMENT ON COLUMN daily_stats.binance_trades IS '바이낸스 거래 횟수';
COMMENT ON COLUMN daily_stats.active_positions IS '활성 포지션 수';
COMMENT ON COLUMN daily_stats.total_fees IS '총 거래 수수료 (KRW)';
COMMENT ON COLUMN daily_stats.realized_pnl IS '실현 손익 (KRW)';
COMMENT ON COLUMN daily_stats.unrealized_pnl IS '미실현 손익 (KRW)';
COMMENT ON COLUMN daily_stats.total_volume IS '총 거래량 (KRW)';
COMMENT ON COLUMN daily_stats.win_rate IS '승률 (%)';
COMMENT ON COLUMN daily_stats.max_drawdown IS '최대 손실폭 (KRW)';
COMMENT ON COLUMN daily_stats.created_at IS '통계 생성 시간';
COMMENT ON COLUMN daily_stats.updated_at IS '통계 수정 시간';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats (date);

-- ===== 기존 테이블에 컬럼 추가 (필요한 경우) =====

-- positions 테이블에 바이낸스 관련 필드 추가 (없다면)
DO $$
BEGIN
    -- binance_leverage 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='positions' AND column_name='binance_leverage') THEN
        ALTER TABLE positions ADD COLUMN binance_leverage INTEGER DEFAULT 1;
        COMMENT ON COLUMN positions.binance_leverage IS '바이낸스 레버리지 배수 (선물 거래용)';
    END IF;
    
    -- binance_quantity 컬럼 추가 (바이낸스 수량)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='positions' AND column_name='binance_quantity') THEN
        ALTER TABLE positions ADD COLUMN binance_quantity DECIMAL(20, 8) DEFAULT 0;
        COMMENT ON COLUMN positions.binance_quantity IS '바이낸스 포지션 수량 (BTC 단위)';
    END IF;
    
    -- binance_entry_price 컬럼 추가 (바이낸스 진입가)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='positions' AND column_name='binance_entry_price') THEN
        ALTER TABLE positions ADD COLUMN binance_entry_price DECIMAL(20, 8) DEFAULT 0;
        COMMENT ON COLUMN positions.binance_entry_price IS '바이낸스 진입 가격 (USDT 단위)';
    END IF;
    
    -- total_fees 컬럼 추가 (총 수수료)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='positions' AND column_name='total_fees') THEN
        ALTER TABLE positions ADD COLUMN total_fees DECIMAL(20, 2) DEFAULT 0;
        COMMENT ON COLUMN positions.total_fees IS '포지션 총 거래 수수료 (KRW 환산)';
    END IF;
END $$;

-- trades 테이블에 필요한 컬럼 추가
DO $$
BEGIN
    -- order_id 컬럼 추가 (주문 참조)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='order_id') THEN
        ALTER TABLE trades ADD COLUMN order_id INTEGER REFERENCES orders(id);
        COMMENT ON COLUMN trades.order_id IS '체결을 발생시킨 주문 ID (orders 테이블 참조)';
    END IF;
    
    -- fee_currency 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='fee_currency') THEN
        ALTER TABLE trades ADD COLUMN fee_currency VARCHAR(10) DEFAULT 'KRW';
        COMMENT ON COLUMN trades.fee_currency IS '거래 수수료 통화 (KRW/USDT/BTC 등)';
    END IF;
END $$;

-- ===== 외래 키 제약 조건 추가 =====

-- orders 외래 키
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_orders_strategy') THEN
        ALTER TABLE orders ADD CONSTRAINT fk_orders_strategy 
        FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_orders_position') THEN
        ALTER TABLE orders ADD CONSTRAINT fk_orders_position 
        FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ===== 트리거 함수 생성 (updated_at 자동 업데이트) =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성 (없다면)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_exchange_connections_updated_at') THEN
        CREATE TRIGGER update_exchange_connections_updated_at BEFORE UPDATE ON exchange_connections 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_daily_stats_updated_at') THEN
        CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON daily_stats 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

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
