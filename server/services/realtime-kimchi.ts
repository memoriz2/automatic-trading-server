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
    // 환율 전략 개선: Upbit USDT 우선 (신선도 ≤2초), 없으면 공식 환율
    const upbitUsdt = priceCache.getUpbitPriceWithTs('USDT');
    const emaRate = priceCache.getUsdtKrwEma();
    const officialRate = naverExchange.getCurrentRate();

    // Upbit USDT가 신선하면(≤2초) 우선 사용, 아니면 공식 환율
    const now = Date.now();
    const usdKrwRate = (upbitUsdt && (now - upbitUsdt.timestamp) <= 2000) ? upbitUsdt.price : officialRate;
    const rateSource = (upbitUsdt && (now - upbitUsdt.timestamp) <= 2000) ? 'upbit_usdt' : 'official';

    for (const symbol of this.symbols) {
      try {
        const up = priceCache.getUpbitPriceWithTs(symbol);
        const bi = priceCache.getBinancePriceWithTs(symbol);

        // 둘 다 캐시에 있고, 시점이 충분히 최신일 때만 계산 (≤ SYNC_THRESHOLD_MS)
        const now = Date.now();
        if (up && bi && (now - up.timestamp) <= this.SYNC_THRESHOLD_MS && (now - bi.timestamp) <= this.SYNC_THRESHOLD_MS) {
          const upbitPrice = up.price;
          const binancePrice = bi.price; // 선물 bookTicker 중간가 (bid+ask)/2
          // 김프율 계산: (업비트KRW - 바이낸스USD×환율) ÷ (바이낸스USD×환율) × 100
          const binancePriceKRW = binancePrice * usdKrwRate; // 바이낸스 USD를 KRW로 변환
          const premiumRate = ((upbitPrice - binancePriceKRW) / binancePriceKRW) * 100;

          results.push({
            symbol,
            upbitPrice,
            binanceFuturesPrice: binancePrice,
            usdKrwRate,
            binancePriceKRW: binancePriceKRW, // 바이낸스 가격을 KRW로 변환한 값
            premiumRate,
            timestamp: new Date().toISOString()
          });

          // 상세 로깅으로 계산 검증 지원
          const upbitUsdtStr = upbitUsdt ? `, UpbitUSDT: ${upbitUsdt.price.toFixed(2)}(${now - upbitUsdt.timestamp}ms ago)` : '';
          const emaStr = emaRate ? `, EMA: ${emaRate.toFixed(2)}` : '';
          const officialStr = `, Official: ${officialRate.toFixed(2)}`;
          console.log(`⚡ ${symbol} 김프: ${premiumRate.toFixed(3)}% | 업비트: ₩${upbitPrice.toLocaleString()} | 선물: $${binancePrice.toFixed(2)} | KRW환산: ₩${binancePriceKRW.toLocaleString()} | 환율(${rateSource}): ${usdKrwRate.toFixed(2)}${upbitUsdtStr}${emaStr}${officialStr} | Δt: up ${now - up.timestamp}ms / bi ${now - bi.timestamp}ms`);
        }
      } catch (error) {
        console.error(`${symbol} 실시간 김프 계산 오류:`, error);
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
