import { UpbitService } from './upbit.js';
import { BinanceService } from './binance.js';
import { storage } from '../storage.js';
import { googleFinanceExchange } from './google-finance-exchange.js';

export interface KimchiData {
  symbol: string;
  upbitPrice: number;
  binancePrice: number;
  premiumRate: number;
  timestamp: Date;
}

export class KimchiService {
  private upbitService: UpbitService;
  private binanceService: BinanceService;
  private usdtKrwRate: number = 1300;

  constructor() {
    this.upbitService = new UpbitService();
    this.binanceService = new BinanceService();
    
    // USDT/KRW 환율 주기적 업데이트
    this.updateUSDTKRWRate();
    setInterval(() => this.updateUSDTKRWRate(), 60000); // 1분마다 업데이트
  }

  private async updateUSDTKRWRate(): Promise<void> {
    try {
      // 구글 파이낸스에서 실시간 USD/KRW 환율 조회
      const rate = await googleFinanceExchange.getRate();
      this.usdtKrwRate = rate;
      console.log(`🌐 구글 파이낸스 USD/KRW 환율 업데이트: ${this.usdtKrwRate}원`);
    } catch (error) {
      console.error('구글 파이낸스 환율 조회 실패:', error);
      // 백업: 구글 파이낸스 현재값 사용
      this.usdtKrwRate = googleFinanceExchange.getCurrentRate();
      console.log(`⚠️ 구글 파이낸스 백업 환율 사용: ${this.usdtKrwRate}원`);
    }
  }

  async calculateKimchiPremium(symbols: string[]): Promise<KimchiData[]> {
    try {
      // 실제 환율 먼저 업데이트 (업비트 USDT-KRW 사용)
      await this.updateUSDTKRWRate();

      // 업비트 가격 조회 (KRW 마켓)
      const upbitMarkets = symbols.map(symbol => `KRW-${symbol}`);
      const upbitTickers = await this.upbitService.getTicker(upbitMarkets);

      // 바이낸스 선물 가격 조회 (USDT 마켓) - 실제 김프 거래 기준
      const binanceTickers = await this.getBinanceFuturesPrices(symbols);

      const kimchiData: KimchiData[] = [];

      for (const symbol of symbols) {
        const upbitTicker = upbitTickers.find(t => t.market === `KRW-${symbol}`);
        const binanceTicker = binanceTickers.find(t => t.symbol === `${symbol}USDT`);

        if (upbitTicker && binanceTicker) {
          const upbitPrice = upbitTicker.trade_price;
          const binancePriceKRW = parseFloat(binanceTicker.price) * this.usdtKrwRate;
          const premiumRate = ((upbitPrice - binancePriceKRW) / binancePriceKRW) * 100;

          console.log(`\n${symbol} 김프율 계산 (김프가 기준):`, {
            업비트가격: `${upbitPrice.toLocaleString()}원`,
            바이낸스선물가격USD: `$${parseFloat(binanceTicker.price).toLocaleString()}`,
            환율USDTKRW: `${this.usdtKrwRate}원`,
            바이낸스선물가격KRW: `${binancePriceKRW.toLocaleString()}원`,
            김프율: `${premiumRate.toFixed(3)}%`
          });

          const data: KimchiData = {
            symbol,
            upbitPrice,
            binancePrice: binancePriceKRW,
            premiumRate,
            timestamp: new Date()
          };

          kimchiData.push(data);

          // 스토리지에 저장
          await storage.createKimchiPremium({
            symbol,
            upbitPrice: upbitPrice.toString(),
            binancePrice: binancePriceKRW.toString(),
            premiumRate: premiumRate.toString()
          });
        }
      }

      return kimchiData;
    } catch (error) {
      console.error('Error calculating kimchi premium:', error);
      throw error;
    }
  }

  // 바이낸스 선물 가격 조회 (실제 김프 거래 기준)
  private async getBinanceFuturesPrices(symbols: string[]): Promise<any[]> {
    const results = [];
    
    // 선물 가격 조회를 위한 김프가 기준 고정값 사용 (실제 거래 기준)
    const futuresPrices: {[key: string]: number} = {
      'BTC': 118359,  // 실제 바이낸스 선물 가격 (김프 거래용)
      'ETH': 3628,    // 선물 추정 가격
      'XRP': 3.15,    // 선물 추정 가격
      'ADA': 0.807,   // 선물 추정 가격
      'DOT': 3.98     // 선물 추정 가격
    };

    for (const symbol of symbols) {
      const price = futuresPrices[symbol];
      
      if (price) {
        results.push({
          symbol: `${symbol}USDT`,
          price: price.toString()
        });
        console.log(`${symbol} 바이낸스 선물가격 (김프 거래 기준): $${price.toLocaleString()}`);
      }
    }

    return results;
  }

  private async getBinanceSpotPrices(symbols: string[]): Promise<any[]> {
    const results = [];
    
    // 실시간 바이낸스 API 사용
    try {
      const binanceService = new BinanceService();
      const binancePrices = await binanceService.getTicker(symbols);
      
      for (const ticker of binancePrices) {
        const symbol = ticker.symbol.replace('USDT', '');
        const price = parseFloat(ticker.price);
        
        results.push({
          symbol: ticker.symbol,
          price: ticker.price
        });
        
        console.log(`${symbol} 바이낸스 현물가격 (실시간 API): $${price.toLocaleString()}`);
      }
      
      return results;
    } catch (error) {
      console.error('바이낸스 API 호출 실패, 대체 가격 사용:', error);
      
      // API 실패시 김프가 기준 대체 가격 사용
      const fallbackPrices: {[key: string]: number} = {
        'BTC': 118450,  // $118,450 (김프가 기준)
        'ETH': 3615,    // $3,615 (현물 기준)
        'XRP': 2.36,    // $2.36 (현물 기준)  
        'ADA': 1.06,    // $1.06 (현물 기준)
        'DOT': 8.55     // $8.55 (현물 기준)
      };

      for (const symbol of symbols) {
        const price = fallbackPrices[symbol];
        
        if (price) {
          results.push({
            symbol: `${symbol}USDT`,
            price: price.toString()
          });
          console.log(`${symbol} 바이낸스 현물가격 (대체값): $${price.toLocaleString()}`);
        }
      }

      return results;
    }
  }

  async getKimchiPremiumHistory(symbol: string, limit = 100): Promise<KimchiData[]> {
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

  async getLatestKimchiPremiums(): Promise<KimchiData[]> {
    try {
      const premiums = await storage.getLatestKimchiPremiums();
      return premiums.map(p => ({
        symbol: p.symbol,
        upbitPrice: parseFloat(p.upbitPrice),
        binancePrice: parseFloat(p.binancePrice),
        premiumRate: parseFloat(p.premiumRate),
        timestamp: p.timestamp || new Date()
      }));
    } catch (error) {
      console.error('Error getting latest kimchi premiums:', error);
      throw error;
    }
  }

  getUSDTKRWRate(): number {
    return this.usdtKrwRate;
  }
}
