/**
 * 글로벌 API Rate Limiter
 * 서버 IP 밴 방지를 위한 요청 제한 시스템
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  exchange: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
  lastRequest: number;
}

export class GlobalRateLimiter {
  private static instance: GlobalRateLimiter;
  private requestCounts = new Map<string, RequestRecord>();
  
  // 거래소별 제한 설정 (안전 마진 포함)
  private limits: Record<string, RateLimitConfig> = {
    binance: {
      maxRequests: 1000, // 원래 1200이지만 안전 마진
      windowMs: 60 * 1000, // 1분
      exchange: 'binance'
    },
    upbit: {
      maxRequests: 600, // 원래 900이지만 안전 마진
      windowMs: 60 * 1000, // 1분  
      exchange: 'upbit'
    }
  };

  static getInstance(): GlobalRateLimiter {
    if (!GlobalRateLimiter.instance) {
      GlobalRateLimiter.instance = new GlobalRateLimiter();
    }
    return GlobalRateLimiter.instance;
  }

  /**
   * API 요청 전 제한 확인
   */
  async checkLimit(exchange: string, endpoint: string = 'default'): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
    waitTime?: number;
  }> {
    const key = `${exchange}:${endpoint}`;
    const limit = this.limits[exchange];
    
    if (!limit) {
      console.warn(`⚠️ [RateLimiter] 알 수 없는 거래소: ${exchange}`);
      return { allowed: true, remainingRequests: 999, resetTime: Date.now() + 60000 };
    }

    const now = Date.now();
    let record = this.requestCounts.get(key);

    // 윈도우 리셋 확인
    if (!record || now >= record.resetTime) {
      record = {
        count: 0,
        resetTime: now + limit.windowMs,
        lastRequest: now
      };
      this.requestCounts.set(key, record);
    }

    // 요청 제한 확인
    if (record.count >= limit.maxRequests) {
      const waitTime = record.resetTime - now;
      console.warn(`🚫 [RateLimiter] ${exchange} API 제한 도달: ${record.count}/${limit.maxRequests}, ${Math.ceil(waitTime/1000)}초 대기`);
      
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: record.resetTime,
        waitTime
      };
    }

    // 요청 허용
    record.count++;
    record.lastRequest = now;
    this.requestCounts.set(key, record);

    console.log(`✅ [RateLimiter] ${exchange} 요청 허용: ${record.count}/${limit.maxRequests}`);
    
    return {
      allowed: true,
      remainingRequests: limit.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  /**
   * 강제 대기 (Rate Limit 도달 시)
   */
  async waitForReset(exchange: string, endpoint: string = 'default'): Promise<void> {
    const key = `${exchange}:${endpoint}`;
    const record = this.requestCounts.get(key);
    
    if (!record) return;

    const waitTime = record.resetTime - Date.now();
    if (waitTime > 0) {
      console.log(`⏰ [RateLimiter] ${exchange} Rate Limit 대기: ${Math.ceil(waitTime/1000)}초`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * 현재 상태 조회
   */
  getStatus(): Record<string, { 
    current: number; 
    limit: number; 
    remaining: number; 
    resetIn: number;
  }> {
    const status: Record<string, any> = {};
    const now = Date.now();

    this.requestCounts.forEach((record, key) => {
      const [exchange] = key.split(':');
      const limit = this.limits[exchange];
      
      if (limit) {
        status[key] = {
          current: record.count,
          limit: limit.maxRequests,
          remaining: Math.max(0, limit.maxRequests - record.count),
          resetIn: Math.max(0, record.resetTime - now)
        };
      }
    });

    return status;
  }

  /**
   * 긴급 상황 시 모든 카운터 리셋
   */
  emergencyReset(): void {
    console.warn(`🚨 [RateLimiter] 긴급 리셋 - 모든 Rate Limit 카운터 초기화`);
    this.requestCounts.clear();
  }
}

// 싱글톤 인스턴스 export
export const globalRateLimiter = GlobalRateLimiter.getInstance();
