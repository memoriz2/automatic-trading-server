import { ApiKeysRepository } from '../repositories/ApiKeysRepository.js';
import { BalanceRepository } from '../repositories/BalanceRepository.js';
import { ExchangeConnectionRepository } from '../repositories/ExchangeConnectionRepository.js';
import { getExchangeAdapter } from '../adapters/index.js';
import { BalanceResponseDto, ExchangeStatusResponseDto, BalanceDto } from '../types/trading';

/**
 * 잔고 관리 서비스
 * API 키를 사용하여 거래소 잔고를 조회하고 관리
 */
export class BalanceService {
  private apiKeysRepository: ApiKeysRepository;
  private balanceRepository: BalanceRepository;
  private exchangeConnectionRepository: ExchangeConnectionRepository;

  constructor() {
    this.apiKeysRepository = new ApiKeysRepository();
    this.balanceRepository = new BalanceRepository();
    this.exchangeConnectionRepository = new ExchangeConnectionRepository();
  }

  // 캐시 저장소
  private static balanceCache = new Map<number, { data: BalanceResponseDto; timestamp: number }>();
  private static readonly CACHE_TTL_MS = 30 * 1000; // 30초 캐시

  /**
   * 특정 사용자의 잔고 캐시 무효화 (거래 발생 시 호출)
   */
  static invalidateUserCache(userId: number): void {
    BalanceService.balanceCache.delete(userId);
    console.log(`🗑️ [BalanceService] 사용자 ${userId} 잔고 캐시 무효화`);
  }

  /**
   * 모든 잔고 캐시 무효화
   */
  static invalidateAllCache(): void {
    BalanceService.balanceCache.clear();
    console.log(`🗑️ [BalanceService] 모든 잔고 캐시 무효화`);
  }

  /**
   * 사용자의 모든 거래소 잔고 조회 (캐싱 적용)
   */
  async getUserBalances(userId: number): Promise<BalanceResponseDto> {
    try {
      // 캐시 확인
      const cached = BalanceService.balanceCache.get(userId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < BalanceService.CACHE_TTL_MS) {
        // 캐시 로그는 5분마다만 출력 (로그 스팸 방지)
        if (Math.random() < 0.02) {
          console.log(`🚀 [BalanceService] 사용자 ${userId} 캐시된 잔고 반환 (${Math.floor((now - cached.timestamp) / 1000)}초 전)`);
        }
        return cached.data;
      }

      console.log(`🔄 [BalanceService] 사용자 ${userId} 새로운 잔고 조회 시작`);
      
      // 1. 사용자의 활성 API 키 조회
      const apiKeys = await this.apiKeysRepository.findActiveByUserId(userId);
      
      if (apiKeys.length === 0) {
        return this.getEmptyBalanceResponse();
      }

      // 2. 각 거래소별 잔고 조회
      const allBalances: any[] = [];
      const connectionResults: Record<string, boolean> = {};

      for (const apiKey of apiKeys) {
        try {
          // 바이낸스의 경우 exchangeTestService 사용 (성공하는 방식)
          if (apiKey.exchange === 'binance') {
            const { exchangeTestService } = await import('./exchange-test.js');
            const testResult = await exchangeTestService.testExchangeConnection(
              'binance',
              apiKey.apiKey,
              apiKey.secretKey
            );
            
            connectionResults[apiKey.exchange] = testResult.success;
            
            if (testResult.success) {
              // exchangeTestService 결과에서 USDT 잔고 추출
              const usdtBalance = parseFloat(testResult.details?.totalWalletBalance || '0');
              if (usdtBalance > 0) {
                allBalances.push({
                  exchange: 'binance',
                  currency: 'USDT',
                  available: usdtBalance,
                  locked: 0,
                  total: usdtBalance
                });
                console.log(`✅ 바이낸스 선물 USDT 잔고 (exchangeTestService): ${usdtBalance}`);
              }
            }
          } else {
            // 업비트 등 다른 거래소는 기존 방식 사용
            const adapter = getExchangeAdapter(apiKey.exchange);
            adapter.setCredentials(apiKey.apiKey, apiKey.secretKey, apiKey.passphrase);

            // 연결 테스트
            const connectionTest = await adapter.testConnection();
            connectionResults[apiKey.exchange] = connectionTest.success;

            if (connectionTest.success) {
              // 잔고 조회
              const balances = await adapter.getBalances();
              allBalances.push(...balances);

              // 잔고 스냅샷 저장 (비동기)
              this.saveBalanceSnapshot(userId, balances).catch(console.error);

              // 연결 상태 업데이트
              await this.exchangeConnectionRepository.upsertConnection(userId, {
                exchange: apiKey.exchange as 'upbit' | 'binance',
                connected: true,
                lastChecked: new Date(),
                permissions: connectionTest.permissions,
                balanceAvailable: true,
                tradingEnabled: connectionTest.permissions.includes('spot') || connectionTest.permissions.includes('futures')
              });
            } else {
              // 연결 실패 상태 기록
              await this.exchangeConnectionRepository.upsertConnection(userId, {
                exchange: apiKey.exchange as 'upbit' | 'binance',
                connected: false,
                lastChecked: new Date(),
                error: connectionTest.error,
                permissions: [],
                balanceAvailable: false,
                tradingEnabled: false
              });
            }
          }
          
          // 바이낸스 연결 상태 업데이트
          if (apiKey.exchange === 'binance') {
            await this.exchangeConnectionRepository.upsertConnection(userId, {
              exchange: 'binance',
              connected: connectionResults[apiKey.exchange],
              lastChecked: new Date(),
              permissions: connectionResults[apiKey.exchange] ? ['futures'] : [],
              balanceAvailable: connectionResults[apiKey.exchange],
              tradingEnabled: connectionResults[apiKey.exchange]
            });
          }
        } catch (error: any) {
          console.error(`❌ ${apiKey.exchange} 잔고 조회 실패:`, error);
          connectionResults[apiKey.exchange] = false;

          // 에러 상태 기록
          await this.exchangeConnectionRepository.recordError(userId, apiKey.exchange, error.message);
        }
      }

      // 3. 응답 데이터 구성
      const result = this.formatBalanceResponse(allBalances, connectionResults);
      
      // 캐시 저장
      BalanceService.balanceCache.set(userId, {
        data: result,
        timestamp: Date.now()
      });
      
      console.log(`✅ [BalanceService] 사용자 ${userId} 잔고 조회 완료 및 캐시 저장`);
      return result;

    } catch (error) {
      console.error('❌ 사용자 잔고 조회 실패:', error);
      return this.getEmptyBalanceResponse();
    }
  }

