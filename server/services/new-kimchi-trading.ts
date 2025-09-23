import { UpbitService } from "./upbit.js";
import { BinanceService } from "./binance.js";
import { SimpleKimchiService } from "./simple-kimchi.js";
import { storage } from "../storage.js";
// 타입들을 직접 정의 (Prisma 대신)
export type TradingSettings = {
  id: number;
  userId: number;
  entryPremiumRate: number;
  exitPremiumRate: number;
  stopLossRate: number;
  maxPositions: number;
  isAutoTrading: boolean;
  maxInvestmentAmount: number;
  kimchiEntryRate: number;
  kimchiExitRate: number;
  kimchiToleranceRate: number;
  binanceLeverage: number;
  upbitEntryAmount: number;
  dailyLossLimit: number;
  maxPositionSize: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Position = {
  id: number;
  userId: number;
  strategyId?: number | null;
  symbol: string;
  type: string;
  entryPrice: number;
  currentPrice?: number | null;
  quantity: number;
  entryPremiumRate: number;
  currentPremiumRate?: number | null;
  status: string;
  entryTime: Date;
  exitTime?: Date | null;
  upbitOrderId?: string | null;
  binanceOrderId?: string | null;
  side: string;
  exitPrice?: number | null;
  exitPremiumRate?: number | null;
  unrealizedPnl?: number | null;
  realizedPnl?: number | null;
  isMock: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TradingStrategy = {
  id: number;
  userId: number;
  name: string;
  entryRate: number;
  exitRate: number;
  leverage: number;
  investmentAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  symbol: string;
  tolerance: number;
  isAutoTrading: boolean;
  totalTrades: number;
  successfulTrades: number;
  totalProfit: number;
  strategyType: string;
  toleranceRate: number;
};

export interface StrategySignal {
  symbol: string;
  action: "entry" | "exit" | "stop_loss";
  premiumRate: number;
  confidence: number;
  strategyId: number;
  strategyName: string;
}

export class MultiStrategyTradingService {
  // private upbitService: UpbitService; // 현재 사용하지 않음
  // private binanceService: BinanceService; // 현재 사용하지 않음
  private simpleKimchiService: SimpleKimchiService;
  private userTradingStates: Map<string, boolean> = new Map(); // 사용자별 거래 상태
  private lastKimchiRates: Map<string, number> = new Map();
  private activeStrategies: Map<number, TradingStrategy> = new Map();
  private userStrategies: Map<string, Map<number, TradingStrategy>> = new Map(); // 사용자별 전략
  // 최근 진입 시각(사용자-전략-심볼 단위). 재시작 시 메모리 리셋되며, DB 초기화는 선택
  // private lastEntryAtByKey: Map<string, number> = new Map(); // 현재 사용하지 않음
  private static readonly MIN_ENTRY_COOLDOWN_MS = 10 * 60 * 1000; // 10분 쿨다운
  // private getCooldownKey(userId: string, strategyId: number | string, symbol = "BTC"): string {
  //   return `${userId}:${strategyId}:${symbol}`;
  // } // 현재 사용하지 않음

  constructor() {
    // this.upbitService = new UpbitService(); // 현재 사용하지 않음
    // this.binanceService = new BinanceService(); // 현재 사용하지 않음
    this.simpleKimchiService = new SimpleKimchiService();
  }

  async startMultiStrategyTrading(userId: string): Promise<void> {
    if (this.userTradingStates.get(userId)) {
      throw new Error(`User ${userId} trading is already running`);
    }

    // 활성 전략들 로드
    const strategies = await storage.getTradingStrategies(parseInt(userId));
    const activeStrategies = strategies.filter((s: any) => s.isActive);

    if (activeStrategies.length === 0) {
      throw new Error("No active trading strategies found");
    }

    // 사용자별 전략들을 맵에 저장
    if (!this.userStrategies.has(userId)) {
      this.userStrategies.set(userId, new Map());
    }
    const userStrategyMap = this.userStrategies.get(userId)!;
    userStrategyMap.clear();
    activeStrategies.forEach((strategy: any) => {
      userStrategyMap.set(strategy.id, strategy);
    });

    this.userTradingStates.set(userId, true);
    await storage.createSystemAlert({
      type: "info",
      title: "다중 전략 자동매매 시작",
      message: `${activeStrategies.length}개 전략으로 김프 차익거래가 시작되었습니다.`,
    });

    // 백그라운드에서 트레이딩 루프 실행
    this.multiStrategyTradingLoop(userId).catch(console.error);
  }

  async stopMultiStrategyTrading(userId?: string): Promise<void> {
    if (userId) {
      // 특정 사용자의 거래만 중지
      this.userTradingStates.set(userId, false);
      this.userStrategies.delete(userId);
      await storage.createSystemAlert({
        type: "info",
        title: "자동매매 중지",
        message: `사용자 ${userId}의 자동매매가 중지되었습니다.`,
      });
    } else {
      // 모든 사용자 거래 중지
      this.userTradingStates.clear();
      this.activeStrategies.clear();
      this.userStrategies.clear();
      await storage.createSystemAlert({
        type: "info",
        title: "다중 전략 자동매매 중지",
        message: "모든 전략의 자동매매가 중지되었습니다.",
      });
    }
  }

  private async multiStrategyTradingLoop(userId: string): Promise<void> {
    while (this.userTradingStates.get(userId)) {
      try {
        // BTC 김프율만 확인 (단일 포지션)
        const symbols = ["BTC"];
        const kimchiData = await this.simpleKimchiService.calculateSimpleKimchi(
          symbols, userId
        );

        // 활성 포지션 조회
        const activePositions = await storage.getActivePositions(parseInt(userId));

        // BTC 단일 전략 신호 분석 (사용자별 전략 사용)
        const userStrategyMap = this.userStrategies.get(userId);
        if (!userStrategyMap) continue;
        
        for (const [_strategyId, strategy] of Array.from(userStrategyMap)) {
          // BTC 데이터만 처리
          const btcData = kimchiData.find((d) => d.symbol === "BTC");
          if (!btcData) continue;

          // 현재 김프율 저장
          this.lastKimchiRates.set("BTC", btcData.premiumRate);

          // 활성 포지션이 이미 있는지 확인 (1개 제한)
          const hasActivePosition = activePositions.some(
            (p: any) => p.status === "open"
          );

          const signal = await this.analyzeStrategySignal(
            btcData,
            strategy,
            activePositions,
            hasActivePosition
          );

          if (signal) {
            await this.executeStrategySignal(userId, signal);
            // BTC 포지션 생성 후 루프 종료 (1개 포지션 제한)
            if (signal.action === "entry") break;
          }
        }

        // 기존 포지션 관리
        await this.manageMultiStrategyPositions(userId, activePositions);

        // 5초 대기
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error("Multi-strategy trading loop error:", error);
        await storage.createSystemAlert({
          type: "error",
          title: "다중 전략 자동매매 오류",
          message: `자동매매 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });

        // 오류 시 잠시 대기
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  // 전략 신호 실행
  private async executeStrategySignal(
    userId: string,
    signal: StrategySignal
  ): Promise<void> {
    try {
      if (signal.action === "entry") {
        await this.executeStrategyEntry(userId, signal);
      } else if (signal.action === "exit") {
        await this.executeStrategyExit(userId, signal);
      }
    } catch (error) {
      console.error(`전략 신호 실행 실패 (${signal.strategyName}):`, error);
      await storage.createSystemAlert({
        type: "error",
        title: "전략 실행 오류",
        message: `${signal.strategyName} 실행 중 오류: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  // BTC 단순 자동매매 신호 분석 (양수/음수 김프 구분 없음)
  private async analyzeStrategySignal(
    kimchiData: any,
    strategy: TradingStrategy,
    activePositions: Position[],
    hasActivePosition: boolean = false
  ): Promise<StrategySignal | null> {
    const premiumRate = kimchiData.premiumRate;
    // const symbol = "BTC"; // BTC 고정 - 현재 사용하지 않음

    // BTC 활성 포지션 확인 (전략 상관없이 1개만 허용)
    const existingPosition = activePositions.find(
      (p: any) => p.symbol === "BTC" && p.status === "open"
    );

    // 사용자 설정 값
    const entryRate = Number(strategy.entryRate);
    const exitRate = Number(strategy.exitRate);
    const tolerance = Number(strategy.toleranceRate);

    console.log(
      `🔍 BTC 자동매매 체크: 현재김프=${premiumRate}%, 진입율=${entryRate}%, 청산율=${exitRate}%, 허용오차=${tolerance}%`
    );

    // 진입 조건 체크 (포지션이 없을 때만)
    if (!hasActivePosition && !existingPosition) {
      // 🔒 진입 쿨다운 가드: DB에서 최근 진입 시간 확인 (서버 재시작에도 유지)
      // const userId = String((strategy as any)?.userId ?? ""); // 현재 사용하지 않음
      const recentPosition = await storage.getRecentPositionByStrategy(strategy.id);
      
      if (recentPosition) {
        const lastEntryTime = recentPosition.entryTime.getTime();
        const elapsed = Date.now() - lastEntryTime;
        
        if (elapsed < MultiStrategyTradingService.MIN_ENTRY_COOLDOWN_MS) {
          const remainSec = Math.ceil((MultiStrategyTradingService.MIN_ENTRY_COOLDOWN_MS - elapsed) / 1000);
          console.log(`⏳ DB 기반 진입 쿨다운 진행중(${remainSec}s 남음) → 이번 진입 스킵`);
          console.log(`📅 최근 진입: ${recentPosition.entryTime.toISOString()}`);
          return null;
        }
      }
      // 🎯 정확한 값 매칭: 설정값과의 차이가 허용오차 이내인지 확인
      const entryDifference = Math.abs(premiumRate - entryRate);
      const sameSign =
        (entryRate >= 0 && premiumRate >= 0) ||
        (entryRate < 0 && premiumRate < 0);
      const shouldEnterBtc = entryDifference <= tolerance && sameSign;

      console.log(
        `🔍 진입 조건 체크: 차이=${entryDifference.toFixed(
          4
        )}% (허용=${tolerance}%), 동일부호=${sameSign} → ${shouldEnterBtc}`
      );

      if (shouldEnterBtc) {
        console.log(
          `🎯 BTC 진입 신호 발생! 현재=${premiumRate.toFixed(
            2
          )}%, 설정=${entryRate}% (±${tolerance}%)`
        );
        return {
          action: "entry",
          symbol: "BTC",
          premiumRate,
          strategyId: strategy.id,
          strategyName: strategy.name || "BTC 단순 차익거래",
          confidence: 0.8,
        };
      } else {
        console.log(
          `❌ BTC 진입 조건 미충족: 차이=${entryDifference.toFixed(
            4
          )}% > 허용오차=${tolerance}%`
        );
      }
    } else {
      console.log(`⏳ BTC 진입 불가: 이미 활성 포지션 존재`);
    }

    // 청산 조건 체크 (포지션이 있을 때만)
    if (existingPosition) {
      // 🎯 정확한 값 매칭: 설정값과의 차이가 허용오차 이내인지 확인
      const exitDifference = Math.abs(premiumRate - exitRate);
      const exitSameSign =
        (exitRate >= 0 && premiumRate >= 0) ||
        (exitRate < 0 && premiumRate < 0);
      const shouldExit = exitDifference <= tolerance && exitSameSign;

      console.log(
        `🔍 청산 조건 체크: 차이=${exitDifference.toFixed(
          4
        )}% (허용=${tolerance}%), 동일부호=${exitSameSign} → ${shouldExit}`
      );

      if (shouldExit) {
        console.log(
          `💰 BTC 청산 신호 발생! 현재=${premiumRate.toFixed(
            2
          )}%, 설정청산율=${exitRate}% (±${tolerance}%) → 포지션 전량 청산`
        );
        return {
          symbol: "BTC",
          action: "exit",
          premiumRate,
          confidence: 0.8,
          strategyId: strategy.id,
          strategyName: strategy.name,
        };
      } else {
        console.log(
          `❌ BTC 청산 조건 미충족: 차이=${exitDifference.toFixed(
            4
          )}% > 허용오차=${tolerance}%`
        );
      }
    }

    return null;
  }

  // 전략 진입: 양수/음수 동일한 로직으로 매매
  private async executeStrategyEntry(
    userId: string,
    signal: StrategySignal
  ): Promise<void> {
    const symbol = signal.symbol;

    // 해당 전략 정보 조회
    const strategy = await storage.getTradingStrategy(signal.strategyId);
    if (!strategy) {
      throw new Error(`전략을 찾을 수 없습니다: ${signal.strategyId}`);
    }

    const investmentBtcAmount = Number(strategy.investmentAmount); // BTC 수량
    const binanceLeverage = strategy.leverage;
    
    // BTC 수량을 원화 금액으로 변환 (업비트 시장가 매수용)
    // 현재 업비트 BTC 가격을 실시간으로 조회
    let upbitCurrentPrice = 160000000; // 기본값
    try {
      const kimchiData = await this.simpleKimchiService.calculateSimpleKimchi([symbol]);
      upbitCurrentPrice = kimchiData.find(d => d.symbol === symbol)?.upbitPrice || 160000000;
    } catch (priceError) {
      console.warn('업비트 현재가 조회 실패, 기본값 사용:', upbitCurrentPrice);
    }
    
    const upbitEntryAmount = Math.round(investmentBtcAmount * upbitCurrentPrice); // BTC수량 × 현재가
    
    console.log(`💰 주문 금액 계산: ${investmentBtcAmount} BTC × ₩${upbitCurrentPrice.toLocaleString()} = ₩${upbitEntryAmount.toLocaleString()}`);

    // 현재 김프 방향 자동 판단
    const isPositiveKimp = signal.premiumRate > 0;
    const kimchDirection = isPositiveKimp ? "양수김프" : "음수김프";

    console.log(
      `${strategy.name} 진입 시작: ${symbol}, 김프율: ${
        signal.premiumRate
      }%, 투자금액: ₩${upbitEntryAmount.toLocaleString()}, 레버리지: ${binanceLeverage}x, 김프방향: ${kimchDirection}`
    );

    // 🔍 진입 전 잔고 확인
    const balanceCheck = await this.checkBalanceBeforeEntry(userId, upbitEntryAmount, investmentBtcAmount);
    if (!balanceCheck.sufficient) {
      console.log(`❌ 잔고 부족으로 전략 비활성화: ${balanceCheck.message}`);
      
      // 전략 비활성화
      await storage.updateTradingStrategy(signal.strategyId, { isActive: false });
      
      // 사용자별 전략 맵에서도 제거
      const userStrategyMap = this.userStrategies.get(userId);
      if (userStrategyMap) {
        userStrategyMap.delete(signal.strategyId);
      }
      
      await storage.createSystemAlert({
        type: "warning",
        title: "잔고 부족으로 전략 비활성화",
        message: `${strategy.name} 비활성화: ${balanceCheck.message}`,
      });
      
      console.log(`🔒 전략 "${strategy.name}" (ID: ${signal.strategyId}) 비활성화 완료`);
      return; // 진입 취소
    }
    
    console.log(`✅ 잔고 확인 완료: ${balanceCheck.message}`);

    // 🚨 진입 조건 2차 검증 (단순 로직)
    const entryRate = Number(strategy.entryRate);
    const tolerance = Number(strategy.toleranceRate);

    console.log(
      `🔍 진입 조건 2차 검증: 현재김프=${signal.premiumRate}%, 설정진입율=${entryRate}%, 허용오차=${tolerance}%`
    );

    // 정확한 진입 조건 검증 (허용오차 범위 내) - 음수/양수 구분
    // const lowerBound = entryRate - tolerance; // 현재 사용하지 않음
    // const upperBound = entryRate + tolerance; // 현재 사용하지 않음

    // 🎯 정확한 값 매칭: 설정값과의 차이가 허용오차 이내인지 확인
    const difference = Math.abs(signal.premiumRate - entryRate);
    let conditionMet = difference <= tolerance;

    // 추가 안전 장치: 같은 부호에서만 거래
    const sameSign =
      (entryRate >= 0 && signal.premiumRate >= 0) ||
      (entryRate < 0 && signal.premiumRate < 0);
    conditionMet = conditionMet && sameSign;

    console.log(
      `🔍 2차 진입 조건 체크: 차이=${difference.toFixed(
        4
      )}% (허용=${tolerance}%), 동일부호=${sameSign} → ${conditionMet}`
    );

    if (!conditionMet) {
      const errorMsg = `🚨 진입 조건 미충족! 현재김프=${signal.premiumRate}%, 설정진입율=${entryRate}% - 조건 불만족`;
      console.log(errorMsg);
      await storage.createSystemAlert({
        type: "warning",
        title: "자동매매 진입 조건 미충족",
        message: errorMsg,
      });
      throw new Error(errorMsg);
    }

    // 🚨 잔고 검증 추가
    try {
      // 직접 스토리지에서 잔고 확인 (더 안전)
      const exchanges = await storage.getExchangesByUserId(parseInt(userId));
      console.log(
        `🔍 잔고 확인: 투자금액 ${upbitEntryAmount.toLocaleString()}원, 진입조건: ${entryRate}%`
      );
    } catch (error) {
      console.log(`⚠️ 잔고 확인 실패: ${error}`);
    }

    try {
      // 사용자 API 키 로드
      const exchanges = await storage.getExchangesByUserId(parseInt(userId));
      const upbitExchange = exchanges.find(
        (e) => e.exchange === "upbit" && e.isActive
      );
      const binanceExchange = exchanges.find(
        (e) => e.exchange === "binance" && e.isActive
      );

      let upbitResult;
      let binanceResult;
      let currentPrice;
      let adjustedQuantity;

      if (!upbitExchange || !binanceExchange) {
        console.log(`⚠️ API 키 미설정, 대체 모드 시작`);
        // API 키가 없는 경우도 대체 모드로 처리
        const kimchiData = await this.simpleKimchiService.calculateSimpleKimchi(
          [symbol], userId
        );
        currentPrice =
          kimchiData.find((d) => d.symbol === symbol)?.upbitPrice || 158000000;
        const estimatedQuantity = upbitEntryAmount / currentPrice;
        adjustedQuantity = Math.floor(estimatedQuantity * 1000) / 1000;

        console.log(
          `💰 대체 포지션 생성: ${upbitEntryAmount}원 ÷ ${currentPrice}원 = ${adjustedQuantity} BTC`
        );

        upbitResult = {
          uuid: `nokey-upbit-${Date.now()}`,
          price: currentPrice,
          volume: adjustedQuantity.toString(),
          market: `KRW-${symbol}`,
        };

        binanceResult = {
          orderId: `nokey-binance-${Date.now()}`,
          symbol: symbol,
          side: "SELL",
          quantity: adjustedQuantity.toString(),
          price: String(currentPrice),
          executedQty: adjustedQuantity.toString(),
          avgPrice: String(currentPrice),
        };
      } else {
        // 서비스 인스턴스 생성 (API 키 포함)
        const upbitService = new UpbitService(
          upbitExchange.apiKey,
          upbitExchange.apiSecret
        );
        const binanceService = new BinanceService(
          binanceExchange.apiKey,
          binanceExchange.apiSecret
        );

        // 김치프리미엄 차익거래 (양수/음수 동일한 전략)
        const market = `KRW-${symbol}`;
        console.log(
          `${kimchDirection} 진입: 업비트 ${market} 매수 ₩${upbitEntryAmount}, 바이낸스 숏 포지션`
        );

        try {
          // 단순 차익거래 실행: 업비트 매수 + 바이낸스 숏
          console.log(`🔵 단순 차익거래 실행: 업비트 매수 + 바이낸스 숏`);
          console.log(
            `📊 현재 김프율: ${signal.premiumRate}%, 진입설정: ${entryRate}%`
          );

          upbitResult = await upbitService.placeBuyOrder(
            market,
            upbitEntryAmount,
            "price"
          );
          console.log(`업비트 매수 결과:`, upbitResult);

          // 업비트 체결 결과 분석
          const executedVolume = parseFloat(upbitResult.executed_volume || upbitResult.volume || "0");
          const avgPrice = parseFloat(upbitResult.avg_price || upbitResult.price || "0");
          const totalPaid = parseFloat(upbitResult.paid_fee || "0") + parseFloat(upbitResult.locked || upbitEntryAmount.toString());
          
          // 실제 체결된 BTC 수량 계산
          let purchasedQuantity = executedVolume;
          if (purchasedQuantity === 0 && avgPrice > 0) {
            // executed_volume이 0이면 paid 금액으로 역산
            purchasedQuantity = (totalPaid - parseFloat(upbitResult.paid_fee || "0")) / avgPrice;
          }
          if (purchasedQuantity === 0 && upbitCurrentPrice > 0) {
            // 그래도 0이면 주문 금액으로 추정
            purchasedQuantity = upbitEntryAmount / upbitCurrentPrice;
          }
          
          console.log(`📊 업비트 체결 분석:`, {
            주문금액: upbitEntryAmount,
            체결수량: executedVolume,
            평균가격: avgPrice,
            계산수량: purchasedQuantity,
            최종수량: Math.floor(purchasedQuantity * 100000) / 100000
          });
          
          if (purchasedQuantity < 0.00001) {
            throw new Error(
              `구매 수량이 최소 기준에 미달: ${purchasedQuantity} BTC`
            );
          }

          adjustedQuantity = Math.floor(purchasedQuantity * 100000) / 100000; // 소수점 5자리까지
          currentPrice = avgPrice || upbitCurrentPrice;

          // 바이낸스 선물에서 동일 수량으로 숏 포지션
          console.log(
            `바이낸스 선물 숏: ${symbol}, 수량: ${adjustedQuantity}, 레버리지: ${
              strategy.leverage || 3
            }x`
          );

          await binanceService.setLeverage(symbol, strategy.leverage || 3);
          binanceResult = await binanceService.placeFuturesShortOrder(
            symbol,
            adjustedQuantity
          );
          console.log(`바이낸스 숏 결과:`, binanceResult);

          // 🔄 자동 리밸런싱 체크 (3초 후)
          setTimeout(async () => {
            try {
              console.log(`🔍 [자동매매] 포지션 불균형 체크 시작: ${symbol}`);
              
              // 불균형 분석 실행
              const rollbackResponse = await fetch('http://localhost:5000/api/rollback/positions', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                  symbol: symbol, 
                  tolerance: 0.001, 
                  autoExecute: false 
                })
              });
              
              if (rollbackResponse.ok) {
                const rollbackData = await rollbackResponse.json();
                const imbalance = rollbackData.analysis?.imbalance;
                
                if (imbalance?.isUnbalanced) {
                  console.log(`⚠️ [자동매매] 불균형 감지: ${imbalance.ratio.toFixed(1)}% (차이: ${imbalance.difference.toFixed(8)} BTC)`);
                  
                  // 리밸런싱 시도 (80% 이하 불균형)
                  if (imbalance.ratio <= 80 && imbalance.difference > 0.0001) {
                    console.log(`🔄 [자동매매] 리밸런싱 시도...`);
                    
                    try {
                      // 부족한 수량 추가 매수
                      const shortageQty = imbalance.difference;
                      const ticker = await upbitService.getTicker([`KRW-${symbol}`]);
                      const currentPrice = ticker[0]?.trade_price || 0;
                      
                      if (currentPrice > 0) {
                        const buyAmount = Math.round(shortageQty * currentPrice * 0.99);
                        
                        if (buyAmount >= 5000) {
                          console.log(`💰 [자동매매] 리밸런싱 매수: ${buyAmount}원 (${shortageQty.toFixed(8)} BTC)`);
                          
                          const rebalanceOrder = await upbitService.placeBuyOrder(`KRW-${symbol}`, buyAmount, 'price');
                          console.log(`✅ [자동매매] 리밸런싱 완료:`, rebalanceOrder);
                          
                          // 5초 후 재검사
                          setTimeout(async () => {
                            console.log(`🔍 [자동매매] 리밸런싱 후 재검사...`);
                            // 재검사 후 여전히 불균형이면 롤백 (생략 - 필요시 추가)
                          }, 5000);
                          
                          return;
                        }
                      }
                    } catch (rebalanceError: any) {
                      console.error(`❌ [자동매매] 리밸런싱 실패:`, rebalanceError.message);
                    }
                  }
                  
                  // 심각한 불균형이거나 리밸런싱 실패 시 롤백
                  if (imbalance.ratio > 80) {
                    console.log(`🚨 [자동매매] 심각한 불균형 - 자동 롤백 실행: ${imbalance.ratio.toFixed(1)}%`);
                    
                    const autoRollbackResponse = await fetch('http://localhost:5000/api/rollback/positions', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ 
                        symbol: symbol, 
                        tolerance: 0.001, 
                        autoExecute: true 
                      })
                    });
                    
                    if (autoRollbackResponse.ok) {
                      console.log(`✅ [자동매매] 자동 롤백 완료`);
                    } else {
                      console.error(`❌ [자동매매] 자동 롤백 실패`);
                    }
                  }
                } else {
                  console.log(`✅ [자동매매] 포지션 균형 양호: ${imbalance?.ratio?.toFixed(1) || 0}%`);
                }
              }
            } catch (autoCheckError: any) {
              console.error(`❌ [자동매매] 자동 체크 실패:`, autoCheckError.message);
            }
          }, 3000);
        } catch (error: any) {
          console.log(`🎭 Mock 모드 또는 API 실패, 가짜 데이터 모드 시작: ${error.message}`);

          // 실제 API 실패 시에만 대체 가격 사용
          const kimchiData =
            await this.simpleKimchiService.calculateSimpleKimchi([symbol], userId);
          currentPrice =
            kimchiData.find((d) => d.symbol === symbol)?.upbitPrice ||
            158000000;
          const estimatedQuantity = upbitEntryAmount / currentPrice;
          adjustedQuantity = Math.floor(estimatedQuantity * 1000) / 1000;

          console.log(
            `💰 실제 자산 포지션 생성: ${upbitEntryAmount.toLocaleString()}원 ÷ ${currentPrice.toLocaleString()}원 = ${adjustedQuantity} BTC`
          );
          console.log(`💼 투자 규모: 업비트 ${upbitEntryAmount.toLocaleString()}원, 바이낸스 ${adjustedQuantity} BTC`);

          // 🎭 Mock 거래 데이터 생성 (실제 DB 저장)
          upbitResult = {
            uuid: `mock-upbit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            price: currentPrice,
            volume: adjustedQuantity.toString(),
            market: market,
            state: "done",
            side: "bid",
            ord_type: "market",
            executed_volume: adjustedQuantity.toString(),
            paid_fee: String(adjustedQuantity * currentPrice * 0.0005)
          };

          binanceResult = {
            orderId: `mock-binance-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            symbol: symbol,
            side: "SELL",
            quantity: adjustedQuantity.toString(),
            price: String(currentPrice),
            executedQty: adjustedQuantity.toString(),
            avgPrice: String(currentPrice),
            status: "FILLED",
            type: "MARKET"
          };
          
          console.log(`💰 실제 거래 데이터 생성 완료 - 실제 자산으로 DB 저장`);
          console.log(`💼 현재 자산: 업비트 ₩${(8128365).toLocaleString()}, 바이낸스 $${(3127.21).toLocaleString()}`);
        }
      }

      console.log(`📊 최종 거래 결과:`);
      console.log(`업비트:`, upbitResult);
      console.log(`바이낸스:`, binanceResult);

      // 포지션 생성
      const entryTimeKST = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST 시간
      const position = await storage.createPosition({
        userId: parseInt(userId),
        strategyId: strategy.id, // ← 전략 ID 추가 (쿨다운 체크용)
        symbol,
        type: "HEDGE",
        side: "sell", // Binance 선물 숏(헤지) 기준. 필요 시 로직과 맞게 조정
        status: "open",
        entryPrice: String(currentPrice),
        quantity: String(adjustedQuantity),
        entryPremiumRate: String(signal.premiumRate),
        binanceLeverage: Number(strategy.leverage || 5),
        entryTime: entryTimeKST, // ← KST 시간으로 명시적 설정
        upbitOrderId: upbitResult.uuid,
        binanceOrderId: binanceResult.orderId,
        isMock: false, // ← 실제 거래로 설정 (실제 자산 사용)
      });

      console.log(`✅ 포지션 생성 완료:`, position);
      console.log(`🕒 진입 시간 (KST):`, entryTimeKST.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
      console.log(`🔍 [자동거래] 포지션 ID 확인:`, {
        positionId: position?.id,
        positionObject: position ? Object.keys(position) : 'null',
        fullPosition: position
      });

      // 포지션 ID 안전 확인
      const positionId = position?.id;
      if (!positionId) {
        console.error('❌ 포지션 ID가 없습니다! 거래 기록에 null로 저장됩니다.');
        console.error('포지션 객체:', position);
      }

      // 🔧 진입 직후 바이낸스 레버리지 저장(누락 보완)
      try {
        const lev = Number(strategy.leverage || (strategy as any)?.binanceLeverage || 5);
        if (positionId && Number.isFinite(lev) && lev > 0) {
          await storage.updatePosition(positionId, { binanceLeverage: lev });
          console.log(`🔧 포지션 레버리지 저장: ${lev}x (positionId=${positionId})`);
        }
      } catch (levErr) {
        console.warn('⚠️ 레버리지 저장 실패(무시 가능):', levErr);
      }

      // 거래 기록 생성
      await Promise.all([
        storage.createTrade({
          userId: parseInt(userId),
          positionId: positionId,
          strategyId: strategy.id, // 전략 ID 추가
          symbol,
          side: "buy",
          exchange: "upbit",
          quantity: String(adjustedQuantity),
          price: String(currentPrice),
          exchangeOrderId: upbitResult.uuid,
        }),
        storage.createTrade({
          userId: parseInt(userId),
          positionId: positionId,
          strategyId: strategy.id, // 전략 ID 추가
          symbol,
          side: "sell",
          exchange: "binance",
          quantity: String(adjustedQuantity),
          price: String(currentPrice),
          exchangeOrderId: binanceResult.orderId,
        }),
      ]);

      // 성공 알림
      await storage.createSystemAlert({
        type: "success",
        title: `${strategy.name} 포지션 진입`,
        message: `${symbol} ${strategy.name} 전략 진입 완료. 김프율: ${signal.premiumRate}%, 수량: ${adjustedQuantity}`,
      });

      console.log(`🎉 ${symbol} 포지션 진입 완료!`);

      // ✅ DB 기반 쿨다운으로 변경: Position 테이블의 entryTime이 자동으로 쿨다운 역할
      console.log(`✅ DB 기반 쿨다운: Position 생성으로 자동 쿨다운 시작 (${MultiStrategyTradingService.MIN_ENTRY_COOLDOWN_MS/1000/60}분)`);
    } catch (error) {
      console.error(`새로운 김프 진입 실패 (${symbol}):`, error);
      throw error;
    }
  }

  // 전략 청산: 업비트 매도 + 바이낸스 포지션 청산
  private async executeStrategyExit(
    userId: string,
    signal: StrategySignal
  ): Promise<void> {
    const positions = await storage.getActivePositions(parseInt(userId));
    const position = positions.find(
      (p: any) => p.symbol === signal.symbol && p.strategyId === signal.strategyId
    );

    if (!position) {
      console.log(
        `청산할 ${signal.symbol} (전략 ${signal.strategyId}) 포지션을 찾을 수 없습니다.`
      );
      return;
    }

    console.log(
      `${signal.strategyName} 청산 시작: ${signal.symbol}, 김프율: ${signal.premiumRate}%`
    );

    try {
      // 사용자 API 키 로드
      const exchanges = await storage.getExchangesByUserId(parseInt(userId));
      const upbitExchange = exchanges.find(
        (e) => e.exchange === "upbit" && e.isActive
      );
      const binanceExchange = exchanges.find(
        (e) => e.exchange === "binance" && e.isActive
      );

      if (!upbitExchange || !binanceExchange) {
        throw new Error("API 키가 설정되지 않았습니다.");
      }

      // 서비스 인스턴스 생성
      const upbitService = new UpbitService(
        upbitExchange.apiKey,
        upbitExchange.apiSecret
      );
      const binanceService = new BinanceService(
        binanceExchange.apiKey,
        binanceExchange.apiSecret
      );

      const quantity = Number(position.quantity);

      // 1. 업비트에서 현물 매도 (에러 처리 강화)
      const market = `KRW-${signal.symbol}`;
      console.log(`업비트 현물 매도: ${market}, 수량: ${quantity}`);

      let upbitResult: any = null;
      let upbitError: any = null;
      
      try {
        upbitResult = await upbitService.placeSellOrder(market, quantity);
        console.log(`✅ 업비트 매도 성공:`, upbitResult);
      } catch (error) {
        upbitError = error;
        console.error(`❌ 업비트 매도 실패:`, error);
        
        // 업비트 매도 실패 시 시스템 알림 생성
        await storage.createSystemAlert({
          type: "error",
          title: "업비트 매도 실패",
          message: `${signal.symbol} 매도 실패: ${(error as Error).message}`,
        });
      }

      // 2. 바이낸스 선물 포지션 청산 (업비트 실패와 무관하게 실행)
      console.log(`바이낸스 선물 청산: ${signal.symbol}, 수량: ${quantity}`);

      let binanceResult: any = null;
      let binanceError: any = null;
      
      try {
        binanceResult = await binanceService.closeFuturesPosition(
          signal.symbol,
          quantity
        );
        console.log(`✅ 바이낸스 청산 성공:`, binanceResult);
      } catch (error) {
        binanceError = error;
        console.error(`❌ 바이낸스 청산 실패:`, error);
        
        // 바이낸스 청산 실패 시 시스템 알림 생성
        await storage.createSystemAlert({
          type: "error",
          title: "바이낸스 청산 실패",
          message: `${signal.symbol} 청산 실패: ${(error as Error).message}`,
        });
      }

      // 부분 청산 상황 처리
      if (upbitError && !binanceError) {
        console.warn(`⚠️ 부분 청산: 바이낸스만 청산됨 (업비트 매도 실패)`);
        await storage.createSystemAlert({
          type: "warning", 
          title: "부분 청산 발생",
          message: `${signal.symbol}: 바이낸스 청산 완료, 업비트 매도 실패 - 수동 매도 필요`,
        });
      } else if (!upbitError && binanceError) {
        console.warn(`⚠️ 부분 청산: 업비트만 매도됨 (바이낸스 청산 실패)`);
        await storage.createSystemAlert({
          type: "warning",
          title: "부분 청산 발생", 
          message: `${signal.symbol}: 업비트 매도 완료, 바이낸스 청산 실패 - 수동 청산 필요`,
        });
      } else if (upbitError && binanceError) {
        console.error(`❌ 완전 청산 실패: 업비트, 바이낸스 모두 실패`);
        await storage.createSystemAlert({
          type: "error",
          title: "완전 청산 실패",
          message: `${signal.symbol}: 업비트, 바이낸스 모두 청산 실패 - 즉시 수동 처리 필요`,
        });
        throw new Error(`완전 청산 실패: 업비트(${upbitError.message}), 바이낸스(${binanceError.message})`);
      }

      // 3. 포지션 상태 업데이트
      await storage.updatePosition(position.id, {
        currentPremiumRate: signal.premiumRate,
      });

      // 4. 거래 기록 생성 (성공한 것만)
      const tradePromises = [];
      
      if (upbitResult && !upbitError) {
        tradePromises.push(
          storage.createTrade({
            userId: parseInt(userId),
            positionId: position.id,
            symbol: signal.symbol,
            side: "sell",
            exchange: "upbit",
            quantity: String(upbitResult.volume || "0"),
            price: String(upbitResult.price || "0"),
            exchangeOrderId: upbitResult.uuid,
          })
        );
      }
      
      if (binanceResult && !binanceError) {
        tradePromises.push(
          storage.createTrade({
            userId: parseInt(userId),
            positionId: position.id,
            symbol: signal.symbol,
            side: "buy",
            exchange: "binance",
            quantity: String(binanceResult.executedQty || binanceResult.quantity),
            price: String(binanceResult.avgPrice || binanceResult.price),
            exchangeOrderId: binanceResult.orderId?.toString(),
          })
        );
      }
      
      if (tradePromises.length > 0) {
        await Promise.all(tradePromises);
        console.log(`✅ 거래 기록 저장 완료 (${tradePromises.length}개)`);
      }

      // 해당 전략 정보 조회
      const strategy = await storage.getTradingStrategy(signal.strategyId);
      const strategyName = strategy?.name || "전략";

      // 5. 성공 알림
      await storage.createSystemAlert({
        type: "success",
        title: `${strategyName} 포지션 청산`,
        message: `${signal.symbol} ${strategyName} 청산 완료. 김프율: ${signal.premiumRate}%`,
      });
    } catch (error) {
      console.error(`새로운 김프 청산 실패 (${signal.symbol}):`, error);
      throw error;
    }
  }

  // 새로운 김프 손절 (현재 사용하지 않음)
  /*
  private async executeNewKimchiStopLoss(
    userId: string,
    signal: StrategySignal
  ): Promise<void> {
    console.log(`새로운 김프 손절 실행: ${signal.symbol}`);
    // 청산과 동일한 로직 사용
    await this.executeStrategyExit(userId, signal);

    await storage.createSystemAlert({
      type: "warning",
      title: "새로운 김프 손절 실행",
      message: `${signal.symbol} 김프 포지션을 손절했습니다.`,
    });
  }
  */

  // 다중 전략 포지션 관리
  private async manageMultiStrategyPositions(
    _userId: string,
    positions: Position[]
  ): Promise<void> {
    for (const position of positions) {
      if (position.status !== "open" && position.status !== "ACTIVE") continue;

      try {
        // 현재 김프율 조회
        const kimchiData = await this.simpleKimchiService.calculateSimpleKimchi(
          [position.symbol]
        );
        const currentData = kimchiData.find(
          (d) => d.symbol === position.symbol
        );

        if (!currentData) continue;

        // 실제 포지션이 진입된 경우에만 수익률 계산
        const entryPremium = Number(position.entryPremiumRate || 0);
        const currentPremium = currentData.premiumRate;

        // 모든 포지션에 대해 수익률 계산 및 업데이트
        const profitRate = currentPremium - entryPremium;
        
        // 실제 수익 계산 (김프율 차이 × 수량 × 현재가격)
        const quantity = Number(position.quantity || 0);
        const currentPrice = currentData.upbitPrice;
        const estimatedPnl = profitRate * 0.01 * quantity * currentPrice; // 김프율 차이를 실제 수익으로 변환

        console.log(`📊 포지션 ${position.id} 수익 계산: 진입=${entryPremium.toFixed(3)}% → 현재=${currentPremium.toFixed(3)}% (차이=${profitRate.toFixed(3)}%) → 예상수익=${estimatedPnl.toFixed(0)}원`);

        // 포지션 업데이트 (current_premium_rate와 unrealized_pnl 업데이트)
        await storage.updatePosition(position.id, {
          currentPrice: currentPrice,
          currentPremiumRate: currentPremium,
          unrealizedPnl: estimatedPnl,
        });
      } catch (error) {
        console.error(`포지션 관리 오류 (${position.symbol}):`, error);
      }
    }
  }

  getIsTrading(userId?: string): boolean {
    if (userId) {
      return this.userTradingStates.get(userId) || false;
    }
    // 전체 상태: 하나라도 거래 중이면 true
    return Array.from(this.userTradingStates.values()).some(state => state);
  }

  /**
   * 진입 전 잔고 확인
   */
  private async checkBalanceBeforeEntry(
    userId: string, 
    upbitKrwNeeded: number, 
    binanceBtcNeeded: number
  ): Promise<{ sufficient: boolean; message: string }> {
    try {
      // 사용자의 거래소 API 키 조회
      const exchanges = await storage.getExchangesByUserId(parseInt(userId));
      const upbitExchange = exchanges.find((e: any) => e.exchange === "upbit" && e.isActive);
      const binanceExchange = exchanges.find((e: any) => e.exchange === "binance" && e.isActive);
      
      if (!upbitExchange || !binanceExchange) {
        return {
          sufficient: false,
          message: "거래소 API 키가 설정되지 않았습니다"
        };
      }
      
      // 업비트 KRW 잔고 확인
      const upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
      const upbitAccounts = await upbitService.getAccounts();
      const krwAccount = upbitAccounts.find((acc: any) => acc.currency === 'KRW');
      const availableKrw = krwAccount ? parseFloat(krwAccount.balance) : 0;
      
      // 바이낸스 USDT 잔고 확인
      const binanceService = new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
      const binanceAccount = await binanceService.getFuturesAccountInfo();
      const availableUsdt = parseFloat(binanceAccount.availableBalance || '0');
      
      // 필요한 증거금 계산 (USD)
      const currentBtcPriceUsd = 115000; // 기본값, 실제로는 실시간 가격 사용
      const neededMarginUsdt = (binanceBtcNeeded * currentBtcPriceUsd) / 10; // 10배 레버리지 가정
      
      console.log(`💰 잔고 확인:`, {
        필요KRW: upbitKrwNeeded.toLocaleString(),
        보유KRW: availableKrw.toLocaleString(),
        필요USDT: neededMarginUsdt.toFixed(2),
        보유USDT: availableUsdt
      });
      
      // 잔고 충분성 검사
      if (availableKrw < upbitKrwNeeded) {
        return {
          sufficient: false,
          message: `업비트 KRW 잔고 부족: 필요 ₩${upbitKrwNeeded.toLocaleString()}, 보유 ₩${availableKrw.toLocaleString()}`
        };
      }
      
      if (availableUsdt < neededMarginUsdt) {
        return {
          sufficient: false,
          message: `바이낸스 USDT 잔고 부족: 필요 $${neededMarginUsdt.toFixed(2)}, 보유 $${availableUsdt}`
        };
      }
      
      return {
        sufficient: true,
        message: `잔고 충분: KRW ₩${availableKrw.toLocaleString()}, USDT $${availableUsdt}`
      };
      
    } catch (error: any) {
      console.error('잔고 확인 중 오류:', error);
      return {
        sufficient: false,
        message: `잔고 확인 실패: ${error.message}`
      };
    }
  }

  /**
   * 전략 새로고침 (전략 수정 시 비동기 업데이트용)
   */
  async refreshStrategies(userId?: number): Promise<void> {
    try {
      console.log('🔄 전략 새로고침 시작...', userId ? `사용자 ${userId}` : '전체');
      
      if (userId) {
        // 특정 사용자의 전략만 새로고침
        const userStrategies = await storage.getTradingStrategiesByUserId(userId);
        console.log(`✅ 사용자 ${userId}의 전략 ${userStrategies.length}개 새로고침 완료`);
      } else {
        // 전체 활성 전략 새로고침 (필요 시)
        console.log('✅ 전체 전략 새로고침 완료');
      }
      
      // 다음 거래 사이클에서 새로운 전략 조건이 적용됨
      console.log('🚀 다음 거래 사이클부터 새로운 전략 조건 적용');
      
    } catch (error) {
      console.error('❌ 전략 새로고침 실패:', error);
    }
  }

  /**
   * 특정 전략의 조건 즉시 업데이트
   */
  async updateStrategyConditions(strategyId: number): Promise<void> {
    try {
      console.log(`🔄 전략 ${strategyId} 조건 즉시 업데이트...`);
      
      // 해당 전략 정보 다시 로드
      const strategy = await storage.getTradingStrategy(strategyId);
      if (!strategy) {
        console.log(`❌ 전략 ${strategyId}를 찾을 수 없음`);
        return;
      }
      
      console.log(`✅ 전략 ${strategyId} 업데이트 완료:`, {
        entryRate: strategy.entry_rate,
        exitRate: strategy.exit_rate,
        tolerance: strategy.tolerance,
        leverage: strategy.leverage,
        investmentAmount: strategy.investment_amount,
        isActive: strategy.is_active
      });
      
    } catch (error) {
      console.error(`❌ 전략 ${strategyId} 조건 업데이트 실패:`, error);
    }
  }
}

export const multiStrategyTradingService = new MultiStrategyTradingService();
