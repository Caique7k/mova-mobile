import { useEffect, useState } from "react";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { BusFront, Check, ChevronDown, Cpu, Save, Search, Wifi, X } from "lucide";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { FeedbackBanner } from "@/components/cadastros/ui";
import type { Bus } from "@/services/buses";

function formatCapacityLabel(value: number) {
  return value === 1 ? "1 lugar" : `${value} lugares`;
}

function BusOptionCard({
  bus,
  onPress,
  selected,
}: {
  bus: Bus;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      className="rounded-[22px] border px-4 py-4"
      onPress={onPress}
      style={{
        backgroundColor: selected ? "#fff7ed" : "#ffffff",
        borderColor: selected ? "#FC7C3A" : "#e2e8f0",
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="rounded-2xl p-3"
          style={{ backgroundColor: selected ? "rgba(252, 124, 58, 0.14)" : "#f8fafc" }}
        >
          <LucideIcon
            color={selected ? "#FC7C3A" : "#475569"}
            icon={BusFront}
            size={16}
          />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-typography-950">{bus.plate}</Text>
          <Text className="mt-1 text-sm leading-6 text-typography-600">
            {formatCapacityLabel(bus.capacity)}
          </Text>
        </View>

        {selected ? (
          <View className="rounded-full bg-amber-100 p-2">
            <LucideIcon color="#c2410c" icon={Check} size={14} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function DeviceFormModal({
  busIdError,
  busOptions,
  deviceCode,
  deviceHardwareId,
  deviceNameInput,
  devicePairingCodeInput,
  formErrorMessage,
  isEditing,
  isLoadingBusOptions,
  isOpen,
  isSaving,
  nameError,
  onBusChange,
  onClose,
  onNameChange,
  onPairingCodeChange,
  onSubmit,
  pairingCodeError,
  selectedBusId,
}: {
  busIdError?: string;
  busOptions: Bus[];
  deviceCode?: string | null;
  deviceHardwareId?: string | null;
  deviceNameInput: string;
  devicePairingCodeInput: string;
  formErrorMessage?: string;
  isEditing: boolean;
  isLoadingBusOptions: boolean;
  isOpen: boolean;
  isSaving: boolean;
  nameError?: string;
  onBusChange: (busId: string) => void;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onPairingCodeChange: (value: string) => void;
  onSubmit: () => void;
  pairingCodeError?: string;
  selectedBusId: string;
}) {
  const [busSearchInput, setBusSearchInput] = useState("");
  const [isBusComboboxOpen, setIsBusComboboxOpen] = useState(false);
  const selectedBus = busOptions.find((bus) => bus.id === selectedBusId) ?? null;
  const normalizedBusSearch = busSearchInput.trim().toLowerCase();
  const filteredBusOptions = normalizedBusSearch
    ? busOptions.filter((bus) => {
        const haystack = `${bus.plate} ${bus.capacity}`.toLowerCase();
        return haystack.includes(normalizedBusSearch);
      })
    : busOptions;

  useEffect(() => {
    if (!isOpen) {
      setBusSearchInput("");
      setIsBusComboboxOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (busOptions.length === 0) {
      setIsBusComboboxOpen(false);
    }
  }, [busOptions.length]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={isOpen}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.42)" }}
        >
          <Pressable className="flex-1" onPress={onClose} />

          <View className="max-h-[88%] rounded-t-[32px] bg-background-0 px-5 pb-8 pt-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1 flex-row items-start gap-3">
                <View className="rounded-2xl bg-tertiary-50 p-3">
                  <LucideIcon color="#FC7C3A" icon={Cpu} size={18} />
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    UniHub
                  </Text>
                  <Text className="mt-2 text-2xl font-bold text-typography-950">
                    {isEditing ? "Editar device" : "Vincular device"}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-typography-600">
                    {isEditing
                      ? "Ajuste o nome exibido e altere o onibus vinculado sempre que necessario."
                      : "Informe o codigo temporario gerado no IoT e escolha o onibus para concluir o vinculo inicial."}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel="Fechar modal"
                className="h-11 w-11 items-center justify-center rounded-2xl bg-background-50"
                disabled={isSaving}
                onPress={onClose}
              >
                <LucideIcon color="#475569" icon={X} size={18} />
              </Pressable>
            </View>

            <ScrollView
              className="mt-5"
              contentContainerStyle={{ paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-4">
                {formErrorMessage ? (
                  <FeedbackBanner message={formErrorMessage} tone="error" />
                ) : null}

                {isEditing ? (
                  <View className="rounded-[24px] bg-background-50 px-4 py-4">
                    <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                      Identificacao atual
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-typography-600">
                      Hardware ID: {deviceHardwareId?.trim() ? deviceHardwareId : "Nao informado"}
                    </Text>
                    <Text className="mt-1 text-sm leading-6 text-typography-600">
                      Codigo: {deviceCode?.trim() ? deviceCode : "Nao gerado"}
                    </Text>
                  </View>
                ) : (
                  <View className="rounded-[24px] bg-background-50 px-4 py-4">
                    <View className="flex-row items-start gap-3">
                      <LucideIcon color="#0369a1" icon={Wifi} size={18} />
                      <View className="flex-1">
                        <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                          Fluxo de pairing
                        </Text>
                        <Text className="mt-2 text-sm leading-6 text-typography-600">
                          O dispositivo precisa estar em modo de pairing para gerar o codigo temporario.
                        </Text>
                        <Text className="mt-1 text-sm leading-6 text-typography-600">
                          Depois do vinculo, o nome inicial do device acompanha a placa do onibus e pode ser personalizado na edicao.
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {!isEditing ? (
                  <View>
                    <Text className="mb-2 text-sm font-semibold text-typography-800">
                      Codigo temporario do device
                    </Text>
                    <Input
                      className={
                        pairingCodeError ? "border-error-400 bg-background-error" : undefined
                      }
                    >
                      <InputField
                        autoCapitalize="characters"
                        onChangeText={onPairingCodeChange}
                        placeholder="Ex.: A1B2C3"
                        returnKeyType="next"
                        value={devicePairingCodeInput}
                      />
                    </Input>
                    {pairingCodeError ? (
                      <Text className="mt-2 text-sm font-medium text-error-700">
                        {pairingCodeError}
                      </Text>
                    ) : (
                      <Text className="mt-2 text-sm leading-6 text-typography-500">
                        Digite o codigo exibido pelo device quando ele entrar em modo de pairing.
                      </Text>
                    )}
                  </View>
                ) : (
                  <View>
                    <Text className="mb-2 text-sm font-semibold text-typography-800">
                      Nome exibido
                    </Text>
                    <Input
                      className={nameError ? "border-error-400 bg-background-error" : undefined}
                    >
                      <InputField
                        onChangeText={onNameChange}
                        placeholder="Ex.: UniHub Linha Escolar"
                        returnKeyType="done"
                        value={deviceNameInput}
                      />
                    </Input>
                    {nameError ? (
                      <Text className="mt-2 text-sm font-medium text-error-700">
                        {nameError}
                      </Text>
                    ) : (
                      <Text className="mt-2 text-sm leading-6 text-typography-500">
                        Se voce deixar um nome igual a placa, o device segue a identificacao padrao do onibus.
                      </Text>
                    )}
                  </View>
                )}

                <View>
                  <Text className="mb-2 text-sm font-semibold text-typography-800">
                    Onibus vinculado
                  </Text>

                  {isLoadingBusOptions ? (
                    <View className="rounded-[24px] bg-amber-50 px-4 py-4">
                      <Text className="text-sm font-semibold text-amber-800">
                        Carregando onibus disponiveis...
                      </Text>
                    </View>
                  ) : busOptions.length > 0 ? (
                    <View className="gap-3">
                      <Pressable
                        className="rounded-2xl border border-outline-200 bg-background-0 px-4 py-4"
                        onPress={() => {
                          setIsBusComboboxOpen((current) => !current);
                        }}
                        style={{
                          backgroundColor: busIdError ? "#fef2f2" : "#ffffff",
                          borderColor: busIdError
                            ? "#f87171"
                            : isBusComboboxOpen
                              ? "#FC7C3A"
                              : "#e2e8f0",
                        }}
                      >
                        <View className="flex-row items-center gap-3">
                          <View
                            className="rounded-2xl p-3"
                            style={{
                              backgroundColor: selectedBus
                                ? "rgba(252, 124, 58, 0.14)"
                                : "#f8fafc",
                            }}
                          >
                            <LucideIcon
                              color={selectedBus ? "#FC7C3A" : "#475569"}
                              icon={BusFront}
                              size={16}
                            />
                          </View>

                          <View className="flex-1">
                            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                              Combobox de onibus
                            </Text>
                            <Text className="mt-1 text-sm font-semibold text-typography-950">
                              {selectedBus
                                ? `${selectedBus.plate} • ${formatCapacityLabel(selectedBus.capacity)}`
                                : "Selecione um onibus"}
                            </Text>
                          </View>

                          <LucideIcon color="#64748b" icon={ChevronDown} size={18} />
                        </View>
                      </Pressable>

                      {isBusComboboxOpen ? (
                        <View className="rounded-[24px] border border-outline-200 bg-background-0 px-4 py-4">
                          <Input>
                            <LucideIcon color="#64748b" icon={Search} size={16} />
                            <InputField
                              autoCapitalize="characters"
                              onChangeText={setBusSearchInput}
                              placeholder="Buscar onibus por placa"
                              returnKeyType="search"
                              value={busSearchInput}
                            />
                          </Input>

                          <ScrollView
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator
                            className="mt-3"
                            contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                            style={{ maxHeight: 240 }}
                          >
                            {filteredBusOptions.length > 0 ? (
                              filteredBusOptions.map((bus) => (
                                <BusOptionCard
                                  key={bus.id}
                                  bus={bus}
                                  onPress={() => {
                                    onBusChange(bus.id);
                                    setBusSearchInput("");
                                    setIsBusComboboxOpen(false);
                                  }}
                                  selected={selectedBusId === bus.id}
                                />
                              ))
                            ) : (
                              <View className="rounded-[22px] bg-background-50 px-4 py-4">
                                <Text className="text-sm font-semibold text-typography-900">
                                  Nenhum onibus encontrado
                                </Text>
                                <Text className="mt-2 text-sm leading-6 text-typography-600">
                                  Tente outra placa ou limpe a busca para ver todos os onibus.
                                </Text>
                              </View>
                            )}
                          </ScrollView>
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <View className="rounded-[24px] bg-background-50 px-4 py-4">
                      <Text className="text-sm font-semibold text-typography-900">
                        Nenhum onibus disponivel
                      </Text>
                      <Text className="mt-2 text-sm leading-6 text-typography-600">
                        Cadastre um onibus primeiro para conseguir vincular ou mover um device.
                      </Text>
                    </View>
                  )}

                  {busIdError ? (
                    <Text className="mt-2 text-sm font-medium text-error-700">
                      {busIdError}
                    </Text>
                  ) : null}
                </View>
              </View>
            </ScrollView>

            <View className="mt-5 flex-row gap-3">
              <Button
                className="flex-1 rounded-2xl bg-tertiary-500"
                isDisabled={isSaving || isLoadingBusOptions || busOptions.length === 0}
                onPress={onSubmit}
              >
                <LucideIcon color="#FFFFFF" icon={Save} size={16} />
                <ButtonText className="text-typography-0">
                  {isSaving
                    ? "Salvando..."
                    : isEditing
                      ? "Salvar alteracoes"
                      : "Vincular device"}
                </ButtonText>
              </Button>

              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                isDisabled={isSaving}
                onPress={onClose}
              >
                <LucideIcon color="#475569" icon={X} size={16} />
                <ButtonText>Cancelar</ButtonText>
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
