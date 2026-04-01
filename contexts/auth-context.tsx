import { ApiError, clearAuthToken, setAuthToken } from "@/services/api";
import {
  getCurrentSession,
  login as loginRequest,
  logout as logoutRequest,
  type AuthSession,
  type CompanyInfo,
  type LoginCredentials,
} from "@/services/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  company: CompanyInfo | null;
  isAuthenticated: boolean;
  isReady: boolean;
  isSigningIn: boolean;
  refreshSession: () => Promise<AuthSession | null>;
  session: AuthSession | null;
  signIn: (credentials: LoginCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  token: string | null;
  user: AuthSession["user"] | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      try {
        const currentSession = await getCurrentSession();

        if (!isMounted) {
          return;
        }

        if (currentSession.token) {
          setAuthToken(currentSession.token);
        } else {
          clearAuthToken();
        }

        setSession(currentSession);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (!(error instanceof ApiError) || ![401, 403].includes(error.status)) {
          console.warn("Falha ao restaurar sessao", error);
        }

        clearAuthToken();
        setSession(null);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshSession() {
    const currentSession = await getCurrentSession();

    if (currentSession.token) {
      setAuthToken(currentSession.token);
    } else {
      clearAuthToken();
    }

    setSession(currentSession);
    return currentSession;
  }

  async function signIn(credentials: LoginCredentials) {
    setIsSigningIn(true);

    try {
      const response = await loginRequest(credentials);

      if (response.token) {
        setAuthToken(response.token);
      } else {
        clearAuthToken();
      }

      setSession(response);
      return response;
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    try {
      await logoutRequest();
    } catch (error) {
      console.warn("Falha ao limpar sessao no backend", error);
    } finally {
      clearAuthToken();
      setSession(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        company: session?.company ?? null,
        isAuthenticated: Boolean(session),
        isReady,
        isSigningIn,
        refreshSession,
        session,
        signIn,
        signOut,
        token: session?.token ?? null,
        user: session?.user ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}