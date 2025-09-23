-- device_id 컬럼을 ip 컬럼으로 변경

-- 1. 기존 device_id 컬럼을 ip로 이름 변경
ALTER TABLE positions RENAME COLUMN device_id TO ip;

-- 2. ip 컬럼 타입을 적절하게 조정 (IPv4/IPv6 지원)
ALTER TABLE positions ALTER COLUMN ip TYPE VARCHAR(45); -- IPv6 최대 길이

-- 3. 컬럼 코멘트 업데이트
COMMENT ON COLUMN positions.ip IS '포지션 진입한 클라이언트 IP 주소';
COMMENT ON COLUMN positions.device_type IS '디바이스 타입 (desktop, mobile, tablet)';

-- 4. 인덱스 이름 변경
DROP INDEX IF EXISTS idx_positions_device_id;
CREATE INDEX IF NOT EXISTS idx_positions_ip ON positions (ip);

-- 5. 복합 인덱스도 업데이트
DROP INDEX IF EXISTS idx_positions_user_device;
CREATE INDEX IF NOT EXISTS idx_positions_user_device ON positions (user_id, device_type, ip);

-- 6. 변경 결과 확인
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'positions' 
  AND column_name IN ('ip', 'device_type')
ORDER BY column_name;
