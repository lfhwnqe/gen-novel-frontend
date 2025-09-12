import { useRouter } from "next/navigation";
import { clearAuthTokens } from "@/lib/auth";

/**
 * Proxy parameters for backend proxies, e.g. via Next.js rewrites.
 */
export interface ProxyParams {
  targetPath: string;
  actualMethod: string;
}

/**
 * Extended RequestInit including proxy params and unstringified body.
 */
export interface FetchWithAuthInit extends RequestInit {
  proxyParams?: ProxyParams;
  actualBody?: Record<string, unknown> | FormData;
}

/**
 * Path for token refresh; backend endpoint should accept refreshToken in body and return new tokens.
 */
const REFRESH_ENDPOINT = "/api/auth/refresh";

// 登录页路径（统一跳转目标）
const LOGIN_PATH = "/auth/v1/login";

/**
 * Perform a token refresh using stored refreshToken.
 * Returns new tokens object { accessToken, refreshToken } or null on failure.
 */
async function refreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const stored = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
  if (!stored) return null;
  try {
    const res = await fetch(REFRESH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: stored }),
    });
    if (res.ok) {
      return (await res.json()) as { accessToken: string; refreshToken: string };
    }
  } catch {}
  return null;
}

/**
 * Core fetch wrapper adding authorization header, proxy body handling, and automatic refresh.
 * @param input Request URL or object
 * @param init Extended init options
 * @param router Optional next/navigation router (for SSR-friendly redirects)
 * @param retrying Internal flag to prevent infinite loops
 */
/** Attach stored accessToken to headers if running in browser */
function attachAuthHeader(opts: FetchWithAuthInit) {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("accessToken");
  if (token) {
    opts.headers = { ...opts.headers, Authorization: `Bearer ${token}` };
  }
}

/** Prepare body and headers for proxyParams if provided */
function applyProxyParams(opts: FetchWithAuthInit) {
  if (!opts.proxyParams || !opts.actualBody) return;
  if (opts.actualBody instanceof FormData) {
    opts.actualBody.append("targetPath", opts.proxyParams.targetPath);
    opts.actualBody.append("actualMethod", opts.proxyParams.actualMethod);
    opts.body = opts.actualBody;
  } else {
    opts.body = JSON.stringify({ request: opts.proxyParams, body: opts.actualBody });
    opts.headers = { ...opts.headers, "Content-Type": "application/json" };
  }
}

/** Handle 401: try refresh or redirect to login */
async function handleUnauthorized(
  input: RequestInfo | URL,
  init: FetchWithAuthInit,
  router?: ReturnType<typeof useRouter>,
  retrying = false,
): Promise<Response> {
  if (!retrying) {
    const tokens = await refreshToken();
    if (tokens) {
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      return internalFetchWithAuth(input, init, router, true);
    }
  }
  // 刷新失败或不重试：清除所有认证缓存并跳转登录
  if (typeof window !== "undefined") {
    try {
      // 清理本地与cookie缓存
      clearAuthTokens();
    } catch {}
    try {
      const redirect = window.location.pathname + window.location.search + window.location.hash;
      localStorage.setItem("redirectAfterLogin", redirect);
    } catch {}
    window.location.href = LOGIN_PATH;
  } else if (router) {
    try {
      clearAuthTokens();
    } catch {}
    router.push(LOGIN_PATH);
  }
  throw new Error("Unauthorized - please log in again");
}

async function internalFetchWithAuth(
  input: RequestInfo | URL,
  init: FetchWithAuthInit = {},
  router?: ReturnType<typeof useRouter>,
  retrying = false,
): Promise<Response> {
  const opts: FetchWithAuthInit = { ...init };
  attachAuthHeader(opts);
  applyProxyParams(opts);
  const response = await fetch(input, opts as RequestInit);
  if (response.status === 401) {
    return handleUnauthorized(input, init, router, retrying);
  }
  return response;
}

/**
 * Fetch with auth support. In React components, prefer useFetchWithAuth for router-aware redirects.
 */
export async function fetchWithAuth(input: RequestInfo | URL, init?: FetchWithAuthInit): Promise<Response> {
  return internalFetchWithAuth(input, init);
}

/**
 * React hook to access fetchWithAuth with built-in router for safe client-side navigation.
 */
export function useFetchWithAuth() {
  const router = useRouter();
  return (input: RequestInfo | URL, init?: FetchWithAuthInit) => internalFetchWithAuth(input, init, router);
}
