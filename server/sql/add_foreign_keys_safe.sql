-- 안전한 외래키 제약조건 추가 (기존 제약조건 제거 후 재추가)

-- 1. 기존 외래키 제약조건 제거 (있다면)
ALTER TABLE trades DROP CONSTRAINT IF EXISTS fk_trades_position_id;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_position_id;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS fk_trades_strategy_id;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_strategy_id;
ALTER TABLE positions DROP CONSTRAINT IF EXISTS fk_positions_strategy_id;
ALTER TABLE positions DROP CONSTRAINT IF EXISTS fk_positions_user_id;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS fk_trades_user_id;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user_id;

-- 2. 데이터 정합성 확인 후 외래키 추가

-- 2-1. trades → positions 외래키 (NULL 허용)
DO $$
BEGIN
  -- 참조 무결성 위반 데이터가 없는지 확인
  IF NOT EXISTS (
    SELECT 1 FROM trades t 
    LEFT JOIN positions p ON t.position_id = p.id 
    WHERE t.position_id IS NOT NULL AND p.id IS NULL
  ) THEN
    ALTER TABLE trades 
    ADD CONSTRAINT fk_trades_position_id 
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL;
    RAISE NOTICE 'trades → positions 외래키 추가 완료';
  ELSE
    RAISE WARNING 'trades 테이블에 참조 무결성 위반 데이터가 있어 외래키를 추가할 수 없습니다';
  END IF;
END $$;

-- 2-2. orders → positions 외래키 (NULL 허용)  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM orders o 
    LEFT JOIN positions p ON o.position_id = p.id 
    WHERE o.position_id IS NOT NULL AND p.id IS NULL
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_position_id 
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL;
    RAISE NOTICE 'orders → positions 외래키 추가 완료';
  ELSE
    RAISE WARNING 'orders 테이블에 참조 무결성 위반 데이터가 있어 외래키를 추가할 수 없습니다';
  END IF;
END $$;

-- 2-3. strategy 관련 외래키 (trading_strategies 테이블이 있는 경우에만)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trading_strategies') THEN
    
    -- trades → trading_strategies
    IF NOT EXISTS (
      SELECT 1 FROM trades t 
      LEFT JOIN trading_strategies s ON t.strategy_id = s.id 
      WHERE t.strategy_id IS NOT NULL AND s.id IS NULL
    ) THEN
      ALTER TABLE trades 
      ADD CONSTRAINT fk_trades_strategy_id 
      FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL;
      RAISE NOTICE 'trades → trading_strategies 외래키 추가 완료';
    END IF;
    
    -- orders → trading_strategies
    IF NOT EXISTS (
      SELECT 1 FROM orders o 
      LEFT JOIN trading_strategies s ON o.strategy_id = s.id 
      WHERE o.strategy_id IS NOT NULL AND s.id IS NULL
    ) THEN
      ALTER TABLE orders 
      ADD CONSTRAINT fk_orders_strategy_id 
      FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL;
      RAISE NOTICE 'orders → trading_strategies 외래키 추가 완료';
    END IF;
    
    -- positions → trading_strategies
    IF NOT EXISTS (
      SELECT 1 FROM positions p 
      LEFT JOIN trading_strategies s ON p.strategy_id = s.id 
      WHERE p.strategy_id IS NOT NULL AND s.id IS NULL
    ) THEN
      ALTER TABLE positions 
      ADD CONSTRAINT fk_positions_strategy_id 
      FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE SET NULL;
      RAISE NOTICE 'positions → trading_strategies 외래키 추가 완료';
    END IF;
    
  ELSE
    RAISE NOTICE 'trading_strategies 테이블이 없어 strategy 관련 외래키를 추가하지 않습니다';
  END IF;
END $$;

-- 2-4. users 관련 외래키
DO $$
BEGIN
  -- positions → users
  IF NOT EXISTS (
    SELECT 1 FROM positions p 
    LEFT JOIN users u ON p.user_id = u.id 
    WHERE p.user_id IS NOT NULL AND u.id IS NULL
  ) THEN
    ALTER TABLE positions 
    ADD CONSTRAINT fk_positions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    RAISE NOTICE 'positions → users 외래키 추가 완료';
  END IF;
  
  -- trades → users
  IF NOT EXISTS (
    SELECT 1 FROM trades t 
    LEFT JOIN users u ON t.user_id = u.id 
    WHERE t.user_id IS NOT NULL AND u.id IS NULL
  ) THEN
    ALTER TABLE trades 
    ADD CONSTRAINT fk_trades_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    RAISE NOTICE 'trades → users 외래키 추가 완료';
  END IF;
  
  -- orders → users
  IF NOT EXISTS (
    SELECT 1 FROM orders o 
    LEFT JOIN users u ON o.user_id = u.id 
    WHERE o.user_id IS NOT NULL AND u.id IS NULL
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    RAISE NOTICE 'orders → users 외래키 추가 완료';
  END IF;
END $$;

-- 3. 최종 외래키 제약조건 확인
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE 
  constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('positions', 'trades', 'orders')
ORDER BY tc.table_name, kcu.column_name;
