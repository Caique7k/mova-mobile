import { PlatformHeader } from "@/components/platform-header";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/services/api";
import { canAccessDashboard, extractSessionRoles } from "@/services/auth";
import {
  fetchRealDashboardData,
  type DashboardSeriesPoint,
  type DashboardSnapshot,
  type DashboardStat,
  type DashboardStatFormat,
} from "@/services/dashboard";
import { Activity, Clock3, TrendingUp, Users } from "lucide";
import { useEffect, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
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

function getCompactChartLabels(series: DashboardSeriesPoint[]) {
  return series.map((item) => item.label.split(" ")[0] ?? item.label);
}

function MetricCard({ stat }: { stat: DashboardStat }) {
  const toneMap = {
    amber: {
      accent: "#9a3412",
      backgroundColor: "#fff7ed",
      badgeBackground: "#ffedd5",
      borderColor: "#fed7aa",
      iconColor: "#d97706",
    },
    emerald: {
      accent: "#065f46",
      backgroundColor: "#ecfdf5",
      badgeBackground: "#d1fae5",
      borderColor: "#bbf7d0",
      iconColor: "#059669",
    },
    sky: {
      accent: "#0c4a6e",
      backgroundColor: "#f0f9ff",
      badgeBackground: "#e0f2fe",
      borderColor: "#bae6fd",
      iconColor: "#0284c7",
    },
    slate: {
      accent: "#334155",
      backgroundColor: "#f8fafc",
      badgeBackground: "#e2e8f0",
      borderColor: "#cbd5e1",
      iconColor: "#475569",
    },
  } as const;

  const stylesByTone = toneMap[stat.tone];

  return (
    <View
      className="w-[48.2%] rounded-[28px] border px-4 py-4"
      style={{
        backgroundColor: stylesByTone.backgroundColor,
        borderColor: stylesByTone.borderColor,
        minHeight: 180,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View
          className="rounded-full p-3"
          style={{ backgroundColor: stylesByTone.badgeBackground }}
        >
          <LucideIcon
            color={stylesByTone.iconColor}
            icon={getStatIcon(stat.id)}
            size={20}
          />
        </View>

        <View
          className="max-w-[44%] self-start rounded-full px-2.5 py-1.5"
          style={{ backgroundColor: stylesByTone.badgeBackground }}
        >
          <Text
            className="text-right text-[9px] font-semibold uppercase tracking-[0.4px]"
            numberOfLines={1}
            style={{ color: stylesByTone.accent }}
          >
            {stat.delta}
          </Text>
        </View>
      </View>

      <Text className="mt-5 text-xs font-semibold uppercase tracking-[1.4px] text-typography-500">
        {stat.label}
      </Text>
      <Text className="mt-2 text-[28px] font-bold text-typography-950">
        {formatStatValue(stat)}
      </Text>
      <Text className="mt-2 text-sm leading-5 text-typography-600">
        {stat.note}
      </Text>
    </View>
  );
}

function ChartCard({
  chartWidth,
  description,
  series,
  title,
}: {
  chartWidth: number;
  description: string;
  series: DashboardSeriesPoint[];
  title: string;
}) {
  return (
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
          {title}
        </Text>
        <Text
          className="mt-2 text-sm leading-6"
          style={{ color: "rgba(226, 232, 240, 0.82)" }}
        >
          {description}
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
          propsForLabels: {
            fontSize: 10,
          },
        }}
        data={{
          datasets: [
            {
              data: series.map((item) => item.value),
            },
          ],
          labels: getCompactChartLabels(series),
        }}
        fromZero
        height={228}
        segments={4}
        style={{ marginLeft: -8, paddingBottom: 8 }}
        width={chartWidth}
        withInnerLines
        withOuterLines={false}
        withVerticalLines={false}
        xLabelsOffset={-2}
        yAxisLabel=""
        yAxisSuffix=""
      />
    </View>
  );
}

export default function Home() {
  const { company, session, user } = useAuth();
  const { width } = useWindowDimensions();
  const canViewDashboard = canAccessDashboard(session);
  const sessionRoles = extractSessionRoles(session);

  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartWidth = Math.max(width - 52, 270);

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
          setError(
            "Seu usuario nao possui permissao para visualizar este dashboard.",
          );
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

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="gap-5">
          <PlatformHeader
            title={company?.name ?? "Dashboard principal"}
            subtitle="Visao operacional do dia com foco em metricas reais, leitura rapida e graficos uteis no mobile."
            detail={user?.email ?? "Sessao autenticada"}
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
                Quando o app identifica um perfil fora das regras ou recebe
                401/403 do backend, ele respeita o bloqueio de acesso.
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
                </View>
              </View>

              <View className="flex-row flex-wrap justify-between gap-y-4">
                {dashboard.stats.map((stat) => (
                  <MetricCard key={stat.id} stat={stat} />
                ))}
              </View>

              <ChartCard
                chartWidth={chartWidth}
                description="Tendencia das viagens registradas para a empresa."
                series={dashboard.lineSeries}
                title="Viagens iniciadas nos ultimos 7 dias"
              />

              <ChartCard
                chartWidth={chartWidth}
                description="Volume diario de embarques registrados nos ultimos 7 dias."
                series={dashboard.barSeries}
                title="Embarques nos ultimos 7 dias"
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
