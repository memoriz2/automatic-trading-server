import { UpbitService } from './upbit.js';
import { BinanceService } from './binance.js';
import { storage } from '../storage.js';
import { UpbitWebSocketService, UpbitTickerData } from './upbit-websocket.js';
import { BinanceWebSocketService, BinanceMarkPriceData } from './binance-websocket.js';
import { GoogleFinanceExchangeService } from './google-finance-exchange.js';

export interface KimchiData {
  symbol: string;
  upbitPrice: number;
  binancePrice: number; // KRW 환산 가격
  premiumRate: number;
  timestamp: Date;
}

interface RealtimePrices {
  upbit: { [symbol: string]: number };
  binance: { [symbol: string]: number }; // USD 가격
}

export class KimchiService {
  private upbitService: UpbitService;
  private binanceService: BinanceService;
  private googleFinanceExchangeService: GoogleFinanceExchangeService;
  private upbitWebSocketService!: UpbitWebSocketService;
  private binanceWebSocketService!: BinanceWebSocketService;
  private usdtKrwRate: number = 1300; // 실시간 USDT 환율
  
  private realtimePrices: RealtimePrices = { upbit: {}, binance: {} };
  private latestKimchiPremiums: KimchiData[] = [];
  private symbols = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT'];
  
  private isInitialized = false;
  private onUpdateCallback: ((data: KimchiData[]) => void) | null = null;
  private exchangeRateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.upbitService = new UpbitService();
    this.binanceService = new BinanceService();
    this.googleFinanceExchangeService = new GoogleFinanceExchangeService();
  }

  private initialize() {
    if (this.isInitialized) return;
    console.log('🚀 실시간 김프 서비스 초기화 (구글 환율 기준)');

    // 0. 환율 업데이트 시작 (💥 10초마다 -> 3초마다)
    this.updateExchangeRate(); // 즉시 1회 실행
    this.exchangeRateInterval = setInterval(() => this.updateExchangeRate(), 3000); // 10000 -> 3000

    // 1. 웹소켓 서비스 초기화
    this.upbitWebSocketService = new UpbitWebSocketService();
    this.binanceWebSocketService = new BinanceWebSocketService();

    // 2. 업비트 데이터 수신 콜백 *먼저* 등록
    this.upbitWebSocketService.onData('kimchi-service', (data: UpbitTickerData) => {
      // 💥 KRW-USDT 환율 처리 로직 제거
      const symbol = data.code.replace('KRW-', '');
      this.realtimePrices.upbit[symbol] = data.trade_price;
      this.recalculateAndStorePremiums();
    });

    // 3. 바이낸스 데이터 수신 콜백 *먼저* 등록
    this.binanceWebSocketService.onData('kimchi-service', (data: BinanceMarkPriceData) => {
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

  private async updateExchangeRate() {
    try {
      // 💥 getRate() -> getCurrentRate()로 변경하여 불필요한 호출 방지
      this.usdtKrwRate = this.googleFinanceExchangeService.getCurrentRate();
      // console.log(`💱 USD/KRW 환율 업데이트 (Google): ${this.usdtKrwRate}`);
      // 환율이 업데이트 되었으므로, 프리미엄 재계산
      this.recalculateAndStorePremiums(); 
    } catch (error) {
      console.error('Google 환율 업데이트 실패:', error);
    }
  }

  private recalculateAndStorePremiums(): void {
    const newPremiums: KimchiData[] = [];
    
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
  
  public onUpdate(callback: (data: KimchiData[]) => void) {
    this.onUpdateCallback = callback;
  }
  
  async getLatestKimchiPremiums(): Promise<KimchiData[]> {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.latestKimchiPremiums;
  }

  getUSDTKRWRate(): number {
    return this.usdtKrwRate;
  }
  
  async getKimchiPremiumHistory(symbol: string, limit = 100): Promise<KimchiData[]> {
    // (기존 코드 유지)
    try {
      const history = await storage.getKimchiPremiumHistory(symbol, limit);
      return history.map(h => ({
        symbol: h.symbol,
        upbitPrice: parseFloat(h.upbitPrice),
        binancePrice: parseFloat(h.binancePrice),
        premiumRate: parseFloat(h.premiumRate),
        timestamp: h.timestamp || new Date()
      }));
    } catch (error) {
      console.error('Error getting kimchi premium history:', error);
      throw error;
    }
  }
}
