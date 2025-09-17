-- 기존 positions 테이블에 재진입 방지를 위한 유니크 제약 조건 추가
-- OPEN 상태에서 (strategy_id, symbol)은 유일해야 함

-- 1. 먼저 중복된 OPEN 포지션이 있는지 확인
SELECT strategy_id, symbol, COUNT(*) as count
FROM positions 
WHERE status = 'open' AND is_mock = false
GROUP BY strategy_id, symbol
HAVING COUNT(*) > 1;

-- 2. 중복이 없다면 유니크 인덱스 생성
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_position_strategy_symbol
ON positions(strategy_id, symbol)
WHERE status = 'open' AND is_mock = false;

-- 3. remaining_quantity 컬럼 추가 (부분 청산 추적용)
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS remaining_quantity DECIMAL(20, 8) DEFAULT 0;

-- 4. 기존 OPEN 포지션의 remaining_quantity를 quantity로 초기화
UPDATE positions 
SET remaining_quantity = quantity 
WHERE status = 'open' AND is_mock = false AND remaining_quantity = 0;

-- 5. 인덱스 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'positions' 
  AND indexname LIKE '%uniq_open_position%';
