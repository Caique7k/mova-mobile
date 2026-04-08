import { del, get, post, put } from "@/services/api";

export type Bus = {
  id: string;
  plate: string;
  capacity: number;
  companyId: string;
  createdAt?: string;
};

export type BusListResponse = {
  data: Bus[];
  total: number;
  lastPage: number;
};

export type CreateBusInput = {
  plate: string;
  capacity: number;
};

export type UpdateBusInput = Partial<CreateBusInput>;

type FetchBusesParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function fetchBuses({
  limit = 10,
  page = 1,
  search,
}: FetchBusesParams = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  return get<BusListResponse>(`/buses?${params.toString()}`);
}

export async function createBus(input: CreateBusInput) {
  return post<Bus>("/buses", {
    ...input,
    plate: input.plate.trim().toUpperCase(),
  });
}

export async function updateBus(id: string, input: UpdateBusInput) {
  return put<Bus>(`/buses/${id}`, {
    ...input,
    plate: input.plate?.trim().toUpperCase(),
  });
}

export async function deleteBuses(ids: string[]) {
  return del<{ count: number }>("/buses", { ids });
}