  /**
   * 거래소 연결 상태 조회
   */
  async getExchangeStatus(userId: number): Promise<ExchangeStatusResponseDto> {
    return this.exchangeConnectionRepository.getConnectionStatus(userId);
  }

  /**
   * 특정 거래소 연결 테스트
   */
  async testExchangeConnection(userId: number, exchange: string): Promise<{
    success: boolean;
    permissions: string[];
    error?: string;
  }> {
    try {
      // API 키 조회
      const apiKey = await this.apiKeysRepository.findByUserAndExchange(userId, exchange);
      
      if (!apiKey || !apiKey.isActive) {
        return {
          success: false,
          permissions: [],
          error: 'API 키가 설정되지 않았거나 비활성화되었습니다.'
        };
      }

      // 어댑터로 연결 테스트
      const adapter = getExchangeAdapter(exchange);
      adapter.setCredentials(apiKey.apiKey, apiKey.secretKey, apiKey.passphrase);
      
      const result = await adapter.testConnection();

      // 연결 상태 업데이트
      await this.exchangeConnectionRepository.upsertConnection(userId, {
        exchange: exchange as 'upbit' | 'binance',
        connected: result.success,
        lastChecked: new Date(),
        error: result.error,
        permissions: result.permissions,
        balanceAvailable: result.success,
        tradingEnabled: result.success && (
          result.permissions.includes('spot') || 
          result.permissions.includes('futures')
        )
      });

      return result;

    } catch (error: any) {
      console.error(`❌ ${exchange} 연결 테스트 실패:`, error);
      
      // 에러 상태 기록
      await this.exchangeConnectionRepository.recordError(userId, exchange, error.message);
      
      return {
        success: false,
        permissions: [],
        error: error.message
      };
    }
  }

