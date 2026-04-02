import { get } from "@/services/api";
import type { AuthSession } from "@/services/auth";

type JsonRecord = Record<string, unknown>;

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
  progress: number;
  status: string;
};

export type DashboardSeriesPoint = {
  label: string;
  value: number;
};

export type DashboardSnapshot = {
  barSeries: DashboardSeriesPoint[];
  description: string;
  lineSeries: DashboardSeriesPoint[];
  progressSeries: DashboardSeriesPoint[];
  stats: DashboardStat[];
  title: string;
  tracker: DashboardTrackerItem[];
  updatedAtLabel: string;
};

const dashboardRecordKeys = [
  "dashboard",
  "metrics",
  "stats",
  "summary",
  "kpis",
  "analytics",
  "indicadores",
  "indicators",
];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value
      .trim()
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=.*\.)/g, "")
      .replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function collectNestedRecords(input: unknown, maxDepth = 4) {
  const records: JsonRecord[] = [];
  const queue: Array<{ depth: number; value: unknown }> = [
    { depth: 0, value: input },
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || current.depth > maxDepth) {
      continue;
    }

    if (isRecord(current.value)) {
      if (!records.includes(current.value)) {
        records.push(current.value);
      }

      for (const value of Object.values(current.value)) {
        if (isRecord(value) || Array.isArray(value)) {
          queue.push({ depth: current.depth + 1, value });
        }
      }

      continue;
    }

    if (Array.isArray(current.value)) {
      for (const item of current.value) {
        if (isRecord(item) || Array.isArray(item)) {
          queue.push({ depth: current.depth + 1, value: item });
        }
      }
    }
  }

  return records;
}

function getNumberFromRecords(
  records: JsonRecord[],
  keys: string[],
  fallback: number,
) {
  for (const record of records) {
    for (const key of keys) {
      const value = asNumber(record[key]);

      if (value !== null) {
        return value;
      }
    }
  }

  return fallback;
}

function getFirstRecordByKeys(records: JsonRecord[], keys: string[]) {
  for (const record of records) {
    for (const key of keys) {
      if (isRecord(record[key])) {
        return record[key] as JsonRecord;
      }
    }
  }

  return null;
}

function getFirstArrayByKeys(records: JsonRecord[], keys: string[]) {
  for (const record of records) {
    for (const key of keys) {
      if (Array.isArray(record[key])) {
        return record[key] as unknown[];
      }
    }
  }

  return null;
}

function buildMonthLabels() {
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const current = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - index),
      1,
    );
    const month = formatter.format(current).replace(".", "").trim();

    return month.charAt(0).toUpperCase() + month.slice(1);
  });
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

function parseSeries(items: unknown[], maxItems = 6) {
  const series = items
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const label =
        asString(
          item.label ??
            item.name ??
            item.title ??
            item.month ??
            item.period ??
            item.stage,
        ) ?? `P${index + 1}`;

      const value = asNumber(
        item.value ??
          item.total ??
          item.count ??
          item.amount ??
          item.metric ??
          item.progress ??
          item.percentage,
      );

      if (value === null) {
        return null;
      }

      return {
        label,
        value,
      } satisfies DashboardSeriesPoint;
    })
    .filter((item): item is DashboardSeriesPoint => Boolean(item));

  return series.length >= 3 ? series.slice(0, maxItems) : null;
}

function parseProgressSeries(items: unknown[], maxItems = 3) {
  const progress = items
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const label =
        asString(item.label ?? item.name ?? item.title ?? item.stage) ??
        `Meta ${index + 1}`;

      const rawValue = asNumber(
        item.progress ?? item.value ?? item.percentage ?? item.total,
      );

      if (rawValue === null) {
        return null;
      }

      return {
        label,
        value: clamp(rawValue > 1 ? rawValue / 100 : rawValue, 0.12, 0.99),
      } satisfies DashboardSeriesPoint;
    })
    .filter((item): item is DashboardSeriesPoint => Boolean(item));

  return progress.length >= 3 ? progress.slice(0, maxItems) : null;
}

