/**
 * 안정적인 사용자 ID 관리 시스템
 * 세션이 끊겨도 전략 데이터가 유지되도록 보장
 */

interface UserIdManager {
  getCurrentUserId(): string;
  setUserId(userId: string): void;
  migrateUserData(oldUserId: string, newUserId: string): void;
  findAllUserData(): string[];
  getStableUserId(): string;
}

class UserIdManagerImpl implements UserIdManager {
  private readonly STABLE_USER_ID_KEY = 'stable-user-id';
  private readonly USER_ID_KEY = 'x-user-id';
  private readonly DEVICE_ID_KEY = 'device-id';

  /**
   * 디바이스별 고유 ID 생성 (브라우저 핑거프린팅 기반)
   */
  private generateDeviceId(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // 간단한 해시 함수로 고유 ID 생성
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * 안정적인 사용자 ID 반환 (디바이스별로 고유하고 영구적)
   */
  getStableUserId(): string {
    let stableId = localStorage.getItem(this.STABLE_USER_ID_KEY);
    
    if (!stableId) {
      // 기존 사용자 ID가 있으면 그것을 안정적 ID로 사용
      const existingUserId = localStorage.getItem(this.USER_ID_KEY);
      if (existingUserId) {
        stableId = `stable-${existingUserId}`;
      } else {
        // 새로운 안정적 ID 생성 (디바이스 기반)
        const deviceId = this.generateDeviceId();
        stableId = `stable-${deviceId}-${Date.now().toString(36)}`;
      }
      
      localStorage.setItem(this.STABLE_USER_ID_KEY, stableId);
      console.log('🔒 새로운 안정적 사용자 ID 생성:', stableId);
    }
    
    return stableId;
  }

  /**
   * 현재 활성 사용자 ID 반환 (세션 기반 또는 안정적 ID)
   */
  getCurrentUserId(): string {
    // 1순위: 세션 기반 사용자 ID (로그인된 경우)
    const sessionUserId = localStorage.getItem(this.USER_ID_KEY);
    if (sessionUserId) {
      return sessionUserId;
    }
    
    // 2순위: 안정적 사용자 ID (비로그인 상태)
    return this.getStableUserId();
  }

  /**
   * 사용자 ID 설정
   */
  setUserId(userId: string): void {
    const oldUserId = this.getCurrentUserId();
    localStorage.setItem(this.USER_ID_KEY, userId);
    
    // 사용자 ID가 변경된 경우 데이터 마이그레이션
    if (oldUserId !== userId) {
      console.log('🔄 사용자 ID 변경 감지:', oldUserId, '→', userId);
      this.migrateUserData(oldUserId, userId);
    }
  }

  /**
   * 모든 사용자 데이터 키 찾기
   */
  findAllUserData(): string[] {
    const userDataKeys: string[] = [];
    const prefixes = ['mock-strategies-', 'mock-positions-', 'mock-trades-', 'mock-balance-', 'kimchi-chart-data-'];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && prefixes.some(prefix => key.startsWith(prefix))) {
        userDataKeys.push(key);
      }
    }
    
