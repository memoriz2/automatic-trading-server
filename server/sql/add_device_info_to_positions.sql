-- 포지션 테이블에 디바이스 정보 컬럼 추가

-- 1. 디바이스 ID 컬럼 추가 (어떤 디바이스에서 진입했는지)
ALTER TABLE positions ADD COLUMN IF NOT EXISTS device_id VARCHAR(100);

-- 2. 디바이스 타입 컬럼 추가 (PC, Mobile, Tablet 등)
ALTER TABLE positions ADD COLUMN IF NOT EXISTS device_type VARCHAR(20) DEFAULT 'Unknown';

-- 3. 인덱스 추가 (디바이스별 포지션 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_positions_device_id ON positions (device_id);
CREATE INDEX IF NOT EXISTS idx_positions_device_type ON positions (device_type);

-- 4. 사용자별 디바이스 조합 인덱스
CREATE INDEX IF NOT EXISTS idx_positions_user_device ON positions (user_id, device_type, device_id);

COMMENT ON COLUMN positions.device_id IS '포지션 진입한 디바이스 고유 ID';
COMMENT ON COLUMN positions.device_type IS '디바이스 타입 (PC, Mobile, Tablet)';