/**
 * 로그 관리 유틸리티 (중앙화된 shared 모듈 사용)
 * @deprecated 이 파일은 호환성을 위해 유지되며, shared/utils/logger.ts를 re-export합니다.
 */

// Re-export from shared
export {
  logger,
  log,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logSystem,
  logSecurity,
  conditionalLog,
  performanceLogger,
  LogLevel,
  type LogContext
} from '../../../shared/utils/logger';

export { logger as default } from '../../../shared/utils/logger';
