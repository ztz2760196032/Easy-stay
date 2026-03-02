// Default to local backend (see /backend). Can be overridden by VITE_API_BASE_URL.
const DEFAULT_BASE_URL = "http://localhost:3000";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;

interface RequestConfig extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestConfig["query"]) {
  const url = new URL(path, API_BASE_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

export async function request<T>(path: string, config: RequestConfig = {}): Promise<Response & { data: T }> {
  const { query, headers, ...rest } = config;

  const response = await fetch(buildUrl(path, query), {
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    ...rest
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = (await response.json()) as T;
  return Object.assign(response, { data });
}

export { API_BASE_URL };
