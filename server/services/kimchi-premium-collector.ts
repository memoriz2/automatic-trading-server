/**
 * 백그라운드 김치프리미엄 데이터 수집 서비스
 * 페이지가 열려있지 않아도 서버에서 자동으로 데이터를 수집하여 DB에 저장
 */

import { realtimeKimchiService } from './realtime-kimchi.js';
import { storage } from '../storage.js';

export class KimchiPremiumCollector {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private collectInterval = 30 * 1000; // 30초마다 수집
  private errorCount = 0;
  private lastCollectionTime: Date | null = null;
  private totalCollections = 0;

  constructor() {
    console.log('📊 김치프리미엄 백그라운드 수집기 초기화');
  }

  /**
   * 데이터 수집 시작
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ 김치프리미엄 수집기가 이미 실행 중입니다');
      return;
    }

    this.isRunning = true;
    console.log(`✅ 김치프리미엄 백그라운드 수집 시작 (${this.collectInterval / 1000}초 간격)`);

    // 즉시 한 번 수집
    this.collectData();

    // 주기적 수집 시작
    this.intervalId = setInterval(() => {
      this.collectData();
    }, this.collectInterval);
  }

  /**
   * 데이터 수집 중지
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ 김치프리미엄 수집기가 실행 중이 아닙니다');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('🛑 김치프리미엄 백그라운드 수집 중지');
  }

  /**
   * 실제 데이터 수집 및 저장
   */
  private async collectData(): Promise<void> {
    try {
      // 실시간 김치프리미엄 데이터 가져오기
      const kimchiData = realtimeKimchiService.getCurrentKimchiPremium();

      if (!kimchiData || kimchiData.length === 0) {
        console.warn('⚠️ 수집할 김치프리미엄 데이터가 없습니다');
        return;
      }

      // 각 심볼별로 DB에 저장
      for (const data of kimchiData) {
        try {
          await storage.saveKimchiPremium({
            symbol: data.symbol,
            upbitPrice: data.upbitPrice,
            binancePrice: data.binanceFuturesPrice,
            premiumRate: data.premiumRate,
            exchangeRate: data.usdKrwRate,
            premiumAmount: data.upbitPrice - data.binancePriceKRW,
          });
        } catch (error) {
          console.error(`❌ ${data.symbol} 데이터 저장 실패:`, error);
          this.errorCount++;
        }
      }

      this.lastCollectionTime = new Date();
      this.totalCollections++;

      // 10번마다 로그 출력 (너무 많은 로그 방지)
      if (this.totalCollections % 10 === 0) {
        console.log(
          `📊 김치프리미엄 수집 완료 [${this.totalCollections}회] - ` +
          `심볼 ${kimchiData.length}개, 오류 ${this.errorCount}회`
        );
      }
    } catch (error) {
      console.error('❌ 김치프리미엄 수집 중 오류:', error);
      this.errorCount++;
    }
  }

  /**
   * 수집기 상태 조회
   */
  getStatus(): {
    isRunning: boolean;
    collectInterval: number;
    totalCollections: number;
    errorCount: number;
    lastCollectionTime: Date | null;
  } {
    return {
      isRunning: this.isRunning,
      collectInterval: this.collectInterval,
      totalCollections: this.totalCollections,
      errorCount: this.errorCount,
      lastCollectionTime: this.lastCollectionTime,
    };
  }

  /**
   * 수집 간격 변경 (밀리초 단위)
   */
  setInterval(intervalMs: number): void {
    if (intervalMs < 10000) {
      console.warn('⚠️ 수집 간격은 최소 10초 이상이어야 합니다');
      return;
    }

    this.collectInterval = intervalMs;
    console.log(`⚙️ 수집 간격 변경: ${intervalMs / 1000}초`);

    // 실행 중이면 재시작
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

// 싱글톤 인스턴스
export const kimchiPremiumCollector = new KimchiPremiumCollector();
