import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { CreditCard, Save, X } from "lucide";
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

export function StudentRfidModal({
  formErrorMessage,
  isLinking,
  isOpen,
  onClose,
  onSubmit,
  onTagChange,
  studentName,
  tagError,
  tagInput,
}: {
  formErrorMessage?: string;
  isLinking: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onTagChange: (value: string) => void;
  studentName: string;
  tagError?: string;
  tagInput: string;
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

          <View className="max-h-[82%] rounded-t-[32px] bg-background-0 px-5 pb-8 pt-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1 flex-row items-start gap-3">
                <View className="rounded-2xl bg-tertiary-50 p-3">
                  <LucideIcon color="#FC7C3A" icon={CreditCard} size={18} />
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    Vinculo RFID
                  </Text>
                  <Text className="mt-2 text-2xl font-bold text-typography-950">
                    Vincular tag ao aluno
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-typography-600">
                    Aluno selecionado: {studentName}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel="Fechar modal"
                className="h-11 w-11 items-center justify-center rounded-2xl bg-background-50"
                disabled={isLinking}
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

                <View className="rounded-[24px] bg-background-50 px-4 py-4">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    Fluxo preparado para IoT
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-typography-600">
                    Quando o dispositivo estiver integrado, esta etapa vai poder
                    solicitar o modo de leitura automaticamente.
                  </Text>
                  <Text className="mt-1 text-sm leading-6 text-typography-600">
                    Por enquanto, digite a tag RFID manualmente para concluir o
                    vinculo.
                  </Text>
                </View>

                <View>
                  <Text className="mb-2 text-sm font-semibold text-typography-800">
                    Tag RFID
                  </Text>
                  <Input
                    className={tagError ? "border-error-400 bg-background-error" : undefined}
                  >
                    <InputField
                      autoCapitalize="characters"
                      onChangeText={onTagChange}
                      placeholder="Digite a tag manualmente"
                      returnKeyType="done"
                      value={tagInput}
                    />
                  </Input>
                  {tagError ? (
                    <Text className="mt-2 text-sm font-medium text-error-700">
                      {tagError}
                    </Text>
                  ) : (
                    <Text className="mt-2 text-sm leading-6 text-typography-500">
                      Assim que o IoT estiver disponivel, esta entrada manual
                      pode ser substituida pela leitura automatica.
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            <View className="mt-5 flex-row gap-3">
              <Button
                className="flex-1 rounded-2xl bg-tertiary-500"
                isDisabled={isLinking}
                onPress={onSubmit}
              >
                <LucideIcon color="#FFFFFF" icon={Save} size={16} />
                <ButtonText className="text-typography-0">
                  {isLinking ? "Vinculando..." : "Vincular tag"}
                </ButtonText>
              </Button>

              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                isDisabled={isLinking}
                onPress={onClose}
              >
                <LucideIcon color="#475569" icon={X} size={16} />
                <ButtonText>Depois</ButtonText>
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
