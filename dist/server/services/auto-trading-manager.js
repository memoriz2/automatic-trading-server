/**
 * 백그라운드 자동매매 관리자
 * 서버 시작 시 활성화된 자동매매를 자동으로 재개하고 관리
 */
import { storage } from '../storage.js';
import { multiStrategyTradingService } from './new-kimchi-trading.js';
export class AutoTradingManager {
    isInitialized = false;
    runningUsers = new Set();
    monitoringInterval = null;
    constructor() {
        console.log('🤖 자동매매 관리자 초기화');
    }
    /**
     * 서버 시작 시 활성화된 자동매매 재개
     */
    async start() {
        console.log('🔵 [AutoTradingManager] start() 메서드 진입');
        console.log('🔵 [AutoTradingManager] isInitialized:', this.isInitialized);
        if (this.isInitialized) {
            console.log('⚠️ 자동매매 관리자가 이미 실행 중입니다');
            return;
        }
        console.log('🔵 [AutoTradingManager] isInitialized 체크 통과');
        this.isInitialized = true;
        console.log('🚀 백그라운드 자동매매 시작 중...');
        // 잠시 대기 (웹소켓 등 다른 서비스가 준비될 시간 확보)
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
            // 활성화된 자동매매 사용자 조회
            const activeUsers = await storage.getActiveAutoTradingUsers();
            if (activeUsers.length === 0) {
                console.log('ℹ️ 활성화된 자동매매가 없습니다');
                return;
            }
            console.log(`📊 활성화된 자동매매: ${activeUsers.length}명`);
            // 각 사용자별로 자동매매 시작
            for (const user of activeUsers) {
                try {
                    await this.startUserTrading(user);
                }
                catch (error) {
                    console.error(`❌ 사용자 ${user.user_id} 자동매매 시작 실패:`, error);
                }
            }
            // 주기적 상태 모니터링 시작 (5분마다)
            this.startMonitoring();
            console.log(`✅ 백그라운드 자동매매 시작 완료: ${this.runningUsers.size}명 실행 중`);
        }
        catch (error) {
            console.error('❌ 자동매매 관리자 시작 실패:', error);
        }
    }
    /**
     * 개별 사용자 자동매매 시작
     */
    async startUserTrading(user) {
        const userId = user.user_id.toString();
        try {
            // 이미 실행 중인지 확인
            if (this.runningUsers.has(userId)) {
                console.log(`⚠️ 사용자 ${userId} 자동매매가 이미 실행 중입니다`);
                return;
            }
            // 사용자의 활성 전략 확인
            const strategies = await storage.getTradingStrategies(parseInt(userId));
            const activeStrategies = strategies.filter((s) => s.is_active);
            if (activeStrategies.length === 0) {
                console.log(`⚠️ 사용자 ${userId}의 활성 전략이 없습니다`);
                return;
            }
            // 거래소 API 키 확인
            const exchanges = await storage.getExchangesByUserId(parseInt(userId));
            const hasUpbit = exchanges.some(e => e.exchange === 'upbit' && e.isActive);
            const hasBinance = exchanges.some(e => e.exchange === 'binance' && e.isActive);
            if (!hasUpbit || !hasBinance) {
                console.log(`⚠️ 사용자 ${userId}의 거래소 API 키가 설정되지 않았습니다`);
                return;
            }
            // 자동매매 시작
            await multiStrategyTradingService.startMultiStrategyTrading(userId);
            this.runningUsers.add(userId);
            console.log(`✅ 사용자 ${userId}(${user.username}) 자동매매 시작 - ` +
                `전략 ${activeStrategies.length}개`);
        }
        catch (error) {
            console.error(`❌ 사용자 ${userId} 자동매매 시작 오류:`, error);
            throw error;
        }
    }
    /**
     * 주기적 상태 모니터링
     */
    startMonitoring() {
        // 5분마다 상태 체크
        this.monitoringInterval = setInterval(async () => {
            try {
                console.log(`📊 자동매매 모니터링: ${this.runningUsers.size}명 실행 중`);
                // DB와 동기화 체크
                const activeUsers = await storage.getActiveAutoTradingUsers();
                const activeUserIds = new Set(activeUsers.map(u => u.user_id.toString()));
                // DB에는 있는데 실행 중이 아닌 사용자 재시작
                for (const user of activeUsers) {
                    const userId = user.user_id.toString();
                    if (!this.runningUsers.has(userId)) {
                        console.log(`🔄 사용자 ${userId} 자동매매 재시작 시도`);
                        try {
                            await this.startUserTrading(user);
                        }
                        catch (error) {
                            console.error(`❌ 재시작 실패 (${userId}):`, error);
                        }
                    }
                }
                // 실행 중인데 DB에는 비활성화된 사용자 중지
                for (const userId of this.runningUsers) {
                    if (!activeUserIds.has(userId)) {
                        console.log(`🛑 사용자 ${userId} 자동매매 중지 (DB에서 비활성화됨)`);
                        try {
                            await multiStrategyTradingService.stopMultiStrategyTrading(userId);
                            this.runningUsers.delete(userId);
                        }
                        catch (error) {
                            console.error(`❌ 중지 실패 (${userId}):`, error);
                        }
                    }
                }
            }
            catch (error) {
                console.error('❌ 모니터링 중 오류:', error);
            }
        }, 5 * 60 * 1000); // 5분
    }
    /**
     * 자동매매 관리자 중지
     */
    async stop() {
        if (!this.isInitialized) {
            return;
        }
        console.log('🛑 백그라운드 자동매매 중지 중...');
        // 모니터링 중지
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        // 모든 사용자 자동매매 중지
        const stopPromises = Array.from(this.runningUsers).map(async (userId) => {
            try {
                await multiStrategyTradingService.stopMultiStrategyTrading(userId);
                console.log(`✅ 사용자 ${userId} 자동매매 중지 완료`);
            }
            catch (error) {
                console.error(`❌ 사용자 ${userId} 자동매매 중지 실패:`, error);
            }
        });
        await Promise.all(stopPromises);
        this.runningUsers.clear();
        this.isInitialized = false;
        console.log('✅ 백그라운드 자동매매 중지 완료');
    }
    /**
     * 상태 조회
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            runningUsersCount: this.runningUsers.size,
            runningUsers: Array.from(this.runningUsers),
        };
    }
    /**
     * 특정 사용자 자동매매 수동 시작
     */
    async startUser(userId) {
        const user = await storage.getUser(userId);
        if (!user) {
            throw new Error(`사용자 ${userId}를 찾을 수 없습니다`);
        }
        const settings = await storage.getTradingSettings(parseInt(userId));
        await this.startUserTrading({ ...settings, username: user.username, email: user.email });
    }
    /**
     * 특정 사용자 자동매매 수동 중지
     */
    async stopUser(userId) {
        if (!this.runningUsers.has(userId)) {
            console.log(`⚠️ 사용자 ${userId}의 자동매매가 실행 중이 아닙니다`);
            return;
        }
        await multiStrategyTradingService.stopMultiStrategyTrading(userId);
        this.runningUsers.delete(userId);
        console.log(`✅ 사용자 ${userId} 자동매매 중지 완료`);
    }
}
// 싱글톤 인스턴스
export const autoTradingManager = new AutoTradingManager();