  /**
   * API 키 저장 및 연결 테스트
   */
  async saveApiKey(
    userId: number,
    exchange: string,
    apiKey: string,
    secretKey: string,
    passphrase?: string
  ): Promise<{
    success: boolean;
    message: string;
    permissions?: string[];
  }> {
    try {
      // 1. 연결 테스트 먼저 수행
      const adapter = getExchangeAdapter(exchange);
      adapter.setCredentials(apiKey, secretKey, passphrase);
      
      const connectionTest = await adapter.testConnection();
      
      if (!connectionTest.success) {
        return {
          success: false,
          message: connectionTest.error || 'API 키 연결 테스트에 실패했습니다.'
        };
      }

      // 2. API 키 저장
      await this.apiKeysRepository.upsert({
        userId,
        exchange: exchange as 'upbit' | 'binance',
        apiKey,
        secretKey,
        passphrase,
        isActive: true,
        permissions: connectionTest.permissions
      });

      // 3. 연결 상태 저장
      await this.exchangeConnectionRepository.upsertConnection(userId, {
        exchange: exchange as 'upbit' | 'binance',
        connected: true,
        lastChecked: new Date(),
        permissions: connectionTest.permissions,
        balanceAvailable: true,
        tradingEnabled: connectionTest.permissions.includes('spot') || connectionTest.permissions.includes('futures')
      });

      return {
        success: true,
        message: `${exchange} API 키가 성공적으로 연결되었습니다.`,
        permissions: connectionTest.permissions
      };

    } catch (error: any) {
      console.error(`❌ ${exchange} API 키 저장 실패:`, error);
      return {
        success: false,
        message: error.message || 'API 키 저장에 실패했습니다.'
      };
    }
  }

  /**
   * 잔고 스냅샷 저장 (비동기)
   */
  private async saveBalanceSnapshot(userId: number, balances: any[]): Promise<void> {
    try {
      const balanceData = balances.map(balance => ({
        ...balance,
        userId
      }));

      await this.balanceRepository.bulkUpdateBalances(userId, balanceData);
    } catch (error) {
      console.error('❌ 잔고 스냅샷 저장 실패:', error);
    }
  }

  /**
   * 빈 잔고 응답 생성
   */
  private getEmptyBalanceResponse(): BalanceResponseDto {
    return {
      real: {
        krw: 0,
        btc_upbit: 0,
        usdt: 0
      },
      connected: {
        upbit: false,
        binance: false
      },
      balances: {
        upbit: [],
        binance: []
      },
      lastUpdated: new Date()
    };
  }

  /**
   * 잔고 응답 형태로 포맷팅
   */
  private formatBalanceResponse(
    balances: any[], 
    connectionResults: Record<string, boolean>
  ): BalanceResponseDto {
    const real: BalanceResponseDto['real'] = {};
    const connected: BalanceResponseDto['connected'] = {
      upbit: connectionResults.upbit || false,
      binance: connectionResults.binance || false
    };
    const balanceDetails: BalanceResponseDto['balances'] = {
      upbit: [],
      binance: []
    };

    // 잔고 데이터 분류
    balances.forEach(balance => {
      if (balance.exchange === 'upbit') {
        balanceDetails.upbit.push(balance);
        if (balance.currency === 'KRW') {
          real.krw = balance.total;
        } else if (balance.currency === 'BTC') {
          real.btc_upbit = balance.total;
        }
      } else if (balance.exchange === 'binance') {
        balanceDetails.binance.push(balance);
        if (balance.currency === 'USDT') {
          // 현물과 선물 USDT 잔고를 합산하거나, 더 큰 값을 사용
          real.usdt = Math.max(real.usdt || 0, balance.total);
        }
      }
    });

    console.log(`🔍 [BalanceService] 포맷팅된 잔고 데이터:`, {
      real,
      connected,
      balanceCount: {
        upbit: balanceDetails.upbit.length,
        binance: balanceDetails.binance.length
      }
    });

    return {
      real,
      connected,
      balances: balanceDetails,
      lastUpdated: new Date()
    };
  }

  /**
   * 잔고 새로고침 (강제 업데이트)
   */
  async refreshBalances(userId: number): Promise<BalanceResponseDto> {
    // 기존 연결 상태 초기화 - 각 거래소별로 업데이트
    try {
      await this.exchangeConnectionRepository.updateConnectionStatus(userId, 'upbit', false);
      await this.exchangeConnectionRepository.updateConnectionStatus(userId, 'binance', false);
    } catch (error) {
      console.warn('연결 상태 초기화 실패:', error);
    }

    // 새로 잔고 조회
    return this.getUserBalances(userId);
  }

