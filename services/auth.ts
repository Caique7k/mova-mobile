import { ApiError, get, post } from "@/services/api";

export type LoginCredentials = {
  email: string;
  password: string;
};

type JsonRecord = Record<string, unknown>;
type CompanySource = JsonRecord | string | number | null | undefined;

export type CompanyInfo = {
  id?: string | null;
  name: string;
  slug?: string | null;
};

export type TokenPayload = JsonRecord;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailDomain?: string | null;
  company?: CompanySource;
  companyId?: string | number | null;
  companyName?: string | null;
  empresa?: CompanySource;
  organization?: CompanySource;
  organizationId?: string | number | null;
  organizationName?: string | null;
  tenant?: CompanySource;
  tenantId?: string | number | null;
  tenantName?: string | null;
  [key: string]: unknown;
};

export type AuthSession = {
  authMode: "bearer" | "cookie";
  company: CompanyInfo | null;
  token: string | null;
  tokenPayload: TokenPayload | null;
  user: AuthUser;
};

export type UserRole =
  | "PLATFORM_ADMIN"
  | "ADMIN"
  | "DRIVER"
  | "USER"
  | "COORDINATOR";

const companyAdminRoles = ["ADMIN"] as const;
const operationsRoles = ["ADMIN", "COORDINATOR", "DRIVER"] as const;
const platformAdminRoles = ["PLATFORM_ADMIN"] as const;
const studentRoles = ["USER"] as const;
const rolePriority: UserRole[] = [
  "PLATFORM_ADMIN",
  "ADMIN",
  "COORDINATOR",
  "DRIVER",
  "USER",
];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function normalizeRoleName(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.toUpperCase().replace(/^ROLE_/, "");
}

function uniqueStrings(values: string[]) {
  return values.filter((value, index, list) => list.indexOf(value) === index);
}

function parseRoleCandidate(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(value.flatMap((item) => parseRoleCandidate(item)));
  }

  if (typeof value === "string") {
    return uniqueStrings(
      value
        .split(/[\s,;|]+/)
        .map((part) => normalizeRoleName(part))
        .filter((part): part is string => Boolean(part)),
    );
  }

  if (!isRecord(value)) {
    return [];
  }

  return uniqueStrings(
    [
      value.role,
      value.roles,
      value.perfil,
      value.perfis,
      value.name,
      value.code,
      value.slug,
      value.value,
      value.label,
    ].flatMap((item) => parseRoleCandidate(item)),
  );
}

export function extractSessionRoles(session: AuthSession | null) {
  if (!session) {
    return [];
  }

  const nestedRecords = collectNestedRecords([
    session.user ?? null,
    session.tokenPayload ?? null,
  ]);

  const roleCandidates = nestedRecords.flatMap((record) =>
    [
      record.role,
      record.roles,
      record.perfil,
      record.perfis,
      record.authority,
      record.authorities,
    ].flatMap((item) => parseRoleCandidate(item)),
  );

  return uniqueStrings(roleCandidates);
}

function hasSessionRole(
  session: AuthSession | null,
  allowedRoles: readonly UserRole[],
  fallbackWhenMissingRoles = false,
) {
  const roles = extractSessionRoles(session);

  if (roles.length === 0) {
    return fallbackWhenMissingRoles;
  }

  return roles.some((role) =>
    allowedRoles.includes(
      role as UserRole,
    ),
  );
}

export function getPrimarySessionRole(session: AuthSession | null): UserRole | null {
  const roles = extractSessionRoles(session) as UserRole[];

  for (const role of rolePriority) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return null;
}

export function canViewOperations(session: AuthSession | null) {
  return hasSessionRole(session, operationsRoles, true);
}

export function canManageCompany(session: AuthSession | null) {
  return hasSessionRole(session, companyAdminRoles, false);
}

export function isPlatformAdmin(session: AuthSession | null) {
  return hasSessionRole(session, platformAdminRoles, false);
}

