import { get } from "@/services/api";

export type DashboardStatFormat = "hours" | "number" | "percent";
export type DashboardStatTone = "amber" | "emerald" | "sky" | "slate";

export type DashboardStat = {
  delta: string;
  format: DashboardStatFormat;
  id: string;
  label: string;
  note: string;
  tone: DashboardStatTone;
  value: number;
};

export type DashboardTrackerItem = {
  description: string;
  id: string;
  label: string;
  status: string;
  value: number;
  valueFormat?: DashboardStatFormat;
};

export type DashboardSeriesPoint = {
  label: string;
  value: number;
};

export type DashboardSnapshot = {
  barSeries: DashboardSeriesPoint[];
  description: string;
  lineSeries: DashboardSeriesPoint[];
  stats: DashboardStat[];
  title: string;
  tracker: DashboardTrackerItem[];
  updatedAtLabel: string;
};

export interface DashboardMetricsResponse {
  activeStudents: number;
  busCapacityUsed: number;
  changeBuses: number;
  changeRfid: number;
  changeStudents: number;
  changeTrips: number;
  charts: {
    boardings: Array<{ count: number; date: string }>;
    trips: Array<{ count: number; date: string }>;
  };
  rfidReads: number;
  trendBuses: "down" | "up";
  trendRfid: "down" | "up";
  trendStudents: "down" | "up";
  trendTrips: "down" | "up";
  tripsToday: number;
}

function formatUpdatedAtLabel() {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });

  return `Atualizado em ${formatter.format(new Date()).replace(".", "")}`;
}

function formatChartLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return date;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(new Date(year, month - 1, day))
    .replace(".", "");
}

function formatDelta(change: number) {
  if (change === 0) {
    return "Estável";
  }

  const prefix = change > 0 ? "+" : "-";
  const absoluteValue = new Intl.NumberFormat("pt-BR").format(
    Math.abs(change),
  );

  return `${prefix}${absoluteValue} vs ontem`;
}

function getChangeStatus(change: number) {
  if (change > 0) {
    return "Acima de ontem";
  }

  if (change < 0) {
    return "Abaixo de ontem";
  }

  return "Mesmo ritmo";
}

function normalizeSeries(
  items: Array<{ count: number; date: string }> | undefined,
  fallbackLabel: string,
) {
  if (!items || items.length === 0) {
    return [{ label: fallbackLabel, value: 0 }];
  }

  return items.slice(-7).map((item) => ({
    label: formatChartLabel(item.date),
    value: Number.isFinite(item.count) ? item.count : 0,
  }));
}

export async function fetchRealDashboardData(): Promise<DashboardSnapshot> {
  const data = await get<DashboardMetricsResponse>("/dashboard");

  const stats: DashboardStat[] = [
    {
      delta: formatDelta(data.changeStudents),
      format: "number",
      id: "active-students",
      label: "Alunos ativos",
      note: "Base ativa vinculada à empresa.",
      tone: "emerald",
      value: data.activeStudents,
    },
    {
      delta: formatDelta(data.changeRfid),
      format: "number",
      id: "rfid-reads",
      label: "Leituras RFID",
      note: "Embarques registrados hoje.",
      tone: "sky",
      value: data.rfidReads,
    },
    {
      delta: formatDelta(data.changeTrips),
      format: "number",
      id: "trips-today",
      label: "Viagens hoje",
      note: "Viagens iniciadas ao longo do dia.",
      tone: "amber",
      value: data.tripsToday,
    },
    {
      delta: formatDelta(data.changeBuses),
      format: "number",
      id: "bus-capacity",
      label: "Passageiros transportados",
      note: "Total embarcado na operação de hoje.",
      tone: "slate",
      value: data.busCapacityUsed,
    },
  ];

  const tracker: DashboardTrackerItem[] = [
    {
      description: "Quantidade atual de alunos ativos para a empresa logada.",
      id: "students-summary",
      label: "Alunos ativos",
      status: getChangeStatus(data.changeStudents),
      value: data.activeStudents,
    },
    {
      description: "Leituras de embarque registradas no dia atual.",
      id: "boardings-summary",
      label: "Embarques hoje",
      status: getChangeStatus(data.changeRfid),
      value: data.rfidReads,
    },
    {
      description: "Viagens iniciadas e reconhecidas na janela de hoje.",
      id: "trips-summary",
      label: "Viagens hoje",
      status: getChangeStatus(data.changeTrips),
      value: data.tripsToday,
    },
    {
      description: "Passageiros contabilizados nas viagens da operação.",
      id: "capacity-summary",
      label: "Passageiros",
      status: getChangeStatus(data.changeBuses),
      value: data.busCapacityUsed,
    },
  ];

  return {
    barSeries: normalizeSeries(data.charts?.boardings, "Hoje"),
    description:
      "Leitura consolidada das métricas operacionais da empresa nos últimos 7 dias.",
    lineSeries: normalizeSeries(data.charts?.trips, "Hoje"),
    stats,
    title: "Dashboard de operações",
    tracker,
    updatedAtLabel: formatUpdatedAtLabel(),
  };
}
