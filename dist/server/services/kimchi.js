import 'dotenv/config';
import { storage } from '../storage.js';
import { UpbitWebSocketService } from './upbit-websocket.js';
import { BinanceWebSocketService } from './binance-websocket.js';
import { UpbitAdapter } from '../adapters/UpbitAdapter.js';
export class KimchiService {
    upbitAdapter;
    upbitWebSocketService;
    binanceWebSocketService;
    usdtKrwRate = 0; // 실시간 USDT 환율 (업비트에서 조회)
    realtimePrices = { upbit: {}, binance: {} };
    latestKimchiPremiums = [];
    symbols = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT'];
    isInitialized = false;
    onUpdateCallback = null;
    constructor() {
        this.upbitAdapter = new UpbitAdapter();
    }
    initialize() {
        if (this.isInitialized)
            return;
        console.log('🚀 실시간 김프 서비스 초기화 (업비트 실시간 USDT 환율 기준)');
        // 0. 환율 업데이트 시작 (업비트 실시간 USDT 가격 조회)
        this.updateExchangeRate(); // 즉시 1회 실행
        setInterval(() => this.updateExchangeRate(), 3000); // 3초마다 업데이트
        // 1. 웹소켓 서비스 초기화
        this.upbitWebSocketService = new UpbitWebSocketService();
        this.binanceWebSocketService = new BinanceWebSocketService();
        // 2. 업비트 데이터 수신 콜백 *먼저* 등록
        this.upbitWebSocketService.onData('kimchi-service', (data) => {
            // 💥 KRW-USDT 환율 처리 로직 제거
            const symbol = data.cd.replace('KRW-', '');
            this.realtimePrices.upbit[symbol] = data.trade_price;
            this.recalculateAndStorePremiums();
        });
        // 3. 바이낸스 데이터 수신 콜백 *먼저* 등록
        this.binanceWebSocketService.onData('kimchi-service', (data) => {
            const symbol = data.s.replace('USDT', '');
            // 💥 현물(c) -> 선물(p) 데이터 필드로 복귀
            this.realtimePrices.binance[symbol] = parseFloat(data.p);
            this.recalculateAndStorePremiums();
        });
        // 4. 모든 준비가 끝난 후, 데이터 구독 *시작*
        // 💥 KRW-USDT 구독 제거
        this.upbitWebSocketService.subscribe(['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOT']);
        // 💥 바이낸스는 연결 시 자동으로 구독되므로, 불필요한 subscribe 호출을 제거합니다.
        this.isInitialized = true;
        console.log('✅ 실시간 김프 서비스 초기화 완료.');
    }
    async updateExchangeRate() {
        try {
            // 업비트에서 실시간 USDT/KRW 가격 조회 (공개 API)
            this.usdtKrwRate = await this.upbitAdapter.getCurrentPrice('USDT');
            // console.log(`💱 USDT/KRW 환율 업데이트 (업비트 실시간): ${this.usdtKrwRate}원`);
            // 환율이 업데이트 되었으므로, 프리미엄 재계산
            this.recalculateAndStorePremiums();
        }
        catch (error) {
            console.error('❌ 업비트 USDT 환율 업데이트 실패:', error);
            // 오류 발생 시에도 계속 진행 (이전 환율 값 유지)
        }
    }
    recalculateAndStorePremiums() {
        const newPremiums = [];
        for (const symbol of this.symbols) {
            const upbitPrice = this.realtimePrices.upbit[symbol];
            const binanceUsdPrice = this.realtimePrices.binance[symbol];
            if (upbitPrice && binanceUsdPrice && this.usdtKrwRate > 0) {
                const binanceKrwPrice = binanceUsdPrice * this.usdtKrwRate;
                const premiumRate = ((upbitPrice / binanceKrwPrice) - 1) * 100;
                newPremiums.push({
                    symbol,
                    upbitPrice,
                    binancePrice: binanceKrwPrice,
                    premiumRate,
                    timestamp: new Date()
                });
            }
        }
        if (newPremiums.length > 0) {
            this.latestKimchiPremiums = newPremiums;
            if (this.onUpdateCallback) {
                this.onUpdateCallback(this.latestKimchiPremiums);
            }
        }
    }
    onUpdate(callback) {
        this.onUpdateCallback = callback;
    }
    async getLatestKimchiPremiums() {
        if (!this.isInitialized) {
            this.initialize();
        }
        return this.latestKimchiPremiums;
    }
    getUSDTKRWRate() {
        return this.usdtKrwRate;
    }
    async getKimchiPremiumHistory(symbol, limit = 100) {
        // (기존 코드 유지)
        try {
            const history = await storage.getKimchiPremiumHistory(symbol, limit);
            return history.map(h => ({
                symbol: h.symbol,
                upbitPrice: Number(h.upbitPrice),
                binancePrice: Number(h.binancePrice),
                premiumRate: Number(h.premiumRate),
                timestamp: h.timestamp || new Date()
            }));
        }
        catch (error) {
            console.error('Error getting kimchi premium history:', error);
            throw error;
        }
    }
}
