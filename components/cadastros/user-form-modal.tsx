import { useEffect, useMemo, useState } from "react";

import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import {
  Check,
  ChevronDown,
  GraduationCap,
  KeyRound,
  Search,
  ShieldUser,
  UserRound,
  X,
} from "lucide";
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
import type {
  ManagedUserRole,
  UserStudentCandidate,
} from "@/services/users";

const ROLE_OPTIONS: {
  description: string;
  label: string;
  role: ManagedUserRole;
}[] = [
  {
    description: "Acesso total ao hub de cadastros da empresa.",
    label: "Administrador",
    role: "ADMIN",
  },
  {
    description: "Precisa ser vinculado a um aluno ja cadastrado.",
    label: "Coordenador",
    role: "COORDINATOR",
  },
  {
    description: "Usa telas operacionais de transporte.",
    label: "Motorista",
    role: "DRIVER",
  },
  {
    description: "Usuario vinculado a um aluno ja cadastrado.",
    label: "Aluno",
    role: "USER",
  },
];

function roleRequiresStudentLink(role: ManagedUserRole) {
  return role === "USER" || role === "COORDINATOR";
}

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

function RoleOptionCard({
  description,
  label,
  onPress,
  selected,
}: {
  description: string;
  label: string;
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
            icon={ShieldUser}
            size={16}
          />
        </View>

        <View className="flex-1">
          <Text
            className="text-sm font-semibold"
            style={{ color: selected ? "#c2410c" : "#0f172a" }}
          >
            {label}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-typography-600">
            {description}
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

function StudentCandidateCard({
  candidate,
  onPress,
  selected,
}: {
  candidate: UserStudentCandidate;
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
            icon={GraduationCap}
            size={16}
          />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-typography-950">
            {candidate.name}
          </Text>
          <Text className="mt-1 text-sm leading-6 text-typography-600">
            Matricula: {candidate.registration}
          </Text>
          <Text className="mt-1 text-sm leading-6 text-typography-600">
            Email: {candidate.email?.trim() ? candidate.email : "Nao informado"}
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

export function UserFormModal({
  companyEmailDomain,
  emailError,
  emailInput,
  formErrorMessage,
  isActiveInput,
  isEditing,
  isLoadingStudentCandidates,
  isOpen,
  isSaving,
  isStudentLinkLocked,
  nameError,
  nameInput,
  onActiveChange,
  onClose,
  onEmailChange,
  onNameChange,
  onPasswordChange,
  onRoleChange,
  onStudentChange,
  onSubmit,
  passwordError,
  passwordInput,
  roleInput,
  selectedStudentId,
  studentCandidates,
  studentIdError,
}: {
  companyEmailDomain?: string | null;
  emailError?: string;
  emailInput: string;
  formErrorMessage?: string;
  isActiveInput: boolean;
  isEditing: boolean;
  isLoadingStudentCandidates: boolean;
  isOpen: boolean;
  isSaving: boolean;
  isStudentLinkLocked: boolean;
  nameError?: string;
  nameInput: string;
  onActiveChange: (value: boolean) => void;
  onClose: () => void;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRoleChange: (value: ManagedUserRole) => void;
  onStudentChange: (value: string) => void;
  onSubmit: () => void;
  passwordError?: string;
  passwordInput: string;
  roleInput: ManagedUserRole;
  selectedStudentId: string;
  studentCandidates: UserStudentCandidate[];
  studentIdError?: string;
}) {
  const [isRoleComboboxOpen, setIsRoleComboboxOpen] = useState(false);
  const [studentSearchInput, setStudentSearchInput] = useState("");
  const [isStudentComboboxOpen, setIsStudentComboboxOpen] = useState(false);

  const selectedRoleOption = useMemo(
    () => ROLE_OPTIONS.find((option) => option.role === roleInput) ?? ROLE_OPTIONS[0],
    [roleInput],
  );
  const needsStudentLink = roleRequiresStudentLink(roleInput);
  const selectedStudent = useMemo(
    () =>
      studentCandidates.find((candidate) => candidate.id === selectedStudentId) ?? null,
    [selectedStudentId, studentCandidates],
  );

  const normalizedStudentSearch = studentSearchInput.trim().toLowerCase();
  const filteredStudentCandidates = normalizedStudentSearch
    ? studentCandidates.filter((candidate) => {
        const haystack =
          `${candidate.name} ${candidate.registration} ${candidate.email ?? ""}`.toLowerCase();
        return haystack.includes(normalizedStudentSearch);
      })
    : studentCandidates;

  useEffect(() => {
    if (!isOpen) {
      setIsRoleComboboxOpen(false);
      setStudentSearchInput("");
      setIsStudentComboboxOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!needsStudentLink) {
      setStudentSearchInput("");
      setIsStudentComboboxOpen(false);
    }
  }, [needsStudentLink]);

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
                  <LucideIcon color="#FC7C3A" icon={ShieldUser} size={18} />
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    Cadastro de usuarios
                  </Text>
                  <Text className="mt-2 text-2xl font-bold text-typography-950">
                    {isEditing ? "Editar usuario" : "Novo usuario"}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-typography-600">
                    Se o perfil for USER ou COORDINATOR, primeiro cadastre o aluno e
                    depois vincule aqui. ADMIN e DRIVER podem ser criados direto neste
                    modal com email no dominio da empresa.
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
                    Perfil de acesso
                  </Text>

                  <Pressable
                    className="rounded-2xl border border-outline-200 bg-background-0 px-4 py-4"
                    disabled={isStudentLinkLocked}
                    onPress={() => {
                      setIsRoleComboboxOpen((current) => !current);
                      setIsStudentComboboxOpen(false);
                    }}
                    style={{
                      borderColor: isRoleComboboxOpen ? "#FC7C3A" : "#e2e8f0",
                      minHeight: 88,
                      opacity: isStudentLinkLocked ? 0.8 : 1,
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="rounded-2xl bg-background-50 p-3">
                        <LucideIcon color="#475569" icon={ShieldUser} size={16} />
                      </View>

                      <View className="flex-1">
                        <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                          Combobox de perfil
                        </Text>
                        <Text
                          className="mt-1 text-sm font-semibold text-typography-950"
                          numberOfLines={1}
                        >
                          {selectedRoleOption.label}
                        </Text>
                      </View>

                      <LucideIcon color="#64748b" icon={ChevronDown} size={18} />
                    </View>
                  </Pressable>

                  {isRoleComboboxOpen ? (
                    <View className="mt-3 gap-2 rounded-[24px] border border-outline-200 bg-background-0 px-4 py-4">
                      {ROLE_OPTIONS.map((option) => (
                        <RoleOptionCard
                          key={option.role}
                          description={option.description}
                          label={option.label}
                          onPress={() => {
                            onRoleChange(option.role);
                            setIsRoleComboboxOpen(false);
                          }}
                          selected={roleInput === option.role}
                        />
                      ))}
                    </View>
                  ) : null}

                  <Text className="mt-2 text-sm leading-6 text-typography-500">
                    {isStudentLinkLocked
                      ? "Este usuario ja esta vinculado a um aluno. Mantemos o perfil e o vinculo bloqueados na edicao para evitar inconsistencias."
                      : needsStudentLink
                        ? "Esse perfil exige aluno vinculado. Se ainda nao existir um aluno apto, cadastre o aluno primeiro."
                        : "Esse perfil pode ser criado direto aqui com nome, email da empresa e senha."}
                  </Text>
                </View>

                {needsStudentLink ? (
                  <View>
                    <Text className="mb-2 text-sm font-semibold text-typography-800">
                      Aluno vinculado
                    </Text>

                    {isLoadingStudentCandidates ? (
                      <View className="rounded-[24px] bg-amber-50 px-4 py-4">
                        <Text className="text-sm font-semibold text-amber-800">
                          Carregando alunos disponiveis...
                        </Text>
                      </View>
                    ) : studentCandidates.length > 0 ? (
                      <View className="gap-3">
                        <Pressable
                          className="rounded-2xl border border-outline-200 bg-background-0 px-4 py-4"
                          disabled={isStudentLinkLocked}
                          onPress={() => {
                            setIsStudentComboboxOpen((current) => !current);
                            setIsRoleComboboxOpen(false);
                          }}
                          style={{
                            backgroundColor: studentIdError ? "#fef2f2" : "#ffffff",
                            borderColor: studentIdError
                              ? "#f87171"
                              : isStudentComboboxOpen
                                ? "#FC7C3A"
                                : "#e2e8f0",
                          }}
                        >
                          <View className="flex-row items-center gap-3">
                            <View
                              className="rounded-2xl p-3"
                              style={{
                                backgroundColor: selectedStudent
                                  ? "rgba(252, 124, 58, 0.14)"
                                  : "#f8fafc",
                              }}
                            >
                              <LucideIcon
                                color={selectedStudent ? "#FC7C3A" : "#475569"}
                                icon={GraduationCap}
                                size={16}
                              />
                            </View>

                            <View className="flex-1">
                              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                                Combobox de alunos
                              </Text>
                              <Text
                                className="mt-1 text-sm font-semibold text-typography-950"
                                numberOfLines={1}
                              >
                                {selectedStudent
                                  ? `${selectedStudent.name} - ${selectedStudent.registration}`
                                  : "Selecione um aluno"}
                              </Text>
                            </View>

                            <LucideIcon color="#64748b" icon={ChevronDown} size={18} />
                          </View>
                        </Pressable>

                        {isStudentComboboxOpen && !isStudentLinkLocked ? (
                          <View className="rounded-[24px] border border-outline-200 bg-background-0 px-4 py-4">
                            <Input>
                              <LucideIcon color="#64748b" icon={Search} size={16} />
                              <InputField
                                onChangeText={setStudentSearchInput}
                                placeholder="Buscar aluno por nome, matricula ou email"
                                returnKeyType="search"
                                value={studentSearchInput}
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
                              {filteredStudentCandidates.length > 0 ? (
                                filteredStudentCandidates.map((candidate) => (
                                  <StudentCandidateCard
                                    key={candidate.id}
                                    candidate={candidate}
                                    onPress={() => {
                                      onStudentChange(candidate.id);
                                      setStudentSearchInput("");
                                      setIsStudentComboboxOpen(false);
                                    }}
                                    selected={selectedStudentId === candidate.id}
                                  />
                                ))
                              ) : (
                                <View className="rounded-[22px] bg-background-50 px-4 py-4">
                                  <Text className="text-sm font-semibold text-typography-900">
                                    Nenhum aluno encontrado
                                  </Text>
                                  <Text className="mt-2 text-sm leading-6 text-typography-600">
                                    Tente outra busca ou limpe o campo para ver todos os
                                    alunos elegiveis.
                                  </Text>
                                </View>
                              )}
                            </ScrollView>
                          </View>
                        ) : null}

                        {selectedStudent ? (
                          <View className="rounded-[24px] bg-background-50 px-4 py-4">
                            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                              Dados herdados do aluno
                            </Text>
                            <Text className="mt-2 text-sm leading-6 text-typography-600">
                              Nome: {selectedStudent.name}
                            </Text>
                            <Text className="mt-1 text-sm leading-6 text-typography-600">
                              Email: {selectedStudent.email?.trim() ? selectedStudent.email : "Nao informado"}
                            </Text>
                            <Text className="mt-1 text-sm leading-6 text-typography-600">
                              Matricula: {selectedStudent.registration}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : (
                      <View className="rounded-[24px] bg-background-50 px-4 py-4">
                        <Text className="text-sm font-semibold text-typography-900">
                          Nenhum aluno elegivel encontrado
                        </Text>
                        <Text className="mt-2 text-sm leading-6 text-typography-600">
                          Para criar USER ou COORDINATOR, primeiro cadastre um aluno
                          ativo, com email e sem usuario vinculado. Depois volte aqui
                          para concluir o vinculo.
                        </Text>
                      </View>
                    )}

                    {studentIdError ? (
                      <Text className="mt-2 text-sm font-medium text-error-700">
                        {studentIdError}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <>
                    <View>
                      <Text className="mb-2 text-sm font-semibold text-typography-800">
                        Nome
                      </Text>
                      <Input
                        className={nameError ? "border-error-400 bg-background-error" : undefined}
                      >
                        <InputField
                          autoCapitalize="words"
                          onChangeText={onNameChange}
                          placeholder="Ex.: Maria Oliveira"
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
                          O email precisa usar o dominio da empresa.
                        </Text>
                      )}
                    </View>
                  </>
                )}

                <View>
                  <Text className="mb-2 text-sm font-semibold text-typography-800">
                    Senha
                  </Text>
                  <Input
                    className={passwordError ? "border-error-400 bg-background-error" : undefined}
                  >
                    <InputField
                      onChangeText={onPasswordChange}
                      placeholder={isEditing ? "Deixe em branco para manter a atual" : "Defina a senha inicial"}
                      returnKeyType="done"
                      secureTextEntry
                      value={passwordInput}
                    />
                  </Input>
                  {passwordError ? (
                    <Text className="mt-2 text-sm font-medium text-error-700">
                      {passwordError}
                    </Text>
                  ) : (
                    <View className="mt-2 flex-row items-start gap-2">
                      <LucideIcon color="#64748b" icon={KeyRound} size={16} />
                      <Text className="flex-1 text-sm leading-6 text-typography-500">
                        {isEditing
                          ? "Preencha apenas se quiser trocar a senha deste usuario."
                          : "Senha obrigatoria no cadastro inicial."}
                      </Text>
                    </View>
                  )}
                </View>

                {isEditing ? (
                  <View>
                    <Text className="mb-2 text-sm font-semibold text-typography-800">
                      Status do usuario
                    </Text>
                    <View className="flex-row gap-3">
                      <StatusOption
                        active={isActiveInput}
                        description="Permanece com acesso ao app conforme o perfil."
                        label="Ativo"
                        onPress={() => {
                          onActiveChange(true);
                        }}
                      />
                      <StatusOption
                        active={!isActiveInput}
                        description="Perde o acesso ate ser reativado na edicao."
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
                      Todo usuario novo entra ativo. Se precisar bloquear o acesso
                      depois, use a edicao ou a acao de desativar na lista.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="mt-5 flex-row gap-3">
              <Button
                className="flex-1 rounded-2xl bg-tertiary-500"
                isDisabled={isSaving}
                onPress={onSubmit}
              >
                <LucideIcon color="#FFFFFF" icon={UserRound} size={16} />
                <ButtonText className="text-typography-0">
                  {isSaving
                    ? "Salvando..."
                    : isEditing
                      ? "Salvar alteracoes"
                      : "Cadastrar usuario"}
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
