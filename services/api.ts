import { API_BASE_URL } from "@/constants/api";

export class ApiError extends Error {
  status: number;
  response: any;

  constructor(status: number, message: string, response?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

export function getAuthToken() {
  return authToken;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (
      error.response &&
      typeof error.response === "object" &&
      "message" in error.response &&
      typeof error.response.message === "string"
    ) {
      return error.response.message;
    }

    return error.status > 0 ? `Erro ${error.status}: ${error.message}` : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const DEFAULT_TIMEOUT_MS = 10000;

function timeoutPromise<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT_MS) {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout: sem resposta em ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const maybeResponse = await timeoutPromise(
    fetch(url, {
      credentials: options.credentials ?? "include",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    })
  );

  if (!(maybeResponse instanceof Response)) {
    throw new ApiError(0, "Resposta invalida do servidor", maybeResponse);
  }

  const response = maybeResponse;
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.statusText || "Erro API",
      payload,
    );
  }

  return payload as T;
}

export function get<T>(path: string) {
  return request<T>(path, { method: "GET" });
}

export function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function put<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function patch<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function del<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "DELETE",
    body: body ? JSON.stringify(body) : undefined,
  });
}
