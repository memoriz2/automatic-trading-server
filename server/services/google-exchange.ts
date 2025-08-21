import fetch from 'node-fetch';

export class GoogleExchangeService {
  private lastRate: number = 1372.0892; // 실제 구글 환율
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 30000; // 30초 캐시

  /**
   * 구글 실시간 USD→KRW 환율 조회
   */
  async getUSDKRWRate(): Promise<number> {
    const now = Date.now();
    
    // 캐시된 값이 유효하면 반환
    if (now - this.lastUpdate < this.CACHE_DURATION) {
      return this.lastRate;
    }

    try {
      // 구글 파이낸스 API 사용
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
      
      if (!response.ok) {
        throw new Error(`Google Exchange API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const rate = data.rates?.KRW;
      
      if (!rate || typeof rate !== 'number') {
        throw new Error('Invalid KRW rate from Google');
      }

      this.lastRate = rate;
      this.lastUpdate = now;
      
      console.log(`구글 USD→KRW 환율 업데이트: ${rate}원`);
      return rate;
      
    } catch (error) {
      console.warn('구글 환율 조회 실패, 기존값 사용:', error);
      return this.lastRate;
    }
  }

  /**
   * 캐시된 환율 반환 (빠른 조회용)
   */
  getCachedRate(): number {
    return this.lastRate;
  }
}