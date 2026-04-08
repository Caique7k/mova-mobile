import { BusesSection } from "@/components/cadastros/buses-section";
import { catalogSections } from "@/components/cadastros/config";
import { StudentsSection } from "@/components/cadastros/students-section";
import { CatalogNavItem, PlaceholderSection } from "@/components/cadastros/ui";
import type { CatalogSectionKey } from "@/components/cadastros/types";
import { useAuth } from "@/contexts/auth-context";
import { canManageCompany, extractSessionRoles } from "@/services/auth";
import { getApiErrorMessage } from "@/services/api";
import {
  createBus,
  deleteBuses,
  fetchBuses,
  updateBus,
  type Bus,
} from "@/services/buses";
import { linkStudentRfid } from "@/services/rfid";
import {
  createStudent,
  deactivateStudents,
  deleteStudents,
  fetchStudents,
  updateStudent,
  type Student,
  type StudentStatusFilter,
} from "@/services/students";
import { hideAppToast, showAppToast } from "@/services/toast";
import { Cpu } from "lucide";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 5;
const MERCOSUL_PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
const STUDENT_LOCAL_EMAIL_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/i;
const STUDENT_FULL_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type FeedbackTone = "error" | "success";

type BusFormErrors = {
  capacity?: string;
  general?: string;
  plate?: string;
};

type StudentFormErrors = {
  email?: string;
  general?: string;
  name?: string;
  phone?: string;
  registration?: string;
};

type StudentRfidFlowTarget = {
  fromCreation: boolean;
  id: string;
  name: string;
};

function sanitizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function sanitizeStudentName(value: string) {
  return value.replace(/\s+/g, " ");
}

