// ===== API 캐시 및 중복 호출 방지 =====

// 전역 in-flight/캐시 (전략 조회 과호출 방지)
export const INFLIGHT_API = new Map<string, Promise<any>>();

// API 캐시를 안전하게 초기화
let _apiCache: Map<string, { ts: number; data: any }> | null = null;

export const API_CACHE = {
  get: (key: string) => {
    if (!_apiCache) _apiCache = new Map();
    return _apiCache.get(key);
  },
  set: (key: string, value: { ts: number; data: any }) => {
    if (!_apiCache) _apiCache = new Map();
    return _apiCache.set(key, value);
  },
  has: (key: string) => {
    if (!_apiCache) _apiCache = new Map();
    return _apiCache.has(key);
  },
  delete: (key: string) => {
    if (!_apiCache) _apiCache = new Map();
    return _apiCache.delete(key);
  },
  clear: () => {
    if (!_apiCache) _apiCache = new Map();
    return _apiCache.clear();
  }
};
