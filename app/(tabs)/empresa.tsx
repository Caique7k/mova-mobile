import { BusesSection } from "@/components/cadastros/buses-section";
import { catalogSections } from "@/components/cadastros/config";
import { StudentsSection } from "@/components/cadastros/students-section";
import { UniHubSection } from "@/components/cadastros/unihub-section";
import { UsersSection } from "@/components/cadastros/users-section";
import { CatalogNavItem } from "@/components/cadastros/ui";
import type { CatalogSectionKey } from "@/components/cadastros/types";
import { useAuth } from "@/contexts/auth-context";
import {
  canViewCompanyTab,
  extractSessionRoles,
  getPrimarySessionRole,
  getVisibleCompanySections,
} from "@/services/auth";
import { getApiErrorMessage } from "@/services/api";
import {
  createBus,
  deleteBuses,
  fetchBusOptions,
  fetchBuses,
  updateBus,
  type Bus,
} from "@/services/buses";
import {
  deactivateDevices,
  fetchDevices,
  linkDevice,
  linkDeviceBus,
  updateDeviceName,
  type Device,
  type DeviceStatusFilter,
} from "@/services/devices";
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
import {
  createUser,
  deactivateUsers,
  fetchUserStudentCandidates,
  fetchUsers,
  updateUser,
  type ManagedUserRole,
  type UserRecord,
  type UserRoleFilter,
  type UserStatusFilter,
  type UserStudentCandidate,
} from "@/services/users";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 5;
const BUS_OPTIONS_LIMIT = 100;
const MERCOSUL_PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
const DEVICE_PAIRING_CODE_PATTERN = /^[A-Z0-9-]{4,20}$/;
const STUDENT_LOCAL_EMAIL_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/i;
const STUDENT_FULL_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const USER_EMAIL_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*@[a-z0-9.-]+\.[a-z]{2,}$/i;
const USER_PASSWORD_MIN_LENGTH = 6;

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

type DeviceFormErrors = {
  busId?: string;
  general?: string;
  name?: string;
  pairingCode?: string;
};

type DeviceFormMode = "edit" | "link";

type UserFormErrors = {
  email?: string;
  general?: string;
  name?: string;
  password?: string;
  studentId?: string;
};

type StudentRfidFlowTarget = {
  fromCreation: boolean;
  id: string;
  name: string;
};

function mapUserStudentToCandidate(student: NonNullable<UserRecord["student"]>) {
  return {
    email: student.email,
    id: student.id,
    name: student.name,
    registration: student.registration,
  };
}

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

function sanitizeDeviceName(value: string) {
  return value.replace(/\s+/g, " ");
}

function sanitizePairingCode(value: string) {
  return value.toUpperCase().replace(/\s+/g, "");
}

function sanitizeUserName(value: string) {
  return value.replace(/\s+/g, " ");
}

