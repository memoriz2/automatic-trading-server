import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

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

  // 토큰 확인 및 사용자 정보 로드
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem('authToken');
      const storedUser = sessionStorage.getItem('user');

      if (storedToken && storedUser) {
        setAuthState({
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          isLoading: false,
          token: storedToken,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Failed to parse auth data from sessionStorage", error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (user: User, token: string) => {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      user: { ...user, token },
      isAuthenticated: true,
      isLoading: false,
      token
    });
  };

  const logout = () => {
    console.log('useAuth logout 함수 실행');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null
    });
    console.log('인증 상태 업데이트 완료:', { isAuthenticated: false });
  };

  return {
    ...authState,
    login,
    logout
  };
}

// 인증이 필요한 API 요청을 위한 헬퍼 함수
export async function authenticatedApiRequest(url: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('인증 토큰이 없습니다');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '요청에 실패했습니다');
  }

  return response.json();
}