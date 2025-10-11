/**
 * 통합 로깅 시스템 (중앙화된 shared 모듈 사용)
 * @deprecated 이 파일은 호환성을 위해 유지되며, shared/utils/logger.ts를 re-export합니다.
 */

// Re-export all from shared
export {
  logger,
  log,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logSystem,
  logSecurity,
  LogLevel,
  type LogContext
} from '../../shared/utils/logger.js';

export { logger as default } from '../../shared/utils/logger.js';
