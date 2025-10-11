/**
 * API 클라이언트 (중앙화된 shared 모듈 사용)
 * @deprecated 이 파일은 호환성을 위해 유지되며, shared/services/api-client.ts를 사용합니다.
 */

import { apiFetchJson } from '@/lib/queryClient';
import {
  ApiClient as SharedApiClient,
  TradingExecutionService as SharedTradingExecutionService,
  type KimchiPremiumData,
  type BalanceData,
  type TradingStrategy
} from '../../../shared/services/api-client';

// Re-export types
export type { KimchiPremiumData, BalanceData, TradingStrategy };

/**
 * 래퍼 클래스 - apiFetchJson을 주입하여 shared API 클라이언트 사용
 */
export class ApiClient {
  static async getKimchiPremium(): Promise<KimchiPremiumData[]> {
    return SharedApiClient.getKimchiPremium(apiFetchJson);
  }

  static async getExchangeRate(): Promise<{ rate: number; timestamp: string; source: string }> {
    return SharedApiClient.getExchangeRate(apiFetchJson);
  }

  static async getUserBalance(userId: string): Promise<BalanceData> {
    return SharedApiClient.getUserBalance(userId, apiFetchJson);
  }

  static async getTradingStrategies(userId?: string): Promise<TradingStrategy[]> {
    return SharedApiClient.getTradingStrategies(apiFetchJson, userId);
  }

  static async createTradingStrategy(userId: string, strategy: Partial<TradingStrategy>): Promise<TradingStrategy> {
    return SharedApiClient.createTradingStrategy(userId, strategy, apiFetchJson);
  }

  static async updateTradingStrategy(strategyId: string, updates: Partial<TradingStrategy>): Promise<TradingStrategy> {
    return SharedApiClient.updateTradingStrategy(strategyId, updates, apiFetchJson);
  }

  static async deleteTradingStrategy(strategyId: string): Promise<{ success: boolean; message: string }> {
    return SharedApiClient.deleteTradingStrategy(strategyId, apiFetchJson);
  }

  static async startAutoTrading(userId: string): Promise<{ success: boolean; message: string }> {
    return SharedApiClient.startAutoTrading(userId, apiFetchJson);
  }

  static async stopAutoTrading(userId: string): Promise<{ success: boolean; message: string }> {
    return SharedApiClient.stopAutoTrading(userId, apiFetchJson);
  }

  static async getTradingStatus(): Promise<{
    isRunning: boolean;
    strategies: TradingStrategy[];
    activeStrategies: number;
  }> {
    return SharedApiClient.getTradingStatus(apiFetchJson);
  }

  static async getExchangeStatus(): Promise<{
    connected: boolean;
    totalExchanges: number;
    connectedExchanges: number;
    exchanges: Record<string, any>;
  }> {
    return SharedApiClient.getExchangeStatus(apiFetchJson);
  }

  static async executeForceEntry(params: {
    symbol: string;
    quantity: number;
    leverage: number;
    currentKimp: number;
    userId: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    return SharedTradingExecutionService.executeForceEntrySimple(params, apiFetchJson);
  }

  static async getDailyStats(userId: string): Promise<{
    date: string;
    total_orders: number;
    entries: number;
    exits: number;
    profit_krw: number;
    fees_krw: number;
    net_profit_krw: number;
  }> {
    return SharedApiClient.getDailyStats(userId, apiFetchJson);
  }

  static async getTrades(userId?: string): Promise<any[]> {
    return SharedApiClient.getTrades(apiFetchJson, userId);
  }

  static async getPositions(userId?: string): Promise<any[]> {
    return SharedApiClient.getPositions(apiFetchJson, userId);
  }
}