export function isStudentUser(session: AuthSession | null) {
  return hasSessionRole(session, studentRoles, false);
}

export function shouldShowRoleHub(session: AuthSession | null) {
  const primaryRole = getPrimarySessionRole(session);
  return primaryRole === "PLATFORM_ADMIN" || primaryRole === "USER";
}

export function canAccessDashboard(session: AuthSession | null) {
  return canViewOperations(session);
}

export function getDefaultAuthorizedRoute(session: AuthSession | null) {
  const primaryRole = getPrimarySessionRole(session);

  if (primaryRole === "PLATFORM_ADMIN" || primaryRole === "USER") {
    return "/(tabs)/explore" as const;
  }

  if (canViewOperations(session)) {
    return "/(tabs)" as const;
  }

  if (canManageCompany(session)) {
    return "/(tabs)/empresa" as const;
  }

  return "/(tabs)/explore" as const;
}

function getFirstString(source: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(source[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function getFirstValue(sources: JsonRecord[], keys: string[]): unknown {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];

      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }

  return undefined;
}

function collectPayloads(input: unknown): JsonRecord[] {
  if (!isRecord(input)) {
    return [];
  }

  const payloads: JsonRecord[] = [input];
  const queue: JsonRecord[] = [input];
  const nestedKeys = ["data", "result", "payload", "body", "response"];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    for (const key of nestedKeys) {
      const nested = current[key];

      if (!isRecord(nested) || payloads.includes(nested)) {
        continue;
      }

      payloads.push(nested);
      queue.push(nested);
    }
  }

  return payloads;
}

function collectNestedRecords(input: unknown, maxDepth = 4): JsonRecord[] {
  const records: JsonRecord[] = [];
  const queue: Array<{ depth: number; value: unknown }> = [{ depth: 0, value: input }];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || current.depth > maxDepth) {
      continue;
    }

    if (isRecord(current.value)) {
      if (!records.includes(current.value)) {
        records.push(current.value);
      }

      for (const value of Object.values(current.value)) {
        if (isRecord(value) || Array.isArray(value)) {
          queue.push({ depth: current.depth + 1, value });
        }
      }

      continue;
    }

    if (Array.isArray(current.value)) {
      for (const item of current.value) {
        if (isRecord(item) || Array.isArray(item)) {
          queue.push({ depth: current.depth + 1, value: item });
        }
      }
    }
  }

  return records;
}

function normalizeBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = padded.length % 4;

  if (remainder === 0) {
    return padded;
  }

  return `${padded}${"=".repeat(4 - remainder)}`;
}

