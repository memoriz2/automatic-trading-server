-- ===== 새로운 어드민 유저 추가 =====

-- 1. 새로운 어드민 사용자 생성
DO $$ 
DECLARE 
    new_user_id INTEGER;
BEGIN 
    -- admin2 사용자가 이미 존재하는지 확인
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin2') THEN
        -- users 테이블에 새 어드민 사용자 추가
        INSERT INTO users (
            username, 
            password, 
            role, 
            is_active, 
            created_at, 
            updated_at
        ) VALUES (
            'admin2',
            'any_password_here', -- 어떤 비밀번호든 상관없음 (프리패스)
            'admin',
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO new_user_id;
        
        RAISE NOTICE '✅ admin2 사용자가 생성되었습니다. ID: %', new_user_id;
        
        -- admins 테이블에도 추가
        INSERT INTO admins (
            user_id,
            admin_level,
            permissions,
            is_active,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            'super_admin',
            '["trading", "user_management", "system_config"]',
            true,
            NULL, -- 시스템에서 생성한 것으로 처리
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ admin2 사용자가 admins 테이블에 추가되었습니다.';
        
    ELSE
        RAISE NOTICE '⚠️ admin2 사용자가 이미 존재합니다.';
    END IF;
END $$;

-- 2. 추가 어드민 사용자들 (필요시)
DO $$ 
DECLARE 
    manager_user_id INTEGER;
BEGIN 
    -- manager 사용자 생성
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'manager') THEN
        INSERT INTO users (
            username, 
            password, 
            role, 
            is_active, 
            created_at, 
            updated_at
        ) VALUES (
            'manager',
            'any_password_here', -- 어떤 비밀번호든 상관없음 (프리패스)
            'admin',
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO manager_user_id;
        
        RAISE NOTICE '✅ manager 사용자가 생성되었습니다. ID: %', manager_user_id;
        
        -- admins 테이블에 추가 (일반 관리자 권한)
        INSERT INTO admins (
            user_id,
            admin_level,
            permissions,
            is_active,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            manager_user_id,
            'editor',
            '["trading", "monitoring"]',
            true,
            NULL, -- 시스템에서 생성한 것으로 처리
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ manager 사용자가 admins 테이블에 추가되었습니다.';
        
    ELSE
        RAISE NOTICE '⚠️ manager 사용자가 이미 존재합니다.';
    END IF;
END $$;

-- 3. 모든 어드민 사용자 확인
SELECT 
    u.id,
    u.username,
    u.role as user_role,
    a.admin_level,
    a.permissions,
    a.is_active as admin_active,
    u.created_at
FROM users u
LEFT JOIN admins a ON u.id = a.user_id
WHERE u.role = 'admin' OR a.user_id IS NOT NULL
ORDER BY u.created_at;

-- ===== 어드민 로그인 정보 =====
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 어드민 사용자 생성 완료!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 어드민 프리패스 로그인 정보:';
    RAISE NOTICE '   🔑 모든 admin 역할 계정: 사용자명 / $2b$10$defaultAdminPassword.hash';
    RAISE NOTICE '';
    RAISE NOTICE '   예시:';
    RAISE NOTICE '   • admin   / $2b$10$defaultAdminPassword.hash  ✅';
    RAISE NOTICE '   • admin2  / $2b$10$defaultAdminPassword.hash  ✅';  
    RAISE NOTICE '   • manager / $2b$10$defaultAdminPassword.hash  ✅';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  admin 역할 계정은 모두 동일한 해시값으로 로그인 가능!';
    RAISE NOTICE '';
END $$;
