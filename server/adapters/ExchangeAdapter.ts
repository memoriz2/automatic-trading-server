import { OrderRequestDto, OrderResponseDto, BalanceDto } from '../types/trading.js';

/**
 * 거래소 어댑터 인터페이스
 * 모든 거래소 구현체가 따라야 하는 공통 인터페이스
 */
export interface ExchangeAdapter {
  readonly name: string;
  readonly isTestnet: boolean;

  // ===== 연결 관리 =====
  
  /**
   * API 키 설정
   */
  setCredentials(apiKey: string, secretKey: string, passphrase?: string): void;

  /**
   * 연결 테스트
   */
  testConnection(): Promise<{
    success: boolean;
    permissions: string[];
    error?: string;
  }>;

  // ===== 잔고 관리 =====

  /**
   * 계정 잔고 조회
   */
  getBalances(): Promise<BalanceDto[]>;

  /**
   * 특정 통화 잔고 조회
   */
  getBalance(currency: string): Promise<BalanceDto>;

  // ===== 시장 데이터 =====

  /**
   * 현재 시세 조회
   */
  getCurrentPrice(symbol: string): Promise<number>;

  /**
   * 오더북 조회
   */
  getOrderBook(symbol: string, depth?: number): Promise<{
    symbol: string;
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
  }>;

  // ===== 주문 관리 =====

  /**
   * 주문 생성
   */
  createOrder(orderRequest: OrderRequestDto): Promise<OrderResponseDto>;

  /**
   * 주문 조회
   */
  getOrder(orderId: string): Promise<OrderResponseDto>;

  /**
   * 주문 취소
   */
  cancelOrder(orderId: string): Promise<boolean>;

  /**
   * 활성 주문 목록 조회
   */
  getActiveOrders(symbol?: string): Promise<OrderResponseDto[]>;

  // ===== 거래 내역 =====

  /**
   * 거래 내역 조회
   */
  getTrades(symbol?: string, limit?: number): Promise<Array<{
    id: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    fee: number;
    timestamp: Date;
  }>>;

  // ===== 포지션 관리 (선물 거래소용) =====

  /**
   * 포지션 조회 (선물 거래소만)
   */
  getPositions?(symbol?: string): Promise<Array<{
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    markPrice: number;
    unrealizedPnl: number;
    leverage: number;
  }>>;

  /**
   * 레버리지 설정 (선물 거래소만)
   */
  setLeverage?(symbol: string, leverage: number): Promise<boolean>;

  // ===== 유틸리티 =====

  /**
   * 심볼 정규화 (거래소별 형식으로 변환)
   */
  normalizeSymbol(symbol: string): string;

  /**
   * 최소 주문 수량 조회
   */
  getMinOrderSize(symbol: string): Promise<number>;

  /**
   * 수수료율 조회
   */
  getFeeRate(symbol: string, orderType: 'market' | 'limit'): Promise<{
    maker: number;
    taker: number;
  }>;
}

/**
 * 거래소 어댑터 기본 클래스
 */
export abstract class BaseExchangeAdapter implements ExchangeAdapter {
  protected apiKey: string = '';
  protected secretKey: string = '';
  protected passphrase?: string;

  abstract readonly name: string;
  abstract readonly isTestnet: boolean;

  setCredentials(apiKey: string, secretKey: string, passphrase?: string): void {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.passphrase = passphrase;
  }

  protected validateCredentials(): void {
    if (!this.apiKey || !this.secretKey) {
      throw new Error(`${this.name} API 키가 설정되지 않았습니다.`);
    }
  }

  protected handleApiError(error: any, context: string): never {
    console.error(`❌ ${this.name} API 오류 (${context}):`, error);
    
    if (error.response?.status === 401) {
      throw new Error('API 키 인증에 실패했습니다. API 키를 확인해주세요.');
    } else if (error.response?.status === 403) {
      throw new Error('API 권한이 부족합니다. 거래 권한을 확인해주세요.');
    } else if (error.response?.status === 429) {
      throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    } else {
      throw new Error(`${this.name} API 오류: ${error.message || '알 수 없는 오류'}`);
    }
  }

  // 추상 메서드들 - 각 거래소에서 구현해야 함
  abstract testConnection(): Promise<{ success: boolean; permissions: string[]; error?: string }>;
  abstract getBalances(): Promise<BalanceDto[]>;
  abstract getBalance(currency: string): Promise<BalanceDto>;
  abstract getCurrentPrice(symbol: string): Promise<number>;
  abstract getOrderBook(symbol: string, depth?: number): Promise<{
    symbol: string;
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
  }>;
  abstract createOrder(orderRequest: OrderRequestDto): Promise<OrderResponseDto>;
  abstract getOrder(orderId: string): Promise<OrderResponseDto>;
  abstract cancelOrder(orderId: string): Promise<boolean>;
  abstract getActiveOrders(symbol?: string): Promise<OrderResponseDto[]>;
  abstract getTrades(symbol?: string, limit?: number): Promise<Array<{
    id: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    fee: number;
    timestamp: Date;
  }>>;
  abstract normalizeSymbol(symbol: string): string;
  abstract getMinOrderSize(symbol: string): Promise<number>;
  abstract getFeeRate(symbol: string, orderType: 'market' | 'limit'): Promise<{
    maker: number;
    taker: number;
  }>;
}

/**
 * 거래소 어댑터 팩토리
 */
export class ExchangeAdapterFactory {
  private static adapters: Map<string, ExchangeAdapter> = new Map();

  /**
   * 어댑터 등록
   */
  static register(name: string, adapter: ExchangeAdapter): void {
    this.adapters.set(name, adapter);
  }

  /**
   * 어댑터 조회
   */
  static get(name: string): ExchangeAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`지원하지 않는 거래소입니다: ${name}`);
    }
    return adapter;
  }

  /**
   * 지원하는 거래소 목록
   */
  static getSupportedExchanges(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * 모든 어댑터 조회
   */
  static getAll(): Map<string, ExchangeAdapter> {
    return new Map(this.adapters);
  }
}
