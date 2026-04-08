import { useState } from "react";

import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import {
  BadgeInfo,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldUser,
  X,
} from "lucide";
import { Pressable, ScrollView, Text, View } from "react-native";

import { UserFormModal } from "@/components/cadastros/user-form-modal";
import { FeedbackBanner } from "@/components/cadastros/ui";
import type { ManagedUserRole, UserRecord, UserRoleFilter, UserStatusFilter, UserStudentCandidate } from "@/services/users";

function formatDate(value?: string) {
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

function getRoleLabel(role: ManagedUserRole) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "COORDINATOR":
      return "Coordenador";
    case "DRIVER":
      return "Motorista";
    case "USER":
      return "Aluno";
    default:
      return role;
  }
}

function getStatusFilterLabel(filter: UserStatusFilter) {
  if (filter === "active") {
    return "Somente ativos";
  }

  if (filter === "inactive") {
    return "Somente inativos";
  }

  return "Todos os status";
}

function getRoleFilterLabel(filter: UserRoleFilter) {
  if (filter === "all") {
    return "Todos os perfis";
  }

  return getRoleLabel(filter);
}

function FilterOptionCard({
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
      className="rounded-2xl border px-4 py-3"
      onPress={onPress}
      style={{
        backgroundColor: active ? "#fff7ed" : "#ffffff",
        borderColor: active ? "#FC7C3A" : "#e2e8f0",
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className="flex-1 text-xs font-semibold uppercase tracking-[1.2px]"
          numberOfLines={1}
          style={{ color: active ? "#c2410c" : "#475569" }}
        >
          {label}
        </Text>

        <View
          className="h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: active ? "#ffedd5" : "transparent" }}
        >
          {active ? <LucideIcon color="#c2410c" icon={Check} size={14} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const RESULTS_VIEWPORT_HEIGHT = 620;

export function UsersSection({
  appliedSearch,
  companyEmailDomain,
  currentRoleFilter,
  currentStatusFilter,
  editingUserId,
  feedbackMessage,
  feedbackTone,
  formErrorMessage,
  formErrors,
  isStudentLinkLocked,
  isLoadingStudentCandidates,
  isLoadingUsers,
  isModalOpen,
  isSavingUser,
  lastPage,
  onActiveInputChange,
  onCloseModal,
  onDeactivateUser,
  onEmailChange,
  onNameChange,
  onOpenCreateModal,
  onPageChange,
  onPasswordChange,
  onRefresh,
  onRoleFilterChange,
  onRoleInputChange,
  onSearch,
  onStatusFilterChange,
  onStudentChange,
  onSubmit,
  onUserEdit,
  page,
  searchInput,
  setSearchInput,
  selectedStudentId,
  studentCandidates,
  totalUsers,
  userActiveInput,
  userEmailInput,
  userNameInput,
  userPasswordInput,
  userRoleInput,
  users,
}: {
  appliedSearch: string;
  companyEmailDomain?: string | null;
  currentRoleFilter: UserRoleFilter;
  currentStatusFilter: UserStatusFilter;
  editingUserId: string | null;
  feedbackMessage: string | null;
  feedbackTone: "error" | "success" | null;
  formErrorMessage?: string;
  formErrors: {
    email?: string;
    name?: string;
    password?: string;
    studentId?: string;
  };
  isStudentLinkLocked: boolean;
  isLoadingStudentCandidates: boolean;
  isLoadingUsers: boolean;
  isModalOpen: boolean;
  isSavingUser: boolean;
  lastPage: number;
  onActiveInputChange: (value: boolean) => void;
  onCloseModal: () => void;
  onDeactivateUser: (user: UserRecord) => void;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onPageChange: (page: number) => void;
  onPasswordChange: (value: string) => void;
  onRefresh: () => void;
  onRoleFilterChange: (value: UserRoleFilter) => void;
  onRoleInputChange: (value: ManagedUserRole) => void;
  onSearch: () => void;
  onStatusFilterChange: (value: UserStatusFilter) => void;
  onStudentChange: (value: string) => void;
  onSubmit: () => void;
  onUserEdit: (user: UserRecord) => void;
  page: number;
  searchInput: string;
  setSearchInput: (value: string) => void;
  selectedStudentId: string;
  studentCandidates: UserStudentCandidate[];
  totalUsers: number;
  userActiveInput: boolean;
  userEmailInput: string;
  userNameInput: string;
  userPasswordInput: string;
  userRoleInput: ManagedUserRole;
  users: UserRecord[];
}) {
  const [isStatusComboboxOpen, setIsStatusComboboxOpen] = useState(false);
  const [isRoleComboboxOpen, setIsRoleComboboxOpen] = useState(false);

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
          Busque por nome, email ou perfil e refine a lista por status e tipo de usuario.
        </Text>

        <View className="mt-4 gap-3">
          <Input>
            <InputField
              onChangeText={setSearchInput}
              onSubmitEditing={onSearch}
              placeholder="Buscar por nome, email ou perfil"
              returnKeyType="search"
              value={searchInput}
            />
          </Input>

          <View className="flex-row gap-3">
            <Button className="flex-1 rounded-2xl bg-tertiary-500" onPress={onSearch}>
              <LucideIcon color="#FFFFFF" icon={Search} size={16} />
              <ButtonText className="text-typography-0">Buscar</ButtonText>
            </Button>

            <Button variant="outline" className="flex-1 rounded-2xl" onPress={onRefresh}>
              <LucideIcon color="#475569" icon={RefreshCw} size={16} />
              <ButtonText>Atualizar</ButtonText>
            </Button>
          </View>

          <View className="gap-3">
            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
              Status
            </Text>
            <Pressable
              className="rounded-2xl border border-outline-200 bg-background-0 px-4 py-4"
              onPress={() => {
                setIsRoleComboboxOpen(false);
                setIsStatusComboboxOpen((current) => !current);
              }}
              style={{
                borderColor: isStatusComboboxOpen ? "#FC7C3A" : "#e2e8f0",
                minHeight: 82,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View className="rounded-2xl bg-background-50 p-3">
                  <LucideIcon color="#475569" icon={ShieldUser} size={16} />
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                    Combobox de status
                  </Text>
                  <Text className="mt-1 text-sm font-semibold text-typography-950">
                    {getStatusFilterLabel(currentStatusFilter)}
                  </Text>
                </View>

                <LucideIcon color="#64748b" icon={ChevronDown} size={18} />
              </View>
            </Pressable>

            {isStatusComboboxOpen ? (
              <View className="gap-2 rounded-[24px] border border-outline-200 bg-background-0 px-4 py-4">
                <FilterOptionCard
                  active={currentStatusFilter === "all"}
                  label="Todos os status"
                  onPress={() => {
                    setIsStatusComboboxOpen(false);
                    onStatusFilterChange("all");
                  }}
                />
                <FilterOptionCard
                  active={currentStatusFilter === "active"}
                  label="Somente ativos"
                  onPress={() => {
                    setIsStatusComboboxOpen(false);
                    onStatusFilterChange("active");
                  }}
                />
                <FilterOptionCard
                  active={currentStatusFilter === "inactive"}
                  label="Somente inativos"
                  onPress={() => {
                    setIsStatusComboboxOpen(false);
                    onStatusFilterChange("inactive");
                  }}
                />
              </View>
            ) : null}
          </View>

          <View className="gap-3">
            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
              Perfil
            </Text>
            <Pressable
              className="rounded-2xl border border-outline-200 bg-background-0 px-4 py-4"
              onPress={() => {
                setIsStatusComboboxOpen(false);
                setIsRoleComboboxOpen((current) => !current);
              }}
              style={{
                borderColor: isRoleComboboxOpen ? "#FC7C3A" : "#e2e8f0",
                minHeight: 82,
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
                    {getRoleFilterLabel(currentRoleFilter)}
                  </Text>
                </View>

                <LucideIcon color="#64748b" icon={ChevronDown} size={18} />
              </View>
            </Pressable>

            {isRoleComboboxOpen ? (
              <View className="gap-2 rounded-[24px] border border-outline-200 bg-background-0 px-4 py-4">
                <FilterOptionCard
                  active={currentRoleFilter === "all"}
                  label="Todos os perfis"
                  onPress={() => {
                    setIsRoleComboboxOpen(false);
                    onRoleFilterChange("all");
                  }}
                />
                <FilterOptionCard
                  active={currentRoleFilter === "ADMIN"}
                  label="Administrador"
                  onPress={() => {
                    setIsRoleComboboxOpen(false);
                    onRoleFilterChange("ADMIN");
                  }}
                />
                <FilterOptionCard
                  active={currentRoleFilter === "COORDINATOR"}
                  label="Coordenador"
                  onPress={() => {
                    setIsRoleComboboxOpen(false);
                    onRoleFilterChange("COORDINATOR");
                  }}
                />
                <FilterOptionCard
                  active={currentRoleFilter === "DRIVER"}
                  label="Motorista"
                  onPress={() => {
                    setIsRoleComboboxOpen(false);
                    onRoleFilterChange("DRIVER");
                  }}
                />
                <FilterOptionCard
                  active={currentRoleFilter === "USER"}
                  label="Aluno"
                  onPress={() => {
                    setIsRoleComboboxOpen(false);
                    onRoleFilterChange("USER");
                  }}
                />
              </View>
            ) : null}
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
          Cadastrar ou editar
        </Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          Se o perfil for USER ou COORDINATOR, primeiro cadastre o aluno com email e depois vincule esse aluno ao usuario. ADMIN e DRIVER podem ser criados direto no modal, sempre respeitando o dominio da empresa.
        </Text>

        <View className="mt-4 flex-row gap-3">
          <Button className="flex-1 rounded-2xl bg-tertiary-500" onPress={onOpenCreateModal}>
            <LucideIcon color="#FFFFFF" icon={Plus} size={16} />
            <ButtonText className="text-typography-0">Novo usuario</ButtonText>
          </Button>

          <Button variant="outline" className="flex-1 rounded-2xl" onPress={onRefresh}>
            <LucideIcon color="#475569" icon={RefreshCw} size={16} />
            <ButtonText>Atualizar lista</ButtonText>
          </Button>
        </View>
      </View>

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <Text className="text-lg font-semibold text-typography-950">
          Lista de usuarios
        </Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          Total retornado pela API: {formatCount(totalUsers)} registro(s).
        </Text>

        {isLoadingUsers ? (
          <View className="mt-4 rounded-[24px] bg-amber-50 px-4 py-4">
            <View className="flex-row items-center gap-3">
              <LucideIcon color="#b45309" icon={RefreshCw} size={16} />
              <Text className="text-sm font-semibold text-amber-800">
                Carregando usuarios cadastrados...
              </Text>
            </View>
          </View>
        ) : users.length > 0 ? (
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
            className="mt-4"
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            style={{ maxHeight: RESULTS_VIEWPORT_HEIGHT }}
          >
            {users.map((user) => (
              <View key={user.id} className="rounded-[28px] bg-background-0 px-4 py-4">
                <View className="flex-row items-start gap-4">
                  <View className="rounded-2xl bg-tertiary-50 p-3">
                    <LucideIcon color="#b45309" icon={ShieldUser} size={18} />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-typography-950">
                          {user.name}
                        </Text>
                        <Text className="mt-1 text-sm leading-6 text-typography-600">
                          {user.email}
                        </Text>
                      </View>

                      <View className="items-end gap-2">
                        <View
                          className="rounded-full px-3 py-2"
                          style={{
                            backgroundColor: user.active ? "#ecfdf5" : "#fef2f2",
                          }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: user.active ? "#047857" : "#b91c1c" }}
                          >
                            {user.active ? "Ativo" : "Inativo"}
                          </Text>
                        </View>

                        <View className="rounded-full bg-background-50 px-3 py-2">
                          <Text className="text-xs font-semibold text-typography-700">
                            {getRoleLabel(user.role)}
                          </Text>
                        </View>

                        {editingUserId === user.id ? (
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
                      Perfil
                    </Text>
                    <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                      {getRoleLabel(user.role)}
                    </Text>
                    <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                      Login: {user.email}
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
                      {user.student?.name?.trim() ? user.student.name : "Sem aluno vinculado"}
                    </Text>
                    <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                      {user.student?.registration
                        ? `Matricula: ${user.student.registration}`
                        : "Usuario administrativo"}
                    </Text>
                  </View>

                  <View className="w-full rounded-2xl bg-background-50 px-4 py-3 items-center">
                    <Text className="text-center text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                      Cadastro
                    </Text>
                    <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                      Criado em {formatDate(user.createdAt)}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    isDisabled={isSavingUser}
                    onPress={() => {
                      onUserEdit(user);
                    }}
                  >
                    <LucideIcon color="#FC7C3A" icon={Pencil} size={16} />
                    <ButtonText>Editar</ButtonText>
                  </Button>

                  {user.active ? (
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      isDisabled={isSavingUser}
                      onPress={() => {
                        onDeactivateUser(user);
                      }}
                    >
                      <LucideIcon color="#0f766e" icon={X} size={16} />
                      <ButtonText>Desativar</ButtonText>
                    </Button>
                  ) : null}
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
                  Nenhum usuario encontrado
                </Text>
                <Text className="mt-2 text-sm leading-6 text-typography-600">
                  Revise os filtros aplicados ou cadastre o primeiro usuario da empresa nesta tela. Para USER ou COORDINATOR, lembre de cadastrar o aluno antes.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="mt-4 flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={page <= 1 || isLoadingUsers}
            onPress={() => {
              onPageChange(page - 1);
            }}
          >
            <ButtonText>Pagina anterior</ButtonText>
          </Button>

          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={page >= lastPage || isLoadingUsers}
            onPress={() => {
              onPageChange(page + 1);
            }}
          >
            <ButtonText>Proxima pagina</ButtonText>
          </Button>
        </View>
      </View>

      <UserFormModal
        companyEmailDomain={companyEmailDomain}
        emailError={formErrors.email}
        emailInput={userEmailInput}
        formErrorMessage={formErrorMessage}
        isActiveInput={userActiveInput}
        isEditing={Boolean(editingUserId)}
        isLoadingStudentCandidates={isLoadingStudentCandidates}
        isOpen={isModalOpen}
        isSaving={isSavingUser}
        isStudentLinkLocked={isStudentLinkLocked}
        nameError={formErrors.name}
        nameInput={userNameInput}
        onActiveChange={onActiveInputChange}
        onClose={onCloseModal}
        onEmailChange={onEmailChange}
        onNameChange={onNameChange}
        onPasswordChange={onPasswordChange}
        onRoleChange={onRoleInputChange}
        onStudentChange={onStudentChange}
        onSubmit={onSubmit}
        passwordError={formErrors.password}
        passwordInput={userPasswordInput}
        roleInput={userRoleInput}
        selectedStudentId={selectedStudentId}
        studentCandidates={studentCandidates}
        studentIdError={formErrors.studentId}
      />
    </View>
  );
}
