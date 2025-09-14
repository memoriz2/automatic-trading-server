// ===== 시간대 설정 중앙화 =====

// 🇰🇷 프로젝트 기본 시간대 설정
export const TIMEZONE_CONFIG = {
  TIMEZONE: 'Asia/Seoul',           // 한국 표준시
  LOCALE: 'ko-KR',                  // 한국어 로케일
  
  // 거래소 운영 시간 (한국 시간 기준)
  MARKET_HOURS: {
    UPBIT_START: 0,                 // 업비트: 24시간 (0시 시작)
    UPBIT_END: 24,                  // 업비트: 24시간 (24시 종료)
    BINANCE_START: 0,               // 바이낸스: 24시간
    BINANCE_END: 24,
  },
  
  // 로그 및 표시 형식
  LOG_FORMAT: {
    TIME_ONLY: { hour: '2-digit', minute: '2-digit', second: '2-digit' } as const,
    HOUR_MINUTE: { hour: '2-digit', minute: '2-digit' } as const,
    FULL_DATETIME: { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    } as const,
    DATE_ONLY: { year: 'numeric', month: '2-digit', day: '2-digit' } as const,
  }
} as const;

// 현재 한국 시간 Date 객체 반환
export const getKoreanTime = (): Date => {
  return new Date();
};

// ===== 한국 시간 포맷팅 함수들 =====

// 한국 시간 문자열 포맷팅 (시:분:초)
export const formatKoreanTime = (date?: Date | string): string => {
  const targetDate = date ? new Date(date) : new Date();
  return targetDate.toLocaleTimeString(TIMEZONE_CONFIG.LOCALE, { 
    timeZone: TIMEZONE_CONFIG.TIMEZONE,
    ...TIMEZONE_CONFIG.LOG_FORMAT.TIME_ONLY
  });
};

// 한국 날짜+시간 문자열 포맷팅 (YYYY.MM.DD HH:mm:ss)
export const formatKoreanDateTime = (date?: Date | string): string => {
  const targetDate = date ? new Date(date) : new Date();
  return targetDate.toLocaleString(TIMEZONE_CONFIG.LOCALE, { 
    timeZone: TIMEZONE_CONFIG.TIMEZONE,
    ...TIMEZONE_CONFIG.LOG_FORMAT.FULL_DATETIME
  });
};

// 한국 날짜만 포맷팅 (YYYY.MM.DD)
export const formatKoreanDate = (date?: Date | string): string => {
  const targetDate = date ? new Date(date) : new Date();
  return targetDate.toLocaleDateString(TIMEZONE_CONFIG.LOCALE, { 
    timeZone: TIMEZONE_CONFIG.TIMEZONE,
    ...TIMEZONE_CONFIG.LOG_FORMAT.DATE_ONLY
  });
};

// 한국 시간 기준 시/분만 포맷팅 (HH:mm)
export const formatKoreanHourMinute = (date?: Date | string): string => {
  const targetDate = date ? new Date(date) : new Date();
  return targetDate.toLocaleTimeString(TIMEZONE_CONFIG.LOCALE, { 
    timeZone: TIMEZONE_CONFIG.TIMEZONE,
    ...TIMEZONE_CONFIG.LOG_FORMAT.HOUR_MINUTE
  });
};

// 상대 시간 표시 (한국 시간 기준)
export const getKoreanTimeAgo = (date: Date | string): string => {
  const targetDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds}초 전`;
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  
  return formatKoreanDate(targetDate);
};

// ISO 문자열을 한국 시간으로 변환
export const isoToKoreanTime = (isoString: string): string => {
  return formatKoreanTime(isoString);
};

// 한국 시간 기준 타임스탬프 생성
export const getKoreanTimestamp = (): string => {
  return new Date().toISOString();
};

// 디버깅용: 현재 시간대 정보
export const getTimezoneInfo = () => ({
  currentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  koreanTime: formatKoreanDateTime(),
  utcTime: new Date().toISOString(),
  localTime: new Date().toLocaleString()
});
