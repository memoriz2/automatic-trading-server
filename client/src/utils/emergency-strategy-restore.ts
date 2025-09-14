/**
 * 긴급 전략 복원 유틸리티
 * 전략이 사라졌을 때 백업에서 자동으로 복원하는 기능
 * 정상 삭제된 전략은 복원하지 않음
 */

/**
 * 삭제된 전략 추적 시스템
 */
const getDeletedStrategies = (userId: string): string[] => {
  try {
    const deleted = localStorage.getItem(`deleted-strategies-${userId}`);
    return deleted ? JSON.parse(deleted) : [];
  } catch {
    return [];
  }
};

const addDeletedStrategy = (userId: string, strategyId: string) => {
  try {
    const deleted = getDeletedStrategies(userId);
    if (!deleted.includes(strategyId)) {
      deleted.push(strategyId);
      localStorage.setItem(`deleted-strategies-${userId}`, JSON.stringify(deleted));
      console.log(`🗑️ 전략 삭제 기록: ${strategyId}`);
    }
  } catch (error) {
    console.error('❌ 삭제된 전략 기록 실패:', error);
  }
};

const isStrategyDeleted = (userId: string, strategyId: string): boolean => {
  const deleted = getDeletedStrategies(userId);
  return deleted.includes(strategyId);
};

/**
 * 전략 삭제 시 호출할 함수 (컴포넌트에서 사용)
 */
export const markStrategyAsDeleted = (userId: string, strategyId: string) => {
  addDeletedStrategy(userId, strategyId);
  
  // 백업에서도 해당 전략 제거
  try {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(`strategy-backup-`) && key.endsWith(`-${userId}`));
    
    backupKeys.forEach(backupKey => {
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        const backup = JSON.parse(backupData);
        if (backup.strategies) {
          backup.strategies = backup.strategies.filter((s: any) => s.id !== strategyId);
          localStorage.setItem(backupKey, JSON.stringify(backup));
        }
      }
    });
    
    console.log(`🗑️ 백업에서도 전략 제거 완료: ${strategyId}`);
  } catch (error) {
    console.error('❌ 백업에서 전략 제거 실패:', error);
  }
};

export const emergencyRestoreStrategies = (userId: string): any[] => {
  try {
    console.log('🔍 긴급 복원 시작 - 사용자 ID:', userId);
    
    // 1. 현재 전략 상태 확인
    const currentStrategies = localStorage.getItem(`mock-strategies-${userId}`);
    const strategies = currentStrategies ? JSON.parse(currentStrategies) : [];
    
    console.log('현재 전략 상태:', {
      raw: currentStrategies,
      parsed: strategies,
      length: strategies.length
    });
    
    if (strategies.length > 0) {
      console.log('✅ 전략이 이미 존재함, 복원 불필요:', strategies.length);
      return strategies;
    }

    console.log('🔍 전략이 비어있음, 백업에서 복원 시도...');

    // 2. 백업에서 전략 찾기
    const allKeys = Object.keys(localStorage);
    console.log('로컬스토리지 모든 키:', allKeys.filter(k => k.includes('strategy')));
    
    const backupKeys = allKeys
      .filter(key => key.startsWith(`strategy-backup-`) && key.endsWith(`-${userId}`))
      .sort((a, b) => {
        const timestampA = parseInt(a.split('-')[2]);
        const timestampB = parseInt(b.split('-')[2]);
        return timestampB - timestampA; // 최신순 정렬
      });

    console.log('찾은 백업 키들:', backupKeys);

    if (backupKeys.length === 0) {
      console.warn('⚠️ 백업 데이터를 찾을 수 없음');
      console.log('사용자 ID 확인:', userId, '타입:', typeof userId);
      return [];
    }

    // 3. 모든 백업에서 전략이 있는 것 찾기
    let restoredStrategies: any[] = [];
    let usedBackupKey = '';
    
    for (const backupKey of backupKeys) {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) continue;
      
      try {
        const backup = JSON.parse(backupData);
        const strategies = backup.strategies || [];
        
        // 삭제된 전략 제외
        const validStrategies = strategies.filter((strategy: any) => 
          !isStrategyDeleted(userId, strategy.id)
        );
        
        if (validStrategies.length > 0) {
          restoredStrategies = validStrategies;
          usedBackupKey = backupKey;
          console.log(`✅ 백업 ${backupKey}에서 ${validStrategies.length}개 전략 발견 (삭제된 전략 제외)`);
          break;
        }
      } catch (error) {
        console.warn(`⚠️ 백업 ${backupKey} 파싱 실패:`, error);
      }
    }

    if (restoredStrategies.length === 0) {
      console.warn('⚠️ 모든 백업에 전략이 없음');
      return [];
    }

    // 4. 전략을 로컬스토리지에 복원
    localStorage.setItem(`mock-strategies-${userId}`, JSON.stringify(restoredStrategies));
    
    console.log('🔄 전략 복원 완료:', {
      backupKey: usedBackupKey,
      strategiesCount: restoredStrategies.length,
      strategies: restoredStrategies.map((s: any) => ({ id: s.id, name: s.name }))
    });

    return restoredStrategies;

  } catch (error) {
    console.error('❌ 긴급 전략 복원 실패:', error);
    return [];
  }
};

/**
 * 전략 상태 모니터링 및 자동 복원
 */
/**
 * 포지션과 거래 기록에서 누락된 전략 복원
 */
