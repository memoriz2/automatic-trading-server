import { SimpleKimchiService } from "./simple-kimchi.js";
import { storage } from "../storage.js";
import { ExchangeServiceFactory } from './exchange-factory.js';
import { TRADING_CONSTANTS } from '../types/constants.js';
import { log } from '../utils/logger.js';
import { calculateUpbitFee, calculateBinanceFee } from '../utils/fee-calculator.js';
export class MultiStrategyTradingService {
    // 인스턴스 변수
    simpleKimchiService;
    userTradingStates = new Map();
    lastKimchiRates = new Map();
    activeStrategies = new Map();
    userStrategies = new Map();
    // 웹소켓 이벤트 쓰로틀링을 위한 마지막 체크 시간
    lastCheckTimes = new Map();
    // 🔒 신호 분석 실행 중 플래그: 사용자별 신호 분석 중복 실행 방지
    isCheckingSignals = new Map();
    // 🔒 진입 Lock: 동시에 여러 진입 시도 방지 (strategyId -> 진행중 여부)
    entryLocks = new Map();
    // 🔒🔒 글로벌 쿨다운 Lock: 사용자별 마지막 거래 시간 추적 (userId -> 마지막 거래 타임스탬프)
    userLastTradeTimes = new Map();
    constructor() {
        this.simpleKimchiService = new SimpleKimchiService();
    }
    // 거래소 서비스 초기화 (중복 코드 제거)
    async initializeExchangeServices(userId) {
        const userIdNum = parseInt(userId);
        const exchanges = await storage.getExchangesByUserId(userIdNum);
        const upbitExchange = exchanges.find((e) => e.exchange === 'upbit' && e.is_active);
        const binanceExchange = exchanges.find((e) => e.exchange === 'binance' && e.is_active);
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
        const activeStrategies = strategies.filter((s) => s.is_active);
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
        // 누락된 포지션 복구 (백그라운드)
        this.recoverMissingPositions(parseInt(userId)).catch((error) => {
            console.error(`❌ 포지션 복구 실패:`, error);
        });
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
    /**
     * 신호 확인 및 실행 (웹소켓 이벤트 또는 폴백용)
     * 쓰로틀링: 1초 이내 중복 실행 방지
     */
    async checkAndExecuteSignals(userId) {
        // 🔒🔒 실행 중 플래그 체크: 이미 실행 중이면 즉시 차단
        if (this.isCheckingSignals.get(userId)) {
            return;
        }
        // 🛡️ 쓰로틀링: 1초 이내 중복 실행 방지
        const lastCheckTime = this.lastCheckTimes.get(userId) || 0;
        const now = Date.now();
        if (now - lastCheckTime < 1000) {
            return; // 1초 쿨다운
        }
        // 🔒 실행 중 플래그 설정
        this.isCheckingSignals.set(userId, true);
        this.lastCheckTimes.set(userId, now);
        try {
            // BTC 김프율만 확인 (단일 포지션)
            const symbols = ["BTC"];
            const kimchiData = await this.simpleKimchiService.calculateSimpleKimchi(symbols, userId);
            // 활성 포지션 조회
            let activePositions = await storage.getActivePositions(parseInt(userId));
            // BTC 단일 전략 신호 분석 (사용자별 전략 사용)
            const userStrategyMap = this.userStrategies.get(userId);
            if (!userStrategyMap)
                return;
            // 📊 모든 전략의 신호를 먼저 수집 (배치 처리)
            const signals = [];
            for (const [_strategyId, strategy] of Array.from(userStrategyMap)) {
                // BTC 데이터만 처리
                const btcData = kimchiData.find((d) => d.symbol === "BTC");
                if (!btcData)
                    continue;
                // 현재 김프율 저장
                this.lastKimchiRates.set("BTC", btcData.premiumRate);
                // 🔍 해당 전략의 활성 포지션만 필터링하여 신호 분석
                const strategyActivePositions = activePositions.filter((p) => p.strategy_id === strategy.id && p.status === "open");
                const signal = await this.analyzeStrategySignal(btcData, strategy, strategyActivePositions);
                if (signal) {
                    signals.push(signal);
                }
            }
            // 🚀 수집한 신호들을 한 번에 실행
            for (const signal of signals) {
                await this.executeStrategySignal(userId, signal);
            }
            // 🔄 신호가 있었다면 마지막에 1번만 재조회
            if (signals.length > 0) {
                activePositions = await storage.getActivePositions(parseInt(userId));
                console.log(`🔄 ${signals.length}개 신호 실행 후 활성 포지션 재조회: ${activePositions.length}개`);
            }
            // 기존 포지션 관리 (최신 활성 포지션 사용)
            await this.manageMultiStrategyPositions(userId, activePositions);
        }
        catch (error) {
            console.error(`❌ [checkAndExecuteSignals] 사용자 ${userId} 오류:`, error);
            await storage.createSystemAlert({
                type: "error",
                title: "신호 확인 오류",
                message: `신호 확인 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
        finally {
            // 🔓 실행 중 플래그 해제 (성공/실패 관계없이)
            this.isCheckingSignals.delete(userId);
        }
    }
    /**
     * 웹소켓 이벤트 기반 자동매매 시작
     */
    async startEventDrivenTrading(userId) {
        console.log(`🎯 [사용자 ${userId}] 웹소켓 이벤트 기반 자동매매 시작`);
        // 웹소켓 서비스 동적 import
        const { binanceWebSocket } = await import('./binance-websocket.js');
        const { upbitWebSocket } = await import('./upbit-websocket.js');
        // 🎯 바이낸스 가격 변화 시 자동 실행
        const binanceCallbackId = `trading-binance-${userId}`;
        binanceWebSocket.onData(binanceCallbackId, async (data) => {
            if (data.s !== 'BTCUSDT')
                return; // BTC만 처리
            // console.log(`💰 [사용자 ${userId}] 바이낸스 BTC 가격 변화: $${data.p}`);
            await this.checkAndExecuteSignals(userId);
        });
        // 🎯 업비트 가격 변화 시 자동 실행
        const upbitCallbackId = `trading-upbit-${userId}`;
        upbitWebSocket.onData(upbitCallbackId, async (data) => {
            if (data.cd !== 'KRW-BTC')
                return; // BTC만 처리
            // console.log(`💰 [사용자 ${userId}] 업비트 BTC 가격 변화: ₩${data.trade_price?.toLocaleString()}`);
            await this.checkAndExecuteSignals(userId);
        });
        // 🔔 웹소켓 구독 (이미 구독되어 있을 수 있으므로 중복 구독 방지는 웹소켓 서비스에서 처리)
        upbitWebSocket.subscribe(['KRW-BTC']);
        console.log(`✅ [사용자 ${userId}] 웹소켓 이벤트 핸들러 등록 완료`);
        // 🔄 폴백: 30초마다 한 번씩 강제 체크 (웹소켓 실패 대비)
        while (this.userTradingStates.get(userId)) {
            await new Promise((resolve) => setTimeout(resolve, 30000)); // 30초 대기
            if (this.userTradingStates.get(userId)) {
                console.log(`🔄 [사용자 ${userId}] 폴백 체크 (30초마다)`);
                await this.checkAndExecuteSignals(userId);
            }
        }
        // 정리: 콜백 제거
        binanceWebSocket.removeCallback(binanceCallbackId);
        upbitWebSocket.removeCallback(upbitCallbackId);
        console.log(`🛑 [사용자 ${userId}] 웹소켓 이벤트 핸들러 제거 완료`);
    }
    async multiStrategyTradingLoop(userId) {
        // 웹소켓 이벤트 기반으로 전환
        await this.startEventDrivenTrading(userId);
    }
    // 전략 신호 실행
    async executeStrategySignal(userId, signal) {
        try {
            if (signal.action === "entry") {
                await this.executeStrategyEntry(userId, signal);
                console.log(`✅ [자동매매 진입 완료] 사용자 ${userId} 진입 성공 (메모리 기록됨)`);
            }
            else if (signal.action === "exit") {
                await this.executeStrategyExit(userId, signal);
                console.log(`✅ [자동매매 청산 완료] 사용자 ${userId} 청산 성공 (메모리 기록됨)`);
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
    async analyzeStrategySignal(kimchiData, strategy, activePositions) {
        const premiumRate = kimchiData.premiumRate;
        // const symbol = "BTC"; // BTC 고정 - 현재 사용하지 않음
        // BTC 활성 포지션 확인 (해당 전략의 포지션만)
        const existingPosition = activePositions.find((p) => p.symbol === "BTC" && p.status === "open" && p.strategy_id === strategy.id);
        // 사용자 설정 값
        const entryRate = Number(strategy.entry_rate);
        const exitRate = Number(strategy.exit_rate);
        const tolerance = Number(strategy.tolerance_rate || strategy.tolerance);
        console.log(`🔍 [서버] BTC 자동매매 체크 - 전략 #${strategy.id}: 현재김프=${premiumRate}%, 진입율=${entryRate}%, 청산율=${exitRate}%, 허용오차=${tolerance}%`);
        console.log(`🔍 [서버] 포지션 확인: existingPosition=${existingPosition ? 'O' : 'X'}`);
        // 🔒🔒🔒 전체 쿨다운 가드: 진입/청산 모두 쿨다운 체크 (맨 앞에 배치)
        const strategyUserId = strategy.user_id || strategy.userId;
        console.log(`🚨🚨🚨 [자동매매 쿨다운] 전략 ${strategy.id} 체크 실행 - 코드 버전: 2025-11-01-v6`);
        const cooldownMs = TRADING_CONSTANTS.MIN_ENTRY_COOLDOWN_MS;
        console.log(`🚨 [자동매매 쿨다운] 설정값: ${cooldownMs}ms = ${cooldownMs / 1000}초 (수동 거래는 무시)`);
        // 🔥 1단계: 메모리 기반 즉시 차단 (DB 조회 전)
        const userIdStr = String(strategyUserId);
        const lastTradeTime = this.userLastTradeTimes.get(userIdStr);
        if (lastTradeTime) {
            const elapsedMs = Date.now() - lastTradeTime;
            if (elapsedMs < cooldownMs) {
                const remainSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
                console.log(`🔒🔥 [자동매매 메모리 차단] 마지막 자동매매로부터 ${remainSec}초 남음 (전략 ${strategy.id})`);
                console.log(`   경과 시간: ${(elapsedMs / 1000).toFixed(1)}초 / 필요: ${cooldownMs / 1000}초`);
                return null; // 🚫 거래소 API 호출 전에 즉시 차단
            }
            else {
                console.log(`✅ [자동매매 메모리 통과] 마지막 자동매매로부터 ${(elapsedMs / 1000).toFixed(1)}초 경과`);
            }
        }
        else {
            console.log(`✅ [자동매매 메모리 통과] 최초 거래 또는 메모리에 기록 없음`);
        }
        // 🔥 2단계: DB 기반 이중 검증 (메모리와 동기화)
        try {
            // trades 테이블에서 가장 최근 자동매매 거래 확인 (수동 거래 제외)
            const recentTradeResult = await storage.pool.query(`
        SELECT
          MAX(executed_at) as last_trade_time,
          EXTRACT(EPOCH FROM (NOW() - MAX(executed_at))) * 1000 as elapsed_ms
        FROM trades
        WHERE user_id = $1
          AND side IN ('buy', 'short', 'sell', 'cover')
          AND strategy_id IS NOT NULL
          AND executed_at > NOW() - INTERVAL '10 minutes'
      `, [strategyUserId]);
            if (recentTradeResult.rows[0]?.last_trade_time) {
                const dbLastTradeTime = new Date(recentTradeResult.rows[0].last_trade_time).getTime();
                const elapsedMs = parseFloat(recentTradeResult.rows[0].elapsed_ms);
                // 🔄 메모리와 DB 동기화 (DB가 더 최신이면 메모리 업데이트)
                if (!lastTradeTime || dbLastTradeTime > lastTradeTime) {
                    console.log(`🔄 [자동매매 메모리 동기화] DB 자동매매 시간으로 갱신: ${new Date(dbLastTradeTime).toLocaleString('ko-KR')}`);
                    this.userLastTradeTimes.set(userIdStr, dbLastTradeTime);
                }
                if (elapsedMs < cooldownMs) {
                    const remainSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
                    console.log(`🔒 [자동매매 DB 차단] 마지막 자동매매로부터 ${remainSec}초 남음 (전략 ${strategy.id})`);
                    console.log(`   최근 자동매매 시간: ${recentTradeResult.rows[0].last_trade_time}`);
                    console.log(`   경과 시간: ${(elapsedMs / 1000).toFixed(1)}초 / 필요: ${cooldownMs / 1000}초`);
                    return null; // 🚫 쿨다운 중에는 진입/청산 모두 차단
                }
                else {
                    console.log(`✅ [자동매매 DB 통과] 마지막 자동매매로부터 ${(elapsedMs / 1000).toFixed(1)}초 경과 (필요: ${cooldownMs / 1000}초)`);
                }
            }
            else {
                console.log(`✅ [자동매매 DB 통과] 최근 10분 내 자동매매 없음 (수동 거래는 무시됨)`);
            }
        }
        catch (cooldownError) {
            console.error('❌ 자동매매 DB 쿨다운 체크 실패:', cooldownError);
        }
        // 진입 조건 체크 (해당 전략의 포지션이 없을 때만)
        if (!existingPosition) {
            // 🔒 진입 신호 생성 전 Lock 체크 (중복 신호 방지)
            if (this.entryLocks.get(strategy.id)) {
                console.log(`🔒 [전략 ${strategy.id}] 이미 진입 진행 중, 신호 생성 스킵`);
                return null;
            }
            // 🔧 포지션이 없는데 거래 기록이 있으면 먼저 복구 시도
            const strategyUserId = strategy.user_id || strategy.userId;
            try {
                const orphanTradesCheck = await storage.pool.query(`
          SELECT COUNT(*) as count
          FROM trades
          WHERE user_id = $1
            AND strategy_id = $2
            AND position_id IS NULL
            AND executed_at > NOW() - INTERVAL '10 minutes'
            AND side IN ('buy', 'short')
        `, [strategyUserId, strategy.id]);
                const orphanCount = parseInt(orphanTradesCheck.rows[0]?.count || '0');
                if (orphanCount > 0) {
                    console.log(`🔧 [포지션 복구] 전략 ${strategy.id}에 대한 ${orphanCount}개의 고아 거래 발견, 복구 시도...`);
                    await this.recoverMissingPositions(strategyUserId);
                    // 복구 후 다시 포지션 확인 (사용자별)
                    const recoveredPosition = await storage.getActivePositionByStrategy(strategy.id, 'BTC', strategyUserId);
                    if (recoveredPosition) {
                        console.log(`✅ [포지션 복구] 포지션 ${recoveredPosition.id} 복구 완료, 사용자 ${strategyUserId} 진입 스킵`);
                        return null;
                    }
                }
            }
            catch (recoveryError) {
                console.error('❌ [포지션 복구] 체크 실패:', recoveryError);
            }
            // 🎯 정확한 값 매칭: 설정값과의 차이가 허용오차 이내인지 확인
            const entryDifference = Math.abs(premiumRate - entryRate);
            const sameSign = (entryRate >= 0 && premiumRate >= 0) ||
                (entryRate < 0 && premiumRate < 0);
            const shouldEnterBtc = entryDifference <= tolerance && sameSign;
            console.log(`🔍 진입 조건 체크: 차이=${entryDifference.toFixed(4)}% (허용=${tolerance}%), 동일부호=${sameSign} → ${shouldEnterBtc}`);
            if (shouldEnterBtc) {
                // 🔒 진입 신호 생성 시 즉시 Lock 설정 (다른 신호 생성 차단)
                if (this.entryLocks.get(strategy.id)) {
                    console.log(`🔒 [전략 ${strategy.id}] 신호 생성 중 Lock 발견, 중복 신호 차단`);
                    return null;
                }
                this.entryLocks.set(strategy.id, true);
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
        // 🔒🔒 이중 안전장치: 거래소 매매 직전 쿨다운 재확인
        const cooldownMs = TRADING_CONSTANTS.MIN_ENTRY_COOLDOWN_MS;
        const lastTradeTime = this.userLastTradeTimes.get(userId);
        if (lastTradeTime) {
            const elapsedMs = Date.now() - lastTradeTime;
            if (elapsedMs < cooldownMs) {
                const remainSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
                console.log(`🚫🚫 [거래소 매매 차단] 진입 함수 진입 시점에도 쿨다운 ${remainSec}초 남음 - 거래소 API 호출 차단!`);
                throw new Error(`쿨다운 ${remainSec}초 남음 - 거래소 매매 차단됨`);
            }
            console.log(`✅ [거래소 매매 허용] 쿨다운 ${(elapsedMs / 1000).toFixed(1)}초 경과 - 진입 거래 진행`);
        }
        // 해당 전략 정보 조회
        const strategy = await storage.getTradingStrategy(signal.strategyId);
        if (!strategy) {
            throw new Error(`전략을 찾을 수 없습니다: ${signal.strategyId}`);
        }
        const investmentBtcAmount = Number(strategy.investment_amount); // BTC 수량
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
            console.log(`❌ 잔고 부족으로 진입 스킵: ${balanceCheck.message}`);
            // ⚠️ 전략은 비활성화하지 않음 (사용자가 직접 관리)
            // 단순히 경고만 하고 진입은 스킵
            await storage.createSystemAlert({
                type: "warning",
                title: "잔고 부족으로 진입 스킵",
                message: `${strategy.name} 진입 스킵: ${balanceCheck.message}`,
            });
            console.log(`⏭️ 전략 "${strategy.name}" (ID: ${signal.strategyId}) 잔고 부족으로 진입 스킵`);
            return; // 진입 취소
        }
        log.info('잔고 확인 완료');
        // 🚨 진입 조건 2차 검증 (실시간 김프율 재조회)
        const entryRate = Number(strategy.entry_rate);
        const tolerance = Number(strategy.tolerance_rate || strategy.tolerance);
        // 🔥 실시간 김프율 재조회 (신호 생성 시점과 다를 수 있음)
        const currentKimchiData = await this.simpleKimchiService.calculateSimpleKimchi(['BTC'], userId);
        const currentPremiumRate = currentKimchiData.find(d => d.symbol === 'BTC')?.premiumRate || signal.premiumRate;
        console.log(`🔍 진입 조건 2차 검증: 실시간김프=${currentPremiumRate.toFixed(4)}% (신호생성시=${signal.premiumRate.toFixed(4)}%), 설정진입율=${entryRate}%, 허용오차=${tolerance}%`);
        // 🎯 정확한 값 매칭: 설정값과의 차이가 허용오차 이내인지 확인 (실시간 김프율 사용)
        const difference = Math.abs(currentPremiumRate - entryRate);
        let conditionMet = difference <= tolerance;
        // 추가 안전 장치: 같은 부호에서만 거래
        const sameSign = (entryRate >= 0 && currentPremiumRate >= 0) ||
            (entryRate < 0 && currentPremiumRate < 0);
        conditionMet = conditionMet && sameSign;
        console.log(`🔍 2차 진입 조건 체크: 차이=${difference.toFixed(4)}% (허용=${tolerance}%), 동일부호=${sameSign} → ${conditionMet}`);
        if (!conditionMet) {
            const errorMsg = `🚨 진입 조건 미충족! 실시간김프=${currentPremiumRate.toFixed(4)}% (신호시=${signal.premiumRate.toFixed(4)}%), 설정진입율=${entryRate}% - 조건 불만족`;
            console.log(errorMsg);
            await storage.createSystemAlert({
                type: "warning",
                title: "자동매매 진입 조건 미충족",
                message: errorMsg,
            });
            throw new Error(errorMsg);
        }
        // 🔒 진입 Lock 체크: 신호 생성 시 이미 설정되어 있어야 함
        if (!this.entryLocks.get(strategy.id)) {
            console.warn(`⚠️ [전략 ${strategy.id}] Lock이 없습니다! 신호 생성 단계에서 설정되어야 합니다.`);
            // 방어적으로 Lock 설정
            this.entryLocks.set(strategy.id, true);
        }
        console.log(`🔒 [전략 ${strategy.id}] 진입 실행 시작 (Lock 확인됨)`);
        // 🔒 임시 포지션 ID (거래 시작 전 DB에 예약)
        let reservedPositionId = null;
        try {
            // 🔒🔒 DB 레벨 중복 체크: 사용자별로 Lock 후 실제 DB 상태 확인 (이중 안전장치)
            const existingPosition = await storage.getActivePositionByStrategy(strategy.id, symbol, parseInt(userId));
            if (existingPosition) {
                console.error(`🚨 [전략 ${strategy.id}] DB에 이미 활성 포지션 존재! ID=${existingPosition.id}, 사용자=${userId}`);
                await storage.createSystemAlert({
                    type: "error",
                    title: "중복 포지션 차단",
                    message: `전략 ${strategy.name}에 이미 활성 포지션이 있어 새로운 진입을 차단했습니다. (사용자: ${userId})`,
                });
                throw new Error(`전략 ${strategy.id}에 사용자 ${userId}의 활성 포지션이 이미 존재 (ID: ${existingPosition.id})`);
            }
            console.log(`✅ [전략 ${strategy.id}] DB 중복 체크 통과 - 사용자 ${userId}의 활성 포지션 없음`);
            // 🔒 즉시 임시 포지션 생성하여 다른 요청 차단 (Race Condition 방지)
            const tempPosition = await storage.pool.query(`
        INSERT INTO positions (
          user_id, strategy_id, symbol, type, side, status,
          entry_price, quantity, binance_quantity, remaining_quantity,
          entry_premium_rate, current_premium_rate, unrealized_pnl,
          entry_time, binance_leverage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)
        RETURNING id
      `, [
                parseInt(userId), strategy.id, symbol, 'auto', 'short', 'pending',
                '0', '0', '0', '0', String(signal.premiumRate), String(signal.premiumRate), '0',
                strategy.leverage || 5
            ]);
            reservedPositionId = tempPosition.rows[0].id;
            console.log(`🔒 [전략 ${strategy.id}] 임시 포지션 예약 완료 (ID: ${reservedPositionId})`);
            // 🚨 잔고 검증 추가
            console.log(`🔍 잔고 확인: 투자금액 ${upbitEntryAmount.toLocaleString()}원, 진입조건: ${entryRate}%`);
        }
        catch (error) {
            // Lock 해제 후 에러 재발생
            this.entryLocks.delete(strategy.id);
            console.log(`🔓 [전략 ${strategy.id}] 진입 Lock 해제 (DB 중복 체크 실패)`);
            // 임시 포지션 삭제
            if (reservedPositionId) {
                await storage.pool.query('DELETE FROM positions WHERE id = $1', [reservedPositionId]);
            }
            throw error;
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
            let upbitEntryPrice; // 업비트 진입가 변수 추가 (총액 KRW)
            let binanceTotalFunds = 0; // 바이낸스 총 진입금액 (총액 USD)
            let binancePaidFee; // 바이낸스 실제 수수료
            let paidFee; // 업비트 실제 수수료
            let executedVolume = 0; // 업비트 체결 수량 (BTC)
            let totalFunds = 0; // 업비트 체결 총액 (KRW)
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
                // 🔧 주문 체결 대기 후 상세 정보 조회
                console.log(`⏳ 바이낸스 주문 체결 대기 중... (2초)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                // 주문 상세 조회
                const orderDetail = await binanceService.getFuturesOrderDetail(symbol, binanceResult.orderId);
                console.log(`📊 바이낸스 주문 상세:`, orderDetail);
                // 🔧 바이낸스 체결 정보 집계 (1:n 거래 대비)
                let totalQuoteQty = 0; // 총 체결금액 (USD)
                let totalQty = 0; // 총 체결수량 (BTC)
                let totalCommission = 0; // 총 수수료 (USDT)
                // 주문 상세에서 정보 추출
                const detailResult = orderDetail || binanceResult;
                // trades 배열에서 총 체결금액과 총 체결수량 계산
                if (detailResult.trades && Array.isArray(detailResult.trades) && detailResult.trades.length > 0) {
                    for (const trade of detailResult.trades) {
                        totalQuoteQty += parseFloat(trade.quoteQty || "0"); // 총 체결금액 (USD)
                        totalQty += parseFloat(trade.qty || "0"); // 총 체결수량 (BTC)
                        totalCommission += parseFloat(trade.commission || "0"); // 총 수수료 (USDT)
                    }
                    console.log(`💡 바이낸스 trades 배열 집계: 총금액=$${totalQuoteQty.toFixed(2)}, 총수량=${totalQty} BTC, 총수수료=$${totalCommission.toFixed(6)}`);
                }
                else {
                    // trades 배열이 없으면 최상위 필드 사용 (fallback)
                    totalQty = parseFloat(detailResult.executedQty || detailResult.origQty || String(adjustedQuantity));
                    totalQuoteQty = parseFloat(detailResult.cumQuote || "0");
                    totalCommission = parseFloat(detailResult.commission || "0");
                    // cumQuote가 없으면 avgPrice로 계산
                    if (totalQuoteQty === 0) {
                        const avgPrice = parseFloat(detailResult.avgPrice || detailResult.price || "0");
                        totalQuoteQty = avgPrice * totalQty;
                    }
                    console.warn(`⚠️ 바이낸스 trades 배열 없음, 최상위 필드 사용: 총금액=$${totalQuoteQty.toFixed(2)}, 총수량=${totalQty} BTC`);
                }
                // 평균 체결가 계산 (단가)
                const binancePrice = totalQty > 0 ? totalQuoteQty / totalQty : parseFloat(detailResult.avgPrice || "0");
                if (!binancePrice || binancePrice === 0) {
                    console.warn(`⚠️ 바이낸스 체결가가 0입니다. trades 테이블에서 자동 수정됩니다: ${binancePrice}`);
                }
                currentPrice = binancePrice;
                // 바이낸스 총 체결금액 저장 (USD)
                binanceTotalFunds = totalQuoteQty;
                // 바이낸스 수수료 (trades 배열에서 집계한 총 수수료 사용)
                binancePaidFee = totalCommission;
                console.log(`💰 바이낸스 실제 수수료 (trades 배열 집계): ${binancePaidFee} USDT`);
                // 바이낸스 수수료 계산 (API에서 받은 값 우선 사용)
                const binanceFee = calculateBinanceFee(totalQty, binancePrice, binancePaidFee);
                // 바이낸스 거래 즉시 DB 저장 (단가로 저장)
                try {
                    await storage.createTrade({
                        userId: parseInt(userId),
                        positionId: null, // 포지션 생성 전이므로 null
                        strategyId: strategy.id,
                        symbol,
                        side: "sell",
                        exchange: "binance",
                        quantity: String(totalQty), // 총 체결수량 (trades 배열 집계)
                        price: String(binancePrice), // USD 단가 (총액 / 수량)
                        fee: binanceFee, // USDT 단위 수수료
                        exchangeOrderId: binanceResult.orderId,
                    });
                    console.log(`✅ 바이낸스 숏 거래 기록 즉시 저장 완료 (단가: $${binancePrice.toFixed(2)}, 총액: $${binanceTotalFunds.toFixed(2)}, 수량: ${totalQty} BTC, 수수료: $${binanceFee.toFixed(4)})`);
                }
                catch (dbError) {
                    console.error(`❌ 바이낸스 거래 기록 저장 실패:`, dbError);
                }
            }
            catch (error) {
                console.error(`❌ 바이낸스 숏 실패: ${error.message}`);
                throw new Error(`바이낸스 숏 실패: ${error.message}`);
            }
            // 2단계: 업비트 매수 (바이낸스 체결 금액을 실시간 환율로 환산)
            try {
                // 실시간 USDT/KRW 환율 조회 (업비트 공개 API)
                const { UpbitAdapter } = await import('../adapters/UpbitAdapter.js');
                const upbitAdapter = new UpbitAdapter();
                const usdtKrwRate = await upbitAdapter.getCurrentPrice('USDT');
                console.log(`💱 실시간 USDT/KRW 환율: ${usdtKrwRate}원`);
                // 바이낸스 체결 금액(USDT) 계산
                const binanceUsdtAmount = adjustedQuantity * currentPrice;
                console.log(`📊 바이낸스 체결 금액: $${binanceUsdtAmount.toFixed(2)} USDT`);
                // USDT를 원화로 환산
                const upbitBuyAmount = Math.round(binanceUsdtAmount * usdtKrwRate);
                console.log(`💰 업비트 매수 금액 계산:`);
                console.log(`  - 바이낸스 체결: ${adjustedQuantity} BTC × $${currentPrice} = $${binanceUsdtAmount.toFixed(2)}`);
                console.log(`  - 환율 적용: $${binanceUsdtAmount.toFixed(2)} × ${usdtKrwRate}원 = ₩${upbitBuyAmount.toLocaleString()}`);
                console.log(`업비트 매수: ${market}, 금액: ${upbitBuyAmount}원 (환율 반영)`);
                upbitResult = await upbitService.placeBuyOrder(market, upbitBuyAmount, "price");
                // 🔍 업비트 주문 응답 전체 로그 (디버깅용)
                console.log(`🔍 [자동거래 업비트 주문 응답 전체]:`, JSON.stringify(upbitResult, null, 2));
                console.log(`업비트 매수 결과:`, upbitResult);
                // 업비트 체결 결과 확인 (변수는 이미 외부 스코프에 선언됨)
                paidFee = upbitResult.paid_fee ? parseFloat(upbitResult.paid_fee) : undefined;
                // 🔧 시장가 주문은 즉시 체결되므로 재시도하며 주문 상세 조회
                if (upbitResult.uuid) {
                    let orderDetail = null;
                    let detailSuccess = false;
                    // 최대 5번 재시도 (1초, 2초, 3초, 4초, 5초 대기)
                    for (let retry = 1; retry <= 5; retry++) {
                        try {
                            console.log(`⏳ [시도 ${retry}/5] 체결 확인을 위해 ${retry}초 대기 후 주문 상세 조회...`);
                            await new Promise(resolve => setTimeout(resolve, retry * 1000));
                            orderDetail = await upbitService.getOrderDetail(upbitResult.uuid);
                            console.log(`🔍 주문 상세 조회 결과:`, JSON.stringify(orderDetail, null, 2));
                            // paid_fee가 있는지 확인
                            const hasPaidFee = orderDetail.paid_fee && parseFloat(orderDetail.paid_fee) > 0;
                            const hasTrades = orderDetail.trades && Array.isArray(orderDetail.trades) && orderDetail.trades.length > 0;
                            if (hasPaidFee || hasTrades) {
                                console.log(`✅ [시도 ${retry}/5] 주문 상세 조회 성공 (paid_fee: ${orderDetail.paid_fee})`);
                                detailSuccess = true;
                                break;
                            }
                            else {
                                console.warn(`⚠️ [시도 ${retry}/5] paid_fee가 없음, 재시도...`);
                            }
                        }
                        catch (detailError) {
                            console.error(`❌ [시도 ${retry}/5] 업비트 주문 상세 조회 실패:`, detailError);
                            if (retry === 5) {
                                console.error(`🚨 5번 재시도 모두 실패 - 초기 응답 데이터 사용`);
                            }
                        }
                    }
                    if (detailSuccess && orderDetail) {
                        paidFee = orderDetail.paid_fee ? parseFloat(orderDetail.paid_fee) : undefined;
                        // 🔧 trades 배열에서 총 체결금액과 총 체결수량 계산
                        if (orderDetail.trades && Array.isArray(orderDetail.trades) && orderDetail.trades.length > 0) {
                            for (const trade of orderDetail.trades) {
                                totalFunds += parseFloat(trade.funds || "0"); // 총 체결금액 (KRW)
                                executedVolume += parseFloat(trade.volume || "0"); // 총 체결수량 (BTC)
                            }
                            console.log(`💡 trades 배열 집계: 총금액=${totalFunds.toLocaleString()}원, 총수량=${executedVolume} BTC`);
                        }
                        else {
                            // trades 배열이 없으면 기본 필드 사용 (fallback)
                            executedVolume = parseFloat(orderDetail.executed_volume || orderDetail.volume || "0");
                            totalFunds = parseFloat(orderDetail.price || "0");
                            console.warn(`⚠️ trades 배열 없음, 기본 필드 사용: volume=${executedVolume}, price=${totalFunds}`);
                        }
                    }
                    else {
                        // 🚨 재시도 모두 실패 - 초기 응답 데이터 사용
                        console.log(`⚠️ 초기 응답 데이터로 fallback - executed_volume: ${upbitResult.executed_volume}, price: ${upbitResult.price}`);
                        executedVolume = parseFloat(upbitResult.executed_volume || upbitResult.volume || "0");
                        totalFunds = parseFloat(upbitResult.price || "0");
                        // paidFee는 이미 line 739에서 초기 응답에서 가져왔으므로 유지
                    }
                }
                // 업비트 총 진입금액 저장 (총액)
                upbitEntryPrice = totalFunds;
                console.log(`📊 업비트 체결 분석:`, {
                    목표수량: adjustedQuantity,
                    실제체결수량: executedVolume,
                    총체결금액: totalFunds,
                    실제수수료: paidFee,
                    업비트총진입금액: upbitEntryPrice
                });
                // 업비트 수수료 계산 (중앙화된 로직 사용, API 응답의 paid_fee 우선)
                const avgPriceForFee = executedVolume > 0 ? totalFunds / executedVolume : 0;
                const upbitFee = calculateUpbitFee(executedVolume, avgPriceForFee, paidFee);
                // 업비트 단가 계산 (총액 / 수량)
                const upbitUnitPrice = executedVolume > 0 ? Math.round(totalFunds / executedVolume) : 0;
                // 업비트 거래 즉시 DB 저장 (단가로 저장 - 바이낸스와 일관성 유지)
                try {
                    await storage.createTrade({
                        userId: parseInt(userId),
                        positionId: null, // 포지션 생성 전이므로 null
                        strategyId: strategy.id,
                        symbol,
                        side: "buy",
                        exchange: "upbit",
                        quantity: String(executedVolume), // 총 체결수량
                        price: String(upbitUnitPrice), // ✅ 단가 (KRW per BTC)
                        fee: upbitFee, // KRW 단위 수수료
                        exchangeOrderId: upbitResult.uuid,
                    });
                    console.log(`✅ 업비트 매수 거래 기록 즉시 저장 완료 (단가: ₩${upbitUnitPrice.toLocaleString()}/BTC, 총액: ₩${totalFunds.toLocaleString()}, 수량: ${executedVolume} BTC, 수수료: ₩${upbitFee.toLocaleString()})`);
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
            // 포지션 생성 - 진입가 명시적 저장 (전체를 try-catch로 보호)
            let position = null;
            try {
                const entryTimeKST = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST 시간
                // 진입가 경고 (0이면 백그라운드에서 수정 예정)
                const needsEntryPriceFix = (!upbitEntryPrice || upbitEntryPrice === 0) || (!currentPrice || currentPrice === 0);
                if (needsEntryPriceFix) {
                    console.warn(`⚠️ 진입가가 0입니다. 백그라운드에서 trades 테이블 조회 후 자동 수정 예정:`, {
                        업비트진입가: upbitEntryPrice,
                        바이낸스진입가: currentPrice
                    });
                }
                else {
                    console.log(`💾 DB 저장 전 진입가 확인:`, {
                        업비트진입가: upbitEntryPrice,
                        바이낸스진입가: currentPrice,
                        수량: adjustedQuantity
                    });
                }
                // 수수료 총합 계산 (KRW) - 단가 계산 필요
                const avgPriceForFeeCal = executedVolume > 0 ? upbitEntryPrice / executedVolume : 0;
                const upbitEntryFee = calculateUpbitFee(executedVolume, avgPriceForFeeCal, paidFee);
                const binanceEntryFeeUSDT = calculateBinanceFee(adjustedQuantity, currentPrice, binancePaidFee);
                // USDT/KRW 환율로 바이낸스 수수료를 KRW로 환산
                let usdtKrwRateForFee = 1400; // 기본값
                let totalFeesKRW = 0;
                try {
                    // ✅ 정확한 USDT/KRW 환율 조회 (fee-calculator 사용)
                    const { getUSDTKRWRate } = await import('../utils/fee-calculator.js');
                    usdtKrwRateForFee = await getUSDTKRWRate();
                    const binanceEntryFeeKRW = binanceEntryFeeUSDT * usdtKrwRateForFee;
                    totalFeesKRW = upbitEntryFee + binanceEntryFeeKRW;
                    console.log(`💰 진입 수수료 계산:`, {
                        upbitFee: `₩${upbitEntryFee.toLocaleString()}`,
                        binanceFee: `$${binanceEntryFeeUSDT.toFixed(4)} (₩${binanceEntryFeeKRW.toLocaleString()})`,
                        totalFee: `₩${totalFeesKRW.toLocaleString()}`,
                        usdtKrwRate: usdtKrwRateForFee
                    });
                }
                catch (feeError) {
                    console.error(`❌ 수수료 계산 실패, 기본값 사용:`, feeError);
                    totalFeesKRW = upbitEntryFee + (binanceEntryFeeUSDT * usdtKrwRateForFee);
                }
                // 🔍 바이낸스 포지션 상세 정보는 나중에 백그라운드로 조회 (포지션 생성 속도 개선)
                let binanceDetails = {};
                console.log(`⚡ 포지션을 먼저 생성하고, 바이낸스 상세 정보는 백그라운드에서 업데이트합니다`);
                // ✅ 업비트 진입가: 실제 거래된 평균 단가 사용
                // 이전에는 바이낸스 가격 × 환율로 계산했지만, 실제 거래 가격과 차이가 발생하여 PnL이 부정확했음
                const upbitActualEntryPricePerBtc = executedVolume > 0 ? Math.round(totalFunds / executedVolume) : 0;
                console.log(`💰 업비트 실제 진입가: ₩${upbitActualEntryPricePerBtc.toLocaleString()}/BTC (총액: ₩${totalFunds.toLocaleString()}, 수량: ${executedVolume} BTC)`);
                // 🔒 임시 포지션을 실제 포지션으로 업데이트 (createPosition 대신 UPDATE 사용)
                if (!reservedPositionId) {
                    throw new Error('임시 포지션 ID가 없습니다');
                }
                await storage.updatePosition(reservedPositionId, {
                    status: 'open',
                    entryPrice: String(upbitActualEntryPricePerBtc), // ✅ 실제 업비트 거래 평균 단가 사용
                    upbitEntryPrice: String(upbitActualEntryPricePerBtc), // ✅ upbit_entry_price 필드 추가 (PnL 계산용) - 실제 거래 단가
                    binanceEntryPrice: String(currentPrice),
                    quantity: String(executedVolume),
                    binanceQuantity: String(adjustedQuantity),
                    remainingQuantity: String(adjustedQuantity),
                    upbitQuantity: String(executedVolume),
                    totalFees: String(totalFeesKRW),
                    entryTime: entryTimeKST,
                    upbitOrderId: upbitResult.uuid,
                    binanceOrderId: String(binanceResult.orderId),
                    entryUsdKrw: usdtKrwRateForFee,
                    entryPremiumRate: signal.premiumRate, // ✅ 진입 김프율 유지 (임시 포지션에서 저장된 값)
                    currentPremiumRate: signal.premiumRate, // ✅ 현재 김프율 초기값
                    ...binanceDetails
                });
                // 업데이트된 포지션 조회
                position = await storage.pool.query('SELECT * FROM positions WHERE id = $1', [reservedPositionId]);
                position = position.rows[0];
                console.log(`🔒 [전략 ${strategy.id}] 임시 포지션을 실제 포지션으로 업데이트 완료 (ID: ${reservedPositionId})`);
                console.log(`✅ 포지션 생성 완료:`, position);
                console.log(`🕒 진입 시간 (KST):`, entryTimeKST.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
                // DB 저장 후 검증
                console.log(`🔍 DB 저장 확인:`, {
                    id: position?.id,
                    entry_price: position?.entry_price,
                    binance_entry_price: position?.binance_entry_price,
                    quantity: position?.quantity
                });
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
                // 거래 기록에 positionId 업데이트 (이미 저장된 거래 기록 업데이트) - 백그라운드 수정 전에 먼저 실행!
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
                // 🔧 백그라운드에서 진입가 수정 (0인 경우) - trades positionId 업데이트 후 실행!
                if (needsEntryPriceFix && position?.id) {
                    console.log(`🔄 백그라운드에서 포지션 ${position.id} 진입가 자동 수정 시작...`);
                    this.fixPositionEntryPriceFromTrades(position.id).catch((err) => {
                        console.error(`❌ 포지션 ${position.id} 진입가 자동 수정 실패:`, err);
                    });
                }
                // 🔄 백그라운드에서 바이낸스 포지션 상세 정보 업데이트
                if (position?.id) {
                    console.log(`🔄 백그라운드에서 포지션 ${position.id} 바이낸스 상세 정보 업데이트 시작...`);
                    setTimeout(async () => {
                        try {
                            await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
                            const binancePositions = await binanceService.getFuturesPositions();
                            const searchSymbol = `${symbol}USDT`;
                            const binancePos = binancePositions.find(pos => pos.symbol === searchSymbol);
                            if (binancePos) {
                                await storage.updatePosition(position.id, {
                                    binanceMarkPrice: binancePos.markPrice,
                                    binanceLiquidationPrice: binancePos.liquidationPrice,
                                    binanceSizeUsdt: binancePos.sizeUsdt,
                                    binanceMarginUsdt: binancePos.marginUsdt,
                                    binanceMarginRatio: binancePos.marginRatio,
                                    binanceMarginType: binancePos.marginType,
                                    binanceUnrealizedPnl: binancePos.unRealizedProfit
                                });
                                console.log(`✅ 포지션 ${position.id} 바이낸스 상세 정보 업데이트 완료`);
                            }
                            else {
                                console.warn(`⚠️ 바이낸스 포지션을 찾을 수 없습니다: ${searchSymbol}`);
                            }
                        }
                        catch (error) {
                            console.error(`❌ 바이낸스 상세 정보 업데이트 실패:`, error);
                        }
                    }, 0);
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
            catch (positionError) {
                console.error(`❌ 포지션 UPDATE 실패, trades 테이블에서 재생성 시도:`, positionError);
                // trades 테이블 데이터로 포지션 재생성 시도
                try {
                    const binanceTrade = await storage.pool.query('SELECT * FROM trades WHERE exchange_order_id = $1 ORDER BY executed_at DESC LIMIT 1', [String(binanceResult.orderId)]);
                    const upbitTrade = await storage.pool.query('SELECT * FROM trades WHERE exchange_order_id = $1 ORDER BY executed_at DESC LIMIT 1', [upbitResult.uuid]);
                    if (binanceTrade.rows[0] && upbitTrade.rows[0]) {
                        const bt = binanceTrade.rows[0];
                        const ut = upbitTrade.rows[0];
                        // 임시 포지션을 trades 데이터로 강제 업데이트
                        await storage.pool.query(`
              UPDATE positions SET
                status = 'open',
                entry_price = $1,
                upbit_entry_price = $1,
                binance_entry_price = $2,
                quantity = $3,
                binance_quantity = $4,
                remaining_quantity = $4,
                upbit_quantity = $3,
                upbit_order_id = $5,
                binance_order_id = $6,
                entry_time = NOW(),
                updated_at = NOW()
              WHERE id = $7
              RETURNING *
            `, [
                            ut.price,
                            bt.price,
                            ut.quantity,
                            bt.quantity,
                            ut.exchange_order_id,
                            bt.exchange_order_id,
                            reservedPositionId
                        ]);
                        // position_id 업데이트
                        if (reservedPositionId) {
                            await storage.updateTradePositionId(binanceResult.orderId, reservedPositionId);
                            await storage.updateTradePositionId(upbitResult.uuid, reservedPositionId);
                        }
                        // 쿨다운 기록
                        this.userLastTradeTimes.set(userId, Date.now());
                        await storage.createSystemAlert({
                            type: "warning",
                            title: "포지션 복구 완료",
                            message: `${symbol} 포지션 생성 실패 후 trades 데이터로 복구 완료`,
                        });
                    }
                    else {
                        throw new Error('trades 데이터를 찾을 수 없음');
                    }
                }
                catch (recoveryError) {
                    console.error(`❌❌ 포지션 복구 실패:`, recoveryError);
                    // 쿨다운은 기록 (중복 진입 방지)
                    this.userLastTradeTimes.set(userId, Date.now());
                    await storage.createSystemAlert({
                        type: "error",
                        title: "🚨 포지션 복구 실패",
                        message: `${symbol} 거래 완료되었으나 포지션 생성/복구 실패. 수동 확인 필요. 업비트=${upbitResult?.uuid}, 바이낸스=${binanceResult?.orderId}`,
                    });
                    throw recoveryError;
                }
            }
        }
        catch (error) {
            console.error(`새로운 김프 진입 실패 (${symbol}):`, error);
            // 🔒 거래 실패 시 임시 포지션 삭제 (중복 진입 방지를 위해)
            if (reservedPositionId) {
                try {
                    await storage.pool.query('DELETE FROM positions WHERE id = $1 AND status = $2', [reservedPositionId, 'pending']);
                    console.log(`🗑️ [전략 ${strategy.id}] 거래 실패로 임시 포지션 삭제 (ID: ${reservedPositionId})`);
                }
                catch (deleteError) {
                    console.error(`❌ 임시 포지션 삭제 실패:`, deleteError);
                }
            }
            throw error;
        }
        finally {
            // 🔓 Lock 해제 (성공/실패 관계없이)
            this.entryLocks.delete(strategy.id);
            console.log(`🔓 [전략 ${strategy.id}] 진입 Lock 해제`);
        }
        // 🔥🔥 진입 완료 후 메모리에 거래 시간 기록 (모든 거래 성공 후)
        this.userLastTradeTimes.set(userId, Date.now());
        console.log(`🔥 [자동매매 진입 완료] 메모리에 시간 저장 → 60초 쿨다운 시작: ${new Date().toLocaleString('ko-KR')}`);
    }
    // 전략 청산: 업비트 매도 + 바이낸스 포지션 청산
    async executeStrategyExit(userId, signal) {
        // 🔒🔒 이중 안전장치: 거래소 매매 직전 쿨다운 재확인
        const cooldownMs = TRADING_CONSTANTS.MIN_ENTRY_COOLDOWN_MS;
        const lastTradeTime = this.userLastTradeTimes.get(userId);
        if (lastTradeTime) {
            const elapsedMs = Date.now() - lastTradeTime;
            if (elapsedMs < cooldownMs) {
                const remainSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
                console.log(`🚫🚫 [거래소 매매 차단] 청산 함수 진입 시점에도 쿨다운 ${remainSec}초 남음 - 거래소 API 호출 차단!`);
                throw new Error(`쿨다운 ${remainSec}초 남음 - 거래소 매매 차단됨`);
            }
            console.log(`✅ [거래소 매매 허용] 쿨다운 ${(elapsedMs / 1000).toFixed(1)}초 경과 - 청산 거래 진행`);
        }
        const positions = await storage.getActivePositions(parseInt(userId));
        const position = positions.find((p) => p.symbol === signal.symbol && p.status === "open" && p.strategy_id === signal.strategyId);
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
            // 각 거래소별 수량 사용 (업비트와 바이낸스 수량이 다를 수 있음)
            const upbitQuantity = Number(position.upbitQuantity || position.quantity);
            const binanceQuantity = Number(position.binanceQuantity || position.quantity);
            console.log(`📊 청산 수량: 업비트 ${upbitQuantity} BTC, 바이낸스 ${binanceQuantity} BTC`);
            // 1. 업비트에서 현물 매도 (에러 처리 강화)
            const market = `KRW-${signal.symbol}`;
            console.log(`업비트 현물 매도: ${market}, 수량: ${upbitQuantity}`);
            let upbitResult = null;
            let upbitError = null;
            try {
                upbitResult = await upbitService.placeSellOrder(market, upbitQuantity);
                console.log(`✅ 업비트 매도 성공 (초기 응답):`, upbitResult);
                // 🔍 매도도 매수와 동일하게 재시도하며 주문 상세 조회
                if (upbitResult.uuid) {
                    let orderDetail = null;
                    let detailSuccess = false;
                    // 최대 5번 재시도 (1초, 2초, 3초, 4초, 5초 대기)
                    for (let retry = 1; retry <= 5; retry++) {
                        try {
                            console.log(`⏳ [매도 시도 ${retry}/5] 체결 확인을 위해 ${retry}초 대기 후 주문 상세 조회...`);
                            await new Promise(resolve => setTimeout(resolve, retry * 1000));
                            orderDetail = await upbitService.getOrderDetail(upbitResult.uuid);
                            console.log(`🔍 매도 주문 상세 조회 결과:`, JSON.stringify(orderDetail, null, 2));
                            // paid_fee가 있는지 확인
                            const hasPaidFee = orderDetail.paid_fee && parseFloat(orderDetail.paid_fee) > 0;
                            const hasTrades = orderDetail.trades && Array.isArray(orderDetail.trades) && orderDetail.trades.length > 0;
                            if (hasPaidFee || hasTrades) {
                                console.log(`✅ [매도 시도 ${retry}/5] 주문 상세 조회 성공 (paid_fee: ${orderDetail.paid_fee})`);
                                detailSuccess = true;
                                break;
                            }
                            else {
                                console.warn(`⚠️ [매도 시도 ${retry}/5] paid_fee가 없음, 재시도...`);
                            }
                        }
                        catch (detailError) {
                            console.error(`❌ [매도 시도 ${retry}/5] 업비트 주문 상세 조회 실패:`, detailError);
                            if (retry === 5) {
                                console.error(`🚨 5번 재시도 모두 실패 - 초기 응답 데이터 사용`);
                            }
                        }
                    }
                    if (detailSuccess && orderDetail) {
                        // 🔧 avg_price 필드가 없으면 trades 배열에서 직접 계산
                        if (orderDetail.trades && Array.isArray(orderDetail.trades) && orderDetail.trades.length > 0) {
                            let totalFunds = 0;
                            let totalVolume = 0;
                            for (const trade of orderDetail.trades) {
                                totalFunds += parseFloat(trade.funds || "0");
                                totalVolume += parseFloat(trade.volume || "0");
                            }
                            const calculatedAvgPrice = totalVolume > 0 ? totalFunds / totalVolume : 0;
                            console.log(`💡 trades 배열에서 평균가 계산: ${calculatedAvgPrice} (총금액: ${totalFunds}, 총수량: ${totalVolume})`);
                            // avg_price 필드를 계산된 값으로 추가
                            orderDetail.avg_price = calculatedAvgPrice;
                        }
                        // 상세 조회 결과로 덮어쓰기 (avg_price, executed_volume, paid_fee 포함)
                        upbitResult = orderDetail;
                    }
                    else {
                        // 🚨 재시도 모두 실패 - 초기 응답 데이터 사용
                        console.log(`⚠️ 초기 응답 데이터 사용: upbitResult 유지`);
                        // upbitResult는 이미 초기 응답으로 설정되어 있으므로 그대로 사용
                    }
                }
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
            console.log(`바이낸스 선물 청산: ${signal.symbol}, 수량: ${binanceQuantity}`);
            let binanceResult = null;
            let binanceError = null;
            try {
                binanceResult = await binanceService.closeFuturesPosition(signal.symbol, binanceQuantity);
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
                // ⚠️ throw 하지 않고 계속 진행 (포지션 상태 업데이트 필요)
            }
            // 3. 청산 시점 환율 조회 (필수)
            const { UpbitAdapter } = await import('../adapters/UpbitAdapter.js');
            const upbitAdapter = new UpbitAdapter();
            const exitUsdKrw = await upbitAdapter.getCurrentPrice('USDT');
            console.log(`💱 청산 시점 환율: ${exitUsdKrw.toFixed(2)} KRW/USD`);
            // 4. 포지션 상태 업데이트
            // ✅ 개선: 거래 기록으로 실제 청산 여부 재확인
            const hasUpbitTrade = upbitResult && !upbitError;
            const hasBinanceTrade = binanceResult && !binanceError;
            const isBothSucceeded = hasUpbitTrade && hasBinanceTrade;
            // 📊 청산 상태 판단
            let positionStatus = 'open';
            if (isBothSucceeded) {
                positionStatus = 'closed';
                console.log(`✅ [포지션 ${position.id}] 양쪽 청산 성공 → 'closed'`);
            }
            else if (!hasUpbitTrade && !hasBinanceTrade) {
                // 양쪽 모두 실패 - 'open' 유지하지만 경고
                console.error(`🚨 [포지션 ${position.id}] 양쪽 청산 모두 실패 → 'open' 유지 (수동 처리 필요)`);
            }
            else {
                // 부분 청산: 성공한 쪽의 수량을 0으로 업데이트
                console.warn(`⚠️ [포지션 ${position.id}] 부분 청산 발생 - 포지션 상태는 'open' 유지`);
                // 부분 청산된 수량 업데이트 (성공한 쪽은 0으로)
                const updateData = {};
                if (hasUpbitTrade) {
                    updateData.upbitQuantity = 0;
                    console.log(`  - 업비트 청산 완료, 수량 → 0`);
                }
                if (hasBinanceTrade) {
                    updateData.binanceQuantity = 0;
                    console.log(`  - 바이낸스 청산 완료, 수량 → 0`);
                }
                // 수량 업데이트 먼저 실행
                if (Object.keys(updateData).length > 0) {
                    await storage.updatePosition(position.id, updateData);
                }
            }
            // 💰 실현 손익 계산 (업비트 손익 + 바이낸스 손익)
            let realizedPnl = 0;
            let totalFees = 0;
            let upbitPnl = 0;
            let binancePnl = 0;
            // 업비트 손익 계산 (청산 성공 시에만)
            if (upbitResult && !upbitError) {
                const upbitSellQuantity = parseFloat(upbitResult.executed_volume || upbitResult.volume || "0");
                const upbitSellPrice = parseFloat(upbitResult.avg_price || upbitResult.price || "0");
                const upbitPaidFee = upbitResult.paid_fee ? parseFloat(upbitResult.paid_fee) : undefined;
                const upbitFee = calculateUpbitFee(upbitSellQuantity, upbitSellPrice, upbitPaidFee);
                // 업비트 진입 시 총 금액
                const upbitEntryTotal = Number(position.upbit_entry_price || position.entry_price || 0);
                // 업비트 청산 시 총 금액
                const upbitExitTotal = upbitSellQuantity * upbitSellPrice;
                // 업비트 손익 = 청산금액 - 진입금액 - 수수료 (KRW)
                upbitPnl = upbitExitTotal - upbitEntryTotal - upbitFee;
                totalFees += upbitFee;
                console.log(`💰 업비트 손익: 청산 ₩${upbitExitTotal.toLocaleString()} - 진입 ₩${upbitEntryTotal.toLocaleString()} - 수수료 ₩${upbitFee.toFixed(0)} = ₩${upbitPnl.toFixed(0)}`);
            }
            // 바이낸스 손익 계산 (청산 성공 시에만)
            if (binanceResult && !binanceError) {
                const binanceCloseQuantity = parseFloat(binanceResult.executedQty || binanceResult.quantity || "0");
                const binanceClosePrice = parseFloat(binanceResult.avgPrice || binanceResult.price || "0");
                const binanceFee = calculateBinanceFee(binanceCloseQuantity, binanceClosePrice);
                // 바이낸스 진입 가격 (USD 단가)
                const binanceEntryPriceUsd = Number(position.binance_entry_price || position.entry_price || 0);
                // 바이낸스 진입 시 총 금액 (USD)
                const binanceEntryTotal = binanceEntryPriceUsd * binanceCloseQuantity;
                // 바이낸스 청산 시 총 금액 (USD)
                const binanceExitTotal = binanceClosePrice * binanceCloseQuantity;
                // 선물 포지션 타입 확인 (long/short)
                const positionType = String(position.type || '').toLowerCase();
                const isShort = positionType.includes('short') || positionType.includes('sell');
                // 바이낸스 손익 (USD): 롱은 (청산-진입), 숏은 (진입-청산)
                const binancePnlUsd = isShort
                    ? (binanceEntryTotal - binanceExitTotal - binanceFee)
                    : (binanceExitTotal - binanceEntryTotal - binanceFee);
                // 바이낸스 손익 (KRW 환산)
                binancePnl = binancePnlUsd * exitUsdKrw;
                totalFees += binanceFee * exitUsdKrw; // 수수료도 KRW로 환산
                console.log(`💰 바이낸스 손익 (${isShort ? '숏' : '롱'}): (${isShort ? '진입-청산' : '청산-진입'}) $${binancePnlUsd.toFixed(2)} × ${exitUsdKrw.toFixed(0)} = ₩${binancePnl.toFixed(0)}`);
            }
            // 총 실현 손익 = 업비트 손익 + 바이낸스 손익 (KRW)
            realizedPnl = upbitPnl + binancePnl;
            console.log(`💰💰 총 실현 손익: 업비트 ₩${upbitPnl.toFixed(0)} + 바이낸스 ₩${binancePnl.toFixed(0)} = ₩${realizedPnl.toFixed(0)}`);
            console.log(`💸 총 수수료: ₩${totalFees.toFixed(0)}`);
            await storage.updatePosition(position.id, {
                status: positionStatus,
                currentPremiumRate: signal.premiumRate,
                exitUsdKrw: exitUsdKrw, // 청산 시점 환율 저장
                realized_pnl: positionStatus === 'closed' ? realizedPnl : undefined, // closed일 때만 실현손익 저장
                total_fees: positionStatus === 'closed' ? totalFees : undefined, // closed일 때만 총 수수료 저장
                ...(positionStatus === 'closed' ? { exit_time: new Date() } : {}), // closed일 때만 exit_time 설정
            });
            // 4. 거래 기록 생성 (성공한 것만, 수수료 포함)
            const tradePromises = [];
            if (upbitResult && !upbitError) {
                // 업비트 매도 수수료 계산 (중앙화된 로직 사용)
                // 🔧 매도도 avg_price 우선 사용 (매수와 동일)
                const upbitSellQuantity = parseFloat(upbitResult.executed_volume || upbitResult.volume || "0");
                const upbitSellPrice = parseFloat(upbitResult.avg_price || upbitResult.price || "0");
                const upbitPaidFee = upbitResult.paid_fee ? parseFloat(upbitResult.paid_fee) : undefined;
                const upbitFee = calculateUpbitFee(upbitSellQuantity, upbitSellPrice, upbitPaidFee);
                tradePromises.push(storage.createTrade({
                    userId: parseInt(userId),
                    positionId: position.id,
                    strategyId: position.strategy_id, // 전략 ID 추가
                    symbol: signal.symbol,
                    side: "sell",
                    exchange: "upbit",
                    quantity: String(upbitSellQuantity),
                    price: String(upbitSellPrice),
                    fee: upbitFee, // KRW 단위 수수료
                    exchangeOrderId: upbitResult.uuid,
                }));
            }
            if (binanceResult && !binanceError) {
                // 바이낸스 청산 수수료 계산 (중앙화된 로직 사용)
                const binanceCloseQuantity = parseFloat(binanceResult.executedQty || binanceResult.quantity || "0");
                const binanceClosePrice = parseFloat(binanceResult.avgPrice || binanceResult.price || "0");
                const binanceFee = calculateBinanceFee(binanceCloseQuantity, binanceClosePrice);
                tradePromises.push(storage.createTrade({
                    userId: parseInt(userId),
                    positionId: position.id,
                    strategyId: position.strategy_id, // 전략 ID 추가
                    symbol: signal.symbol,
                    side: "buy",
                    exchange: "binance",
                    quantity: String(binanceCloseQuantity),
                    price: String(binanceClosePrice),
                    fee: binanceFee, // USDT 단위 수수료
                    exchangeOrderId: binanceResult.orderId?.toString(),
                }));
            }
            if (tradePromises.length > 0) {
                await Promise.all(tradePromises);
                console.log(`✅ 거래 기록 저장 완료 (${tradePromises.length}개, 수수료 포함)`);
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
            // 🔥🔥 청산 완료 후 메모리에 거래 시간 기록 (모든 거래 성공 후)
            this.userLastTradeTimes.set(userId, Date.now());
            console.log(`🔥 [자동매매 청산 완료] 메모리에 시간 저장 → 60초 쿨다운 시작: ${new Date().toLocaleString('ko-KR')}`);
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
                // 차익거래 수익 계산: 업비트 손익 + 바이낸스 손익
                const quantity = Number(position.quantity || 0);
                const upbitEntryPrice = Number(position.entryPrice || 0); // KRW/BTC 단가
                const upbitCurrentPrice = currentData.upbitPrice; // KRW/BTC 현재가
                const binanceEntryPrice = Number(position.binanceEntryPrice || 0); // USD/BTC 단가
                const binanceCurrentPrice = currentData.binanceFuturesPrice || 0; // USD/BTC 현재가
                const entryUsdKrw = Number(position.entryUsdKrw || position.entry_usd_krw || 1400); // 진입 시점 환율
                // 업비트 손익 (항상 매수 포지션): 가격 상승 시 이익
                const upbitPnl = (upbitCurrentPrice - upbitEntryPrice) * quantity;
                // 바이낸스 손익: side에 따라 계산식 다름
                let binancePnl = 0;
                if (position.side === 'short') {
                    // 바이낸스 숏: 가격 하락 시 이익
                    binancePnl = (binanceEntryPrice - binanceCurrentPrice) * quantity * entryUsdKrw;
                }
                else if (position.side === 'long') {
                    // 바이낸스 롱: 가격 상승 시 이익
                    binancePnl = (binanceCurrentPrice - binanceEntryPrice) * quantity * entryUsdKrw;
                }
                // 총 손익 (수수료 제외)
                const estimatedPnl = upbitPnl + binancePnl;
                console.log(`📊 포지션 ${position.id} 수익 계산 (${position.side}):
  업비트: 진입₩${upbitEntryPrice.toLocaleString()} → 현재₩${upbitCurrentPrice.toLocaleString()} = ${upbitPnl > 0 ? '+' : ''}₩${upbitPnl.toFixed(0)}
  바이낸스(${position.side}): 진입$${binanceEntryPrice.toFixed(2)} → 현재$${binanceCurrentPrice.toFixed(2)} = ${binancePnl > 0 ? '+' : ''}₩${binancePnl.toFixed(0)}
  총 예상수익: ${estimatedPnl > 0 ? '+' : ''}₩${estimatedPnl.toFixed(0)} (김프: ${entryPremium.toFixed(2)}% → ${currentPremium.toFixed(2)}%)`);
                // 바이낸스 선물 포지션 상세 정보 조회
                const binanceExtras = {};
                try {
                    const { ExchangeServiceFactory } = await import('./exchange-factory.js');
                    const services = await ExchangeServiceFactory.initializeByUserId(position.userId);
                    if (services.binanceService) {
                        const binancePositions = await services.binanceService.getFuturesPositions();
                        const binancePos = binancePositions.find(pos => pos.symbol === `${position.symbol}USDT`);
                        if (binancePos) {
                            binanceExtras.binanceMarkPrice = binancePos.markPrice;
                            binanceExtras.binanceLiquidationPrice = binancePos.liquidationPrice;
                            binanceExtras.binanceSizeUsdt = binancePos.sizeUsdt;
                            binanceExtras.binanceMarginUsdt = binancePos.marginUsdt;
                            binanceExtras.binanceMarginRatio = binancePos.marginRatio;
                            binanceExtras.binanceMarginType = binancePos.marginType;
                            binanceExtras.binanceUnrealizedPnl = binancePos.unRealizedProfit;
                        }
                    }
                }
                catch (binanceError) {
                    console.warn(`⚠️ 포지션 ${position.id} 바이낸스 데이터 조회 실패 (계속 진행):`, binanceError);
                }
                // 포지션 업데이트 (current_premium_rate, unrealized_pnl, 바이낸스 상세 정보)
                await storage.updatePosition(position.id, {
                    currentPremiumRate: currentPremium,
                    unrealizedPnl: estimatedPnl,
                    ...binanceExtras
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
     * 서버 시작 시 활성 전략으로 자동매매 자동 시작
     */
    async restoreAutoTradingStates() {
        try {
            console.log('🔄 활성 전략 기반 자동매매 복원 시작...');
            // 활성화된 전략이 있는 사용자 조회
            const result = await storage.pool.query(`
        SELECT DISTINCT user_id
        FROM trading_strategies
        WHERE is_active = true
      `);
            if (result.rows.length === 0) {
                console.log('✅ 활성화된 전략이 없습니다. 자동매매를 시작하지 않습니다.');
                return;
            }
            console.log(`🔍 활성 전략을 가진 사용자 ${result.rows.length}명 발견`);
            // 각 사용자별로 자동매매 시작
            for (const row of result.rows) {
                const userId = String(row.user_id);
                try {
                    console.log(`🚀 사용자 ${userId} 자동매매 시작 중...`);
                    // 활성 전략 확인
                    const strategies = await storage.getTradingStrategies(parseInt(userId));
                    const activeStrategies = strategies.filter((s) => s.is_active);
                    if (activeStrategies.length === 0) {
                        console.log(`⚠️ 사용자 ${userId}는 활성 전략이 없습니다.`);
                        continue;
                    }
                    // 자동매매 시작
                    await this.startMultiStrategyTrading(userId);
                    console.log(`✅ 사용자 ${userId} 자동매매 시작 완료 (${activeStrategies.length}개 활성 전략)`);
                }
                catch (error) {
                    console.error(`❌ 사용자 ${userId} 자동매매 시작 실패:`, error);
                }
            }
            console.log('✅ 활성 전략 기반 자동매매 복원 완료');
        }
        catch (error) {
            console.error('❌ 자동매매 복원 중 오류:', error);
        }
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
    /**
     * position_id가 null인 거래 기록으로부터 포지션을 복구 생성
     * 자동매매 시작 시 호출되어 누락된 포지션을 복구함
     */
    async recoverMissingPositions(userId) {
        try {
            console.log(`🔍 [포지션 복구] 사용자 ${userId}의 누락된 포지션 검색 중...`);
            // position_id가 null이고 최근 1시간 내의 거래 중 바이낸스 숏과 업비트 매수가 쌍으로 있는 거래 찾기
            const result = await storage.pool.query(`
        WITH orphan_trades AS (
          SELECT
            t.id,
            t.user_id,
            t.strategy_id,
            t.symbol,
            t.side,
            t.exchange,
            t.quantity,
            t.price,
            t.fee,
            t.exchange_order_id,
            t.executed_at,
            s.name as strategy_name,
            s.entry_rate,
            s.exit_rate,
            s.leverage
          FROM trades t
          LEFT JOIN trading_strategies s ON t.strategy_id = s.id
          WHERE t.user_id = $1
            AND t.position_id IS NULL
            AND t.executed_at > NOW() - INTERVAL '24 hours'
            AND t.side IN ('buy', 'short')
          ORDER BY t.executed_at DESC
        ),
        trade_pairs AS (
          SELECT
            b.id as binance_trade_id,
            u.id as upbit_trade_id,
            b.user_id,
            b.strategy_id,
            b.symbol,
            b.quantity as binance_quantity,
            b.price as binance_price,
            b.fee as binance_fee,
            b.exchange_order_id as binance_order_id,
            u.quantity as upbit_quantity,
            u.price as upbit_price,
            u.fee as upbit_fee,
            u.exchange_order_id as upbit_order_id,
            b.executed_at as entry_time,
            b.strategy_name,
            b.entry_rate,
            b.exit_rate,
            b.leverage
          FROM orphan_trades b
          INNER JOIN orphan_trades u ON
            b.user_id = u.user_id
            AND b.strategy_id = u.strategy_id
            AND b.symbol = u.symbol
            AND b.exchange = 'binance'
            AND u.exchange = 'upbit'
            AND b.side = 'short'
            AND u.side = 'buy'
            AND ABS(EXTRACT(EPOCH FROM (b.executed_at - u.executed_at))) < 10
        )
        SELECT * FROM trade_pairs
        LIMIT 10
      `, [userId]);
            if (result.rows.length === 0) {
                console.log(`✅ [포지션 복구] 사용자 ${userId}: 복구할 포지션 없음`);
                return;
            }
            console.log(`🔧 [포지션 복구] ${result.rows.length}개의 누락된 포지션 발견`);
            // 각 거래 쌍에 대해 포지션 생성
            for (const row of result.rows) {
                try {
                    // 🔒 중복 체크: 이미 해당 전략의 활성 포지션이 있으면 건너뛰기
                    const existingCheck = await storage.pool.query(`
            SELECT id FROM positions
            WHERE user_id = $1 AND strategy_id = $2 AND symbol = $3 AND status IN ('open', 'pending')
            LIMIT 1
          `, [row.user_id, row.strategy_id, row.symbol]);
                    if (existingCheck.rows.length > 0) {
                        console.log(`⏭️  [포지션 복구] 건너뛰기: 전략 ${row.strategy_id}에 이미 활성 포지션 존재 (ID: ${existingCheck.rows[0].id})`);
                        continue;
                    }
                    // 업비트 진입가 (이제 trades.price는 단가로 저장됨)
                    const upbitEntryPrice = Math.round(parseFloat(row.upbit_price));
                    const totalFees = parseFloat(row.upbit_fee || '0') + parseFloat(row.binance_fee || '0');
                    // 포지션 생성
                    const positionResult = await storage.pool.query(`
            INSERT INTO positions (
              user_id, strategy_id, symbol, type, side, status,
              entry_price, quantity, binance_entry_price, binance_quantity, remaining_quantity,
              binance_leverage, total_fees, upbit_order_id, binance_order_id, entry_time,
              entry_premium_rate, current_premium_rate, entry_usd_krw,
              unrealized_pnl, created_at, updated_at
            ) VALUES (
              $1, $2, $3, 'BACK', 'short', 'open',
              $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13,
              $14, $14, 1380,
              0, NOW(), NOW()
            )
            RETURNING id
          `, [
                        row.user_id,
                        row.strategy_id,
                        row.symbol,
                        upbitEntryPrice,
                        row.upbit_quantity,
                        row.binance_price,
                        row.binance_quantity,
                        row.binance_quantity,
                        row.leverage || 5,
                        totalFees,
                        row.upbit_order_id,
                        row.binance_order_id,
                        row.entry_time,
                        row.entry_rate || 0
                    ]);
                    const positionId = positionResult.rows[0].id;
                    // 거래 기록 업데이트
                    await storage.pool.query(`
            UPDATE trades
            SET position_id = $1
            WHERE id IN ($2, $3)
          `, [positionId, row.binance_trade_id, row.upbit_trade_id]);
                    console.log(`✅ [포지션 복구] 포지션 ${positionId} 생성 완료:`, {
                        strategy: row.strategy_name,
                        symbol: row.symbol,
                        quantity: row.upbit_quantity,
                        binance_order: row.binance_order_id,
                        upbit_order: row.upbit_order_id
                    });
                    // 시스템 알림 생성
                    await storage.createSystemAlert({
                        type: "info",
                        title: "포지션 자동 복구",
                        message: `${row.strategy_name} - ${row.symbol} 포지션이 거래 기록으로부터 자동 복구되었습니다. (포지션 ID: ${positionId})`
                    });
                }
                catch (error) {
                    console.error(`❌ [포지션 복구] 실패:`, error);
                }
            }
            console.log(`✅ [포지션 복구] 완료: ${result.rows.length}개 처리됨`);
        }
        catch (error) {
            console.error(`❌ [포지션 복구] 오류:`, error);
        }
    }
    async fixPositionEntryPriceFromTrades(positionId) {
        try {
            console.log(`🔄 포지션 ${positionId} 진입가 자동 수정 시작...`);
            // 2초 대기 (거래 기록이 저장될 시간 확보)
            await new Promise(resolve => setTimeout(resolve, 2000));
            // trades 테이블에서 진입가 조회 (✅ trades의 price는 이제 단가로 저장됨)
            const result = await storage.pool.query(`
        SELECT
          MAX(CASE WHEN exchange = 'upbit' AND side = 'buy' THEN price END) as upbit_entry_price,
          MAX(CASE WHEN exchange = 'binance' AND side IN ('sell', 'short') THEN price END) as binance_entry_price,
          MAX(CASE WHEN exchange = 'upbit' AND side = 'buy' THEN quantity END) as upbit_qty
        FROM trades
        WHERE position_id = $1
        GROUP BY position_id
      `, [positionId]);
            if (result.rows.length === 0) {
                console.warn(`⚠️ 포지션 ${positionId}의 거래 기록을 찾을 수 없습니다`);
                return;
            }
            const { upbit_entry_price, binance_entry_price, upbit_qty } = result.rows[0];
            if (!upbit_entry_price || !binance_entry_price) {
                console.warn(`⚠️ 포지션 ${positionId}의 진입가를 trades에서 찾을 수 없습니다:`, {
                    upbit단가: upbit_entry_price,
                    upbit수량: upbit_qty,
                    binance: binance_entry_price
                });
                return;
            }
            // 포지션 업데이트 (단가로 저장)
            await storage.pool.query(`
        UPDATE positions
        SET entry_price = $1, binance_entry_price = $2, updated_at = NOW()
        WHERE id = $3
      `, [Math.round(Number(upbit_entry_price)), binance_entry_price, positionId]);
            console.log(`✅ 포지션 ${positionId} 진입가 자동 수정 완료:`, {
                upbit단가: `₩${Math.round(Number(upbit_entry_price)).toLocaleString()}/BTC`,
                upbit수량: `${Number(upbit_qty).toFixed(8)} BTC`,
                binance단가: `$${Number(binance_entry_price).toFixed(2)}/BTC`
            });
        }
        catch (error) {
            console.error(`❌ 포지션 ${positionId} 진입가 자동 수정 실패:`, error);
            throw error;
        }
    }
}
export const multiStrategyTradingService = new MultiStrategyTradingService();