function parseTracker(items: unknown[], fallback: DashboardTrackerItem[]) {
  const tracker = items
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const label =
        asString(item.label ?? item.name ?? item.title ?? item.step) ??
        `Etapa ${index + 1}`;

      const description =
        asString(item.description ?? item.subtitle ?? item.detail) ??
        "Acompanhamento continuo da operacao.";

      const progressValue = asNumber(
        item.progress ?? item.value ?? item.percentage ?? item.completion,
      );

      if (progressValue === null) {
        return null;
      }

      const progress = clamp(
        progressValue > 1 ? progressValue / 100 : progressValue,
        0.08,
        0.99,
      );

      const status =
        asString(item.status ?? item.state ?? item.phase) ??
        (progress >= 0.8
          ? "No prazo"
          : progress >= 0.55
            ? "Atencao"
            : "Ajustar");

      return {
        description,
        id: `${label}-${index}`,
        label,
        progress,
        status,
      } satisfies DashboardTrackerItem;
    })
    .filter((item): item is DashboardTrackerItem => Boolean(item));

  return tracker.length >= 3 ? tracker.slice(0, 4) : fallback;
}

function buildFallbackSnapshot(session: AuthSession | null): DashboardSnapshot {
  const companyName = session?.company?.name ?? "Operacao principal";
  const seed = hashString(
    [
      session?.company?.id ?? "",
      session?.company?.name ?? "",
      session?.user?.email ?? "",
      session?.authMode ?? "",
    ].join(":") || "unipass",
  );

  const activeUsers = 48 + (seed % 140);
  const monitoredAccess = 860 + (seed % 3200);
  const trackerFlows = 8 + (seed % 17);
  const averageSla = Number((3.8 + (seed % 16) / 10).toFixed(1));
  const conversionRate = 76 + (seed % 18);
  const syncCoverage = 68 + (seed % 23);
  const expansionLevel = 54 + (seed % 31);

  const monthLabels = buildMonthLabels();
  const lineBase = 58 + (seed % 42);
  const lineSeries = monthLabels.map((label, index) => ({
    label,
    value: lineBase + index * 6 + ((seed >> index) % 11),
  }));

  const barSeries = [
    { label: "Aprov", value: 28 + (seed % 24) },
    { label: "Em analise", value: 16 + ((seed >> 1) % 19) },
    { label: "Integradas", value: 22 + ((seed >> 2) % 20) },
    { label: "Alertas", value: 9 + ((seed >> 3) % 10) },
    { label: "Pendencias", value: 7 + ((seed >> 4) % 12) },
  ];

  const tracker = [
    {
      description: "Convites, acessos e rotinas principais em execucao.",
      id: "access",
      label: "Acessos liberados",
      progress: clamp(0.7 + (seed % 16) / 100, 0.2, 0.95),
      status: "No prazo",
    },
    {
      description: "Sincronizacao entre regras, credenciais e perfis.",
      id: "compliance",
      label: "Compliance ativo",
      progress: clamp(0.58 + ((seed >> 2) % 18) / 100, 0.2, 0.93),
      status: "Monitorando",
    },
    {
      description: "Cards, trackers e acompanhamento de uso por area.",
      id: "engagement",
      label: "Engajamento do dashboard",
      progress: clamp(0.61 + ((seed >> 3) % 21) / 100, 0.2, 0.94),
      status: "Evoluindo",
    },
    {
      description: "Expansao de modulos conectados com time operacional.",
      id: "expansion",
      label: "Expansao de modulos",
      progress: clamp(0.46 + ((seed >> 4) % 20) / 100, 0.15, 0.9),
      status: "Em rollout",
    },
  ];

  return {
    barSeries,
    description:
      "Visao consolidada do dashboard mobile com estrutura pronta para receber os mesmos indicadores da plataforma web.",
    lineSeries,
    progressSeries: [
      { label: "Conversao", value: conversionRate / 100 },
      { label: "Cobertura", value: syncCoverage / 100 },
      { label: "Expansao", value: expansionLevel / 100 },
    ],
    stats: [
      {
        delta: `+${12 + (seed % 10)}% no mes`,
        format: "number",
        id: "monitored-access",
        label: "Acessos monitorados",
        note: "Volume consolidado de acessos e eventos acompanhados.",
        tone: "amber",
        value: monitoredAccess,
      },
      {
        delta: `+${4 + (seed % 6)} novos`,
        format: "number",
        id: "active-users",
        label: "Usuarios ativos",
        note: "Usuarios com sessao, uso recente ou fluxos em andamento.",
        tone: "sky",
        value: activeUsers,
      },
      {
        delta: `${trackerFlows} frentes em execucao`,
        format: "number",
        id: "tracker-flows",
        label: "Fluxos no tracker",
        note: "Acompanhamento das frentes mais importantes da operacao.",
        tone: "emerald",
        value: trackerFlows,
      },
      {
        delta: "Tempo medio por atendimento",
        format: "hours",
        id: "average-sla",
        label: "SLA medio",
        note: "Ritmo atual para respostas e estabilizacao dos fluxos.",
        tone: "slate",
        value: averageSla,
      },
    ],
    title: `Dashboard de ${companyName}`,
    tracker,
    updatedAtLabel: formatUpdatedAtLabel(),
  };
}

