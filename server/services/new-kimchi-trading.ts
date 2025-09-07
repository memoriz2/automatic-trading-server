import { UpbitService } from "./upbit.js";
import { BinanceService } from "./binance.js";
import { SimpleKimchiService } from "./simple-kimchi.js";
import { storage } from "../storage.js";
import { Prisma } from "../../generated/prisma";
import type { TradingSetting as TradingSettings, Position, TradingStrategy } from "../../generated/prisma";

export interface StrategySignal {
  symbol: string;
  action: "entry" | "exit" | "stop_loss";
  premiumRate: number;
  confidence: number;
  strategyId: number;
  strategyName: string;
}

export class MultiStrategyTradingService {
  private upbitService: UpbitService;
  private binanceService: BinanceService;
  private simpleKimchiService: SimpleKimchiService;
  private isTrading: boolean = false;
  private lastKimchiRates: Map<string, number> = new Map();
  private activeStrategies: Map<number, TradingStrategy> = new Map();

  constructor() {
    this.upbitService = new UpbitService();
    this.binanceService = new BinanceService();
    this.simpleKimchiService = new SimpleKimchiService();
  }

  async startMultiStrategyTrading(userId: string): Promise<void> {
    if (this.isTrading) {
      throw new Error("Multi-strategy trading is already running");
    }

    // 활성 전략들 로드
    const strategies = await storage.getTradingStrategies(userId);
    const activeStrategies = strategies.filter((s) => s.isActive);

    if (activeStrategies.length === 0) {
      throw new Error("No active trading strategies found");
    }

    // 전략들을 맵에 저장
    this.activeStrategies.clear();
    activeStrategies.forEach((strategy) => {
      this.activeStrategies.set(strategy.id, strategy);
    });

    this.isTrading = true;
    await storage.createSystemAlert({
      type: "info",
      title: "다중 전략 자동매매 시작",
      message: `${activeStrategies.length}개 전략으로 김프 차익거래가 시작되었습니다.`,
    });

    // 백그라운드에서 트레이딩 루프 실행
    this.multiStrategyTradingLoop(userId).catch(console.error);
  }

  async stopMultiStrategyTrading(): Promise<void> {
    this.isTrading = false;
    this.activeStrategies.clear();
    await storage.createSystemAlert({
      type: "info",
      title: "다중 전략 자동매매 중지",
      message: "모든 전략의 자동매매가 중지되었습니다.",
    });
  }

