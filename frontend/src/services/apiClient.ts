
import { API_BASE_URL } from "../config/env";

const ACCESS_TOKEN_LOCAL_STORAGE_KEY = "user-management-access-token";

export class ApiError extends Error {
  public readonly status: number;
  public readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY);
}

function setStoredAccessToken(token: string): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY, token);
}

function clearStoredAccessToken(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY);
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return fallback;
}

async function refreshAccessToken(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    clearStoredAccessToken();
    return null;
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("accessToken" in data) ||
    typeof data.accessToken !== "string" ||
    !data.accessToken
  ) {
    clearStoredAccessToken();
    return null;
  }

  setStoredAccessToken(data.accessToken);
  return data.accessToken;
}

async function sendRequest(
  path: string,
  options: RequestInit,
  accessToken: string | null,
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken && !path.startsWith("/auth")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    headers.delete("Authorization");
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isAuthRequest = path.startsWith("/auth");
  let accessToken = getStoredAccessToken();

  let response = await sendRequest(path, options, accessToken);

  // Recover an expired access token once, using the existing refresh cookie.
  if (
    response.status === 401 &&
    !isAuthRequest &&
    !path.startsWith("/auth/refresh")
  ) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      accessToken = refreshedToken;
      response = await sendRequest(path, options, accessToken);
    } else {
      clearStoredAccessToken();
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, `Request failed with status ${response.status}`),
      response.status,
      data,
    );
  }

  return data as T;
}

/**
 * Call after the user successfully logs in.
 * The backend login response supplies the access token.
 */
export function storeAccessToken(token: string): void {
  if (!token.trim()) {
    throw new Error("Access token cannot be empty.");
  }

  setStoredAccessToken(token);
}

/**
 * Clears the local token and asks the backend to end the refresh session.
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const data = await parseResponse(response);
      throw new ApiError(
        getErrorMessage(data, "Logout failed."),
        response.status,
        data,
      );
    }
  } finally {
    clearStoredAccessToken();
  }
}
