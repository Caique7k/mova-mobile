import { get, post } from "@/services/api";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export async function login(credentials: LoginCredentials) {
  return post<LoginResponse>("/auth/login", credentials);
}

export async function checkHealth() {
  try {
    return await get<{ message: string }>("/health");
  } catch (error) {
    // backend pode não ter endpoint /health, usar raiz como fallback
    if (error instanceof Error && (error as any).status === 404) {
      const root = await get<{ message?: string }>("/");
      return { message: root.message ?? "Backend acessível (root)." };
    }
    throw error;
  }
}
