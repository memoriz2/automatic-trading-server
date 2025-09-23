-- 중복된 외래키 제약조건 정리

-- 1. 현재 외래키 제약조건 확인
SELECT 
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE 
  constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('positions', 'trades', 'orders')
ORDER BY tc.table_name, kcu.column_name, tc.constraint_name;

-- 2. 중복된 외래키 제약조건 제거 (이전 버전들)

-- orders 테이블 중복 제거
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_position;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_strategy;

-- trades 테이블에도 혹시 중복이 있다면 제거
ALTER TABLE trades DROP CONSTRAINT IF EXISTS fk_trades_position;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS fk_trades_strategy;

-- positions 테이블 중복 제거 (혹시 있다면)
ALTER TABLE positions DROP CONSTRAINT IF EXISTS fk_positions_strategy;

-- 3. 정리 후 외래키 제약조건 확인
SELECT 
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE 
  constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('positions', 'trades', 'orders')
ORDER BY tc.table_name, kcu.column_name, tc.constraint_name;

-- 4. 각 컬럼별 외래키 개수 확인 (중복 체크)
SELECT 
  tc.table_name,
  kcu.column_name,
  COUNT(*) as constraint_count
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
WHERE 
  constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('positions', 'trades', 'orders')
GROUP BY tc.table_name, kcu.column_name
HAVING COUNT(*) > 1
ORDER BY tc.table_name, kcu.column_name;
