-- 외래키 제약조건 추가 전 데이터 정합성 수정

-- 1. 현재 데이터 상태 확인
SELECT 'POSITIONS 테이블 상태' as info;
SELECT COUNT(*) as total_positions FROM positions;
SELECT MIN(id) as min_id, MAX(id) as max_id FROM positions;

SELECT 'TRADES 테이블 상태' as info;
SELECT COUNT(*) as total_trades FROM trades;
SELECT COUNT(*) as trades_with_position_id FROM trades WHERE position_id IS NOT NULL;

SELECT 'ORDERS 테이블 상태' as info;
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as orders_with_position_id FROM orders WHERE position_id IS NOT NULL;

-- 2. 참조 무결성 위반 데이터 확인
SELECT 'TRADES 참조 무결성 위반' as issue;
SELECT t.id, t.position_id, t.symbol, t.created_at
FROM trades t
LEFT JOIN positions p ON t.position_id = p.id
WHERE t.position_id IS NOT NULL AND p.id IS NULL
ORDER BY t.created_at DESC
LIMIT 10;

SELECT 'ORDERS 참조 무결성 위반' as issue;
SELECT o.id, o.position_id, o.symbol, o.created_at  
FROM orders o
LEFT JOIN positions p ON o.position_id = p.id
WHERE o.position_id IS NOT NULL AND p.id IS NULL
ORDER BY o.created_at DESC
LIMIT 10;

-- 3. 해결 방안 1: 참조 무결성 위반 데이터 정리 (NULL로 설정)
UPDATE trades 
SET position_id = NULL 
WHERE position_id IS NOT NULL 
  AND position_id NOT IN (SELECT id FROM positions);

UPDATE orders 
SET position_id = NULL 
WHERE position_id IS NOT NULL 
  AND position_id NOT IN (SELECT id FROM positions);

-- 4. 정리 후 상태 확인
SELECT 'TRADES 정리 후' as info;
SELECT COUNT(*) as trades_with_valid_position_id 
FROM trades t 
JOIN positions p ON t.position_id = p.id
WHERE t.position_id IS NOT NULL;

SELECT COUNT(*) as trades_with_null_position_id 
FROM trades 
WHERE position_id IS NULL;

SELECT 'ORDERS 정리 후' as info;
SELECT COUNT(*) as orders_with_valid_position_id 
FROM orders o 
JOIN positions p ON o.position_id = p.id
WHERE o.position_id IS NOT NULL;

SELECT COUNT(*) as orders_with_null_position_id 
FROM orders 
WHERE position_id IS NULL;
