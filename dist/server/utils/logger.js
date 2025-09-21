/**
 * 프로덕션 수준의 로그 시스템
 * 환경에 따라 로그 레벨을 조정하고 구조화된 로그를 제공
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
class Logger {
    level;
    isProduction;
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        const envLevel = process.env.LOG_LEVEL?.toLowerCase();
        // 프로덕션에서는 기본적으로 INFO 레벨, 개발에서는 DEBUG
        switch (envLevel) {
            case 'error':
                this.level = LogLevel.ERROR;
                break;
            case 'warn':
                this.level = LogLevel.WARN;
                break;
            case 'info':
                this.level = LogLevel.INFO;
                break;
            case 'debug':
                this.level = LogLevel.DEBUG;
                break;
            default:
                this.level = this.isProduction ? LogLevel.INFO : LogLevel.DEBUG;
        }
    }
    shouldLog(level) {
        return level <= this.level;
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const emoji = this.getEmoji(level);
        if (this.isProduction) {
            // 프로덕션: JSON 형태로 구조화된 로그
            return JSON.stringify({
                timestamp,
                level,
                message,
                ...context
            });
        }
        else {
            // 개발: 가독성 좋은 형태
            const contextStr = context && Object.keys(context).length > 0
                ? ` ${JSON.stringify(context)}`
                : '';
            return `${emoji} [${timestamp}] ${message}${contextStr}`;
        }
    }
    getEmoji(level) {
        switch (level) {
            case 'ERROR': return '❌';
            case 'WARN': return '⚠️';
            case 'INFO': return 'ℹ️';
            case 'DEBUG': return '🔍';
            default: return '📝';
        }
    }
    error(message, context) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage('ERROR', message, context));
        }
    }
    warn(message, context) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage('WARN', message, context));
        }
    }
    info(message, context) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage('INFO', message, context));
        }
    }
    debug(message, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage('DEBUG', message, context));
        }
    }
    // 시스템 시작 시에만 사용하는 특별한 로그 (항상 출력)
    system(message, context) {
        console.log(this.formatMessage('SYSTEM', message, context));
    }
    // 보안 관련 로그 (항상 출력)
    security(message, context) {
        console.log(this.formatMessage('SECURITY', message, context));
    }
}
// 싱글톤 인스턴스
export const logger = new Logger();
// 편의 함수들
export const logError = (message, context) => logger.error(message, context);
export const logWarn = (message, context) => logger.warn(message, context);
export const logInfo = (message, context) => logger.info(message, context);
export const logDebug = (message, context) => logger.debug(message, context);
export const logSystem = (message, context) => logger.system(message, context);
export const logSecurity = (message, context) => logger.security(message, context);
