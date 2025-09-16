-- ===================================================================
-- 거래 오류 추적 시스템 테이블
-- ===================================================================
-- 목적: 자동매매 거래 중 발생하는 모든 오류를 체계적으로 추적하고 분석
-- 기능: 오류 분류, 재시도 관리, 패턴 분석, 알림 발송, 통계 생성
-- 작성일: 2024-09-16
-- 작성자: Trading System
-- ===================================================================

-- 기존 ENUM 타입 삭제 (있다면)
DROP TYPE IF EXISTS error_severity CASCADE;
DROP TYPE IF EXISTS error_category CASCADE;
DROP TYPE IF EXISTS retry_status CASCADE;

-- 오류 심각도 열거형 정의
-- low: 일시적 오류, 자동 재시도로 해결 가능
-- medium: 여러 번의 재시도나 간단한 수정 필요  
-- high: 즉각적인 개입 필요, 거래 실패 가능성
-- critical: 시스템 중단, 즉시 알림 및 수동 개입 필요
CREATE TYPE error_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- 오류 카테고리 열거형 정의
-- api: API 호출 관련 오류 (인증, 권한, 응답 등)
-- network: 네트워크 연결 오류 (타임아웃, 연결 실패 등)
-- validation: 데이터 검증 오류 (형식, 범위, 필수값 등)
-- balance: 잔고 관련 오류 (잔고 부족, 동결 등)
-- order: 주문 실행 관련 오류 (시장 마감, 수량 오류 등)
-- system: 시스템 내부 오류 (DB, 메모리, 서버 등)
CREATE TYPE error_category AS ENUM ('api', 'network', 'validation', 'balance', 'order', 'system');

-- 재시도 상태 열거형 정의
-- pending: 재시도 대기 중
-- retrying: 재시도 진행 중
-- success: 재시도 성공으로 해결
-- failed: 재시도 실패
-- abandoned: 최대 재시도 횟수 초과로 포기
CREATE TYPE retry_status AS ENUM ('pending', 'retrying', 'success', 'failed', 'abandoned');

-- ===================================================================
-- 1. 거래 오류 로그 테이블 (trading_errors)
-- ===================================================================
-- 목적: 자동매매 중 발생하는 모든 오류를 상세히 기록
-- 특징: 오류 분류, 재시도 관리, 해결 추적, 메타데이터 저장
-- 관계: trades(1:N), positions(1:N), error_patterns(N:1)
-- ===================================================================

-- 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS error_notifications CASCADE;
DROP TABLE IF EXISTS retry_history CASCADE;
DROP TABLE IF EXISTS error_patterns CASCADE;
DROP TABLE IF EXISTS trading_errors CASCADE;

-- 거래 오류 로그 테이블 생성
CREATE TABLE trading_errors (
    -- 기본 식별자
    id SERIAL PRIMARY KEY,
    
    -- 연관 관계
    user_id INTEGER NOT NULL,                    -- 사용자 ID (users 테이블 참조)
    trade_id INTEGER NULL,                       -- 거래 ID (trades 테이블 참조, 성공한 거래의 경우)
    position_id INTEGER NULL,                    -- 포지션 ID (positions 테이블 참조)
    
    -- 오류 분류 정보
    error_category error_category NOT NULL,         -- 오류 카테고리 (API, 네트워크, 검증 등)
    error_severity error_severity NOT NULL,         -- 오류 심각도 (낮음~치명적)
    error_code VARCHAR(50),                          -- 오류 코드 (예: API_UNAUTHORIZED, NETWORK_TIMEOUT)
    error_message TEXT NOT NULL,                     -- 오류 메시지 (상세 설명)
    error_signature VARCHAR(200),                    -- 오류 패턴 식별용 시그니처 (MD5 해시)
    
    -- 거래 컨텍스트 정보
    exchange VARCHAR(20) NOT NULL,                   -- 거래소명 ('upbit', 'binance')
    symbol VARCHAR(20) NOT NULL,                     -- 거래 심볼 (예: 'BTCUSDT', 'KRW-BTC')
    side VARCHAR(10) NOT NULL,                       -- 거래 방향 ('buy', 'sell', 'long', 'short')
    intended_quantity DECIMAL(18, 8),               -- 의도한 거래 수량
    intended_price DECIMAL(18, 8),                  -- 의도한 거래 가격
    
    -- 시스템 정보
    api_endpoint VARCHAR(200),                       -- 실패한 API 엔드포인트 URL
    request_payload JSONB,                          -- API 요청 데이터 (JSON 형태)
    response_data JSONB,                            -- API 응답 데이터 (JSON 형태)
    
    -- 재시도 관리 정보
    retry_count INTEGER DEFAULT 0,                  -- 현재 재시도 횟수
    retry_status retry_status DEFAULT 'pending',    -- 재시도 상태
    max_retries INTEGER DEFAULT 3,                  -- 최대 재시도 횟수
    next_retry_at TIMESTAMP NULL,                   -- 다음 재시도 예정 시간
    
    -- 해결 추적 정보
    is_resolved BOOLEAN DEFAULT FALSE,               -- 해결 완료 여부
    resolved_at TIMESTAMP NULL,                     -- 해결 완료 시간
    resolution_method VARCHAR(100),                 -- 해결 방법 ('auto_retry', 'manual_fix', 'ignored', 'compensated')
    resolution_notes TEXT,                          -- 해결 과정 메모
    
    -- 디버깅 및 추적 메타데이터
    stack_trace TEXT,                               -- 오류 스택 트레이스
    user_agent VARCHAR(200),                        -- 사용자 에이전트 (브라우저/앱 정보)
    ip_address INET,                                -- 클라이언트 IP 주소
    session_id VARCHAR(100),                        -- 세션 ID
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),             -- 오류 발생 시간
    updated_at TIMESTAMP DEFAULT NOW()              -- 마지막 업데이트 시간
);

