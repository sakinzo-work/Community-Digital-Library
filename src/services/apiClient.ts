/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const TOKEN_KEY = 'cdl_auth_token';

export function getStoredToken(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function getDefaultHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  const activeToken = token !== undefined ? token : getStoredToken();
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  return headers;
}

/**
 * Safely parse JSON from a fetch response.
 * Protects against unexpected HTML responses (e.g. gateway timeout or proxy fallback during restarts).
 */
export async function safeParseJson<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.trim().startsWith('<') || text.includes('<!doctype') || text.includes('<!DOCTYPE')) {
      throw new Error(
        `Server returned an HTML response (${res.status} ${res.statusText}) instead of JSON. The service may be initializing.`
      );
    }
    // Attempt parse if text looks like JSON despite content-type
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Unexpected non-JSON response from server (${res.status} ${res.statusText}): ${text.slice(0, 120)}`);
    }
  }

  return res.json();
}

/**
 * Robust fetch wrapper with automatic headers, retry for gateway/proxy warm-up,
 * and safe JSON parsing.
 */
export async function apiRequest<T = any>(
  url: string,
  init: RequestInit = {},
  retries = 2
): Promise<T> {
  const headers = new Headers(init.headers || {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const activeToken = getStoredToken();
  if (activeToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${activeToken}`);
  }

  const updatedInit: RequestInit = {
    ...init,
    headers
  };

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, updatedInit);

      // Check if this is an HTML response when JSON is expected (e.g. 502/503 during restart)
      const contentType = res.headers.get('content-type') || '';
      const isHtml = contentType.includes('text/html');

      if (isHtml && attempt < retries) {
        // Server might still be waking up, wait briefly and retry
        await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
        continue;
      }

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status} ${res.statusText}`;
        try {
          const errorData = await safeParseJson(res);
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If body cannot be parsed, use the status text
        }
        const err = new Error(errorMessage);
        (err as any).status = res.status;
        throw err;
      }

      return await safeParseJson<T>(res);
    } catch (err: any) {
      lastError = err;
      if (attempt < retries && (err.message?.includes('HTML') || err.message?.includes('Failed to fetch'))) {
        await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
