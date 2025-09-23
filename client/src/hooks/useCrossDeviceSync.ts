import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

export interface SyncData {
  type: string;
  data: any;
  timestamp: number;
  deviceId: string;
}

export interface SyncState {
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

export function useCrossDeviceSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    kimchiData: [],
    isAutoTrading: false,
    currentExchangeRate: null,
    positions: [],
    balances: null,
    lastUpdate: 0
  });

  const deviceId = useRef(getDeviceId());
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const syncListeners = useRef<Map<string, (data: any) => void>>(new Map());
  
  // 중복 이벤트 방지를 위한 최근 처리된 메시지 추적
  const recentMessages = useRef<Set<string>>(new Set());
  const messageCleanupInterval = useRef<NodeJS.Timeout | null>(null);

  // BroadcastChannel 초기화 (같은 도메인의 다른 탭과 동기화)
  useEffect(() => {
    try {
      broadcastChannel.current = new BroadcastChannel('trading-sync');
      
      broadcastChannel.current.onmessage = (event) => {
        const syncData: SyncData = event.data;
        
        // 자신이 보낸 메시지는 무시
        if (syncData.deviceId === deviceId.current) return;
        
        // 중복 메시지 방지 (메시지 ID = type + timestamp + deviceId)
        const messageId = `${syncData.type}-${syncData.timestamp}-${syncData.deviceId}`;
        if (recentMessages.current.has(messageId)) {
          logger.sync?.debug('🔄 중복 메시지 무시:', messageId);
          return;
        }
        
        // 메시지 ID 추가 및 5초 후 자동 제거
        recentMessages.current.add(messageId);
        setTimeout(() => {
          recentMessages.current.delete(messageId);
        }, 5000);
        
        console.log('📱 BroadcastChannel 수신:', {
          type: syncData.type,
          from: syncData.deviceId,
          to: deviceId.current,
          timestamp: new Date(syncData.timestamp).toLocaleTimeString()
        });

        logger.sync?.info('📱 크로스 디바이스 동기화 수신:', {
          type: syncData.type,
          from: syncData.deviceId,
          timestamp: new Date(syncData.timestamp).toLocaleTimeString()
        });

        // 리스너 호출
        const listener = syncListeners.current.get(syncData.type);
        if (listener) {
          console.log('🎯 동기화 리스너 호출:', syncData.type);
          listener(syncData.data);
        } else {
          console.warn('⚠️ 동기화 리스너 없음:', syncData.type);
        }

        // 전체 상태 동기화
        if (syncData.type === 'FULL_STATE_SYNC') {
          setSyncState(prevState => ({
            ...prevState,
            ...syncData.data,
            lastUpdate: syncData.timestamp
          }));
        }
      };

      console.log('✅ BroadcastChannel 초기화 완료:', deviceId.current);
      logger.sync?.info('📱 크로스 디바이스 동기화 채널 초기화 완료');
    } catch (error) {
      console.error('❌ BroadcastChannel 초기화 실패:', error);
      logger.sync?.error('❌ BroadcastChannel 초기화 실패:', error);
    }

    return () => {
      broadcastChannel.current?.close();
    };
  }, []);

  // localStorage 기반 동기화 (다른 디바이스와 동기화)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trading-sync-data' && e.newValue) {
        try {
          const syncData: SyncData = JSON.parse(e.newValue);
          
          // 자신이 저장한 데이터는 무시
          if (syncData.deviceId === deviceId.current) return;
          
          // 중복 메시지 방지
          const messageId = `${syncData.type}-${syncData.timestamp}-${syncData.deviceId}`;
          if (recentMessages.current.has(messageId)) {
            logger.sync?.debug('🔄 중복 localStorage 메시지 무시:', messageId);
            return;
          }
          
          // 메시지 ID 추가 및 5초 후 자동 제거
          recentMessages.current.add(messageId);
          setTimeout(() => {
            recentMessages.current.delete(messageId);
          }, 5000);
          
          console.log('💾 localStorage 수신:', {
            type: syncData.type,
            from: syncData.deviceId,
            to: deviceId.current
          });

          logger.sync?.info('💾 localStorage 동기화 수신:', {
            type: syncData.type,
            from: syncData.deviceId
          });

          // 리스너 호출
          const listener = syncListeners.current.get(syncData.type);
          if (listener) {
            console.log('🎯 localStorage 리스너 호출:', syncData.type);
            listener(syncData.data);
          } else {
            console.warn('⚠️ localStorage 리스너 없음:', syncData.type);
          }
        } catch (error) {
          logger.sync?.error('❌ localStorage 동기화 파싱 실패:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 상태 브로드캐스트
  const broadcastState = useCallback((type: string, data: any) => {
    const syncData: SyncData = {
      type,
      data,
      timestamp: Date.now(),
      deviceId: deviceId.current
    };

    try {
      // BroadcastChannel로 같은 도메인의 다른 탭에 전송
      if (broadcastChannel.current) {
        broadcastChannel.current.postMessage(syncData);
        console.log('📡 BroadcastChannel 전송:', { type, deviceId: deviceId.current });
      } else {
        console.warn('⚠️ BroadcastChannel이 초기화되지 않음');
      }
      
      // localStorage로 다른 디바이스와 동기화
      localStorage.setItem('trading-sync-data', JSON.stringify(syncData));
      console.log('💾 localStorage 저장:', { type, deviceId: deviceId.current });
      
      // 즉시 storage 이벤트 트리거 (같은 탭에서도 확인 가능)
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'trading-sync-data',
        newValue: JSON.stringify(syncData),
        url: window.location.href
      }));
      
      logger.sync?.debug('📤 상태 브로드캐스트:', { type, timestamp: syncData.timestamp });
    } catch (error) {
      logger.sync?.error('❌ 상태 브로드캐스트 실패:', error);
      console.error('❌ 동기화 브로드캐스트 오류:', error);
    }
  }, []);

  // 전체 상태 동기화
  const syncFullState = useCallback((state: Partial<SyncState>) => {
    setSyncState(prevState => {
      const newState = { ...prevState, ...state, lastUpdate: Date.now() };
      broadcastState('FULL_STATE_SYNC', newState);
      return newState;
    });
  }, [broadcastState]);

  // 개별 상태 동기화
  const syncKimchiData = useCallback((data: any[]) => {
    setSyncState(prev => ({ ...prev, kimchiData: data, lastUpdate: Date.now() }));
    broadcastState('KIMCHI_DATA', data);
  }, [broadcastState]);

  const syncTradingStatus = useCallback((isActive: boolean) => {
    setSyncState(prev => ({ ...prev, isAutoTrading: isActive, lastUpdate: Date.now() }));
    broadcastState('TRADING_STATUS', isActive);
  }, [broadcastState]);

  const syncExchangeRate = useCallback((rate: number | null) => {
    setSyncState(prev => ({ ...prev, currentExchangeRate: rate, lastUpdate: Date.now() }));
    broadcastState('EXCHANGE_RATE', rate);
  }, [broadcastState]);

  const syncPositions = useCallback((positions: any[]) => {
    setSyncState(prev => ({ ...prev, positions, lastUpdate: Date.now() }));
    broadcastState('POSITIONS', positions);
  }, [broadcastState]);

  const syncBalances = useCallback((balances: any) => {
    setSyncState(prev => ({ ...prev, balances, lastUpdate: Date.now() }));
    broadcastState('BALANCES', balances);
  }, [broadcastState]);

  // 동기화 리스너 등록
  const subscribe = useCallback((type: string, callback: (data: any) => void) => {
    console.log('🔗 동기화 리스너 등록:', type);
    syncListeners.current.set(type, callback);
    return () => {
      console.log('🔓 동기화 리스너 해제:', type);
      syncListeners.current.delete(type);
    };
  }, []);

  // 초기 상태 로드
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('trading-state');
      if (savedState) {
        const state = JSON.parse(savedState);
        setSyncState(prev => ({ ...prev, ...state }));
      }
    } catch (error) {
      logger.sync?.error('❌ 초기 상태 로드 실패:', error);
    }
  }, []);

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('trading-state', JSON.stringify(syncState));
    } catch (error) {
      logger.sync?.error('❌ 상태 저장 실패:', error);
    }
  }, [syncState]);

  // 동기화 테스트 함수
  const testSync = useCallback(() => {
    const testData = {
      message: '동기화 테스트',
      timestamp: new Date().toISOString(),
      deviceId: deviceId.current
    };
    console.log('🧪 동기화 테스트 시작:', testData);
    broadcastState('TEST_SYNC', testData);
  }, [broadcastState]);

  return {
    syncState,
    syncFullState,
    syncKimchiData,
    syncTradingStatus,
    syncExchangeRate,
    syncPositions,
    syncBalances,
    subscribe,
    testSync,
    deviceId: deviceId.current,
    isOnline: navigator.onLine
  };
}
