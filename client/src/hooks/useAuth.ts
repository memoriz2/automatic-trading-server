import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  token?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null
  });

  // 초기 로드: 서버 세션(쿠키)로 현재 사용자 조회 → 실패 시 세션스토리지 폴백
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/auth/me');
        const user = await res.json();
        if (!cancelled) {
          sessionStorage.setItem('user', JSON.stringify(user));
          setAuthState({ user, isAuthenticated: true, isLoading: false, token: null });
          return;
        }
      } catch {
        // 쿠키 세션이 없거나 만료됨 → 세션스토리지 폴백 시도
        try {
          const storedUser = sessionStorage.getItem('user');
          const storedToken = sessionStorage.getItem('authToken');
          if (storedUser) {
            setAuthState({
              user: JSON.parse(storedUser),
              isAuthenticated: true,
              isLoading: false,
              token: storedToken,
            });
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } catch {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = (user: User, token?: string) => {
    // 쿠키 기반 인증이 기본: 토큰이 있으면 저장, 없으면 쿠키만 사용
    if (token) {
      sessionStorage.setItem('authToken', token);
    } else {
      sessionStorage.removeItem('authToken');
    }
    sessionStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      user: token ? { ...user, token } : { ...user },
      isAuthenticated: true,
      isLoading: false,
      token: token ?? null,
    });
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    setAuthState({ user: null, isAuthenticated: false, isLoading: false, token: null });
  };

  return {
    ...authState,
    login,
    logout
  };
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