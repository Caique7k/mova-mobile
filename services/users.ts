import { get, patch, post } from "@/services/api";
import type { UserRole } from "@/services/auth";

export type ManagedUserRole = Exclude<UserRole, "PLATFORM_ADMIN">;
export type UserStatusFilter = "active" | "all" | "inactive";
export type UserRoleFilter = ManagedUserRole | "all";

export type UserStudentSummary = {
  active: boolean;
  email: string | null;
  id: string;
  name: string;
  registration: string;
};

export type UserRecord = {
  active: boolean;
  createdAt?: string;
  email: string;
  id: string;
  name: string;
  role: ManagedUserRole;
  student?: UserStudentSummary | null;
  studentId?: string | null;
};

export type UserStudentCandidate = {
  email: string | null;
  id: string;
  name: string;
  registration: string;
};

export type UserListResponse = {
  data: UserRecord[];
  lastPage: number;
  page: number;
  total: number;
};

export type CreateUserInput = {
  email?: string;
  name?: string;
  password: string;
  role: ManagedUserRole;
  studentId?: string;
};

export type UpdateUserInput = {
  active?: boolean;
  email?: string;
  name?: string;
  password?: string;
  role?: ManagedUserRole;
  studentId?: string;
};

type FetchUsersParams = {
  active?: UserStatusFilter;
  limit?: number;
  page?: number;
  role?: UserRoleFilter;
  search?: string;
};

function normalizeName(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function normalizeNameOrUndefined(value?: string) {
  const normalized = normalizeName(value);
  return normalized ? normalized : undefined;
}

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

function normalizeTextOrUndefined(value?: string) {
  const normalized = normalizeText(value);
  return normalized ? normalized : undefined;
}

function normalizeStatusFilter(active?: UserStatusFilter) {
  if (active === "active") {
    return "true";
  }

  if (active === "inactive") {
    return "false";
  }

  return undefined;
}

export async function fetchUsers({
  active = "all",
  limit = 10,
  page = 1,
  role = "all",
  search,
}: FetchUsersParams = {}) {
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

  if (role !== "all") {
    params.set("role", role);
  }

  return get<UserListResponse>(`/users?${params.toString()}`);
}

export async function fetchUserStudentCandidates(includeUserId?: string) {
  const params = new URLSearchParams();

  if (includeUserId?.trim()) {
    params.set("includeUserId", includeUserId.trim());
  }

  const query = params.toString();
  return get<UserStudentCandidate[]>(
    `/students/user-candidates/list${query ? `?${query}` : ""}`,
  );
}

export async function createUser(input: CreateUserInput) {
  return post<UserRecord>("/users", {
    email: normalizeTextOrUndefined(input.email),
    name: normalizeNameOrUndefined(input.name),
    password: normalizeText(input.password),
    role: input.role,
    studentId: normalizeTextOrUndefined(input.studentId),
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  return patch<UserRecord>(`/users/${id}`, {
    active: input.active,
    email: input.email !== undefined ? normalizeText(input.email) : undefined,
    name: input.name !== undefined ? normalizeName(input.name) : undefined,
    password:
      input.password !== undefined ? normalizeTextOrUndefined(input.password) : undefined,
    role: input.role,
    studentId:
      input.studentId !== undefined ? normalizeTextOrUndefined(input.studentId) : undefined,
  });
}

export async function deactivateUsers(ids: string[]) {
  return patch<{ count: number }>("/users/deactivate", { ids });
}
