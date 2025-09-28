import { useState, useEffect } from 'react';
import { apiFetchJson } from '@/lib/queryClient';

export interface SessionInfo {
  // Define session info interface based on actual usage
  [key: string]: any;
}

export function useSessionInfo() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showSessionInfo, setShowSessionInfo] = useState(false);

  const fetchSessionInfo = async () => {
    try {
      const response = await apiFetchJson('/api/admin/session');
      setSessionInfo(response);
    } catch (error) {
      console.error('세션 정보 조회 실패:', error);
    }
  };

  return {
    sessionInfo,
    showSessionInfo,
    setShowSessionInfo,
    fetchSessionInfo
  };
}