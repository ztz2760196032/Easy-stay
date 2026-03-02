const DEFAULT_BASE_URL = 'http://localhost:3000';

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || DEFAULT_BASE_URL;

export interface ApiErrorShape {
  message?: string;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  token?: string | null;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(path, API_BASE_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, token, headers } = options;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && 'message' in json && typeof (json as any).message === 'string'
        ? (json as any).message
        : `Request failed: ${res.status}`);
    throw new Error(message);
  }

  return json as T;
}

export { API_BASE_URL };

