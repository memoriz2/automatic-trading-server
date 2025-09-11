// ===== API 캐시 및 중복 호출 방지 =====

// 전역 in-flight/캐시 (전략 조회 과호출 방지)
export const INFLIGHT_API = new Map<string, Promise<any>>();
export const API_CACHE = new Map<string, { ts: number; data: any }>();
