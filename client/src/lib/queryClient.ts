import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export async function apiFetch(url: string, init: RequestInit = {}) {
  const res = await fetch(url, { credentials: 'include', ...init });

  // 401 Unauthorized - 인증 실패 이벤트 발생
  if (res.status === 401) {
    console.log('🔒 인증 실패 - 로그인 페이지로 이동');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authToken');

    // 전역 이벤트로 인증 실패 알림 (상태 업데이트 포함)
    window.dispatchEvent(new CustomEvent('auth-failed', {
      detail: { clearAuth: true }
    }));
    throw new Error('Unauthorized');
  }

  // 403 Forbidden - 승인 대기 상태
  if (res.status === 403) {
    try {
      const errorData = await res.json();
      alert(errorData.message || '관리자 승인을 기다리고 있습니다. 관리자에게 문의하세요.');
    } catch {
      alert('관리자 승인을 기다리고 있습니다. 관리자에게 문의하세요.');
    }
    throw new Error('Forbidden');
  }

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res;
}

// JSON 전용 dedupe: 동일 시점 동일 요청의 중복 파싱을 방지
const inflightJson = new Map<string, Promise<any>>();
export async function apiFetchJson<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const method = ((init.method as string) || 'GET').toUpperCase();
  const key = `${method} ${url}`;

  const existing = inflightJson.get(key);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    const res = await fetch(url, { credentials: 'include', ...init });
    if (res.status === 401) {
      console.log('🔒 인증 실패 - 로그인 페이지로 이동');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('authToken');
      window.dispatchEvent(new CustomEvent('auth-failed', { detail: { clearAuth: true } }));
      throw new Error('Unauthorized');
    }
    if (res.status === 403) {
      try {
        const errorData = await res.json();
        alert(errorData.message || '관리자 승인을 기다리고 있습니다. 관리자에게 문의하세요.');
      } catch {
        alert('관리자 승인을 기다리고 있습니다. 관리자에게 문의하세요.');
      }
      throw new Error('Forbidden');
    }
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  })();

  inflightJson.set(key, p);
  try {
    return await p as Promise<T>;
  } finally {
    inflightJson.delete(key);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
