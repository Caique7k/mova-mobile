import { get } from "@/services/api";
import type { Bus } from "@/services/buses";

export type LocationDevice = {
  active: boolean;
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
  secret?: string | null;
};

export type LiveTelemetry = {
  latitude: number;
  longitude: number;
  lastUpdate: string;
};

export type TelemetryPoint = {
  latitude: number;
  longitude: number;
  timestamp: string;
};

export type LiveBusState =
  | "no-buses"
  | "needs-pairing"
  | "no-online-device"
  | "live"
  | "stale";

export type LocationSummary = {
  destinationLabel: string;
  lastUpdateLabel: string;
  originLabel: string;
  speedKmh: number | null;
  statusBadge: string;
};

export type LocationViewModel = {
  linkedDevice: LocationDevice | null;
  selectedBus: Bus | null;
  state: LiveBusState;
  summary: LocationSummary;
  telemetry: LiveTelemetry | null;
  trail: TelemetryPoint[];
};

export type LiveBusResponse = {
  bus: Bus;
  linkedDevice: LocationDevice | null;
  state: Exclude<LiveBusState, "no-buses">;
  telemetry: LiveTelemetry | null;
};

export async function fetchLiveBusLocation(busId: string) {
  return get<LiveBusResponse>(`/location/buses/${busId}/live`);
}
