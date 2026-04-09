import { PlatformHeader } from "@/components/platform-header";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/services/api";
import { canAccessDashboard, extractSessionRoles } from "@/services/auth";
import {
  fetchRealDashboardData,
  type DashboardSnapshot,
  type DashboardStat,
  type DashboardStatFormat,
  type DashboardTrackerItem,
} from "@/services/dashboard";
import { useRouter } from "expo-router";
import { Activity, Building2, Clock3, TrendingUp, Users } from "lucide";
import { useEffect, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

function formatValue(value: number, format: DashboardStatFormat) {
  if (format === "percent") {
    return `${Math.round(value)}%`;
  }

  if (format === "hours") {
    return `${value.toFixed(1)}h`;
  }

  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatStatValue(stat: DashboardStat) {
  return formatValue(stat.value, stat.format);
}

function getStatIcon(statId: string) {
  if (statId === "rfid-reads") {
    return Activity;
  }

  if (statId === "active-students") {
    return Users;
  }

  if (statId === "trips-today") {
    return TrendingUp;
  }

  return Clock3;
}

function MetricCard({ stat }: { stat: DashboardStat }) {
  const toneMap = {
    amber: {
      accent: "#9a3412",
      backgroundColor: "#fff7ed",
      borderColor: "#fed7aa",
      iconColor: "#d97706",
    },
    emerald: {
      accent: "#065f46",
      backgroundColor: "#ecfdf5",
      borderColor: "#bbf7d0",
      iconColor: "#059669",
    },
    sky: {
      accent: "#0c4a6e",
      backgroundColor: "#f0f9ff",
      borderColor: "#bae6fd",
      iconColor: "#0284c7",
    },
    slate: {
      accent: "#334155",
      backgroundColor: "#f8fafc",
      borderColor: "#cbd5e1",
      iconColor: "#475569",
    },
  } as const;

  const styles = toneMap[stat.tone];

  return (
    <View
      className="w-[48.3%] rounded-[28px] border px-4 py-4"
      style={{
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View
          className="rounded-2xl p-3"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.72)" }}
        >
          <LucideIcon
            color={styles.iconColor}
            icon={getStatIcon(stat.id)}
            size={20}
          />
        </View>
        <Text
          className="text-right text-xs font-semibold"
          style={{ color: styles.accent }}
        >
          {stat.delta}
        </Text>
      </View>

      <Text className="mt-4 text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
        {stat.label}
      </Text>
      <Text className="mt-2 text-[26px] font-bold text-typography-950">
        {formatStatValue(stat)}
      </Text>
      <Text className="mt-2 text-sm leading-6 text-typography-600">
        {stat.note}
      </Text>
    </View>
  );
}

function TrackerRow({ item }: { item: DashboardTrackerItem }) {
  return (
    <View className="rounded-3xl bg-background-50 px-4 py-4">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text className="text-base font-semibold text-typography-900">
            {item.label}
          </Text>
          <Text className="mt-1 text-sm leading-6 text-typography-600">
            {item.description}
          </Text>
        </View>

        <View className="items-end gap-3">
          <Text className="text-[28px] font-bold text-typography-950">
            {formatValue(item.value, item.valueFormat ?? "number")}
          </Text>
          <View
            className="rounded-full px-3 py-2"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.12)" }}
          >
            <Text className="text-xs font-semibold text-tertiary-700">
              {item.status}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { company, session, signOut, user } = useAuth();
  const { width } = useWindowDimensions();
  const canViewDashboard = canAccessDashboard(session);
  const sessionRoles = extractSessionRoles(session);

  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineChartWidth = Math.max(width - 40, 280);
  const compactChartWidth = Math.max(width - 80, 240);

  useEffect(() => {
    let isMounted = true;

    if (!session) {
      setDashboard(null);
      setError(null);
      setIsAccessDenied(false);
      setIsLoading(false);

      return () => {
        isMounted = false;
      };
    }

    if (!canViewDashboard) {
      setDashboard(null);
      setError("Seu perfil nao possui acesso ao dashboard.");
      setIsAccessDenied(true);
      setIsLoading(false);

      return () => {
        isMounted = false;
      };
    }

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsAccessDenied(false);

        const realData = await fetchRealDashboardData();

        if (isMounted) {
          setDashboard(realData);
        }
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);

        if (!isMounted) {
          return;
        }

        if (err instanceof ApiError && [401, 403].includes(err.status)) {
          setDashboard(null);
          setError("Seu usuario nao possui permissao para visualizar este dashboard.");
          setIsAccessDenied(true);
          return;
        }

        setError(
          err instanceof ApiError
            ? `Nao foi possivel carregar o dashboard (${err.status}).`
            : err instanceof Error
              ? err.message
              : "Erro ao carregar dados do dashboard.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [canViewDashboard, session]);

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="gap-5">
          <PlatformHeader
            title={company?.name ?? "Dashboard principal"}
            subtitle="Visao operacional do dia com foco em metricas reais, leitura rapida e graficos uteis no mobile."
            detail={user?.email ?? "Sessao autenticada"}
            onSignOut={handleLogout}
          />

          {isLoading && !dashboard ? (
            <View className="rounded-[28px] bg-amber-50 px-5 py-4">
              <Text className="text-sm font-semibold text-amber-700">
                Carregando dados em tempo real...
              </Text>
            </View>
          ) : null}

          {error && !isAccessDenied ? (
            <View className="rounded-[28px] bg-red-50 px-5 py-4">
              <Text className="text-sm font-semibold text-red-700">{error}</Text>
              <Text className="mt-1 text-xs text-red-600">
                {dashboard
                  ? "Mantendo a ultima leitura disponivel."
                  : "Tente novamente em instantes."}
              </Text>
            </View>
          ) : null}

          {isAccessDenied ? (
            <View className="rounded-[28px] bg-red-50 px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-red-700">
                Acesso restrito
              </Text>
              <Text className="mt-2 text-2xl font-bold text-red-900">
                O dashboard nao esta liberado para este usuario.
              </Text>
              <Text className="mt-2 text-sm leading-6 text-red-700">
                Quando o app identifica um perfil fora das regras ou recebe 401/403
                do backend, ele deixa de exibir numeros ficticios e respeita o
                bloqueio.
              </Text>
              {sessionRoles.length > 0 ? (
                <Text className="mt-3 text-xs font-semibold uppercase tracking-[1.5px] text-red-600">
                  Perfis encontrados: {sessionRoles.join(", ")}
                </Text>
              ) : null}
            </View>
          ) : null}

          {dashboard ? (
            <>
              <View className="rounded-[28px] bg-background-0 px-5 py-5">
                <View className="flex-row items-start justify-between gap-4">
                  <View className="flex-1">
                    <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                      Dashboard principal
                    </Text>
                    <Text className="mt-2 text-[28px] font-bold leading-9 text-typography-950">
                      {dashboard.title}
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-typography-600">
                      {dashboard.description}
                    </Text>
                  </View>

                  <View className="rounded-full bg-tertiary-50 px-4 py-2">
                    <Text className="text-xs font-semibold text-tertiary-700">
                      {dashboard.updatedAtLabel}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row flex-wrap justify-between gap-y-4">
                {dashboard.stats.map((stat) => (
                  <MetricCard key={stat.id} stat={stat} />
                ))}
              </View>

              <View className="rounded-[28px] bg-background-0 p-5">
                <View className="flex-row items-start justify-between gap-4">
                  <View className="flex-1">
                    <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                      Resumo operacional
                    </Text>
                    <Text className="mt-2 text-2xl font-bold text-typography-950">
                      Indicadores em numeros reais
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-typography-600">
                      Esta area deixou de tratar contagens como porcentagem e agora
                      mostra somente o numero que realmente veio do backend.
                    </Text>
                  </View>

                  <View className="rounded-full bg-background-50 px-4 py-2">
                    <Text className="text-xs font-semibold text-typography-600">
                      {dashboard.tracker.length} itens
                    </Text>
                  </View>
                </View>

                <View className="mt-5 gap-3">
                  {dashboard.tracker.map((item) => (
                    <TrackerRow key={item.id} item={item} />
                  ))}
                </View>
              </View>

              <View
                className="overflow-hidden rounded-[28px]"
                style={{ backgroundColor: "#0f172a" }}
              >
                <View className="px-5 pb-2 pt-5">
                  <Text
                    className="text-xs font-semibold uppercase tracking-[1.5px]"
                    style={{ color: "#fde68a" }}
                  >
                    Serie diaria
                  </Text>
                  <Text className="mt-2 text-2xl font-bold text-typography-0">
                    Viagens iniciadas nos ultimos 7 dias
                  </Text>
                  <Text
                    className="mt-2 text-sm leading-6"
                    style={{ color: "rgba(226, 232, 240, 0.82)" }}
                  >
                    Tendencia das viagens registradas para a empresa logada.
                  </Text>
                </View>

                <LineChart
                  bezier
                  chartConfig={{
                    backgroundColor: "#0f172a",
                    backgroundGradientFrom: "#0f172a",
                    backgroundGradientTo: "#172554",
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                    decimalPlaces: 0,
                    fillShadowGradient: "#f59e0b",
                    fillShadowGradientOpacity: 0.18,
                    labelColor: (opacity = 1) =>
                      `rgba(226, 232, 240, ${opacity})`,
                    propsForBackgroundLines: {
                      stroke: "#334155",
                      strokeDasharray: "6 6",
                    },
                    propsForDots: {
                      r: "4",
                      stroke: "#f59e0b",
                      strokeWidth: "2",
                    },
                  }}
                  data={{
                    datasets: [
                      {
                        data: dashboard.lineSeries.map((item) => item.value),
                      },
                    ],
                    labels: dashboard.lineSeries.map((item) => item.label),
                  }}
                  fromZero
                  height={240}
                  style={{ marginLeft: -6 }}
                  width={lineChartWidth}
                  yAxisLabel=""
                  yAxisSuffix=""
                />
              </View>

              <View className="rounded-[28px] bg-background-0 p-5">
                <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                  Embarques
                </Text>
                <Text className="mt-2 text-2xl font-bold text-typography-950">
                  Leituras por dia nos ultimos 7 dias
                </Text>
                <Text className="mt-2 text-sm leading-6 text-typography-600">
                  O grafico em pizza foi removido e a leitura ficou concentrada no
                  que realmente ajuda: volume diario de embarques.
                </Text>

                <View className="mt-5 items-center rounded-[24px] bg-background-50 py-4">
                  <BarChart
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
                      decimalPlaces: 0,
                      fillShadowGradient: "#0f172a",
                      fillShadowGradientOpacity: 1,
                      labelColor: (opacity = 1) =>
                        `rgba(71, 85, 105, ${opacity})`,
                    }}
                    data={{
                      datasets: [
                        {
                          data: dashboard.barSeries.map((item) => item.value),
                        },
                      ],
                      labels: dashboard.barSeries.map((item) => item.label),
                    }}
                    fromZero
                    height={240}
                    showValuesOnTopOfBars
                    width={compactChartWidth}
                    yAxisLabel=""
                    yAxisSuffix=""
                  />
                </View>

                <View className="mt-5 rounded-[24px] bg-tertiary-50 px-4 py-4">
                  <View className="flex-row items-center gap-3">
                    <LucideIcon color="#b45309" icon={Building2} size={18} />
                    <Text className="flex-1 text-sm leading-6 text-tertiary-900">
                      A aba Cadastros concentra os modulos administrativos da
                      empresa, com o cadastro de onibus ja conectado ao backend.
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
