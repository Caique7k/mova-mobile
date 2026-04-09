import { LucideIcon } from "@/components/ui/lucide-icon";
import type { TelemetryPoint } from "@/services/location";
import { MapPinned } from "lucide";
import { Text, View } from "react-native";

export function LiveBusMap({
  lastUpdateLabel,
  latitude,
  longitude,
  plate,
  stale,
  trail,
}: {
  lastUpdateLabel: string;
  latitude: number;
  longitude: number;
  plate: string;
  stale: boolean;
  trail: TelemetryPoint[];
}) {
  return (
    <View
      className="overflow-hidden rounded-[28px] px-4 pb-4 pt-4"
      style={{ backgroundColor: "#d9ddd3", minHeight: 540 }}
    >
      <View
        className="rounded-[24px] px-4 py-4"
        style={{ backgroundColor: "rgba(255,255,255,0.94)" }}
      >
        <Text
          className="text-xs font-semibold uppercase tracking-[1.5px]"
          style={{ color: "#FC7C3A" }}
        >
          Navegacao UniPass
        </Text>
        <Text className="mt-2 text-xl font-bold text-typography-950">{plate}</Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          {stale
            ? `Ultima posicao conhecida as ${lastUpdateLabel}`
            : `Atualizacao ao vivo as ${lastUpdateLabel}`}
        </Text>
      </View>

      <View
        className="mt-4 flex-1 items-center justify-center rounded-[26px] border-2 border-dashed px-6 py-8"
        style={{ borderColor: "rgba(15,23,42,0.14)", backgroundColor: "rgba(255,255,255,0.35)" }}
      >
        <View className="items-center rounded-full bg-white/90 p-4">
          <LucideIcon color="#FC7C3A" icon={MapPinned} size={28} />
        </View>
        <Text className="mt-4 text-lg font-semibold text-typography-950">
          Mapa nativo no mobile
        </Text>
        <Text className="mt-2 max-w-[420px] text-center text-sm leading-6 text-typography-600">
          No app nativo usamos um mapa real com o onibus ao vivo. Na web mantemos a
          leitura operacional com coordenadas, status e trilha recente.
        </Text>

        <View className="mt-6 w-full rounded-[24px] bg-white/90 px-4 py-4">
          <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
            Coordenadas atuais
          </Text>
          <Text className="mt-2 text-base font-semibold text-typography-950">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-typography-600">
            Trilha acumulada nesta sessao: {trail.length} ponto(s)
          </Text>
        </View>
      </View>
    </View>
  );
}