function sanitizeUserEmail(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function getDeviceName(device: Pick<Device, "bus" | "code" | "name">) {
  if (device.name?.trim()) {
    return device.name;
  }

  if (device.bus?.plate?.trim()) {
    return device.bus.plate;
  }

  if (device.code?.trim()) {
    return device.code;
  }

  return "device";
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

function getDeviceFilterForVisibility(
  isActive: boolean,
  filter: DeviceStatusFilter,
) {
  if (filter === "all") {
    return filter;
  }

  if ((filter === "active" && isActive) || (filter === "inactive" && !isActive)) {
    return filter;
  }

  return "all";
}

function getUserFilterForVisibility(
  isActive: boolean,
  filter: UserStatusFilter,
) {
  if (filter === "all") {
    return filter;
  }

  if ((filter === "active" && isActive) || (filter === "inactive" && !isActive)) {
    return filter;
  }

  return "all";
}

function roleRequiresStudentLink(role: ManagedUserRole) {
  return role === "USER" || role === "COORDINATOR";
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

async function requestDevicePage(
  page: number,
  search: string,
  active: DeviceStatusFilter,
) {
  return fetchDevices({
    active,
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
}

async function requestUserPage(
  page: number,
  search: string,
  active: UserStatusFilter,
  role: UserRoleFilter,
) {
  return fetchUsers({
    active,
    page,
    limit: PAGE_SIZE,
    role,
    search: search || undefined,
  });
}

export default function CompanyScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const primaryRole = getPrimarySessionRole(session);
  const canViewCompanyArea = canViewCompanyTab(session);
  const sessionRoles = extractSessionRoles(session);
  const isCompactRail = width < 900;
  const visibleSectionKeys = useMemo(
    () => getVisibleCompanySections(session),
    [session],
  );
  const availableSections = useMemo(
    () =>
      catalogSections.filter((section) => visibleSectionKeys.includes(section.key)),
    [visibleSectionKeys],
  );
  const companyScreenTitle =
    primaryRole === "COORDINATOR" ? "Alunos" : "Cadastros";
  const companyEmailDomain =
    typeof session?.user.emailDomain === "string" && session.user.emailDomain.trim()
      ? session.user.emailDomain.trim().toLowerCase()
      : typeof session?.company?.slug === "string" && session.company.slug.trim()
        ? session.company.slug.trim().toLowerCase()
        : null;

  const [activeSection, setActiveSection] = useState<CatalogSectionKey>(
    visibleSectionKeys[0] ?? "students",
  );

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone | null>(null);

  useEffect(() => {
    if (visibleSectionKeys.length === 0) {
      return;
    }

    if (visibleSectionKeys.includes(activeSection)) {
      return;
    }

    setActiveSection(visibleSectionKeys[0]);
  }, [activeSection, visibleSectionKeys]);

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

  const [devices, setDevices] = useState<Device[]>([]);
  const [devicePage, setDevicePage] = useState(1);
  const [deviceLastPage, setDeviceLastPage] = useState(1);
  const [totalDevices, setTotalDevices] = useState<number | null>(null);
  const [deviceSearchInput, setDeviceSearchInput] = useState("");
  const [appliedDeviceSearch, setAppliedDeviceSearch] = useState("");
  const [deviceActiveFilter, setDeviceActiveFilter] =
    useState<DeviceStatusFilter>("all");
  const [deviceFormMode, setDeviceFormMode] = useState<DeviceFormMode>("link");
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [devicePairingCodeInput, setDevicePairingCodeInput] = useState("");
  const [deviceBusIdInput, setDeviceBusIdInput] = useState("");
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingDeviceBusId, setEditingDeviceBusId] = useState<string | null>(null);
  const [editingDeviceHardwareId, setEditingDeviceHardwareId] = useState<string | null>(
    null,
  );
  const [editingDeviceCode, setEditingDeviceCode] = useState<string | null>(null);
  const [deactivatingDeviceId, setDeactivatingDeviceId] = useState<string | null>(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isSavingDevice, setIsSavingDevice] = useState(false);
  const [deviceFormErrors, setDeviceFormErrors] = useState<DeviceFormErrors>({});
  const [deviceBusOptions, setDeviceBusOptions] = useState<Bus[]>([]);
  const [hasLoadedDeviceBusOptions, setHasLoadedDeviceBusOptions] = useState(false);
  const [isLoadingDeviceBusOptions, setIsLoadingDeviceBusOptions] = useState(false);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userLastPage, setUserLastPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userSearchInput, setUserSearchInput] = useState("");
  const [appliedUserSearch, setAppliedUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<UserStatusFilter>("all");
  const [userRoleFilter, setUserRoleFilter] = useState<UserRoleFilter>("all");
  const [userNameInput, setUserNameInput] = useState("");
  const [userEmailInput, setUserEmailInput] = useState("");
  const [userPasswordInput, setUserPasswordInput] = useState("");
  const [userRoleInput, setUserRoleInput] = useState<ManagedUserRole>("ADMIN");
  const [userActiveInput, setUserActiveInput] = useState(true);
  const [userStudentIdInput, setUserStudentIdInput] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isLinkedUserProfileLocked, setIsLinkedUserProfileLocked] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [deactivatingUserId, setDeactivatingUserId] = useState<string | null>(null);
  const [userFormErrors, setUserFormErrors] = useState<UserFormErrors>({});
  const [userStudentCandidates, setUserStudentCandidates] = useState<
    UserStudentCandidate[]
  >([]);
  const [isLoadingUserStudentCandidates, setIsLoadingUserStudentCandidates] =
    useState(false);

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

  function clearDeviceFormErrors() {
    setDeviceFormErrors({});
  }

  function clearUserFormErrors() {
    setUserFormErrors({});
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

  function resetDeviceForm() {
    setDeviceFormMode("link");
    setEditingDeviceId(null);
    setEditingDeviceBusId(null);
    setEditingDeviceHardwareId(null);
    setEditingDeviceCode(null);
    setDeviceNameInput("");
    setDevicePairingCodeInput("");
    setDeviceBusIdInput("");
    clearDeviceFormErrors();
  }

  function resetUserForm() {
    setEditingUserId(null);
    setIsLinkedUserProfileLocked(false);
    setUserNameInput("");
    setUserEmailInput("");
    setUserPasswordInput("");
    setUserRoleInput("ADMIN");
    setUserActiveInput(true);
    setUserStudentIdInput("");
    setUserStudentCandidates([]);
    clearUserFormErrors();
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

  function closeDeviceModal() {
    if (isSavingDevice) {
      return;
    }

    setIsDeviceModalOpen(false);
    resetDeviceForm();
  }

  function closeUserModal() {
    if (isSavingUser) {
      return;
    }

    setIsUserModalOpen(false);
    resetUserForm();
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

  function openCreateUserModal() {
    clearFeedback();
    resetUserForm();
    setUserActiveInput(true);

    setIsUserModalOpen(true);
  }

  const ensureDeviceBusOptions = useCallback(async (force = false) => {
    if (!force && hasLoadedDeviceBusOptions) {
      return deviceBusOptions;
    }

    setIsLoadingDeviceBusOptions(true);

    try {
      const options = await fetchBusOptions(BUS_OPTIONS_LIMIT);
      setDeviceBusOptions(options);
      setHasLoadedDeviceBusOptions(true);
      return options;
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Nao foi possivel carregar os onibus do UniHub."),
      );
      return [];
    } finally {
      setIsLoadingDeviceBusOptions(false);
    }
  }, [deviceBusOptions, hasLoadedDeviceBusOptions, showFeedback]);

  const ensureUserStudentCandidates = useCallback(
    async (includeUserId?: string, force = false) => {
      if (!force && userStudentCandidates.length > 0) {
        return userStudentCandidates;
      }

      setIsLoadingUserStudentCandidates(true);

      try {
        const [candidateResponse, usersResponse] = await Promise.all([
          fetchUserStudentCandidates(includeUserId),
          fetchUsers({
            active: "all",
            limit: 1000,
            page: 1,
            role: "all",
          }),
        ]);
        const takenStudentIds = new Set(
          usersResponse.data
            .map((user) => user.studentId)
            .filter((studentId): studentId is string => Boolean(studentId)),
        );
        const candidates = candidateResponse.filter(
          (candidate) => !takenStudentIds.has(candidate.id),
        );

        setUserStudentCandidates(candidates);
        return candidates;
      } catch (error) {
        showFeedback(
          "error",
          getApiErrorMessage(
            error,
            "Nao foi possivel carregar os alunos disponiveis para usuario.",
          ),
        );
        return [];
      } finally {
        setIsLoadingUserStudentCandidates(false);
      }
    },
    [showFeedback, userStudentCandidates],
  );

  async function openCreateDeviceModal() {
    clearFeedback();
    resetDeviceForm();
    const options = await ensureDeviceBusOptions(true);

    if (options.length === 1) {
      setDeviceBusIdInput(options[0].id);
    }

    setIsDeviceModalOpen(true);
  }

  async function openEditDeviceModal(device: Device) {
    clearFeedback();
    resetDeviceForm();
    clearDeviceFormErrors();
    const options = await ensureDeviceBusOptions(true);

    setDeviceFormMode("edit");
    setEditingDeviceId(device.id);
    setEditingDeviceBusId(device.busId ?? "");
    setEditingDeviceHardwareId(device.hardwareId);
    setEditingDeviceCode(device.code ?? null);
    setDeviceNameInput(device.name?.trim() ?? "");
    setDeviceBusIdInput(device.busId ?? options[0]?.id ?? "");
    setIsDeviceModalOpen(true);
  }

  async function openEditUserModal(user: UserRecord) {
    clearFeedback();
    resetUserForm();
    clearUserFormErrors();

    const isLinkedUser = Boolean(user.studentId);
    const shouldLoadCandidates = roleRequiresStudentLink(user.role) && !isLinkedUser;
    const candidates =
      isLinkedUser && user.student
        ? [mapUserStudentToCandidate(user.student)]
        : shouldLoadCandidates
          ? await ensureUserStudentCandidates(undefined, true)
          : [];

    setEditingUserId(user.id);
    setIsLinkedUserProfileLocked(isLinkedUser);
    setUserStudentCandidates(candidates);
    setUserNameInput(user.name);
    setUserEmailInput(user.email);
    setUserPasswordInput("");
    setUserRoleInput(user.role);
    setUserActiveInput(user.active);
    setUserStudentIdInput(user.studentId ?? candidates[0]?.id ?? "");
    setIsUserModalOpen(true);
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

  function validateDeviceForm() {
    const nextErrors: DeviceFormErrors = {};
    const selectedBusId = deviceBusIdInput.trim();
    const pairingCode = sanitizePairingCode(devicePairingCodeInput).trim();
    const name = deviceNameInput.trim().replace(/\s+/g, " ");

    if (!selectedBusId) {
      nextErrors.busId = "Selecione um onibus para continuar.";
    }

    if (deviceFormMode === "link") {
      if (!pairingCode) {
        nextErrors.pairingCode = "Informe o codigo temporario do device.";
      } else if (!DEVICE_PAIRING_CODE_PATTERN.test(pairingCode)) {
        nextErrors.pairingCode = "Use um codigo temporario valido gerado pelo IoT.";
      }
    }

    if (deviceFormMode === "edit") {
      if (!name) {
        nextErrors.name = "Informe o nome exibido do device.";
      } else if (name.length < 3) {
        nextErrors.name = "Digite pelo menos 3 caracteres para o nome do device.";
      }
    }

    return {
      isValid: Object.keys(nextErrors).length === 0,
      name,
      nextErrors,
      pairingCode,
      selectedBusId,
    };
  }

  function validateUserForm() {
    const nextErrors: UserFormErrors = {};
    const expectedDomain = companyEmailDomain?.replace(/^@/, "").toLowerCase() ?? null;
    const name = userNameInput.trim().replace(/\s+/g, " ");
    const email = userEmailInput.trim().toLowerCase();
    const password = userPasswordInput.trim();
    const studentId = userStudentIdInput.trim();
    const role = userRoleInput;

    if (roleRequiresStudentLink(role)) {
      if (!studentId) {
        nextErrors.studentId =
          "Selecione o aluno que sera vinculado ao usuario deste perfil.";
      }
    } else {
      if (!name) {
        nextErrors.name = "Informe o nome do usuario.";
      } else if (name.length < 3) {
        nextErrors.name = "Digite pelo menos 3 caracteres para o nome.";
      }

      if (!email) {
        nextErrors.email = "Informe o email do usuario.";
      } else if (!USER_EMAIL_PATTERN.test(email)) {
        nextErrors.email = "Use o formato nome.sobrenome@dominio-da-empresa.";
      } else if (expectedDomain && !email.endsWith(`@${expectedDomain}`)) {
        nextErrors.email = `O email deve usar o dominio da empresa (@${expectedDomain}).`;
      }
    }

    if (!editingUserId) {
      if (!password) {
        nextErrors.password = "Defina a senha inicial do usuario.";
      } else if (password.length < USER_PASSWORD_MIN_LENGTH) {
        nextErrors.password = `Use pelo menos ${USER_PASSWORD_MIN_LENGTH} caracteres para a senha.`;
      }
    } else if (password && password.length < USER_PASSWORD_MIN_LENGTH) {
      nextErrors.password = `Use pelo menos ${USER_PASSWORD_MIN_LENGTH} caracteres para a senha.`;
    }

    return {
      email,
      isValid: Object.keys(nextErrors).length === 0,
      name,
      nextErrors,
      password,
      role,
      studentId,
    };
  }

  function selectSection(nextSection: CatalogSectionKey) {
    if (!visibleSectionKeys.includes(nextSection)) {
      return;
    }

    if (
      isSavingBus ||
      isSavingStudent ||
      isLinkingStudentRfid ||
      isSavingDevice ||
      isSavingUser
    ) {
      return;
    }

    clearFeedback();
    closeBusModal();
    closeStudentModal();
    closeStudentRfidModal();
    closeDeviceModal();
    closeUserModal();
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

  async function loadDevices(
    nextPage = devicePage,
    nextSearch = appliedDeviceSearch,
    nextFilter = deviceActiveFilter,
  ) {
    setIsLoadingDevices(true);

    try {
      const response = await requestDevicePage(nextPage, nextSearch, nextFilter);
      setDevices(response.data);
      setDeviceLastPage(Math.max(response.lastPage, 1));
      setTotalDevices(typeof response.total === "number" ? response.total : null);
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Nao foi possivel carregar os devices do UniHub."),
      );
    } finally {
      setIsLoadingDevices(false);
    }
  }

  async function loadUsers(
    nextPage = userPage,
    nextSearch = appliedUserSearch,
    nextStatus = userStatusFilter,
    nextRole = userRoleFilter,
  ) {
    setIsLoadingUsers(true);

    try {
      const response = await requestUserPage(
        nextPage,
        nextSearch,
        nextStatus,
        nextRole,
      );
      setUsers(response.data);
      setTotalUsers(response.total);
      setUserLastPage(Math.max(response.lastPage, 1));
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Nao foi possivel carregar os usuarios."),
      );
    } finally {
      setIsLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (
      !canViewCompanyArea ||
      !visibleSectionKeys.includes("buses") ||
      activeSection !== "buses"
    ) {
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
  }, [
    activeSection,
    appliedBusSearch,
    busPage,
    canViewCompanyArea,
    showFeedback,
    visibleSectionKeys,
  ]);

  useEffect(() => {
    if (
      !canViewCompanyArea ||
      !visibleSectionKeys.includes("students") ||
      activeSection !== "students"
    ) {
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
    canViewCompanyArea,
    showFeedback,
    studentActiveFilter,
    studentPage,
    visibleSectionKeys,
  ]);

  useEffect(() => {
    if (
      !canViewCompanyArea ||
      !visibleSectionKeys.includes("unihub") ||
      activeSection !== "unihub"
    ) {
      return;
    }

    let isMounted = true;
    setIsLoadingDevices(true);

    void requestDevicePage(devicePage, appliedDeviceSearch, deviceActiveFilter)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setDevices(response.data);
        setDeviceLastPage(Math.max(response.lastPage, 1));
        setTotalDevices(typeof response.total === "number" ? response.total : null);
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        showFeedback(
          "error",
          getApiErrorMessage(error, "Nao foi possivel carregar os devices do UniHub."),
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDevices(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    activeSection,
    appliedDeviceSearch,
    canViewCompanyArea,
    deviceActiveFilter,
    devicePage,
    showFeedback,
    visibleSectionKeys,
  ]);

  useEffect(() => {
    if (
      !canViewCompanyArea ||
      !visibleSectionKeys.includes("users") ||
      activeSection !== "users"
    ) {
      return;
    }

    let isMounted = true;
    setIsLoadingUsers(true);

    void requestUserPage(
      userPage,
      appliedUserSearch,
      userStatusFilter,
      userRoleFilter,
    )
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setUsers(response.data);
        setTotalUsers(response.total);
        setUserLastPage(Math.max(response.lastPage, 1));
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        showFeedback(
          "error",
          getApiErrorMessage(error, "Nao foi possivel carregar os usuarios."),
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    activeSection,
    appliedUserSearch,
    canViewCompanyArea,
    showFeedback,
    userPage,
    userRoleFilter,
    userStatusFilter,
    visibleSectionKeys,
  ]);

  useEffect(() => {
    if (
      !canViewCompanyArea ||
      !visibleSectionKeys.includes("unihub") ||
      activeSection !== "unihub"
    ) {
      return;
    }

    void ensureDeviceBusOptions();
  }, [activeSection, canViewCompanyArea, ensureDeviceBusOptions, visibleSectionKeys]);

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

  async function refreshOrMoveDevices(
    nextPage = devicePage,
    nextSearch = appliedDeviceSearch,
    nextFilter = deviceActiveFilter,
  ) {
    let shouldWaitForEffect = false;

    if (devicePage !== nextPage) {
      setDevicePage(nextPage);
      shouldWaitForEffect = true;
    }

    if (appliedDeviceSearch !== nextSearch) {
      setAppliedDeviceSearch(nextSearch);
      shouldWaitForEffect = true;
    }

    if (deviceActiveFilter !== nextFilter) {
      setDeviceActiveFilter(nextFilter);
      shouldWaitForEffect = true;
    }

    if (shouldWaitForEffect) {
      return;
    }

    await loadDevices(nextPage, nextSearch, nextFilter);
  }

  async function refreshOrMoveUsers(
    nextPage = userPage,
    nextSearch = appliedUserSearch,
    nextStatus = userStatusFilter,
    nextRole = userRoleFilter,
  ) {
    let shouldWaitForEffect = false;

    if (userPage !== nextPage) {
      setUserPage(nextPage);
      shouldWaitForEffect = true;
    }

    if (appliedUserSearch !== nextSearch) {
      setAppliedUserSearch(nextSearch);
      shouldWaitForEffect = true;
    }

    if (userStatusFilter !== nextStatus) {
      setUserStatusFilter(nextStatus);
      shouldWaitForEffect = true;
    }

    if (userRoleFilter !== nextRole) {
      setUserRoleFilter(nextRole);
      shouldWaitForEffect = true;
    }

    if (shouldWaitForEffect) {
      return;
    }

    await loadUsers(nextPage, nextSearch, nextStatus, nextRole);
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

      setHasLoadedDeviceBusOptions(false);
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

  async function handleSubmitDevice() {
    const { isValid, name, nextErrors, pairingCode, selectedBusId } =
      validateDeviceForm();

    if (!isValid) {
      setDeviceFormErrors(nextErrors);
      showFeedback("error", "Revise os campos destacados antes de salvar o device.");
      return;
    }

    const selectedBus = deviceBusOptions.find((bus) => bus.id === selectedBusId);

    setIsSavingDevice(true);
    clearFeedback();
    clearDeviceFormErrors();

    try {
      const nextVisibleFilter = getDeviceFilterForVisibility(
        true,
        deviceActiveFilter,
      );

      if (deviceFormMode === "edit" && editingDeviceId) {
        if (editingDeviceBusId !== selectedBusId) {
          await linkDeviceBus(editingDeviceId, selectedBusId);
        }

        await updateDeviceName(editingDeviceId, name);

        showFeedback(
          "success",
          `Device ${name} atualizado com sucesso.`,
        );

        setIsDeviceModalOpen(false);
        resetDeviceForm();
        await refreshOrMoveDevices(devicePage, appliedDeviceSearch, deviceActiveFilter);
        return;
      }

      await linkDevice({
        busId: selectedBusId,
        pairingCode,
      });

      showFeedback(
        "success",
        `Device vinculado com sucesso ao onibus ${selectedBus?.plate ?? "selecionado"}.`,
      );
      setIsDeviceModalOpen(false);
      resetDeviceForm();
      setDeviceSearchInput("");
      await refreshOrMoveDevices(1, "", nextVisibleFilter);
    } catch (error) {
      const message = getApiErrorMessage(error, "Nao foi possivel salvar o device.");
      const lowered = message.toLowerCase();
      const nextFormErrors: DeviceFormErrors = {
        general: message,
      };

      if (lowered.includes("codigo") || lowered.includes("temporario")) {
        nextFormErrors.pairingCode = message;
      }

      if (lowered.includes("onibus")) {
        nextFormErrors.busId = message;
      }

      if (lowered.includes("nome")) {
        nextFormErrors.name = message;
      }

      showFeedback("error", message);
      setDeviceFormErrors(nextFormErrors);
    } finally {
      setIsSavingDevice(false);
    }
  }

  async function handleSubmitUser() {
    const { email, isValid, name, nextErrors, password, role, studentId } =
      validateUserForm();

    if (!isValid) {
      setUserFormErrors(nextErrors);
      showFeedback("error", "Revise os campos destacados antes de salvar o usuario.");
      return;
    }

    setIsSavingUser(true);
    clearFeedback();
    clearUserFormErrors();

    try {
      const nextVisibleFilter = getUserFilterForVisibility(
        editingUserId ? userActiveInput : true,
        userStatusFilter,
      );

      if (editingUserId) {
        await updateUser(editingUserId, {
          active: userActiveInput,
          email: roleRequiresStudentLink(role) ? undefined : email,
          name: roleRequiresStudentLink(role) ? undefined : name,
          password: password || undefined,
          role,
          studentId: roleRequiresStudentLink(role) ? studentId : undefined,
        });

        showFeedback(
          "success",
          `Usuario ${roleRequiresStudentLink(role) ? "vinculado ao aluno" : name} atualizado com sucesso.`,
        );
      } else {
        await createUser({
          email: roleRequiresStudentLink(role) ? undefined : email,
          name: roleRequiresStudentLink(role) ? undefined : name,
          password,
          role,
          studentId: roleRequiresStudentLink(role) ? studentId : undefined,
        });

        showFeedback(
          "success",
          `Usuario ${roleRequiresStudentLink(role) ? "vinculado ao aluno" : name} cadastrado com sucesso.`,
        );
      }

      setIsUserModalOpen(false);
      resetUserForm();
      setUserSearchInput("");
      await refreshOrMoveUsers(1, "", nextVisibleFilter, userRoleFilter);
    } catch (error) {
      const message = getApiErrorMessage(error, "Nao foi possivel salvar o usuario.");
      const lowered = message.toLowerCase();
      const nextFormErrors: UserFormErrors = {
        general: message,
      };

      if (lowered.includes("email") || lowered.includes("login") || lowered.includes("dominio")) {
        nextFormErrors.email = message;
      }

      if (lowered.includes("senha")) {
        nextFormErrors.password = message;
      }

      if (lowered.includes("aluno")) {
        nextFormErrors.studentId = message;
      }

      if (lowered.includes("nome")) {
        nextFormErrors.name = message;
      }

      showFeedback("error", message);
      setUserFormErrors(nextFormErrors);
    } finally {
      setIsSavingUser(false);
    }
  }

  async function handleDeleteBus(bus: Bus) {
    setDeletingBusId(bus.id);
    clearFeedback();

    try {
      await deleteBuses([bus.id]);
      showFeedback("success", `Onibus ${bus.plate} excluido com sucesso.`);
      setHasLoadedDeviceBusOptions(false);

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

  async function handleDeactivateDevice(device: Device) {
    setDeactivatingDeviceId(device.id);
    clearFeedback();

    try {
      await deactivateDevices([device.id]);
      showFeedback("success", `Device ${getDeviceName(device)} desativado com sucesso.`);

      if (editingDeviceId === device.id) {
        resetDeviceForm();
      }

      const nextPage =
        devicePage > 1 && devices.length === 1 ? devicePage - 1 : devicePage;
      await refreshOrMoveDevices(nextPage, appliedDeviceSearch, deviceActiveFilter);
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Nao foi possivel desativar o device."),
      );
    } finally {
      setDeactivatingDeviceId(null);
    }
  }

  async function handleDeactivateUser(user: UserRecord) {
    setDeactivatingUserId(user.id);
    clearFeedback();

    try {
      await deactivateUsers([user.id]);
      showFeedback("success", `Usuario ${user.name} desativado com sucesso.`);

      if (editingUserId === user.id) {
        resetUserForm();
      }

      const nextPage = userPage > 1 && users.length === 1 ? userPage - 1 : userPage;
      await refreshOrMoveUsers(
        nextPage,
        appliedUserSearch,
        userStatusFilter,
        userRoleFilter,
      );
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Nao foi possivel desativar o usuario."),
      );
    } finally {
      setDeactivatingUserId(null);
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

  function confirmDeactivateDevice(device: Device) {
    Alert.alert(
      "Desativar device",
      `Deseja desativar o device ${getDeviceName(device)}?`,
      [
        { style: "cancel", text: "Cancelar" },
        {
          text: "Desativar",
          onPress: () => {
            void handleDeactivateDevice(device);
          },
        },
      ],
    );
  }

  function confirmDeactivateUser(user: UserRecord) {
    Alert.alert(
      "Desativar usuario",
      `Deseja desativar o usuario ${user.name}?`,
      [
        { style: "cancel", text: "Cancelar" },
        {
          text: "Desativar",
          onPress: () => {
            void handleDeactivateUser(user);
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

  function startEditingDevice(device: Device) {
    void openEditDeviceModal(device);
  }

  function startEditingUser(user: UserRecord) {
    void openEditUserModal(user);
  }

  function renderActiveSection() {
    if (!visibleSectionKeys.includes(activeSection)) {
      return null;
    }

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

    if (activeSection === "users") {
      return (
        <UsersSection
          appliedSearch={appliedUserSearch}
          companyEmailDomain={companyEmailDomain}
          currentRoleFilter={userRoleFilter}
          currentStatusFilter={userStatusFilter}
          editingUserId={editingUserId}
          feedbackMessage={feedbackMessage}
          feedbackTone={feedbackTone}
          formErrorMessage={userFormErrors.general}
          formErrors={userFormErrors}
          isLoadingStudentCandidates={isLoadingUserStudentCandidates}
          isLoadingUsers={isLoadingUsers}
          isModalOpen={isUserModalOpen}
          isSavingUser={isSavingUser || deactivatingUserId !== null}
          lastPage={userLastPage}
          onActiveInputChange={(value) => {
            clearUserFormErrors();
            setUserActiveInput(value);
          }}
          onCloseModal={closeUserModal}
          onDeactivateUser={confirmDeactivateUser}
          onEmailChange={(value) => {
            clearUserFormErrors();
            setUserEmailInput(sanitizeUserEmail(value));
          }}
          onNameChange={(value) => {
            clearUserFormErrors();
            setUserNameInput(sanitizeUserName(value));
          }}
          onOpenCreateModal={() => {
            void openCreateUserModal();
          }}
          onPageChange={(nextPage) => {
            void refreshOrMoveUsers(
              nextPage,
              appliedUserSearch,
              userStatusFilter,
              userRoleFilter,
            );
          }}
          onPasswordChange={(value) => {
            clearUserFormErrors();
            setUserPasswordInput(value);
          }}
          onRefresh={() => {
            void loadUsers(
              userPage,
              appliedUserSearch,
              userStatusFilter,
              userRoleFilter,
            );
          }}
          onRoleFilterChange={(value) => {
            clearFeedback();
            void refreshOrMoveUsers(1, appliedUserSearch, userStatusFilter, value);
          }}
          onRoleInputChange={(value) => {
            if (isLinkedUserProfileLocked && !roleRequiresStudentLink(value)) {
              return;
            }

            clearUserFormErrors();
            setUserRoleInput(value);

            if (isLinkedUserProfileLocked) {
              return;
            }

            if (!roleRequiresStudentLink(value)) {
              setUserStudentIdInput("");
              return;
            }

            void ensureUserStudentCandidates(undefined, true).then(
              (candidates) => {
                if (!editingUserId && candidates.length === 1) {
                  setUserStudentIdInput(candidates[0].id);
                }
              },
            );
          }}
          onSearch={() => {
            clearFeedback();
            void refreshOrMoveUsers(
              1,
              userSearchInput.trim(),
              userStatusFilter,
              userRoleFilter,
            );
          }}
          onStatusFilterChange={(value) => {
            clearFeedback();
            void refreshOrMoveUsers(1, appliedUserSearch, value, userRoleFilter);
          }}
          onStudentChange={(value) => {
            clearUserFormErrors();
            setUserStudentIdInput(value);
          }}
          onSubmit={() => {
            void handleSubmitUser();
          }}
          onUserEdit={startEditingUser}
          page={userPage}
          searchInput={userSearchInput}
          selectedStudentId={userStudentIdInput}
          setSearchInput={setUserSearchInput}
          isStudentLinkLocked={isLinkedUserProfileLocked}
          studentCandidates={userStudentCandidates}
          totalUsers={totalUsers}
          userActiveInput={userActiveInput}
          userEmailInput={userEmailInput}
          userNameInput={userNameInput}
          userPasswordInput={userPasswordInput}
          userRoleInput={userRoleInput}
          users={users}
        />
      );
    }

    return (
      <UniHubSection
        appliedSearch={appliedDeviceSearch}
        busOptions={deviceBusOptions}
        currentFilter={deviceActiveFilter}
        deviceBusIdInput={deviceBusIdInput}
        deviceCodePreview={editingDeviceCode}
        deviceFormMode={deviceFormMode}
        deviceHardwareIdPreview={editingDeviceHardwareId}
        deviceNameInput={deviceNameInput}
        devicePairingCodeInput={devicePairingCodeInput}
        devices={devices}
        editingDeviceId={editingDeviceId}
        feedbackMessage={feedbackMessage}
        feedbackTone={feedbackTone}
        formErrorMessage={deviceFormErrors.general}
        formErrors={deviceFormErrors}
        isLoadingBusOptions={isLoadingDeviceBusOptions}
        isLoadingDevices={isLoadingDevices}
        isModalOpen={isDeviceModalOpen}
        isSavingDevice={isSavingDevice || deactivatingDeviceId !== null}
        lastPage={deviceLastPage}
        onActiveFilterChange={(value) => {
          clearFeedback();
          void refreshOrMoveDevices(1, appliedDeviceSearch, value);
        }}
        onBusChange={(value) => {
          clearDeviceFormErrors();
          setDeviceBusIdInput(value);
        }}
        onClearSearch={() => {
          clearFeedback();
          setDeviceSearchInput("");
          void refreshOrMoveDevices(1, "", deviceActiveFilter);
        }}
        onCloseModal={closeDeviceModal}
        onDeactivateDevice={confirmDeactivateDevice}
        onDeviceNameChange={(value) => {
          clearDeviceFormErrors();
          setDeviceNameInput(sanitizeDeviceName(value));
        }}
        onEditDevice={startEditingDevice}
        onOpenCreateModal={() => {
          void openCreateDeviceModal();
        }}
        onPageChange={(nextPage) => {
          void refreshOrMoveDevices(nextPage, appliedDeviceSearch, deviceActiveFilter);
        }}
        onPairingCodeChange={(value) => {
          clearDeviceFormErrors();
          setDevicePairingCodeInput(sanitizePairingCode(value));
        }}
        onRefresh={() => {
          void ensureDeviceBusOptions(true);
          void loadDevices(devicePage, appliedDeviceSearch, deviceActiveFilter);
        }}
        onSearch={() => {
          clearFeedback();
          void refreshOrMoveDevices(1, deviceSearchInput.trim(), deviceActiveFilter);
        }}
        onSubmit={() => {
          void handleSubmitDevice();
        }}
        page={devicePage}
        searchInput={deviceSearchInput}
        setSearchInput={setDeviceSearchInput}
        totalDevices={totalDevices}
      />
    );
  }

  if (!canViewCompanyArea) {
    return (
      <SafeAreaView className="flex-1 bg-background-50">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View className="gap-5">
            <Text className="text-[32px] font-bold leading-9 text-typography-950">
              {companyScreenTitle}
            </Text>

            <View className="rounded-[28px] bg-red-50 px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-red-700">
                Acesso restrito
              </Text>
              <Text className="mt-2 text-2xl font-bold text-red-900">
                Esta area nao esta disponivel para o seu perfil.
              </Text>
              <Text className="mt-2 text-sm leading-6 text-red-700">
                Hoje, apenas ADMIN, DRIVER e COORDINATOR veem essa aba no mobile.
                USER acompanha a localizacao, e PLATFORM_ADMIN segue no fluxo da
                plataforma.
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
            {companyScreenTitle}
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
                    {availableSections.map((section) => (
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
                    {availableSections.map((section) => (
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
