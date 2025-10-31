import { storage } from '../storage.js';
import { PositionsRepository } from '../repositories/PositionsRepository.js';
import { TradesRepository } from '../repositories/TradesRepository.js';
import { formatDeviceInfo } from '../utils/device-info.js';
/**
 * 통합 포지션 진입 서비스
 * PC, 모바일, 자동매매 모두 동일한 로직 사용
 */
export class UnifiedPositionService {
    positionsRepo = new PositionsRepository();
    tradesRepo = new TradesRepository();
    /**
     * 안전한 포지션 진입 (중복 방지 포함)
     */
    async safeEnterPosition(params) {
        try {
            console.log(`🎯 통합 포지션 진입 시작:`, {
                userId: params.userId,
                strategyId: params.strategyId,
                symbol: params.symbol,
                side: params.side,
                exchange: params.exchange,
                device: params.deviceInfo ? formatDeviceInfo(params.deviceInfo) : 'unknown'
            });
            // 1. 중복 진입 방지: (사용자+전략+심볼) 기준으로 활성 포지션 확인
            const existingPosition = await this.positionsRepo.getOpenPositionByUserStrategyAndSymbol(params.userId, params.strategyId, params.symbol);
            if (existingPosition) {
                const message = `전략 ${params.strategyId}에 이미 ${params.symbol} 활성 포지션이 있습니다.`;
                console.log(`⚠️ 중복 진입 차단: ${message} (ID: ${existingPosition.id})`);
                return {
                    success: false,
                    message,
                    existingPosition: {
                        id: existingPosition.id,
                        symbol: existingPosition.symbol,
                        side: existingPosition.side,
                        entryTime: existingPosition.entryTime,
                        unrealizedPnl: existingPosition.unrealizedPnl,
                        entryPremiumRate: existingPosition.entryPremiumRate
                    }
                };
            }
            // 2. 포지션 생성 (디바이스 정보 포함) - 동시성 안전 생성 사용
            const entryTime = new Date();
            const safePrice = Number(params.price) > 0 ? Number(params.price) : 0.00000001;
            const safeQty = Number(params.quantity) > 0 ? Number(params.quantity) : 0.00000001;
            // 환율 기본값 설정 (제공되지 않으면 현재 USDT 가격 조회)
            let entryUsdKrw = params.entryUsdKrw || 0;
            if (!entryUsdKrw || entryUsdKrw === 0) {
                try {
                    const { UpbitAdapter } = await import('../adapters/UpbitAdapter.js');
                    const upbitAdapter = new UpbitAdapter();
                    entryUsdKrw = await upbitAdapter.getCurrentPrice('USDT');
                    console.log(`💱 현재 환율 조회: ${entryUsdKrw.toFixed(2)} KRW/USD`);
                }
                catch (error) {
                    console.error('❌ 환율 조회 실패, 기본값 1380 사용:', error);
                    entryUsdKrw = 1380; // fallback
                }
            }
            const baseData = {
                userId: params.userId,
                strategyId: params.strategyId,
                symbol: params.symbol,
                type: "kimchi_arbitrage",
                side: (params.side === 'buy' ? 'long' : params.side === 'sell' ? 'short' : params.side),
                status: "open",
                entryPrice: safePrice,
                quantity: safeQty,
                entryPremiumRate: Number(params.premiumRate),
                entryUsdKrw: entryUsdKrw,
                unrealizedPnl: 0,
                totalFees: 0,
                entryTime: entryTime,
                upbitOrderId: params.upbitOrderId,
                binanceOrderId: params.binanceOrderId,
                ip: params.deviceInfo?.ip,
                deviceType: params.deviceInfo?.deviceType || 'Unknown',
            };
            let position = null;
            try {
                position = await this.positionsRepo.createOpenIfNone(baseData);
            }
            catch (primaryError) {
                console.error('❌ 동시성 안전 생성 실패, fallback 시도:', primaryError?.message || primaryError);
                try {
                    // Fallback: 기존 스토리지 경로로 생성 시도 (DB 유니크 인덱스가 중복을 차단)
                    const created = await storage.createPosition({
                        userId: baseData.userId,
                        strategyId: baseData.strategyId,
                        symbol: baseData.symbol,
                        type: baseData.type,
                        entryPrice: String(baseData.entryPrice),
                        quantity: String(baseData.quantity),
                        entryPremiumRate: String(baseData.entryPremiumRate),
                        currentPremiumRate: String(baseData.entryPremiumRate),
                        status: baseData.status,
                        side: baseData.side,
                        binanceLeverage: 5,
                        entryUsdKrw: baseData.entryUsdKrw,
                        unrealizedPnl: 0,
                        totalFees: 0,
                        entryTime: baseData.entryTime,
                        upbitOrderId: baseData.upbitOrderId,
                        binanceOrderId: baseData.binanceOrderId,
                        ip: baseData.ip,
                        deviceType: baseData.deviceType
                    });
                    position = created;
                }
                catch (fallbackError) {
                    console.error('❌ 포지션 생성 fallback 실패:', fallbackError?.message || fallbackError);
                    throw fallbackError;
                }
            }
            // 3. 거래 기록 생성 (디바이스 정보 포함)
            if (params.deviceInfo) {
                try {
                    // side 타입 매핑 (long -> buy)
                    const tradeSide = params.side === 'long' ? 'buy' : params.side;
                    await this.tradesRepo.create({
                        userId: params.userId,
                        positionId: position.id,
                        orderId: null,
                        exchange: params.exchange,
                        symbol: params.symbol,
                        side: tradeSide,
                        quantity: params.quantity,
                        price: params.price,
                        fee: 0,
                        feeCurrency: params.exchange === 'upbit' ? 'KRW' : 'USDT',
                        executedAt: entryTime
                    });
                    console.log(`📝 거래 기록 생성 완료 (디바이스: ${formatDeviceInfo(params.deviceInfo)})`);
                }
                catch (tradeError) {
                    console.warn('⚠️ 거래 기록 생성 실패:', tradeError);
                }
            }
            const message = `${params.symbol} ${params.side} 포지션 진입 완료`;
            console.log(`✅ ${message} (ID: ${position.id})`);
            // 4. 포지션 생성 알림을 WebSocket으로 브로드캐스트
            try {
                // 글로벌 WebSocket 서버에 접근하여 포지션 업데이트 알림
                const positionUpdate = {
                    type: 'position-created',
                    data: {
                        position,
                        userId: params.userId,
                        deviceInfo: params.deviceInfo
                    }
                };
                // 서버의 WebSocket 브로드캐스트 함수 호출 (추후 구현 필요)
                console.log('📡 포지션 생성 WebSocket 브로드캐스트:', positionUpdate);
            }
            catch (broadcastError) {
                console.warn('⚠️ 포지션 생성 브로드캐스트 실패:', broadcastError);
            }
            return {
                success: true,
                message,
                position
            };
        }
        catch (error) {
            const errorMessage = error.message || '포지션 진입 중 오류 발생';
            console.error('❌ 통합 포지션 진입 실패:', error);
            return {
                success: false,
                message: errorMessage,
                error: errorMessage
            };
        }
    }
    /**
     * 전략별 활성 포지션 조회
     */
    async getActivePositionsByStrategy(strategyId) {
        try {
            const positions = await storage.getPositions({
                strategy_id: strategyId,
                status: 'open'
            });
            return positions;
        }
        catch (error) {
            console.error('❌ 전략별 활성 포지션 조회 실패:', error);
            return [];
        }
    }
    /**
     * 사용자별 활성 포지션 조회
     */
    async getActivePositionsByUser(userId) {
        try {
            const positions = await storage.getPositions({
                user_id: userId,
                status: 'open'
            });
            return positions;
        }
        catch (error) {
            console.error('❌ 사용자별 활성 포지션 조회 실패:', error);
            return [];
        }
    }
    /**
     * 포지션 진입 가능 여부 확인만 (실제 진입 X)
     */
    async checkEntryAllowed(strategyId, symbol) {
        try {
            const existingPosition = await this.positionsRepo.getOpenPositionByStrategyAndSymbol(strategyId, symbol);
            if (existingPosition) {
                return {
                    allowed: false,
                    message: `전략 ${strategyId}에 이미 ${symbol} 활성 포지션이 있습니다.`,
                    existingPosition
                };
            }
            return {
                allowed: true,
                message: `${symbol} 포지션 진입이 허용됩니다.`
            };
        }
        catch (error) {
            console.error('❌ 포지션 진입 확인 실패:', error);
            return {
                allowed: false,
                message: '포지션 진입 확인 중 오류가 발생했습니다.'
            };
        }
    }
}
// 싱글톤 인스턴스
export const unifiedPositionService = new UnifiedPositionService();
