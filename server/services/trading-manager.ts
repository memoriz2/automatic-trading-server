// ===== 거래 서비스 매니저 (환경별 분기) =====

import { TRADING_CONFIG, isMockMode, isRealTradingMode } from '../config/trading-config.js';
import { UpbitService } from './upbit.js';
import { BinanceService } from './binance.js';
import { storage } from '../storage.js';

export interface TradingResult {
  success: boolean;
  orderId?: string;
  message: string;
  data?: any;
}

export class TradingManager {
  private upbitService?: UpbitService;
  private binanceService?: BinanceService;

  constructor() {
    console.log(`🎯 TradingManager 초기화: ${TRADING_CONFIG.tradingMode} 모드`);
  }

  // 사용자별 거래소 서비스 초기화
  private async initializeServices(userId: number): Promise<{ upbit?: UpbitService; binance?: BinanceService }> {
    if (isMockMode()) {
      console.log(`🛡️  Mock 모드: 실제 API 서비스 초기화 건너뛰기`);
      return {}; // Mock 모드에서는 실제 서비스 불필요
    }

    try {
      const exchanges = await storage.getExchangesByUserId(userId);
      const services: { upbit?: UpbitService; binance?: BinanceService } = {};

      // 업비트 서비스 초기화
      const upbitExchange = exchanges.find((ex: any) => ex.exchange === 'upbit' && ex.isActive);
      if (upbitExchange?.apiKey && upbitExchange?.apiSecret) {
        services.upbit = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
        console.log(`✅ 업비트 서비스 초기화 완료 (사용자: ${userId})`);
      }

      // 바이낸스 서비스 초기화
      const binanceExchange = exchanges.find((ex: any) => ex.exchange === 'binance' && ex.isActive);
      if (binanceExchange?.apiKey && binanceExchange?.apiSecret) {
        services.binance = new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
        console.log(`✅ 바이낸스 서비스 초기화 완료 (사용자: ${userId})`);
      }

      return services;
    } catch (error) {
      console.error(`❌ 거래소 서비스 초기화 실패 (사용자: ${userId}):`, error);
      return {};
    }
  }

  // 강제진입 실행 (환경별 분기)
  async executeForceEntry(userId: number, params: {
    symbol: string;
    quantity: number;
    leverage: number;
    currentKimp: number;
  }): Promise<TradingResult> {
    
    if (isMockMode()) {
      return this.executeMockForceEntry(userId, params);
    } else {
      return this.executeRealForceEntry(userId, params);
    }
  }

  // Mock 강제진입
  private async executeMockForceEntry(userId: number, params: any): Promise<TradingResult> {
    console.log(`🛡️  Mock 강제진입 실행:`, params);
    
    // Mock 데이터로 포지션 생성
    const mockPosition = {
      userId,
      symbol: params.symbol,
      type: 'force_entry',
      entryPrice: 156000000, // Mock BTC 가격
      quantity: params.quantity,
      entryPremiumRate: params.currentKimp,
      currentPremiumRate: params.currentKimp,
      status: 'open',
      side: 'long',
      isMock: true,
      leverage: params.leverage
    };

    try {
      const savedPosition = await storage.createPosition(mockPosition);
      
      return {
        success: true,
        message: `Mock 강제진입 완료`,
        data: {
          position: savedPosition,
          strategyName: `강제진입${savedPosition.id}`
        }
      };
    } catch (error) {
      console.error('❌ Mock 강제진입 실패:', error);
      return {
        success: false,
        message: `Mock 강제진입 실패: ${(error as any).message}`
      };
    }
  }

  // 실거래 강제진입
  private async executeRealForceEntry(userId: number, params: any): Promise<TradingResult> {
    console.log(`🚨 실거래 강제진입 실행:`, params);
    
    try {
      const services = await this.initializeServices(userId);
      
      if (!services.upbit || !services.binance) {
        throw new Error('거래소 API 키가 설정되지 않았습니다');
      }

      // 1. 업비트 현물 매수
      const upbitOrder = await services.upbit.placeBuyOrder(
        `KRW-${params.symbol}`,
        params.quantity
      );

      // 2. 바이낸스 선물 숏
      const binanceOrder = await services.binance.placeFuturesShortOrder(
        params.symbol,
        params.quantity
      );

      // 3. DB에 실거래 포지션 저장
      const realPosition = {
        userId,
        symbol: params.symbol,
        type: 'force_entry',
        entryPrice: parseFloat(upbitOrder.price || '0'),
        quantity: params.quantity,
        entryPremiumRate: params.currentKimp,
        currentPremiumRate: params.currentKimp,
        status: 'open',
        side: 'long',
        isMock: false,
        leverage: params.leverage,
        upbitOrderId: upbitOrder.uuid,
        binanceOrderId: binanceOrder.orderId
      };

      const savedPosition = await storage.createPosition(realPosition);

      return {
        success: true,
        orderId: `${upbitOrder.uuid}-${binanceOrder.orderId}`,
        message: `실거래 강제진입 완료`,
        data: {
          position: savedPosition,
          strategyName: `강제진입${savedPosition.id}`,
          upbitOrder,
          binanceOrder
        }
      };

    } catch (error) {
      console.error('❌ 실거래 강제진입 실패:', error);
      return {
        success: false,
        message: `실거래 강제진입 실패: ${(error as any).message}`
      };
    }
  }

  // 잔고 조회 (환경별 분기)
  async getBalance(userId: number): Promise<any> {
    if (isMockMode()) {
      return this.getMockBalance(userId);
    } else {
      return this.getRealBalance(userId);
    }
  }

  private async getMockBalance(userId: number): Promise<any> {
    // Mock 잔고 (로컬스토리지 또는 기본값)
    return {
      krw: 100000000,
      btc: 0,
      usdt: 100000,
      binanceBtc: 0,
      source: 'mock'
    };
  }

  private async getRealBalance(userId: number): Promise<any> {
    const services = await this.initializeServices(userId);
    
    const balance: any = { source: 'real' };
    
    // 업비트 잔고
    if (services.upbit) {
      const upbitAccounts = await services.upbit.getAccounts();
      const krwAccount = upbitAccounts.find((acc: any) => acc.currency === 'KRW');
      const btcAccount = upbitAccounts.find((acc: any) => acc.currency === 'BTC');
      
      balance.krw = parseFloat(krwAccount?.balance || '0');
      balance.btc = parseFloat(btcAccount?.balance || '0');
    }

    // 바이낸스 잔고
    if (services.binance) {
      balance.usdt = await services.binance.getUSDTBalance();
      // 선물 포지션 정보도 가져올 수 있음
    }

    return balance;
  }
}

// 싱글톤 인스턴스
export const tradingManager = new TradingManager();
