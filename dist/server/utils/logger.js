/**
 * 통합 로깅 시스템
 * 개발/운영 환경별 로그 레벨 관리
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["OFF"] = 4] = "OFF";
})(LogLevel || (LogLevel = {}));
class Logger {
    currentLevel;
    isDevelopment;
    constructor() {
        // 환경에 따른 로그 레벨 설정
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
        // 환경변수로 로그 레벨 오버라이드 가능
        const envLevel = process.env.LOG_LEVEL;
        if (envLevel) {
            this.currentLevel = LogLevel[envLevel.toUpperCase()] || this.currentLevel;
        }
    }
    shouldLog(level) {
        return level >= this.currentLevel;
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
        return `[${timestamp}] ${level}${contextStr}: ${message}`;
    }
    /**
     * 디버그 로그 (개발 환경에서만 출력)
     */
    debug(message, context) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        console.debug('🔍 ' + this.formatMessage('DEBUG', message, context));
    }
    /**
     * 일반 정보 로그
     */
    info(message, context) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        console.log('ℹ️ ' + this.formatMessage('INFO', message, context));
    }
    /**
     * 중요한 거래 관련 정보
     */
    trade(message, context) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        console.log('💰 ' + this.formatMessage('TRADE', message, context));
    }
    /**
     * 경고 로그
     */
    warn(message, context) {
        if (!this.shouldLog(LogLevel.WARN))
            return;
        console.warn('⚠️ ' + this.formatMessage('WARN', message, context));
    }
    /**
     * 에러 로그
     */
    error(message, error, context) {
        if (!this.shouldLog(LogLevel.ERROR))
            return;
        const errorDetails = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
        console.error('🚨 ' + this.formatMessage('ERROR', message + errorDetails, context));
    }
    /**
     * 성공 로그 (거래 완료 등)
     */
    success(message, context) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        console.log('✅ ' + this.formatMessage('SUCCESS', message, context));
    }
    /**
     * 시스템 상태 로그 (시작, 종료 등)
     */
    system(message, context) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        console.log('🔧 ' + this.formatMessage('SYSTEM', message, context));
    }
    /**
     * API 호출 로그 (디버그용)
     */
    api(method, endpoint, status, context) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        const statusEmoji = status ? (status < 400 ? '✅' : '❌') : '🔄';
        const statusText = status ? ` (${status})` : '';
        console.debug(`${statusEmoji} API: ${method} ${endpoint}${statusText}`, context);
    }
    /**
     * 성능 측정 시작
     */
    timeStart(label) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        console.time(`⏱️ ${label}`);
    }
    /**
     * 성능 측정 종료
     */
    timeEnd(label) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        console.timeEnd(`⏱️ ${label}`);
    }
    /**
     * 로그 레벨 변경
     */
    setLevel(level) {
        this.currentLevel = level;
        this.info(`로그 레벨 변경: ${LogLevel[level]}`);
    }
    /**
     * 현재 로그 레벨 조회
     */
    getLevel() {
        return this.currentLevel;
    }
}
// 싱글톤 인스턴스
export const logger = new Logger();
// 편의 함수들
export const log = {
    debug: (message, context) => logger.debug(message, context),
    info: (message, context) => logger.info(message, context),
    trade: (message, context) => logger.trade(message, context),
    warn: (message, context) => logger.warn(message, context),
    error: (message, error, context) => logger.error(message, error, context),
    success: (message, context) => logger.success(message, context),
    system: (message, context) => logger.system(message, context),
    api: (method, endpoint, status, context) => logger.api(method, endpoint, status, context)
};
// 기존 로거와 호환성을 위한 별칭들
export const logError = (message, context) => log.error(message, undefined, context);
export const logWarn = (message, context) => log.warn(message, context);
export const logInfo = (message, context) => log.info(message, context);
export const logDebug = (message, context) => log.debug(message, context);
export const logSystem = (message, context) => log.system(message, context);
export const logSecurity = (message, context) => log.system(message, context);
export default logger;
