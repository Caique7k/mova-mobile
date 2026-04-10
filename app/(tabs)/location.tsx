import { LiveBusMap } from "@/components/location/live-bus-map";
import { PlatformHeader } from "@/components/platform-header";
import { Button, ButtonText } from "@/components/ui/button";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { useAuth } from "@/contexts/auth-context";
import { useLiveLocation } from "@/hooks/use-live-location";
import { canViewLiveLocation, getPrimarySessionRole } from "@/services/auth";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  Compass,
  Gauge,
  MapPinned,
  RefreshCcw,
  Route,
  SmartphoneNfc,
} from "lucide";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getStateLabel(
  state: ReturnType<typeof useLiveLocation>["viewModel"]["state"],
) {
  switch (state) {
    case "live":
      return "Ao vivo";
    case "stale":
      return "Última posição";
    case "needs-pairing":
      return "Pareamento pendente";
    case "no-online-device":
      return "Sem dispositivo online";
    default:
      return "Sem ônibus";
  }
}

function getStateCopy(
  state: ReturnType<typeof useLiveLocation>["viewModel"]["state"],
  isStudentOrCoordinator: boolean,
) {
  if (state === "no-buses") {
    return {
      description: isStudentOrCoordinator
        ? "Ainda não há ônibus disponíveis para acompanhamento nesta empresa."
        : "Cadastre um ônibus na aba Cadastros para iniciar a visualização em tempo real.",
      title: "Nenhum ônibus cadastrado",
    };
  }

  if (state === "needs-pairing") {
    return {
      description:
        "Esse ônibus ainda não possui um UniHub ativo vinculado para enviar telemetria.",
      title: "Pareie um UniHub primeiro",
    };
  }

  return {
    description:
      "Ainda não recebemos uma leitura recente de localização para este ônibus.",
    title: "Sem dispositivo online",
  };
}

function TopStat({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof LucideIcon>[0]["icon"];
  label: string;
  value: string;
}) {
  return (
    <View className="w-[48.2%] rounded-[22px] bg-background-50 px-4 py-4">
      <View className="flex-row items-center gap-2">
        <LucideIcon color="#FC7C3A" icon={icon} size={15} />
        <Text className="text-xs font-semibold uppercase tracking-[1.3px] text-typography-500">
          {label}
        </Text>
      </View>
      <Text className="mt-2 text-base font-semibold text-typography-950">
        {value}
      </Text>
    </View>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof LucideIcon>[0]["icon"];
  label: string;
  value: string;
}) {
  return (
    <View className="rounded-[22px] bg-background-0 px-4 py-4">
      <View className="flex-row items-center gap-2">
        <LucideIcon color="#FC7C3A" icon={icon} size={16} />
        <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
          {label}
        </Text>
      </View>
      <Text className="mt-3 text-sm font-semibold leading-6 text-typography-950">
        {value}
      </Text>
    </View>
  );
}

function EmptyLocationCard({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <View className="min-h-[380px] items-center justify-center rounded-[28px] bg-background-0 px-6 py-8">
      <View
        className="h-16 w-16 items-center justify-center rounded-[22px]"
        style={{ backgroundColor: "rgba(252, 124, 58, 0.12)" }}
      >
        <LucideIcon color="#FC7C3A" icon={MapPinned} size={28} />
      </View>
      <Text className="mt-5 text-center text-xl font-bold text-typography-950">
        {title}
      </Text>
      <Text className="mt-3 text-center text-sm leading-6 text-typography-600">
        {description}
      </Text>
    </View>
  );
}

