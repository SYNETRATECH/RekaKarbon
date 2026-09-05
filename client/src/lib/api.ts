import type { ZodType } from 'zod';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
