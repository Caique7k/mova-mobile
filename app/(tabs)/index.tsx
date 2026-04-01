import { Button, ButtonText } from "@/components/ui/button";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { API_BASE_URL } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/services/api";
import { checkHealth } from "@/services/auth";
import { Image } from "expo-image";
import { Building2, LogOut, ShieldCheck } from "lucide";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const logoUnipass = require("../../assets/images/logo_unipass.png");

export default function Home() {
  const router = useRouter();
  const { company, session, user, signOut } = useAuth();
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchHealth() {
    setLoading(true);
    setError(null);
    setHealthMessage(null);

    try {
      const result = await checkHealth();
      setHealthMessage(result?.message ?? "Conexao estabelecida com o backend");
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(`Erro ${requestError.status}: ${requestError.message}`);
      } else if (requestError instanceof Error) {
        setError(`Erro de rede: ${requestError.message}`);
      } else {
        setError("Falha ao conectar com o backend. Verifique a URL/API.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  useEffect(() => {
    void fetchHealth();
  }, []);

  const companyName = company?.name ?? "Empresa nao informada";
  const companyDetails = company?.slug ?? company?.id ?? "Sem identificador";
  const sessionLabel =
    session?.authMode === "cookie"
      ? "Sessao por cookie httpOnly"
      : session?.token
        ? `${session.token.slice(0, 18)}...`
        : "Sessao ativa";

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="gap-5">
          <View className="rounded-[28px] bg-tertiary-500 px-6 py-7">
            <Image
              source={logoUnipass}
              contentFit="contain"
              style={{ width: 162, height: 44 }}
            />

            <View className="mt-5 flex-row items-center gap-2 self-start rounded-full bg-white/15 px-4 py-2">
              <LucideIcon icon={ShieldCheck} size={16} color="#FFFFFF" />
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-0">
                Sessao ativa
              </Text>
            </View>

            <Text className="mt-4 text-3xl font-bold text-typography-0">
              Ola, {user?.name ?? "usuario"}.
            </Text>
            <Text className="mt-2 text-sm leading-6 text-typography-50">
              {user?.email ?? "Email nao disponivel"}
            </Text>
          </View>

          <View className="rounded-[28px] border border-outline-100 bg-background-0 p-6">
            <View className="flex-row items-start gap-4">
              <View className="rounded-2xl bg-tertiary-50 p-3">
                <LucideIcon icon={Building2} size={22} color="#b45309" />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                  Empresa logada
                </Text>
                <Text className="mt-2 text-2xl font-bold text-typography-900">
                  {companyName}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-typography-600">
                  {companyDetails}
                </Text>
              </View>
            </View>

            <View className="mt-6 rounded-2xl bg-background-50 px-4 py-4">
              <Text className="text-xs uppercase tracking-[1.5px] text-typography-500">
                Status do backend
              </Text>
              <Text className="mt-2 text-sm leading-6 text-typography-700">
                {loading
                  ? "Atualizando conexao..."
                  : healthMessage ?? "Sem resposta do backend no momento."}
              </Text>
              {error ? (
                <View className="mt-4 rounded-2xl bg-background-error px-4 py-3">
                  <Text className="text-sm leading-6 text-error-700">
                    {error}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="mt-4 rounded-2xl bg-background-50 px-4 py-4">
              <Text className="text-xs uppercase tracking-[1.5px] text-typography-500">
                API Base URL
              </Text>
              <Text className="mt-2 text-sm leading-6 text-typography-700">
                {API_BASE_URL}
              </Text>
            </View>

            <View className="mt-4 rounded-2xl bg-background-50 px-4 py-4">
              <Text className="text-xs uppercase tracking-[1.5px] text-typography-500">
                Sessao autenticada
              </Text>
              <Text className="mt-2 text-sm leading-6 text-typography-700">
                {sessionLabel}
              </Text>
            </View>

            <View className="mt-6 gap-3">
              <Button
                className="rounded-2xl bg-tertiary-500"
                onPress={fetchHealth}
                isDisabled={loading}
              >
                <ButtonText className="text-typography-0">
                  {loading ? "Verificando..." : "Atualizar status"}
                </ButtonText>
              </Button>

              <Button
                variant="outline"
                action="negative"
                className="rounded-2xl"
                onPress={handleLogout}
              >
                <LucideIcon icon={LogOut} size={18} color="#dc2626" />
                <ButtonText>Sair</ButtonText>
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}