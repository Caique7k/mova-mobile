import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { GraduationCap, Save, X } from "lucide";
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

function StatusOption({
  active,
  description,
  label,
  onPress,
}: {
  active: boolean;
  description: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="flex-1 rounded-[22px] border px-4 py-4"
      onPress={onPress}
      style={{
        backgroundColor: active ? "#fff7ed" : "#ffffff",
        borderColor: active ? "#FC7C3A" : "#e2e8f0",
      }}
    >
      <Text
        className="text-sm font-semibold"
        style={{ color: active ? "#c2410c" : "#0f172a" }}
      >
        {label}
      </Text>
      <Text className="mt-2 text-sm leading-6 text-typography-600">
        {description}
      </Text>
    </Pressable>
  );
}

export function StudentFormModal({
  companyEmailDomain,
  emailError,
  emailInput,
  formErrorMessage,
  isActiveInput,
  isEditing,
  isOpen,
  isSaving,
  nameError,
  nameInput,
  onActiveChange,
  onClose,
  onEmailChange,
  onNameChange,
  onPhoneChange,
  onRegistrationChange,
  onSubmit,
  phoneError,
  phoneInput,
  registrationError,
  registrationInput,
}: {
  companyEmailDomain?: string | null;
  emailError?: string;
  emailInput: string;
  formErrorMessage?: string;
  isActiveInput: boolean;
  isEditing: boolean;
  isOpen: boolean;
  isSaving: boolean;
  nameError?: string;
  nameInput: string;
  onActiveChange: (value: boolean) => void;
  onClose: () => void;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onRegistrationChange: (value: string) => void;
  onSubmit: () => void;
  phoneError?: string;
  phoneInput: string;
  registrationError?: string;
  registrationInput: string;
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

          <View className="max-h-[88%] rounded-t-[32px] bg-background-0 px-5 pb-8 pt-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1 flex-row items-start gap-3">
                <View className="rounded-2xl bg-tertiary-50 p-3">
                  <LucideIcon color="#FC7C3A" icon={GraduationCap} size={18} />
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    Cadastro de alunos
                  </Text>
                  <Text className="mt-2 text-2xl font-bold text-typography-950">
                    {isEditing ? "Editar aluno" : "Novo aluno"}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-typography-600">
                    Preencha os dados basicos do aluno. A vinculacao do RFID
                    acontece na proxima etapa, em um modal separado.
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
                    Nome completo
                  </Text>
                  <Input
                    className={nameError ? "border-error-400 bg-background-error" : undefined}
                  >
                    <InputField
                      autoCapitalize="words"
                      onChangeText={onNameChange}
                      placeholder="Ex.: Ana Souza"
                      returnKeyType="next"
                      value={nameInput}
                    />
                  </Input>
                  {nameError ? (
                    <Text className="mt-2 text-sm font-medium text-error-700">
                      {nameError}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <Text className="mb-2 text-sm font-semibold text-typography-800">
                    Matricula
                  </Text>
                  <Input
                    className={registrationError ? "border-error-400 bg-background-error" : undefined}
                  >
                    <InputField
                      autoCapitalize="characters"
                      onChangeText={onRegistrationChange}
                      placeholder="Ex.: 20240018"
                      returnKeyType="next"
                      value={registrationInput}
                    />
                  </Input>
                  {registrationError ? (
                    <Text className="mt-2 text-sm font-medium text-error-700">
                      {registrationError}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <Text className="mb-2 text-sm font-semibold text-typography-800">
                    Email
                  </Text>
                  <Input
                    className={emailError ? "border-error-400 bg-background-error" : undefined}
                  >
                    <InputField
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={onEmailChange}
                      placeholder={
                        companyEmailDomain
                          ? `usuario@${companyEmailDomain}`
                          : "usuario@empresa.com"
                      }
                      returnKeyType="next"
                      value={emailInput}
                    />
                  </Input>
                  {emailError ? (
                    <Text className="mt-2 text-sm font-medium text-error-700">
                      {emailError}
                    </Text>
                  ) : (
                    <Text className="mt-2 text-sm leading-6 text-typography-500">
                      {companyEmailDomain
                        ? `Voce pode informar o email completo ou apenas o usuario do dominio ${companyEmailDomain}.`
                        : "Campo opcional. O backend valida o dominio permitido para a empresa."}
                    </Text>
                  )}
                </View>

                <View>
                  <Text className="mb-2 text-sm font-semibold text-typography-800">
                    Telefone
                  </Text>
                  <Input
                    className={phoneError ? "border-error-400 bg-background-error" : undefined}
                  >
                    <InputField
                      keyboardType="phone-pad"
                      onChangeText={onPhoneChange}
                      placeholder="Ex.: (11) 99999-0000"
                      returnKeyType="next"
                      value={phoneInput}
                    />
                  </Input>
                  {phoneError ? (
                    <Text className="mt-2 text-sm font-medium text-error-700">
                      {phoneError}
                    </Text>
                  ) : null}
                </View>

                <View className="rounded-[24px] bg-background-50 px-4 py-4">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    Etapa seguinte
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-typography-600">
                    {isEditing
                      ? "Se precisar vincular uma nova tag, use o fluxo separado de RFID na lista do aluno."
                      : "Depois de salvar o aluno, abriremos um segundo modal para vincular a tag RFID manualmente ou, no futuro, via IoT."}
                  </Text>
                </View>

                {isEditing ? (
                  <View>
                    <Text className="mb-2 text-sm font-semibold text-typography-800">
                      Status
                    </Text>
                    <View className="flex-row gap-3">
                      <StatusOption
                        active={isActiveInput}
                        description="Aluno liberado para operacao e consultas."
                        label="Ativo"
                        onPress={() => {
                          onActiveChange(true);
                        }}
                      />
                      <StatusOption
                        active={!isActiveInput}
                        description="Aluno fica indisponivel sem precisar excluir o cadastro."
                        label="Inativo"
                        onPress={() => {
                          onActiveChange(false);
                        }}
                      />
                    </View>
                  </View>
                ) : (
                  <View className="rounded-[24px] bg-background-50 px-4 py-4">
                    <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                      Status inicial
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-typography-600">
                      Todo aluno novo entra como ativo. A troca para inativo ou a
                      reativacao acontece somente na edicao.
                    </Text>
                  </View>
                )}

                <View className="rounded-[24px] bg-background-50 px-4 py-4">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    Regras
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-typography-600">
                    Nome e matricula sao obrigatorios.
                  </Text>
                  <Text className="mt-1 text-sm leading-6 text-typography-600">
                    O email deve respeitar o dominio configurado para a empresa.
                  </Text>
                  <Text className="mt-1 text-sm leading-6 text-typography-600">
                    O RFID e tratado em uma etapa separada, apos salvar o aluno.
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