function decodeBase64Url(value: string) {
  const normalized = normalizeBase64Url(value);
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  let buffer = 0;
  let bits = 0;
  let output = "";

  for (const char of normalized) {
    if (char === "=") {
      break;
    }

    const index = alphabet.indexOf(char);

    if (index < 0) {
      continue;
    }

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  try {
    return decodeURIComponent(
      output
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
  } catch {
    return output;
  }
}

export function decodeJwtPayload(token?: string | null): TokenPayload | null {
  if (typeof token !== "string" || !token.trim()) {
    return null;
  }

  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const decoded = decodeBase64Url(payload);
    const parsed = JSON.parse(decoded);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeUser(value: unknown, sources: JsonRecord[], token?: string | null) {
  const userRecord = isRecord(value) ? value : {};
  const tokenPayload = decodeJwtPayload(token);

  const id =
    getFirstString(userRecord, ["id", "userId", "sub"]) ??
    getFirstString(tokenPayload ?? {}, ["sub", "id", "userId"]) ??
    "";

  const email =
    getFirstString(userRecord, ["email", "mail", "userEmail"]) ??
    getFirstString(tokenPayload ?? {}, ["email", "mail"]) ??
    getFirstString(sources[0] ?? {}, ["email", "mail", "userEmail"]) ??
    "";

  const name =
    getFirstString(userRecord, ["name", "fullName", "username", "userName", "nome"]) ??
    getFirstString(tokenPayload ?? {}, ["name", "preferred_username", "username"]) ??
    email ??
    "Usuario";

  const emailDomain =
    getFirstString(userRecord, ["emailDomain", "email_domain", "domain"]) ??
    getFirstString(tokenPayload ?? {}, ["emailDomain", "email_domain", "domain"]) ??
    getFirstString(sources[0] ?? {}, ["emailDomain", "email_domain", "domain"]);

  return {
    ...userRecord,
    id,
    name,
    email,
    emailDomain,
  } as AuthUser;
}

function normalizeCompany(value: CompanySource): CompanyInfo | null {
  if (typeof value === "string" || typeof value === "number") {
    const name = String(value).trim();
    return name ? { name } : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const name = getFirstString(value, [
    "name",
    "nome",
    "displayName",
    "companyName",
    "tenantName",
    "organizationName",
    "empresa",
    "tradeName",
    "fantasyName",
    "corporateName",
    "razaoSocial",
    "label",
    "title",
    "description",
    "clientName",
    "customerName",
    "schoolName",
    "unitName",
    "slug",
    "code",
  ]);

  if (!name) {
    return null;
  }

  const id = getFirstString(value, [
    "id",
    "companyId",
    "company_id",
    "tenantId",
    "tenant_id",
    "organizationId",
    "organization_id",
    "orgId",
    "clientId",
    "customerId",
    "unitId",
  ]);

  const slug = getFirstString(value, ["slug", "code", "identifier", "codigo"]);

  return {
    id: id ?? null,
    name,
    slug: slug ?? null,
  };
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCompanyNameFromDomain(domain: string | null) {
  const normalized = asString(domain)?.replace(/^@/, "").toLowerCase();

  if (!normalized) {
    return null;
  }

  const host = normalized.includes("@")
    ? normalized.split("@").pop() ?? normalized
    : normalized;

  const primarySegment = host.split(".").find(Boolean) ?? host;
  const readable = primarySegment.replace(/[-_]+/g, " ").trim();

  if (!readable) {
    return host;
  }

  return toTitleCase(readable);
}

function extractCompanyFallback(
  sources: JsonRecord[],
  user: AuthUser,
  token?: string | null,
): CompanyInfo | null {
  const tokenPayload = decodeJwtPayload(token);
  const fallbackSources = [
    ...sources,
    user,
    ...(tokenPayload ? [tokenPayload] : []),
  ].filter((source, index, list) => list.indexOf(source) === index);

  const emailDomain = asString(
    getFirstValue(fallbackSources, [
      "emailDomain",
      "email_domain",
      "companyDomain",
      "company_domain",
      "domain",
    ]),
  );

  const companyId = asString(
    getFirstValue(fallbackSources, [
      "companyId",
      "company_id",
      "organizationId",
      "organization_id",
      "tenantId",
      "tenant_id",
      "orgId",
      "clientId",
      "customerId",
      "unitId",
    ]),
  );

  if (!emailDomain && !companyId) {
    return null;
  }

  return {
    id: companyId ?? null,
    name:
      formatCompanyNameFromDomain(emailDomain) ??
      (companyId ? `Empresa ${companyId}` : "Empresa vinculada"),
    slug: emailDomain ?? null,
  };
}

function extractCompanyInfoFromSources(
  sources: JsonRecord[],
  user: AuthUser,
  token?: string | null,
): CompanyInfo | null {
  const tokenPayload = decodeJwtPayload(token);
  const nestedRecords = [
    ...sources.flatMap((source) => collectNestedRecords(source)),
    ...collectNestedRecords(user),
    ...collectNestedRecords(tokenPayload),
  ].filter((record, index, list) => list.indexOf(record) === index);

  const directCandidates: CompanySource[] = [
    getFirstValue(sources, [
      "company",
      "empresa",
      "tenant",
      "organization",
      "client",
      "cliente",
      "customer",
      "unit",
      "unidade",
      "school",
      "escola",
    ]) as CompanySource,
    getFirstValue(sources, [
      "companyName",
      "company_name",
      "tenantName",
      "organizationName",
      "clientName",
      "customerName",
      "nomeEmpresa",
      "razaoSocial",
      "fantasyName",
      "tradeName",
      "schoolName",
      "unitName",
    ]) as CompanySource,
    user.company,
    user.empresa,
    user.tenant,
    user.organization,
    user.companyName,
    user.tenantName,
    user.organizationName,
    tokenPayload?.company as CompanySource,
    tokenPayload?.empresa as CompanySource,
    tokenPayload?.tenant as CompanySource,
    tokenPayload?.organization as CompanySource,
    tokenPayload?.org as CompanySource,
    tokenPayload?.companyName as CompanySource,
    tokenPayload?.tenantName as CompanySource,
    tokenPayload?.organizationName as CompanySource,
    tokenPayload?.orgName as CompanySource,
  ];

  for (const candidate of directCandidates) {
    const company = normalizeCompany(candidate);

    if (company) {
      return company;
    }
  }

  for (const record of nestedRecords) {
    const hasCompanySignal = [
      "company",
      "companyName",
      "company_id",
      "companyId",
      "empresa",
      "tenant",
      "organization",
      "client",
      "cliente",
      "customer",
      "school",
      "unit",
      "unidade",
      "profile",
      "profiles",
      "perfil",
      "perfis",
      "role",
      "roles",
      "membership",
      "memberships",
      "workspace",
    ].some((key) => key in record);

    if (!hasCompanySignal) {
      continue;
    }

    const company = normalizeCompany(record);

    if (company) {
      return company;
    }
  }

  return extractCompanyFallback(sources, user, token);
}

function createSession(
  user: AuthUser,
  sources: JsonRecord[],
  token: string | null,
  authMode: "bearer" | "cookie",
): AuthSession {
  return {
    authMode,
    company: extractCompanyInfoFromSources(sources, user, token),
    token,
    tokenPayload: decodeJwtPayload(token),
    user,
  };
}

function normalizeBearerLoginResponse(input: unknown): AuthSession | null {
  const payloads = collectPayloads(input);
  const token = asString(
    getFirstValue(payloads, [
      "token",
      "accessToken",
      "access_token",
      "jwt",
      "idToken",
      "id_token",
    ]),
  );

  if (!token) {
    return null;
  }

  const rawUser = getFirstValue(payloads, ["user", "usuario", "profile", "me"]);
  const user = normalizeUser(rawUser, payloads, token);

  return createSession(user, payloads, token, "bearer");
}

function normalizeMeResponse(input: unknown): AuthSession {
  const payloads = collectPayloads(input);

  if (payloads.length === 0) {
    throw new Error("Resposta invalida de /auth/me.");
  }

  const rawUser =
    getFirstValue(payloads, ["user", "usuario", "profile", "me"]) ?? payloads[0];
  const user = normalizeUser(rawUser, payloads, null);

  return createSession(user, payloads, null, "cookie");
}

export async function getCurrentSession() {
  const response = await get<unknown>("/auth/me");
  return normalizeMeResponse(response);
}

export async function login(credentials: LoginCredentials) {
  const response = await post<unknown>("/auth/login", credentials);
  const bearerSession = normalizeBearerLoginResponse(response);

  if (bearerSession) {
    return bearerSession;
  }

  try {
    return await getCurrentSession();
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) {
      throw new Error(
        "Login aceito, mas a sessao nao foi recuperada em /auth/me. Verifique cookies, CORS com credentials e envio do cookie no app.",
      );
    }

    throw error;
  }
}

export async function logout() {
  return post<{ success: boolean }>("/auth/logout");
}

export async function checkHealth() {
  try {
    return await get<{ message: string }>("/health");
  } catch (error) {
    if (error instanceof Error && (error as any).status === 404) {
      const root = await get<{ message?: string }>("/");
      return { message: root.message ?? "Backend acessivel (root)." };
    }

    throw error;
  }
}
