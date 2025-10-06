import { ErrorTrackingRepository } from '../repositories/ErrorTrackingRepository.js';
import { ErrorSeverity, ErrorCategory, RetryStatus, RetryStrategy, ResolutionMethod } from '../types/error-tracking.js';
import crypto from 'crypto';
/**
 * 거래 오류 추적 및 분석 서비스
 */
export class ErrorTrackingService {
    errorRepository;
    // 기본 재시도 설정
    defaultRetryConfig = {
        maxRetries: 3,
        strategy: RetryStrategy.EXPONENTIAL,
        baseDelayMs: 1000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitterEnabled: true
    };
    constructor() {
        this.errorRepository = new ErrorTrackingRepository();
    }
    /**
     * 거래 오류 기록 및 분석
     */
    async recordError(request) {
        const analysis = await this.analyzeError(request.error, request.context);
        // 오류 시그니처 생성
        const errorSignature = this.generateErrorSignature(request.error, request.context);
        // 거래 오류 데이터 구성
        const errorData = {
            userId: request.userId,
            tradeId: request.tradeId,
            positionId: request.positionId,
            errorCategory: analysis.category,
            errorSeverity: analysis.severity,
            errorCode: this.extractErrorCode(request.error),
            errorMessage: this.extractErrorMessage(request.error),
            errorSignature: errorSignature,
            exchange: request.context.exchange,
            symbol: request.context.symbol,
            side: request.context.side,
            intendedQuantity: request.context.quantity,
            intendedPrice: request.context.price,
            apiEndpoint: request.context.endpoint,
            requestPayload: request.context.payload,
            responseData: request.context.response,
            retryCount: 0,
            retryStatus: analysis.isRetryable ? RetryStatus.PENDING : RetryStatus.FAILED,
            maxRetries: analysis.recommendedMaxRetries,
            nextRetryAt: analysis.isRetryable ? new Date(Date.now() + analysis.estimatedRecoveryTime) : undefined,
            isResolved: false,
            stackTrace: request.error instanceof Error ? request.error.stack : undefined,
            userAgent: request.metadata?.userAgent,
            ipAddress: request.metadata?.ipAddress,
            sessionId: request.metadata?.sessionId
        };
        // 거래 오류 기록
        const tradingError = await this.errorRepository.createTradingError(errorData);
        // 오류 패턴 업데이트
        await this.updateErrorPattern(errorSignature, tradingError);
        // 알림 발송 (필요시)
        if (this.shouldSendNotification(analysis.severity)) {
            await this.sendErrorNotification(tradingError);
        }
        console.log(`🚨 [ErrorTracking] 거래 오류 기록: ${tradingError.id} - ${analysis.severity}/${analysis.category}`);
        return tradingError;
    }
    /**
     * 오류 분석
     */
    async analyzeError(error, context) {
        const errorMessage = this.extractErrorMessage(error);
        const errorCode = this.extractErrorCode(error);
        // 오류 분류
        const category = this.categorizeError(errorMessage, errorCode, context);
        const severity = this.determineSeverity(errorMessage, errorCode, category);
        // 재시도 가능성 판단
        const isRetryable = this.isRetryableError(errorMessage, errorCode, category);
        // 복구 시간 추정
        const estimatedRecoveryTime = this.estimateRecoveryTime(category, severity);
        // 재시도 설정 추천
        const retryConfig = this.getRecommendedRetryConfig(category, severity);
        return {
            errorId: 0, // 임시값
            severity,
            category,
            isRetryable,
            suggestedAction: this.getSuggestedAction(category, severity, errorMessage),
            estimatedRecoveryTime,
            similarErrors: [], // TODO: 유사 오류 검색 구현
            recommendedMaxRetries: retryConfig.maxRetries,
            recommendedBackoffStrategy: retryConfig.strategy,
            recommendedBackoffDelay: retryConfig.baseDelayMs
        };
    }
    /**
     * 오류 카테고리 분류
     */
    categorizeError(message, code, _context) {
        const lowerMessage = message.toLowerCase();
        // API 관련 오류
        if (lowerMessage.includes('api') || lowerMessage.includes('unauthorized') ||
            lowerMessage.includes('forbidden') || lowerMessage.includes('rate limit') ||
            code?.startsWith('API_')) {
            return ErrorCategory.API;
        }
        // 네트워크 관련 오류
        if (lowerMessage.includes('network') || lowerMessage.includes('timeout') ||
            lowerMessage.includes('connection') || lowerMessage.includes('econnreset') ||
            lowerMessage.includes('enotfound')) {
            return ErrorCategory.NETWORK;
        }
        // 잔고 관련 오류
        if (lowerMessage.includes('balance') || lowerMessage.includes('insufficient') ||
            lowerMessage.includes('not enough') || lowerMessage.includes('잔고')) {
            return ErrorCategory.BALANCE;
        }
        // 주문 관련 오류
        if (lowerMessage.includes('order') || lowerMessage.includes('trade') ||
            lowerMessage.includes('quantity') || lowerMessage.includes('price') ||
            lowerMessage.includes('market closed')) {
            return ErrorCategory.ORDER;
        }
        // 검증 관련 오류
        if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') ||
            lowerMessage.includes('required') || lowerMessage.includes('format')) {
            return ErrorCategory.VALIDATION;
        }
        // 기본값: 시스템 오류
        return ErrorCategory.SYSTEM;
    }
    /**
     * 오류 심각도 결정
     */
    determineSeverity(message, code, category) {
        const lowerMessage = message.toLowerCase();
        // 치명적 오류
        if (lowerMessage.includes('critical') || lowerMessage.includes('fatal') ||
            lowerMessage.includes('system error') || lowerMessage.includes('database') ||
            code?.includes('CRITICAL')) {
            return ErrorSeverity.CRITICAL;
        }
        // 높은 심각도
        if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden') ||
            category === ErrorCategory.BALANCE || lowerMessage.includes('ip banned')) {
            return ErrorSeverity.HIGH;
        }
        // 보통 심각도
        if (category === ErrorCategory.ORDER || category === ErrorCategory.VALIDATION ||
            lowerMessage.includes('rate limit')) {
            return ErrorSeverity.MEDIUM;
        }
        // 낮은 심각도 (기본값)
        return ErrorSeverity.LOW;
    }
    /**
     * 재시도 가능 여부 판단
     */
    isRetryableError(message, _code, category) {
        const lowerMessage = message.toLowerCase();
        // 재시도 불가능한 오류들
        const nonRetryablePatterns = [
            'unauthorized', 'forbidden', 'invalid api key',
            'insufficient balance', 'market closed', 'invalid symbol',
            'validation error', 'bad request'
        ];
        for (const pattern of nonRetryablePatterns) {
            if (lowerMessage.includes(pattern)) {
                return false;
            }
        }
        // 카테고리별 재시도 가능성
        switch (category) {
            case ErrorCategory.NETWORK:
                return true; // 네트워크 오류는 대부분 재시도 가능
            case ErrorCategory.API:
                return !lowerMessage.includes('unauthorized') && !lowerMessage.includes('forbidden');
            case ErrorCategory.BALANCE:
                return false; // 잔고 부족은 재시도해도 해결되지 않음
            case ErrorCategory.VALIDATION:
                return false; // 검증 오류는 데이터 수정이 필요
            case ErrorCategory.ORDER:
                return lowerMessage.includes('timeout') || lowerMessage.includes('temporary');
            case ErrorCategory.SYSTEM:
                return true; // 시스템 오류는 일시적일 가능성
            default:
                return true;
        }
    }
    /**
     * 복구 시간 추정 (밀리초)
     */
    estimateRecoveryTime(category, severity) {
        const baseDelays = {
            [ErrorSeverity.LOW]: 1000, // 1초
            [ErrorSeverity.MEDIUM]: 5000, // 5초
            [ErrorSeverity.HIGH]: 30000, // 30초
            [ErrorSeverity.CRITICAL]: 300000 // 5분
        };
        const categoryMultipliers = {
            [ErrorCategory.NETWORK]: 1,
            [ErrorCategory.API]: 2,
            [ErrorCategory.ORDER]: 1.5,
            [ErrorCategory.SYSTEM]: 3,
            [ErrorCategory.BALANCE]: 1,
            [ErrorCategory.VALIDATION]: 1
        };
        return baseDelays[severity] * categoryMultipliers[category];
    }
    /**
     * 추천 재시도 설정
     */
    getRecommendedRetryConfig(category, severity) {
        const config = { ...this.defaultRetryConfig };
        // 심각도별 최대 재시도 횟수 조정
        switch (severity) {
            case ErrorSeverity.LOW:
                config.maxRetries = 5;
                break;
            case ErrorSeverity.MEDIUM:
                config.maxRetries = 3;
                break;
            case ErrorSeverity.HIGH:
                config.maxRetries = 2;
                break;
            case ErrorSeverity.CRITICAL:
                config.maxRetries = 1;
                break;
        }
        // 카테고리별 전략 조정
        switch (category) {
            case ErrorCategory.NETWORK:
                config.strategy = RetryStrategy.EXPONENTIAL;
                config.baseDelayMs = 2000;
                break;
            case ErrorCategory.API:
                config.strategy = RetryStrategy.LINEAR;
                config.baseDelayMs = 5000;
                break;
            case ErrorCategory.ORDER:
                config.strategy = RetryStrategy.EXPONENTIAL;
                config.baseDelayMs = 3000;
                break;
            default:
                // 기본 설정 유지
                break;
        }
        return config;
    }
    /**
     * 추천 조치 사항
     */
    getSuggestedAction(category, _severity, message) {
        const lowerMessage = message.toLowerCase();
        // 특정 오류 패턴별 조치사항
        if (lowerMessage.includes('unauthorized') || lowerMessage.includes('invalid api key')) {
            return 'API 키를 확인하고 재설정하세요.';
        }
        if (lowerMessage.includes('insufficient balance')) {
            return '거래소 잔고를 확인하고 충분한 자금을 준비하세요.';
        }
        if (lowerMessage.includes('rate limit')) {
            return 'API 호출 빈도를 줄이거나 잠시 후 다시 시도하세요.';
        }
        if (lowerMessage.includes('ip banned')) {
            return 'IP 밴이 해제될 때까지 대기하거나 프록시를 사용하세요.';
        }
        // 카테고리별 기본 조치사항
        switch (category) {
            case ErrorCategory.NETWORK:
                return '네트워크 연결을 확인하고 재시도하세요.';
            case ErrorCategory.API:
                return 'API 연결 상태를 확인하고 재시도하세요.';
            case ErrorCategory.BALANCE:
                return '거래소 잔고를 확인하세요.';
            case ErrorCategory.ORDER:
                return '주문 파라미터를 확인하고 재시도하세요.';
            case ErrorCategory.VALIDATION:
                return '입력 데이터를 검증하고 수정하세요.';
            case ErrorCategory.SYSTEM:
                return '시스템 관리자에게 문의하세요.';
            default:
                return '오류 로그를 확인하고 적절한 조치를 취하세요.';
        }
    }
    /**
     * 재시도 실행
     */
    async retryError(errorId) {
        const tradingError = await this.errorRepository.findTradingErrorById(errorId);
        if (!tradingError) {
            return { success: false, error: '오류 기록을 찾을 수 없습니다.' };
        }
        if (tradingError.retryCount >= tradingError.maxRetries) {
            return { success: false, error: '최대 재시도 횟수를 초과했습니다.' };
        }
        if (tradingError.isResolved) {
            return { success: false, error: '이미 해결된 오류입니다.' };
        }
        // 재시도 시작
        const retryAttempt = tradingError.retryCount + 1;
        const startTime = new Date();
        await this.errorRepository.updateTradingError(errorId, {
            retryStatus: RetryStatus.RETRYING,
            retryCount: retryAttempt
        });
        // 재시도 이력 기록 시작
        await this.errorRepository.createRetryHistory({
            tradingErrorId: errorId,
            retryAttempt,
            retryStartedAt: startTime,
            success: false,
            backoffDelayMs: this.calculateBackoffDelay(retryAttempt, this.defaultRetryConfig),
            strategyUsed: this.defaultRetryConfig.strategy
        });
        try {
            // 실제 재시도 로직 실행
            const result = await this.executeRetry(tradingError);
            // 성공 시 업데이트
            await Promise.all([
                this.errorRepository.updateTradingError(errorId, {
                    retryStatus: RetryStatus.SUCCESS,
                    isResolved: true,
                    resolvedAt: new Date(),
                    resolutionMethod: ResolutionMethod.AUTO_RETRY
                }),
                this.errorRepository.createRetryHistory({
                    tradingErrorId: errorId,
                    retryAttempt,
                    retryStartedAt: startTime,
                    retryCompletedAt: new Date(),
                    success: true,
                    responseData: result,
                    backoffDelayMs: 0,
                    strategyUsed: this.defaultRetryConfig.strategy
                })
            ]);
            console.log(`✅ [ErrorTracking] 재시도 성공: ${errorId} (시도 ${retryAttempt})`);
            return { success: true, result };
        }
        catch (error) {
            const nextRetryDelay = this.calculateBackoffDelay(retryAttempt + 1, this.defaultRetryConfig);
            const shouldAbandon = retryAttempt >= tradingError.maxRetries;
            // 실패 시 업데이트
            await Promise.all([
                this.errorRepository.updateTradingError(errorId, {
                    retryStatus: shouldAbandon ? RetryStatus.ABANDONED : RetryStatus.PENDING,
                    nextRetryAt: shouldAbandon ? undefined : new Date(Date.now() + nextRetryDelay)
                }),
                this.errorRepository.createRetryHistory({
                    tradingErrorId: errorId,
                    retryAttempt,
                    retryStartedAt: startTime,
                    retryCompletedAt: new Date(),
                    success: false,
                    errorMessage: error.message,
                    backoffDelayMs: nextRetryDelay,
                    strategyUsed: this.defaultRetryConfig.strategy
                })
            ]);
            console.log(`❌ [ErrorTracking] 재시도 실패: ${errorId} (시도 ${retryAttempt}/${tradingError.maxRetries})`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 실제 재시도 로직 실행
     */
    async executeRetry(tradingError) {
        // TODO: 실제 거래 재실행 로직 구현
        // 이 부분은 TradingManager나 ExchangeAdapter와 연동해야 함
        console.log(`🔄 [ErrorTracking] 재시도 실행 중: ${tradingError.exchange}/${tradingError.symbol}/${tradingError.side}`);
        // 임시 구현 - 실제로는 거래소 API 재호출
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 50% 확률로 성공/실패 시뮬레이션
        if (Math.random() > 0.5) {
            return { message: '재시도 성공', timestamp: new Date() };
        }
        else {
            throw new Error('재시도 실패: 시뮬레이션');
        }
    }
    /**
     * 백오프 지연 시간 계산
     */
    calculateBackoffDelay(attempt, config) {
        let delay;
        switch (config.strategy) {
            case RetryStrategy.LINEAR:
                delay = config.baseDelayMs * attempt;
                break;
            case RetryStrategy.EXPONENTIAL:
                delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
                break;
            case RetryStrategy.CUSTOM:
                // 커스텀 로직 구현
                delay = config.baseDelayMs;
                break;
            default:
                delay = config.baseDelayMs;
        }
        // 최대 지연 시간 제한
        delay = Math.min(delay, config.maxDelayMs);
        // 지터 추가 (랜덤성)
        if (config.jitterEnabled) {
            delay += Math.random() * (delay * 0.1); // 최대 10% 지터
        }
        return Math.floor(delay);
    }
    /**
     * 오류 시그니처 생성
     */
    generateErrorSignature(error, context) {
        const message = this.extractErrorMessage(error);
        const code = this.extractErrorCode(error);
        // 시그니처 구성 요소
        const components = [
            context.exchange,
            context.endpoint || 'unknown',
            code || 'no_code',
            message.substring(0, 100) // 메시지 첫 100자만 사용
        ];
        const signature = components.join('|');
        return crypto.createHash('md5').update(signature).digest('hex');
    }
    /**
     * 오류 패턴 업데이트
     */
    async updateErrorPattern(signature, tradingError) {
        try {
            await this.errorRepository.upsertErrorPattern({
                patternName: `${tradingError.exchange}_${tradingError.errorCategory}`,
                errorSignature: signature,
                occurrenceCount: 1,
                firstSeen: new Date(),
                lastSeen: new Date(),
                affectedUsers: 1,
                totalFailedTrades: 1,
                estimatedLoss: 0,
                isKnownIssue: false,
                fixPriority: this.getFixPriority(tradingError.errorSeverity),
                fixStatus: 'open'
            });
        }
        catch (error) {
            console.error('오류 패턴 업데이트 실패:', error);
        }
    }
    /**
     * 수정 우선순위 결정
     */
    getFixPriority(severity) {
        switch (severity) {
            case ErrorSeverity.CRITICAL: return 5;
            case ErrorSeverity.HIGH: return 4;
            case ErrorSeverity.MEDIUM: return 3;
            case ErrorSeverity.LOW: return 2;
            default: return 1;
        }
    }
    /**
     * 알림 발송 여부 결정
     */
    shouldSendNotification(severity) {
        return severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL;
    }
    /**
     * 오류 알림 발송
     */
    async sendErrorNotification(tradingError) {
        // TODO: 실제 알림 발송 로직 구현 (이메일, 슬랙, 웹훅 등)
        console.log(`🚨 [ErrorTracking] 알림 발송: ${tradingError.errorSeverity} 오류 발생`);
        console.log(`   - 거래소: ${tradingError.exchange}`);
        console.log(`   - 심벌: ${tradingError.symbol}`);
        console.log(`   - 메시지: ${tradingError.errorMessage}`);
    }
    /**
     * 오류 메시지 추출
     */
    extractErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }
        return error.message || 'Unknown error';
    }
    /**
     * 오류 코드 추출
     */
    extractErrorCode(error) {
        if (typeof error === 'string') {
            // 문자열에서 오류 코드 패턴 찾기
            const codeMatch = error.match(/\b[A-Z_]{3,}\b/);
            return codeMatch ? codeMatch[0] : undefined;
        }
        // Error 객체에서 코드 추출
        return error.code || undefined;
    }
    /**
     * 대기 중인 재시도 처리
     */
    async processPendingRetries() {
        try {
            const pendingErrors = await this.errorRepository.findPendingRetries();
            console.log(`🔄 [ErrorTracking] 대기 중인 재시도 ${pendingErrors.length}건 처리 시작`);
            for (const error of pendingErrors) {
                try {
                    await this.retryError(error.id);
                    // 재시도 간 간격 (과부하 방지)
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                catch (retryError) {
                    console.error(`재시도 처리 실패 (오류 ID: ${error.id}):`, retryError);
                }
            }
            console.log(`✅ [ErrorTracking] 대기 중인 재시도 처리 완료`);
        }
        catch (error) {
            console.error('대기 중인 재시도 처리 중 오류:', error);
        }
    }
    /**
     * 오류 통계 조회
     */
    async getErrorStats(userId, days = 30) {
        return this.errorRepository.getErrorStats(userId, days);
    }
    /**
     * 사용자별 오류 목록 조회
     */
    async getUserErrors(userId, options = {}) {
        return this.errorRepository.findTradingErrorsByUserId(userId, options);
    }
    /**
     * 오류 패턴 목록 조회
     */
    async getErrorPatterns(options = {}) {
        return this.errorRepository.getErrorPatterns(options);
    }
}