function findDashboardRecord(session: AuthSession | null) {
  const records = collectNestedRecords([
    session?.tokenPayload ?? null,
    session?.user ?? null,
    session?.company ?? null,
  ]);

  const dashboardRecord = getFirstRecordByKeys(records, dashboardRecordKeys);

  if (dashboardRecord) {
    return {
      dashboardRecord,
      records: [...collectNestedRecords(dashboardRecord), ...records],
    };
  }

  return { dashboardRecord: null, records };
}

export function buildDashboardSnapshot(session: AuthSession | null) {
  const fallback = buildFallbackSnapshot(session);
  const { dashboardRecord, records } = findDashboardRecord(session);

  if (!dashboardRecord) {
    return fallback;
  }

  const lineSeries =
    parseSeries(
      getFirstArrayByKeys(records, [
        "trend",
        "timeline",
        "history",
        "lineChart",
        "line_chart",
      ]) ?? [],
    ) ?? fallback.lineSeries;

  const barSeries =
    parseSeries(
      getFirstArrayByKeys(records, [
        "breakdown",
        "categories",
        "barChart",
        "bar_chart",
        "distribution",
      ]) ?? [],
      5,
    ) ?? fallback.barSeries;

  const progressSeries =
    parseProgressSeries(
      getFirstArrayByKeys(records, [
        "progress",
        "coverage",
        "goals",
        "completion",
      ]) ?? [],
    ) ?? fallback.progressSeries;

  return {
    ...fallback,
    barSeries,
    lineSeries,
    progressSeries,
    stats: [
      {
        ...fallback.stats[0],
        value: getNumberFromRecords(
          records,
          [
            "monitoredAccess",
            "monitored_access",
            "totalAccess",
            "total_access",
            "accessCount",
            "access_count",
          ],
          fallback.stats[0].value,
        ),
      },
      {
        ...fallback.stats[1],
        value: getNumberFromRecords(
          records,
          [
            "activeUsers",
            "active_users",
            "users",
            "usuarios",
            "members",
            "employees",
          ],
          fallback.stats[1].value,
        ),
      },
      {
        ...fallback.stats[2],
        value: getNumberFromRecords(
          records,
          [
            "trackerFlows",
            "tracker_flows",
            "trackers",
            "pipelines",
            "flows",
            "etapas",
          ],
          fallback.stats[2].value,
        ),
      },
      {
        ...fallback.stats[3],
        value: getNumberFromRecords(
          records,
          ["averageSla", "average_sla", "sla", "tempoMedio", "tempo_medio"],
          fallback.stats[3].value,
        ),
      },
    ],
    tracker: parseTracker(
      getFirstArrayByKeys(records, [
        "tracker",
        "steps",
        "workflow",
        "pipeline",
        "milestones",
      ]) ?? [],
      fallback.tracker,
    ),
  };
}

