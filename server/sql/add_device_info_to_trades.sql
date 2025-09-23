-- ===== 거래 테이블에 디바이스 정보 추가 =====
-- 각 거래(trade)마다 어떤 디바이스에서 실행했는지 추적

-- trades 테이블에 디바이스 정보 컬럼 추가
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS device_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS device_type VARCHAR(20);

-- 디바이스 정보 컬럼에 대한 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_trades_device_id ON trades(device_id);
CREATE INDEX IF NOT EXISTS idx_trades_device_type ON trades(device_type);
CREATE INDEX IF NOT EXISTS idx_trades_user_device ON trades(user_id, device_type);

-- 디바이스 정보 컬럼에 주석 추가
COMMENT ON COLUMN trades.device_id IS '거래를 실행한 디바이스 ID';
COMMENT ON COLUMN trades.device_type IS '거래 실행 디바이스 타입 (mobile/tablet/desktop)';

-- 변경사항 확인을 위한 쿼리
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'trades' 
  AND column_name LIKE '%device%'
ORDER BY ordinal_position;

-- 디바이스별 거래 통계 조회 예시
-- SELECT 
--   device_type,
--   COUNT(*) as total_trades,
--   COUNT(CASE WHEN side = 'buy' THEN 1 END) as buy_trades,
--   COUNT(CASE WHEN side = 'sell' THEN 1 END) as sell_trades,
--   AVG(quantity * price) as avg_trade_value
-- FROM trades 
-- WHERE user_id = 1 
-- GROUP BY device_type;
