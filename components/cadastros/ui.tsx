import { LucideIcon } from "@/components/ui/lucide-icon";
import { BadgeInfo, ChevronRight, CircleAlert, ShieldCheck } from "lucide";
import { Pressable, Text, View } from "react-native";

import type { CatalogSection } from "@/components/cadastros/types";

export function SummaryCard({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: string;
}) {
  return (
    <View className="rounded-[24px] bg-background-50 px-4 py-4">
      <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
        {label}
      </Text>
      <Text className="mt-2 text-2xl font-bold text-typography-950">{value}</Text>
      <Text className="mt-2 text-sm leading-6 text-typography-600">{description}</Text>
    </View>
  );
}

export function FeedbackBanner({
  message,
  tone,
}: {
  message: string;
  tone: "error" | "success";
}) {
  const styles =
    tone === "success"
      ? {
          backgroundColor: "#ecfdf5",
          iconColor: "#047857",
          textColor: "#065f46",
        }
      : {
          backgroundColor: "#fef2f2",
          iconColor: "#b91c1c",
          textColor: "#991b1b",
        };

  return (
    <View
      className="rounded-[28px] px-5 py-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <View className="flex-row items-center gap-3">
        <LucideIcon
          color={styles.iconColor}
          icon={tone === "success" ? ShieldCheck : CircleAlert}
          size={18}
        />
        <Text className="flex-1 text-sm font-semibold" style={{ color: styles.textColor }}>
          {message}
        </Text>
      </View>
    </View>
  );
}

export function CatalogNavItem({
  active,
  compact,
  onPress,
  section,
}: {
  active: boolean;
  compact: boolean;
  onPress: () => void;
  section: CatalogSection;
}) {
  const statusStyles =
    section.statusTone === "live"
      ? {
          backgroundColor: "#ecfdf5",
          color: "#047857",
        }
      : {
          backgroundColor: "#eff6ff",
          color: "#1d4ed8",
        };

  return (
    <Pressable
      accessibilityRole="button"
      className="rounded-[24px] border px-4 py-4"
      onPress={onPress}
      style={{
        backgroundColor: active ? "#fff7ed" : "#f8fafc",
        borderColor: active ? "#FC7C3A" : "#e2e8f0",
        minWidth: compact ? 220 : undefined,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="rounded-2xl p-3"
          style={{
            backgroundColor: active ? "rgba(252, 124, 58, 0.14)" : "#ffffff",
          }}
        >
          <LucideIcon
            color={active ? "#FC7C3A" : "#475569"}
            icon={section.icon}
            size={18}
          />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-typography-950">
            {section.label}
          </Text>
          <Text className="mt-1 text-sm leading-6 text-typography-600">
            {section.description}
          </Text>
        </View>

        {!compact ? (
          <LucideIcon color={active ? "#FC7C3A" : "#94a3b8"} icon={ChevronRight} size={16} />
        ) : null}
      </View>

      <View
        className="mt-4 self-start rounded-full px-3 py-2"
        style={{ backgroundColor: statusStyles.backgroundColor }}
      >
        <Text className="text-xs font-semibold" style={{ color: statusStyles.color }}>
          {section.status}
        </Text>
      </View>
    </Pressable>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <View>
      <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
        {eyebrow}
      </Text>
      <Text className="mt-2 text-[28px] font-bold leading-9 text-typography-950">
        {title}
      </Text>
      <Text className="mt-2 text-sm leading-6 text-typography-600">{description}</Text>
    </View>
  );
}

export function PlaceholderSection({
  actionLabel,
  description,
  icon,
  title,
}: {
  actionLabel: string;
  description: string;
  icon: Parameters<typeof LucideIcon>[0]["icon"];
  title: string;
}) {
  return (
    <View className="gap-4">
      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <View className="flex-row items-start gap-4">
          <View className="rounded-2xl bg-tertiary-50 p-3">
            <LucideIcon color="#b45309" icon={icon} size={20} />
          </View>

          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
              Proxima integracao
            </Text>
            <Text className="mt-2 text-2xl font-bold text-typography-950">{title}</Text>
            <Text className="mt-2 text-sm leading-6 text-typography-600">{description}</Text>
          </View>
        </View>
      </View>

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <Text className="text-base font-semibold text-typography-950">
          O layout ja esta pronto para:
        </Text>
        <Text className="mt-3 text-sm leading-6 text-typography-600">
          Listar registros com busca e paginacao.
        </Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          Abrir formulario de cadastro, edicao e exclusao.
        </Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          Reaproveitar o mesmo padrao visual do modulo de onibus.
        </Text>
      </View>

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <View className="flex-row items-start gap-3">
          <LucideIcon color="#1d4ed8" icon={BadgeInfo} size={18} />
          <View className="flex-1">
            <Text className="text-base font-semibold text-typography-950">
              Backend ainda nao conectado
            </Text>
            <Text className="mt-2 text-sm leading-6 text-typography-600">
              Assim que voce me passar o controller e service de {actionLabel}, eu
              plugo o CRUD real nesta mesma area sem mudar a navegacao.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
