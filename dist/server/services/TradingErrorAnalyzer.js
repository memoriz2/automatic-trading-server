import { storage } from '../storage.js';
/**
 * 거래 오류 분석 서비스
 * 매도 주문 실패 패턴을 분석하고 해결 방안을 제시
 */
export class TradingErrorAnalyzer {
    static instance;
    static getInstance() {
        if (!TradingErrorAnalyzer.instance) {
            TradingErrorAnalyzer.instance = new TradingErrorAnalyzer();
        }
        return TradingErrorAnalyzer.instance;
    }
    /**
     * 최근 거래 오류 패턴 분석
     */
    async analyzeTradingErrors(userId, days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            // 1. 시스템 알림에서 거래 관련 오류 조회
            const alerts = await storage.getSystemAlerts(50);
            const tradingAlerts = alerts.filter(alert => alert.type.includes('trading') ||
                alert.type.includes('error') ||
                alert.message.includes('매도') ||
                alert.message.includes('sell') ||
                alert.message.includes('업비트') ||
                alert.message.includes('바이낸스'));
            // 2. 오류 패턴 분석
            const patterns = new Map();
            let upbitSellErrors = 0;
            let binanceCloseErrors = 0;
            let networkErrors = 0;
            for (const alert of tradingAlerts) {
                const message = alert.message.toLowerCase();
                // 업비트 매도 오류
                if (message.includes('upbit') && (message.includes('sell') || message.includes('매도'))) {
                    upbitSellErrors++;
                    this.addPattern(patterns, 'upbit_sell_failure', 'upbit_sell', 'high');
                }
                // 바이낸스 청산 오류
                if (message.includes('binance') && (message.includes('close') || message.includes('청산'))) {
                    binanceCloseErrors++;
                    this.addPattern(patterns, 'binance_close_failure', 'binance_close', 'high');
                }
                // 네트워크 오류
                if (message.includes('network') || message.includes('timeout') || message.includes('연결')) {
                    networkErrors++;
                    this.addPattern(patterns, 'network_error', 'network', 'medium');
                }
                // API 제한 오류
                if (message.includes('rate limit') || message.includes('api limit') || message.includes('429')) {
                    this.addPattern(patterns, 'api_rate_limit', 'api_limit', 'medium');
                }
            }
            // 3. 권장사항 생성
            const recommendations = [];
            if (upbitSellErrors > 3) {
                recommendations.push('🚨 업비트 매도 오류가 빈발합니다. API 키 권한과 잔고를 확인하세요.');
                recommendations.push('💡 업비트 API 호출 간격을 늘리거나 재시도 로직을 개선하세요.');
            }
            if (binanceCloseErrors > 2) {
                recommendations.push('⚠️ 바이낸스 포지션 청산 오류가 발생했습니다. 선물 계정 상태를 확인하세요.');
            }
            if (networkErrors > 5) {
                recommendations.push('🌐 네트워크 오류가 빈발합니다. 프록시 설정이나 인터넷 연결을 확인하세요.');
            }
            if (patterns.size === 0) {
                recommendations.push('✅ 최근 거래 오류 패턴이 발견되지 않았습니다.');
            }
            const result = {
                totalErrors: tradingAlerts.length,
                upbitSellErrors,
                binanceCloseErrors,
                networkErrors,
                recentPatterns: Array.from(patterns.values()).slice(0, 10),
                recommendations
            };
            console.log(`📊 [TradingErrorAnalyzer] 사용자 ${userId} 오류 분석 완료:`, {
                totalErrors: result.totalErrors,
                upbitSellErrors,
                binanceCloseErrors,
                patternsFound: patterns.size
            });
            return result;
        }
        catch (error) {
            console.error('❌ [TradingErrorAnalyzer] 오류 분석 실패:', error);
            return {
                totalErrors: 0,
                upbitSellErrors: 0,
                binanceCloseErrors: 0,
                networkErrors: 0,
                recentPatterns: [],
                recommendations: ['오류 분석 중 문제가 발생했습니다.']
            };
        }
    }
    /**
     * 오류 패턴 추가/업데이트
     */
    addPattern(patterns, patternKey, category, severity) {
        const existing = patterns.get(patternKey);
        if (existing) {
            existing.count++;
            existing.lastSeen = new Date();
        }
        else {
            patterns.set(patternKey, {
                pattern: patternKey,
                count: 1,
                lastSeen: new Date(),
                severity,
                category
            });
        }
    }
    /**
     * 업비트 BTC 매도 주문 테스트 (실제 주문 없이 검증만)
     */
    async testUpbitSellOrder(userId, testAmount = 0.001) {
        try {
            const exchanges = await storage.getExchangesByUserId(userId);
            const upbitExchange = exchanges.find(ex => ex.exchange === 'upbit' && ex.isActive);
            if (!upbitExchange) {
                return {
                    canSell: false,
                    currentBtc: 0,
                    minSellAmount: 0.00008,
                    error: '업비트 API 키를 찾을 수 없습니다'
                };
            }
            const { UpbitService } = await import('./upbit.js');
            const upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
            // 현재 BTC 잔고 조회
            const accounts = await upbitService.getAccounts();
            const btcAccount = accounts.find(acc => acc.currency === 'BTC');
            const currentBtc = parseFloat(btcAccount?.balance || '0');
            const minSellAmount = 0.00008; // 업비트 BTC 최소 거래 단위
            // 매도 가능 여부 판단
            const canSell = currentBtc >= minSellAmount && currentBtc >= testAmount;
            console.log(`🧪 [TradingErrorAnalyzer] 업비트 매도 테스트:`, {
                userId,
                currentBtc: currentBtc.toFixed(8),
                testAmount: testAmount.toFixed(8),
                minSellAmount: minSellAmount.toFixed(8),
                canSell
            });
            return {
                canSell,
                currentBtc,
                minSellAmount,
                ...(canSell ? {} : { error: `매도 불가: 보유 ${currentBtc.toFixed(8)} BTC < 최소 ${minSellAmount.toFixed(8)} BTC` })
            };
        }
        catch (error) {
            console.error('❌ [TradingErrorAnalyzer] 업비트 매도 테스트 실패:', error);
            return {
                canSell: false,
                currentBtc: 0,
                minSellAmount: 0.00008,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
export const tradingErrorAnalyzer = TradingErrorAnalyzer.getInstance();
