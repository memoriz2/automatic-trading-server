import { useState, useEffect, useCallback } from 'react';
import { apiFetchJson } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  token?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    // setIsLoading(true)는 초기 로딩 시에만 적용되도록 useEffect에서 호출
    try {
      console.log('🔍 useAuth: 서버 세션 확인 중...');
      const userData = await apiFetchJson('/api/auth/me');
      if (userData && userData.id) {
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ useAuth: 세션 확인됨', userData);
      } else {
        throw new Error('No session');
      }
    } catch (error) {
        console.log('❌ useAuth: 서버 세션 확인 실패. 세션스토리지 확인.', error);
        try {
            const storedUser = sessionStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                setUser(null);
                if (window.location.pathname !== '/login') {
                    window.dispatchEvent(new CustomEvent('auth-failed'));
                }
            }
        } catch (e) {
            setUser(null);
        }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    checkSession();
  }, [checkSession]);

  // 주기적 재검사는 전역 Provider나 사용자 동작 이벤트에서만 수행하도록 변경
  
  const login = (userData: User, token?: string) => {
    if (token) {
      sessionStorage.setItem('authToken', token);
    } else {
      sessionStorage.removeItem('authToken');
    }
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(token ? { ...userData, token } : userData);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  return { user, isLoading, isAuthenticated: !!user, login, logout, checkSession };
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