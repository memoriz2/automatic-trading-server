-- 손상된 exchanges 데이터 정리 및 재설정

-- 1. 기존 데이터 백업 (선택사항)
-- CREATE TABLE exchanges_backup AS SELECT * FROM exchanges;

-- 2. 기존 데이터 삭제 (암호화 손상된 데이터 정리)
DELETE FROM exchanges WHERE user_id = 5; -- 현재 사용자 데이터만 정리

-- 3. 제약조건 확인
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'exchanges'::regclass
  AND contype = 'u' -- UNIQUE 제약조건만
ORDER BY conname;

-- 4. 테이블 구조 확인
\d exchanges;
