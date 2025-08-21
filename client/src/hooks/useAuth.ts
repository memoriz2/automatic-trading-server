import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
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
    const initAuth = () => {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          token: null
        });
        return;
      }

      try {
        // localStorage에서 사용자 정보 파싱
        const user = JSON.parse(userStr);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          token
        });
      } catch (error) {
        // 파싱 실패시 로그아웃 처리
        console.error('사용자 정보 파싱 실패:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          token: null
        });
      }
    };

    initAuth();
  }, []);

  const login = (user: User, token: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      token
    });
  };

  const logout = () => {
    console.log('useAuth logout 함수 실행');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
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
  const token = localStorage.getItem('authToken');
  
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