function sanitizeStudentEmail(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function sanitizeStudentPhone(value: string) {
  return value.replace(/[^\d()+\-\s]/g, "");
}

function sanitizeStudentRfid(value: string) {
  return value.toUpperCase().replace(/\s+/g, "");
}

function getStudentFilterForVisibility(
  isActive: boolean,
  filter: StudentStatusFilter,
) {
  if (filter === "all") {
    return filter;
  }

  if ((filter === "active" && isActive) || (filter === "inactive" && !isActive)) {
    return filter;
  }

  return "all";
}

async function requestBusPage(page: number, search: string) {
  return fetchBuses({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
}

async function requestStudentPage(
  page: number,
  search: string,
  active: StudentStatusFilter,
) {
  return fetchStudents({
    active,
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
}

export default function CompanyScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const canViewCompanyAdmin = canManageCompany(session);
  const sessionRoles = extractSessionRoles(session);
  const isCompactRail = width < 900;
  const companyEmailDomain =
    typeof session?.user.emailDomain === "string" && session.user.emailDomain.trim()
      ? session.user.emailDomain.trim().toLowerCase()
      : typeof session?.company?.slug === "string" && session.company.slug.trim()
        ? session.company.slug.trim().toLowerCase()
        : null;

  const [activeSection, setActiveSection] = useState<CatalogSectionKey>("buses");

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone | null>(null);

  const [buses, setBuses] = useState<Bus[]>([]);
  const [busPage, setBusPage] = useState(1);
  const [busLastPage, setBusLastPage] = useState(1);
  const [totalBuses, setTotalBuses] = useState(0);
  const [busSearchInput, setBusSearchInput] = useState("");
  const [appliedBusSearch, setAppliedBusSearch] = useState("");
  const [plateInput, setPlateInput] = useState("");
  const [capacityInput, setCapacityInput] = useState("");
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [deletingBusId, setDeletingBusId] = useState<string | null>(null);
  const [isLoadingBuses, setIsLoadingBuses] = useState(false);
  const [isSavingBus, setIsSavingBus] = useState(false);
  const [busFormErrors, setBusFormErrors] = useState<BusFormErrors>({});

  const [students, setStudents] = useState<Student[]>([]);
  const [studentPage, setStudentPage] = useState(1);
  const [studentLastPage, setStudentLastPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentSearchInput, setStudentSearchInput] = useState("");
  const [appliedStudentSearch, setAppliedStudentSearch] = useState("");
  const [studentActiveFilter, setStudentActiveFilter] =
    useState<StudentStatusFilter>("all");
  const [studentNameInput, setStudentNameInput] = useState("");
  const [studentRegistrationInput, setStudentRegistrationInput] = useState("");
  const [studentEmailInput, setStudentEmailInput] = useState("");
  const [studentPhoneInput, setStudentPhoneInput] = useState("");
  const [studentActiveInput, setStudentActiveInput] = useState(true);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [deactivatingStudentId, setDeactivatingStudentId] = useState<string | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [studentFormErrors, setStudentFormErrors] = useState<StudentFormErrors>({});
  const [isStudentRfidModalOpen, setIsStudentRfidModalOpen] = useState(false);
  const [studentRfidFlowTarget, setStudentRfidFlowTarget] =
    useState<StudentRfidFlowTarget | null>(null);
  const [studentRfidInput, setStudentRfidInput] = useState("");
  const [studentRfidErrorMessage, setStudentRfidErrorMessage] = useState<string | null>(
    null,
  );
  const [studentRfidFieldError, setStudentRfidFieldError] = useState<string | undefined>(
    undefined,
  );
  const [isLinkingStudentRfid, setIsLinkingStudentRfid] = useState(false);

  const visibleCapacity = buses.reduce((total, bus) => total + bus.capacity, 0);

  function clearFeedback() {
    setFeedbackMessage(null);
    setFeedbackTone(null);
    hideAppToast();
  }

  const showFeedback = useCallback((tone: FeedbackTone, message: string) => {
    setFeedbackMessage(message);
    setFeedbackTone(tone);
    showAppToast({
      message,
      tone,
    });
  }, []);

  function clearBusFormErrors() {
    setBusFormErrors({});
  }

  function clearStudentFormErrors() {
    setStudentFormErrors({});
  }

  function clearStudentRfidErrors() {
    setStudentRfidErrorMessage(null);
    setStudentRfidFieldError(undefined);
  }

  function resetBusForm() {
    setEditingBusId(null);
    setPlateInput("");
    setCapacityInput("");
    clearBusFormErrors();
  }

  function resetStudentForm() {
    setEditingStudentId(null);
    setStudentNameInput("");
    setStudentRegistrationInput("");
    setStudentEmailInput("");
    setStudentPhoneInput("");
    setStudentActiveInput(true);
    clearStudentFormErrors();
  }

  function resetStudentRfidFlow() {
    setStudentRfidFlowTarget(null);
    setStudentRfidInput("");
    clearStudentRfidErrors();
  }

  function closeBusModal() {
    if (isSavingBus) {
      return;
    }

    setIsBusModalOpen(false);
    resetBusForm();
  }

  function closeStudentModal() {
    if (isSavingStudent) {
      return;
    }

    setIsStudentModalOpen(false);
    resetStudentForm();
  }

  function closeStudentRfidModal() {
    if (isLinkingStudentRfid) {
      return;
    }

    const target = studentRfidFlowTarget;

    setIsStudentRfidModalOpen(false);
    resetStudentRfidFlow();

    if (target?.fromCreation) {
      showFeedback(
        "success",
        `Aluno ${target.name} cadastrado com sucesso. Vinculacao RFID pendente.`,
      );
    }
  }

  function openCreateBusModal() {
    clearFeedback();
    resetBusForm();
    setIsBusModalOpen(true);
  }

  function openCreateStudentModal() {
    clearFeedback();
    resetStudentForm();
    setStudentActiveInput(true);
    setIsStudentModalOpen(true);
  }

  function openStudentRfidModal(
    target: Pick<Student, "id" | "name">,
    fromCreation = false,
  ) {
    clearFeedback();
    clearStudentRfidErrors();
    setStudentRfidFlowTarget({
      fromCreation,
      id: target.id,
      name: target.name,
    });
    setStudentRfidInput("");
    setIsStudentRfidModalOpen(true);
  }

  function validateBusForm() {
    const nextErrors: BusFormErrors = {};
    const plate = sanitizePlate(plateInput).trim();
    const capacity = Number.parseInt(capacityInput, 10);

    if (!plate) {
      nextErrors.plate = "Preencha a placa do onibus.";
    } else if (!MERCOSUL_PLATE_PATTERN.test(plate)) {
      nextErrors.plate = "Use o formato Mercosul, por exemplo: ABC1D23.";
    }

    if (!capacityInput.trim()) {
      nextErrors.capacity = "Preencha a capacidade.";
    } else if (!Number.isFinite(capacity) || capacity <= 0) {
      nextErrors.capacity = "Informe um numero inteiro maior que zero.";
    }

    return {
      capacity,
      isValid: Object.keys(nextErrors).length === 0,
      nextErrors,
      plate,
    };
  }

  function validateStudentForm() {
    const nextErrors: StudentFormErrors = {};
    const name = studentNameInput.trim().replace(/\s+/g, " ");
    const registration = studentRegistrationInput.trim();
    const email = studentEmailInput.trim().toLowerCase();
    const phone = studentPhoneInput.trim();
    const expectedDomain = companyEmailDomain?.replace(/^@/, "").toLowerCase() ?? null;

    if (!name) {
      nextErrors.name = "Preencha o nome do aluno.";
    } else if (name.length < 3) {
      nextErrors.name = "Digite pelo menos 3 caracteres para o nome.";
    }

    if (!registration) {
      nextErrors.registration = "Preencha a matricula.";
    } else if (registration.length < 3) {
      nextErrors.registration = "A matricula precisa ter pelo menos 3 caracteres.";
    }

    if (email) {
      if (email.includes("@")) {
        const [localPart = "", domainPart = ""] = email.split("@");

        if (!STUDENT_FULL_EMAIL_PATTERN.test(email)) {
          nextErrors.email = "Informe um email valido.";
        } else if (!STUDENT_LOCAL_EMAIL_PATTERN.test(localPart)) {
          nextErrors.email =
            "Use apenas letras, numeros, ponto, underline ou hifen antes do dominio.";
        } else if (expectedDomain && domainPart.toLowerCase() !== expectedDomain) {
          nextErrors.email = `O email do aluno deve usar o dominio ${expectedDomain}.`;
        }
      } else if (!STUDENT_LOCAL_EMAIL_PATTERN.test(email)) {
        nextErrors.email =
          "Use apenas letras, numeros, ponto, underline ou hifen antes do dominio.";
      } else if (!expectedDomain) {
        nextErrors.email = "Informe o email completo, incluindo o dominio.";
      }
    }

    if (phone) {
      const digits = phone.replace(/[^\d]/g, "");

      if (digits.length < 10) {
        nextErrors.phone =
          "Informe um telefone com DDD ou deixe o campo em branco.";
      }
    }

    return {
      email,
      isValid: Object.keys(nextErrors).length === 0,
      name,
      nextErrors,
      phone,
      registration,
    };
  }

  function validateStudentRfidInput() {
    const tag = sanitizeStudentRfid(studentRfidInput).trim();

    if (!tag) {
      return {
        isValid: false,
        tag,
        tagError: "Digite a tag RFID para concluir o vinculo.",
      };
    }

    if (tag.length < 4) {
      return {
        isValid: false,
        tag,
        tagError: "A tag RFID parece curta demais.",
      };
    }

    return {
      isValid: true,
      tag,
      tagError: undefined,
    };
  }

  function selectSection(nextSection: CatalogSectionKey) {
    if (isSavingBus || isSavingStudent || isLinkingStudentRfid) {
      return;
    }

    clearFeedback();
    closeBusModal();
    closeStudentModal();
    closeStudentRfidModal();
    setActiveSection(nextSection);
  }

  async function loadBuses(nextPage = busPage, nextSearch = appliedBusSearch) {
    setIsLoadingBuses(true);

    try {
      const response = await requestBusPage(nextPage, nextSearch);
      setBuses(response.data);
      setTotalBuses(response.total);
      setBusLastPage(Math.max(response.lastPage, 1));
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Nao foi possivel carregar os onibus."),
      );
    } finally {
      setIsLoadingBuses(false);
    }
  }

  async function loadStudents(
    nextPage = studentPage,
    nextSearch = appliedStudentSearch,
    nextFilter = studentActiveFilter,
  ) {
    setIsLoadingStudents(true);

    try {
      const response = await requestStudentPage(nextPage, nextSearch, nextFilter);
      setStudents(response.data);
      setTotalStudents(response.total);
      setStudentLastPage(Math.max(response.lastPage, 1));
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Nao foi possivel carregar os alunos."),
      );
    } finally {
      setIsLoadingStudents(false);
    }
  }

  useEffect(() => {
    if (!canViewCompanyAdmin || activeSection !== "buses") {
      return;
    }

    let isMounted = true;
    setIsLoadingBuses(true);

    void requestBusPage(busPage, appliedBusSearch)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setBuses(response.data);
        setTotalBuses(response.total);
        setBusLastPage(Math.max(response.lastPage, 1));
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        showFeedback(
          "error",
          getApiErrorMessage(error, "Nao foi possivel carregar os onibus."),
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingBuses(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeSection, appliedBusSearch, busPage, canViewCompanyAdmin, showFeedback]);

  useEffect(() => {
    if (!canViewCompanyAdmin || activeSection !== "students") {
      return;
    }

    let isMounted = true;
    setIsLoadingStudents(true);

    void requestStudentPage(studentPage, appliedStudentSearch, studentActiveFilter)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setStudents(response.data);
        setTotalStudents(response.total);
        setStudentLastPage(Math.max(response.lastPage, 1));
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        showFeedback(
          "error",
          getApiErrorMessage(error, "Nao foi possivel carregar os alunos."),
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingStudents(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    activeSection,
    appliedStudentSearch,
    canViewCompanyAdmin,
    showFeedback,
    studentActiveFilter,
    studentPage,
  ]);

  async function refreshOrMoveBuses(
    nextPage = busPage,
    nextSearch = appliedBusSearch,
  ) {
    let shouldWaitForEffect = false;

    if (busPage !== nextPage) {
      setBusPage(nextPage);
      shouldWaitForEffect = true;
    }

    if (appliedBusSearch !== nextSearch) {
      setAppliedBusSearch(nextSearch);
      shouldWaitForEffect = true;
    }

    if (shouldWaitForEffect) {
      return;
    }

    await loadBuses(nextPage, nextSearch);
  }

  async function refreshOrMoveStudents(
    nextPage = studentPage,
    nextSearch = appliedStudentSearch,
    nextFilter = studentActiveFilter,
  ) {
    let shouldWaitForEffect = false;

    if (studentPage !== nextPage) {
      setStudentPage(nextPage);
      shouldWaitForEffect = true;
    }

    if (appliedStudentSearch !== nextSearch) {
      setAppliedStudentSearch(nextSearch);
      shouldWaitForEffect = true;
    }

    if (studentActiveFilter !== nextFilter) {
      setStudentActiveFilter(nextFilter);
      shouldWaitForEffect = true;
    }

    if (shouldWaitForEffect) {
      return;
    }

    await loadStudents(nextPage, nextSearch, nextFilter);
  }

  async function handleSubmitBus() {
    const { capacity, isValid, nextErrors, plate } = validateBusForm();

    if (!isValid) {
      setBusFormErrors(nextErrors);
      showFeedback("error", "Revise os campos destacados antes de salvar o onibus.");
      return;
    }

    setIsSavingBus(true);
    clearFeedback();
    clearBusFormErrors();

    try {
      if (editingBusId) {
        await updateBus(editingBusId, { capacity, plate });
        showFeedback("success", `Onibus ${plate} atualizado com sucesso.`);
      } else {
        await createBus({ capacity, plate });
        showFeedback("success", `Onibus ${plate} cadastrado com sucesso.`);
      }

      setIsBusModalOpen(false);
      resetBusForm();
      setBusSearchInput("");
      await refreshOrMoveBuses(1, "");
    } catch (error) {
      const message = getApiErrorMessage(error, "Nao foi possivel salvar o onibus.");
      const nextFormErrors: BusFormErrors = {
        general: message,
      };

      showFeedback("error", message);

      if (message.toLowerCase().includes("placa")) {
        nextFormErrors.plate = message;
      }

      setBusFormErrors(nextFormErrors);
    } finally {
      setIsSavingBus(false);
    }
  }

  async function handleSubmitStudent() {
    const { email, isValid, name, nextErrors, phone, registration } =
      validateStudentForm();

    if (!isValid) {
      setStudentFormErrors(nextErrors);
      showFeedback("error", "Revise os campos destacados antes de salvar o aluno.");
      return;
    }

    setIsSavingStudent(true);
    clearFeedback();
    clearStudentFormErrors();

    try {
      const nextVisibleFilter = getStudentFilterForVisibility(
        editingStudentId ? studentActiveInput : true,
        studentActiveFilter,
      );

      if (editingStudentId) {
        await updateStudent(editingStudentId, {
          active: studentActiveInput,
          email,
          name,
          phone,
          registration,
        });
        showFeedback("success", `Aluno ${name} atualizado com sucesso.`);
      } else {
        const createdStudent = await createStudent({
          active: true,
          email,
          name,
          phone,
          registration,
        });

        setIsStudentModalOpen(false);
        resetStudentForm();
        setStudentSearchInput("");
        setStudentPage(1);
        setAppliedStudentSearch("");
        setStudentActiveFilter(nextVisibleFilter);
        await loadStudents(1, "", nextVisibleFilter);
        openStudentRfidModal(createdStudent, true);
        return;
      }

      setIsStudentModalOpen(false);
      resetStudentForm();
      setStudentSearchInput("");
      await refreshOrMoveStudents(1, "", nextVisibleFilter);
    } catch (error) {
      const message = getApiErrorMessage(error, "Nao foi possivel salvar o aluno.");
      const lowered = message.toLowerCase();
      const nextFormErrors: StudentFormErrors = {
        general: message,
      };

      showFeedback("error", message);

      if (lowered.includes("matric")) {
        nextFormErrors.registration = message;
      }

      if (lowered.includes("email") || lowered.includes("dominio")) {
        nextFormErrors.email = message;
      }

      setStudentFormErrors(nextFormErrors);
    } finally {
      setIsSavingStudent(false);
    }
  }

  async function handleSubmitStudentRfid() {
    const target = studentRfidFlowTarget;

    if (!target) {
      return;
    }

    const { isValid, tag, tagError } = validateStudentRfidInput();

    if (!isValid) {
      setStudentRfidFieldError(tagError);
      showFeedback("error", "Digite uma tag RFID valida para concluir o vinculo.");
      return;
    }

    setIsLinkingStudentRfid(true);
    clearStudentRfidErrors();

    try {
      await linkStudentRfid({
        rfidTag: tag,
        studentId: target.id,
      });

      showFeedback("success", `Tag RFID vinculada com sucesso ao aluno ${target.name}.`);
      setIsStudentRfidModalOpen(false);
      resetStudentRfidFlow();
      await loadStudents(studentPage, appliedStudentSearch, studentActiveFilter);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Nao foi possivel vincular a tag RFID.",
      );

      showFeedback("error", message);
      setStudentRfidErrorMessage(message);

      if (message.toLowerCase().includes("tag")) {
        setStudentRfidFieldError(message);
      }
    } finally {
      setIsLinkingStudentRfid(false);
    }
  }

  async function handleDeleteBus(bus: Bus) {
    setDeletingBusId(bus.id);
    clearFeedback();

    try {
      await deleteBuses([bus.id]);
      showFeedback("success", `Onibus ${bus.plate} excluido com sucesso.`);

      if (editingBusId === bus.id) {
        resetBusForm();
      }

      const nextPage = busPage > 1 && buses.length === 1 ? busPage - 1 : busPage;
      await refreshOrMoveBuses(nextPage, appliedBusSearch);
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Nao foi possivel excluir o onibus."),
      );
    } finally {
      setDeletingBusId(null);
    }
  }

  async function handleDeleteStudent(student: Student) {
    setDeletingStudentId(student.id);
    clearFeedback();

    try {
      await deleteStudents([student.id]);
      showFeedback("success", `Aluno ${student.name} excluido com sucesso.`);

      if (editingStudentId === student.id) {
        resetStudentForm();
      }

      const nextPage =
        studentPage > 1 && students.length === 1 ? studentPage - 1 : studentPage;
      await refreshOrMoveStudents(nextPage, appliedStudentSearch, studentActiveFilter);
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Nao foi possivel excluir o aluno."),
      );
    } finally {
      setDeletingStudentId(null);
    }
  }

  async function handleDeactivateStudent(student: Student) {
    setDeactivatingStudentId(student.id);
    clearFeedback();

    try {
      await deactivateStudents([student.id]);
      showFeedback("success", `Aluno ${student.name} desativado com sucesso.`);

      const nextPage =
        studentPage > 1 && students.length === 1 ? studentPage - 1 : studentPage;
      await refreshOrMoveStudents(nextPage, appliedStudentSearch, studentActiveFilter);
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Nao foi possivel desativar o aluno."),
      );
    } finally {
      setDeactivatingStudentId(null);
    }
  }

  function confirmDeleteBus(bus: Bus) {
    Alert.alert(
      "Excluir onibus",
      `Deseja excluir o onibus ${bus.plate}?`,
      [
        { style: "cancel", text: "Cancelar" },
        {
          style: "destructive",
          text: "Excluir",
          onPress: () => {
            void handleDeleteBus(bus);
          },
        },
      ],
    );
  }

  function confirmDeleteStudent(student: Student) {
    Alert.alert(
      "Excluir aluno",
      `Deseja excluir o aluno ${student.name}?`,
      [
        { style: "cancel", text: "Cancelar" },
        {
          style: "destructive",
          text: "Excluir",
          onPress: () => {
            void handleDeleteStudent(student);
          },
        },
      ],
    );
  }

  function confirmDeactivateStudent(student: Student) {
    Alert.alert(
      "Desativar aluno",
      `Deseja desativar o aluno ${student.name}?`,
      [
        { style: "cancel", text: "Cancelar" },
        {
          text: "Desativar",
          onPress: () => {
            void handleDeactivateStudent(student);
          },
        },
      ],
    );
  }

  function startEditing(bus: Bus) {
    clearFeedback();
    clearBusFormErrors();
    setEditingBusId(bus.id);
    setPlateInput(bus.plate);
    setCapacityInput(String(bus.capacity));
    setIsBusModalOpen(true);
  }

  function startEditingStudent(student: Student) {
    clearFeedback();
    clearStudentFormErrors();
    setEditingStudentId(student.id);
    setStudentNameInput(student.name);
    setStudentRegistrationInput(student.registration);
    setStudentEmailInput(student.email ?? "");
    setStudentPhoneInput(student.phone ?? "");
    setStudentActiveInput(student.active);
    setIsStudentModalOpen(true);
  }

  function renderActiveSection() {
    if (activeSection === "buses") {
      return (
        <BusesSection
          appliedSearch={appliedBusSearch}
          buses={buses}
          capacityInput={capacityInput}
          deletingBusId={deletingBusId}
          editingBusId={editingBusId}
          feedbackMessage={feedbackMessage}
          feedbackTone={feedbackTone}
          formErrorMessage={busFormErrors.general}
          formErrors={busFormErrors}
          isLoadingBuses={isLoadingBuses}
          isModalOpen={isBusModalOpen}
          isSavingBus={isSavingBus}
          lastPage={busLastPage}
          onCapacityChange={(value) => {
            clearBusFormErrors();
            setCapacityInput(value.replace(/[^\d]/g, ""));
          }}
          onClearSearch={() => {
            clearFeedback();
            setBusSearchInput("");
            void refreshOrMoveBuses(1, "");
          }}
          onCloseModal={closeBusModal}
          onDeleteBus={confirmDeleteBus}
          onEditBus={startEditing}
          onOpenCreateModal={openCreateBusModal}
          onPageChange={(nextPage) => {
            void refreshOrMoveBuses(nextPage, appliedBusSearch);
          }}
          onPlateChange={(value) => {
            clearBusFormErrors();
            setPlateInput(sanitizePlate(value));
          }}
          onRefresh={() => {
            void loadBuses(busPage, appliedBusSearch);
          }}
          onSearch={() => {
            clearFeedback();
            void refreshOrMoveBuses(1, busSearchInput.trim());
          }}
          onSubmit={() => {
            void handleSubmitBus();
          }}
          page={busPage}
          plateInput={plateInput}
          searchInput={busSearchInput}
          setSearchInput={(value) => {
            setBusSearchInput(sanitizePlate(value));
          }}
          totalBuses={totalBuses}
          visibleCapacity={visibleCapacity}
        />
      );
    }

    if (activeSection === "students") {
      return (
        <StudentsSection
          appliedSearch={appliedStudentSearch}
          companyEmailDomain={companyEmailDomain}
          currentFilter={studentActiveFilter}
          deletingStudentId={deletingStudentId}
          deactivatingStudentId={deactivatingStudentId}
          editingStudentId={editingStudentId}
          feedbackMessage={feedbackMessage}
          feedbackTone={feedbackTone}
          formErrorMessage={studentFormErrors.general}
          formErrors={studentFormErrors}
          isLoadingStudents={isLoadingStudents}
          isModalOpen={isStudentModalOpen}
          isRfidModalOpen={isStudentRfidModalOpen}
          isLinkingRfid={isLinkingStudentRfid}
          isSavingStudent={isSavingStudent}
          lastPage={studentLastPage}
          onActiveFilterChange={(value) => {
            clearFeedback();
            void refreshOrMoveStudents(1, appliedStudentSearch, value);
          }}
          onActiveInputChange={(value) => {
            clearStudentFormErrors();
            setStudentActiveInput(value);
          }}
          onClearSearch={() => {
            clearFeedback();
            setStudentSearchInput("");
            void refreshOrMoveStudents(1, "", studentActiveFilter);
          }}
          onCloseModal={closeStudentModal}
          onCloseRfidModal={closeStudentRfidModal}
          onDeactivateStudent={confirmDeactivateStudent}
          onDeleteStudent={confirmDeleteStudent}
          onEditStudent={startEditingStudent}
          onEmailChange={(value) => {
            clearStudentFormErrors();
            setStudentEmailInput(sanitizeStudentEmail(value));
          }}
          onNameChange={(value) => {
            clearStudentFormErrors();
            setStudentNameInput(sanitizeStudentName(value));
          }}
          onOpenCreateModal={openCreateStudentModal}
          onOpenRfidModal={(student) => {
            openStudentRfidModal(student);
          }}
          onPageChange={(nextPage) => {
            void refreshOrMoveStudents(
              nextPage,
              appliedStudentSearch,
              studentActiveFilter,
            );
          }}
          onPhoneChange={(value) => {
            clearStudentFormErrors();
            setStudentPhoneInput(sanitizeStudentPhone(value));
          }}
          onRefresh={() => {
            void loadStudents(studentPage, appliedStudentSearch, studentActiveFilter);
          }}
          onRegistrationChange={(value) => {
            clearStudentFormErrors();
            setStudentRegistrationInput(value.replace(/\s+/g, " "));
          }}
          onRfidInputChange={(value) => {
            clearStudentRfidErrors();
            setStudentRfidInput(sanitizeStudentRfid(value));
          }}
          onSearch={() => {
            clearFeedback();
            void refreshOrMoveStudents(1, studentSearchInput.trim(), studentActiveFilter);
          }}
          onSubmit={() => {
            void handleSubmitStudent();
          }}
          onSubmitRfid={() => {
            void handleSubmitStudentRfid();
          }}
          page={studentPage}
          rfidFieldError={studentRfidFieldError}
          rfidFormErrorMessage={studentRfidErrorMessage ?? undefined}
          rfidInput={studentRfidInput}
          rfidTargetName={studentRfidFlowTarget?.name ?? "Aluno"}
          searchInput={studentSearchInput}
          setSearchInput={setStudentSearchInput}
          studentActiveInput={studentActiveInput}
          studentEmailInput={studentEmailInput}
          studentNameInput={studentNameInput}
          studentPhoneInput={studentPhoneInput}
          studentRegistrationInput={studentRegistrationInput}
          students={students}
          totalStudents={totalStudents}
        />
      );
    }

    return (
      <PlaceholderSection
        actionLabel="UniHub"
        description="Aqui entra o cadastro de dispositivos, pairing, vinculo com onibus e manutencao do modulo de campo."
        icon={Cpu}
        title="UniHub"
      />
    );
  }

  if (!canViewCompanyAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-background-50">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View className="gap-5">
            <Text className="text-[32px] font-bold leading-9 text-typography-950">
              Cadastros
            </Text>

            <View className="rounded-[28px] bg-red-50 px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-red-700">
                Acesso restrito
              </Text>
              <Text className="mt-2 text-2xl font-bold text-red-900">
                Esta area e exclusiva para ADMIN.
              </Text>
              <Text className="mt-2 text-sm leading-6 text-red-700">
                PLATFORM_ADMIN segue o fluxo da plataforma. DRIVER, COORDINATOR e
                USER entram em telas operacionais ou de acompanhamento, sem acesso
                ao hub de cadastros.
              </Text>
              {sessionRoles.length > 0 ? (
                <Text className="mt-3 text-xs font-semibold uppercase tracking-[1.5px] text-red-600">
                  Perfis encontrados: {sessionRoles.join(", ")}
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="gap-5">
          <Text className="text-[32px] font-bold leading-9 text-typography-950">
            Cadastros
          </Text>

          <View className="rounded-[32px] bg-background-0 p-4">
            {isCompactRail ? (
              <View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  <View className="flex-row gap-3">
                    {catalogSections.map((section) => (
                      <CatalogNavItem
                        key={section.key}
                        active={activeSection === section.key}
                        compact
                        onPress={() => {
                          selectSection(section.key);
                        }}
                        section={section}
                      />
                    ))}
                  </View>
                </ScrollView>

                <View className="mt-5">{renderActiveSection()}</View>
              </View>
            ) : (
              <View className="flex-row gap-4">
                <View style={{ width: 250 }}>
                  <View className="gap-3">
                    {catalogSections.map((section) => (
                      <CatalogNavItem
                        key={section.key}
                        active={activeSection === section.key}
                        compact={false}
                        onPress={() => {
                          selectSection(section.key);
                        }}
                        section={section}
                      />
                    ))}
                  </View>
                </View>

                <View className="flex-1">{renderActiveSection()}</View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