-- ===================================================================
-- 2. 오류 패턴 분석 테이블 (error_patterns)
-- ===================================================================
-- 목적: 반복되는 오류 패턴을 식별하고 분석하여 근본 원인 해결
-- 특징: 오류 시그니처 기반 그룹핑, 발생 빈도 추적, 수정 우선순위 관리
-- 관계: trading_errors(1:N) - 여러 오류가 하나의 패턴에 속함
-- ===================================================================
-- 오류 패턴 분석 테이블 생성
CREATE TABLE error_patterns (
    -- 기본 식별자
    id SERIAL PRIMARY KEY,
    
    -- 패턴 식별 정보
    pattern_name VARCHAR(100) NOT NULL,             -- 패턴명 (예: 'binance_api_timeout', 'upbit_balance_insufficient')
    error_signature VARCHAR(200) NOT NULL UNIQUE,  -- 오류의 고유 시그니처 (MD5 해시)
    
    -- 발생 통계
    occurrence_count INTEGER DEFAULT 1,             -- 총 발생 횟수
    first_seen TIMESTAMP DEFAULT NOW(),             -- 최초 발생 시간
    last_seen TIMESTAMP DEFAULT NOW(),              -- 최근 발생 시간
    
    -- 영향도 분석
    affected_users INTEGER DEFAULT 0,               -- 영향받은 사용자 수
    total_failed_trades INTEGER DEFAULT 0,          -- 총 실패한 거래 수
    estimated_loss DECIMAL(18, 2) DEFAULT 0,        -- 추정 손실 금액 (USD)
    
    -- 수정 관리
    is_known_issue BOOLEAN DEFAULT FALSE,           -- 알려진 이슈 여부
    fix_priority INTEGER DEFAULT 0,                 -- 수정 우선순위 (1:낮음 ~ 5:높음)
    fix_status VARCHAR(50) DEFAULT 'open',          -- 수정 상태 ('open', 'investigating', 'fixing', 'fixed')
    
    -- 해결 방안 정보
    suggested_fix TEXT,                             -- 제안된 해결 방법
    fix_implemented_at TIMESTAMP NULL,             -- 수정 적용 시간
    fix_notes TEXT,                                 -- 수정 관련 메모
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),             -- 패턴 등록 시간
    updated_at TIMESTAMP DEFAULT NOW()              -- 마지막 업데이트 시간
);

