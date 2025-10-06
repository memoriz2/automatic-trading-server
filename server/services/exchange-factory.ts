import { UpbitService } from './upbit.js';
import { BinanceService } from './binance.js';
import { storage } from '../storage.js';
import { log } from '../utils/logger.js';

export interface ExchangeServices {
  upbitService?: UpbitService;
  binanceService?: BinanceService;
}

export interface ExchangeCredentials {
  upbitApiKey?: string;
  upbitApiSecret?: string;
  binanceApiKey?: string;
  binanceApiSecret?: string;
}

/**
 * 거래소 서비스 팩토리 - 중복된 초기화 로직을 중앙화
 */
export class ExchangeServiceFactory {

  /**
   * 사용자 ID로 거래소 서비스들 초기화
   */
  static async initializeByUserId(userId: number): Promise<ExchangeServices> {
    try {
      const exchanges = await storage.getExchangesByUserId(userId);
      const services: ExchangeServices = {};

      // 업비트 서비스 초기화
      const upbitExchange = exchanges.find((ex: any) => ex.exchange === 'upbit' && ex.isActive);
      if (upbitExchange?.apiKey && upbitExchange?.apiSecret) {
        services.upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
        log.debug('업비트 서비스 초기화 완료', { userId });
      }

      // 바이낸스 서비스 초기화
      const binanceExchange = exchanges.find((ex: any) => ex.exchange === 'binance' && ex.isActive);
      if (binanceExchange?.apiKey && binanceExchange?.apiSecret) {
        services.binanceService = new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
        log.debug('바이낸스 서비스 초기화 완료', { userId });
      }

      return services;
    } catch (error) {
      log.error('거래소 서비스 초기화 실패', error instanceof Error ? error : undefined, { userId });
      return {};
    }
  }

  /**
   * 직접 API 키로 거래소 서비스들 초기화
   */
  static initializeByCredentials(credentials: ExchangeCredentials): ExchangeServices {
    const services: ExchangeServices = {};

    // 업비트 서비스 초기화
    if (credentials.upbitApiKey && credentials.upbitApiSecret) {
      services.upbitService = new UpbitService(credentials.upbitApiKey, credentials.upbitApiSecret);
      log.debug('업비트 서비스 초기화 완료 (직접 키)');
    }

    // 바이낸스 서비스 초기화
    if (credentials.binanceApiKey && credentials.binanceApiSecret) {
      services.binanceService = new BinanceService(credentials.binanceApiKey, credentials.binanceApiSecret);
      log.debug('바이낸스 서비스 초기화 완료 (직접 키)');
    }

    return services;
  }

  /**
   * 특정 거래소만 초기화
   */
  static async initializeUpbitOnly(userId: number): Promise<UpbitService | undefined> {
    try {
      const exchanges = await storage.getExchangesByUserId(userId);
      const upbitExchange = exchanges.find((ex: any) => ex.exchange === 'upbit' && ex.isActive);

      if (upbitExchange?.apiKey && upbitExchange?.apiSecret) {
        log.debug('업비트 서비스 초기화 완료', { userId });
        return new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
      }

      return undefined;
    } catch (error) {
      console.error(`❌ 업비트 서비스 초기화 실패 (사용자: ${userId}):`, error);
      return undefined;
    }
  }

  /**
   * 특정 거래소만 초기화
   */
  static async initializeBinanceOnly(userId: number): Promise<BinanceService | undefined> {
    try {
      const exchanges = await storage.getExchangesByUserId(userId);
      const binanceExchange = exchanges.find((ex: any) => ex.exchange === 'binance' && ex.isActive);

      if (binanceExchange?.apiKey && binanceExchange?.apiSecret) {
        log.debug('바이낸스 서비스 초기화 완료', { userId });
        return new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
      }

      return undefined;
    } catch (error) {
      console.error(`❌ 바이낸스 서비스 초기화 실패 (사용자: ${userId}):`, error);
      return undefined;
    }
  }

  /**
   * 서비스들이 모두 초기화되었는지 검증
   */
  static validateServices(services: ExchangeServices, requireBoth = true): boolean {
    if (requireBoth) {
      return !!(services.upbitService && services.binanceService);
    }
    return !!(services.upbitService || services.binanceService);
  }

  /**
   * 환경변수 기반 기본 서비스 초기화 (테스트용)
   */
  static initializeDefault(): ExchangeServices {
    return {
      upbitService: new UpbitService(),
      binanceService: new BinanceService()
    };
  }
}