    return userDataKeys;
  }

  /**
   * 사용자 데이터 마이그레이션
   */
  migrateUserData(oldUserId: string, newUserId: string): void {
    console.log('🔄 사용자 데이터 마이그레이션 시작:', oldUserId, '→', newUserId);
    
    const prefixes = ['mock-strategies-', 'mock-positions-', 'mock-trades-', 'mock-balance-', 'kimchi-chart-data-'];
    let migratedCount = 0;
    
    for (const prefix of prefixes) {
      const oldKey = `${prefix}${oldUserId}`;
      const newKey = `${prefix}${newUserId}`;
      const oldData = localStorage.getItem(oldKey);
      
      if (oldData && oldData !== '[]' && oldData !== '{}') {
        // 새 키에 기존 데이터가 있는지 확인
        const existingNewData = localStorage.getItem(newKey);
        
        if (!existingNewData || existingNewData === '[]' || existingNewData === '{}') {
          // 새 키에 데이터가 없으면 마이그레이션
          localStorage.setItem(newKey, oldData);
          console.log(`✅ ${oldKey} → ${newKey} 마이그레이션 완료`);
          migratedCount++;
        } else {
          // 새 키에 데이터가 있으면 병합 시도
          try {
            const oldDataParsed = JSON.parse(oldData);
            const newDataParsed = JSON.parse(existingNewData);
            
            if (Array.isArray(oldDataParsed) && Array.isArray(newDataParsed)) {
              // 배열인 경우 중복 제거 후 병합
              const merged = [...newDataParsed];
              for (const item of oldDataParsed) {
                if (!merged.some(existing => existing.id === item.id)) {
                  merged.push(item);
                }
              }
              localStorage.setItem(newKey, JSON.stringify(merged));
              console.log(`🔀 ${oldKey} → ${newKey} 병합 완료 (${merged.length}개 항목)`);
              migratedCount++;
            }
          } catch (error) {
            console.warn(`⚠️ ${oldKey} 병합 실패, 기존 데이터 유지:`, error);
          }
        }
      }
    }
    
    console.log(`🎉 사용자 데이터 마이그레이션 완료: ${migratedCount}개 항목`);
    
    // 마이그레이션 후 이벤트 발생 (UI 새로고침용)
    window.dispatchEvent(new CustomEvent('userDataMigrated', { 
      detail: { oldUserId, newUserId, migratedCount } 
    }));
  }

  /**
   * 사라진 전략 데이터 복구
   */
  recoverLostStrategies(): { recovered: any[], allFound: string[] } {
    console.log('🔍 사라진 전략 데이터 복구 시작...');
    
    const allStrategyKeys: string[] = [];
    const recoveredStrategies: any[] = [];
    
    // 모든 mock-strategies 키 찾기
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mock-strategies-')) {
        allStrategyKeys.push(key);
      }
    }
    
    console.log('발견된 전략 키들:', allStrategyKeys);
    
    // 각 키에서 전략 데이터 수집
    for (const key of allStrategyKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data && data !== '[]') {
          const strategies = JSON.parse(data);
          if (Array.isArray(strategies) && strategies.length > 0) {
            console.log(`📋 ${key}에서 ${strategies.length}개 전략 발견`);
            recoveredStrategies.push(...strategies);
          }
        }
      } catch (error) {
        console.warn(`⚠️ ${key} 파싱 실패:`, error);
      }
    }
    
    // 중복 제거 (ID 기준)
    const uniqueStrategies = recoveredStrategies.filter((strategy, index, self) => 
      index === self.findIndex(s => s.id === strategy.id)
    );
    
    console.log(`🎯 전체 ${recoveredStrategies.length}개 중 고유 전략 ${uniqueStrategies.length}개 발견`);
    
    return {
      recovered: uniqueStrategies,
      allFound: allStrategyKeys
    };
  }
}

// 싱글톤 인스턴스
export const userIdManager = new UserIdManagerImpl();

/**
 * React Hook: 안정적인 사용자 ID 사용
 */
export function useStableUserId() {
  const [userId, setUserId] = React.useState<string>(() => userIdManager.getCurrentUserId());
  
  React.useEffect(() => {
    const handleUserDataMigrated = (event: CustomEvent) => {
      console.log('🔄 사용자 데이터 마이그레이션 완료, UI 업데이트:', event.detail);
      setUserId(userIdManager.getCurrentUserId());
    };
    
    window.addEventListener('userDataMigrated', handleUserDataMigrated as EventListener);
    
    return () => {
      window.removeEventListener('userDataMigrated', handleUserDataMigrated as EventListener);
    };
  }, []);
  
  const updateUserId = React.useCallback((newUserId: string) => {
    userIdManager.setUserId(newUserId);
    setUserId(newUserId);
  }, []);
  
  return {
    userId,
    setUserId: updateUserId,
    stableUserId: userIdManager.getStableUserId(),
    recoverLostData: userIdManager.recoverLostStrategies
  };
}

// React import 추가
import React from 'react';
