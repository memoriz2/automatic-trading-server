-- exchanges 테이블에 UNIQUE 제약조건 추가
-- 사용자당 거래소별로 하나의 API 키만 허용

-- 기존 중복 데이터가 있다면 먼저 정리
WITH duplicates AS (
  SELECT user_id, exchange, MIN(id) as keep_id
  FROM exchanges 
  GROUP BY user_id, exchange 
  HAVING COUNT(*) > 1
)
DELETE FROM exchanges 
WHERE id NOT IN (SELECT keep_id FROM duplicates)
  AND (user_id, exchange) IN (
    SELECT user_id, exchange FROM duplicates
  );

-- UNIQUE 제약조건 추가
ALTER TABLE exchanges 
ADD CONSTRAINT unique_user_exchange 
UNIQUE (user_id, exchange);

-- 기존 인덱스 제거 (UNIQUE 제약조건이 자동으로 인덱스 생성)
DROP INDEX IF EXISTS idx_exchanges_user_exchange;

-- 확인용 쿼리
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'exchanges'::regclass;
