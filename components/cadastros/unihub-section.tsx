import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import {
  BadgeInfo,
  Cpu,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide";
import { Pressable, ScrollView, Text, View } from "react-native";

import { DeviceFormModal } from "@/components/cadastros/device-form-modal";
import { FeedbackBanner } from "@/components/cadastros/ui";
import type { Bus } from "@/services/buses";
import type { Device, DeviceStatusFilter } from "@/services/devices";

function formatDate(value?: string | null, withTime = false) {
  if (!value) {
    return "Data nao informada";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data nao informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
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

function getDeviceTitle(device: Device) {
  if (device.name?.trim()) {
    return device.name;
  }

  if (device.bus?.plate?.trim()) {
    return device.bus.plate;
  }

  if (device.code?.trim()) {
    return device.code;
  }

  return "Device sem nome";
}

function getLifecycleStyles(device: Device) {
  if (!device.active) {
    return {
      backgroundColor: "#fef2f2",
      color: "#b91c1c",
      label: "Inativo",
    };
  }

  if (device.pairedAt) {
    return {
      backgroundColor: "#ecfdf5",
      color: "#047857",
      label: "Pareado",
    };
  }

  if (device.companyId && device.code && device.secret) {
    return {
      backgroundColor: "#dcfce7",
      color: "#166534",
      label: "Vinculado",
    };
  }

  if (device.pairingCode && device.pairingCodeExpiresAt) {
    return {
      backgroundColor: "#eff6ff",
      color: "#1d4ed8",
      label: "Pairing pendente",
    };
  }

  return {
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    label: "Pendente",
  };
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="rounded-full border px-4 py-2"
      onPress={onPress}
      style={{
        backgroundColor: active ? "#fff7ed" : "#ffffff",
        borderColor: active ? "#FC7C3A" : "#e2e8f0",
      }}
    >
      <Text
        className="text-xs font-semibold uppercase tracking-[1.2px]"
        style={{ color: active ? "#c2410c" : "#475569" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const RESULTS_VIEWPORT_HEIGHT = 620;

export function UniHubSection({
  appliedSearch,
  busOptions,
  currentFilter,
  deviceBusIdInput,
  deviceCodePreview,
  deviceFormMode,
  deviceHardwareIdPreview,
  deviceNameInput,
  devicePairingCodeInput,
  devices,
  editingDeviceId,
  feedbackMessage,
  feedbackTone,
  formErrorMessage,
  formErrors,
  isLoadingBusOptions,
  isLoadingDevices,
  isModalOpen,
  isSavingDevice,
  lastPage,
  onActiveFilterChange,
  onBusChange,
  onClearSearch,
  onCloseModal,
  onDeactivateDevice,
  onDeviceNameChange,
  onEditDevice,
  onOpenCreateModal,
  onPageChange,
  onPairingCodeChange,
  onRefresh,
  onSearch,
  onSubmit,
  page,
  searchInput,
  setSearchInput,
  totalDevices,
}: {
  appliedSearch: string;
  busOptions: Bus[];
  currentFilter: DeviceStatusFilter;
  deviceBusIdInput: string;
  deviceCodePreview?: string | null;
  deviceFormMode: "edit" | "link";
  deviceHardwareIdPreview?: string | null;
  deviceNameInput: string;
  devicePairingCodeInput: string;
  devices: Device[];
  editingDeviceId: string | null;
  feedbackMessage: string | null;
  feedbackTone: "error" | "success" | null;
  formErrorMessage?: string;
  formErrors: {
    busId?: string;
    name?: string;
    pairingCode?: string;
  };
  isLoadingBusOptions: boolean;
  isLoadingDevices: boolean;
  isModalOpen: boolean;
  isSavingDevice: boolean;
  lastPage: number;
  onActiveFilterChange: (value: DeviceStatusFilter) => void;
  onBusChange: (busId: string) => void;
  onClearSearch: () => void;
  onCloseModal: () => void;
  onDeactivateDevice: (device: Device) => void;
  onDeviceNameChange: (value: string) => void;
  onEditDevice: (device: Device) => void;
  onOpenCreateModal: () => void;
  onPageChange: (page: number) => void;
  onPairingCodeChange: (value: string) => void;
  onRefresh: () => void;
  onSearch: () => void;
  onSubmit: () => void;
  page: number;
  searchInput: string;
  setSearchInput: (value: string) => void;
  totalDevices: number | null;
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
          Busque por nome, codigo ou hardware ID e refine a lista por status do device.
        </Text>

        <View className="mt-4 gap-3">
          <Input>
            <InputField
              onChangeText={setSearchInput}
              onSubmitEditing={onSearch}
              placeholder="Buscar por nome, codigo ou hardware ID"
              returnKeyType="search"
              value={searchInput}
            />
          </Input>

          <View className="flex-row gap-3">
            <Button className="flex-1 rounded-2xl bg-tertiary-500" onPress={onSearch}>
              <LucideIcon color="#FFFFFF" icon={Search} size={16} />
              <ButtonText className="text-typography-0">Buscar</ButtonText>
            </Button>

            <Button variant="outline" className="flex-1 rounded-2xl" onPress={onClearSearch}>
              <LucideIcon color="#475569" icon={X} size={16} />
              <ButtonText>Limpar</ButtonText>
            </Button>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <FilterChip active={currentFilter === "all"} label="Todos" onPress={() => onActiveFilterChange("all")} />
            <FilterChip active={currentFilter === "active"} label="Ativos" onPress={() => onActiveFilterChange("active")} />
            <FilterChip active={currentFilter === "inactive"} label="Inativos" onPress={() => onActiveFilterChange("inactive")} />
          </View>

          {appliedSearch ? (
            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-tertiary-700">
              Filtro de busca: {appliedSearch}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <Text className="text-lg font-semibold text-typography-950">
          Vincular ou editar
        </Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          O cadastro do UniHub depende do codigo temporario gerado no IoT. Depois do vinculo, voce pode editar nome e trocar o onibus quando precisar.
        </Text>

        <View className="mt-4 flex-row gap-3">
          <Button className="flex-1 rounded-2xl bg-tertiary-500" onPress={onOpenCreateModal}>
            <LucideIcon color="#FFFFFF" icon={Plus} size={16} />
            <ButtonText className="text-typography-0">Vincular device</ButtonText>
          </Button>

          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={isLoadingDevices}
            onPress={onRefresh}
          >
            <LucideIcon color="#475569" icon={RefreshCw} size={16} />
            <ButtonText>Atualizar lista</ButtonText>
          </Button>
        </View>
      </View>

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <Text className="text-lg font-semibold text-typography-950">
          Lista de devices
        </Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          {totalDevices !== null
            ? `Total retornado pela API: ${formatCount(totalDevices)} registro(s).`
            : `Pagina ${page} de ${Math.max(lastPage, 1)} do inventario UniHub.`}
        </Text>

        {isLoadingDevices ? (
          <View className="mt-4 rounded-[24px] bg-amber-50 px-4 py-4">
            <View className="flex-row items-center gap-3">
              <LucideIcon color="#b45309" icon={RefreshCw} size={16} />
              <Text className="text-sm font-semibold text-amber-800">
                Carregando devices vinculados...
              </Text>
            </View>
          </View>
        ) : devices.length > 0 ? (
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
            className="mt-4"
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            style={{ maxHeight: RESULTS_VIEWPORT_HEIGHT }}
          >
            {devices.map((device) => {
              const lifecycle = getLifecycleStyles(device);

              return (
                <View key={device.id} className="rounded-[28px] bg-background-0 px-4 py-4">
                  <View className="flex-row items-start gap-4">
                    <View className="rounded-2xl bg-tertiary-50 p-3">
                      <LucideIcon color="#b45309" icon={Cpu} size={18} />
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-typography-950">
                            {getDeviceTitle(device)}
                          </Text>
                          <Text className="mt-1 text-sm leading-6 text-typography-600">
                            Onibus: {device.bus?.plate?.trim() ? device.bus.plate : "Nao vinculado"}
                          </Text>
                        </View>

                        <View className="items-end gap-2">
                          <View
                            className="rounded-full px-3 py-2"
                            style={{ backgroundColor: lifecycle.backgroundColor }}
                          >
                            <Text className="text-xs font-semibold" style={{ color: lifecycle.color }}>
                              {lifecycle.label}
                            </Text>
                          </View>

                          {editingDeviceId === device.id ? (
                            <View className="rounded-full bg-amber-100 px-3 py-2">
                              <Text className="text-xs font-semibold text-amber-800">
                                Em edicao
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="mt-4 flex-row flex-wrap gap-3">
                    <View
                      className="rounded-2xl bg-background-50 px-4 py-3 items-center"
                      style={{ flexBasis: "48%", flexGrow: 1 }}
                    >
                      <Text className="text-center text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                        Identificacao
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        Hardware: {device.hardwareId}
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        Codigo: {device.code?.trim() ? device.code : "Nao gerado"}
                      </Text>
                    </View>

                    <View
                      className="rounded-2xl bg-background-50 px-4 py-3 items-center"
                      style={{ flexBasis: "48%", flexGrow: 1 }}
                    >
                      <Text className="text-center text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                        Vinculo
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        Onibus: {device.bus?.plate?.trim() ? device.bus.plate : "Nao vinculado"}
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        {device.bus?.capacity ? getCapacityLabel(device.bus.capacity) : "Capacidade nao informada"}
                      </Text>
                    </View>

                    <View className="w-full rounded-2xl bg-background-50 px-4 py-3 items-center">
                      <Text className="text-center text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                        Atividade
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        Criado em {formatDate(device.createdAt)}
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        Pareado em {device.pairedAt ? formatDate(device.pairedAt, true) : "Aguardando claim do IoT"}
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        Ultima leitura: {device.lastUpdate ? formatDate(device.lastUpdate, true) : "Sem telemetria ainda"}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row flex-wrap gap-3">
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      isDisabled={isSavingDevice}
                      onPress={() => {
                        onEditDevice(device);
                      }}
                    >
                      <LucideIcon color="#FC7C3A" icon={Pencil} size={16} />
                      <ButtonText>Editar</ButtonText>
                    </Button>

                    {device.active ? (
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        isDisabled={isSavingDevice}
                        onPress={() => {
                          onDeactivateDevice(device);
                        }}
                      >
                        <LucideIcon color="#0f766e" icon={Trash2} size={16} />
                        <ButtonText>Desativar</ButtonText>
                      </Button>
                    ) : (
                      <View className="rounded-2xl border border-outline-200 px-4 py-3">
                        <Text className="text-sm font-medium text-typography-500">
                          Device desativado
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View className="mt-4 rounded-[24px] bg-background-0 px-4 py-5">
            <View className="flex-row items-start gap-3">
              <LucideIcon color="#475569" icon={BadgeInfo} size={18} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-typography-900">
                  Nenhum device encontrado
                </Text>
                <Text className="mt-2 text-sm leading-6 text-typography-600">
                  Solicite o pairing no IoT, use o codigo temporario e vincule o primeiro device da empresa por aqui.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="mt-4 flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={page <= 1 || isLoadingDevices}
            onPress={() => {
              onPageChange(page - 1);
            }}
          >
            <ButtonText>Pagina anterior</ButtonText>
          </Button>

          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={page >= lastPage || isLoadingDevices}
            onPress={() => {
              onPageChange(page + 1);
            }}
          >
            <ButtonText>Proxima pagina</ButtonText>
          </Button>
        </View>
      </View>

      <DeviceFormModal
        busIdError={formErrors.busId}
        busOptions={busOptions}
        deviceCode={deviceCodePreview}
        deviceHardwareId={deviceHardwareIdPreview}
        deviceNameInput={deviceNameInput}
        devicePairingCodeInput={devicePairingCodeInput}
        formErrorMessage={formErrorMessage}
        isEditing={deviceFormMode === "edit"}
        isLoadingBusOptions={isLoadingBusOptions}
        isOpen={isModalOpen}
        isSaving={isSavingDevice}
        nameError={formErrors.name}
        onBusChange={onBusChange}
        onClose={onCloseModal}
        onNameChange={onDeviceNameChange}
        onPairingCodeChange={onPairingCodeChange}
        onSubmit={onSubmit}
        pairingCodeError={formErrors.pairingCode}
        selectedBusId={deviceBusIdInput}
      />
    </View>
  );
}
