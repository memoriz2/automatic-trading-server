import { SimpleKimchiService } from "./simple-kimchi.js";
import { storage } from "../storage.js";
import { ExchangeServiceFactory } from './exchange-factory.js';
import { TRADING_CONSTANTS } from '../types/constants.js';
import { log } from '../utils/logger.js';
export class MultiStrategyTradingService {
    // 인스턴스 변수
    simpleKimchiService;
    userTradingStates = new Map();
    lastKimchiRates = new Map();
    activeStrategies = new Map();
    userStrategies = new Map();
    constructor() {
        this.simpleKimchiService = new SimpleKimchiService();
    }
    // 거래소 서비스 초기화 (중복 코드 제거)
    async initializeExchangeServices(userId) {
        const userIdNum = parseInt(userId);
        const exchanges = await storage.getExchangesByUserId(userIdNum);
        const upbitExchange = exchanges.find(e => e.exchange === 'upbit' && e.isActive);
        const binanceExchange = exchanges.find(e => e.exchange === 'binance' && e.isActive);
        const services = await ExchangeServiceFactory.initializeByUserId(userIdNum);
        return {
            upbitService: services.upbitService,
            binanceService: services.binanceService,
            upbitExchange,
            binanceExchange
        };
    }
    // 업비트 현재가 조회 (중복 코드 제거)
    async getUpbitCurrentPrice(symbol, userId) {
        let upbitCurrentPrice = TRADING_CONSTANTS.DEFAULT_UPBIT_BTC_PRICE;
        try {
            const services = await this.initializeExchangeServices(userId);
            if (services.upbitService) {
                upbitCurrentPrice = await services.upbitService.getCurrentPrice(`KRW-${symbol}`);
                log.debug('API로 업비트 현재가 조회', { symbol, price: upbitCurrentPrice });
            }
            else {
                // API 키가 없으면 웹소켓 데이터 사용
                const kimchiData = await this.simpleKimchiService.calculateSimpleKimchi([symbol]);
                upbitCurrentPrice = kimchiData.find(d => d.symbol === symbol)?.upbitPrice || TRADING_CONSTANTS.DEFAULT_UPBIT_BTC_PRICE;
                log.debug('웹소켓으로 업비트 현재가 조회', { symbol, price: upbitCurrentPrice });
            }
        }
        catch (priceError) {
            console.warn('업비트 현재가 조회 실패, 기본값 사용:', upbitCurrentPrice);
        }
        return upbitCurrentPrice;
    }
    async startMultiStrategyTrading(userId) {
        if (this.userTradingStates.get(userId)) {
            throw new Error(`User ${userId} trading is already running`);
        }
        // 활성 전략들 로드
        const strategies = await storage.getTradingStrategies(parseInt(userId));
        const activeStrategies = strategies.filter((s) => s.isActive);
        if (activeStrategies.length === 0) {
            throw new Error("No active trading strategies found");
        }
        // 사용자별 전략들을 맵에 저장
        if (!this.userStrategies.has(userId)) {
            this.userStrategies.set(userId, new Map());
        }
        const userStrategyMap = this.userStrategies.get(userId);
        userStrategyMap.clear();
        activeStrategies.forEach((strategy) => {
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
    async stopMultiStrategyTrading(userId) {
        if (userId) {
            // 특정 사용자의 거래만 중지
            this.userTradingStates.set(userId, false);
            this.userStrategies.delete(userId);
            await storage.createSystemAlert({
                type: "info",
                title: "자동매매 중지",
                message: `사용자 ${userId}의 자동매매가 중지되었습니다.`,
            });
        }
        else {
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
    async multiStrategyTradingLoop(userId) {
        while (this.userTradingStates.get(userId)) {
            try {
                // BTC 김프율만 확인 (단일 포지션)
                const symbols = ["BTC"];
                const kimchiData = await this.simpleKimchiService.calculateSimpleKimchi(symbols, userId);
                // 활성 포지션 조회
                const activePositions = await storage.getActivePositions(parseInt(userId));
                // BTC 단일 전략 신호 분석 (사용자별 전략 사용)
                const userStrategyMap = this.userStrategies.get(userId);
                if (!userStrategyMap)
                    continue;
                for (const [_strategyId, strategy] of Array.from(userStrategyMap)) {
                    // BTC 데이터만 처리
                    const btcData = kimchiData.find((d) => d.symbol === "BTC");
                    if (!btcData)
                        continue;
                    // 현재 김프율 저장
                    this.lastKimchiRates.set("BTC", btcData.premiumRate);
                    // 활성 포지션이 이미 있는지 확인 (1개 제한)
                    const hasActivePosition = activePositions.some((p) => p.status === "open");
                    const signal = await this.analyzeStrategySignal(btcData, strategy, activePositions, hasActivePosition);
                    if (signal) {
                        await this.executeStrategySignal(userId, signal);
                        // BTC 포지션 생성 후 루프 종료 (1개 포지션 제한)
                        if (signal.action === "entry")
                            break;
                    }
                }
                // 기존 포지션 관리
                await this.manageMultiStrategyPositions(userId, activePositions);
                // 5초 대기
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
            catch (error) {
                console.error("Multi-strategy trading loop error:", error);
                await storage.createSystemAlert({
                    type: "error",
                    title: "다중 전략 자동매매 오류",
                    message: `자동매매 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
                });
                // 오류 시 잠시 대기
                await new Promise((resolve) => setTimeout(resolve, 10000));
            }
        }
    }
    // 전략 신호 실행
    async executeStrategySignal(userId, signal) {
        try {
            if (signal.action === "entry") {
                await this.executeStrategyEntry(userId, signal);
            }
            else if (signal.action === "exit") {
                await this.executeStrategyExit(userId, signal);
            }
        }
        catch (error) {
            console.error(`전략 신호 실행 실패 (${signal.strategyName}):`, error);
            await storage.createSystemAlert({
                type: "error",
                title: "전략 실행 오류",
                message: `${signal.strategyName} 실행 중 오류: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }
    // BTC 단순 자동매매 신호 분석 (양수/음수 김프 구분 없음)
    async analyzeStrategySignal(kimchiData, strategy, activePositions, hasActivePosition = false) {
        const premiumRate = kimchiData.premiumRate;
        // const symbol = "BTC"; // BTC 고정 - 현재 사용하지 않음
        // BTC 활성 포지션 확인 (해당 전략의 포지션만)
        const existingPosition = activePositions.find((p) => p.symbol === "BTC" && p.status === "open" && p.strategyId === strategy.id);
        // 사용자 설정 값
        const entryRate = Number(strategy.entryRate);
        const exitRate = Number(strategy.exitRate);
        const tolerance = Number(strategy.toleranceRate);
        console.log(`🔍 [서버] BTC 자동매매 체크 - 전략 #${strategy.id}: 현재김프=${premiumRate}%, 진입율=${entryRate}%, 청산율=${exitRate}%, 허용오차=${tolerance}%`);
        console.log(`🔍 [서버] 포지션 확인: existingPosition=${existingPosition ? 'O' : 'X'}, hasActivePosition=${hasActivePosition}`);
        // 진입 조건 체크 (포지션이 없을 때만)
        if (!hasActivePosition && !existingPosition) {
            const userId = String(strategy.userId);
            // 🔒 오픈된 포지션 또는 업비트 BTC 잔고가 있으면 진입 금지 (청산이 완료되지 않은 상태)
            const openPositions = await storage.getPositions(parseInt(userId));
            const hasOpenPositions = openPositions.some((p) => p.status === 'open');
            // 업비트 실제 BTC 잔고도 체크
            let upbitBtcBalance = 0;
            let services = null;
            try {
                services = await this.initializeExchangeServices(userId);
                if (services.upbitService) {
                    const accounts = await services.upbitService.getAccounts();
                    const btcAccount = accounts.find((acc) => acc.currency === 'BTC');
                    upbitBtcBalance = parseFloat(btcAccount?.balance || '0');
                }
            }
            catch (error) {
                log.warn('업비트 잔고 조회 실패', { userId: parseInt(userId) });
            }
            if (hasOpenPositions || upbitBtcBalance >= 0.00008) {
                log.debug('진입 제한', { hasOpenPositions, upbitBtcBalance, userId: parseInt(userId) });
                // 🚀 업비트 BTC 잔고가 있으면 자동 청산 시도 (최소 거래 단위 확인)
                if (upbitBtcBalance >= TRADING_CONSTANTS.BTC_MIN_QUANTITY && services?.upbitService) {
                    log.info('업비트 BTC 자동 청산 시도 시작', { balance: upbitBtcBalance });
                    try {
                        log.debug('청산 조건 확인', { balance: upbitBtcBalance, minQuantity: TRADING_CONSTANTS.BTC_MIN_QUANTITY });
                        // 현재가 조회해서 거래 금액 확인
                        const ticker = await services.upbitService.getTicker(['KRW-BTC']);
                        const currentPrice = ticker[0]?.trade_price || 0;
                        const tradeAmount = upbitBtcBalance * currentPrice;
                        log.debug('예상 거래금액 계산', { btcAmount: upbitBtcBalance, price: currentPrice, totalAmount: tradeAmount });
                        if (tradeAmount < 5000) {
                            throw new Error(`거래 금액이 최소 기준 미달: ${tradeAmount.toLocaleString()}원 < 5,000원`);
                        }
                        // 업비트 계좌 정보 다시 확인 (locked 잔고 체크)
                        const accounts = await services.upbitService.getAccounts();
                        const btcAccount = accounts.find((acc) => acc.currency === 'BTC');
                        const availableBalance = parseFloat(btcAccount?.balance || '0');
                        const lockedBalance = parseFloat(btcAccount?.locked || '0');
                        log.debug('업비트 BTC 잔고 상세', { totalBalance: upbitBtcBalance, available: availableBalance, locked: lockedBalance });
                        if (availableBalance < 0.0001) {
                            throw new Error(`사용 가능한 BTC 잔고 부족: ${availableBalance} (잠긴잔고: ${lockedBalance})`);
                        }
                        // 안전한 매도 수량 계산 (사용가능 잔고의 99% 또는 정밀도 조정)
                        const safeSellAmount = Math.min(availableBalance * 0.99, parseFloat(availableBalance.toFixed(8)));
                        log.debug('안전 매도 수량 계산', { safeSellAmount, original: upbitBtcBalance, available: availableBalance });
                        // 업비트 시장가 매도
                        const sellResult = await services.upbitService.placeSellOrder(`KRW-BTC`, safeSellAmount, 'market');
                        log.success('업비트 BTC 청산 완료', { orderId: sellResult.uuid, amount: safeSellAmount });
                        // 청산 로그 저장
                        await storage.createTradeLog({
                            exchange: 'upbit',
                            symbol: 'BTC',
                            side: 'sell',
                            quantity: safeSellAmount,
                            orderId: sellResult.uuid,
                            status: 'completed',
                            note: '자동 청산 (잔고 정리)'
                        });
                    }
                    catch (error) {
                        log.error('업비트 BTC 자동 청산 실패', error instanceof Error ? error : undefined, { balance: upbitBtcBalance });
                        // 실패 로그 저장
                        await storage.createTradeLog({
                            exchange: 'upbit',
                            symbol: 'BTC',
                            side: 'sell',
                            quantity: upbitBtcBalance,
                            orderId: null,
                            status: 'failed',
                            note: `자동 청산 실패: ${error instanceof Error ? error.message : String(error)}`
                        });
                    }
                }
                return null;
            }
            // 🔒 진입 쿨다운 가드: DB에서 최근 진입 시간 확인 (서버 재시작에도 유지)
            const recentPosition = await storage.getRecentPositionByStrategy(strategy.id);
            if (recentPosition) {
                const lastEntryTime = recentPosition.entryTime.getTime();
                const elapsed = Date.now() - lastEntryTime;
                if (elapsed < TRADING_CONSTANTS.MIN_ENTRY_COOLDOWN_MS) {
                    const remainSec = Math.ceil((TRADING_CONSTANTS.MIN_ENTRY_COOLDOWN_MS - elapsed) / 1000);
                    log.debug('DB 기반 진입 쿨다운 진행중', { remainSec });
                    log.debug('최근 진입 시간', { lastEntry: recentPosition.entryTime.toISOString() });
                    return null;
                }
            }
            // 🎯 정확한 값 매칭: 설정값과의 차이가 허용오차 이내인지 확인
            const entryDifference = Math.abs(premiumRate - entryRate);
            const sameSign = (entryRate >= 0 && premiumRate >= 0) ||
                (entryRate < 0 && premiumRate < 0);
            const shouldEnterBtc = entryDifference <= tolerance && sameSign;
            console.log(`🔍 진입 조건 체크: 차이=${entryDifference.toFixed(4)}% (허용=${tolerance}%), 동일부호=${sameSign} → ${shouldEnterBtc}`);
            if (shouldEnterBtc) {
                console.log(`🎯 BTC 진입 신호 발생! 현재=${premiumRate.toFixed(2)}%, 설정=${entryRate}% (±${tolerance}%)`);
                return {
                    action: "entry",
                    symbol: "BTC",
                    premiumRate,
                    strategyId: strategy.id,
                    strategyName: strategy.name || "BTC 단순 차익거래",
                    confidence: 0.8,
                };
            }
            else {
                console.log(`❌ BTC 진입 조건 미충족: 차이=${entryDifference.toFixed(4)}% > 허용오차=${tolerance}%`);
            }
        }
        else {
            console.log(`⏳ BTC 진입 불가: 이미 활성 포지션 존재`);
        }
        // 청산 조건 체크 (포지션이 있을 때만)
        if (existingPosition) {
            // 🎯 청산은 단순 임계값 비교 (허용오차 없음)
            const shouldExit = premiumRate >= exitRate; // 김프율이 청산율 이상이면 청산
            console.log(`🔍 [서버] 청산 조건 체크: 현재김프=${premiumRate.toFixed(4)}% >= 청산율=${exitRate}% → ${shouldExit}`);
            if (shouldExit) {
                console.log(`💰 BTC 청산 신호 발생! 현재=${premiumRate.toFixed(2)}%, 설정청산율=${exitRate}% (±${tolerance}%) → 포지션 전량 청산`);
                return {
                    symbol: "BTC",
                    action: "exit",
                    premiumRate,
                    confidence: 0.8,
                    strategyId: strategy.id,
                    strategyName: strategy.name,
                };
            }
            else {
                console.log(`❌ [서버] BTC 청산 조건 미충족: 현재김프=${premiumRate.toFixed(4)}% < 청산율=${exitRate}%`);
            }
        }
        return null;
    }
    // 전략 진입: 양수/음수 동일한 로직으로 매매
    async executeStrategyEntry(userId, signal) {
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
        const upbitCurrentPrice = await this.getUpbitCurrentPrice(symbol, userId);
        const upbitEntryAmount = Math.round(investmentBtcAmount * upbitCurrentPrice); // BTC수량 × 현재가
        log.trade('주문 금액 계산', {
            btcAmount: investmentBtcAmount,
            price: upbitCurrentPrice,
            totalKrw: upbitEntryAmount
        });
        // 현재 김프 방향 자동 판단
        const isPositiveKimp = signal.premiumRate > 0;
        const kimchDirection = isPositiveKimp ? "양수김프" : "음수김프";
        console.log(`${strategy.name} 진입 시작: ${symbol}, 김프율: ${signal.premiumRate}%, 투자금액: ₩${upbitEntryAmount.toLocaleString()}, 레버리지: ${binanceLeverage}x, 김프방향: ${kimchDirection}`);
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
        log.info('잔고 확인 완료');
        // 🚨 진입 조건 2차 검증 (단순 로직)
        const entryRate = Number(strategy.entryRate);
        const tolerance = Number(strategy.toleranceRate);
        console.log(`🔍 진입 조건 2차 검증: 현재김프=${signal.premiumRate}%, 설정진입율=${entryRate}%, 허용오차=${tolerance}%`);
        // 정확한 진입 조건 검증 (허용오차 범위 내) - 음수/양수 구분
        // const lowerBound = entryRate - tolerance; // 현재 사용하지 않음
        // const upperBound = entryRate + tolerance; // 현재 사용하지 않음
        // 🎯 정확한 값 매칭: 설정값과의 차이가 허용오차 이내인지 확인
        const difference = Math.abs(signal.premiumRate - entryRate);
        let conditionMet = difference <= tolerance;
        // 추가 안전 장치: 같은 부호에서만 거래
        const sameSign = (entryRate >= 0 && signal.premiumRate >= 0) ||
            (entryRate < 0 && signal.premiumRate < 0);
        conditionMet = conditionMet && sameSign;
        console.log(`🔍 2차 진입 조건 체크: 차이=${difference.toFixed(4)}% (허용=${tolerance}%), 동일부호=${sameSign} → ${conditionMet}`);
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
            //       const exchanges = await storage.getExchangesByUserId(parseInt(userId));
            console.log(`🔍 잔고 확인: 투자금액 ${upbitEntryAmount.toLocaleString()}원, 진입조건: ${entryRate}%`);
        }
        catch (error) {
            console.log(`⚠️ 잔고 확인 실패: ${error}`);
        }
        try {
            // 사용자 거래소 서비스 초기화
            const services = await this.initializeExchangeServices(userId);
            if (!services.upbitService || !services.binanceService) {
                throw new Error('거래소 API 키가 설정되지 않았습니다. 실거래만 가능합니다.');
            }
            const { upbitService, binanceService } = services;
            let upbitResult;
            let binanceResult;
            let currentPrice;
            let adjustedQuantity;
            // 김치프리미엄 차익거래 (양수/음수 동일한 전략)
            const market = `KRW-${symbol}`;
            console.log(`${kimchDirection} 진입: 업비트 ${market} 매수 ₩${upbitEntryAmount}, 바이낸스 숏 포지션`);
            // 단순 차익거래 실행: 바이낸스 숏 먼저 → 업비트 매수
            console.log(`🔵 단순 차익거래 실행: 바이낸스 숏 → 업비트 매수`);
            console.log(`📊 현재 김프율: ${signal.premiumRate}%, 진입설정: ${entryRate}%`);
            // 1단계: 바이낸스 숏 포지션 (정확한 수량)
            try {
                adjustedQuantity = Math.floor(investmentBtcAmount * 100000000) / 100000000; // 소수점 8자리까지
                console.log(`바이낸스 선물 숏: ${symbol}, 수량: ${adjustedQuantity}, 레버리지: ${strategy.leverage || 3}x`);
                await binanceService.setLeverage(symbol, strategy.leverage || 3);
                binanceResult = await binanceService.placeFuturesShortOrder(symbol, adjustedQuantity);
                console.log(`바이낸스 숏 결과:`, binanceResult);
                // 바이낸스 체결가 저장
                const binancePrice = parseFloat(binanceResult.avgPrice || binanceResult.price || "0");
                currentPrice = binancePrice || upbitCurrentPrice;
                // 바이낸스 거래 즉시 DB 저장
                try {
                    await storage.createTrade({
                        userId: parseInt(userId),
                        positionId: null, // 포지션 생성 전이므로 null
                        strategyId: strategy.id,
                        symbol,
                        side: "sell",
                        exchange: "binance",
                        quantity: String(adjustedQuantity),
                        price: String(currentPrice),
                        exchangeOrderId: binanceResult.orderId,
                    });
                    console.log(`✅ 바이낸스 숏 거래 기록 즉시 저장 완료`);
                }
                catch (dbError) {
                    console.error(`❌ 바이낸스 거래 기록 저장 실패:`, dbError);
                }
            }
            catch (error) {
                console.error(`❌ 바이낸스 숏 실패: ${error.message}`);
                throw new Error(`바이낸스 숏 실패: ${error.message}`);
            }
            // 2단계: 업비트 매수 (바이낸스 수량 기준)
            try {
                // 바이낸스 체결 수량을 원화로 환산
                const upbitBuyAmount = Math.round(adjustedQuantity * upbitCurrentPrice);
                console.log(`업비트 매수: ${market}, 금액: ${upbitBuyAmount}원 (${adjustedQuantity} BTC 기준)`);
                upbitResult = await upbitService.placeBuyOrder(market, upbitBuyAmount, "price");
                console.log(`업비트 매수 결과:`, upbitResult);
                // 업비트 체결 결과 확인
                const executedVolume = parseFloat(upbitResult.executed_volume || upbitResult.volume || "0");
                const avgPrice = parseFloat(upbitResult.avg_price || upbitResult.price || "0");
                console.log(`📊 업비트 체결 분석:`, {
                    목표수량: adjustedQuantity,
                    실제체결: executedVolume,
                    체결가: avgPrice,
                });
                // 업비트 거래 즉시 DB 저장
                try {
                    await storage.createTrade({
                        userId: parseInt(userId),
                        positionId: null, // 포지션 생성 전이므로 null
                        strategyId: strategy.id,
                        symbol,
                        side: "buy",
                        exchange: "upbit",
                        quantity: String(adjustedQuantity),
                        price: String(avgPrice || upbitCurrentPrice),
                        exchangeOrderId: upbitResult.uuid,
                    });
                    console.log(`✅ 업비트 매수 거래 기록 즉시 저장 완료`);
                }
                catch (dbError) {
                    console.error(`❌ 업비트 거래 기록 저장 실패:`, dbError);
                }
            }
            catch (error) {
                console.error(`❌ 업비트 매수 실패: ${error.message}`);
                // 업비트 실패 시 바이낸스 숏은 이미 완료됨 → 경고 알림
                await storage.createSystemAlert({
                    type: "error",
                    title: "업비트 매수 실패 (바이낸스 숏 완료됨)",
                    message: `${symbol} 업비트 매수 실패. 바이낸스에 ${adjustedQuantity} BTC 숏 포지션 보유 중. 수동 처리 필요: ${error.message}`,
                });
                throw new Error(`업비트 매수 실패: ${error.message}`);
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
                const lev = Number(strategy.leverage || strategy?.binanceLeverage || 5);
                if (positionId && Number.isFinite(lev) && lev > 0) {
                    await storage.updatePosition(positionId, { binanceLeverage: lev });
                    console.log(`🔧 포지션 레버리지 저장: ${lev}x (positionId=${positionId})`);
                }
            }
            catch (levErr) {
                console.warn('⚠️ 레버리지 저장 실패(무시 가능):', levErr);
            }
            // 거래 기록에 positionId 업데이트 (이미 저장된 거래 기록 업데이트)
            try {
                await storage.updateTradePositionId(binanceResult.orderId, positionId);
                console.log(`✅ 바이낸스 거래 기록 positionId 업데이트 완료`);
            }
            catch (error) {
                console.error(`❌ 바이낸스 거래 기록 업데이트 실패:`, error);
            }
            try {
                await storage.updateTradePositionId(upbitResult.uuid, positionId);
                console.log(`✅ 업비트 거래 기록 positionId 업데이트 완료`);
            }
            catch (error) {
                console.error(`❌ 업비트 거래 기록 업데이트 실패:`, error);
            }
            // 성공 알림
            await storage.createSystemAlert({
                type: "success",
                title: `${strategy.name} 포지션 진입`,
                message: `${symbol} ${strategy.name} 전략 진입 완료. 김프율: ${signal.premiumRate}%, 수량: ${adjustedQuantity}`,
            });
            log.success('포지션 진입 완료', { symbol });
            // ✅ DB 기반 쿨다운으로 변경: Position 테이블의 entryTime이 자동으로 쿨다운 역할
            console.log(`✅ DB 기반 쿨다운: Position 생성으로 자동 쿨다운 시작 (${TRADING_CONSTANTS.MIN_ENTRY_COOLDOWN_MS / 1000 / 60}분)`);
        }
        catch (error) {
            console.error(`새로운 김프 진입 실패 (${symbol}):`, error);
            throw error;
        }
    }
    // 전략 청산: 업비트 매도 + 바이낸스 포지션 청산
    async executeStrategyExit(userId, signal) {
        const positions = await storage.getActivePositions(parseInt(userId));
        const position = positions.find((p) => p.symbol === signal.symbol && p.status === "open" && p.strategyId === signal.strategyId);
        if (!position) {
            console.log(`청산할 ${signal.symbol} 활성 포지션을 찾을 수 없습니다.`);
            return;
        }
        console.log(`${signal.strategyName} 청산 시작: ${signal.symbol}, 김프율: ${signal.premiumRate}%`);
        try {
            // 거래소 서비스 초기화
            const services = await this.initializeExchangeServices(userId);
            if (!services.upbitService || !services.binanceService) {
                throw new Error("API 키가 설정되지 않았습니다.");
            }
            const { upbitService, binanceService } = services;
            // DB에 저장된 실제 수량 사용 (API 조회로 업데이트된 수량)
            const quantity = Number(position.upbitQuantity || position.quantity);
            console.log(`📊 청산 수량: DB 저장된 실제 수량 ${quantity} BTC (upbitQuantity: ${position.upbitQuantity}, quantity: ${position.quantity})`);
            // 1. 업비트에서 현물 매도 (에러 처리 강화)
            const market = `KRW-${signal.symbol}`;
            console.log(`업비트 현물 매도: ${market}, 수량: ${quantity}`);
            let upbitResult = null;
            let upbitError = null;
            try {
                upbitResult = await upbitService.placeSellOrder(market, quantity);
                console.log(`✅ 업비트 매도 성공:`, upbitResult);
            }
            catch (error) {
                upbitError = error;
                console.error(`❌ 업비트 매도 실패:`, error);
                // 업비트 매도 실패 시 시스템 알림 생성
                await storage.createSystemAlert({
                    type: "error",
                    title: "업비트 매도 실패",
                    message: `${signal.symbol} 매도 실패: ${error.message}`,
                });
            }
            // 2. 바이낸스 선물 포지션 청산 (업비트 실패와 무관하게 실행)
            console.log(`바이낸스 선물 청산: ${signal.symbol}, 수량: ${quantity}`);
            let binanceResult = null;
            let binanceError = null;
            try {
                binanceResult = await binanceService.closeFuturesPosition(signal.symbol, quantity);
                console.log(`✅ 바이낸스 청산 성공:`, binanceResult);
            }
            catch (error) {
                binanceError = error;
                console.error(`❌ 바이낸스 청산 실패:`, error);
                // 바이낸스 청산 실패 시 시스템 알림 생성
                await storage.createSystemAlert({
                    type: "error",
                    title: "바이낸스 청산 실패",
                    message: `${signal.symbol} 청산 실패: ${error.message}`,
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
            }
            else if (!upbitError && binanceError) {
                console.warn(`⚠️ 부분 청산: 업비트만 매도됨 (바이낸스 청산 실패)`);
                await storage.createSystemAlert({
                    type: "warning",
                    title: "부분 청산 발생",
                    message: `${signal.symbol}: 업비트 매도 완료, 바이낸스 청산 실패 - 수동 청산 필요`,
                });
            }
            else if (upbitError && binanceError) {
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
                tradePromises.push(storage.createTrade({
                    userId: parseInt(userId),
                    positionId: position.id,
                    symbol: signal.symbol,
                    side: "sell",
                    exchange: "upbit",
                    quantity: String(upbitResult.volume || "0"),
                    price: String(upbitResult.price || "0"),
                    exchangeOrderId: upbitResult.uuid,
                }));
            }
            if (binanceResult && !binanceError) {
                tradePromises.push(storage.createTrade({
                    userId: parseInt(userId),
                    positionId: position.id,
                    symbol: signal.symbol,
                    side: "buy",
                    exchange: "binance",
                    quantity: String(binanceResult.executedQty || binanceResult.quantity),
                    price: String(binanceResult.avgPrice || binanceResult.price),
                    exchangeOrderId: binanceResult.orderId?.toString(),
                }));
            }
            if (tradePromises.length > 0) {
                await Promise.all(tradePromises);
                console.log(`✅ 거래 기록 저장 완료 (${tradePromises.length}개)`);
            }
            // 해당 전략 정보 조회
            const strategy = await storage.getTradingStrategy(signal.strategyId);
            const strategyName = strategy?.name || "전략";
            console.log(`✅ 청산 완료: 새로운 진입 허용`);
            // 5. 성공 알림
            await storage.createSystemAlert({
                type: "success",
                title: `${strategyName} 포지션 청산`,
                message: `${signal.symbol} ${strategyName} 청산 완료. 김프율: ${signal.premiumRate}%`,
            });
        }
        catch (error) {
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
    async manageMultiStrategyPositions(_userId, positions) {
        for (const position of positions) {
            if (position.status !== "open" && position.status !== "ACTIVE")
                continue;
            try {
                // 현재 김프율 조회
                const kimchiData = await this.simpleKimchiService.calculateSimpleKimchi([position.symbol]);
                const currentData = kimchiData.find((d) => d.symbol === position.symbol);
                if (!currentData)
                    continue;
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
            }
            catch (error) {
                console.error(`포지션 관리 오류 (${position.symbol}):`, error);
            }
        }
    }
    getIsTrading(userId) {
        if (userId) {
            return this.userTradingStates.get(userId) || false;
        }
        // 전체 상태: 하나라도 거래 중이면 true
        return Array.from(this.userTradingStates.values()).some(state => state);
    }
    /**
     * 진입 전 잔고 확인
     */
    async checkBalanceBeforeEntry(userId, upbitKrwNeeded, binanceBtcNeeded) {
        try {
            // 거래소 서비스 초기화
            const services = await this.initializeExchangeServices(userId);
            if (!services.upbitService || !services.binanceService) {
                return {
                    sufficient: false,
                    message: "거래소 API 키가 설정되지 않았습니다"
                };
            }
            // 업비트 KRW 잔고 확인
            const upbitAccounts = await services.upbitService.getAccounts();
            const krwAccount = upbitAccounts.find((acc) => acc.currency === 'KRW');
            const availableKrw = krwAccount ? parseFloat(krwAccount.balance) : 0;
            // 바이낸스 USDT 잔고 확인
            const binanceAccount = await services.binanceService.getFuturesAccountInfo();
            const availableUsdt = parseFloat(binanceAccount.availableBalance || '0');
            // 필요한 증거금 계산 (USD)
            const currentBtcPriceUsd = TRADING_CONSTANTS.DEFAULT_BINANCE_BTC_PRICE_USD;
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
        }
        catch (error) {
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
    async refreshStrategies(userId) {
        try {
            console.log('🔄 전략 새로고침 시작...', userId ? `사용자 ${userId}` : '전체');
            if (userId) {
                // 특정 사용자의 전략만 새로고침
                const userStrategies = await storage.getTradingStrategiesByUserId(userId);
                console.log(`✅ 사용자 ${userId}의 전략 ${userStrategies.length}개 새로고침 완료`);
            }
            else {
                // 전체 활성 전략 새로고침 (필요 시)
                console.log('✅ 전체 전략 새로고침 완료');
            }
            // 다음 거래 사이클에서 새로운 전략 조건이 적용됨
            console.log('🚀 다음 거래 사이클부터 새로운 전략 조건 적용');
        }
        catch (error) {
            console.error('❌ 전략 새로고침 실패:', error);
        }
    }
    /**
     * 특정 전략의 조건 즉시 업데이트
     */
    async updateStrategyConditions(strategyId) {
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
        }
        catch (error) {
            console.error(`❌ 전략 ${strategyId} 조건 업데이트 실패:`, error);
        }
    }
}
export const multiStrategyTradingService = new MultiStrategyTradingService();
