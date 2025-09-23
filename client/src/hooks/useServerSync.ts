import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from './use-websocket';

export interface ServerSyncData {
  type: string;
  data: any;
  timestamp: number;
  deviceId: string;
  userId: string;
}

export interface ServerSyncState {
  kimchiData: any[];
  isAutoTrading: boolean;
  currentExchangeRate: number | null;
  positions: any[];
  balances: any;
  lastUpdate: number;
}

// 디바이스 고유 ID 생성
const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

export function useServerSync(userId?: string) {
  const [syncState, setSyncState] = useState<ServerSyncState>({
    kimchiData: [],
    isAutoTrading: false,
    currentExchangeRate: null,
    positions: [],
    balances: null,
    lastUpdate: 0
  });

  const deviceId = useRef(getDeviceId());
  const { isConnected, subscribe } = useWebSocket();
  const syncListeners = useRef<Map<string, (data: any) => void>>(new Map());
  
  // 중복 이벤트 방지를 위한 최근 처리된 메시지 추적
  const recentMessages = useRef<Set<string>>(new Set());

  // WebSocket 연결 시 디바이스 등록
  useEffect(() => {
    if (!userId || !isConnected) return;

    // 디바이스 등록을 위한 WebSocket 메시지 리스너
    const unsubscribeRegister = subscribe('device-registered', (data: any) => {
      console.log('✅ 디바이스 등록 완료:', data);
    });

    // 디바이스 등록 메시지 전송 (WebSocket을 통해 직접)
    const registerDevice = async () => {
      try {
        // 임시로 fetch를 사용하여 디바이스 등록 메시지 전송
        await fetch('/api/device-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            deviceId: deviceId.current,
            userId
          })
        });
        console.log('📱 디바이스 등록 요청 전송:', deviceId.current);
      } catch (error) {
        console.warn('⚠️ 디바이스 등록 실패:', error);
      }
    };

    // 연결 후 잠시 대기 후 등록
    const timer = setTimeout(registerDevice, 1000);
    return () => {
      clearTimeout(timer);
      unsubscribeRegister();
    };
  }, [userId, isConnected, subscribe]);

  // WebSocket을 통한 서버 동기화 메시지 수신
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribe('device-sync', (syncData: ServerSyncData) => {
      // 자신이 보낸 메시지는 무시
      if (syncData.deviceId === deviceId.current) {
        console.log('🔄 자신이 보낸 동기화 메시지 무시');
        return;
      }

      // 다른 사용자의 메시지는 무시
      if (syncData.userId !== userId) {
        console.log('🔄 다른 사용자 동기화 메시지 무시');
        return;
      }

      // 중복 메시지 방지
      const messageId = `${syncData.type}-${syncData.timestamp}-${syncData.deviceId}`;
      if (recentMessages.current.has(messageId)) {
        console.log('🔄 중복 서버 동기화 메시지 무시:', messageId);
        return;
      }

      // 메시지 ID 추가 및 10초 후 자동 제거
      recentMessages.current.add(messageId);
      setTimeout(() => {
        recentMessages.current.delete(messageId);
      }, 10000);

      console.log('📡 서버 동기화 수신:', {
        type: syncData.type,
        from: syncData.deviceId,
        to: deviceId.current,
        timestamp: new Date(syncData.timestamp).toLocaleTimeString()
      });

      // 리스너 호출
      const listener = syncListeners.current.get(syncData.type);
      if (listener) {
        console.log('🎯 서버 동기화 리스너 호출:', syncData.type);
        listener(syncData.data);
      } else {
        console.warn('⚠️ 서버 동기화 리스너 없음:', syncData.type);
      }

      // 전체 상태 동기화
      if (syncData.type === 'FULL_STATE_SYNC') {
        setSyncState(prevState => ({
          ...prevState,
          ...syncData.data,
          lastUpdate: syncData.timestamp
        }));
      }
    });

    console.log('✅ 서버 동기화 리스너 등록 완료:', userId);
    return unsubscribe;
  }, [subscribe, userId]);

  // 서버를 통한 상태 브로드캐스트
  const broadcastToServer = useCallback(async (type: string, data: any) => {
    if (!userId || !isConnected) {
      console.warn('⚠️ 서버 동기화 불가 - userId 또는 WebSocket 연결 없음');
      return;
    }

    const syncData: ServerSyncData = {
      type,
      data,
      timestamp: Date.now(),
      deviceId: deviceId.current,
      userId
    };

    try {
      // 서버로 동기화 메시지 전송
      const response = await fetch('/api/device-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(syncData)
      });

      if (!response.ok) {
        throw new Error(`서버 동기화 실패: ${response.status}`);
      }

      console.log('📤 서버 동기화 전송 성공:', { type, deviceId: deviceId.current });
    } catch (error) {
      console.error('❌ 서버 동기화 전송 실패:', error);
      
      // 서버 전송 실패 시 localStorage 백업 사용
      try {
        localStorage.setItem('server-sync-backup', JSON.stringify(syncData));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'server-sync-backup',
          newValue: JSON.stringify(syncData),
          url: window.location.href
        }));
        console.log('💾 localStorage 백업 동기화 사용');
      } catch (backupError) {
        console.error('❌ 백업 동기화도 실패:', backupError);
      }
    }
  }, [userId, isConnected]);

  // localStorage 백업 동기화 (서버 실패 시)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'server-sync-backup' && e.newValue) {
        try {
          const syncData: ServerSyncData = JSON.parse(e.newValue);
          
          // 자신이 저장한 데이터는 무시
          if (syncData.deviceId === deviceId.current) return;
          
          // 다른 사용자의 메시지는 무시
          if (syncData.userId !== userId) return;

          console.log('💾 localStorage 백업 동기화 수신:', {
            type: syncData.type,
            from: syncData.deviceId
          });

          // 리스너 호출
          const listener = syncListeners.current.get(syncData.type);
          if (listener) {
            listener(syncData.data);
          }
        } catch (error) {
          console.error('❌ localStorage 백업 동기화 파싱 실패:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId]);

  // 전체 상태 동기화
  const syncFullState = useCallback((state: Partial<ServerSyncState>) => {
    setSyncState(prevState => {
      const newState = { ...prevState, ...state, lastUpdate: Date.now() };
      broadcastToServer('FULL_STATE_SYNC', newState);
      return newState;
    });
  }, [broadcastToServer]);

  // 개별 상태 동기화 함수들
  const syncKimchiData = useCallback((data: any[]) => {
    setSyncState(prev => ({ ...prev, kimchiData: data, lastUpdate: Date.now() }));
    broadcastToServer('KIMCHI_DATA', data);
  }, [broadcastToServer]);

  const syncTradingStatus = useCallback((isActive: boolean) => {
    setSyncState(prev => ({ ...prev, isAutoTrading: isActive, lastUpdate: Date.now() }));
    broadcastToServer('TRADING_STATUS', isActive);
  }, [broadcastToServer]);

  const syncExchangeRate = useCallback((rate: number | null) => {
    setSyncState(prev => ({ ...prev, currentExchangeRate: rate, lastUpdate: Date.now() }));
    broadcastToServer('EXCHANGE_RATE', rate);
  }, [broadcastToServer]);

  const syncPositions = useCallback((positions: any[]) => {
    setSyncState(prev => ({ ...prev, positions, lastUpdate: Date.now() }));
    broadcastToServer('POSITIONS', positions);
  }, [broadcastToServer]);

  const syncBalances = useCallback((balances: any) => {
    setSyncState(prev => ({ ...prev, balances, lastUpdate: Date.now() }));
    broadcastToServer('BALANCES', balances);
  }, [broadcastToServer]);

  // 동기화 리스너 등록
  const subscribe_sync = useCallback((type: string, callback: (data: any) => void) => {
    console.log('🔗 서버 동기화 리스너 등록:', type);
    syncListeners.current.set(type, callback);
    return () => {
      console.log('🔓 서버 동기화 리스너 해제:', type);
      syncListeners.current.delete(type);
    };
  }, []);

  // 동기화 테스트 함수
  const testSync = useCallback(() => {
    const testData = {
      message: '서버 동기화 테스트',
      timestamp: new Date().toISOString(),
      deviceId: deviceId.current
    };
    console.log('🧪 서버 동기화 테스트 시작:', testData);
    broadcastToServer('TEST_SYNC', testData);
  }, [broadcastToServer]);

  // 초기 상태 로드
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('server-sync-state');
      if (savedState) {
        const state = JSON.parse(savedState);
        setSyncState(prev => ({ ...prev, ...state }));
      }
    } catch (error) {
      console.error('❌ 초기 상태 로드 실패:', error);
    }
  }, []);

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('server-sync-state', JSON.stringify(syncState));
    } catch (error) {
      console.error('❌ 상태 저장 실패:', error);
    }
  }, [syncState]);

  return {
    syncState,
    syncFullState,
    syncKimchiData,
    syncTradingStatus,
    syncExchangeRate,
    syncPositions,
    syncBalances,
    subscribe: subscribe_sync,
    testSync,
    deviceId: deviceId.current,
    isOnline: navigator.onLine && isConnected,
    isServerConnected: isConnected
  };
}
