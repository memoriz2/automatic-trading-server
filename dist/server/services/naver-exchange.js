import fetch from 'node-fetch';
export class GoogleFinanceExchangeService {
    googleRate = null; // 구글 파이낸스 환율
    lastCalculatedRate = null; // 이전 계산된 환율
    isUpdating = false;
    updateInterval = null;
    constructor() {
        // 즉시 환율 업데이트 시작
        this.updateRate();
        // 3초마다 환율 업데이트
        this.startAutoUpdate();
    }
    startAutoUpdate() {
        // console.log('🔄 구글 파이낸스 환율 자동 업데이트 시작 (3초 간격)');
        this.updateInterval = setInterval(() => {
            // console.log('⏰ 구글 파이낸스 환율 업데이트 시도 중...');
            this.updateRate();
        }, 3000); // 3초마다 업데이트
    }
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    async updateRate() {
        if (this.isUpdating)
            return;
        this.isUpdating = true;
        try {
            // 💥 구글 파이낸스 환율만 사용 (간단하고 안정적)
            // console.log('🔍 구글 파이낸스 환율 조회 시도...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch('https://www.google.com/finance/quote/USD-KRW', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const html = await response.text();
            const rateMatch = html.match(/data-last-price="([0-9,]+\.?[0-9]*)"/) ||
                html.match(/([0-9,]+\.[0-9]+)/);
            if (rateMatch) {
                const rateString = rateMatch[1] || rateMatch[0];
                const rate = parseFloat(rateString.replace(/,/g, ''));
                if (rate && rate > 1000 && rate < 2000) {
                    this.googleRate = rate;
                    // console.log(`✅ 구글 파이낸스 환율: ${rate}원`);
                }
                else {
                    console.warn(`❌ 구글 파이낸스 비정상 환율 값: ${rate}`);
                }
            }
            else {
                // console.log(`❌ 구글 파이낸스 환율 파싱 실패`);
            }
        }
        catch (error) {
            console.error('환율 조회 실패:', error);
            console.log(`⚠️ 환율 조회 실패 - 기본값 사용`);
        }
        finally {
            this.isUpdating = false;
        }
    }
    getCurrentRate() {
        // 구글 파이낸스 환율 사용
        if (this.googleRate) {
            // 환율 변경 감지 및 로그
            if (this.lastCalculatedRate === null) {
                //         const timestamp = new Date().toLocaleTimeString();
                // console.log(`💰 [${timestamp}] 초기 환율: ${this.googleRate.toFixed(2)}원 (구글 파이낸스)`);
                this.lastCalculatedRate = this.googleRate;
            }
            else if (Math.abs(this.googleRate - this.lastCalculatedRate) > 0.001) {
                //         const timestamp = new Date().toLocaleTimeString();
                //         const changeSymbol = change > 0 ? '📈' : '📉';
                // console.log(`${changeSymbol} [${timestamp}] 환율 변경: ${this.lastCalculatedRate.toFixed(2)}원 → ${this.googleRate.toFixed(2)}원 (${change > 0 ? '+' : ''}${change.toFixed(2)}원)`);
                this.lastCalculatedRate = this.googleRate;
            }
            return this.googleRate;
        }
        // 기본값 (구글 파이낸스 실패 시)
        // console.log(`⚠️ 구글 파이낸스 환율 없음 - 기본값 1394.0원 사용`);
        return 1394.0;
    }
    async getRate() {
        // 현재 환율 반환, 필요시 즉시 업데이트
        if (!this.isUpdating) {
            this.updateRate(); // 백그라운드에서 업데이트
        }
        return this.getCurrentRate();
    }
}
// 싱글톤 인스턴스
export const naverExchange = new GoogleFinanceExchangeService();
