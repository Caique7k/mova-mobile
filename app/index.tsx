import { useAuth } from "@/contexts/auth-context";
import { getDefaultAuthorizedRoute } from "@/services/auth";
import { Redirect } from "expo-router";

export default function Index() {
  const { isAuthenticated, isReady, session } = useAuth();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={getDefaultAuthorizedRoute(session)} />;
}