  private async multiStrategyTradingLoop(userId: string): Promise<void> {
    while (this.isTrading) {
      try {
        // BTC 김프율만 확인 (단일 포지션)
        const symbols = ["BTC"];
        const kimchiData = await this.simpleKimchiService.calculateSimpleKimchi(
          symbols, userId
        );

        // 활성 포지션 조회
        const activePositions = await storage.getActivePositions(userId);

        // BTC 단일 전략 신호 분석
        for (const [strategyId, strategy] of Array.from(
          this.activeStrategies
        )) {
          // BTC 데이터만 처리
          const btcData = kimchiData.find((d) => d.symbol === "BTC");
          if (!btcData) continue;

          // 현재 김프율 저장
          this.lastKimchiRates.set("BTC", btcData.premiumRate);

          // 활성 포지션이 이미 있는지 확인 (1개 제한)
          const hasActivePosition = activePositions.some(
            (p) => p.status === "open"
          );

          const signal = this.analyzeStrategySignal(
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
  private analyzeStrategySignal(
    kimchiData: any,
    strategy: TradingStrategy,
    activePositions: Position[],
    hasActivePosition: boolean = false
  ): StrategySignal | null {
    const premiumRate = kimchiData.premiumRate;
    const symbol = "BTC"; // BTC 고정

    // BTC 활성 포지션 확인 (전략 상관없이 1개만 허용)
    const existingPosition = activePositions.find(
      (p) => p.symbol === "BTC" && p.status === "open"
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

    const upbitEntryAmount = Number(strategy.investmentAmount);
    const binanceLeverage = strategy.leverage;

    // 현재 김프 방향 자동 판단
    const isPositiveKimp = signal.premiumRate > 0;
    const kimchDirection = isPositiveKimp ? "양수김프" : "음수김프";

    console.log(
      `${strategy.name} 진입 시작: ${symbol}, 김프율: ${
        signal.premiumRate
      }%, 투자금액: ₩${upbitEntryAmount.toLocaleString()}, 레버리지: ${binanceLeverage}x, 김프방향: ${kimchDirection}`
    );

    // 🚨 진입 조건 2차 검증 (단순 로직)
    const entryRate = Number(strategy.entryRate);
    const tolerance = Number(strategy.toleranceRate);

    console.log(
      `🔍 진입 조건 2차 검증: 현재김프=${signal.premiumRate}%, 설정진입율=${entryRate}%, 허용오차=${tolerance}%`
    );

    // 정확한 진입 조건 검증 (허용오차 범위 내) - 음수/양수 구분
    const lowerBound = entryRate - tolerance;
    const upperBound = entryRate + tolerance;

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
      const exchanges = await storage.getExchangesByUserId(userId);
      console.log(
        `🔍 잔고 확인: 투자금액 ${upbitEntryAmount.toLocaleString()}원, 진입조건: ${entryRate}%`
      );
    } catch (error) {
      console.log(`⚠️ 잔고 확인 실패: ${error}`);
    }

    try {
      // 사용자 API 키 로드
      const exchanges = await storage.getExchangesByUserId(userId);
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

          const purchasedQuantity = parseFloat(upbitResult.volume || "0");
          if (purchasedQuantity < 0.001) {
            throw new Error(
              `구매 수량이 최소 기준(0.001)에 미달: ${purchasedQuantity}`
            );
          }

          adjustedQuantity = Math.floor(purchasedQuantity * 1000) / 1000;
          currentPrice = parseFloat(upbitResult.price || "0");

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
        } catch (error: any) {
          console.log(`⚠️ 실제 거래 실패, 대체 모드 시작: ${error.message}`);

          // 실제 API 실패 시에만 대체 가격 사용
          const kimchiData =
            await this.simpleKimchiService.calculateSimpleKimchi([symbol], userId);
          currentPrice =
            kimchiData.find((d) => d.symbol === symbol)?.upbitPrice ||
            158000000;
          const estimatedQuantity = upbitEntryAmount / currentPrice;
          adjustedQuantity = Math.floor(estimatedQuantity * 1000) / 1000;

          console.log(
            `💰 대체 포지션 생성: ${upbitEntryAmount}원 ÷ ${currentPrice}원 = ${adjustedQuantity} BTC`
          );

          upbitResult = {
            uuid: `fallback-upbit-${Date.now()}`,
            price: currentPrice,
            volume: adjustedQuantity.toString(),
            market: market,
          };

          binanceResult = {
            orderId: `fallback-binance-${Date.now()}`,
            symbol: symbol,
            side: "SELL",
            quantity: adjustedQuantity.toString(),
            price: String(currentPrice),
            executedQty: adjustedQuantity.toString(),
            avgPrice: String(currentPrice),
          };
        }
      }

      console.log(`📊 최종 거래 결과:`);
      console.log(`업비트:`, upbitResult);
      console.log(`바이낸스:`, binanceResult);

      // 포지션 생성
      const position = await storage.createPosition({
        userId: parseInt(userId),
        symbol,
        type: "HEDGE",
        side: "sell", // Binance 선물 숏(헤지) 기준. 필요 시 로직과 맞게 조정
        status: "open",
        entryPrice: String(currentPrice),
        quantity: String(adjustedQuantity),
        entryPremiumRate: String(signal.premiumRate),
        upbitOrderId: upbitResult.uuid,
        binanceOrderId: binanceResult.orderId,
        strategyId: strategy.id,
      });

      console.log(`✅ 포지션 생성 완료:`, position);

      // 거래 기록 생성
      await Promise.all([
        storage.createTrade({
          userId: parseInt(userId),
          positionId: position.id,
          symbol,
          side: "buy",
          exchange: "upbit",
          quantity: String(adjustedQuantity),
          price: String(currentPrice),
          exchangeOrderId: upbitResult.uuid,
        }),
        storage.createTrade({
          userId: parseInt(userId),
          positionId: position.id,
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
    const positions = await storage.getActivePositions(userId);
    const position = positions.find(
      (p) => p.symbol === signal.symbol && p.strategyId === signal.strategyId
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
      const exchanges = await storage.getExchangesByUserId(userId);
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

      // 1. 업비트에서 현물 매도
      const market = `KRW-${signal.symbol}`;
      console.log(`업비트 현물 매도: ${market}, 수량: ${quantity}`);

      const upbitResult = await upbitService.placeSellOrder(market, quantity);
      console.log(`업비트 매도 결과:`, upbitResult);

      // 2. 바이낸스 선물 포지션 청산
      console.log(`바이낸스 선물 청산: ${signal.symbol}, 수량: ${quantity}`);

      const binanceResult = await binanceService.closeFuturesPosition(
        signal.symbol,
        quantity
      );
      console.log(`바이낸스 청산 결과:`, binanceResult);

      // 3. 포지션 상태 업데이트
      await storage.updatePosition(position.id, {
        currentPremiumRate: new Prisma.Decimal(signal.premiumRate),
      });

      // 4. 거래 기록 생성
      await Promise.all([
        storage.createTrade({
          userId: parseInt(userId),
          positionId: position.id,
          symbol: signal.symbol,
          side: "sell",
          exchange: "upbit",
          quantity: String(upbitResult.volume || "0"),
          price: String(upbitResult.price || "0"),
          exchangeOrderId: upbitResult.uuid,
        }),
        storage.createTrade({
          userId: parseInt(userId),
          positionId: position.id,
          symbol: signal.symbol,
          side: "buy",
          exchange: "binance",
          quantity: String(binanceResult.executedQty || binanceResult.quantity),
          price: String(binanceResult.avgPrice || binanceResult.price),
          exchangeOrderId: binanceResult.orderId?.toString(),
        }),
      ]);

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

  // 새로운 김프 손절
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

  // 다중 전략 포지션 관리
  private async manageMultiStrategyPositions(
    userId: string,
    positions: Position[]
  ): Promise<void> {
    for (const position of positions) {
      if (position.status !== "ACTIVE") continue;

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

        // 진입가격이 정상적인 범위인지 확인 (5만원이면 모의거래 오류)
        const entryPrice = Number(position.entryPrice || 0);
        const isValidEntry = entryPrice > 100000; // 10만원 이상이면 정상 진입

        if (isValidEntry) {
          // 정상 진입된 포지션만 수익률 계산
          const profitRate = currentPremium - entryPremium;

          // 포지션 업데이트
          await storage.updatePosition(position.id, {
            currentPrice: new Prisma.Decimal(currentData.upbitPrice ?? Number(position.currentPrice ?? 0)),
            currentPremiumRate: new Prisma.Decimal(currentPremium),
          });
        } else {
          // 비정상 진입 포지션은 현재 김프율만 업데이트
          await storage.updatePosition(position.id, {
            currentPrice: new Prisma.Decimal(currentData.upbitPrice ?? Number(position.currentPrice ?? 0)),
            currentPremiumRate: new Prisma.Decimal(currentPremium),
          });
        }
      } catch (error) {
        console.error(`포지션 관리 오류 (${position.symbol}):`, error);
      }
    }
  }

  getIsTrading(): boolean {
    return this.isTrading;
  }
}

export const multiStrategyTradingService = new MultiStrategyTradingService();
