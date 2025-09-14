// 완전한 전략 복원 - 백업 + 포지션에서 모든 전략 복원
function completeStrategyRestore() {
  const userId = "17";
  
  console.log("🔧 완전한 전략 복원 시작...");
  
  // 1. 현재 전략들 가져오기
  const currentStrategies = JSON.parse(localStorage.getItem(`mock-strategies-${userId}`) || '[]');
  console.log("현재 전략:", currentStrategies);
  
  // 2. 포지션에서 누락된 전략 찾기
  const positions = JSON.parse(localStorage.getItem(`mock-positions-${userId}`) || '[]');
  console.log("포지션:", positions);
  
  const missingStrategies = [];
  
  positions.forEach(pos => {
    const strategyId = pos.strategyId;
    const strategyName = pos.strategyName;
    
    // 현재 전략 목록에 없는 전략 찾기
    const exists = currentStrategies.find(s => s.id === strategyId);
    
    if (!exists && !missingStrategies.find(s => s.id === strategyId)) {
      const restoredStrategy = {
        id: strategyId,
        name: strategyName || `복원된 전략 ${strategyId.slice(-4)}`,
        crypto: 'BTC',
        entryCondition: '0',
        takeProfitCondition: '0.2',
        investmentAmount: pos.upbitQuantity?.toString() || '0.003',
        leverage: pos.leverage?.toString() || '5',
        tolerance: '0.6',
        riskLevel: 'moderate',
        isActive: true,
        profitRate: 0,
        executionCount: 1,
        created_at: pos.entryTime || new Date().toISOString()
      };
      
      missingStrategies.push(restoredStrategy);
      console.log(`📋 누락된 전략 발견: ${strategyName} (${strategyId})`);
    }
  });
  
  // 3. 거래 기록에서도 누락된 전략 찾기
  const trades = JSON.parse(localStorage.getItem(`mock-trades-${userId}`) || '[]');
  
  trades.forEach(trade => {
    const strategyId = trade.strategyId;
    const strategyName = trade.strategyName;
    
    // 현재 전략 목록과 이미 찾은 누락 전략에 없는 경우
    const existsInCurrent = currentStrategies.find(s => s.id === strategyId);
    const existsInMissing = missingStrategies.find(s => s.id === strategyId);
    
    if (!existsInCurrent && !existsInMissing) {
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
    }
  });
  
  // 4. 모든 전략 합치기
  const allStrategies = [...currentStrategies, ...missingStrategies];
  
  console.log(`🔄 전략 복원 결과:`);
  console.log(`  - 기존 전략: ${currentStrategies.length}개`);
  console.log(`  - 복원된 전략: ${missingStrategies.length}개`);
  console.log(`  - 총 전략: ${allStrategies.length}개`);
  
  // 5. 저장
  localStorage.setItem(`mock-strategies-${userId}`, JSON.stringify(allStrategies));
  
  console.log("✅ 완전한 전략 복원 완료!");
  console.log("복원된 모든 전략:", allStrategies);
  
  return allStrategies;
}

// 실행
completeStrategyRestore();

