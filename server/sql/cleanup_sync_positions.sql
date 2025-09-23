-- ===== 잘못된 동기화 포지션 정리 =====
-- 동기화로 생성된 가짜 포지션들을 삭제

-- 1. 동기화로 생성된 포지션 확인
SELECT id, user_id, symbol, type, side, entry_time, upbit_order_id, binance_order_id
FROM positions 
WHERE type = 'sync_position' 
   OR upbit_order_id = 'SYNC-UPBIT' 
   OR binance_order_id = 'SYNC-BINANCE'
ORDER BY entry_time DESC;

-- 2. 동기화 포지션 삭제
DELETE FROM positions 
WHERE type = 'sync_position' 
   OR upbit_order_id = 'SYNC-UPBIT' 
   OR binance_order_id = 'SYNC-BINANCE';

-- 3. 전략 ID가 없는 포지션도 확인 (동기화 포지션일 가능성)
SELECT id, user_id, symbol, strategy_id, entry_time, upbit_order_id, binance_order_id
FROM positions 
WHERE strategy_id IS NULL
ORDER BY entry_time DESC;

-- 4. 정리 후 남은 포지션 확인
SELECT id, user_id, symbol, strategy_id, status, entry_time
FROM positions 
ORDER BY entry_time DESC 
LIMIT 10;

-- 5. 사용자별 포지션 개수 확인
SELECT user_id, COUNT(*) as position_count, COUNT(CASE WHEN status = 'open' THEN 1 END) as open_positions
FROM positions 
GROUP BY user_id;
