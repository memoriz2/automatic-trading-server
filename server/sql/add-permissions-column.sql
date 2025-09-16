-- exchanges 테이블에 permissions 컬럼 추가

-- 기존 테이블 구조 확인
-- \d exchanges;

-- permissions 컬럼 추가 (JSON 배열 형태로 저장)
ALTER TABLE exchanges 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';

-- 기존 데이터에 기본 권한 설정
UPDATE exchanges 
SET permissions = '["spot", "futures"]'::jsonb 
WHERE permissions IS NULL OR permissions = '[]'::jsonb;

-- 컬럼 설명 추가
COMMENT ON COLUMN exchanges.permissions IS 'API 키 권한 목록 (JSON 배열): ["spot", "futures", "margin"] 등';

-- 인덱스 추가 (권한 기반 검색용)
CREATE INDEX IF NOT EXISTS idx_exchanges_permissions 
ON exchanges USING GIN (permissions);

-- 확인 쿼리
-- SELECT id, user_id, exchange, permissions FROM exchanges LIMIT 5;
