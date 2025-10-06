/**
 * 통합 API 클라이언트 서비스
 * 모든 API 호출을 중앙화하여 관리
 */

import { apiFetchJson } from '@/lib/queryClient';

export interface KimchiPremiumData {
  symbol: string;
  upbitPrice: number;
  binanceFuturesPrice: number;
  usdKrwRate: number;
  premiumRate: number;
  timestamp: string;
}

export interface BalanceData {
  upbit: {
    krw: number;
    connected: boolean;
  };
  binance: {
    usdt: number;
    connected: boolean;
  };
}

export interface TradingStrategy {
  id: number;
  name: string;
  entryCondition: number;
  takeProfitCondition: number;
  tolerance: number;
  leverage: string;
  investmentAmount: string;
  isActive: boolean;
  crypto: string;
  strategyType: string;
}

export class ApiClient {
  /**
   * 김치 프리미엄 조회
   */
  static async getKimchiPremium(): Promise<KimchiPremiumData[]> {
    return await apiFetchJson('/api/kimchi-premium');
  }

  /**
   * 실시간 환율 조회
   */
  static async getExchangeRate(): Promise<{ rate: number; timestamp: string; source: string }> {
    return await apiFetchJson('/api/exchange-rate');
  }

  /**
   * 사용자 잔고 조회
   */
  static async getUserBalance(userId: string): Promise<BalanceData> {
    return await apiFetchJson(`/api/balances/${userId}`);
  }

  /**
   * 거래 전략 목록 조회
   */
  static async getTradingStrategies(userId?: string): Promise<TradingStrategy[]> {
    const endpoint = userId ? `/api/trading-strategies/${userId}` : '/api/trading-strategies';
    return await apiFetchJson(endpoint);
  }

  /**
   * 거래 전략 생성
   */
  static async createTradingStrategy(userId: string, strategy: Partial<TradingStrategy>): Promise<TradingStrategy> {
    return await apiFetchJson(`/api/trading-strategies/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy)
    });
  }

  /**
   * 거래 전략 업데이트
   */
  static async updateTradingStrategy(strategyId: string, updates: Partial<TradingStrategy>): Promise<TradingStrategy> {
    return await apiFetchJson(`/api/trading-strategies/${strategyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }

  /**
   * 거래 전략 삭제
   */
  static async deleteTradingStrategy(strategyId: string): Promise<{ success: boolean; message: string }> {
    return await apiFetchJson(`/api/trading-strategies/${strategyId}`, {
      method: 'DELETE'
    });
  }

  /**
   * 자동매매 시작
   */
  static async startAutoTrading(userId: string): Promise<{ success: boolean; message: string }> {
    return await apiFetchJson(`/api/trading/start/${userId}`, {
      method: 'POST'
    });
  }

  /**
   * 자동매매 중지
   */
  static async stopAutoTrading(userId: string): Promise<{ success: boolean; message: string }> {
    return await apiFetchJson(`/api/trading/stop/${userId}`, {
      method: 'POST'
    });
  }

  /**
   * 자동매매 상태 조회
   */
  static async getTradingStatus(): Promise<{
    isRunning: boolean;
    strategies: TradingStrategy[];
    activeStrategies: number;
  }> {
    return await apiFetchJson('/api/trading/status');
  }

  /**
   * 거래소 연결 상태 확인
   */
  static async getExchangeStatus(): Promise<{
    connected: boolean;
    totalExchanges: number;
    connectedExchanges: number;
    exchanges: Record<string, any>;
  }> {
    return await apiFetchJson('/api/v2/exchanges/status');
  }

  /**
   * 강제 진입 실행
   */
  static async executeForceEntry(params: {
    symbol: string;
    quantity: number;
    leverage: number;
    currentKimp: number;
    userId: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    return await apiFetchJson('/api/force-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  }

  /**
   * 일일 통계 조회
   */
  static async getDailyStats(userId: string): Promise<{
    date: string;
    total_orders: number;
    entries: number;
    exits: number;
    profit_krw: number;
    fees_krw: number;
    net_profit_krw: number;
  }> {
    return await apiFetchJson(`/api/daily-stats/${userId}`);
  }

  /**
   * 거래 기록 조회
   */
  static async getTrades(userId?: string): Promise<any[]> {
    const endpoint = userId ? `/api/trades?userId=${userId}` : '/api/trades';
    return await apiFetchJson(endpoint);
  }

  /**
   * 포지션 목록 조회
   */
  static async getPositions(userId?: string): Promise<any[]> {
    const endpoint = userId ? `/api/positions?userId=${userId}` : '/api/positions';
    return await apiFetchJson(endpoint);
  }
}
