import { PlatformHeader } from "@/components/platform-header";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { useAuth } from "@/contexts/auth-context";
import {
  buildDashboardSnapshot,
  fetchRealDashboardData,
  type DashboardSnapshot,
  type DashboardStat,
  type DashboardStatTone,
  type DashboardTrackerItem,
} from "@/services/dashboard";
import { useRouter } from "expo-router";
import { Activity, Building2, Clock3, TrendingUp, Users } from "lucide";
import { useEffect, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { BarChart, LineChart, ProgressChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

function formatStatValue(stat: DashboardStat) {
  if (stat.format === "percent") {
    return `${Math.round(stat.value)}%`;
  }

  if (stat.format === "hours") {
    return `${stat.value.toFixed(1)}h`;
  }

  return new Intl.NumberFormat("pt-BR").format(Math.round(stat.value));
}

function getStatIcon(statId: string) {
  if (statId === "monitored-access") {
    return Activity;
  }

  if (statId === "active-users") {
    return Users;
  }

  if (statId === "tracker-flows") {
    return TrendingUp;
  }

  return Clock3;
}

function MetricCard({ stat }: { stat: DashboardStat }) {
  const toneMap: Record<
    DashboardStatTone,
    {
      accent: string;
      backgroundColor: string;
      borderColor: string;
      iconColor: string;
    }
  > = {
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
  };

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
  const progressPercent = Math.round(item.progress * 100);
  const barColor =
    item.progress >= 0.8
      ? "#059669"
      : item.progress >= 0.6
        ? "#d97706"
        : "#0284c7";

  return (
    <View className="rounded-3xl bg-background-50 px-4 py-4">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text className="text-base font-semibold text-typography-900">
            {item.label}
          </Text>
          <Text className="mt-1 text-sm leading-6 text-typography-600">
            {item.description}
          </Text>
        </View>

        <View
          className="rounded-full px-3 py-2"
          style={{ backgroundColor: "rgba(245, 158, 11, 0.12)" }}
        >
          <Text className="text-xs font-semibold text-tertiary-700">
            {item.status}
          </Text>
        </View>
      </View>

      <View className="mt-4 gap-2">
        <View className="h-2 overflow-hidden rounded-full bg-outline-100">
          <View
            className="h-full rounded-full"
            style={{ backgroundColor: barColor, width: `${progressPercent}%` }}
          />
        </View>
        <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
          {progressPercent}% concluido
        </Text>
      </View>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { company, session, signOut, user } = useAuth();
  const { width } = useWindowDimensions();

  const [dashboard, setDashboard] = useState<DashboardSnapshot>(() =>
    buildDashboardSnapshot(session),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lineChartWidth = Math.max(width - 40, 280);
  const compactChartWidth = Math.max(width - 80, 240);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const realData = await fetchRealDashboardData();
        if (isMounted) {
          setDashboard(realData);
        }
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Erro ao carregar dados",
          );
          // Fallback para dados fictícios em caso de erro
          setDashboard(buildDashboardSnapshot(session));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [session]);

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
            subtitle="Entrada principal do app com os cards, tracker operacional e graficos pensados para espelhar a leitura da plataforma web no celular."
            detail={user?.email ?? "Sessao autenticada"}
            onSignOut={handleLogout}
          />

          {isLoading && (
            <View className="rounded-[28px] bg-amber-50 px-5 py-4">
              <Text className="text-sm font-semibold text-amber-700">
                Carregando dados em tempo real...
              </Text>
            </View>
          )}

          {error && (
            <View className="rounded-[28px] bg-red-50 px-5 py-4">
              <Text className="text-sm font-semibold text-red-700">
                ⚠️ {error}
              </Text>
              <Text className="mt-1 text-xs text-red-600">
                Exibindo dados em cache. Tente novamente mais tarde.
              </Text>
            </View>
          )}

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
                  Tracker operacional
                </Text>
                <Text className="mt-2 text-2xl font-bold text-typography-950">
                  Frentes acompanhadas no app
                </Text>
                <Text className="mt-2 text-sm leading-6 text-typography-600">
                  Esta area recebe os acompanhamentos mais importantes do
                  dashboard web e organiza a leitura para mobile.
                </Text>
              </View>

              <View className="rounded-full bg-background-50 px-4 py-2">
                <Text className="text-xs font-semibold text-typography-600">
                  {dashboard.tracker.length} itens ativos
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
                Tendencia
              </Text>
              <Text className="mt-2 text-2xl font-bold text-typography-0">
                Evolucao dos principais indicadores
              </Text>
              <Text
                className="mt-2 text-sm leading-6"
                style={{ color: "rgba(226, 232, 240, 0.82)" }}
              >
                Grafico preparado para receber a serie historica da plataforma
                web com a mesma leitura do dashboard principal.
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
                labelColor: (opacity = 1) => `rgba(226, 232, 240, ${opacity})`,
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
              Distribuicao
            </Text>
            <Text className="mt-2 text-2xl font-bold text-typography-950">
              Numeros e cobertura do dashboard
            </Text>
            <Text className="mt-2 text-sm leading-6 text-typography-600">
              Uma leitura complementar para categorias, cobranca operacional e
              metas de cobertura.
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
                  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
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

            <View className="mt-5 items-center rounded-[24px] bg-background-50 py-4">
              <ProgressChart
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  color: (opacity = 1) => `rgba(217, 119, 6, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
                }}
                data={{
                  data: dashboard.progressSeries.map((item) => item.value),
                  labels: dashboard.progressSeries.map((item) => item.label),
                }}
                height={220}
                hideLegend={false}
                radius={34}
                strokeWidth={12}
                width={compactChartWidth}
              />
            </View>

            <View className="mt-5 rounded-[24px] bg-tertiary-50 px-4 py-4">
              <View className="flex-row items-center gap-3">
                <LucideIcon color="#b45309" icon={Building2} size={18} />
                <Text className="flex-1 text-sm leading-6 text-tertiary-900">
                  A aba Empresa continua disponivel na barra inferior para
                  concentrar os detalhes cadastrais, sessao autenticada e status
                  do backend.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
