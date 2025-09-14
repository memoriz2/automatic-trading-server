/**
 * 전략 데이터 백업 및 복원 시스템
 * 전략 데이터 손실을 방지하기 위한 자동 백업 기능
 */

import { userIdManager } from './user-id-manager';

interface BackupMetadata {
  timestamp: number;
  userId: string;
  version: string;
  strategiesCount: number;
  checksum: string;
}

interface StrategyBackup {
  metadata: BackupMetadata;
  strategies: any[];
  positions: any[];
  trades: any[];
  balances: any;
}

class StrategyBackupManager {
  private readonly BACKUP_KEY_PREFIX = 'strategy-backup-';
  private readonly MAX_BACKUPS = 10; // 최대 10개 백업 유지
  private readonly BACKUP_INTERVAL = 5 * 60 * 1000; // 5분마다 자동 백업
  private readonly VERSION = '1.0.0';
  
  private backupTimer: NodeJS.Timeout | null = null;

  /**
   * 체크섬 계산 (간단한 해시)
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 현재 전략 데이터 수집 (삭제된 전략 제외)
   */
  private collectCurrentData(userId: string): Omit<StrategyBackup, 'metadata'> {
    const strategies = this.getLocalStorageData(`mock-strategies-${userId}`);
    const positions = this.getLocalStorageData(`mock-positions-${userId}`);
    const trades = this.getLocalStorageData(`mock-trades-${userId}`);
    const balances = this.getLocalStorageData(`mock-balance-${userId}`);
    
    // 삭제된 전략 목록 가져오기
    const deletedStrategies = this.getLocalStorageData(`deleted-strategies-${userId}`) || [];
    
    // 삭제된 전략 제외
    const filteredStrategies = (strategies || []).filter((strategy: any) => 
      !deletedStrategies.includes(strategy.id)
    );
    
    console.log('📝 백업 데이터 수집:', {
      전체전략: (strategies || []).length,
      삭제된전략: deletedStrategies.length,
      필터된전략: filteredStrategies.length,
      삭제목록: deletedStrategies
    });
    
    return {
      strategies: filteredStrategies,
      positions: positions || [],
      trades: trades || [],
      balances: balances || {}
    };
  }

