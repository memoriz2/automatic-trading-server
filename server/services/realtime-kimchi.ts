/**
 * 실시간 김치 프리미엄 계산 서비스
 * 웹소켓 데이터 변동시 즉시 계산하여 브로드캐스트
 */

import { priceCache } from './price-cache.js';
import { naverExchange } from './naver-exchange.js';
import { SimpleKimchiData } from './simple-kimchi.js';

export interface RealtimeKimchiCallback {
  (data: SimpleKimchiData[]): void;
}

export class RealtimeKimchiService {
  private callbacks: Map<string, RealtimeKimchiCallback> = new Map();
  private symbols = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT'];
  private lastCalculationTime = 0;
  private readonly MIN_CALCULATION_INTERVAL = 100; // 최소 100ms 간격 (더 빠른 업데이트)
  private readonly SYNC_THRESHOLD_MS = 100; // 가격 시점 동기화 임계값 강화

  constructor() {
    console.log('🚀 실시간 김치 프리미엄 계산 서비스 시작');
  }

  /**
   * 실시간 김치 프리미엄 계산 (웹소켓 데이터 기반)
   */
  private calculateKimchiPremium(): SimpleKimchiData[] {
    const results: SimpleKimchiData[] = [];
    const usdKrwRate = priceCache.getUsdtKrwEma() || naverExchange.getCurrentRate(); // 환율은 변동성이 적어 EMA 유지

    for (const symbol of this.symbols) {
      try {
        // 실시간 가격으로 다시 변경
        const upbitPrice = priceCache.getUpbitPrice(symbol);
        const binancePrice = priceCache.getBinancePrice(symbol);

        // 실시간 가격이 모두 유효할 때만 계산 진행
        if (upbitPrice && binancePrice) {
          // 김프율 계산: (업비트KRW - 바이낸스USD×환율) ÷ (바이낸스USD×환율) × 100
          const binancePriceKRW = binancePrice * usdKrwRate; // 바이낸스 USD를 KRW로 변환
          const premiumRate = ((upbitPrice - binancePriceKRW) / binancePriceKRW) * 100;

          results.push({
            symbol,
            upbitPrice,
            binanceFuturesPrice: binancePrice,
            usdKrwRate,
            binancePriceKRW,
            premiumRate,
            timestamp: new Date().toISOString()
          });

          console.log(
            `⚡ REALTIME ${symbol} 김프: ${premiumRate.toFixed(
              3
            )}% | 업비트: ₩${upbitPrice.toLocaleString()} | 선물: $${binancePrice.toFixed(
              2
            )} | 환율: ${usdKrwRate.toFixed(2)}`
          );
        }
      } catch (error) {
        console.error(
          `${symbol} 실시간 김프 계산 오류:`,
          error
        );
      }
    }

    return results;
  }

  /**
   * 가격 변동시 호출되는 트리거 함수
   */
  onPriceUpdate(source: 'upbit' | 'binance', symbol: string): void {
    const now = Date.now();
    
    // 너무 빈번한 계산 방지 (50ms 쿨다운)
    if (now - this.lastCalculationTime < this.MIN_CALCULATION_INTERVAL) {
      return;
    }

    this.lastCalculationTime = now;

    try {
      const kimchiData = this.calculateKimchiPremium();
      
      if (kimchiData.length > 0) {
        // 모든 등록된 콜백에 데이터 전송
        this.callbacks.forEach((callback, id) => {
          try {
            callback(kimchiData);
          } catch (error) {
            console.error(`콜백 ${id} 실행 오류:`, error);
          }
        });
      }
    } catch (error) {
      console.error('실시간 김프 계산 오류:', error);
    }
  }

  /**
   * 김치 프리미엄 업데이트 콜백 등록
   */
  onUpdate(id: string, callback: RealtimeKimchiCallback): void {
    this.callbacks.set(id, callback);
    console.log(`📡 실시간 김프 콜백 등록: ${id}`);
  }

  /**
   * 콜백 제거
   */
  removeCallback(id: string): void {
    this.callbacks.delete(id);
    console.log(`📡 실시간 김프 콜백 제거: ${id}`);
  }

  /**
   * 현재 김치 프리미엄 즉시 조회
   */
  getCurrentKimchiPremium(): SimpleKimchiData[] {
    return this.calculateKimchiPremium();
  }

  /**
   * 서비스 상태 확인
   */
  getStatus(): {
    callbackCount: number;
    symbols: string[];
    cacheStatus: any;
  } {
    return {
      callbackCount: this.callbacks.size,
      symbols: this.symbols,
      cacheStatus: priceCache.getCacheStatus()
    };
  }
}

// 싱글톤 인스턴스
export const realtimeKimchiService = new RealtimeKimchiService();
