/**
 * 거래 오류 추적 시스템 타입 정의
 */
// 오류 심각도
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical"; // 치명적: 시스템 중단, 즉시 알림 및 수동 개입 필요
})(ErrorSeverity || (ErrorSeverity = {}));
// 오류 카테고리
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["API"] = "api";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["BALANCE"] = "balance";
    ErrorCategory["ORDER"] = "order";
    ErrorCategory["SYSTEM"] = "system"; // 시스템 내부 오류
})(ErrorCategory || (ErrorCategory = {}));
// 재시도 상태
export var RetryStatus;
(function (RetryStatus) {
    RetryStatus["PENDING"] = "pending";
    RetryStatus["RETRYING"] = "retrying";
    RetryStatus["SUCCESS"] = "success";
    RetryStatus["FAILED"] = "failed";
    RetryStatus["ABANDONED"] = "abandoned"; // 재시도 포기
})(RetryStatus || (RetryStatus = {}));
// 해결 방법
export var ResolutionMethod;
(function (ResolutionMethod) {
    ResolutionMethod["AUTO_RETRY"] = "auto_retry";
    ResolutionMethod["MANUAL_FIX"] = "manual_fix";
    ResolutionMethod["IGNORED"] = "ignored";
    ResolutionMethod["COMPENSATED"] = "compensated"; // 보상 처리됨
})(ResolutionMethod || (ResolutionMethod = {}));
// 수정 상태
export var FixStatus;
(function (FixStatus) {
    FixStatus["OPEN"] = "open";
    FixStatus["INVESTIGATING"] = "investigating";
    FixStatus["FIXING"] = "fixing";
    FixStatus["FIXED"] = "fixed"; // 수정 완료
})(FixStatus || (FixStatus = {}));
// 재시도 전략
export var RetryStrategy;
(function (RetryStrategy) {
    RetryStrategy["EXPONENTIAL"] = "exponential";
    RetryStrategy["LINEAR"] = "linear";
    RetryStrategy["CUSTOM"] = "custom"; // 커스텀 전략
})(RetryStrategy || (RetryStrategy = {}));
// 알림 타입
export var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "email";
    NotificationType["SLACK"] = "slack";
    NotificationType["WEBHOOK"] = "webhook";
    NotificationType["DASHBOARD"] = "dashboard";
})(NotificationType || (NotificationType = {}));
