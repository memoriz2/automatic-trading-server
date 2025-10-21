import { useEffect, useCallback, useRef } from 'react';
import { apiFetchJson } from '@/lib/queryClient';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser, clearUser, setLoading } from '@/store/slices/authSlice';

interface User {
  id: number;
  username: string;
  token?: string;
}

// 전역 플래그로 중복 실행 방지
let isCheckingSession = false;
let hasCheckedSession = false;

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isLoading, isAuthenticated } = useAppSelector((state) => state.auth);
  const mounted = useRef(false);

  const checkSession = useCallback(async (skipDuplicateCheck = false) => {
    // 이미 체크 중이거나 완료되었으면 스킵 (주기적 검증 시에는 강제 실행)
    if (!skipDuplicateCheck && (isCheckingSession || hasCheckedSession)) {
      console.log('⏭️ useAuth: 세션 확인 스킵 (이미 실행 중 또는 완료)');
      dispatch(setLoading(false));
      return;
    }

    isCheckingSession = true;
    try {
      console.log('🔍 useAuth: 서버 세션 확인 중...');
      const userData = await apiFetchJson('/api/auth/me');
      if (userData && userData.id) {
        dispatch(setUser(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ useAuth: 세션 확인됨', userData);
        hasCheckedSession = true;
      } else {
        throw new Error('No session');
      }
    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        console.log('❌ useAuth: 서버 세션 확인 실패. 세션스토리지 확인.', error);

        // 403 Forbidden - 승인 대기/거부 상태는 auth-failed 이벤트를 발생시키지 않음
        if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          console.log('⚠️ useAuth: 승인 대기 또는 거부 상태 - 로그인 페이지로 이동하지 않음');
          dispatch(clearUser());
          hasCheckedSession = true;
          return;
        }

        try {
            const storedUser = sessionStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                console.log('📱 useAuth: 세션스토리지에서 사용자 복원', parsedUser);
                dispatch(setUser(parsedUser));
            } else {
                console.log('❌ useAuth: 세션스토리지에도 사용자 없음 - null로 설정');
                dispatch(clearUser());
                if (window.location.pathname !== '/login') {
                    window.dispatchEvent(new CustomEvent('auth-failed'));
                }
            }
        } catch (e) {
            console.log('❌ useAuth: 세션스토리지 파싱 실패 - null로 설정');
            dispatch(clearUser());
        }
        hasCheckedSession = true;
    } finally {
      dispatch(setLoading(false));
      isCheckingSession = false;
    }
  }, [dispatch]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    // 세션스토리지에 사용자 정보가 없으면 세션 체크 안 함 (로그인 전)
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      dispatch(setLoading(false));
      return;
    }

    dispatch(setLoading(true));
    checkSession();

    // 🔒 주기적 세션 검증 (30초마다)
    // 다른 디바이스에서 로그인하면 기존 세션이 무효화되므로 주기적으로 체크
    const sessionCheckInterval = setInterval(async () => {
      const currentUser = sessionStorage.getItem('user');
      if (!currentUser) {
        clearInterval(sessionCheckInterval);
        return;
      }

      try {
        // skipDuplicateCheck=true로 강제 실행
        await checkSession(true);
      } catch (error) {
        console.log('⚠️ 주기적 세션 검증 실패:', error);
      }
    }, 30000); // 30초

    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [checkSession, dispatch]);

  const login = (userData: User, token?: string) => {
    console.log('🔐 useAuth: login() 호출됨', userData);
    if (token) {
      sessionStorage.setItem('authToken', token);
    } else {
      sessionStorage.removeItem('authToken');
    }
    sessionStorage.setItem('user', JSON.stringify(userData));
    const finalUser = token ? { ...userData, token } : userData;
    dispatch(setUser(finalUser));
    hasCheckedSession = true; // 로그인 후 세션 체크 완료로 표시
    console.log('✅ useAuth: 사용자 상태 업데이트 완료', finalUser);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    hasCheckedSession = false; // 로그아웃 시 세션 체크 플래그 초기화
    dispatch(clearUser());
  };

  return { user, isLoading, isAuthenticated, login, logout, checkSession };
}

// 인증이 필요한 API 요청을 위한 헬퍼 함수
export async function authenticatedApiRequest(url: string, options: RequestInit = {}) {
  // 기본: 쿠키 기반. 필요 시 세션 토큰이 있으면 Authorization 헤더 추가
  const token = sessionStorage.getItem('authToken');
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '요청에 실패했습니다');
  }

  return response.json();
}