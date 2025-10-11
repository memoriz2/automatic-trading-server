/**
 * 통합 로깅 시스템 (서버/클라이언트 공통)
 * 개발/운영 환경별 로그 레벨 관리
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4
}

export interface LogContext {
  userId?: number | string;
  exchange?: 'upbit' | 'binance';
  orderId?: string;
  symbol?: string;
  operation?: string;
  strategy?: string;
  positionId?: number | string;
  // 추가 필드들 (유연성을 위해)
  balance?: number;
  price?: number;
  btcAmount?: number;
  totalKrw?: number;
  [key: string]: any;
}

class Logger {
  private currentLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // 환경에 따른 로그 레벨 설정 (서버/클라이언트 모두 지원)
    this.isDevelopment = this.detectDevelopmentMode();
    this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

    // 환경변수로 로그 레벨 오버라이드 가능
    const envLevel = this.getEnvLogLevel();
    if (envLevel) {
      this.currentLevel = LogLevel[envLevel.toUpperCase() as keyof typeof LogLevel] || this.currentLevel;
    }
  }

  /**
   * 개발 모드 감지 (서버/클라이언트 모두 지원)
   */
  private detectDevelopmentMode(): boolean {
    // 브라우저 환경
    if (typeof window !== 'undefined' && typeof import.meta !== 'undefined') {
      return (import.meta as any).env?.DEV || false;
    }

    // Node.js 환경
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV !== 'production';
    }

    // 기본값
    return false;
  }

  /**
   * 환경변수에서 로그 레벨 가져오기
   */
  private getEnvLogLevel(): string | undefined {
    // Node.js 환경
    if (typeof process !== 'undefined' && process.env) {
      return process.env.LOG_LEVEL;
    }

    // 브라우저 환경 (Vite)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env.VITE_LOG_LEVEL;
    }

    return undefined;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${level}${contextStr}: ${message}`;
  }

  /**
   * 디버그 로그 (개발 환경에서만 출력)
   */
  debug(message: string, contextOrData?: LogContext | string | number): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const context = typeof contextOrData === 'object' ? contextOrData : { data: contextOrData };
    console.debug('🔍 ' + this.formatMessage('DEBUG', message, context));
  }

  /**
   * 일반 정보 로그
   */
  info(message: string, contextOrData?: LogContext | string | number): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const context = typeof contextOrData === 'object' ? contextOrData : { data: contextOrData };
    console.log('ℹ️ ' + this.formatMessage('INFO', message, context));
  }

  /**
   * 중요한 거래 관련 정보
   */
  trade(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log('💰 ' + this.formatMessage('TRADE', message, context));
  }

  /**
   * 경고 로그
   */
  warn(message: string, contextOrData?: LogContext | string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const context = typeof contextOrData === 'object' ? contextOrData : { data: contextOrData };
    console.warn('⚠️ ' + this.formatMessage('WARN', message, context));
  }

  /**
   * 에러 로그 (Error, Event, unknown 타입 모두 지원)
   */
  error(message: string, error?: Error | Event | unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    let errorDetails = '';
    if (error) {
      if (error instanceof Error) {
        errorDetails = `\nError: ${error.message}\nStack: ${error.stack}`;
      } else if (error instanceof Event) {
        errorDetails = `\nEvent: ${error.type}`;
      } else {
        errorDetails = `\nError: ${String(error)}`;
      }
    }
    console.error('🚨 ' + this.formatMessage('ERROR', message + errorDetails, context));
  }

  /**
   * 성공 로그 (거래 완료 등)
   */
  success(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log('✅ ' + this.formatMessage('SUCCESS', message, context));
  }

  /**
   * 시스템 상태 로그 (시작, 종료 등)
   */
  system(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log('🔧 ' + this.formatMessage('SYSTEM', message, context));
  }

  /**
   * API 호출 로그 (디버그용)
   */
  api(method: string, endpoint: string, status?: number, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const statusEmoji = status ? (status < 400 ? '✅' : '❌') : '🔄';
    const statusText = status ? ` (${status})` : '';
    console.debug(`${statusEmoji} API: ${method} ${endpoint}${statusText}`, context);
  }

  /**
   * WebSocket 관련 로그
   */
  websocket = {
    debug: (message: string, contextOrData?: LogContext | string | number) => this.debug(`[WS] ${message}`, contextOrData),
    info: (message: string, contextOrData?: LogContext | string | number) => this.info(`[WS] ${message}`, contextOrData),
    warn: (message: string, contextOrData?: LogContext | string) => this.warn(`[WS] ${message}`, contextOrData),
    error: (message: string, error?: Error | Event | unknown, context?: LogContext) => this.error(`[WS] ${message}`, error, context),
  };

  /**
   * 동기화 관련 로그
   */
  sync = {
    debug: (message: string, contextOrData?: LogContext | string | number) => this.debug(`[SYNC] ${message}`, contextOrData),
    info: (message: string, contextOrData?: LogContext | string | number) => this.info(`[SYNC] ${message}`, contextOrData),
    warn: (message: string, contextOrData?: LogContext | string) => this.warn(`[SYNC] ${message}`, contextOrData),
    error: (message: string, error?: Error | Event | unknown, context?: LogContext) => this.error(`[SYNC] ${message}`, error, context),
  };

  /**
   * 성능 측정 시작
   */
  timeStart(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.time(`⏱️ ${label}`);
  }

  /**
   * 성능 측정 종료
   */
  timeEnd(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.timeEnd(`⏱️ ${label}`);
  }

  /**
   * 로그 레벨 변경
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
    this.info(`로그 레벨 변경: ${LogLevel[level]}`);
  }

  /**
   * 현재 로그 레벨 조회
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

// 편의 함수들
export const log = {
  debug: (message: string, contextOrData?: LogContext | string | number) => logger.debug(message, contextOrData),
  info: (message: string, contextOrData?: LogContext | string | number) => logger.info(message, contextOrData),
  trade: (message: string, context?: LogContext) => logger.trade(message, context),
  warn: (message: string, contextOrData?: LogContext | string) => logger.warn(message, contextOrData),
  error: (message: string, error?: Error | Event | unknown, context?: LogContext) => logger.error(message, error, context),
  success: (message: string, context?: LogContext) => logger.success(message, context),
  system: (message: string, context?: LogContext) => logger.system(message, context),
  api: (method: string, endpoint: string, status?: number, context?: LogContext) =>
    logger.api(method, endpoint, status, context)
};

// 기존 로거와 호환성을 위한 별칭들
export const logError = (message: string, context?: LogContext) => log.error(message, undefined, context);
export const logWarn = (message: string, contextOrData?: LogContext | string) => log.warn(message, contextOrData);
export const logInfo = (message: string, contextOrData?: LogContext | string | number) => log.info(message, contextOrData);
export const logDebug = (message: string, contextOrData?: LogContext | string | number) => log.debug(message, contextOrData);
export const logSystem = (message: string, context?: LogContext) => log.system(message, context);
export const logSecurity = (message: string, context?: LogContext) => log.system(message, context);

// 조건부 로그 출력
export const conditionalLog = (condition: boolean, ...args: any[]) => {
  if (condition) {
    console.log(...args);
  }
};

// 성능 측정을 위한 타이머 로그
export const performanceLogger = {
  start: (label: string) => logger.timeStart(label),
  end: (label: string) => logger.timeEnd(label)
};

export default logger;