export const restoreStrategiesFromPositionsAndTrades = (userId: string, currentStrategies: any[]): any[] => {
  try {
    console.log('🔍 포지션과 거래 기록에서 누락된 전략 복원 시도...');
    
    const missingStrategies: any[] = [];
    
    // 1. 포지션에서 누락된 전략 찾기
    const positionsData = localStorage.getItem(`mock-positions-${userId}`);
    if (positionsData) {
      const positions = JSON.parse(positionsData);
      
      positions.forEach((pos: any) => {
        const strategyId = pos.strategyId;
        const strategyName = pos.strategyName;
        
        // 현재 전략 목록에 없고, 이미 찾은 누락 전략에도 없는 경우
        const existsInCurrent = currentStrategies.find(s => s.id === strategyId);
        const existsInMissing = missingStrategies.find(s => s.id === strategyId);
        
        if (!existsInCurrent && !existsInMissing && strategyId && !isStrategyDeleted(userId, strategyId)) {
          const restoredStrategy = {
            id: strategyId,
            name: strategyName || `복원된 전략 ${strategyId.slice(-4)}`,
            crypto: 'BTC',
            // 실제 진입 조건 (진입 시 프리미엄율)
            entryCondition: (pos.entryPremiumRate * 100).toFixed(1),
            // 수익 목표 (진입 조건 + 0.2%)
            takeProfitCondition: ((pos.entryPremiumRate * 100) + 0.2).toFixed(1),
            // 실제 투자 금액
            investmentAmount: pos.upbitQuantity?.toString() || '0.003',
            // 실제 레버리지
            leverage: pos.leverage?.toString() || '5',
            // 허용 오차
            tolerance: '0.1',
            riskLevel: 'moderate',
            isActive: true,
            profitRate: 0,
            executionCount: 1,
            created_at: pos.entryTime || new Date().toISOString()
          };
          
          missingStrategies.push(restoredStrategy);
          console.log(`📋 포지션에서 누락된 전략 발견: ${strategyName} (${strategyId})`);
        } else if (isStrategyDeleted(userId, strategyId)) {
          console.log(`🗑️ 삭제된 전략 복원 건너뛰기: ${strategyName} (${strategyId})`);
        }
      });
    }
    
    // 2. 거래 기록에서 누락된 전략 찾기
    const tradesData = localStorage.getItem(`mock-trades-${userId}`);
    if (tradesData) {
      const trades = JSON.parse(tradesData);
      
      trades.forEach((trade: any) => {
        const strategyId = trade.strategyId;
        const strategyName = trade.strategyName;
        
        // 현재 전략 목록과 이미 찾은 누락 전략에 없는 경우
        const existsInCurrent = currentStrategies.find(s => s.id === strategyId);
        const existsInMissing = missingStrategies.find(s => s.id === strategyId);
        
        if (!existsInCurrent && !existsInMissing && strategyId && !isStrategyDeleted(userId, strategyId)) {
          const restoredStrategy = {
            id: strategyId,
            name: strategyName || `복원된 전략 ${strategyId.slice(-4)}`,
            crypto: 'BTC',
            entryCondition: '0',
            takeProfitCondition: '0.2',
            investmentAmount: trade.quantity?.toString() || '0.003',
            leverage: '5',
            tolerance: '0.6',
            riskLevel: 'moderate',
            isActive: true,
            profitRate: 0,
            executionCount: 1,
            created_at: trade.timestamp || new Date().toISOString()
          };
          
          missingStrategies.push(restoredStrategy);
          console.log(`💼 거래에서 누락된 전략 발견: ${strategyName} (${strategyId})`);
        } else if (isStrategyDeleted(userId, strategyId)) {
          console.log(`🗑️ 삭제된 전략 복원 건너뛰기: ${strategyName} (${strategyId})`);
        }
      });
    }
    
    console.log(`🔄 누락된 전략 복원 결과: ${missingStrategies.length}개 발견`);
    return missingStrategies;
    
  } catch (error) {
    console.error('❌ 포지션/거래 기록에서 전략 복원 실패:', error);
    return [];
  }
};

export const monitorAndRestoreStrategies = (
  userId: string, 
  strategies: any[], 
  setStrategies: (strategies: any[]) => void
) => {
  // 전략이 비어있으면 자동 복원 시도
  if (strategies.length === 0) {
    console.log('🚨 전략 손실 감지, 자동 복원 시도...');
    
    // 1. 백업에서 복원 시도
    let restoredStrategies = emergencyRestoreStrategies(userId);
    
    // 2. 포지션과 거래 기록에서 누락된 전략 추가 복원
    const missingStrategies = restoreStrategiesFromPositionsAndTrades(userId, restoredStrategies);
    
    if (missingStrategies.length > 0) {
      restoredStrategies = [...restoredStrategies, ...missingStrategies];
      // 중복 제거
      restoredStrategies = restoredStrategies.filter((strategy, index, self) => 
        index === self.findIndex(s => s.id === strategy.id)
      );
      
      // 업데이트된 전략 목록 저장
      localStorage.setItem(`mock-strategies-${userId}`, JSON.stringify(restoredStrategies));
      console.log(`🔄 포지션/거래에서 추가 복원: ${missingStrategies.length}개`);
    }
    
    if (restoredStrategies.length > 0) {
      setStrategies(restoredStrategies);
      console.log('✅ 전략 자동 복원 성공:', restoredStrategies.length);
      
      // 성공 알림 (토스트는 컴포넌트에서 처리)
      return {
        success: true,
        count: restoredStrategies.length,
        strategies: restoredStrategies
      };
    }
  }

  return { success: false, count: 0, strategies: [] };
};
