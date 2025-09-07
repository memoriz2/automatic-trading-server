import fetch from 'node-fetch';

export class CoinAPIService {
  private apiKey: string;
  private baseUrl = 'https://rest.coinapi.io/v1';

  constructor() {
    // CoinAPI 무료 계정: 100 requests/day
    this.apiKey = process.env.COINAPI_KEY || 'demo-key';
  }

  private async fetchFromCoinAPI<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: { "X-CoinAPI-Key": this.apiKey },
      });

      if (!response.ok) {
        throw new Error(`CoinAPI request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error("Error fetching from CoinAPI:", error);
      throw error;
    }
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
        const data = await response.json() as { rate: number };
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

  async getExchangeRate(baseAsset: string, quoteAsset: string): Promise<number> {
    const endpoint = `/v1/exchangerate/${baseAsset}/${quoteAsset}`;
    const data = await this.fetchFromCoinAPI<{ rate: number }>(endpoint);
    return data.rate;
  }

  async getCryptoPrice(symbol: string): Promise<number | null> {
    const endpoint = `/v1/ohlcv/${symbol}/latest?period_id=1MIN`;
    const data = await this.fetchFromCoinAPI<any[]>(endpoint);
    if (data && data.length > 0) {
      return data[0].price_close;
    }
    return null;
  }

  async getBinanceFuturesPrice(symbol: string): Promise<number | null> {
    const endpoint = `/v1/trades/BINANCE_FTS_PERP_${symbol}USD/latest?limit=1`;
    const data = await this.fetchFromCoinAPI<any[]>(endpoint);
    if (data && data.length > 0) {
      const price = data[0].price;
      return price;
    }
    return null;
  }

  async getUpbitPrice(symbol: string): Promise<number | null> {
    const endpoint = `/v1/trades/UPBIT_SPOT_${symbol}_KRW/latest?limit=1`;
    const data = await this.fetchFromCoinAPI<any[]>(endpoint);
    if (data && data.length > 0) {
      const price = data[0].price;
      return price;
    }
    return null;
  }

  // 업비트 직접 API 호출 (CoinAPI 실패시 대체)
  private async getUpbitPriceDirect(symbol: string): Promise<number> {
    try {
      const market = `KRW-${symbol}`;
      const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${market}`);
      
      if (response.ok) {
        const data = await response.json() as { trade_price: number }[];
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

      if (upbitPrice === null || binanceFuturesPrice === null) {
        throw new Error(`Failed to fetch prices for ${symbol}`);
      }

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