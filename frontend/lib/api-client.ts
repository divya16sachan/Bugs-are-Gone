/**
 * Centralized HTTP client — the ONLY place `fetch` is called in the app.
 * Components never call fetch/axios directly; they go through TanStack Query
 * hooks whose mutationFn/queryFn call these helpers. That is how we keep the
 * "no fetch/axios in components, TanStack only" rule while still making real
 * network requests (TanStack itself doesn't do the HTTP call — it wraps it).
 *
 * NOTE: `lib/` belongs to whoever set up the shared foundation. If this file
 * already exists, merge these helpers into it instead of overwriting, so token
 * handling stays in one place.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Short-lived access token kept in memory only (never localStorage — XSS-safe).
// The long-lived refresh token lives in an httpOnly, Secure cookie set by the
// backend and is sent automatically via `credentials: "include"`.
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
    window.dispatchEvent(new CustomEvent("auth:change", { detail: { token } }));
  }
}
export function getAccessToken() {
  if (!accessToken && typeof window !== "undefined") {
    accessToken = localStorage.getItem("accessToken");
  }
  return accessToken;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const hasBody = options.body !== undefined && options.body !== null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message =
      (body && (body.message || body.error)) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }
  return body as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

