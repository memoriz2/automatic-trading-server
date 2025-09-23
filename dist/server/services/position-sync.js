import { storage } from '../storage.js';
import { UpbitService } from './upbit.js';
import { BinanceService } from './binance.js';
/**
 * 거래소 실제 포지션과 DB 동기화 서비스
 */
export class PositionSyncService {
    /**
     * 사용자의 실제 거래소 포지션을 DB와 동기화
     */
    async syncUserPositions(userId) {
        try {
            console.log(`🔄 포지션 동기화 시작: 사용자 ${userId}`);
            // 1. 거래소 API 키 조회
            const upbitExchange = await storage.getDecryptedExchange(userId, 'upbit');
            const binanceExchange = await storage.getDecryptedExchange(userId, 'binance');
            if (!upbitExchange || !binanceExchange) {
                console.log('⚠️ API 키 없음 - 동기화 건너뜀');
                return {
                    synced: false,
                    upbitPositions: [],
                    binancePositions: [],
                    dbPositions: [],
                    newPositions: []
                };
            }
            // 2. 업비트 잔고 조회
            const upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
            const upbitAccounts = await upbitService.getAccounts();
            const btcAccount = upbitAccounts.find((acc) => acc.currency === 'BTC');
            const upbitBtcBalance = btcAccount ? parseFloat(btcAccount.balance) : 0;
            // 3. 바이낸스 포지션 조회
            const binanceService = new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
            const binanceAccount = await binanceService.getFuturesAccountInfo();
            const btcPosition = binanceAccount.positions?.find((pos) => pos.symbol === 'BTCUSDT' && parseFloat(pos.positionAmt) !== 0);
            const binanceBtcPosition = btcPosition ? parseFloat(btcPosition.positionAmt) : 0;
            // 4. 현재 DB 포지션 조회
            const dbPositions = await storage.getPositions({ userId, status: 'open' });
            console.log(`📊 포지션 현황:`, {
                upbitBTC: upbitBtcBalance,
                binanceBTC: binanceBtcPosition,
                dbPositions: dbPositions.length
            });
            // 5. 실제 포지션이 있는데 DB에 없으면 동기화
            const newPositions = [];
            if ((upbitBtcBalance > 0.0001 || Math.abs(binanceBtcPosition) > 0.0001) && dbPositions.length === 0) {
                console.log('🔄 거래소에 포지션 있지만 DB에 없음 - 동기화 진행');
                // 현재 BTC 가격 조회
                const upbitTicker = await upbitService.getTicker(['KRW-BTC']);
                const currentPrice = upbitTicker[0]?.trade_price || 0;
                // 김치프리미엄 계산 (간단한 추정)
                const binancePrice = binanceBtcPosition !== 0 && btcPosition ?
                    parseFloat(btcPosition.entryPrice || '0') : currentPrice / 1400; // 대략적인 환율
                const premiumRate = currentPrice > 0 && binancePrice > 0 ?
                    ((currentPrice - binancePrice * 1400) / (binancePrice * 1400)) * 100 : 0;
                // DB에 포지션 생성
                const syncedPosition = await storage.createPosition({
                    userId,
                    strategyId: null, // 동기화된 포지션은 전략 없음
                    symbol: 'BTC',
                    type: 'sync_position',
                    side: binanceBtcPosition < 0 ? 'short' : 'long',
                    status: 'open',
                    entryPrice: String(currentPrice),
                    quantity: String(upbitBtcBalance),
                    entryPremiumRate: String(premiumRate),
                    entryTime: new Date(),
                    upbitOrderId: 'SYNC-UPBIT',
                    binanceOrderId: 'SYNC-BINANCE'
                });
                newPositions.push(syncedPosition);
                console.log(`✅ 포지션 동기화 완료: ID ${syncedPosition.id}`);
            }
            return {
                synced: true,
                upbitPositions: [{ currency: 'BTC', balance: upbitBtcBalance }],
                binancePositions: btcPosition ? [btcPosition] : [],
                dbPositions,
                newPositions
            };
        }
        catch (error) {
            console.error('❌ 포지션 동기화 실패:', error);
            return {
                synced: false,
                upbitPositions: [],
                binancePositions: [],
                dbPositions: [],
                newPositions: []
            };
        }
    }
    /**
     * 모든 활성 사용자의 포지션 동기화
     */
    async syncAllUserPositions() {
        try {
            // 활성 사용자 목록 조회 (API 키가 있는 사용자)
            // storage에 public 메서드가 없으므로 임시로 하드코딩
            const userIds = [5]; // 현재 활성 사용자 ID
            console.log(`🔄 전체 포지션 동기화 시작: ${userIds.length}명 사용자`);
            for (const userId of userIds) {
                await this.syncUserPositions(userId);
                // 사용자 간 1초 대기 (API 제한 고려)
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            console.log(`✅ 전체 포지션 동기화 완료`);
        }
        catch (error) {
            console.error('❌ 전체 포지션 동기화 실패:', error);
        }
    }
}
// 싱글톤 인스턴스
export const positionSyncService = new PositionSyncService();
