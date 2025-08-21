import { UpbitService } from './upbit.js';
import { BinanceService } from './binance.js';
import fetch from 'node-fetch';
import { googleFinanceExchange } from './google-finance-exchange.js';
import { createHmac } from 'crypto';

export interface SimpleKimchiData {
  symbol: string;
  upbitPrice: number;     // 업비트 KRW 가격
  binanceFuturesPrice: number;  // 바이낸스 선물 USD 가격
  usdKrwRate: number;     // 구글 USD→KRW 환율
  binancePriceKRW: number; // 바이낸스 선물 가격을 KRW로 환산
  premiumRate: number;    // 김프율 (%)
  timestamp: string;
}

export class SimpleKimchiService {
  private upbitService: UpbitService;
  private binanceService: BinanceService;

  constructor() {
    this.upbitService = new UpbitService();
    this.binanceService = new BinanceService();
  }

  /**
   * 실시간 USD→KRW 환율 조회 (구글 파이낸스 사용)
   */
  private async getRealTimeExchangeRate(): Promise<number> {
    try {
      const rate = await googleFinanceExchange.getRate();
      console.log(`🌐 구글 파이낸스 실시간 USD/KRW 환율: ${rate}원`);
      return rate;
      
    } catch (error) {
      console.error('구글 파이낸스 환율 조회 실패:', error);
      // 백업: 구글 파이낸스 현재값 사용
      const fallbackRate = googleFinanceExchange.getCurrentRate();
      console.log(`⚠️ 구글 파이낸스 백업 환율 사용: ${fallbackRate}원`);
      return fallbackRate;
    }
  }

  /**
   * 단순 김프율 계산 - 업비트 KRW + 바이낸스 선물 + 실시간 환율
   */
  async calculateSimpleKimchi(symbols: string[]): Promise<SimpleKimchiData[]> {
    const results: SimpleKimchiData[] = [];

    // 실시간 USD→KRW 환율 조회 (ExchangeRate-API 사용)
    const usdKrwRate = await this.getRealTimeExchangeRate();

    for (const symbol of symbols) {
      try {
        // 병렬로 가격 조회
        const [upbitPrice, binanceFuturesPrice] = await Promise.all([
          this.getUpbitPrice(symbol),
          this.getBinanceFuturesPrice(symbol)
        ]);

        // 바이낸스 선물 가격을 KRW로 환산
        const binancePriceKRW = binanceFuturesPrice * usdKrwRate;

        // 김프율 계산: (업비트가격 - 바이낸스가격KRW) / 바이낸스가격KRW * 100
        const premiumRate = ((upbitPrice - binancePriceKRW) / binancePriceKRW) * 100;

        console.log(`${symbol} 김프율 계산 (구글 파이낸스 환율):`, {
          업비트가격: `${upbitPrice.toLocaleString()}원`,
          바이낸스선물가격USD: `$${binanceFuturesPrice.toLocaleString()}`,
          구글파이낸스환율: `${usdKrwRate}원`,
          바이낸스선물가격KRW: `${binancePriceKRW.toLocaleString()}원`,
          김프율: `${premiumRate.toFixed(3)}%`
        });

        results.push({
          symbol,
          upbitPrice,
          binanceFuturesPrice,
          usdKrwRate,
          binancePriceKRW,
          premiumRate,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(`${symbol} 김프 계산 실패:`, error);
      }
    }

    return results;
  }

  /**
   * 업비트 KRW 가격 조회
   */
  private async getUpbitPrice(symbol: string): Promise<number> {
    try {
      const tickers = await this.upbitService.getTicker([`KRW-${symbol}`]);
      if (tickers.length === 0) {
        throw new Error(`업비트 ${symbol} 가격 조회 결과 없음`);
      }
      return tickers[0].trade_price;
    } catch (error) {
      throw new Error(`업비트 ${symbol} 가격 조회 실패: ${error}`);
    }
  }

  // 기존 환율 조회 함수 제거됨 - googleExchangeReal 서비스 사용

  /**
   * 바이낸스 선물 가격 조회 (환경변수 API 키 사용)
   */
  private async getBinanceFuturesPrice(symbol: string): Promise<number> {
    try {
      const apiKey = process.env.BINANCE_API_KEY;
      const secretKey = process.env.BINANCE_SECRET_KEY;
      
      if (!apiKey || !secretKey) {
        throw new Error('바이낸스 API 키가 환경변수에 설정되지 않음');
      }

      // API 키를 사용한 인증 요청
      const timestamp = Date.now();
      const queryString = `symbol=${symbol}USDT&timestamp=${timestamp}`;
      
      // HMAC-SHA256 서명 생성
      const signature = createHmac('sha256', secretKey)
        .update(queryString)
        .digest('hex');

      const url = `https://fapi.binance.com/fapi/v1/ticker/price?${queryString}&signature=${signature}`;
      
      const response = await fetch(url, {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      });
      
      if (!response.ok) {
        // 인증 API 실패 시 Public API 시도
        console.log(`인증 API 실패 (${response.status}), Public API 시도`);
        const publicResponse = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}USDT`);
        
        if (!publicResponse.ok) {
          throw new Error(`바이낸스 API 오류: ${publicResponse.status}`);
        }
        
        const publicData = await publicResponse.json();
        return parseFloat(publicData.price);
      }

      const data = await response.json();
      const price = parseFloat(data.price);
      
      if (!price || price <= 0) {
        throw new Error(`잘못된 가격 데이터: ${price}`);
      }

      return price;
    } catch (error) {
      console.error(`바이낸스 ${symbol} 선물 가격 조회 실패:`, error);
      
      // 실패 시 다중 대체 API 시도
      console.log(`📈 ${symbol} 대체 가격 API 시도 중...`);
      
      // 1. CryptoCompare API 시도
      try {
        const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`);
        if (response.ok) {
          const data = await response.json();
          const price = data.USD;
          if (price && price > 0) {
            console.log(`✅ CryptoCompare ${symbol}: $${price}`);
            return price;
          }
        }
      } catch (error) {
        console.log(`CryptoCompare ${symbol} 실패`);
      }

      // 2. CoinAPI 시도
      try {
        const response = await fetch(`https://rest.coinapi.io/v1/exchangerate/${symbol}/USD`, {
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.rate && data.rate > 0) {
            console.log(`✅ CoinAPI ${symbol}: $${data.rate}`);
            return data.rate;
          }
        }
      } catch (error) {
        console.log(`CoinAPI ${symbol} 실패`);
      }

      // 3. Coinbase API 시도
      try {
        const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${symbol}`);
        if (response.ok) {
          const data = await response.json();
          const usdRate = data.data?.rates?.USD;
          if (usdRate && parseFloat(usdRate) > 0) {
            console.log(`✅ Coinbase ${symbol}: $${usdRate}`);
            return parseFloat(usdRate);
          }
        }
      } catch (error) {
        console.log(`Coinbase ${symbol} 실패`);
      }

      // 최종 fallback 가격 (2025년 1월 24일 기준)
      const fallbackPrices: {[key: string]: number} = {
        'BTC': 119280,    // CryptoCompare 기준 최신
        'ETH': 3730,      // CryptoCompare 기준 최신
        'XRP': 3.234,     // CryptoCompare 기준 최신
        'ADA': 0.8258,    // CryptoCompare 기준 최신
        'DOT': 4.091      // CryptoCompare 기준 최신
      };

      console.log(`⚠️ ${symbol} 최종 fallback 가격 사용: $${fallbackPrices[symbol]}`);
      return fallbackPrices[symbol] || 0;
    }
  }
}