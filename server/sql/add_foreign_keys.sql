-- 테이블 간 외래키 관계 설정

-- 1. trades 테이블에 positions 외래키 추가 (가장 중요!)
ALTER TABLE trades 
ADD CONSTRAINT fk_trades_position_id 
FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;

-- 2. orders 테이블에 positions 외래키 추가  
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_position_id 
FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;

-- 3. trades 테이블에 strategy 외래키 추가
ALTER TABLE trades 
ADD CONSTRAINT fk_trades_strategy_id 
FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL;

-- 4. orders 테이블에 strategy 외래키 추가
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_strategy_id 
FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL;

-- 5. positions 테이블에 strategy 외래키 추가
ALTER TABLE positions 
ADD CONSTRAINT fk_positions_strategy_id 
FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL;

-- 6. 모든 테이블에 users 외래키 추가
ALTER TABLE positions 
ADD CONSTRAINT fk_positions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE trades 
ADD CONSTRAINT fk_trades_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 외래키 관계 확인 쿼리
-- SELECT 
--   tc.table_name, 
--   kcu.column_name, 
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM 
--   information_schema.table_constraints AS tc 
--   JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
--   JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
-- WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('positions', 'trades', 'orders');
