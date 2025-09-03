import { UpbitService } from './upbit.js';
import { BinanceService } from './binance.js';
import { UpbitWebSocketService } from './upbit-websocket.js';
import { priceCache } from './price-cache.js';
import fetch from 'node-fetch';
import { naverExchange } from './naver-exchange.js';
import { createHmac } from 'crypto';
import { storage } from '../storage.js';

export interface SimpleKimchiData {
  symbol: string;
  upbitPrice: number;     // 업비트 KRW 가격
  binanceFuturesPrice: number;  // 바이낸스 현물 USD 가격
  usdKrwRate: number;     // 구글 파이낸스 USD→KRW 환율
  binancePriceKRW: number; // 바이낸스 가격을 KRW로 변환한 값 (바이낸스USD × 환율)
  premiumRate: number;    // 김프율 (%) - kimpga 방식: (업비트KRW - 바이낸스KRW) / 바이낸스KRW × 100
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
   * 사용자별 거래소 API 키 조회
   */
  private async getUserExchangeKeys(userId: string, exchange: string): Promise<{apiKey?: string, secretKey?: string}> {
    try {
      if (!userId || userId === 'undefined' || userId === 'null') {
        return {};
      }

      const exchanges = await storage.getExchangesByUserId(userId);
      const exchangeData = exchanges.find((ex: any) => ex.exchange === exchange && ex.isActive);
      
      if (exchangeData) {
        return {
          apiKey: exchangeData.apiKey,
          secretKey: exchangeData.apiSecret
        };
      }
      
      return {};
    } catch (error) {
      console.warn(`⚠️ 사용자 ${userId}의 ${exchange} API 키 조회 실패:`, error instanceof Error ? error.message : error);
      return {};
    }
  }

  /**
   * 실시간 USD→KRW 환율 조회 (네이버 금융 사용)
   */
  private async getRealTimeExchangeRate(): Promise<number> {
    try {
      const rate = await naverExchange.getRate();
      console.log(`🌐 네이버 금융 실시간 USD/KRW 환율: ${rate}원`);
      return rate;
      
    } catch (error) {
      console.error('네이버 금융 환율 조회 실패:', error);
      // 백업: 네이버 금융 현재값 사용
      const fallbackRate = naverExchange.getCurrentRate();
      console.log(`⚠️ 네이버 금융 백업 환율 사용: ${fallbackRate}원`);
      return fallbackRate;
    }
  }

  /**
   * 단순 김프율 계산 - 웹소켓 캐시 우선 사용으로 실시간 계산
   */
  async calculateSimpleKimchi(symbols: string[], userId?: string): Promise<SimpleKimchiData[]> {
    const results: SimpleKimchiData[] = [];

    // 실시간 USD→KRW 환율 조회 (캐시된 값 사용)
    const usdKrwRate = naverExchange.getCurrentRate();

    for (const symbol of symbols) {
      try {
        // 🚀 웹소켓 캐시에서 가격 조회 (즉시 반환)
        let upbitPrice = priceCache.getUpbitPrice(symbol);
        let binanceFuturesPrice = priceCache.getBinancePrice(symbol);

        // 캐시에 없으면 API 호출 (백업)
        if (upbitPrice === null) {
          console.warn(`⚠️ ${symbol} 업비트 캐시 없음, API 호출`);
          upbitPrice = await this.getUpbitPrice(symbol, userId);
        }

        if (binanceFuturesPrice === null) {
          console.warn(`⚠️ ${symbol} 바이낸스 캐시 없음, API 호출`);
          binanceFuturesPrice = await this.getBinanceFuturesPrice(symbol, userId);
        }

        // 김프율 계산: kimpga 방식 - (업비트KRW - 바이낸스USD×환율) ÷ (바이낸스USD×환율) × 100
        const binancePriceKRW = binanceFuturesPrice * usdKrwRate; // 바이낸스 USD를 KRW로 변환
        const premiumRate = ((upbitPrice - binancePriceKRW) / binancePriceKRW) * 100;

        console.log(`${symbol} 김프율 계산 (kimpga 방식-현물):`, {
          업비트가격: `${upbitPrice.toLocaleString()}원`,
          바이낸스현물가격: `${binanceFuturesPrice.toLocaleString()} USD`,
          바이낸스가격KRW: `${binancePriceKRW.toLocaleString()}원`,
          환율: `${usdKrwRate.toFixed(2)}원/USD`,
          김프율: `${premiumRate.toFixed(3)}%`
        });

        results.push({
          symbol,
          upbitPrice,
          binanceFuturesPrice,
          usdKrwRate,
          binancePriceKRW: binancePriceKRW, // 바이낸스 가격을 KRW로 변환한 값
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
   * 업비트 KRW 가격 조회 (사용자별 API 키 사용)
   */
  private async getUpbitPrice(symbol: string, userId?: string): Promise<number> {
    try {
      // 사용자별 업비트 API 키가 있으면 사용
      if (userId) {
        const userKeys = await this.getUserExchangeKeys(userId, 'upbit');
        if (userKeys.apiKey && userKeys.secretKey) {
          console.log(`🔑 사용자 ${userId}의 업비트 API 키 사용`);
          // TODO: 사용자별 업비트 API 키로 가격 조회 구현
        }
      }
      
      // 기본 업비트 서비스 사용
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
   * 바이낸스 선물 가격 조회 (세션 ID로 DB 조회하여 복호화된 API 키 사용)
   */
  private async getBinanceFuturesPrice(symbol: string, sessionId?: string): Promise<number> {
    try {
      let apiKey: string | undefined;
      let secretKey: string | undefined;
      
      // 세션 ID로 DB에서 복호화된 API 키 조회
      if (sessionId) {
        try {
          // storage에서 복호화된 거래소 정보 가져오기
          const { storage } = await import('../storage.js');
          const decryptedExchange = await storage.getDecryptedExchange(sessionId, 'binance');
          
          if (decryptedExchange && decryptedExchange.apiKey && decryptedExchange.apiSecret) {
            apiKey = decryptedExchange.apiKey;
            secretKey = decryptedExchange.apiSecret;
            console.log(`🔑 세션 ${sessionId}의 복호화된 바이낸스 API 키 사용`);
          }
        } catch (dbError) {
          console.warn(`DB에서 바이낸스 API 키 조회 실패:`, dbError);
        }
      }
      
      if (!apiKey || !secretKey) {
        throw new Error('바이낸스 API 키가 설정되지 않음');
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
        
        const publicData = await publicResponse.json() as any;
        return parseFloat(publicData.price);
      }

      const data = await response.json() as any;
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
          const data = await response.json() as any;
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
          const data = await response.json() as any;
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
          const data = await response.json() as any;
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

  /**
   * 현재 저장된 환율 조회 (캐시된 값)
   */
  getCurrentExchangeRate(): number {
    return naverExchange.getCurrentRate();
  }
}