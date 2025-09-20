import { UpbitService } from './upbit.js';
import { BinanceService } from './binance.js';
import { storage } from '../storage.js';
/**
 * 잔고 불균형 감지 및 자동 복구 서비스
 * 업비트/바이낸스 간 BTC 수량 불균형을 감지하고 자동으로 균형을 맞춤
 */
export class BalanceRebalanceService {
    static instance;
    isRunning = false;
    rebalanceThreshold = 0.001; // 0.001 BTC 이상 차이나면 리밸런싱
    static getInstance() {
        if (!BalanceRebalanceService.instance) {
            BalanceRebalanceService.instance = new BalanceRebalanceService();
        }
        return BalanceRebalanceService.instance;
    }
    /**
     * 사용자의 업비트/바이낸스 BTC 잔고 불균형 감지
     */
    async detectImbalance(userId) {
        try {
            // 1. 실제 거래소 잔고 조회
            const exchanges = await storage.getExchangesByUserId(userId);
            let upbitBtc = 0;
            let binanceBtc = 0;
            // 업비트 BTC 잔고 조회
            const upbitExchange = exchanges.find(ex => ex.exchange === 'upbit' && ex.isActive);
            if (upbitExchange) {
                const upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
                const accounts = await upbitService.getAccounts();
                const btcAccount = accounts.find(acc => acc.currency === 'BTC');
                upbitBtc = parseFloat(btcAccount?.balance || '0');
            }
            // 바이낸스 BTC 포지션 조회 (선물)
            const binanceExchange = exchanges.find(ex => ex.exchange === 'binance' && ex.isActive);
            if (binanceExchange) {
                const binanceService = new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
                const positions = await binanceService.getFuturesPositions();
                const btcPosition = positions.find((pos) => pos.symbol === 'BTCUSDT');
                binanceBtc = Math.abs(parseFloat(btcPosition?.positionAmt || '0'));
            }
            // 3. 불균형 계산
            const difference = Math.abs(upbitBtc - binanceBtc);
            const hasImbalance = difference > this.rebalanceThreshold;
            let recommendedAction = '';
            if (hasImbalance) {
                if (upbitBtc > binanceBtc) {
                    recommendedAction = `업비트에서 ${(upbitBtc - binanceBtc).toFixed(6)} BTC 매도 필요`;
                }
                else {
                    recommendedAction = `바이낸스에서 ${(binanceBtc - upbitBtc).toFixed(6)} BTC 포지션 정리 필요`;
                }
            }
            console.log(`🔍 [BalanceRebalance] 사용자 ${userId} 잔고 분석:`, {
                upbitBtc: upbitBtc.toFixed(6),
                binanceBtc: binanceBtc.toFixed(6),
                difference: difference.toFixed(6),
                hasImbalance,
                recommendedAction
            });
            return {
                hasImbalance,
                upbitBtc,
                binanceBtc,
                difference,
                recommendedAction
            };
        }
        catch (error) {
            console.error('❌ [BalanceRebalance] 잔고 불균형 감지 실패:', error);
            return {
                hasImbalance: false,
                upbitBtc: 0,
                binanceBtc: 0,
                difference: 0,
                recommendedAction: '잔고 조회 실패'
            };
        }
    }
    /**
     * 자동 리밸런싱 실행 (업비트 BTC 과다 보유 시 매도)
     */
    async executeRebalance(userId) {
        if (this.isRunning) {
            return {
                success: false,
                action: 'skip',
                error: '리밸런싱이 이미 실행 중입니다'
            };
        }
        try {
            this.isRunning = true;
            console.log(`🔄 [BalanceRebalance] 사용자 ${userId} 자동 리밸런싱 시작`);
            // 1. 불균형 감지
            const analysis = await this.detectImbalance(userId);
            if (!analysis.hasImbalance) {
                return {
                    success: true,
                    action: 'no_action',
                    details: '잔고 균형이 정상입니다'
                };
            }
            // 2. 업비트 BTC 과다 보유 시 매도 실행
            if (analysis.upbitBtc > analysis.binanceBtc) {
                const sellAmount = analysis.upbitBtc - analysis.binanceBtc;
                // 최소 거래 단위 확인 (업비트 BTC 최소: 0.00008)
                if (sellAmount < 0.00008) {
                    return {
                        success: true,
                        action: 'skip',
                        details: `매도량이 최소 거래 단위(0.00008 BTC)보다 작습니다: ${sellAmount.toFixed(8)} BTC`
                    };
                }
                // 업비트 매도 주문 실행
                const exchanges = await storage.getExchangesByUserId(userId);
                const upbitExchange = exchanges.find(ex => ex.exchange === 'upbit' && ex.isActive);
                if (!upbitExchange) {
                    throw new Error('업비트 API 키를 찾을 수 없습니다');
                }
                const upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
                // 안전하게 소수점 8자리로 반올림
                const roundedSellAmount = Math.floor(sellAmount * 100000000) / 100000000;
                console.log(`💰 [BalanceRebalance] 업비트 BTC 매도 실행: ${roundedSellAmount.toFixed(8)} BTC`);
                const sellOrder = await upbitService.placeSellOrder('KRW-BTC', roundedSellAmount, 'market');
                // 거래 기록 저장
                await this.recordRebalanceAction(userId, 'upbit_sell', {
                    amount: roundedSellAmount,
                    orderId: sellOrder.uuid,
                    reason: 'balance_rebalance'
                });
                return {
                    success: true,
                    action: 'upbit_sell',
                    details: {
                        sellAmount: roundedSellAmount,
                        orderId: sellOrder.uuid,
                        beforeBalance: analysis.upbitBtc,
                        expectedAfterBalance: analysis.upbitBtc - roundedSellAmount
                    }
                };
            }
            // 3. 바이낸스 BTC 과다 보유 시 (선물 포지션 정리)
            else {
                const closeAmount = analysis.binanceBtc - analysis.upbitBtc;
                console.log(`💰 [BalanceRebalance] 바이낸스 BTC 포지션 정리 필요: ${closeAmount.toFixed(8)} BTC`);
                // 바이낸스 선물 포지션 부분 정리 로직 (구현 필요)
                return {
                    success: false,
                    action: 'binance_close',
                    error: '바이낸스 포지션 정리 기능은 아직 구현되지 않았습니다'
                };
            }
        }
        catch (error) {
            console.error('❌ [BalanceRebalance] 자동 리밸런싱 실패:', error);
            return {
                success: false,
                action: 'error',
                error: error instanceof Error ? error.message : String(error)
            };
        }
        finally {
            this.isRunning = false;
        }
    }
    /**
     * 리밸런싱 액션 기록
     */
    async recordRebalanceAction(userId, action, details) {
        try {
            // 시스템 알림으로 기록
            await storage.createSystemAlert({
                type: 'balance_rebalance',
                title: '잔고 리밸런싱 실행',
                message: `${action}: ${JSON.stringify(details)}`,
                userId,
                priority: 'normal'
            });
        }
        catch (error) {
            console.error('❌ [BalanceRebalance] 액션 기록 실패:', error);
        }
    }
    /**
     * 정기적인 잔고 모니터링 시작
     */
    startMonitoring(userId, intervalMinutes = 10) {
        console.log(`🔄 [BalanceRebalance] 사용자 ${userId} 잔고 모니터링 시작 (${intervalMinutes}분 간격)`);
        setInterval(async () => {
            try {
                const analysis = await this.detectImbalance(userId);
                if (analysis.hasImbalance) {
                    console.warn(`⚠️ [BalanceRebalance] 잔고 불균형 감지: ${analysis.recommendedAction}`);
                    // 자동 리밸런싱 실행 (옵션)
                    // const result = await this.executeRebalance(userId);
                    // console.log(`🔄 [BalanceRebalance] 자동 리밸런싱 결과:`, result);
                }
            }
            catch (error) {
                console.error('❌ [BalanceRebalance] 모니터링 오류:', error);
            }
        }, intervalMinutes * 60 * 1000);
    }
}
export const balanceRebalanceService = BalanceRebalanceService.getInstance();
