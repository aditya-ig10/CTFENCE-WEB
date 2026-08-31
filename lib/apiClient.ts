// ============================================================================
// Unified Typed Fetch Client Architecture (Phase 2)
//
// Shared standard across payment flows and app data fetching:
//   1. Typed Result Envelope: { ok: true, data: T } | { ok: false, error: string, code: string }
//   2. Idempotency-guarded retry with exponential backoff & jitter (max 3 attempts, GET/idempotent only)
//   3. Separate, explicit auth attachment mechanisms:
//      - Firebase Auth ID token for user-authenticated API routes
//      - Checkout token (X-Checkout-Token / body) for payment transactions
//   4. Request timeout via AbortController (default 8s)
// ============================================================================

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; code: string; status?: number };

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number; // Max retries for idempotent calls (default: 3)
  idempotent?: boolean; // Explicitly flag if non-GET call is idempotent
  firebaseToken?: string | null;
  checkoutToken?: string | null;
}

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_IDEMPOTENT_RETRIES = 3;

/**
 * Checks if an HTTP method is naturally idempotent.
 */
function isIdempotentMethod(method = "GET"): boolean {
  const m = method.toUpperCase();
  return m === "GET" || m === "HEAD" || m === "OPTIONS" || m === "PUT" || m === "DELETE";
}

/**
 * Computes exponential backoff with full jitter in milliseconds.
 * delay = rand(0, min(max_delay, base * 2^attempt))
 */
function getJitteredBackoffMs(attempt: number, baseMs = 300, maxMs = 3000): number {
  const expDelay = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  return Math.floor(Math.random() * expDelay);
}

/**
 * Universal typed API request wrapper.
 */
export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResult<T>> {
  const method = (options.method || "GET").toUpperCase();
  const isIdempotent = options.idempotent ?? isIdempotentMethod(method);
  const maxRetries = isIdempotent ? Math.min(options.retries ?? MAX_IDEMPOTENT_RETRIES, MAX_IDEMPOTENT_RETRIES) : 0;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Standardized Auth Header Attachment
  if (options.firebaseToken) {
    headers["Authorization"] = `Bearer ${options.firebaseToken}`;
  }
  if (options.checkoutToken) {
    headers["X-Checkout-Token"] = options.checkoutToken;
  }

  let attempt = 0;
  let lastError = "Request failed";
  let lastCode = "NETWORK_ERROR";
  let lastStatus: number | undefined;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);
      lastStatus = response.status;

      // Parse response JSON or fallback to text error
      const text = await response.text();
      let json: unknown = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (response.ok) {
        // If JSON has an inner { ok: false, error }, normalize as failure
        if (json && typeof json === "object" && "ok" in json && (json as { ok: boolean }).ok === false) {
          const errObj = json as { error?: string; code?: string };
          return {
            ok: false,
            error: errObj.error || "Operation failed",
            code: errObj.code || `HTTP_${response.status}`,
            status: response.status,
          };
        }

        const data = (json !== null ? json : (text as unknown)) as T;
        return {
          ok: true,
          data,
          status: response.status,
        };
      }

      // Handle non-2xx responses
      const errObj = json && typeof json === "object" ? (json as { error?: string; code?: string; message?: string }) : null;
      lastError = errObj?.error || errObj?.message || text || `HTTP error ${response.status}`;
      lastCode = errObj?.code || `HTTP_${response.status}`;

      // Only retry on transient 5xx server errors for idempotent requests
      const isTransientServerError = response.status >= 500 && response.status <= 504;
      if (!isIdempotent || !isTransientServerError || attempt >= maxRetries) {
        return {
          ok: false,
          error: lastError,
          code: lastCode,
          status: response.status,
        };
      }
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof Error && err.name === "AbortError";
      lastError = isAbort ? `Request timeout after ${timeoutMs}ms` : (err instanceof Error ? err.message : String(err));
      lastCode = isAbort ? "TIMEOUT" : "FETCH_ERROR";

      // If non-idempotent or max retries reached, fail immediately
      if (!isIdempotent || attempt >= maxRetries) {
        return {
          ok: false,
          error: lastError,
          code: lastCode,
          status: lastStatus,
        };
      }
    }

    // Wait backoff delay before retrying
    attempt++;
    const backoffMs = getJitteredBackoffMs(attempt);
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
  }

  return {
    ok: false,
    error: lastError,
    code: lastCode,
    status: lastStatus,
  };
}
