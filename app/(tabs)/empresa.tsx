import { PlatformHeader } from "@/components/platform-header";
import { Button, ButtonText } from "@/components/ui/button";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { API_BASE_URL } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/services/api";
import { canManageCompany, checkHealth, extractSessionRoles } from "@/services/auth";
import {
  Activity,
  Building2,
  Link,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getHealthMessage(error: unknown) {
  if (error instanceof ApiError) {
    return `Erro ${error.status}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Nao foi possivel consultar o backend.";
}

function InfoCard({
  description,
  icon,
  label,
  tone,
  value,
}: {
  description: string;
  icon: Parameters<typeof LucideIcon>[0]["icon"];
  label: string;
  tone: "amber" | "emerald" | "sky" | "slate";
  value: string;
}) {
  const toneMap = {
    amber: {
      backgroundColor: "#fff7ed",
      borderColor: "#fed7aa",
      iconColor: "#d97706",
    },
    emerald: {
      backgroundColor: "#ecfdf5",
      borderColor: "#bbf7d0",
      iconColor: "#059669",
    },
    sky: {
      backgroundColor: "#f0f9ff",
      borderColor: "#bae6fd",
      iconColor: "#0284c7",
    },
    slate: {
      backgroundColor: "#f8fafc",
      borderColor: "#cbd5e1",
      iconColor: "#334155",
    },
  } as const;

  const styles = toneMap[tone];

  return (
    <View
      className="rounded-[28px] border px-5 py-5"
      style={{
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
      }}
    >
      <View className="flex-row items-start gap-4">
        <View
          className="rounded-2xl p-3"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
        >
          <LucideIcon color={styles.iconColor} icon={icon} size={20} />
        </View>

        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
            {label}
          </Text>
          <Text className="mt-2 text-xl font-bold text-typography-950">
            {value}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-typography-600">
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CompanyScreen() {
  const router = useRouter();
  const { company, session, signOut, user } = useAuth();
  const canViewCompanyAdmin = canManageCompany(session);
  const sessionRoles = extractSessionRoles(session);
  const [loading, setLoading] = useState(false);
  const [healthMessage, setHealthMessage] = useState("Consultando backend...");
  const [healthTone, setHealthTone] = useState<"error" | "info" | "success">(
    "info",
  );

  async function fetchHealth() {
    setLoading(true);

    try {
      const response = await checkHealth();
      setHealthMessage(response.message ?? "Backend conectado com sucesso.");
      setHealthTone("success");
    } catch (error) {
      setHealthMessage(getHealthMessage(error));
      setHealthTone("error");
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

  const companyDetail = company?.slug ?? company?.id ?? "Sem identificador";
  const sessionLabel =
    session?.authMode === "cookie"
      ? "Sessao por cookie httpOnly"
      : session?.token
        ? `${session.token.slice(0, 18)}...`
        : "Sessao autenticada";

  const healthPillStyle =
    healthTone === "success"
      ? { backgroundColor: "#ecfdf5", color: "#047857" }
      : healthTone === "error"
        ? { backgroundColor: "#fef2f2", color: "#b91c1c" }
        : { backgroundColor: "#eff6ff", color: "#1d4ed8" };

  if (!canViewCompanyAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-background-50">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View className="gap-5">
            <PlatformHeader
              title="Acesso administrativo"
              subtitle="No mobile, a area Empresa segue a mesma regra do web e fica disponivel apenas para perfis administrativos da empresa."
              detail={user?.email ?? "Sessao autenticada"}
              onSignOut={handleLogout}
            />

            <View className="rounded-[28px] bg-red-50 px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-red-700">
                Acesso restrito
              </Text>
              <Text className="mt-2 text-2xl font-bold text-red-900">
                Esta area e exclusiva para ADMIN.
              </Text>
              <Text className="mt-2 text-sm leading-6 text-red-700">
                Perfis como DRIVER, COORDINATOR, USER e PLATFORM_ADMIN nao
                recebem esta aba no fluxo normal e, se entrarem por URL, o app
                bloqueia a visualizacao.
              </Text>
              {sessionRoles.length > 0 && (
                <Text className="mt-3 text-xs font-semibold uppercase tracking-[1.5px] text-red-600">
                  Perfis encontrados: {sessionRoles.join(", ")}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="gap-5">
          <PlatformHeader
            title={company?.name ?? "Empresa logada"}
            subtitle="Aba pensada para concentrar os detalhes da empresa, conexao com backend e dados da sessao autenticada."
            detail={companyDetail}
            onSignOut={handleLogout}
          />

          <View className="gap-4">
            <InfoCard
              description="Nome da empresa retornado pelo login atual do aplicativo."
              icon={Building2}
              label="Empresa"
              tone="amber"
              value={company?.name ?? "Empresa nao informada"}
            />

            <InfoCard
              description="Usuario principal ligado a esta sessao e pronto para consumir os dados do dashboard."
              icon={Users}
              label="Usuario"
              tone="sky"
              value={user?.name ?? user?.email ?? "Usuario nao identificado"}
            />

            <InfoCard
              description="Dominio ou email usado para identificar a empresa no backend."
              icon={Mail}
              label="Contato"
              tone="emerald"
              value={user?.email ?? "Email nao disponivel"}
            />

            <InfoCard
              description="Endereco base que o app esta usando para buscar autenticacao, empresa e futuros dados do dashboard."
              icon={Link}
              label="API Base URL"
              tone="slate"
              value={API_BASE_URL}
            />
          </View>

          <View className="rounded-[28px] bg-background-0 p-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                  Status da conexao
                </Text>
                <Text className="mt-2 text-2xl font-bold text-typography-950">
                  Backend e sessao
                </Text>
                <Text className="mt-2 text-sm leading-6 text-typography-600">
                  Validacao da saude do backend e do tipo de autenticacao que chegou ao app.
                </Text>
              </View>

              <View
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: healthPillStyle.backgroundColor }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: healthPillStyle.color }}
                >
                  {loading ? "Atualizando..." : "Online"}
                </Text>
              </View>
            </View>

            <View className="mt-5 gap-4">
              <View className="rounded-2xl bg-background-50 px-4 py-4">
                <View className="flex-row items-center gap-3">
                  <LucideIcon
                    color={healthPillStyle.color}
                    icon={Activity}
                    size={18}
                  />
                  <Text className="text-sm leading-6 text-typography-700">
                    {healthMessage}
                  </Text>
                </View>
              </View>

              <View className="rounded-2xl bg-background-50 px-4 py-4">
                <View className="flex-row items-center gap-3">
                  <LucideIcon
                    color="#b45309"
                    icon={ShieldCheck}
                    size={18}
                  />
                  <Text className="text-sm leading-6 text-typography-700">
                    {sessionLabel}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-5 gap-3">
              <Button
                className="rounded-2xl bg-tertiary-500"
                isDisabled={loading}
                onPress={fetchHealth}
              >
                <LucideIcon icon={RefreshCw} size={18} color="#FFFFFF" />
                <ButtonText className="text-typography-0">
                  {loading ? "Atualizando..." : "Atualizar status"}
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
