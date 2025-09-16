-- exchanges 테이블의 제약조건 확인
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'exchanges'::regclass
ORDER BY contype, conname;

-- 인덱스 확인
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'exchanges'
ORDER BY indexname;