-- ===================================================================
-- 3. 재시도 이력 테이블 (retry_history)
-- ===================================================================
-- 목적: 각 오류에 대한 재시도 시도를 상세히 기록하여 재시도 전략 최적화
-- 특징: 시도별 결과 추적, 백오프 전략 기록, 성공률 분석
-- 관계: trading_errors(N:1) - 하나의 오류에 여러 재시도 기록
-- ===================================================================
-- 재시도 이력 테이블 생성
CREATE TABLE retry_history (
    -- 기본 식별자
    id SERIAL PRIMARY KEY,
    trading_error_id INTEGER NOT NULL REFERENCES trading_errors(id) ON DELETE CASCADE,
    
    -- 재시도 정보
    retry_attempt INTEGER NOT NULL,                 -- 재시도 시도 번호 (1, 2, 3...)
    retry_started_at TIMESTAMP DEFAULT NOW(),       -- 재시도 시작 시간
    retry_completed_at TIMESTAMP NULL,              -- 재시도 완료 시간
    
    -- 재시도 결과
    success BOOLEAN DEFAULT FALSE,                  -- 재시도 성공 여부
    error_message TEXT,                             -- 재시도 실패 시 오류 메시지
    response_data JSONB,                            -- 재시도 시 받은 응답 데이터
    
    -- 재시도 전략 정보
    backoff_delay_ms INTEGER,                       -- 적용된 백오프 지연 시간 (밀리초)
    strategy_used VARCHAR(50),                      -- 사용된 재시도 전략 ('exponential', 'linear', 'custom')
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW()              -- 기록 생성 시간
);

-- ===================================================================
-- 4. 거래 오류 알림 테이블 (error_notifications)
-- ===================================================================
-- 목적: 중요한 오류 발생 시 관리자 및 사용자에게 알림 발송 이력 관리
-- 특징: 다양한 알림 채널 지원, 발송 상태 추적, 중복 알림 방지
-- 관계: trading_errors(N:1) - 하나의 오류에 여러 알림 발송 가능
-- ===================================================================
-- 거래 오류 알림 테이블 생성
CREATE TABLE error_notifications (
    -- 기본 식별자
    id SERIAL PRIMARY KEY,
    trading_error_id INTEGER NOT NULL REFERENCES trading_errors(id) ON DELETE CASCADE,
    
    -- 알림 채널 정보
    notification_type VARCHAR(50) NOT NULL,         -- 알림 타입 ('email', 'slack', 'webhook', 'dashboard')
    recipient VARCHAR(200),                         -- 수신자 정보 (이메일 주소, 슬랙 채널, 웹훅 URL 등)
    
    -- 알림 내용
    subject VARCHAR(200),                           -- 알림 제목
    message TEXT,                                   -- 알림 메시지 본문
    
    -- 발송 상태 추적
    sent_at TIMESTAMP NULL,                         -- 발송 완료 시간
    delivery_status VARCHAR(20) DEFAULT 'pending', -- 발송 상태 ('pending', 'sent', 'failed')
    delivery_error TEXT,                            -- 발송 실패 시 오류 메시지
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW()              -- 알림 생성 시간
);

-- ===================================================================
-- 성능 최적화를 위한 인덱스 생성
-- ===================================================================

-- 기존 인덱스 삭제 (있다면)
DROP INDEX IF EXISTS idx_trading_errors_user_id;
DROP INDEX IF EXISTS idx_trading_errors_exchange;
DROP INDEX IF EXISTS idx_trading_errors_severity;
DROP INDEX IF EXISTS idx_trading_errors_category;
DROP INDEX IF EXISTS idx_trading_errors_signature;
DROP INDEX IF EXISTS idx_trading_errors_created_at;
DROP INDEX IF EXISTS idx_trading_errors_retry_status;
DROP INDEX IF EXISTS idx_trading_errors_resolved;
DROP INDEX IF EXISTS idx_trading_errors_next_retry;
DROP INDEX IF EXISTS idx_error_patterns_signature;
DROP INDEX IF EXISTS idx_error_patterns_priority;
DROP INDEX IF EXISTS idx_error_patterns_status;
DROP INDEX IF EXISTS idx_error_patterns_occurrence;
DROP INDEX IF EXISTS idx_retry_history_error_id;
DROP INDEX IF EXISTS idx_retry_history_attempt;
DROP INDEX IF EXISTS idx_retry_history_success;
DROP INDEX IF EXISTS idx_error_notifications_error_id;
DROP INDEX IF EXISTS idx_error_notifications_status;
DROP INDEX IF EXISTS idx_error_notifications_type;

