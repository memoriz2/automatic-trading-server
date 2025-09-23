-- ===== 포지션 테이블에서 디바이스 정보 제거 =====
-- trades 테이블로 이동하므로 positions에서는 제거

-- 인덱스 먼저 제거
DROP INDEX IF EXISTS idx_positions_entry_device;
DROP INDEX IF EXISTS idx_positions_entry_device_type;

-- positions 테이블에서 디바이스 정보 컬럼 제거
ALTER TABLE positions 
DROP COLUMN IF EXISTS entry_device_id,
DROP COLUMN IF EXISTS exit_device_id,
DROP COLUMN IF EXISTS entry_device_type,
DROP COLUMN IF EXISTS exit_device_type;

-- 변경사항 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'positions' 
ORDER BY ordinal_position;
