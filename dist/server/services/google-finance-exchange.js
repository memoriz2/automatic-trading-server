import fetch from 'node-fetch';
export class GoogleFinanceExchangeService {
    currentRate = 1382.67; // 최신 알려진 환율
    isUpdating = false;
    updateInterval = null;
    constructor() {
        // 즉시 환율 업데이트 시작
        this.updateRate();
        // 3초마다 환율 업데이트
        this.startAutoUpdate();
    }
    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
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
            const response = await fetch('https://www.google.com/finance/quote/USD-KRW', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                signal: AbortSignal.timeout(10000), // 10초 타임아웃
            });
            if (!response.ok) {
                throw new Error(`Google Finance HTTP ${response.status}`);
            }
            const html = await response.text();
            // 구글 파이낸스에서 환율 파싱
            // 예: 1,382.67 형태의 숫자 추출
            const rateMatch = html.match(/data-last-price="([0-9,]+\.?[0-9]*)"/) ||
                html.match(/([0-9,]+\.[0-9]+)/);
            if (rateMatch) {
                const rateString = rateMatch[1] || rateMatch[0];
                const rate = parseFloat(rateString.replace(/,/g, ''));
                if (rate && rate > 1000 && rate < 2000) {
                    const oldRate = this.currentRate;
                    this.currentRate = rate;
                    if (Math.abs(oldRate - rate) > 0.1) {
                        // console.log(`🌐 구글 파이낸스 USD/KRW 환율 업데이트: ${oldRate}원 → ${rate}원`);
                    }
                    else {
                        // console.log(`🌐 구글 파이낸스 환율 확인: ${rate}원`);
                    }
                }
                else {
                    throw new Error(`Invalid rate value: ${rate}`);
                }
            }
            else {
                throw new Error('Rate not found in response');
            }
        }
        catch (error) {
            console.error('구글 파이낸스 환율 조회 실패:', error);
            // console.log(`⚠️ 기존 환율 유지: ${this.currentRate}원`);
        }
        finally {
            this.isUpdating = false;
        }
    }
    getCurrentRate() {
        return this.currentRate;
    }
    async getRate() {
        // 현재 환율 반환, 필요시 즉시 업데이트
        if (!this.isUpdating) {
            this.updateRate(); // 백그라운드에서 업데이트
        }
        return this.currentRate;
    }
}
// 싱글톤 인스턴스
export const googleFinanceExchange = new GoogleFinanceExchangeService();
