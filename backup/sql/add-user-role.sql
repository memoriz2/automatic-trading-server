-- ===== USER 테이블에 ROLE 컬럼 추가 =====

-- 1. role 컬럼 추가 (이미 존재할 수 있으므로 IF NOT EXISTS 사용)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL;
        RAISE NOTICE '✅ users 테이블에 role 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE '⚠️ users 테이블에 role 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 2. 기존 admin 사용자에게 admin 역할 부여
UPDATE users 
SET role = 'admin' 
WHERE username = 'admin';

-- 3. 역할별 사용자 수 확인
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;

-- 4. admin 사용자 확인
SELECT 
    id,
    username,
    role,
    created_at,
    last_login_at
FROM users 
WHERE role = 'admin'
ORDER BY created_at;

-- 5. 인덱스 추가 (성능 향상)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname = 'idx_users_role'
    ) THEN
        CREATE INDEX idx_users_role ON users(role);
        RAISE NOTICE '✅ users.role 인덱스가 생성되었습니다.';
    ELSE
        RAISE NOTICE '⚠️ users.role 인덱스가 이미 존재합니다.';
    END IF;
END $$;

-- ===== 완료 메시지 =====
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 USER ROLE 설정 완료!';
    RAISE NOTICE '   - admin 사용자: role = "admin"';
    RAISE NOTICE '   - 기타 사용자: role = "user" (기본값)';
    RAISE NOTICE '';
END $$;
