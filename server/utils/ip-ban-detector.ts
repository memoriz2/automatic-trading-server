/**
 * IP 밴 감지 및 대응 시스템
 */

import { globalRateLimiter } from './rate-limiter.js';
import { proxyManager } from './proxy-manager.js';

interface BanRecord {
  exchange: string;
  detectedAt: number;
  banUntil?: number;
  errorCount: number;
  lastError: string;
}

export class IpBanDetector {
  private static instance: IpBanDetector;
  private banRecords = new Map<string, BanRecord>();
  private readonly BAN_INDICATORS = [
    'IP banned',
    'Way too much request weight',
    '418',
    'Too Many Requests',
    'Rate limit exceeded'
  ];

  static getInstance(): IpBanDetector {
    if (!IpBanDetector.instance) {
      IpBanDetector.instance = new IpBanDetector();
    }
    return IpBanDetector.instance;
  }

  /**
   * 에러 메시지에서 IP 밴 감지
   */
  detectBan(exchange: string, error: Error | string): {
    isBanned: boolean;
    banDuration?: number;
    severity: 'low' | 'medium' | 'high';
    action: 'continue' | 'wait' | 'switch-proxy' | 'emergency';
  } {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const isBanError = this.BAN_INDICATORS.some(indicator => 
      errorMessage.toLowerCase().includes(indicator.toLowerCase())
    );

    if (!isBanError) {
      return { isBanned: false, severity: 'low', action: 'continue' };
    }

    console.error(`🚨 [IpBanDetector] ${exchange} IP 밴 감지: ${errorMessage}`);

    // 밴 기록 업데이트
    const key = `${exchange}:ban`;
    let record = this.banRecords.get(key);
    
    if (!record) {
      record = {
        exchange,
        detectedAt: Date.now(),
        errorCount: 0,
        lastError: errorMessage
      };
    }
    
    record.errorCount++;
    record.lastError = errorMessage;
    record.detectedAt = Date.now();

    // 밴 지속 시간 추출 (바이낸스의 경우)
    if (exchange === 'binance' && errorMessage.includes('banned until')) {
      const match = errorMessage.match(/banned until (\d+)/);
      if (match) {
        record.banUntil = parseInt(match[1]);
      }
    }

    this.banRecords.set(key, record);

    // 심각도 및 대응 방안 결정
    let severity: 'low' | 'medium' | 'high' = 'medium';
    let action: 'continue' | 'wait' | 'switch-proxy' | 'emergency' = 'wait';

    if (errorMessage.includes('418') || errorMessage.includes('IP banned')) {
      severity = 'high';
      action = 'switch-proxy';
    } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      severity = 'medium';
      action = 'wait';
    }

    // 연속 밴 에러가 많으면 긴급 상황
    if (record.errorCount >= 3) {
      severity = 'high';
      action = 'emergency';
    }

    return {
      isBanned: true,
      banDuration: record.banUntil ? record.banUntil - Date.now() : undefined,
      severity,
      action
    };
  }

  /**
   * IP 밴 대응 실행
   */
  async handleBan(exchange: string, detection: ReturnType<typeof this.detectBan>): Promise<{
    success: boolean;
    message: string;
    nextAction?: string;
  }> {
    console.warn(`🔧 [IpBanDetector] ${exchange} 밴 대응 실행: ${detection.action}`);

    switch (detection.action) {
      case 'continue':
        return { success: true, message: '정상 진행' };

      case 'wait':
        const waitTime = detection.banDuration || 60000; // 기본 1분
        console.log(`⏰ [IpBanDetector] ${exchange} 대기: ${Math.ceil(waitTime/1000)}초`);
        
        // Rate Limiter 긴급 리셋
        globalRateLimiter.emergencyReset();
        
        await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 300000))); // 최대 5분
        return { 
          success: true, 
          message: `${Math.ceil(waitTime/1000)}초 대기 완료`,
          nextAction: 'retry'
        };

      case 'switch-proxy':
        console.log(`🔄 [IpBanDetector] ${exchange} 프록시 전환 시도`);
        
        // 모든 프록시 재활성화 (긴급 상황)
        proxyManager.resetAllProxies();
        
        return { 
          success: true, 
          message: '프록시 전환 완료',
          nextAction: 'use-proxy'
        };

      case 'emergency':
        console.error(`🚨 [IpBanDetector] ${exchange} 긴급 상황 - 모든 시스템 리셋`);
        
        // 모든 시스템 리셋
        globalRateLimiter.emergencyReset();
        proxyManager.resetAllProxies();
        
        // 긴급 대기
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1분 대기
        
        return { 
          success: true, 
          message: '긴급 시스템 리셋 완료',
          nextAction: 'fallback-mode'
        };

      default:
        return { success: false, message: '알 수 없는 대응 방안' };
    }
  }

  /**
   * 밴 상태 확인
   */
  isBanned(exchange: string): boolean {
    const key = `${exchange}:ban`;
    const record = this.banRecords.get(key);
    
    if (!record) return false;
    
    // 밴 지속 시간이 설정되어 있으면 확인
    if (record.banUntil) {
      return Date.now() < record.banUntil;
    }
    
    // 최근 5분 내에 밴 에러가 있었으면 여전히 밴 상태로 간주
    return (Date.now() - record.detectedAt) < 5 * 60 * 1000;
  }

  /**
   * 밴 기록 정리
   */
  clearBanRecord(exchange: string): void {
    const key = `${exchange}:ban`;
    this.banRecords.delete(key);
    console.log(`✅ [IpBanDetector] ${exchange} 밴 기록 정리`);
  }

  /**
   * 현재 상태 조회
   */
  getStatus(): Record<string, {
    isBanned: boolean;
    errorCount: number;
    lastError?: string;
    detectedAt?: string;
    banUntil?: string;
  }> {
    const status: Record<string, any> = {};
    
    for (const [key, record] of Array.from(this.banRecords.entries())) {
      status[key] = {
        isBanned: this.isBanned(record.exchange),
        errorCount: record.errorCount,
        lastError: record.lastError,
        detectedAt: new Date(record.detectedAt).toISOString(),
        banUntil: record.banUntil ? new Date(record.banUntil).toISOString() : undefined
      };
    }
    
    return status;
  }
}

// 싱글톤 인스턴스 export
export const ipBanDetector = IpBanDetector.getInstance();
