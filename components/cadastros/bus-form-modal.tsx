import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { BusFront, Save, X } from "lucide";
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

export function BusFormModal({
  capacityError,
  capacityInput,
  formErrorMessage,
  isOpen,
  isSaving,
  isEditing,
  onCapacityChange,
  onClose,
  onPlateChange,
  onSubmit,
  plateError,
  plateInput,
}: {
  capacityError?: string;
  capacityInput: string;
  formErrorMessage?: string;
  isEditing: boolean;
  isOpen: boolean;
  isSaving: boolean;
  onCapacityChange: (value: string) => void;
  onClose: () => void;
  onPlateChange: (value: string) => void;
  onSubmit: () => void;
  plateError?: string;
  plateInput: string;
}) {
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

          <View className="max-h-[85%] rounded-t-[32px] bg-background-0 px-5 pb-8 pt-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-row items-start gap-3">
                <View className="rounded-2xl bg-tertiary-50 p-3">
                  <LucideIcon color="#FC7C3A" icon={BusFront} size={18} />
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    Cadastro de onibus
                  </Text>
                  <Text className="mt-2 text-2xl font-bold text-typography-950">
                    {isEditing ? "Editar onibus" : "Novo onibus"}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-typography-600">
                    Preencha todos os campos e use o formato Mercosul, por exemplo
                    ABC1D23.
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

                <View>
                  <Text className="mb-2 text-sm font-semibold text-typography-800">
                    Placa
                  </Text>
                  <Input
                    className={plateError ? "border-error-400 bg-background-error" : undefined}
                  >
                    <InputField
                      autoCapitalize="characters"
                      maxLength={7}
                      onChangeText={onPlateChange}
                      placeholder="ABC1D23"
                      value={plateInput}
                    />
                  </Input>
                  {plateError ? (
                    <Text className="mt-2 text-sm font-medium text-error-700">
                      {plateError}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <Text className="mb-2 text-sm font-semibold text-typography-800">
                    Capacidade
                  </Text>
                  <Input
                    className={capacityError ? "border-error-400 bg-background-error" : undefined}
                  >
                    <InputField
                      keyboardType="number-pad"
                      onChangeText={onCapacityChange}
                      placeholder="Ex.: 44"
                      value={capacityInput}
                    />
                  </Input>
                  {capacityError ? (
                    <Text className="mt-2 text-sm font-medium text-error-700">
                      {capacityError}
                    </Text>
                  ) : null}
                </View>

                <View className="rounded-[24px] bg-background-50 px-4 py-4">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    Regras
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-typography-600">
                    A placa deve seguir o padrao Mercosul sem espacos.
                  </Text>
                  <Text className="mt-1 text-sm leading-6 text-typography-600">
                    A capacidade precisa ser um numero inteiro maior que zero.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View className="mt-5 flex-row gap-3">
              <Button
                className="flex-1 rounded-2xl bg-tertiary-500"
                isDisabled={isSaving}
                onPress={onSubmit}
              >
                <LucideIcon color="#FFFFFF" icon={Save} size={16} />
                <ButtonText className="text-typography-0">
                  {isSaving ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar"}
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
