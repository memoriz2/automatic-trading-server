// 브라우저 콘솔에서 수동 실행할 수 있는 전략 복원 스크립트
// 개발자 도구 콘솔에서 이 함수를 복사해서 실행하세요

function manualRestoreStrategies() {
  const userId = "17"; // 현재 사용자 ID
  
  console.log("🔍 수동 전략 복원 시작...");
  
  // 1. 현재 전략 상태 확인
  const currentStrategies = localStorage.getItem(`mock-strategies-${userId}`);
  console.log("현재 전략 상태:", currentStrategies);
  
  // 2. 백업 키 찾기
  const backupKeys = Object.keys(localStorage)
    .filter(key => key.startsWith(`strategy-backup-`) && key.endsWith(`-${userId}`))
    .sort((a, b) => {
      const timestampA = parseInt(a.split('-')[2]);
      const timestampB = parseInt(b.split('-')[2]);
      return timestampB - timestampA;
    });
  
  console.log("찾은 백업 키들:", backupKeys);
  
  if (backupKeys.length === 0) {
    console.error("❌ 백업을 찾을 수 없습니다");
    return;
  }
  
  // 3. 최신 백업 데이터 확인
  const latestBackupKey = backupKeys[0];
  const backupData = localStorage.getItem(latestBackupKey);
  
  console.log("최신 백업 키:", latestBackupKey);
  console.log("백업 데이터:", JSON.parse(backupData));
  
  const backup = JSON.parse(backupData);
  const strategies = backup.strategies || [];
  
  console.log("백업에서 찾은 전략들:", strategies);
  
  if (strategies.length === 0) {
    console.error("❌ 백업에 전략이 없습니다");
    return;
  }
  
  // 4. 전략 복원
  localStorage.setItem(`mock-strategies-${userId}`, JSON.stringify(strategies));
  
  console.log("✅ 전략 복원 완료!");
  console.log("복원된 전략 수:", strategies.length);
  
  // 5. 복원 결과 확인
  const restoredStrategies = localStorage.getItem(`mock-strategies-${userId}`);
  console.log("복원 후 전략 상태:", restoredStrategies);
  
  return strategies;
}

// 실행
manualRestoreStrategies();
