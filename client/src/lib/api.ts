import type { ZodType } from 'zod';

/**
 * Resolves the API Base URL dynamically.
 *
 * If the app is configured with a localhost backend (e.g. 'http://localhost:3000')
 * but is being accessed from another device on LAN (e.g. 'http://192.168.58.209:5173'),
 * dynamically rewrite the host to window.location.hostname so the browser connects
 * to the developer's server rather than the client device's loopback interface.
 */
export function resolveApiBaseUrl(
  configuredUrl: string = import.meta.env.VITE_API_BASE_URL || '',
  currentHostname?: string
): string {
  const hostname =
    currentHostname ||
    (typeof window !== 'undefined' && window.location ? window.location.hostname : '');

  // If accessed from production domain rekakarbon.farrelad.com, default to api.rekakarbon.farrelad.com
  // when VITE_API_BASE_URL is not explicitly configured with an external endpoint
  if (hostname === 'rekakarbon.farrelad.com' || hostname.endsWith('.farrelad.com')) {
    if (
      !configuredUrl ||
      configuredUrl.includes('localhost') ||
      configuredUrl.includes('127.0.0.1')
    ) {
      return 'https://api.rekakarbon.farrelad.com';
    }
  }

  if (!configuredUrl) return '';

  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    try {
      const url = new URL(configuredUrl);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        url.hostname = hostname;
        return url.origin;
      }
    } catch {
      // Relative paths or non-standard URLs are returned as-is
    }
  }

  return configuredUrl;
}

export const BASE_URL = resolveApiBaseUrl();

export class ApiValidationError extends Error {
  constructor(
    public readonly path: string,
    public readonly issues: unknown,
    message?: string
  ) {
    super(message || `API Schema Validation Failed for ${path}`);
    this.name = 'ApiValidationError';
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rekakarbon_token');
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  schema?: ZodType<T>
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('rekakarbon_token');
    }
    const errorData = await res.json().catch(() => null);
    const errorMessage =
      errorData?.error?.message ||
      errorData?.message ||
      `API Error ${res.status}: ${res.statusText}`;
    throw new Error(errorMessage);
  }

  const json = await res.json();
  const rawData =
    json && typeof json === 'object' && 'success' in json && 'data' in json ? json.data : json;

  if (schema) {
    const result = schema.safeParse(rawData);
    if (!result.success) {
      if (import.meta.env.DEV) {
        console.error(`[API Schema Error] ${path}:`, result.error.format());
      }
      throw new ApiValidationError(
        path,
        result.error.issues,
        `Data validation failed for ${path}: ${result.error.issues[0]?.message || 'Invalid data schema'}`
      );
    }
    return result.data;
  }

  return rawData as T;
}

export const api = {
  get: <T>(path: string, schema?: ZodType<T>) => apiFetch<T>(path, { method: 'GET' }, schema),
  post: <T>(path: string, body?: unknown, schema?: ZodType<T>) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }, schema),
  patch: <T>(path: string, body?: unknown, schema?: ZodType<T>) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, schema),
  delete: <T>(path: string, schema?: ZodType<T>) => apiFetch<T>(path, { method: 'DELETE' }, schema),
  upload: async <T>(path: string, formData: FormData, schema?: ZodType<T>): Promise<T> => {
    const token = getAuthToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const errorMessage =
        errorData?.error?.message ||
        errorData?.message ||
        `Upload Error ${res.status}: ${res.statusText}`;
      throw new Error(errorMessage);
    }
    const json = await res.json();
    const rawData =
      json && typeof json === 'object' && 'success' in json && 'data' in json ? json.data : json;

    if (schema) {
      const result = schema.safeParse(rawData);
      if (!result.success) {
        if (import.meta.env.DEV) {
          console.error(`[Upload Schema Error] ${path}:`, result.error.format());
        }
        throw new ApiValidationError(
          path,
          result.error.issues,
          `Data validation failed for ${path}: ${result.error.issues[0]?.message || 'Invalid data schema'}`
        );
      }
      return result.data;
    }
    return rawData as T;
  },
};
