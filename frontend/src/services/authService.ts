
import { API_BASE_URL } from "../config/env";
import {
  ApiError,
  storeAccessToken,
} from "./apiClient";

const ACCESS_TOKEN_KEY = "user-management-access-token";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  employeeId?: number | null;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  user?: AuthUser;
}

async function parseResponse(
  response: Response,
): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getMessage(
  data: unknown,
  fallback: string,
): string {
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

function isAuthResponse(
  data: unknown,
): data is AuthResponse & {
  accessToken: string;
  user: AuthUser;
} {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  if (
    !("accessToken" in data) ||
    typeof data.accessToken !== "string" ||
    !data.accessToken ||
    !("user" in data) ||
    typeof data.user !== "object" ||
    data.user === null
  ) {
    return false;
  }

  const user = data.user;

  return (
    "id" in user &&
    typeof user.id === "number" &&
    "email" in user &&
    typeof user.email === "string" &&
    "role" in user &&
    typeof user.role === "string"
  );
}

function isCurrentUserResponse(
  data: unknown,
): data is { success: boolean; user: AuthUser } {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  if (!("user" in data) || typeof data.user !== "object" ||
      data.user === null) {
    return false;
  }

  const user = data.user;

  return (
    "id" in user &&
    typeof user.id === "number" &&
    "email" in user &&
    typeof user.email === "string" &&
    "role" in user &&
    typeof user.role === "string"
  );
}

async function refreshSession(): Promise<boolean> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    return false;
  }

  const data = await parseResponse(response);

  if (!response.ok || !isAuthResponse(data)) {
    return false;
  }

  storeAccessToken(data.accessToken);
  return true;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Check that the backend is running.",
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getMessage(data, "Login failed."),
      response.status,
      data,
    );
  }

  if (!isAuthResponse(data)) {
    throw new ApiError(
      "The server returned an invalid login response.",
      500,
      data,
    );
  }

  storeAccessToken(data.accessToken);

  return data.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  if (typeof window === "undefined") {
    throw new Error("Session validation requires a browser.");
  }

  let token = window.localStorage.getItem(ACCESS_TOKEN_KEY);

  // If the access token is missing, try the HTTP-only refresh cookie.
  if (!token) {
    const restored = await refreshSession();

    if (!restored) {
      throw new ApiError("Please sign in.", 401, null);
    }

    token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  let response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // An expired access token may still have a valid refresh session.
  if (response.status === 401) {
    const restored = await refreshSession();

    if (restored) {
      token = window.localStorage.getItem(ACCESS_TOKEN_KEY);

      response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getMessage(data, "Unable to validate your session."),
      response.status,
      data,
    );
  }

  if (!isCurrentUserResponse(data)) {
    throw new ApiError(
      "The server returned an invalid user response.",
      500,
      data,
    );
  }

  return data.user;
}