export interface DashboardMetricsResponse {
  activeStudents: number;
  rfidReads: number;
  tripsToday: number;
  busCapacityUsed: number;
  changeStudents: number;
  trendStudents: "up" | "down";
  changeRfid: number;
  trendRfid: "up" | "down";
  changeTrips: number;
  trendTrips: "up" | "down";
  changeBuses: number;
  trendBuses: "up" | "down";
  charts: {
    boardings: Array<{ date: string; count: number }>;
    trips: Array<{ date: string; count: number }>;
  };
}

export async function fetchRealDashboardData(): Promise<DashboardSnapshot> {
  try {
    const data = await get<DashboardMetricsResponse>("/dashboard");

    // Formatar labels de tendência com emojis para melhor visualização
    const trendEmoji = (trend: "up" | "down") => (trend === "up" ? "↑" : "↓");

    // Construir stats com dados reais
    const stats: DashboardStat[] = [
      {
        id: "active-students",
        label: "Alunos ativos",
        value: data.activeStudents,
        delta: `${trendEmoji(data.trendStudents)} ${Math.abs(data.changeStudents)} hoje`,
        format: "number",
        tone: "emerald",
        note: "Alunos com status ativo na empresa",
      },
      {
        id: "rfid-reads",
        label: "Leituras RFID",
        value: data.rfidReads,
        delta: `${trendEmoji(data.trendRfid)} ${Math.abs(data.changeRfid)} hoje`,
        format: "number",
        tone: "sky",
        note: "Total de embarques detectados hoje",
      },
      {
        id: "trips-today",
        label: "Viagens em operação",
        value: data.tripsToday,
        delta: `${trendEmoji(data.trendTrips)} ${Math.abs(data.changeTrips)} hoje`,
        format: "number",
        tone: "amber",
        note: "Viagens que começaram hoje",
      },
      {
        id: "bus-capacity",
        label: "Passageiros transportados",
        value: data.busCapacityUsed,
        delta: `${trendEmoji(data.trendBuses)} ${Math.abs(data.changeBuses)} comparado ontem`,
        format: "number",
        tone: "slate",
        note: "Passageiros embarcados em ônibus",
      },
    ];

    // Converter dados de gráficos para o formato esperado
    const barSeries: DashboardSeriesPoint[] =
      data.charts.boardings.map((item) => ({
        label: new Date(item.date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }),
        value: item.count,
      })) || [];

    const lineSeries: DashboardSeriesPoint[] =
      data.charts.trips.map((item) => ({
        label: new Date(item.date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }),
        value: item.count,
      })) || [];

    // Criar tracker com status de operação
    const tracker: DashboardTrackerItem[] = [
      {
        id: "active-students-tracker",
        label: "Alunos cadastrados",
        description: `${data.activeStudents} alunos com status ativo`,
        progress: Math.min(data.activeStudents / 100, 0.95), // normalizar para 0-0.95
        status:
          data.changeStudents >= 0
            ? "Crescendo"
            : data.changeStudents > -5
              ? "Estável"
              : "Reduzindo",
      },
      {
        id: "online-trips-tracker",
        label: "Viagens operando",
        description: `${data.tripsToday} viagens iniciadas hoje`,
        progress: Math.min(data.tripsToday / 50, 0.95),
        status:
          data.tripsToday > 10
            ? "Ativo"
            : data.tripsToday > 5
              ? "Normal"
              : "Baixo",
      },
      {
        id: "boarding-tracker",
        label: "Embarques",
        description: `${data.rfidReads} passageiros embarcaram`,
        progress: Math.min(data.rfidReads / 200, 0.95),
        status:
          data.rfidReads > 100
            ? "Alto movimento"
            : data.rfidReads > 50
              ? "Moderado"
              : "Baixo",
      },
    ];

    return {
      title: "Dashboard de Operações",
      description:
        "Visão consolidada das métricas de operação em tempo real da frota de ônibus",
      stats,
      barSeries,
      lineSeries,
      progressSeries: [
        {
          label: "Occupação",
          value: Math.min(data.busCapacityUsed / 1000, 0.99),
        },
        { label: "Cobertura", value: 0.85 },
        { label: "Eficiência", value: 0.92 },
      ],
      tracker,
      updatedAtLabel: formatUpdatedAtLabel(),
    };
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    throw error;
  }
}