  /**
   * 로컬스토리지에서 데이터 안전하게 가져오기
   */
  private getLocalStorageData(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`⚠️ ${key} 데이터 파싱 실패:`, error);
      return null;
    }
  }

  /**
   * 백업 생성
   */
  createBackup(userId?: string): string | null {
    try {
      const currentUserId = userId || userIdManager.getCurrentUserId();
      const data = this.collectCurrentData(currentUserId);
      
      // 빈 데이터는 백업하지 않음
      if (!data.strategies.length && !data.positions.length && !data.trades.length) {
        console.log('📝 백업할 데이터가 없음, 백업 건너뛰기');
        return null;
      }

      const metadata: BackupMetadata = {
        timestamp: Date.now(),
        userId: currentUserId,
        version: this.VERSION,
        strategiesCount: data.strategies.length,
        checksum: this.calculateChecksum(data)
      };

      const backup: StrategyBackup = {
        metadata,
        ...data
      };

      const backupKey = `${this.BACKUP_KEY_PREFIX}${Date.now()}-${currentUserId}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));
      
      console.log('💾 전략 데이터 백업 생성:', {
        key: backupKey,
        strategiesCount: data.strategies.length,
        positionsCount: data.positions.length,
        tradesCount: data.trades.length
      });

      // 오래된 백업 정리
      this.cleanupOldBackups();
      
      return backupKey;
    } catch (error) {
      console.error('❌ 백업 생성 실패:', error);
      return null;
    }
  }

  /**
   * 모든 백업 목록 조회
   */
  getAllBackups(): { key: string; metadata: BackupMetadata }[] {
    const backups: { key: string; metadata: BackupMetadata }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.BACKUP_KEY_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const backup: StrategyBackup = JSON.parse(data);
            backups.push({ key, metadata: backup.metadata });
          }
        } catch (error) {
          console.warn(`⚠️ 백업 메타데이터 파싱 실패: ${key}`, error);
        }
      }
    }
    
    // 최신 순으로 정렬
    return backups.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
  }

  /**
   * 백업에서 데이터 복원
   */
  restoreFromBackup(backupKey: string): boolean {
    try {
      const data = localStorage.getItem(backupKey);
      if (!data) {
        console.error('❌ 백업 데이터를 찾을 수 없음:', backupKey);
        return false;
      }

      const backup: StrategyBackup = JSON.parse(data);
      const { metadata, strategies, positions, trades, balances } = backup;
      
      console.log('🔄 백업에서 데이터 복원 시작:', {
        backupKey,
        timestamp: new Date(metadata.timestamp).toLocaleString(),
        strategiesCount: metadata.strategiesCount
      });

      // 체크섬 검증
      const expectedChecksum = this.calculateChecksum({ strategies, positions, trades, balances });
      if (expectedChecksum !== metadata.checksum) {
        console.warn('⚠️ 백업 데이터 무결성 검증 실패, 복원 계속 진행');
      }

      const currentUserId = userIdManager.getCurrentUserId();
      
      // 데이터 복원
      if (strategies.length > 0) {
        localStorage.setItem(`mock-strategies-${currentUserId}`, JSON.stringify(strategies));
      }
      if (positions.length > 0) {
        localStorage.setItem(`mock-positions-${currentUserId}`, JSON.stringify(positions));
      }
      if (trades.length > 0) {
        localStorage.setItem(`mock-trades-${currentUserId}`, JSON.stringify(trades));
      }
      if (balances && Object.keys(balances).length > 0) {
        localStorage.setItem(`mock-balance-${currentUserId}`, JSON.stringify(balances));
      }

      console.log('✅ 백업 복원 완료:', {
        strategies: strategies.length,
        positions: positions.length,
        trades: trades.length
      });

      // 복원 완료 이벤트 발생
      window.dispatchEvent(new CustomEvent('strategyDataRestored', {
        detail: { backupKey, metadata, restoredData: { strategies, positions, trades, balances } }
      }));

      return true;
    } catch (error) {
      console.error('❌ 백업 복원 실패:', error);
      return false;
    }
  }

  /**
   * 오래된 백업 정리 (최대 개수 초과 시)
   */
  private cleanupOldBackups(): void {
    const backups = this.getAllBackups();
    
    if (backups.length > this.MAX_BACKUPS) {
      const toDelete = backups.slice(this.MAX_BACKUPS);
      
      for (const backup of toDelete) {
        localStorage.removeItem(backup.key);
        console.log('🗑️ 오래된 백업 삭제:', backup.key);
      }
      
      console.log(`🧹 백업 정리 완료: ${toDelete.length}개 삭제`);
    }
  }

  /**
   * 자동 백업 시작
   */
  startAutoBackup(): void {
    if (this.backupTimer) {
      return; // 이미 실행 중
    }

    console.log('🕐 자동 백업 시작 (5분 간격)');
    
    this.backupTimer = setInterval(() => {
      const backupKey = this.createBackup();
      if (backupKey) {
        console.log('⏰ 자동 백업 완료:', backupKey);
      }
    }, this.BACKUP_INTERVAL);

    // 즉시 첫 백업 생성
    setTimeout(() => {
      this.createBackup();
    }, 1000);
  }

  /**
   * 자동 백업 중지
   */
  stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      console.log('⏹️ 자동 백업 중지');
    }
  }

  /**
   * 긴급 복구: 가장 최근 백업에서 자동 복원
   */
  emergencyRestore(): boolean {
    console.log('🚨 긴급 복구 시작...');
    
    const backups = this.getAllBackups();
    if (backups.length === 0) {
      console.error('❌ 복구할 백업이 없음');
      return false;
    }

    const latestBackup = backups[0];
    console.log('🔄 최신 백업에서 복구:', {
      key: latestBackup.key,
      timestamp: new Date(latestBackup.metadata.timestamp).toLocaleString(),
      strategiesCount: latestBackup.metadata.strategiesCount
    });

    return this.restoreFromBackup(latestBackup.key);
  }

  /**
   * 백업 데이터 내보내기 (JSON 파일)
   */
  exportBackup(backupKey: string): void {
    try {
      const data = localStorage.getItem(backupKey);
      if (!data) {
        console.error('❌ 백업 데이터를 찾을 수 없음');
        return;
      }

      const backup: StrategyBackup = JSON.parse(data);
      const filename = `strategy-backup-${new Date(backup.metadata.timestamp).toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('💾 백업 파일 내보내기 완료:', filename);
    } catch (error) {
      console.error('❌ 백업 내보내기 실패:', error);
    }
  }

  /**
   * 백업 파일 가져오기
   */
  importBackup(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          const backup: StrategyBackup = JSON.parse(data);
          
          // 백업 데이터 검증
          if (!backup.metadata || !backup.strategies) {
            throw new Error('유효하지 않은 백업 파일 형식');
          }
          
          // 임시 키로 저장 후 복원
          const tempKey = `${this.BACKUP_KEY_PREFIX}imported-${Date.now()}`;
          localStorage.setItem(tempKey, data);
          
          const success = this.restoreFromBackup(tempKey);
          resolve(success);
        } catch (error) {
          console.error('❌ 백업 파일 가져오기 실패:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };
      
      reader.readAsText(file);
    });
  }
}

// 싱글톤 인스턴스
export const strategyBackupManager = new StrategyBackupManager();

/**
 * React Hook: 전략 백업 관리
 */
export function useStrategyBackup() {
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = React.useState<boolean>(false);
  
  React.useEffect(() => {
    // 컴포넌트 마운트 시 자동 백업 시작
    strategyBackupManager.startAutoBackup();
    setIsAutoBackupEnabled(true);
    
    return () => {
      // 컴포넌트 언마운트 시 자동 백업 중지
      strategyBackupManager.stopAutoBackup();
    };
  }, []);
  
  const createBackup = React.useCallback(() => {
    return strategyBackupManager.createBackup();
  }, []);
  
  const getAllBackups = React.useCallback(() => {
    return strategyBackupManager.getAllBackups();
  }, []);
  
  const restoreFromBackup = React.useCallback((backupKey: string) => {
    return strategyBackupManager.restoreFromBackup(backupKey);
  }, []);
  
  const emergencyRestore = React.useCallback(() => {
    return strategyBackupManager.emergencyRestore();
  }, []);
  
  const exportBackup = React.useCallback((backupKey: string) => {
    strategyBackupManager.exportBackup(backupKey);
  }, []);
  
  const importBackup = React.useCallback((file: File) => {
    return strategyBackupManager.importBackup(file);
  }, []);
  
  return {
    isAutoBackupEnabled,
    createBackup,
    getAllBackups,
    restoreFromBackup,
    emergencyRestore,
    exportBackup,
    importBackup
  };
}

// React import 추가
import React from 'react';