-- trading_errors 테이블 인덱스
CREATE INDEX idx_trading_errors_user_id ON trading_errors(user_id);                    -- 사용자별 오류 조회
CREATE INDEX idx_trading_errors_exchange ON trading_errors(exchange);                  -- 거래소별 오류 조회
CREATE INDEX idx_trading_errors_severity ON trading_errors(error_severity);            -- 심각도별 오류 조회
CREATE INDEX idx_trading_errors_category ON trading_errors(error_category);            -- 카테고리별 오류 조회
CREATE INDEX idx_trading_errors_signature ON trading_errors(error_signature);          -- 오류 시그니처별 조회
CREATE INDEX idx_trading_errors_created_at ON trading_errors(created_at);              -- 시간별 오류 조회
CREATE INDEX idx_trading_errors_retry_status ON trading_errors(retry_status);          -- 재시도 상태별 조회
CREATE INDEX idx_trading_errors_resolved ON trading_errors(is_resolved);               -- 해결 상태별 조회
CREATE INDEX idx_trading_errors_next_retry ON trading_errors(next_retry_at)            -- 재시도 스케줄링
    WHERE next_retry_at IS NOT NULL;

-- error_patterns 테이블 인덱스
CREATE UNIQUE INDEX idx_error_patterns_signature ON error_patterns(error_signature);   -- 시그니처 기반 패턴 검색
CREATE INDEX idx_error_patterns_priority ON error_patterns(fix_priority DESC);         -- 우선순위별 정렬
CREATE INDEX idx_error_patterns_status ON error_patterns(fix_status);                  -- 수정 상태별 조회
CREATE INDEX idx_error_patterns_occurrence ON error_patterns(occurrence_count DESC);   -- 발생 빈도별 정렬

-- retry_history 테이블 인덱스
CREATE INDEX idx_retry_history_error_id ON retry_history(trading_error_id);            -- 오류별 재시도 이력
CREATE INDEX idx_retry_history_attempt ON retry_history(retry_attempt);                -- 재시도 횟수별 조회
CREATE INDEX idx_retry_history_success ON retry_history(success);                      -- 성공/실패별 조회

-- error_notifications 테이블 인덱스
CREATE INDEX idx_error_notifications_error_id ON error_notifications(trading_error_id); -- 오류별 알림 조회
CREATE INDEX idx_error_notifications_status ON error_notifications(delivery_status);    -- 발송 상태별 조회
CREATE INDEX idx_error_notifications_type ON error_notifications(notification_type);    -- 알림 타입별 조회

-- ===================================================================
-- 자동 타임스탬프 업데이트를 위한 트리거
-- ===================================================================

-- 기존 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS update_trading_errors_updated_at ON trading_errors;
DROP TRIGGER IF EXISTS update_error_patterns_updated_at ON error_patterns;

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_trading_errors_updated_at 
    BEFORE UPDATE ON trading_errors 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_error_patterns_updated_at 
    BEFORE UPDATE ON error_patterns 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ===================================================================
-- 테이블 및 컬럼 설명 (COMMENT)
-- ===================================================================

-- 테이블 설명
COMMENT ON TABLE trading_errors IS '자동매매 거래 중 발생한 모든 오류를 상세히 추적하는 핵심 테이블. 오류 분류, 재시도 관리, 해결 추적을 통해 시스템 안정성 향상에 기여';
COMMENT ON TABLE error_patterns IS '반복되는 오류 패턴을 시그니처 기반으로 그룹핑하여 분석. 근본 원인 파악과 우선순위 기반 수정 계획 수립에 활용';
COMMENT ON TABLE retry_history IS '각 오류에 대한 재시도 시도를 상세 기록. 백오프 전략 효과 분석과 재시도 정책 최적화에 활용';
COMMENT ON TABLE error_notifications IS '중요 오류 발생 시 다양한 채널(이메일, 슬랙, 웹훅)을 통한 알림 발송 이력 관리';

-- trading_errors 테이블 주요 컬럼 설명
COMMENT ON COLUMN trading_errors.error_category IS '오류 분류: api(API호출), network(네트워크), validation(검증), balance(잔고), order(주문), system(시스템)';
COMMENT ON COLUMN trading_errors.error_severity IS '오류 심각도: low(일시적), medium(복구필요), high(즉시개입), critical(시스템중단)';
COMMENT ON COLUMN trading_errors.retry_status IS '재시도 진행상태: pending(대기), retrying(진행중), success(성공), failed(실패), abandoned(포기)';
COMMENT ON COLUMN trading_errors.resolution_method IS '해결방법: auto_retry(자동재시도), manual_fix(수동수정), ignored(무시), compensated(보상처리)';
COMMENT ON COLUMN trading_errors.error_signature IS 'MD5 해시 기반 오류 고유 식별자. 동일 패턴 오류 그룹핑에 사용';
COMMENT ON COLUMN trading_errors.request_payload IS 'API 요청 시 전송한 데이터 (JSON). 오류 재현 및 분석에 활용';
COMMENT ON COLUMN trading_errors.response_data IS 'API 응답 데이터 (JSON). 오류 원인 파악에 활용';

