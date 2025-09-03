/**
 * 웹소켓 가격 데이터 캐시 시스템
 * REST API 대신 실시간 웹소켓 데이터를 사용하여 빠른 가격 조회 제공
 */

export interface CachedPrice {
  price: number;
  timestamp: number;
  source: 'websocket' | 'api';
}

// 가격 변동 콜백 타입
export interface PriceUpdateCallback {
  (source: 'upbit' | 'binance', symbol: string, price: number): void;
}

export class PriceCacheService {
  private upbitPrices: Map<string, CachedPrice> = new Map();
  private binancePrices: Map<string, CachedPrice> = new Map();
  private priceHistory: { [key: string]: number[] } = {}; // ex: 'UPBIT_BTC', 'BINANCE_BTC'
  private readonly SMA_WINDOW = 5; // 5개 데이터의 이동평균

  private readonly CACHE_EXPIRE_MS = 10000; // 10초 후 만료
  private emaRate: number | null = null; // USDT/KRW EMA
  private readonly EMA_ALPHA = 2 / (5 + 1); // 5초 EMA 가중치 (대략 5틱 가정)
  private priceUpdateCallbacks: PriceUpdateCallback[] = [];

  /**
   * 업비트 가격 캐시에 저장
   */
  setUpbitPrice(symbol: string, price: number, source: 'websocket' | 'api' = 'websocket'): void {
    this.upbitPrices.set(symbol, {
      price,
      timestamp: Date.now(),
      source
    });
    
    // 이동평균을 위한 히스토리 업데이트
    const key = `UPBIT_${symbol}`;
    if (!this.priceHistory[key]) this.priceHistory[key] = [];
    this.priceHistory[key].push(price);
    if (this.priceHistory[key].length > this.SMA_WINDOW) {
      this.priceHistory[key].shift();
    }
    
    if (source === 'websocket') {
      console.log(`📊 업비트 ${symbol}: ₩${price.toLocaleString()} (웹소켓)`);
      
      // USDT 환율 EMA 업데이트
      if (symbol === 'USDT') {
        if (this.emaRate == null) {
          this.emaRate = price;
        } else {
          this.emaRate = this.emaRate + this.EMA_ALPHA * (price - this.emaRate);
        }
        console.log(`📈 USDT/KRW EMA: ${this.emaRate.toFixed(2)} (raw: ${price.toFixed(2)})`);
      }

      // 🚀 가격 변동시 실시간 김치 계산 트리거
      this.priceUpdateCallbacks.forEach(callback => {
        try {
          callback('upbit', symbol, price);
        } catch (error) {
          console.error('업비트 가격 변동 콜백 오류:', error);
        }
      });
    }
  }

  /**
   * 바이낸스 가격 캐시에 저장
   */
  setBinancePrice(symbol: string, price: number, source: 'websocket' | 'api' = 'websocket'): void {
    this.binancePrices.set(symbol, {
      price,
      timestamp: Date.now(),
      source
    });
    
    // 이동평균을 위한 히스토리 업데이트
    const key = `BINANCE_${symbol}`;
    if (!this.priceHistory[key]) this.priceHistory[key] = [];
    this.priceHistory[key].push(price);
    if (this.priceHistory[key].length > this.SMA_WINDOW) {
      this.priceHistory[key].shift();
    }

    if (source === 'websocket') {
      console.log(`📊 바이낸스 ${symbol}: $${price.toLocaleString()} (웹소켓)`);
      
      // 🚀 가격 변동시 실시간 김치 계산 트리거
      this.priceUpdateCallbacks.forEach(callback => {
        try {
          callback('binance', symbol, price);
        } catch (error) {
          console.error('바이낸스 가격 변동 콜백 오류:', error);
        }
      });
    }
  }

  /**
   * 업비트 가격 조회 (캐시 우선, 없으면 null)
   */
  getUpbitPrice(symbol: string): number | null {
    const cached = this.upbitPrices.get(symbol);
    
    if (!cached) {
      return null;
    }
    
    // 캐시 만료 확인
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRE_MS) {
      console.warn(`⚠️ 업비트 ${symbol} 캐시 만료 (${Math.round((Date.now() - cached.timestamp) / 1000)}초 전)`);
      return null;
    }
    
