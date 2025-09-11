import { useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/queryClient';

interface ActivityTrackerOptions {
  interval?: number; // 활동 전송 간격 (밀리초)
  debounceTime?: number; // 마우스 움직임 디바운스 시간
}

export function useActivityTracker(options: ActivityTrackerOptions = {}) {
  const {
    interval = 30000, // 30초마다 활동 전송
    debounceTime = 1000 // 1초 디바운스
  } = options;

  const lastActivityRef = useRef<number>(Date.now());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 활동 감지 함수
  const trackActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // 디바운스 처리
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      // 실제 활동이 있었는지 확인 (최소 1초 간격)
      if (now - lastActivityRef.current < 1000) {
        return;
      }

      // 서버에 활동 알림 (백그라운드에서 조용히)
      apiFetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timestamp: now,
          type: 'user_activity',
          source: 'client_tracker'
        })
      }).catch((error) => {
        // 인증 실패 시 전역 이벤트 발생
        if (error.message === 'Unauthorized') {
          window.dispatchEvent(new CustomEvent('auth-failed', { 
            detail: { clearAuth: true } 
          }));
        }
        // 그 외의 경우는 무시
      });
    }, debounceTime);
  }, [debounceTime]);

  // 마우스 이벤트 리스너
  useEffect(() => {
    const events = [
      'mousemove',
      'mousedown',
      'mouseup',
      'click',
      'scroll',
      'keydown',
      'keyup',
      'touchstart',
      'touchend',
      'touchmove'
    ];

    // 이벤트 리스너 등록
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // 정리 함수
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [trackActivity]);

  // 주기적 활동 전송
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // 5분 이상 활동이 없으면 전송하지 않음
      if (timeSinceLastActivity < 5 * 60 * 1000) {
        apiFetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            timestamp: now,
            type: 'heartbeat',
            source: 'client_tracker'
          })
        }).catch((error) => {
          // 인증 실패 시 전역 이벤트 발생
          if (error.message === 'Unauthorized') {
            window.dispatchEvent(new CustomEvent('auth-failed', { 
              detail: { clearAuth: true } 
            }));
          }
          // 그 외의 경우는 무시
        });
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval]);

  return {
    trackActivity // 수동으로 활동 추적하고 싶을 때 사용
  };
}
