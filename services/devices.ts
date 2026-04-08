import { del, get, patch, post } from "@/services/api";
import type { Bus } from "@/services/buses";

export type DeviceStatusFilter = "active" | "all" | "inactive";

export type Device = {
  active: boolean;
  bus?: Bus | null;
  busId?: string | null;
  code?: string | null;
  companyId?: string | null;
  createdAt?: string;
  hardwareId: string;
  id: string;
  lastLat?: number | null;
  lastLng?: number | null;
  lastUpdate?: string | null;
  name?: string | null;
  pairedAt?: string | null;
  pairingCode?: string | null;
  pairingCodeExpiresAt?: string | null;
  secret?: string | null;
};

export type DeviceListResponse = {
  data: Device[];
  lastPage: number;
  total?: number;
};

export type LinkDeviceInput = {
  busId: string;
  pairingCode: string;
};

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

function normalizeStatusFilter(active?: DeviceStatusFilter) {
  if (active === "active") {
    return "true";
  }

  if (active === "inactive") {
    return "false";
  }

  return undefined;
}

type FetchDevicesParams = {
  active?: DeviceStatusFilter;
  limit?: number;
  page?: number;
  search?: string;
};

export async function fetchDevices({
  active = "all",
  limit = 10,
  page = 1,
  search,
}: FetchDevicesParams = {}) {
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

  return get<DeviceListResponse>(`/devices?${params.toString()}`);
}

export async function linkDevice(input: LinkDeviceInput) {
  return post<Device>("/devices/link", {
    busId: input.busId,
    pairingCode: normalizeText(input.pairingCode).toUpperCase(),
  });
}

export async function updateDeviceName(id: string, name: string) {
  return patch<Device>(`/devices/${id}`, {
    name: normalizeText(name),
  });
}

export async function linkDeviceBus(id: string, busId: string) {
  return patch<Device>(`/devices/${id}/bus`, { busId });
}

export async function deactivateDevices(ids: string[]) {
  return del<{ count: number }>("/devices", { ids });
}
