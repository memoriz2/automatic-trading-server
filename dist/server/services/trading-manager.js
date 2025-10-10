// ===== 거래 서비스 매니저 (환경별 분기) =====
import { TRADING_CONFIG } from '../config/trading-config.js';
import { storage } from '../storage.js';
import { ExchangeServiceFactory } from './exchange-factory.js';
import { calculateTotalTradingFees } from '../utils/fee-calculator.js';
export class TradingManager {
    // private upbitService?: UpbitService; // 현재 사용하지 않음
    // private binanceService?: BinanceService; // 현재 사용하지 않음
    constructor() {
        console.log(`🎯 TradingManager 초기화: ${TRADING_CONFIG.tradingMode} 모드`);
    }
    // 사용자별 거래소 서비스 초기화
    async initializeServices(userId) {
        const services = await ExchangeServiceFactory.initializeByUserId(userId);
        return {
            upbit: services.upbitService,
            binance: services.binanceService
        };
    }
    // 강제진입 실행 (실거래만)
    async executeForceEntry(userId, params) {
        return this.executeRealForceEntry(userId, params);
    }
    // 실거래 강제진입
    async executeRealForceEntry(userId, params) {
        console.log(`🚨 실거래 강제진입 실행:`, params);
        try {
            const services = await this.initializeServices(userId);
            if (!services.upbit || !services.binance) {
                throw new Error('거래소 API 키가 설정되지 않았습니다');
            }
            // 0. 최신 강제진입 설정 조회 (익절 구간 저장용)
            const settingsResult = await storage.pool.query(`SELECT id FROM force_entry_settings
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`, [userId]);
            const forceEntrySettingsId = settingsResult.rows[0]?.id || null;
            console.log(`📋 강제진입 설정 ID: ${forceEntrySettingsId}`);
            // 1. 업비트 현재 가격 조회
            const upbitPrice = await services.upbit.getCurrentPrice(`KRW-${params.symbol}`);
            console.log(`📊 업비트 현재 ${params.symbol} 가격: ₩${upbitPrice.toLocaleString()}`);
            // 2. BTC 수량 -> 총 구매 금액(KRW) 계산
            const totalKRWAmount = Math.round(params.quantity * upbitPrice);
            console.log(`💰 구매 설정: ${params.quantity} ${params.symbol} = ₩${totalKRWAmount.toLocaleString()}`);
            // 3. 업비트 현물 매수 (총 금액으로)
            const upbitOrder = await services.upbit.placeBuyOrder(`KRW-${params.symbol}`, totalKRWAmount);
            // 2. 바이낸스 선물 숏
            const binanceOrder = await services.binance.placeFuturesShortOrder(params.symbol, params.quantity);
            console.log(`📊 주문 완료:`, {
                upbitOrderId: upbitOrder.uuid,
                binanceOrderId: binanceOrder.orderId
            });
            // 3. 실제 체결가 조회 (짧은 대기 후)
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
            let actualUpbitPrice = upbitPrice; // 현재가를 기본값으로
            let actualUpbitQuantity = params.quantity; // 요청 수량을 기본값으로
            let actualBinancePrice = 100000; // 기본값
            let upbitPaidFee = undefined; // 업비트 API의 paid_fee
            try {
                // 업비트 주문 상세 조회
                const upbitOrderDetail = await services.upbit.getOrderDetail(upbitOrder.uuid);
                console.log(`📊 업비트 주문 상세:`, upbitOrderDetail);
                // 업비트 실제 체결가와 체결 수량
                if (upbitOrderDetail.avg_price) {
                    actualUpbitPrice = parseFloat(upbitOrderDetail.avg_price);
                }
                else if (upbitOrderDetail.price) {
                    actualUpbitPrice = parseFloat(upbitOrderDetail.price);
                }
                // 실제 체결된 BTC 수량 (executed_volume)
                if (upbitOrderDetail.executed_volume) {
                    actualUpbitQuantity = parseFloat(upbitOrderDetail.executed_volume);
                }
                // 업비트 수수료 (paid_fee 필드)
                if (upbitOrderDetail.paid_fee) {
                    upbitPaidFee = parseFloat(upbitOrderDetail.paid_fee);
                }
                console.log(`✅ 업비트 실제 체결: ${actualUpbitQuantity} BTC @ ₩${actualUpbitPrice.toLocaleString()}`);
            }
            catch (error) {
                console.warn(`⚠️ 업비트 체결 정보 조회 실패, 기본값 사용:`, error);
            }
            try {
                // 바이낸스 주문 상세 조회
                const binanceOrderDetail = await services.binance.getFuturesOrderDetail(params.symbol, binanceOrder.orderId);
                console.log(`📊 바이낸스 주문 상세:`, binanceOrderDetail);
                // 바이낸스는 avgPrice 필드에 체결가가 있음
                if (binanceOrderDetail.avgPrice) {
                    actualBinancePrice = parseFloat(binanceOrderDetail.avgPrice);
                }
                console.log(`✅ 바이낸스 실제 체결가: $${actualBinancePrice.toLocaleString()}`);
            }
            catch (error) {
                console.warn(`⚠️ 바이낸스 체결가 조회 실패, 기본값 사용:`, error);
            }
            // 4. 수수료 계산 (중앙화된 유틸리티 사용)
            const fees = await calculateTotalTradingFees({
                upbitQuantity: actualUpbitQuantity,
                upbitPrice: actualUpbitPrice,
                binanceQuantity: actualUpbitQuantity,
                binancePrice: actualBinancePrice,
                upbitPaidFee
            });
            console.log(`💰 수수료 계산 완료:`, {
                upbitFee: `₩${fees.upbitFee.toLocaleString()}`,
                binanceFee: `$${fees.binanceFee.toFixed(4)} (₩${fees.binanceFeeKRW.toLocaleString()})`,
                totalFeeKRW: `₩${fees.totalFeeKRW.toLocaleString()}`,
                usdtKrwRate: fees.usdtKrwRate
            });
            // 4. DB에 실거래 포지션 저장 (실제 체결가와 수량 사용)
            const realPosition = {
                userId,
                symbol: params.symbol,
                type: 'force_entry',
                entryPrice: actualUpbitPrice, // 실제 체결된 업비트 가격
                binanceEntryPrice: actualBinancePrice, // 실제 체결된 바이낸스 가격 (USD)
                quantity: actualUpbitQuantity, // 실제 체결된 업비트 BTC 수량
                entryPremiumRate: params.currentKimp,
                currentPremiumRate: params.currentKimp,
                status: 'open',
                side: 'long',
                isMock: false,
                leverage: params.leverage,
                upbitOrderId: upbitOrder.uuid,
                binanceOrderId: binanceOrder.orderId,
                forceEntrySettingsId: forceEntrySettingsId // 강제진입 설정 ID 추가
            };
            const savedPosition = await storage.createPosition(realPosition);
            console.log(`✅ 포지션 저장 완료: ID=${savedPosition.id}, Settings ID=${forceEntrySettingsId}`);
            // 5. 거래 기록 생성 (업비트 매수 + 바이낸스 숏)
            try {
                // 업비트 매수 거래 기록
                await storage.createTrade({
                    userId,
                    positionId: savedPosition.id,
                    strategyId: null, // 강제진입은 전략 없음
                    tradeLogId: null,
                    symbol: params.symbol,
                    side: 'buy',
                    exchange: 'upbit',
                    quantity: actualUpbitQuantity,
                    price: actualUpbitPrice,
                    fee: fees.upbitFee, // 중앙화된 수수료 계산 결과 사용
                    orderType: 'LIVE',
                    exchangeOrderId: upbitOrder.uuid,
                    exchangeTradeId: upbitOrder.uuid
                });
                console.log(`✅ 업비트 매수 거래 기록 저장 완료`);
                // 바이낸스 숏 거래 기록
                await storage.createTrade({
                    userId,
                    positionId: savedPosition.id,
                    strategyId: null, // 강제진입은 전략 없음
                    tradeLogId: null,
                    symbol: params.symbol,
                    side: 'sell', // 숏은 sell로 기록
                    exchange: 'binance',
                    quantity: actualUpbitQuantity, // 동일한 수량
                    price: actualBinancePrice,
                    fee: fees.binanceFee, // USDT 단위 수수료
                    orderType: 'LIVE',
                    exchangeOrderId: binanceOrder.orderId.toString(),
                    exchangeTradeId: binanceOrder.orderId.toString()
                });
                console.log(`✅ 바이낸스 숏 거래 기록 저장 완료`);
            }
            catch (tradeError) {
                console.error('⚠️ 거래 기록 저장 실패 (포지션은 생성됨):', tradeError);
            }
            return {
                success: true,
                orderId: `${upbitOrder.uuid}-${binanceOrder.orderId}`,
                message: `실거래 강제진입 완료`,
                data: {
                    position: savedPosition,
                    strategyName: `강제진입${savedPosition.id}`,
                    upbitOrder,
                    binanceOrder,
                    fees: {
                        upbitKRW: fees.upbitFee,
                        binanceUSDT: fees.binanceFee,
                        binanceKRW: fees.binanceFeeKRW,
                        totalKRW: fees.totalFeeKRW,
                        usdtKrwRate: fees.usdtKrwRate
                    }
                }
            };
        }
        catch (error) {
            console.error('❌ 실거래 강제진입 실패:', error);
            return {
                success: false,
                message: `실거래 강제진입 실패: ${error.message}`
            };
        }
    }
    // 잔고 조회 (실거래만)
    async getBalance(userId) {
        return this.getRealBalance(userId);
    }
    async getRealBalance(userId) {
        const services = await this.initializeServices(userId);
        const balance = { source: 'real' };
        // 업비트 잔고
        if (services.upbit) {
            const upbitAccounts = await services.upbit.getAccounts();
            const krwAccount = upbitAccounts.find((acc) => acc.currency === 'KRW');
            const btcAccount = upbitAccounts.find((acc) => acc.currency === 'BTC');
            balance.krw = parseFloat(krwAccount?.balance || '0');
            balance.btc = parseFloat(btcAccount?.balance || '0');
        }
        // 바이낸스 잔고
        if (services.binance) {
            balance.usdt = await services.binance.getUSDTBalance();
            // 선물 포지션 정보도 가져올 수 있음
        }
        return balance;
    }
}
// 싱글톤 인스턴스
export const tradingManager = new TradingManager();
