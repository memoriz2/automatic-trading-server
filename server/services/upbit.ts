import crypto from 'crypto';
// @ts-ignore
import jwt from 'jsonwebtoken';
import { TRADING_CONSTANTS } from '../types/constants.js';
import { ErrorHandler} from '../utils/error-handler.js';

export interface UpbitTicker {
  market: string;
  trade_price: number;
  timestamp: number;
}

export interface UpbitOrderbook {
  market: string;
  orderbook_units: Array<{
    ask_price: number;
    bid_price: number;
    ask_size: number;
    bid_size: number;
  }>;
}

export class UpbitService {
  private baseUrl = 'https://api.upbit.com';
  private accessKey: string;
  private secretKey: string;

  constructor(accessKey?: string, secretKey?: string) {
    this.accessKey = accessKey || process.env.UPBIT_ACCESS_KEY || '';
    this.secretKey = secretKey || process.env.UPBIT_SECRET_KEY || '';
  }

  private generateAuthToken(query?: string): string {
    if (!this.accessKey || !this.secretKey) {
      throw new Error('Upbit API keys not configured');
    }

    const payload: any = {
      access_key: this.accessKey,
      nonce: Date.now().toString(),
    };

    if (query) {
      payload.query_hash = crypto.createHash('sha512').update(query, 'utf-8').digest('hex');
      payload.query_hash_alg = 'SHA512';
    }

    return jwt.sign(payload, this.secretKey);
  }

  async getTicker(markets: string[]): Promise<UpbitTicker[]> {
    try {
      const marketString = markets.join(',');
      const response = await fetch(`${this.baseUrl}/v1/ticker?markets=${marketString}`);

      if (!response.ok) {
        if (response.status === 429) {
          throw ErrorHandler.rateLimitExceeded('upbit', 'ticker');
        }
        throw ErrorHandler.connectionFailed('upbit');
      }

      return await response.json();
    } catch (error) {
      const standardError = ErrorHandler.fromError(error, {
        operation: 'getTicker',
        exchange: 'upbit'
      });

      ErrorHandler.logError(standardError);
      throw standardError;
    }
  }

  async getOrderbook(markets: string[]): Promise<UpbitOrderbook[]> {
    try {
      const marketString = markets.join(',');
      const response = await fetch(`${this.baseUrl}/v1/orderbook?markets=${marketString}`);
      
      if (!response.ok) {
        throw new Error(`Upbit API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upbit getOrderbook error:', error);
      throw error;
    }
  }

  // 중복된 getAccounts 메서드 제거 - 아래쪽에 올바른 메서드가 있음

  async getKRWBalance(): Promise<number> {
    try {
      const accounts = await this.getAccounts();
      const krwAccount = accounts.find(account => account.currency === 'KRW');
      if (!krwAccount) return 0;
      
      // 사용가능한 잔고 = 총 잔고 - 잠긴 잔고
      const totalBalance = parseFloat(krwAccount.balance);
      const lockedBalance = parseFloat(krwAccount.locked || 0);
      return totalBalance - lockedBalance;
    } catch (error) {
      console.error('Upbit getKRWBalance error:', error);
      return 0;
    }
  }

  async getMarkets(): Promise<Array<{ market: string; korean_name: string; english_name: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/market/all`);
      
      if (!response.ok) {
        throw new Error(`Upbit API error: ${response.status}`);
      }

      const markets = await response.json();
      return markets.filter((market: any) => market.market.startsWith('KRW-'));
    } catch (error) {
      console.error('Upbit getMarkets error:', error);
      throw error;
    }
  }

  // 현재가 조회
  async getCurrentPrice(market: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/ticker?markets=${market}`);

      if (!response.ok) {
        throw new Error(`Upbit API error: ${response.status}`);
      }

      const ticker = await response.json();
      if (ticker && ticker[0] && ticker[0].trade_price) {
        return ticker[0].trade_price;
      }

      throw new Error('가격 정보를 찾을 수 없습니다');
    } catch (error) {
      console.error('Upbit getCurrentPrice error:', error);
      throw error;
    }
  }

  async getAccounts(): Promise<any[]> {
    try {
      const authToken = this.generateAuthToken();
      
      const response = await fetch(`${this.baseUrl}/v1/accounts`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upbit API response:', response.status, errorText);
        throw new Error(`Upbit API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upbit getAccounts error:', error);
      throw error;
    }
  }

