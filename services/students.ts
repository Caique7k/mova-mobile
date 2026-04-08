import { del, get, patch, post, put } from "@/services/api";

export type StudentRfidCard = {
  active: boolean;
  createdAt?: string;
  id: string;
  tag: string;
};

export type Student = {
  active: boolean;
  companyId: string;
  createdAt?: string;
  email?: string | null;
  id: string;
  name: string;
  phone?: string | null;
  registration: string;
  rfidCards?: StudentRfidCard[];
};

export type StudentListResponse = {
  data: Student[];
  lastPage: number;
  page: number;
  total: number;
};

export type StudentStatusFilter = "active" | "all" | "inactive";

export type CreateStudentInput = {
  active?: boolean;
  email?: string;
  name: string;
  phone?: string;
  registration: string;
};

export type UpdateStudentInput = {
  active?: boolean;
  email?: string;
  name?: string;
  phone?: string;
  registration?: string;
};

type FetchStudentsParams = {
  active?: StudentStatusFilter;
  limit?: number;
  page?: number;
  search?: string;
};

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

function normalizeTextOrUndefined(value?: string) {
  const normalized = normalizeText(value);
  return normalized ? normalized : undefined;
}

function normalizeStatusFilter(active?: StudentStatusFilter) {
  if (active === "active") {
    return "true";
  }

  if (active === "inactive") {
    return "false";
  }

  return undefined;
}

export async function fetchStudents({
  active = "all",
  limit = 10,
  page = 1,
  search,
}: FetchStudentsParams = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const activeParam = normalizeStatusFilter(active);

  if (activeParam !== undefined) {
    params.set("active", activeParam);
  }

  return get<StudentListResponse>(`/students?${params.toString()}`);
}

export async function createStudent(input: CreateStudentInput) {
  return post<Student>("/students", {
    active: input.active ?? true,
    email: normalizeTextOrUndefined(input.email),
    name: normalizeName(input.name),
    phone: normalizeTextOrUndefined(input.phone),
    registration: normalizeText(input.registration),
  });
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  return put<Student>(`/students/${id}`, {
    active: input.active,
    email: input.email !== undefined ? normalizeText(input.email) : undefined,
    name: input.name !== undefined ? normalizeName(input.name) : undefined,
    phone: input.phone !== undefined ? normalizeText(input.phone) : undefined,
    registration:
      input.registration !== undefined
        ? normalizeText(input.registration)
        : undefined,
  });
}

export async function deleteStudents(ids: string[]) {
  return del<{ count: number }>("/students", { ids });
}

export async function deactivateStudents(ids: string[]) {
  return patch<{ count: number }>("/students/desactivate", { ids });
}
