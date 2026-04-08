import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import {
  BadgeInfo,
  BusFront,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide";
import { ScrollView, Text, View } from "react-native";

import { BusFormModal } from "@/components/cadastros/bus-form-modal";
import { FeedbackBanner } from "@/components/cadastros/ui";
import type { Bus } from "@/services/buses";

function formatBusDate(value?: string) {
  if (!value) {
    return "Data nao informada";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data nao informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function getCapacityLabel(value: number) {
  const count = formatCount(value);
  return value === 1 ? `${count} lugar` : `${count} lugares`;
}

const RESULTS_VIEWPORT_HEIGHT = 540;

export function BusesSection({
  appliedSearch,
  buses,
  capacityInput,
  deletingBusId,
  editingBusId,
  feedbackMessage,
  feedbackTone,
  formErrorMessage,
  formErrors,
  isLoadingBuses,
  isModalOpen,
  isSavingBus,
  lastPage,
  onCapacityChange,
  onClearSearch,
  onCloseModal,
  onDeleteBus,
  onEditBus,
  onOpenCreateModal,
  onPageChange,
  onPlateChange,
  onRefresh,
  onSearch,
  onSubmit,
  page,
  plateInput,
  searchInput,
  setSearchInput,
  totalBuses,
  visibleCapacity,
}: {
  appliedSearch: string;
  buses: Bus[];
  capacityInput: string;
  deletingBusId: string | null;
  editingBusId: string | null;
  feedbackMessage: string | null;
  feedbackTone: "error" | "success" | null;
  formErrorMessage?: string;
  formErrors: {
    capacity?: string;
    plate?: string;
  };
  isLoadingBuses: boolean;
  isModalOpen: boolean;
  isSavingBus: boolean;
  lastPage: number;
  onCapacityChange: (value: string) => void;
  onClearSearch: () => void;
  onCloseModal: () => void;
  onDeleteBus: (bus: Bus) => void;
  onEditBus: (bus: Bus) => void;
  onOpenCreateModal: () => void;
  onPageChange: (page: number) => void;
  onPlateChange: (value: string) => void;
  onRefresh: () => void;
  onSearch: () => void;
  onSubmit: () => void;
  page: number;
  plateInput: string;
  searchInput: string;
  setSearchInput: (value: string) => void;
  totalBuses: number;
  visibleCapacity: number;
}) {
  return (
    <View className="gap-4">
      {feedbackMessage && feedbackTone ? (
        <FeedbackBanner message={feedbackMessage} tone={feedbackTone} />
      ) : null}

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <Text className="text-lg font-semibold text-typography-950">
          Buscar e filtrar
        </Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          Busque por placa para localizar registros rapidamente antes de editar
          ou excluir.
        </Text>

        <View className="mt-4 gap-3">
          <Input>
            <InputField
              autoCapitalize="characters"
              onChangeText={setSearchInput}
              onSubmitEditing={onSearch}
              placeholder="Buscar por placa"
              returnKeyType="search"
              value={searchInput}
            />
          </Input>

          <View className="flex-row gap-3">
            <Button
              className="flex-1 rounded-2xl bg-tertiary-500"
              onPress={onSearch}
            >
              <LucideIcon color="#FFFFFF" icon={Search} size={16} />
              <ButtonText className="text-typography-0">Buscar</ButtonText>
            </Button>

            <Button
              variant="outline"
              className="flex-1 rounded-2xl"
              onPress={onClearSearch}
            >
              <LucideIcon color="#475569" icon={X} size={16} />
              <ButtonText>Limpar</ButtonText>
            </Button>
          </View>

          {appliedSearch ? (
            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-tertiary-700">
              Filtro ativo: {appliedSearch}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <Text className="text-lg font-semibold text-typography-950">
          Cadastrar ou editar
        </Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          O formulario agora abre em modal para deixar a navegacao mais leve no
          celular e focar a acao em um fluxo por vez.
        </Text>

        <View className="mt-4 flex-row gap-3">
          <Button
            className="flex-1 rounded-2xl bg-tertiary-500"
            onPress={onOpenCreateModal}
          >
            <LucideIcon color="#FFFFFF" icon={Plus} size={16} />
            <ButtonText className="text-typography-0">Novo onibus</ButtonText>
          </Button>

          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={isLoadingBuses}
            onPress={onRefresh}
          >
            <LucideIcon color="#475569" icon={RefreshCw} size={16} />
            <ButtonText>Atualizar lista</ButtonText>
          </Button>
        </View>
      </View>

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <Text className="text-lg font-semibold text-typography-950">
          Lista de onibus
        </Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          Aqui ficam os registros retornados pela API para a empresa logada.
        </Text>

        {isLoadingBuses ? (
          <View className="mt-4 rounded-[24px] bg-amber-50 px-4 py-4">
            <View className="flex-row items-center gap-3">
              <LucideIcon color="#b45309" icon={RefreshCw} size={16} />
              <Text className="text-sm font-semibold text-amber-800">
                Carregando onibus cadastrados...
              </Text>
            </View>
          </View>
        ) : buses.length > 0 ? (
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
            className="mt-4"
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            style={{ maxHeight: RESULTS_VIEWPORT_HEIGHT }}
          >
            {buses.map((bus) => (
              <View
                key={bus.id}
                className="rounded-[28px] bg-background-0 px-4 py-4"
              >
                <View className="flex-row items-start gap-4">
                  <View className="rounded-2xl bg-tertiary-50 p-3">
                    <LucideIcon color="#b45309" icon={BusFront} size={18} />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-typography-950">
                          {bus.plate}
                        </Text>
                        <Text className="mt-1 text-sm leading-6 text-typography-600">
                          {getCapacityLabel(bus.capacity)}
                        </Text>
                      </View>

                      {editingBusId === bus.id ? (
                        <View className="rounded-full bg-amber-100 px-3 py-2">
                          <Text className="text-xs font-semibold text-amber-800">
                            Em edicao
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                <View className="mt-4 rounded-2xl bg-background-50 px-4 py-3 items-center">
                  <Text className="text-center text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    Cadastro
                  </Text>
                  <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                    Criado em {formatBusDate(bus.createdAt)}
                  </Text>
                </View>

                <View className="mt-4 flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-2xl"
                    isDisabled={isSavingBus || deletingBusId === bus.id}
                    onPress={() => {
                      onEditBus(bus);
                    }}
                  >
                    <LucideIcon color="#FC7C3A" icon={Pencil} size={16} />
                    <ButtonText>Editar</ButtonText>
                  </Button>

                  <Button
                    variant="outline"
                    action="negative"
                    className="flex-1 rounded-2xl"
                    isDisabled={isSavingBus || deletingBusId === bus.id}
                    onPress={() => {
                      onDeleteBus(bus);
                    }}
                  >
                    <LucideIcon color="#dc2626" icon={Trash2} size={16} />
                    <ButtonText>Excluir</ButtonText>
                  </Button>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View className="mt-4 rounded-[24px] bg-background-0 px-4 py-5">
            <View className="flex-row items-start gap-3">
              <LucideIcon color="#475569" icon={BadgeInfo} size={18} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-typography-900">
                  Nenhum onibus encontrado
                </Text>
                <Text className="mt-2 text-sm leading-6 text-typography-600">
                  Verifique o filtro aplicado ou cadastre o primeiro onibus da
                  empresa nesta tela.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="mt-4 flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={page <= 1 || isLoadingBuses}
            onPress={() => {
              onPageChange(page - 1);
            }}
          >
            <ButtonText>Pagina anterior</ButtonText>
          </Button>

          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={page >= lastPage || isLoadingBuses}
            onPress={() => {
              onPageChange(page + 1);
            }}
          >
            <ButtonText>Proxima pagina</ButtonText>
          </Button>
        </View>
      </View>

      <BusFormModal
        capacityError={formErrors.capacity}
        capacityInput={capacityInput}
        formErrorMessage={formErrorMessage}
        isEditing={Boolean(editingBusId)}
        isOpen={isModalOpen}
        isSaving={isSavingBus}
        onCapacityChange={onCapacityChange}
        onClose={onCloseModal}
        onPlateChange={onPlateChange}
        onSubmit={onSubmit}
        plateError={formErrors.plate}
        plateInput={plateInput}
      />
    </View>
  );
}
