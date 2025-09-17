-- ===================================================================
-- trading_errors 테이블 누락된 컬럼 추가
-- ===================================================================

-- 필요한 ENUM 타입들이 없다면 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'retry_status') THEN
        CREATE TYPE retry_status AS ENUM ('pending', 'retrying', 'success', 'failed', 'abandoned');
    END IF;
END $$;

-- 누락된 컬럼들을 안전하게 추가
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS intended_quantity DECIMAL(18, 8);
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS intended_price DECIMAL(18, 8);
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS api_endpoint VARCHAR(200);
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS request_payload JSONB;
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS response_data JSONB;
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS retry_status retry_status DEFAULT 'pending';
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP;
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE;
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS resolution_method VARCHAR(100);
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS stack_trace TEXT;
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS user_agent VARCHAR(200);
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE trading_errors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- updated_at 자동 업데이트 트리거 함수 생성 (없다면)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성 (기존 트리거가 있다면 삭제 후 재생성)
DROP TRIGGER IF EXISTS update_trading_errors_updated_at ON trading_errors;
CREATE TRIGGER update_trading_errors_updated_at 
    BEFORE UPDATE ON trading_errors 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trading_errors' 
ORDER BY ordinal_position;
