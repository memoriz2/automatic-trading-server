import fetch from 'node-fetch';

export class CoinAPIService {
  private apiKey: string;
  private baseUrl = 'https://rest.coinapi.io/v1';

  constructor() {
    // CoinAPI 무료 계정: 100 requests/day
    this.apiKey = process.env.COINAPI_KEY || 'demo-key';
  }

  // 실시간 환율 조회 (USDT/KRW)
  async getUSDTKRWRate(): Promise<number> {
    try {
      const headers = {
        'X-CoinAPI-Key': this.apiKey,
        'Accept': 'application/json'
      };

      const response = await fetch(`${this.baseUrl}/exchangerate/USDT/KRW`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        const rate = data.rate;
        console.log(`CoinAPI USDT/KRW 환율: ${rate}원`);
        return rate;
      }
      
      throw new Error(`CoinAPI USDT/KRW 조회 실패: ${response.status}`);
    } catch (error) {
      console.warn('CoinAPI USDT/KRW 조회 실패, 대체값 사용:', error);
      return 1358; // 대체값
    }
  }

  // 바이낸스 실시간 선물 가격 조회
  async getBinanceFuturesPrice(symbol: string): Promise<number> {
    try {
      const headers = {
        'X-CoinAPI-Key': this.apiKey,
        'Accept': 'application/json'
      };

      // 바이낸스 선물 마켓 ID 매핑
      const futuresSymbolMap: {[key: string]: string} = {
        'BTC': 'BINANCE_DAPI_BTCUSD_PERP',  // BTC 선물
        'ETH': 'BINANCE_DAPI_ETHUSD_PERP',  // ETH 선물
        'XRP': 'BINANCE_DAPI_XRPUSD_PERP',  // XRP 선물
        'ADA': 'BINANCE_DAPI_ADAUSD_PERP',  // ADA 선물
        'DOT': 'BINANCE_DAPI_DOTUSD_PERP'   // DOT 선물
      };

      const symbolId = futuresSymbolMap[symbol];
      if (!symbolId) {
        throw new Error(`지원하지 않는 심볼: ${symbol}`);
      }

      const response = await fetch(`${this.baseUrl}/quotes/current?filter_symbol_id=${symbolId}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const price = data[0].price;
          console.log(`${symbol} CoinAPI 선물가격: $${price.toLocaleString()}`);
          return price;
        }
      }
      
      throw new Error(`CoinAPI ${symbol} 선물 가격 조회 실패`);
    } catch (error) {
      console.warn(`CoinAPI ${symbol} 선물 가격 조회 실패:`, error);
      
      // 대체값: 현재 시장 기준 선물 가격
      const fallbackPrices: {[key: string]: number} = {
        'BTC': 118359,
        'ETH': 3628,
        'XRP': 3.15,
        'ADA': 0.807,
        'DOT': 3.98
      };
      
      const price = fallbackPrices[symbol] || 0;
      console.log(`${symbol} 선물 대체가격: $${price.toLocaleString()}`);
      return price;
    }
  }

  // 업비트 실시간 가격 조회
  async getUpbitPrice(symbol: string): Promise<number> {
    try {
      const headers = {
        'X-CoinAPI-Key': this.apiKey,
        'Accept': 'application/json'
      };

      // 업비트 심볼 ID 매핑
      const upbitSymbolMap: {[key: string]: string} = {
        'BTC': 'UPBIT_SPOT_BTC_KRW',
        'ETH': 'UPBIT_SPOT_ETH_KRW',
        'XRP': 'UPBIT_SPOT_XRP_KRW',
        'ADA': 'UPBIT_SPOT_ADA_KRW',
        'DOT': 'UPBIT_SPOT_DOT_KRW'
      };

      const symbolId = upbitSymbolMap[symbol];
      if (!symbolId) {
        throw new Error(`지원하지 않는 심볼: ${symbol}`);
      }

      const response = await fetch(`${this.baseUrl}/quotes/current?filter_symbol_id=${symbolId}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const price = data[0].price;
          console.log(`${symbol} CoinAPI 업비트가격: ${price.toLocaleString()}원`);
          return price;
        }
      }
      
      throw new Error(`CoinAPI ${symbol} 업비트 가격 조회 실패`);
    } catch (error) {
      console.warn(`CoinAPI ${symbol} 업비트 가격 조회 실패:`, error);
      
      // 업비트 직접 API 호출로 대체
      return await this.getUpbitPriceDirect(symbol);
    }
  }

  // 업비트 직접 API 호출 (CoinAPI 실패시 대체)
  private async getUpbitPriceDirect(symbol: string): Promise<number> {
    try {
      const market = `KRW-${symbol}`;
      const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${market}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const price = data[0].trade_price;
          console.log(`${symbol} 업비트 직접조회: ${price.toLocaleString()}원`);
          return price;
        }
      }
      
      throw new Error(`업비트 직접 API ${symbol} 조회 실패`);
    } catch (error) {
      console.error(`업비트 ${symbol} 조회 완전 실패:`, error);
      return 0;
    }
  }

  // 김치프리미엄 계산 (CoinAPI 기반)
  async calculateKimchiPremium(symbol: string): Promise<{
    upbitPrice: number;
    binanceFuturesPrice: number;
    usdtKrwRate: number;
    binancePriceKRW: number;
    premiumRate: number;
  }> {
    try {
      // 병렬로 데이터 조회
      const [upbitPrice, binanceFuturesPrice, usdtKrwRate] = await Promise.all([
        this.getUpbitPrice(symbol),
        this.getBinanceFuturesPrice(symbol),
        this.getUSDTKRWRate()
      ]);

      const binancePriceKRW = binanceFuturesPrice * usdtKrwRate;
      const premiumRate = ((upbitPrice - binancePriceKRW) / binancePriceKRW) * 100;

      console.log(`\n${symbol} 김프율 계산 (CoinAPI 기준):`, {
        업비트가격: `${upbitPrice.toLocaleString()}원`,
        바이낸스선물가격USD: `$${binanceFuturesPrice.toLocaleString()}`,
        환율USDTKRW: `${usdtKrwRate}원`,
        바이낸스선물가격KRW: `${binancePriceKRW.toLocaleString()}원`,
        김프율: `${premiumRate.toFixed(3)}%`
      });

      return {
        upbitPrice,
        binanceFuturesPrice,
        usdtKrwRate,
        binancePriceKRW,
        premiumRate
      };
    } catch (error) {
      console.error(`CoinAPI 김프율 계산 실패 (${symbol}):`, error);
      throw error;
    }
  }

  // API 한도 확인
  async checkAPILimit(): Promise<{remainingRequests: number, resetTime: string}> {
    try {
      const headers = {
        'X-CoinAPI-Key': this.apiKey,
        'Accept': 'application/json'
      };

      const response = await fetch(`${this.baseUrl}/metadata`, { headers });
      
      if (response.ok) {
        const remainingRequests = parseInt(response.headers.get('x-ratelimit-remaining') || '0');
        const resetTime = response.headers.get('x-ratelimit-reset') || 'unknown';
        
        console.log(`CoinAPI 남은 요청수: ${remainingRequests}, 리셋시간: ${resetTime}`);
        
        return { remainingRequests, resetTime };
      }
      
      throw new Error('API 한도 확인 실패');
    } catch (error) {
      console.warn('CoinAPI 한도 확인 실패:', error);
      return { remainingRequests: 0, resetTime: 'unknown' };
    }
  }
}