-- error_patterns 테이블 주요 컬럼 설명  
COMMENT ON COLUMN error_patterns.error_signature IS 'trading_errors 테이블과 연결되는 오류 패턴 고유 식별자 (MD5 해시)';
COMMENT ON COLUMN error_patterns.fix_priority IS '수정 우선순위: 1(낮음) → 5(높음). 발생빈도, 영향도, 심각도 기반 산정';
COMMENT ON COLUMN error_patterns.fix_status IS '수정진행상태: open(신규), investigating(조사중), fixing(수정중), fixed(완료)';
COMMENT ON COLUMN error_patterns.estimated_loss IS '해당 패턴으로 인한 추정 손실 금액 (USD 기준)';

-- retry_history 테이블 주요 컬럼 설명
COMMENT ON COLUMN retry_history.backoff_delay_ms IS '해당 재시도에 적용된 백오프 지연시간 (밀리초). 전략 효과 분석에 활용';
COMMENT ON COLUMN retry_history.strategy_used IS '적용된 재시도 전략: exponential(지수), linear(선형), custom(커스텀)';

-- error_notifications 테이블 주요 컬럼 설명
COMMENT ON COLUMN error_notifications.notification_type IS '알림채널: email(이메일), slack(슬랙), webhook(웹훅), dashboard(대시보드)';
COMMENT ON COLUMN error_notifications.delivery_status IS '발송상태: pending(대기), sent(발송완료), failed(발송실패)';

-- ===================================================================
-- 실행 가이드 및 사용 예시
-- ===================================================================
/*
1. 실행 방법:
   -- 안전한 실행 (기존 데이터 보존하려면 백업 먼저!)
   pg_dump -h localhost -U username database_name > backup.sql
   
   -- 테이블 생성 실행
   psql -h localhost -U username -d database_name -f create-error-tracking-tables.sql
   
   -- 실행 확인
   psql -h localhost -U username -d database_name -c "\d trading_errors"

2. 기본 데이터 확인:
   SELECT * FROM trading_errors LIMIT 5;
   SELECT * FROM error_patterns ORDER BY occurrence_count DESC LIMIT 10;

3. 통계 쿼리 예시:
   -- 오류 심각도별 통계
   SELECT error_severity, COUNT(*) as count 
   FROM trading_errors 
   WHERE created_at >= NOW() - INTERVAL '7 days' 
   GROUP BY error_severity;

   -- 거래소별 오류 발생률
   SELECT exchange, error_category, COUNT(*) as error_count
   FROM trading_errors 
   WHERE created_at >= NOW() - INTERVAL '1 month'
   GROUP BY exchange, error_category
   ORDER BY error_count DESC;

   -- 재시도 성공률
   SELECT 
     te.error_category,
     COUNT(*) as total_errors,
     SUM(CASE WHEN te.retry_status = 'success' THEN 1 ELSE 0 END) as resolved_by_retry,
     ROUND(
       SUM(CASE WHEN te.retry_status = 'success' THEN 1 ELSE 0 END)::decimal / COUNT(*) * 100, 2
     ) as retry_success_rate
   FROM trading_errors te
   WHERE te.retry_count > 0
   GROUP BY te.error_category;

4. 관리 작업:
   -- 오래된 해결된 오류 정리 (90일 이전)
   DELETE FROM trading_errors 
   WHERE is_resolved = true 
     AND resolved_at < NOW() - INTERVAL '90 days';

   -- 알림 발송 실패 재처리
   UPDATE error_notifications 
   SET delivery_status = 'pending' 
   WHERE delivery_status = 'failed' 
     AND created_at >= NOW() - INTERVAL '1 hour';

5. 모니터링 쿼리:
   -- 최근 1시간 내 치명적 오류
   SELECT * FROM trading_errors 
   WHERE error_severity = 'critical' 
     AND created_at >= NOW() - INTERVAL '1 hour';

   -- 재시도 대기 중인 오류들
   SELECT * FROM trading_errors 
   WHERE retry_status = 'pending' 
     AND (next_retry_at IS NULL OR next_retry_at <= NOW())
     AND retry_count < max_retries;
*/