  private async sendRequest(endpoint: string, method: 'GET' | 'POST' | 'DELETE', params: any = {}): Promise<any> {
    const url = `${this.baseUrl}/v1/${endpoint}`;
    const nonNilParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));
    
    // Convert all param values to strings for URLSearchParams
    const stringParams: Record<string, string> = {};
    for (const key in nonNilParams) {
      stringParams[key] = String(nonNilParams[key]);
    }
    
    const queryString = new URLSearchParams(stringParams).toString();
    const authToken = this.generateAuthToken(queryString || undefined);

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
    };

    let fullUrl = url;
    if (method === 'GET' || method === 'DELETE') {
      if (queryString) fullUrl += `?${queryString}`;
    } else if (method === 'POST') {
      // Upbit API는 POST도 form data로 전송
      options.body = JSON.stringify(nonNilParams);
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
    }

    const response = await fetch(fullUrl, options);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Upbit API error (${response.status}): ${errorBody}`);
    }

    return response.json();
  }

  // 지정가 매수
  async placeBuyOrder(market: string, price: number, orderType: 'limit' | 'price' = 'price'): Promise<any> {
    try {
      const params: any = {
        market,
        side: 'bid',
        ord_type: orderType,
      };
      if (orderType === 'limit') {
        params.price = price.toString();
      } else {
        params.price = price.toString(); // 시장가 매수 시 총액
      }
      const result = await this.sendRequest('orders', 'POST', params);

      // 🔍 응답 구조 로그 (디버깅용)
      console.log('📊 [placeBuyOrder] API 응답 구조:', {
        hasUuid: !!result.uuid,
        uuid: result.uuid || 'N/A',
        keys: Object.keys(result)
      });

      return result;
    } catch (error) {
      console.error('Upbit placeBuyOrder error:', error);
      throw new Error(`주문 조회 실패: ${(error as Error).message}`);
    }
  }

  // 주문 상세 조회 (체결가 확인용)
  async getOrderDetail(uuid: string): Promise<any> {
    try {
      const params = { uuid };
      return this.sendRequest('order', 'GET', params);
    } catch (error) {
      console.error('Upbit getOrderDetail error:', error);
      throw new Error(`주문 상세 조회 실패: ${(error as Error).message}`);
    }
  }

  async placeSellOrder(market: string, volume: number, orderType: 'market' | 'limit' = 'market', retries: number = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 업비트 매도 시도 ${attempt}/${retries}: ${market}, ${volume} ${market.split('-')[1]}`);
        
        // 수량 유효성 검사
        if (!volume || volume <= 0 || isNaN(volume)) {
          throw new Error(`잘못된 매도 수량: ${volume}`);
        }
        
        // BTC 최소 거래 단위 검사
        if (volume < TRADING_CONSTANTS.BTC_MIN_QUANTITY) {
          throw ErrorHandler.invalidOrderSize(
            'upbit',
            market,
            volume,
            TRADING_CONSTANTS.BTC_MIN_QUANTITY,
            'BTC'
          );
        }
        
        const params: any = {
          market,
          side: 'ask',
          volume: parseFloat(volume.toFixed(8)).toString(), // BTC는 8자리 정밀도
          ord_type: orderType,
        };
        
        if (orderType === 'limit') {
          // 지정가 매도의 경우 현재가 조회해서 가격 설정
          const ticker = await this.getTicker([market]);
          const currentPrice = ticker[0]?.trade_price || 0;
          if (currentPrice > 0) {
            params.price = Math.floor(currentPrice * 0.999).toString(); // 0.1% 낮은 가격으로 즉시 체결 유도
          } else {
            throw new Error('현재가 조회 실패로 지정가 매도 불가');
          }
        }
        
        // 최소 거래 금액 확인 (시장가 매도의 경우)
        if (orderType === 'market') {
          const ticker = await this.getTicker([market]);
          const currentPrice = ticker[0]?.trade_price || 0;
          const tradeAmount = volume * currentPrice;
          
          console.log(`💰 거래 금액 계산: ${volume} ${market.split('-')[1]} × ${currentPrice.toLocaleString()}원 = ${tradeAmount.toLocaleString()}원`);
          
          if (tradeAmount < 5000) {
            throw new Error(`최소 거래 금액 미달: ${tradeAmount.toLocaleString()}원 < 5,000원`);
          }
        }
        
        console.log(`📊 업비트 매도 주문:`, params);
        const result = await this.sendRequest('orders', 'POST', params);
        console.log(`✅ 업비트 매도 성공 (${attempt}번째 시도):`, result);
        return result;
        
      } catch (error: any) {
        console.error(`❌ 업비트 매도 실패 (${attempt}/${retries}):`, error?.message);
        
        // 429 (호출 제한), 500 (서버 오류), timeout 인 경우만 재시도
        const shouldRetry = attempt < retries && (
          error?.message?.includes('429') || 
          error?.message?.includes('500') ||
          error?.message?.includes('timeout') ||
          error?.message?.includes('ECONNRESET') ||
          error?.message?.includes('ETIMEDOUT')
        );
        
        if (shouldRetry) {
          const delay = attempt * 2000; // 2초, 4초, 6초
          console.log(`⏳ ${delay}ms 후 업비트 매도 재시도...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // 최종 실패 또는 재시도 불가능한 에러
        console.error(`❌ 업비트 매도 최종 실패 - 마켓: ${market}, 수량: ${volume}:`, error);
        throw error;
      }
    }
  }

  async cancelOrder(uuid: string): Promise<any> {
    const params = { uuid };
    return this.sendRequest('order', 'DELETE', params);
  }
}
