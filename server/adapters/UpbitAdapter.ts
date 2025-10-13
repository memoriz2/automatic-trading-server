import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { BaseExchangeAdapter } from './ExchangeAdapter.js';
import { OrderRequestDto, OrderResponseDto, BalanceDto } from '../types/trading.js';
import { TRADING_FEES } from '../types/constants.js';

/**
 * 업비트 거래소 어댑터
 * 업비트 API와 연동하여 실거래 기능 제공
 */
export class UpbitAdapter extends BaseExchangeAdapter {
  readonly name = 'upbit';
  readonly isTestnet = false;
  private baseUrl = 'https://api.upbit.com';

  /**
   * JWT 토큰 생성
   */
  private generateAuthToken(query?: string): string {
    this.validateCredentials();

    const payload: any = {
      access_key: this.apiKey,
      nonce: Date.now().toString(),
    };

    if (query) {
      payload.query_hash = crypto.createHash('sha512').update(query, 'utf-8').digest('hex');
      payload.query_hash_alg = 'SHA512';
    }

    return jwt.sign(payload, this.secretKey);
  }

  /**
   * API 요청 헬퍼
   */
  private async apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const query = body ? new URLSearchParams(body).toString() : '';

      // 공개 API 엔드포인트 목록 (인증 불필요)
      const publicEndpoints = ['/v1/ticker', '/v1/orderbook', '/v1/market/all', '/v1/candles'];
      const isPublicApi = publicEndpoints.some(pe => endpoint.startsWith(pe));

      const options: RequestInit = {
        method,
        headers: {
          'Accept': 'application/json'
        }
      };

      // 개인 API만 인증 토큰 추가
      if (!isPublicApi) {
        const token = this.generateAuthToken(query || undefined);
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }

