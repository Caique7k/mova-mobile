import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import {
  BadgeInfo,
  CreditCard,
  GraduationCap,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide";
import { Pressable, ScrollView, Text, View } from "react-native";

import { StudentFormModal } from "@/components/cadastros/student-form-modal";
import { StudentRfidModal } from "@/components/cadastros/student-rfid-modal";
import { FeedbackBanner } from "@/components/cadastros/ui";
import type { Student, StudentStatusFilter } from "@/services/students";

function formatStudentDate(value?: string) {
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

function getStudentStatusLabel(active: boolean) {
  return active ? "Ativo" : "Inativo";
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

export function StudentsSection({
  appliedSearch,
  companyEmailDomain,
  currentFilter,
  deletingStudentId,
  deactivatingStudentId,
  editingStudentId,
  feedbackMessage,
  feedbackTone,
  formErrorMessage,
  formErrors,
  isLoadingStudents,
  isModalOpen,
  isRfidModalOpen,
  isLinkingRfid,
  isSavingStudent,
  lastPage,
  onActiveFilterChange,
  onActiveInputChange,
  onClearSearch,
  onCloseModal,
  onCloseRfidModal,
  onDeactivateStudent,
  onDeleteStudent,
  onEditStudent,
  onEmailChange,
  onNameChange,
  onOpenCreateModal,
  onOpenRfidModal,
  onPageChange,
  onPhoneChange,
  onRefresh,
  onRegistrationChange,
  onRfidInputChange,
  onSearch,
  onSubmit,
  onSubmitRfid,
  page,
  rfidFieldError,
  rfidFormErrorMessage,
  rfidInput,
  rfidTargetName,
  searchInput,
  setSearchInput,
  studentActiveInput,
  studentEmailInput,
  studentNameInput,
  studentPhoneInput,
  studentRegistrationInput,
  students,
  totalStudents,
}: {
  appliedSearch: string;
  companyEmailDomain?: string | null;
  currentFilter: StudentStatusFilter;
  deletingStudentId: string | null;
  deactivatingStudentId: string | null;
  editingStudentId: string | null;
  feedbackMessage: string | null;
  feedbackTone: "error" | "success" | null;
  formErrorMessage?: string;
  formErrors: {
    email?: string;
    name?: string;
    phone?: string;
    registration?: string;
  };
  isLoadingStudents: boolean;
  isModalOpen: boolean;
  isRfidModalOpen: boolean;
  isLinkingRfid: boolean;
  isSavingStudent: boolean;
  lastPage: number;
  onActiveFilterChange: (value: StudentStatusFilter) => void;
  onActiveInputChange: (value: boolean) => void;
  onClearSearch: () => void;
  onCloseModal: () => void;
  onCloseRfidModal: () => void;
  onDeactivateStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onOpenRfidModal: (student: Student) => void;
  onPageChange: (page: number) => void;
  onPhoneChange: (value: string) => void;
  onRefresh: () => void;
  onRegistrationChange: (value: string) => void;
  onRfidInputChange: (value: string) => void;
  onSearch: () => void;
  onSubmit: () => void;
  onSubmitRfid: () => void;
  page: number;
  rfidFieldError?: string;
  rfidFormErrorMessage?: string;
  rfidInput: string;
  rfidTargetName: string;
  searchInput: string;
  setSearchInput: (value: string) => void;
  studentActiveInput: boolean;
  studentEmailInput: string;
  studentNameInput: string;
  studentPhoneInput: string;
  studentRegistrationInput: string;
  students: Student[];
  totalStudents: number;
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
          Busque por nome ou matricula e refine a listagem por status do aluno.
        </Text>

        <View className="mt-4 gap-3">
          <Input>
            <InputField
              onChangeText={setSearchInput}
              onSubmitEditing={onSearch}
              placeholder="Buscar por nome ou matricula"
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

          <View className="flex-row flex-wrap gap-2">
            <FilterChip
              active={currentFilter === "all"}
              label="Todos"
              onPress={() => {
                onActiveFilterChange("all");
              }}
            />
            <FilterChip
              active={currentFilter === "active"}
              label="Ativos"
              onPress={() => {
                onActiveFilterChange("active");
              }}
            />
            <FilterChip
              active={currentFilter === "inactive"}
              label="Inativos"
              onPress={() => {
                onActiveFilterChange("inactive");
              }}
            />
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
          O aluno e salvo primeiro. Depois disso, um segundo modal cuida da
          vinculacao da tag RFID, no mesmo principio usado no web.
        </Text>

        <View className="mt-4 flex-row gap-3">
          <Button
            className="flex-1 rounded-2xl bg-tertiary-500"
            onPress={onOpenCreateModal}
          >
            <LucideIcon color="#FFFFFF" icon={Plus} size={16} />
            <ButtonText className="text-typography-0">Novo aluno</ButtonText>
          </Button>

          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={isLoadingStudents}
            onPress={onRefresh}
          >
            <LucideIcon color="#475569" icon={RefreshCw} size={16} />
            <ButtonText>Atualizar lista</ButtonText>
          </Button>
        </View>
      </View>

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <Text className="text-lg font-semibold text-typography-950">
          Lista de alunos
        </Text>
        <Text className="mt-2 text-sm leading-6 text-typography-600">
          Total retornado pela API: {formatCount(totalStudents)} registro(s).
        </Text>

        {isLoadingStudents ? (
          <View className="mt-4 rounded-[24px] bg-amber-50 px-4 py-4">
            <View className="flex-row items-center gap-3">
              <LucideIcon color="#b45309" icon={RefreshCw} size={16} />
              <Text className="text-sm font-semibold text-amber-800">
                Carregando alunos cadastrados...
              </Text>
            </View>
          </View>
        ) : students.length > 0 ? (
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
            className="mt-4"
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            style={{ maxHeight: RESULTS_VIEWPORT_HEIGHT }}
          >
            {students.map((student) => {
              const rfidTags = student.rfidCards?.map((card) => card.tag).filter(Boolean) ?? [];

              return (
                <View
                  key={student.id}
                  className="rounded-[28px] bg-background-0 px-4 py-4"
                >
                  <View className="flex-row items-start gap-4">
                    <View className="rounded-2xl bg-tertiary-50 p-3">
                      <LucideIcon color="#b45309" icon={GraduationCap} size={18} />
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-typography-950">
                            {student.name}
                          </Text>
                          <Text className="mt-1 text-sm leading-6 text-typography-600">
                            Matricula: {student.registration}
                          </Text>
                        </View>

                        <View className="items-end gap-2">
                          <View
                            className="rounded-full px-3 py-2"
                            style={{
                              backgroundColor: student.active ? "#ecfdf5" : "#fef2f2",
                            }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{
                                color: student.active ? "#047857" : "#b91c1c",
                              }}
                            >
                              {getStudentStatusLabel(student.active)}
                            </Text>
                          </View>

                          {editingStudentId === student.id ? (
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
                        Contato
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        Email: {student.email?.trim() ? student.email : "Nao informado"}
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        Telefone: {student.phone?.trim() ? student.phone : "Nao informado"}
                      </Text>
                    </View>

                    <View
                      className="rounded-2xl bg-background-50 px-4 py-3 items-center"
                      style={{ flexBasis: "48%", flexGrow: 1 }}
                    >
                      <Text className="text-center text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                        RFID
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        {rfidTags.length > 0
                          ? rfidTags.join(", ")
                          : "Nenhuma tag RFID vinculada"}
                      </Text>
                    </View>

                    <View className="w-full rounded-2xl bg-background-50 px-4 py-3 items-center">
                      <Text className="text-center text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
                        Cadastro
                      </Text>
                      <Text className="mt-1 text-center text-sm leading-6 text-typography-700">
                        Criado em {formatStudentDate(student.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row flex-wrap gap-3">
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      isDisabled={
                        isSavingStudent ||
                        deletingStudentId === student.id ||
                        deactivatingStudentId === student.id
                      }
                      onPress={() => {
                        onEditStudent(student);
                      }}
                      >
                        <LucideIcon color="#FC7C3A" icon={Pencil} size={16} />
                        <ButtonText>Editar</ButtonText>
                      </Button>

                    {rfidTags.length === 0 ? (
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        isDisabled={
                          isSavingStudent ||
                          deletingStudentId === student.id ||
                          deactivatingStudentId === student.id ||
                          isLinkingRfid
                        }
                        onPress={() => {
                          onOpenRfidModal(student);
                        }}
                      >
                        <LucideIcon color="#0f766e" icon={CreditCard} size={16} />
                        <ButtonText>Vincular RFID</ButtonText>
                      </Button>
                    ) : null}

                    {student.active ? (
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        isDisabled={
                          isSavingStudent ||
                          deletingStudentId === student.id ||
                          deactivatingStudentId === student.id
                        }
                        onPress={() => {
                          onDeactivateStudent(student);
                        }}
                      >
                        <ButtonText>Desativar</ButtonText>
                      </Button>
                    ) : null}

                    <Button
                      variant="outline"
                      action="negative"
                      className="rounded-2xl"
                      isDisabled={
                        isSavingStudent ||
                        deletingStudentId === student.id ||
                        deactivatingStudentId === student.id
                      }
                      onPress={() => {
                        onDeleteStudent(student);
                      }}
                    >
                      <LucideIcon color="#dc2626" icon={Trash2} size={16} />
                      <ButtonText>Excluir</ButtonText>
                    </Button>
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
                  Nenhum aluno encontrado
                </Text>
                <Text className="mt-2 text-sm leading-6 text-typography-600">
                  Revise a busca, o filtro de status ou cadastre o primeiro aluno
                  da empresa nesta tela.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="mt-4 flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={page <= 1 || isLoadingStudents}
            onPress={() => {
              onPageChange(page - 1);
            }}
          >
            <ButtonText>Pagina anterior</ButtonText>
          </Button>

          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            isDisabled={page >= lastPage || isLoadingStudents}
            onPress={() => {
              onPageChange(page + 1);
            }}
          >
            <ButtonText>Proxima pagina</ButtonText>
          </Button>
        </View>
      </View>

      <StudentFormModal
        companyEmailDomain={companyEmailDomain}
        emailError={formErrors.email}
        emailInput={studentEmailInput}
        formErrorMessage={formErrorMessage}
        isActiveInput={studentActiveInput}
        isEditing={Boolean(editingStudentId)}
        isOpen={isModalOpen}
        isSaving={isSavingStudent}
        nameError={formErrors.name}
        nameInput={studentNameInput}
        onActiveChange={onActiveInputChange}
        onClose={onCloseModal}
        onEmailChange={onEmailChange}
        onNameChange={onNameChange}
        onPhoneChange={onPhoneChange}
        onRegistrationChange={onRegistrationChange}
        onSubmit={onSubmit}
        phoneError={formErrors.phone}
        phoneInput={studentPhoneInput}
        registrationError={formErrors.registration}
        registrationInput={studentRegistrationInput}
      />

      <StudentRfidModal
        tagError={rfidFieldError}
        formErrorMessage={rfidFormErrorMessage}
        isLinking={isLinkingRfid}
        isOpen={isRfidModalOpen}
        onClose={onCloseRfidModal}
        onSubmit={onSubmitRfid}
        onTagChange={onRfidInputChange}
        studentName={rfidTargetName}
        tagInput={rfidInput}
      />
    </View>
  );
}
