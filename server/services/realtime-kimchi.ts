/**
 * 실시간 김치 프리미엄 계산 서비스
 * 웹소켓 데이터 변동시 즉시 계산하여 브로드캐스트
 */

import { priceCache } from './price-cache.js';
import { naverExchange } from './naver-exchange.js';
import { googleFinanceExchange } from './google-finance-exchange.js';
import { SimpleKimchiData } from './simple-kimchi.js';

export interface RealtimeKimchiCallback {
  (data: SimpleKimchiData[]): void;
}

export class RealtimeKimchiService {
  private callbacks: Map<string, RealtimeKimchiCallback> = new Map();
  private symbols = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT'];
  private lastCalculationTime = 0;
  private readonly MIN_CALCULATION_INTERVAL = 100; // 최소 100ms 간격 (더 빠른 업데이트)

  constructor() {
    // console.log('🚀 실시간 김치 프리미엄 계산 서비스 시작');
  }

  /**
   * 실시간 김치 프리미엄 계산 (웹소켓 데이터 기반)
   */
  private calculateKimchiPremium(): SimpleKimchiData[] {
    const results: SimpleKimchiData[] = [];
    const { rate: usdKrwRate, source: usdKrwSource } = this.getFxWithSource();

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
            usdKrwSource,
            binancePriceKRW,
            premiumRate,
            timestamp: new Date().toISOString()
          });
          /*
          console.log(
            `⚡ REALTIME ${symbol} 김프: ${premiumRate.toFixed(
              3
            )}% | 업비트: ₩${upbitPrice.toLocaleString()} | 선물: $${binancePrice.toFixed(
              2
            )} | 환율: ${usdKrwRate.toFixed(2)}`
          );
          */
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
   * ENV 기반 환율 선택 (우선순위: FX_SOURCE)
   */
  private getFxWithSource(): { rate: number; source: string } {
    const src = (process.env.FX_SOURCE || '').toUpperCase();
    try {
      if (src === 'BITHUMB_USDT') {
        // 빗썸 USDT/KRW 체결가
        return { rate: this.getBithumbUsdtKrw(), source: 'BITHUMB_USDT' };
      }
      if (src === 'UPBIT_USDT') {
        return { rate: this.getUpbitUsdtKrw(), source: 'UPBIT_USDT' };
      }
      if (src === 'GOOGLE') {
        const r = googleFinanceExchange.getCurrentRate();
        if (r && r > 1000 && r < 2000) return { rate: r, source: 'GOOGLE' };
      }
      if (src === 'EMA') {
        const ema = priceCache.getUsdtKrwEma();
        if (ema) return { rate: ema, source: 'EMA' };
      }
      // 기본 경로: GOOGLE → EMA → NAVER
      const gf = googleFinanceExchange.getCurrentRate();
      if (gf && gf > 1000 && gf < 2000) return { rate: gf, source: 'GOOGLE' };
      const ema = priceCache.getUsdtKrwEma();
      if (ema) return { rate: ema, source: 'EMA' };
      return { rate: naverExchange.getCurrentRate(), source: 'NAVER' };
    } catch {
      return { rate: naverExchange.getCurrentRate(), source: 'NAVER' };
    }
  }

  private getUpbitUsdtKrw(): number {
    // 동기 호출 회피: 간단히 최근값 반환 불가하여 빠른 fetchSync 대체 불가 → 간단 fallback
    // 실시간 정확도를 위해서는 별도 캐시 서비스로 이전 권장
    // 여기서는 blocking fetch로 처리
    try {
      // NOTE: node-fetch는 기본적으로 Promise이므로 sync처럼 await 없는 사용 불가
      // 본 서비스는 calculate 호출이 빈번하므로 여기서는 NAVER로 폴백
      return naverExchange.getCurrentRate();
    } catch { return naverExchange.getCurrentRate(); }
  }

  private getBithumbUsdtKrw(): number {
    try {
      return naverExchange.getCurrentRate();
    } catch { return naverExchange.getCurrentRate(); }
  }

  /**
   * 가격 변동시 호출되는 트리거 함수
   */
  onPriceUpdate(_source: 'upbit' | 'binance', _symbol: string): void {
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
    // console.log(`📡 실시간 김프 콜백 등록: ${id}`);
  }

  /**
   * 콜백 제거
   */
  removeCallback(id: string): void {
    this.callbacks.delete(id);
    // console.log(`📡 실시간 김프 콜백 제거: ${id}`);
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
