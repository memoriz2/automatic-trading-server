// Mock Trading 실행 로직
// Mock Trading 실행 로직 (타입은 컴포넌트에서 전달받음)

// 김치프리미엄 기반 모의 거래 실행
export const executeMockTrade = async (
  strategy: any,
  currentKimchiData: any,
  mockPositions: any[],
  mockEntry: (strategy: any, premiumRate: number) => void,
  mockExit: (position: any, premiumRate: number, ratio?: number) => void,
  processingEntryRef: React.MutableRefObject<Set<string>>,
  lastActionAtRef: React.MutableRefObject<Record<string, number>>,
  prevPremiumRef: React.MutableRefObject<number | null>,
  forceEntry = false
) => {
  if (!currentKimchiData) return;

  const strategyId = String(strategy.id);
  if (processingEntryRef.current.has(strategyId)) {
    console.warn(`⏯️ ${strategy.name} 전략은 이미 진입 처리 중입니다. 중복 호출을 건너뜁니다.`);
    return;
  }

  const MIN_HOLD_MS = 30_000;
  const EXIT_EXTRA = 0.2;
  const COOLDOWN_MS = 800;

  if (!strategy.isActive && !forceEntry) return;

  const premiumRate = currentKimchiData.kimp;
  const entryThreshold = parseFloat(strategy.entryCondition);
  const exitThreshold = parseFloat(strategy.takeProfitCondition);
  const tolerance = parseFloat(strategy.tolerance || "0.01");

  // 진입 조건 확인
  const shouldEnter = premiumRate >= entryThreshold + tolerance;
  const hasOpenPosition = mockPositions.some(p => p.strategyId === strategy.id && p.status === 'open');

  // 쿨다운 확인
  const lastAction = lastActionAtRef.current[strategyId] || 0;
  const timeSinceLastAction = Date.now() - lastAction;
  if (timeSinceLastAction < COOLDOWN_MS) return;

  // 임계값 교차 감지
  const prevPremium = prevPremiumRef.current;
  const crossedThreshold = prevPremium !== null && 
    ((prevPremium < entryThreshold + tolerance && premiumRate >= entryThreshold + tolerance) ||
     (prevPremium > exitThreshold - EXIT_EXTRA && premiumRate <= exitThreshold - EXIT_EXTRA));

  if (shouldEnter && !hasOpenPosition && (forceEntry || crossedThreshold)) {
    mockEntry(strategy, premiumRate);
    lastActionAtRef.current[strategyId] = Date.now();
  }

  // 청산 조건 확인
  if (hasOpenPosition) {
    const position = mockPositions.find(p => p.strategyId === strategy.id && p.status === 'open');
    if (position) {
      const holdTime = Date.now() - new Date(position.entryTime).getTime();
      const shouldExit = premiumRate <= exitThreshold - EXIT_EXTRA && holdTime >= MIN_HOLD_MS;

      if (shouldExit && (forceEntry || crossedThreshold)) {
        mockExit(position, premiumRate);
        lastActionAtRef.current[strategyId] = Date.now();
      }
    }
  }

  prevPremiumRef.current = premiumRate;
};
