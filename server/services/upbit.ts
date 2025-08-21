import crypto from 'crypto';
import jwt from 'jsonwebtoken';

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
        throw new Error(`Upbit API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upbit getTicker error:', error);
      throw error;
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
      return krwAccount ? parseFloat(krwAccount.balance) : 0;
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

  async placeBuyOrder(market: string, price: number, orderType: 'limit' | 'price' = 'price'): Promise<any> {
    try {
      const params = {
        market,
        side: 'bid',
        ord_type: orderType,
        ...(orderType === 'price' ? { price: price.toString() } : { volume: '0', price: price.toString() })
      };

      const query = new URLSearchParams(params).toString();
      const authToken = this.generateAuthToken(query);
      
      const response = await fetch(`${this.baseUrl}/v1/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Upbit order error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upbit placeBuyOrder error:', error);
      throw error;
    }
  }

  async placeSellOrder(market: string, volume: number): Promise<any> {
    try {
      const params = {
        market,
        side: 'ask',
        ord_type: 'market',
        volume: volume.toString()
      };

      const query = new URLSearchParams(params).toString();
      const authToken = this.generateAuthToken(query);
      
      const response = await fetch(`${this.baseUrl}/v1/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Upbit order error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upbit placeSellOrder error:', error);
      throw error;
    }
  }

  // 새로운 김프 전략용 메소드들

  // KRW 현물 매수 (김프 차익거래용)
  async placeBuyOrder(market: string, amount: number, orderType: 'price' | 'market' = 'price'): Promise<any> {
    try {
      if (!this.accessKey) {
        throw new Error('Upbit API key not configured');
      }

      const body = {
        market,
        side: 'bid',
        ord_type: orderType,
        ...(orderType === 'price' ? { price: amount.toString() } : { volume: amount.toString() })
      };

      const queryString = Object.entries(body)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      const token = this.generateAuthToken(queryString);
      
      const response = await fetch('https://api.upbit.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upbit buy order error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upbit placeBuyOrder error:', error);
      throw error;
    }
  }

  // KRW 현물 매도 (김프 차익거래용)
  async placeSellOrder(market: string, quantity: number): Promise<any> {
    try {
      if (!this.accessKey) {
        throw new Error('Upbit API key not configured');
      }

      const body = {
        market,
        side: 'ask',
        ord_type: 'market',
        volume: quantity.toString()
      };

      const queryString = Object.entries(body)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      const token = this.generateAuthToken(queryString);
      
      const response = await fetch('https://api.upbit.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upbit sell order error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upbit placeSellOrder error:', error);
      throw error;
    }
  }
}