  /**
   * 캐시를 우회하여 실제 API에서 직접 잔고 조회 (거래 후 사용)
   */
  async getUserBalancesDirect(userId: number): Promise<BalanceResponseDto> {
    console.log(`🔥 [BalanceService] 캐시 우회 - 실제 API 직접 호출 (사용자: ${userId})`);
    
    try {
      // 1. 사용자의 활성 API 키 조회
      const apiKeys = await this.apiKeysRepository.findActiveByUserId(userId);
      
      if (apiKeys.length === 0) {
        return this.getEmptyBalanceResponse();
      }

      // 2. 각 거래소별 실제 API 호출 (캐시 없이)
      const allBalances: BalanceDto[] = [];
      const connectionResults: Record<string, boolean> = {};

      for (const apiKey of apiKeys) {
        try {
          console.log(`🌐 [${apiKey.exchange}] 실제 API 호출 중...`);
          
          const adapter = getExchangeAdapter(apiKey.exchange);
          adapter.setCredentials(apiKey.apiKey, apiKey.secretKey, apiKey.passphrase);
          
          // 연결 테스트 없이 바로 잔고 조회 (더 빠른 응답)
          const balances = await adapter.getBalances();
          allBalances.push(...balances);
          connectionResults[apiKey.exchange] = true;

          console.log(`✅ [${apiKey.exchange}] 실제 잔고 조회 성공: ${balances.length}개 자산`);

          // 잔고 스냅샷 저장 (비동기)
          this.saveBalanceSnapshot(userId, balances).catch(console.error);

          // 연결 상태 업데이트
          await this.exchangeConnectionRepository.upsertConnection(userId, {
            exchange: apiKey.exchange as 'upbit' | 'binance',
            connected: true,
            lastChecked: new Date(),
            permissions: [], // 빠른 응답을 위해 권한 체크 생략
            balanceAvailable: true,
            tradingEnabled: true
          });

        } catch (error: any) {
          console.error(`❌ [${apiKey.exchange}] 실제 잔고 조회 실패:`, error.message);
          connectionResults[apiKey.exchange] = false;

          // 에러 상태 기록
          await this.exchangeConnectionRepository.recordError(userId, apiKey.exchange, error.message);
        }
      }

      // 3. 응답 데이터 구성 (캐시에 저장하지 않음)
      const result = this.formatBalanceResponse(allBalances, connectionResults);
      
      console.log(`🎯 [BalanceService] 실제 API 직접 호출 완료 - 캐시 저장 없이 즉시 반환`);
      return result;

    } catch (error) {
      console.error('❌ 실제 잔고 직접 조회 실패:', error);
      return this.getEmptyBalanceResponse();
    }
  }

  /**
   * 거래 발생 후 잔고 즉시 갱신 (캐시 무효화 + 실제 API 직접 호출)
   */
  async refreshBalanceAfterTrade(userId: number, tradeDetails?: {
    exchange?: string;
    symbol?: string;
    side?: 'buy' | 'sell';
    amount?: number;
  }): Promise<BalanceResponseDto> {
    console.log(`🔄 [BalanceService] 거래 후 잔고 즉시 갱신 시작 (사용자: ${userId})`);
    
    if (tradeDetails) {
      console.log(`📊 거래 정보:`, tradeDetails);
    }
    
    // 1. 캐시 무효화
    BalanceService.invalidateUserCache(userId);
    
    // 2. 실제 API에서 직접 잔고 조회 (캐시 우회)
    const result = await this.getUserBalancesDirect(userId);
    
    // 3. 새로운 데이터를 캐시에 저장
    BalanceService.balanceCache.set(userId, {
      data: result,
      timestamp: Date.now()
    });
    
    console.log(`✅ [BalanceService] 거래 후 실제 잔고 갱신 완료`);
    return result;
  }

  /**
   * 오래된 잔고 데이터 정리
   */
  async cleanupOldBalances(): Promise<{ deletedSnapshots: number }> {
    const deletedSnapshots = await this.balanceRepository.cleanupOldSnapshots(30); // 30일 이전 데이터 삭제
    
    return { deletedSnapshots };
  }
}

// 싱글톤 인스턴스 생성
export const balanceService = new BalanceService();
