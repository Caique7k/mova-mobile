import { LucideIcon } from "@/components/ui/lucide-icon";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "expo-router";
import { LogOut } from "lucide";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LogoutScreen() {
  const hasTriggeredRef = useRef(false);
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    if (hasTriggeredRef.current) {
      return;
    }

    hasTriggeredRef.current = true;

    let isMounted = true;

    async function logout() {
      await signOut();

      if (isMounted) {
        router.replace("/login");
      }
    }

    void logout();

    return () => {
      isMounted = false;
    };
  }, [router, signOut]);

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <View className="flex-1 items-center justify-center px-6">
        <View
          className="w-full rounded-[28px] bg-background-0 px-6 py-8"
          style={{ maxWidth: 320 }}
        >
          <View className="items-center">
            <View
              className="h-14 w-14 items-center justify-center rounded-[20px]"
              style={{ backgroundColor: "rgba(252, 124, 58, 0.12)" }}
            >
              <LucideIcon color="#FC7C3A" icon={LogOut} size={24} />
            </View>
            <Text className="mt-4 text-2xl font-bold text-typography-950">
              Saindo da conta
            </Text>
            <Text className="mt-3 text-center text-sm leading-6 text-typography-600">
              Estamos encerrando sua sessão com segurança e levando você para o login.
            </Text>
            <ActivityIndicator color="#FC7C3A" size="small" style={{ marginTop: 20 }} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