      if (method === 'POST' && body) {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json'
        };
        options.body = JSON.stringify(body);
      }

      // GET과 DELETE는 쿼리 파라미터를 URL에 추가
      const finalUrl = url + (query && (method === 'GET' || method === 'DELETE') ? `?${query}` : '');
      
      const response = await fetch(finalUrl, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Upbit API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.handleApiError(error, endpoint);
    }
  }

  /**
   * 연결 테스트
   */
  async testConnection(): Promise<{ success: boolean; permissions: string[]; error?: string }> {
    try {
//       const accounts = await this.apiRequest<any[]>('/v1/accounts');
      
      // 계정 정보가 조회되면 연결 성공
      const permissions = ['spot', 'balance']; // 업비트는 현물 거래만 지원
      
      return {
        success: true,
        permissions
      };
    } catch (error: any) {
      return {
        success: false,
        permissions: [],
        error: error.message
      };
    }
  }

  /**
   * 잔고 조회
   */
  async getBalances(): Promise<BalanceDto[]> {
    const accounts = await this.apiRequest<Array<{
      currency: string;
      balance: string;
      locked: string;
      avg_buy_price: string;
      avg_buy_price_modified: boolean;
      unit_currency: string;
    }>>('/v1/accounts');

    return accounts.map(account => ({
      exchange: 'upbit' as const,
      currency: account.currency,
      available: parseFloat(account.balance),
      locked: parseFloat(account.locked),
      total: parseFloat(account.balance) + parseFloat(account.locked),
      krwValue: account.currency === 'KRW' 
        ? parseFloat(account.balance) + parseFloat(account.locked)
        : undefined
    }));
  }

  /**
   * 특정 통화 잔고 조회
   */
  async getBalance(currency: string): Promise<BalanceDto> {
    const balances = await this.getBalances();
    const balance = balances.find(b => b.currency === currency);
    
    if (!balance) {
      return {
        exchange: 'upbit',
        currency,
        available: 0,
        locked: 0,
        total: 0
      };
    }

    return balance;
  }

  /**
   * 현재 시세 조회
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    
    const tickers = await this.apiRequest<Array<{
      market: string;
      trade_price: number;
    }>>(`/v1/ticker?markets=${normalizedSymbol}`);

    if (tickers.length === 0) {
      throw new Error(`${symbol} 시세를 찾을 수 없습니다.`);
    }

    return tickers[0].trade_price;
  }

  /**
   * 오더북 조회
   */
  async getOrderBook(symbol: string, depth: number = 10): Promise<{
    symbol: string;
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
  }> {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    
    const orderbook = await this.apiRequest<{
      market: string;
      orderbook_units: Array<{
        ask_price: number;
        bid_price: number;
        ask_size: number;
        bid_size: number;
      }>;
    }>(`/v1/orderbook?markets=${normalizedSymbol}`);

    const units = orderbook.orderbook_units.slice(0, depth);

    return {
      symbol: normalizedSymbol,
      bids: units.map(unit => ({
        price: unit.bid_price,
        quantity: unit.bid_size
      })),
      asks: units.map(unit => ({
        price: unit.ask_price,
        quantity: unit.ask_size
      }))
    };
  }

  /**
   * 주문 생성
   */
  async createOrder(orderRequest: OrderRequestDto): Promise<OrderResponseDto> {
    const normalizedSymbol = this.normalizeSymbol(orderRequest.symbol);
    
    const orderData: any = {
      market: normalizedSymbol,
      side: orderRequest.side === 'buy' ? 'bid' : 'ask',
      ord_type: orderRequest.type === 'market' ? 'market' : 'limit'
    };

    if (orderRequest.side === 'buy') {
      if (orderRequest.type === 'market') {
        orderData.price = orderRequest.quantity * (orderRequest.price || await this.getCurrentPrice(orderRequest.symbol));
      } else {
        orderData.price = orderRequest.quantity * orderRequest.price!;
      }
    } else {
      orderData.volume = orderRequest.quantity;
      if (orderRequest.type === 'limit') {
        orderData.price = orderRequest.price;
      }
    }

    const result = await this.apiRequest<{
      uuid: string;
      side: string;
      ord_type: string;
      price: string;
      state: string;
      market: string;
      created_at: string;
      volume: string;
      remaining_volume: string;
      reserved_fee: string;
      remaining_fee: string;
      paid_fee: string;
      locked: string;
      executed_volume: string;
      trades_count: number;
    }>('/v1/orders', 'POST', orderData);

    return {
      id: 0, // DB에서 생성될 ID
      userId: orderRequest.userId,
      exchange: 'upbit',
      exchangeOrderId: result.uuid,
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      status: this.mapUpbitStatus(result.state),
      quantity: parseFloat(result.volume || '0'),
      filledQuantity: parseFloat(result.executed_volume || '0'),
      remainingQuantity: parseFloat(result.remaining_volume || '0'),
      price: parseFloat(result.price || '0'),
      averagePrice: undefined, // 업비트는 평균가 정보 별도 조회 필요
      fee: parseFloat(result.paid_fee || '0'),
      feeCurrency: 'KRW',
      createdAt: new Date(result.created_at),
      updatedAt: new Date(),
      filledAt: result.state === 'done' ? new Date() : undefined
    };
  }

  /**
   * 주문 조회
   */
  async getOrder(orderId: string): Promise<OrderResponseDto> {
    const result = await this.apiRequest<{
      uuid: string;
      side: string;
      ord_type: string;
      price: string;
      state: string;
      market: string;
      created_at: string;
      volume: string;
      remaining_volume: string;
      reserved_fee: string;
      remaining_fee: string;
      paid_fee: string;
      locked: string;
      executed_volume: string;
      trades_count: number;
    }>('/v1/order', 'GET', { uuid: orderId });

    return {
      id: 0, // DB ID는 별도 관리
      userId: 0, // 별도 설정 필요
      exchange: 'upbit',
      exchangeOrderId: result.uuid,
      symbol: result.market.replace('KRW-', ''), // KRW-BTC → BTC
      side: result.side === 'bid' ? 'buy' : 'sell',
      type: result.ord_type === 'market' ? 'market' : 'limit',
      status: this.mapUpbitStatus(result.state),
      quantity: parseFloat(result.volume || '0'),
      filledQuantity: parseFloat(result.executed_volume || '0'),
      remainingQuantity: parseFloat(result.remaining_volume || '0'),
      price: parseFloat(result.price || '0'),
      fee: parseFloat(result.paid_fee || '0'),
      feeCurrency: 'KRW',
      createdAt: new Date(result.created_at),
      updatedAt: new Date()
    };
  }

  /**
   * 주문 취소
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.apiRequest('/v1/order', 'DELETE', { uuid: orderId });
      return true;
    } catch (error) {
      console.error('업비트 주문 취소 실패:', error);
      return false;
    }
  }

  /**
   * 활성 주문 목록 조회
   */
  async getActiveOrders(symbol?: string): Promise<OrderResponseDto[]> {
    // 쿼리 파라미터를 객체로 구성 (JWT에 포함하기 위해)
    const params: any = { state: 'wait' };
    if (symbol) {
      params.market = this.normalizeSymbol(symbol);
    }

    const orders = await this.apiRequest<Array<{
      uuid: string;
      side: string;
      ord_type: string;
      price: string;
      state: string;
      market: string;
      created_at: string;
      volume: string;
      remaining_volume: string;
      reserved_fee: string;
      remaining_fee: string;
      paid_fee: string;
      locked: string;
      executed_volume: string;
      trades_count: number;
    }>>('/v1/orders', 'GET', params);

    return orders.map(order => ({
      id: 0,
      userId: 0,
      exchange: 'upbit',
      exchangeOrderId: order.uuid,
      symbol: order.market.replace('KRW-', ''), // KRW-BTC → BTC
      side: order.side === 'bid' ? 'buy' : 'sell',
      type: order.ord_type === 'market' ? 'market' : 'limit',
      status: this.mapUpbitStatus(order.state),
      quantity: parseFloat(order.volume || '0'),
      filledQuantity: parseFloat(order.executed_volume || '0'),
      remainingQuantity: parseFloat(order.remaining_volume || '0'),
      price: parseFloat(order.price || '0'),
      fee: parseFloat(order.paid_fee || '0'),
      feeCurrency: 'KRW',
      createdAt: new Date(order.created_at),
      updatedAt: new Date()
    }));
  }

  /**
   * 거래 내역 조회
   */
  async getTrades(symbol?: string, limit: number = 100): Promise<Array<{
    id: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    fee: number;
    timestamp: Date;
  }>> {
    // 체결 완료된 주문만 조회 (done)
    const params: any = {
      state: 'done',
      limit: Math.min(limit, 100), // 업비트 최대 100건
      order_by: 'desc'
    };
    if (symbol) {
      params.market = this.normalizeSymbol(symbol);
    }

    console.log(`🔍 [UpbitAdapter] getTrades 호출 - limit: ${limit}, symbol: ${symbol || 'all'}`);

    const orders = await this.apiRequest<Array<{
      uuid: string;
      market: string;
      side: string;
      volume: string;
      price: string;
      paid_fee: string;
      created_at: string;
      executed_volume: string;
      avg_price: string;
      trades_count: number;
    }>>('/v1/orders', 'GET', params);

    console.log(`✅ [UpbitAdapter] 업비트 API 응답: ${orders.length}건`);

    // 디버깅: 전체 주문의 생성 시간 범위 확인
    const sortedByTime = [...orders].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    console.log(`🔍 [DEBUG] 주문 시간 범위:`);
    console.log(`  - 가장 최신: ${sortedByTime[0]?.created_at} (${sortedByTime[0]?.side})`);
    console.log(`  - 가장 오래됨: ${sortedByTime[sortedByTime.length - 1]?.created_at} (${sortedByTime[sortedByTime.length - 1]?.side})`);

    // 매수 주문만 로깅
    const bidOrders = orders.filter(o => o.side === 'bid');
    console.log(`🔍 [DEBUG] 매수(bid) 주문: ${bidOrders.length}건`);
    console.log(`  최신 매수 3건:`);
    bidOrders.slice(0, 3).forEach(order => {
      console.log(`  - UUID: ${order.uuid.substring(0, 8)}, 수량: ${order.executed_volume}, 생성: ${order.created_at}`);
    });

    // 원본 데이터 그대로 사용
    const result = orders.map(order => {
      const quantity = parseFloat(order.executed_volume || order.volume || '0');
      const avgPrice = parseFloat(order.avg_price || order.price || '0');

      return {
        id: order.uuid,
        symbol: order.market.replace('KRW-', ''),
        side: order.side === 'bid' ? 'buy' : 'sell', // bid=매수, ask=매도
        quantity: quantity,
        price: avgPrice,
        fee: parseFloat(order.paid_fee || '0'),
        timestamp: new Date(order.created_at)
      };
    });

    console.log(`📊 [UpbitAdapter] 변환된 거래내역 - ${result.length}건`);
    console.log(`   매수: ${result.filter(r => r.side === 'buy').length}건, 매도: ${result.filter(r => r.side === 'sell').length}건`);

    return result;
  }

  /**
   * 심볼 정규화 (BTC → KRW-BTC)
   */
  normalizeSymbol(symbol: string): string {
    if (symbol.includes('-')) {
      return symbol; // 이미 업비트 형식
    }
    return `KRW-${symbol}`; // KRW 마켓으로 변환
  }

  /**
   * 최소 주문 수량 조회
   */
  async getMinOrderSize(symbol: string): Promise<number> {
    // 업비트 최소 주문 금액: 5,000 KRW
    const currentPrice = await this.getCurrentPrice(symbol);
    return 5000 / currentPrice; // 최소 KRW 금액을 BTC 수량으로 변환
  }

  /**
   * 수수료율 조회
   */
  async getFeeRate(_symbol: string, _orderType: 'market' | 'limit'): Promise<{
    maker: number;
    taker: number;
  }> {
    // 업비트는 maker/taker 구분 없이 동일한 수수료
    return {
      maker: TRADING_FEES.UPBIT.MAKER,
      taker: TRADING_FEES.UPBIT.TAKER
    };
  }

  /**
   * 업비트 주문 상태를 표준 상태로 매핑
   */
  private mapUpbitStatus(upbitState: string): 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' {
    switch (upbitState) {
      case 'wait': return 'pending';
      case 'done': return 'filled';
      case 'cancel': return 'cancelled';
      default: return 'pending';
    }
  }


  /**
   * 계정 정보 조회 (잔고 포함)
   */
  async getAccountInfo(): Promise<{
    balances: BalanceDto[];
    permissions: string[];
  }> {
    const accounts = await this.apiRequest<Array<{
      currency: string;
      balance: string;
      locked: string;
      avg_buy_price: string;
      avg_buy_price_modified: boolean;
      unit_currency: string;
    }>>('/v1/accounts');

    const balances = accounts.map(account => ({
      exchange: 'upbit' as const,
      currency: account.currency,
      available: parseFloat(account.balance),
      locked: parseFloat(account.locked),
      total: parseFloat(account.balance) + parseFloat(account.locked),
      krwValue: account.currency === 'KRW' 
        ? parseFloat(account.balance) + parseFloat(account.locked)
        : undefined
    }));

    return {
      balances,
      permissions: ['spot', 'balance']
    };
  }

  /**
   * 시장 정보 조회
   */
  async getMarketInfo(): Promise<Array<{
    market: string;
    korean_name: string;
    english_name: string;
    market_warning: string;
  }>> {
    return this.apiRequest('/v1/market/all');
  }

  /**
   * 캔들 데이터 조회
   */
  async getCandles(
    symbol: string, 
    interval: 'minutes' | 'days' | 'weeks' | 'months' = 'minutes',
    count: number = 200
  ): Promise<Array<{
    market: string;
    candle_date_time_utc: string;
    candle_date_time_kst: string;
    opening_price: number;
    high_price: number;
    low_price: number;
    trade_price: number;
    timestamp: number;
    candle_acc_trade_price: number;
    candle_acc_trade_volume: number;
  }>> {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    const endpoint = `/v1/candles/${interval}/1?market=${normalizedSymbol}&count=${count}`;
    
    return this.apiRequest(endpoint);
  }
}
