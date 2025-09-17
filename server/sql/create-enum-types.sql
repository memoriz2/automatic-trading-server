-- ===================================================================
-- PostgreSQL ENUM 타입 생성 (오류 추적 시스템용)
-- ===================================================================

-- 기존 ENUM 타입 삭제 (있다면)
DROP TYPE IF EXISTS error_severity CASCADE;
DROP TYPE IF EXISTS error_category CASCADE;
DROP TYPE IF EXISTS retry_status CASCADE;
DROP TYPE IF EXISTS retry_strategy CASCADE;
DROP TYPE IF EXISTS resolution_method CASCADE;

-- 오류 심각도 열거형 정의
CREATE TYPE error_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- 오류 카테고리 열거형 정의
CREATE TYPE error_category AS ENUM ('api', 'network', 'validation', 'balance', 'order', 'system');

-- 재시도 상태 열거형 정의
CREATE TYPE retry_status AS ENUM ('pending', 'retrying', 'success', 'failed', 'abandoned');

-- 재시도 전략 열거형 정의
CREATE TYPE retry_strategy AS ENUM ('immediate', 'linear', 'exponential', 'custom');

-- 해결 방법 열거형 정의
CREATE TYPE resolution_method AS ENUM ('auto_retry', 'manual_fix', 'config_change', 'system_restart', 'ignored');

-- 타입 생성 확인
SELECT typname FROM pg_type WHERE typname IN ('error_severity', 'error_category', 'retry_status', 'retry_strategy', 'resolution_method');
