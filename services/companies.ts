import { get, patch } from "@/services/api";

export type CompanyProfile = {
  _count?: {
    buses: number;
    devices: number;
    students: number;
    users: number;
  };
  cnpj: string;
  contactName?: string | null;
  contactPhone?: string | null;
  createdAt: string;
  emailDomain: string;
  id: string;
  name: string;
  plan: string;
  smsVerifiedAt?: string | null;
};

export type UpdateCompanyProfileInput = {
  cnpj: string;
  contactName?: string;
  contactPhone?: string;
  name: string;
};

export function fetchMyCompanyProfile() {
  return get<CompanyProfile>("/companies/me");
}

export function updateMyCompanyProfile(input: UpdateCompanyProfileInput) {
  return patch<CompanyProfile>("/companies/me", input);
}
