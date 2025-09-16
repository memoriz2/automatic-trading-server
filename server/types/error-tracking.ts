/**
 * 거래 오류 추적 시스템 타입 정의
 */

// 오류 심각도
export enum ErrorSeverity {
  LOW = 'low',           // 낮음: 재시도로 해결 가능한 일시적 오류
  MEDIUM = 'medium',     // 보통: 여러 번의 재시도나 간단한 수정 필요
  HIGH = 'high',         // 높음: 즉각적인 개입 필요, 거래 실패 가능성
  CRITICAL = 'critical'  // 치명적: 시스템 중단, 즉시 알림 및 수동 개입 필요
}

// 오류 카테고리
export enum ErrorCategory {
  API = 'api',                 // API 호출 관련 오류
  NETWORK = 'network',         // 네트워크 연결 오류
  VALIDATION = 'validation',   // 데이터 검증 오류
  BALANCE = 'balance',         // 잔고 부족 등 잔고 관련 오류
  ORDER = 'order',             // 주문 실행 관련 오류
  SYSTEM = 'system'            // 시스템 내부 오류
}

// 재시도 상태
export enum RetryStatus {
  PENDING = 'pending',       // 재시도 대기 중
  RETRYING = 'retrying',     // 재시도 진행 중
  SUCCESS = 'success',       // 재시도 성공
  FAILED = 'failed',         // 재시도 실패
  ABANDONED = 'abandoned'    // 재시도 포기
}

// 해결 방법
export enum ResolutionMethod {
  AUTO_RETRY = 'auto_retry',      // 자동 재시도로 해결
  MANUAL_FIX = 'manual_fix',      // 수동 수정으로 해결
  IGNORED = 'ignored',            // 무시됨
  COMPENSATED = 'compensated'     // 보상 처리됨
}

// 수정 상태
export enum FixStatus {
  OPEN = 'open',                 // 열림
  INVESTIGATING = 'investigating', // 조사 중
  FIXING = 'fixing',             // 수정 중
  FIXED = 'fixed'                // 수정 완료
}

// 재시도 전략
export enum RetryStrategy {
  EXPONENTIAL = 'exponential',   // 지수 백오프
  LINEAR = 'linear',             // 선형 지연
  CUSTOM = 'custom'              // 커스텀 전략
}

// 알림 타입
export enum NotificationType {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  DASHBOARD = 'dashboard'
}

// 거래 오류 DTO
export interface TradingErrorDto {
  id?: number;
  userId: number;
  tradeId?: number;
  positionId?: number;
  
  // 오류 분류
  errorCategory: ErrorCategory;
  errorSeverity: ErrorSeverity;
  errorCode?: string;
  errorMessage: string;
  errorSignature?: string;
  
  // 거래 컨텍스트
  exchange: string;
  symbol: string;
  side: string;
  intendedQuantity?: number;
  intendedPrice?: number;
  
  // 시스템 정보
  apiEndpoint?: string;
  requestPayload?: any;
  responseData?: any;
  
  // 재시도 정보
  retryCount: number;
  retryStatus: RetryStatus;
  maxRetries: number;
  nextRetryAt?: Date;
  
  // 해결 정보
  isResolved: boolean;
  resolvedAt?: Date;
  resolutionMethod?: ResolutionMethod;
  resolutionNotes?: string;
  
  // 메타데이터
  stackTrace?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// 오류 패턴 DTO
export interface ErrorPatternDto {
  id?: number;
  patternName: string;
  errorSignature: string;
  
  // 패턴 통계
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
  
  // 영향 분석
  affectedUsers: number;
  totalFailedTrades: number;
  estimatedLoss: number;
  
  // 해결 상태
  isKnownIssue: boolean;
  fixPriority: number;
  fixStatus: FixStatus;
  
  // 해결 방안
  suggestedFix?: string;
  fixImplementedAt?: Date;
  fixNotes?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// 재시도 이력 DTO
export interface RetryHistoryDto {
  id?: number;
  tradingErrorId: number;
  
  retryAttempt: number;
  retryStartedAt: Date;
  retryCompletedAt?: Date;
  
  // 재시도 결과
  success: boolean;
  errorMessage?: string;
  responseData?: any;
  
  // 재시도 전략
  backoffDelayMs: number;
  strategyUsed: RetryStrategy;
  
  createdAt?: Date;
}

// 오류 알림 DTO
export interface ErrorNotificationDto {
  id?: number;
  tradingErrorId: number;
  
  notificationType: NotificationType;
  recipient: string;
  
  // 알림 내용
  subject: string;
  message: string;
  
  // 발송 상태
  sentAt?: Date;
  deliveryStatus: 'pending' | 'sent' | 'failed';
  deliveryError?: string;
  
  createdAt?: Date;
}

// 오류 통계 DTO
export interface ErrorStatsDto {
  totalErrors: number;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsByExchange: Record<string, number>;
  
  // 해결 통계
  resolvedErrors: number;
  pendingErrors: number;
  resolutionRate: number;
  
  // 재시도 통계
  totalRetries: number;
  successfulRetries: number;
  retrySuccessRate: number;
  
  // 시간별 통계
  errorsLast24Hours: number;
  errorsLastWeek: number;
  errorsLastMonth: number;
}

// 오류 분석 결과
export interface ErrorAnalysisDto {
  errorId: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  
  // 분석 결과
  isRetryable: boolean;
  suggestedAction: string;
  estimatedRecoveryTime: number; // milliseconds
  
  // 유사 오류
  similarErrors: number[];
  patternId?: number;
  
  // 추천 설정
  recommendedMaxRetries: number;
  recommendedBackoffStrategy: RetryStrategy;
  recommendedBackoffDelay: number;
}

// 오류 생성 요청
export interface CreateErrorRequest {
  userId: number;
  tradeId?: number;
  positionId?: number;
  
  error: Error | string;
  context: {
    exchange: string;
    symbol: string;
    side: string;
    quantity?: number;
    price?: number;
    endpoint?: string;
    payload?: any;
    response?: any;
  };
  
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
}

// 재시도 설정
export interface RetryConfig {
  maxRetries: number;
  strategy: RetryStrategy;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
}

// 알림 설정
export interface NotificationConfig {
  enabled: boolean;
  severityThreshold: ErrorSeverity;
  channels: NotificationType[];
  recipients: string[];
  throttleMinutes: number; // 같은 오류에 대한 알림 제한
}
