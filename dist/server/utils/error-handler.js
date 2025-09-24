import { ERROR_CODES } from '../types/constants.js';
/**
 * 표준화된 거래 에러 클래스
 */
export class StandardTradingError extends Error {
    code;
    exchange;
    orderId;
    details;
    timestamp;
    constructor(code, message, options) {
        super(message);
        this.name = 'TradingError';
        this.code = code;
        this.exchange = options?.exchange;
        this.orderId = options?.orderId;
        this.details = options?.details;
        this.timestamp = new Date();
        // 원본 에러의 stack trace 유지
        if (options?.cause) {
            this.cause = options.cause;
            if (options.cause.stack) {
                this.stack = options.cause.stack;
            }
        }
    }
}
/**
 * 에러 핸들링 유틸리티 클래스
 */
export class ErrorHandler {
    /**
     * 잔고 부족 에러 생성
     */
    static insufficientBalance(exchange, currency, required, available) {
        return new StandardTradingError(ERROR_CODES.INSUFFICIENT_BALANCE, `${exchange} ${currency} 잔고 부족: 필요=${required}, 보유=${available}`, {
            exchange,
            details: { currency, required, available }
        });
    }
    /**
     * 주문 실패 에러 생성
     */
    static orderFailed(exchange, message, orderId, originalError) {
        return new StandardTradingError(ERROR_CODES.ORDER_FAILED, `${exchange} 주문 실패: ${message}`, {
            exchange,
            orderId,
            details: { originalMessage: message },
            cause: originalError
        });
    }
    /**
     * API 호출 제한 에러 생성
     */
    static rateLimitExceeded(exchange, endpoint) {
        return new StandardTradingError(ERROR_CODES.RATE_LIMIT_EXCEEDED, `${exchange} API 호출 제한 초과${endpoint ? `: ${endpoint}` : ''}`, {
            exchange,
            details: { endpoint }
        });
    }
    /**
     * 연결 실패 에러 생성
     */
    static connectionFailed(exchange, originalError) {
        return new StandardTradingError(ERROR_CODES.CONNECTION_FAILED, `${exchange} 연결 실패`, {
            exchange,
            cause: originalError
        });
    }
    /**
     * 인증 실패 에러 생성
     */
    static authenticationFailed(exchange, message) {
        return new StandardTradingError(ERROR_CODES.AUTHENTICATION_FAILED, `${exchange} 인증 실패${message ? `: ${message}` : ''}`, {
            exchange,
            details: { originalMessage: message }
        });
    }
    /**
     * 최소 주문 금액/수량 미달 에러 생성
     */
    static invalidOrderSize(exchange, symbol, provided, minimum, unit = '') {
        return new StandardTradingError(ERROR_CODES.INVALID_ORDER_SIZE, `${exchange} ${symbol} 최소 거래 ${unit} 미달: ${provided} < ${minimum}`, {
            exchange,
            details: { symbol, provided, minimum, unit }
        });
    }
    /**
     * 일반적인 에러를 표준 형식으로 변환
     */
    static fromError(error, context) {
        // 이미 StandardTradingError인 경우 그대로 반환
        if (error instanceof StandardTradingError) {
            return error;
        }
        // Error 객체인 경우
        if (error instanceof Error) {
            // 특정 에러 메시지 패턴 감지
            const message = error.message.toLowerCase();
            if (message.includes('insufficient') && message.includes('balance')) {
                return new StandardTradingError(ERROR_CODES.INSUFFICIENT_BALANCE, error.message, { exchange: context?.exchange, cause: error });
            }
            if (message.includes('rate limit') || message.includes('429')) {
                return new StandardTradingError(ERROR_CODES.RATE_LIMIT_EXCEEDED, error.message, { exchange: context?.exchange, cause: error });
            }
            if (message.includes('authentication') || message.includes('unauthorized') || message.includes('401')) {
                return new StandardTradingError(ERROR_CODES.AUTHENTICATION_FAILED, error.message, { exchange: context?.exchange, cause: error });
            }
            if (message.includes('connection') || message.includes('network') || message.includes('timeout')) {
                return new StandardTradingError(ERROR_CODES.CONNECTION_FAILED, error.message, { exchange: context?.exchange, cause: error });
            }
            // 일반 에러
            return new StandardTradingError(ERROR_CODES.UNKNOWN_ERROR, error.message, {
                exchange: context?.exchange,
                orderId: context?.orderId,
                details: { operation: context?.operation },
                cause: error
            });
        }
        // 기타 (string, object 등)
        return new StandardTradingError(ERROR_CODES.UNKNOWN_ERROR, String(error), {
            exchange: context?.exchange,
            orderId: context?.orderId,
            details: { operation: context?.operation, originalError: error }
        });
    }
    /**
     * 에러 로깅 (구조화된 로그)
     */
    static logError(error, userId) {
        const logData = {
            timestamp: error.timestamp.toISOString(),
            code: error.code,
            message: error.message,
            exchange: error.exchange,
            orderId: error.orderId,
            userId,
            details: error.details,
            stack: error.stack
        };
        console.error('🚨 거래 에러:', JSON.stringify(logData, null, 2));
    }
    /**
     * 재시도 가능한 에러인지 판단
     */
    static isRetryable(error) {
        const retryableCodes = [
            ERROR_CODES.CONNECTION_FAILED,
            ERROR_CODES.RATE_LIMIT_EXCEEDED,
            ERROR_CODES.SYSTEM_MAINTENANCE,
        ];
        return retryableCodes.includes(error.code);
    }
    /**
     * 사용자에게 표시할 친화적인 메시지 생성
     */
    static getUserFriendlyMessage(error) {
        const exchangeNames = {
            upbit: '업비트',
            binance: '바이낸스'
        };
        const exchangeName = error.exchange ? exchangeNames[error.exchange] : '거래소';
        switch (error.code) {
            case ERROR_CODES.INSUFFICIENT_BALANCE:
                return `${exchangeName}에서 잔고가 부족합니다. 잔고를 확인해주세요.`;
            case ERROR_CODES.RATE_LIMIT_EXCEEDED:
                return `${exchangeName} API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.`;
            case ERROR_CODES.AUTHENTICATION_FAILED:
                return `${exchangeName} API 키 인증에 실패했습니다. API 키 설정을 확인해주세요.`;
            case ERROR_CODES.CONNECTION_FAILED:
                return `${exchangeName} 연결에 실패했습니다. 네트워크 상태를 확인해주세요.`;
            case ERROR_CODES.INVALID_ORDER_SIZE:
                return `주문 수량이 최소 거래 단위에 미달합니다.`;
            case ERROR_CODES.ORDER_FAILED:
                return `${exchangeName}에서 주문 처리 중 오류가 발생했습니다.`;
            case ERROR_CODES.MARKET_CLOSED:
                return `현재 시장이 휴장 중입니다.`;
            default:
                return `거래 중 오류가 발생했습니다: ${error.message}`;
        }
    }
}
/**
 * 표준화된 에러 처리 래퍼 함수
 */
export function withErrorHandling(operation, exchange) {
    return function (fn) {
        return async function (...args) {
            try {
                return await fn.apply(this, args);
            }
            catch (error) {
                const standardError = ErrorHandler.fromError(error, {
                    operation,
                    exchange,
                });
                ErrorHandler.logError(standardError);
                throw standardError;
            }
        };
    };
}
