/**
 * 통합 로깅 시스템
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
  userId?: number;
  exchange?: 'upbit' | 'binance';
  orderId?: string;
  symbol?: string;
  operation?: string;
  strategy?: string;
  positionId?: number;
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
    // 환경에 따른 로그 레벨 설정
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

    // 환경변수로 로그 레벨 오버라이드 가능
    const envLevel = process.env.LOG_LEVEL;
    if (envLevel) {
      this.currentLevel = LogLevel[envLevel.toUpperCase() as keyof typeof LogLevel] || this.currentLevel;
    }
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
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    console.debug('🔍 ' + this.formatMessage('DEBUG', message, context));
  }

  /**
   * 일반 정보 로그
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

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
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    console.warn('⚠️ ' + this.formatMessage('WARN', message, context));
  }

  /**
   * 에러 로그
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorDetails = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
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
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  trade: (message: string, context?: LogContext) => logger.trade(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context),
  success: (message: string, context?: LogContext) => logger.success(message, context),
  system: (message: string, context?: LogContext) => logger.system(message, context),
  api: (method: string, endpoint: string, status?: number, context?: LogContext) =>
    logger.api(method, endpoint, status, context)
};

// 기존 로거와 호환성을 위한 별칭들
export const logError = (message: string, context?: LogContext) => log.error(message, undefined, context);
export const logWarn = (message: string, context?: LogContext) => log.warn(message, context);
export const logInfo = (message: string, context?: LogContext) => log.info(message, context);
export const logDebug = (message: string, context?: LogContext) => log.debug(message, context);
export const logSystem = (message: string, context?: LogContext) => log.system(message, context);
export const logSecurity = (message: string, context?: LogContext) => log.system(message, context);

export default logger;