-- PostgreSQL 시간대를 한국시간으로 설정

-- 1. 현재 시간대 확인
SELECT current_setting('timezone') as current_timezone;

-- 2. 한국시간으로 설정
SET timezone = 'Asia/Seoul';

-- 3. 설정 확인
SELECT 
  current_setting('timezone') as timezone,
  NOW() as current_time_kst,
  NOW() AT TIME ZONE 'UTC' as current_time_utc;

-- 4. 기존 데이터의 시간대 확인 (샘플)
SELECT 
  id,
  name,
  created_at,
  created_at AT TIME ZONE 'Asia/Seoul' as created_at_kst,
  updated_at,
  updated_at AT TIME ZONE 'Asia/Seoul' as updated_at_kst
FROM trading_strategies 
WHERE user_id = 5 
ORDER BY created_at DESC 
LIMIT 3;

-- 5. 앞으로 생성되는 데이터는 자동으로 한국시간으로 저장됨
-- (PostgreSQL의 NOW() 함수가 설정된 시간대를 사용)
