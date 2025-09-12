-- ===============================================
-- 어드민 테이블 생성 쿼리
-- ===============================================

-- 기존 테이블 삭제 (이름 충돌 방지)
DROP TABLE IF EXISTS admin_activity_logs CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_level VARCHAR(20) NOT NULL DEFAULT 'viewer', -- 'viewer', 'editor', 'super_admin'
    permissions JSONB DEFAULT '{}', -- 권한 설정 (JSON 형태)
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT unique_admin_user UNIQUE(user_id),
    CONSTRAINT valid_admin_level CHECK (admin_level IN ('viewer', 'editor', 'super_admin'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admins_level ON admins(admin_level, is_active);
CREATE INDEX IF NOT EXISTS idx_admins_created ON admins(created_at);

-- 어드민 활동 로그 테이블
CREATE TABLE admin_activity_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'user_create', 'strategy_delete', 'position_close' 등
    target_type VARCHAR(50) NOT NULL, -- 'user', 'strategy', 'position', 'trade' 등
    target_id INTEGER, -- 대상 ID
    details JSONB DEFAULT '{}', -- 상세 정보 (JSON 형태)
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_target_type CHECK (target_type IN ('user', 'strategy', 'position', 'trade', 'system'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_activity_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_date ON admin_activity_logs(created_at);

-- 기본 어드민 사용자 생성 및 어드민 권한 부여 (한 번에 처리)
-- =============================================
-- 어드민 로그인 정보:
-- 사용자명: admin
-- 비밀번호: $2b$10$defaultAdminPassword.hash
-- =============================================
DO $$
DECLARE
    admin_user_id INTEGER;
BEGIN
    -- 1. 기존 사용자 중에서 어드민 역할을 가진 사용자 찾기
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE role = 'admin' OR username = 'admin' 
    LIMIT 1;
    
    -- 2. 어드민 사용자가 없으면 새로 생성
    IF admin_user_id IS NULL THEN
        INSERT INTO users (username, password, role, is_active, created_at, updated_at) 
        VALUES ('admin', '$2b$10$defaultAdminPassword.hash', 'admin', true, NOW(), NOW())
        RETURNING id INTO admin_user_id;
        
        RAISE NOTICE '새 어드민 사용자 생성됨: ID %', admin_user_id;
    ELSE
        RAISE NOTICE '기존 어드민 사용자 사용: ID %', admin_user_id;
    END IF;
    
    -- 3. 어드민 테이블에 권한 추가 (중복 방지)
    INSERT INTO admins (user_id, admin_level, permissions, created_by) 
    VALUES (admin_user_id, 'super_admin', '{"all": true}', admin_user_id)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        admin_level = 'super_admin',
        permissions = '{"all": true}',
        updated_at = NOW();
        
    RAISE NOTICE '어드민 권한 설정 완료: 사용자 ID %', admin_user_id;
END $$;

-- 권한 설정 예시 (JSON 형태)
-- {
--   "users": {"read": true, "write": true, "delete": false},
--   "strategies": {"read": true, "write": true, "delete": true},
--   "positions": {"read": true, "write": false, "delete": false},
--   "trades": {"read": true, "write": false, "delete": false},
--   "system": {"read": true, "write": false, "delete": false}
-- }
