import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "expo-router";

export default function Index() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  return <Redirect href={isAuthenticated ? "/(tabs)" : "/login"} />;
}