/**
 * 로그 관리 유틸리티
 * 개발 환경에서만 디버그 로그를 출력하고, 운영 환경에서는 필요한 로그만 출력
 */

const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * 디버그 로그 - 개발 환경에서만 출력
   */
  debug: isDev ? console.log : (() => {}),
  
  /**
   * 정보 로그 - 항상 출력
   */
  info: console.log,
  
  /**
   * 경고 로그 - 항상 출력
   */
  warn: console.warn,
  
  /**
   * 에러 로그 - 항상 출력
   */
  error: console.error,
  
  /**
   * 성공 로그 - 항상 출력 (운영에서 중요한 이벤트)
   */
  success: console.log,
  
  /**
   * 트레이딩 관련 중요 로그 - 항상 출력
   */
  trading: console.log,
  
  /**
   * WebSocket 관련 로그 - 개발 환경에서만 상세 출력
   */
  websocket: {
    debug: isDev ? console.log : (() => {}),
    info: console.log,
    warn: console.warn,
    error: console.error,
  },

  /**
   * 동기화 관련 로그 - 개발 환경에서만 상세 출력
   */
  sync: {
    debug: isDev ? console.log : (() => {}),
    info: console.log,
    warn: console.warn,
    error: console.error,
  }
};

/**
 * 조건부 로그 출력
 */
export const conditionalLog = (condition: boolean, ...args: any[]) => {
  if (condition) {
    console.log(...args);
  }
};

/**
 * 성능 측정을 위한 타이머 로그
 */
export const performanceLogger = {
  start: (label: string) => {
    if (isDev) {
      console.time(label);
    }
  },
  end: (label: string) => {
    if (isDev) {
      console.timeEnd(label);
    }
  }
};

export default logger;
