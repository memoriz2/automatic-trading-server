-- ===== Mock 모드 완전 제거 =====
-- 실거래 모드만 남기고 Mock 관련 모든 것 제거

-- 1. Mock 포지션 데이터 삭제
DELETE FROM positions WHERE is_mock = true;

-- 2. positions 테이블에서 is_mock 컬럼 제거
ALTER TABLE positions DROP COLUMN IF EXISTS is_mock;

-- 3. 변경사항 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'positions' 
ORDER BY ordinal_position;

-- 4. 남은 포지션 확인
SELECT id, user_id, symbol, status, entry_time 
FROM positions 
ORDER BY entry_time DESC 
LIMIT 10;