    return cached.price;
  }

  /**
   * 업비트 가격+타임스탬프 조회 (만료시 null)
   */
  getUpbitPriceWithTs(symbol: string): CachedPrice | null {
    const cached = this.upbitPrices.get(symbol);
    if (!cached) {
      return null;
    }
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRE_MS) {
      console.warn(`⚠️ 업비트 ${symbol} 캐시 만료 (${Math.round((Date.now() - cached.timestamp) / 1000)}초 전)`);
      return null;
    }
    return cached;
  }

  /**
   * 바이낸스 가격 조회 (캐시 우선, 없으면 null)
   */
  getBinancePrice(symbol: string): number | null {
    const cached = this.binancePrices.get(symbol);
    
    if (!cached) {
      return null;
    }
    
    // 캐시 만료 확인
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRE_MS) {
      console.warn(`⚠️ 바이낸스 ${symbol} 캐시 만료 (${Math.round((Date.now() - cached.timestamp) / 1000)}초 전)`);
      return null;
    }
    
    return cached.price;
  }

  /**
   * 바이낸스 가격+타임스탬프 조회 (만료시 null)
   */
  getBinancePriceWithTs(symbol: string): CachedPrice | null {
    const cached = this.binancePrices.get(symbol);
    if (!cached) {
      return null;
    }
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRE_MS) {
      console.warn(`⚠️ 바이낸스 ${symbol} 캐시 만료 (${Math.round((Date.now() - cached.timestamp) / 1000)}초 전)`);
      return null;
    }
    return cached;
  }

  /**
   * 업비트 SMA 가격 조회
   */
  getUpbitSma(symbol: string): number | null {
    const key = `UPBIT_${symbol}`;
    const history = this.priceHistory[key];
    if (!history || history.length < this.SMA_WINDOW) {
      return this.getUpbitPrice(symbol); // 데이터가 부족하면 현재가 반환
    }
    const sum = history.reduce((a, b) => a + b, 0);
    return sum / history.length;
  }

  /**
   * 바이낸스 SMA 가격 조회
   */
  getBinanceSma(symbol: string): number | null {
    const key = `BINANCE_${symbol}`;
    const history = this.priceHistory[key];
    if (!history || history.length < this.SMA_WINDOW) {
      return this.getBinancePrice(symbol); // 데이터가 부족하면 현재가 반환
    }
    const sum = history.reduce((a, b) => a + b, 0);
    return sum / history.length;
  }

  /**
   * 캐시 상태 확인
   */
  getCacheStatus(): {
    upbitCount: number;
    binanceCount: number;
    upbitSymbols: string[];
    binanceSymbols: string[];
  } {
    return {
      upbitCount: this.upbitPrices.size,
      binanceCount: this.binancePrices.size,
      upbitSymbols: Array.from(this.upbitPrices.keys()),
      binanceSymbols: Array.from(this.binancePrices.keys())
    };
  }

  /**
   * USDT/KRW EMA 환율 조회 (없으면 null)
   */
  getUsdtKrwEma(): number | null {
    return this.emaRate;
  }

  /**
   * 가격 변동 콜백 등록
   */
  onPriceUpdate(callback: PriceUpdateCallback): void {
    this.priceUpdateCallbacks.push(callback);
    console.log(`📡 가격 변동 콜백 등록 (총 ${this.priceUpdateCallbacks.length}개)`);
  }

  /**
   * 만료된 캐시 정리
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    
    // 업비트 캐시 정리
    this.upbitPrices.forEach((cached, symbol) => {
      if (now - cached.timestamp > this.CACHE_EXPIRE_MS) {
        this.upbitPrices.delete(symbol);
        console.log(`🧹 만료된 업비트 ${symbol} 캐시 삭제`);
      }
    });
    
    // 바이낸스 캐시 정리
    this.binancePrices.forEach((cached, symbol) => {
      if (now - cached.timestamp > this.CACHE_EXPIRE_MS) {
        this.binancePrices.delete(symbol);
        console.log(`🧹 만료된 바이낸스 ${symbol} 캐시 삭제`);
      }
    });
  }
}

// 싱글톤 인스턴스
export const priceCache = new PriceCacheService();

// 5초마다 만료된 캐시 정리
setInterval(() => {
  priceCache.cleanExpiredCache();
}, 5000);