export default function LocationScreen() {
  const router = useRouter();
  const { company, session, signOut, user } = useAuth();
  const primaryRole = getPrimarySessionRole(session);
  const isStudentOrCoordinator =
    primaryRole === "USER" || primaryRole === "COORDINATOR";
  const canAccessLocation = canViewLiveLocation(session);
  const {
    buses,
    error,
    isRefreshing,
    loading,
    refresh,
    selectedBusId,
    setSelectedBusId,
    viewModel,
  } = useLiveLocation();

  const stateCopy = getStateCopy(viewModel.state, isStudentOrCoordinator);

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="gap-5">
          <PlatformHeader
            title={
              isStudentOrCoordinator
                ? "Localização dos ônibus"
                : (company?.name ?? "Localização operacional")
            }
            subtitle={
              isStudentOrCoordinator
                ? "Acompanhe as localizações mais recentes dos ônibus da empresa em uma tela leve e direta."
                : "Escolha um ônibus e acompanhe no mapa a telemetria mais recente enviada pelo UniHub."
            }
            detail={user?.email ?? "Sessão autenticada"}
            onSignOut={handleLogout}
          />

          {!canAccessLocation ? (
            <View className="rounded-[28px] bg-red-50 px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-red-700">
                Acesso restrito
              </Text>
              <Text className="mt-2 text-2xl font-bold text-red-900">
                Seu perfil não pode visualizar o mapa ao vivo.
              </Text>
            </View>
          ) : (
            <>
              <View className="rounded-[28px] bg-background-0 px-5 py-5">
                <View className="flex-row items-start justify-between gap-4">
                  <View className="flex-1">
                    <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                      Mapa ao vivo
                    </Text>
                    <Text className="mt-2 text-[28px] font-bold leading-9 text-typography-950">
                      Localização em tempo real
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-typography-600">
                      Acompanhamento atualizado a cada 5 segundos.
                    </Text>
                  </View>

                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    isDisabled={isRefreshing}
                    onPress={() => {
                      void refresh();
                    }}
                  >
                    <LucideIcon color="#475569" icon={RefreshCcw} size={16} />
                    <ButtonText>
                      {isRefreshing ? "Atualizando..." : "Atualizar"}
                    </ButtonText>
                  </Button>
                </View>

                <View className="mt-5 flex-row flex-wrap justify-between gap-y-4">
                  <TopStat
                    icon={Route}
                    label="Ônibus"
                    value={String(buses.length)}
                  />
                  <TopStat
                    icon={SmartphoneNfc}
                    label="UniHub"
                    value={viewModel.linkedDevice ? "Vinculado" : "Pendente"}
                  />
                  <TopStat
                    icon={Compass}
                    label="Status"
                    value={getStateLabel(viewModel.state)}
                  />
                  <TopStat
                    icon={MapPinned}
                    label="Última leitura"
                    value={viewModel.summary.lastUpdateLabel}
                  />
                </View>
              </View>

              <View className="rounded-[28px] bg-background-0 px-5 py-5">
                <Text className="text-lg font-semibold text-typography-950">
                  Escolha o ônibus
                </Text>
                <Text className="mt-2 text-sm leading-6 text-typography-600">
                  Toque em um card para mudar o veículo acompanhado no mapa.
                </Text>

                {loading && buses.length === 0 ? (
                  <View className="mt-4 rounded-[24px] bg-amber-50 px-4 py-4">
                    <Text className="text-sm font-semibold text-amber-700">
                      Carregando a lista de ônibus...
                    </Text>
                  </View>
                ) : buses.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-4"
                    contentContainerStyle={{ gap: 12, paddingRight: 4 }}
                  >
                    {buses.map((bus) => {
                      const isSelected = selectedBusId === bus.id;

                      return (
                        <Pressable
                          key={bus.id}
                          className="w-[176px] rounded-[24px] border px-4 py-4"
                          onPress={() => {
                            setSelectedBusId(bus.id);
                          }}
                          style={{
                            backgroundColor: isSelected ? "#fff7ed" : "#f8fafc",
                            borderColor: isSelected ? "#FC7C3A" : "#e2e8f0",
                          }}
                        >
                          <Text className="text-xl font-bold text-typography-950">
                            {bus.plate}
                          </Text>
                          <Text className="mt-2 text-sm leading-6 text-typography-600">
                            Capacidade para {bus.capacity} passageiros.
                          </Text>
                          <View
                            className="mt-4 self-start rounded-full px-3 py-2"
                            style={{
                              backgroundColor: isSelected
                                ? "#ffedd5"
                                : "#ffffff",
                            }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{
                                color: isSelected ? "#c2410c" : "#64748b",
                              }}
                            >
                              {isSelected ? "Selecionado" : "Selecionar"}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <View className="mt-4 rounded-[24px] bg-background-50 px-4 py-4">
                    <Text className="text-sm font-semibold text-typography-900">
                      Nenhum ônibus disponível
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-typography-600">
                      Assim que a empresa cadastrar ônibus, eles aparecerão aqui
                      para acompanhamento.
                    </Text>
                  </View>
                )}
              </View>

              {error ? (
                <View className="rounded-[28px] bg-red-50 px-5 py-4">
                  <View className="flex-row items-start gap-3">
                    <LucideIcon
                      color="#b91c1c"
                      icon={AlertTriangle}
                      size={18}
                    />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-red-700">
                        {error}
                      </Text>
                      <Text className="mt-1 text-xs text-red-600">
                        Mantemos a última leitura disponível enquanto
                        atualizamos os dados.
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {(viewModel.state === "live" || viewModel.state === "stale") &&
              viewModel.telemetry &&
              viewModel.selectedBus ? (
                <>
                  <View className="rounded-[28px] bg-background-0 p-4">
                    <LiveBusMap
                      lastUpdateLabel={viewModel.summary.lastUpdateLabel}
                      latitude={viewModel.telemetry.latitude}
                      longitude={viewModel.telemetry.longitude}
                      plate={viewModel.selectedBus.plate}
                      stale={viewModel.state === "stale"}
                      trail={viewModel.trail}
                    />
                  </View>

                  <View className="gap-3">
                    <DetailCard
                      icon={Gauge}
                      label="Velocidade estimada"
                      value={
                        viewModel.summary.speedKmh !== null
                          ? `${viewModel.summary.speedKmh} km/h`
                          : "Calculando"
                      }
                    />
                    <DetailCard
                      icon={Route}
                      label="Origem recente"
                      value={viewModel.summary.originLabel}
                    />
                    <DetailCard
                      icon={MapPinned}
                      label="Destino atual"
                      value={viewModel.summary.destinationLabel}
                    />
                    <DetailCard
                      icon={Compass}
                      label="Última atualização"
                      value={viewModel.summary.lastUpdateLabel}
                    />
                  </View>
                </>
              ) : (
                <EmptyLocationCard
                  description={stateCopy.description}
                  title={stateCopy.title}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
