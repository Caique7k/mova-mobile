import { fetchBusOptions, type Bus } from "@/services/buses";
import {
  fetchLiveBusLocation,
  type LiveBusResponse,
  type LocationViewModel,
  type TelemetryPoint,
} from "@/services/location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BUS_OPTIONS_LIMIT = 100;
const MAX_TRAIL_POINTS = 24;
const POLLING_INTERVAL_MS = 5000;

function samePoint(a: TelemetryPoint, b: TelemetryPoint) {
  return a.latitude === b.latitude && a.longitude === b.longitude && a.timestamp === b.timestamp;
}

function toTelemetryPoint(response: LiveBusResponse): TelemetryPoint | null {
  if (!response.telemetry) {
    return null;
  }

  return {
    latitude: response.telemetry.latitude,
    longitude: response.telemetry.longitude,
    timestamp: response.telemetry.lastUpdate,
  };
}

function haversineKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const factor =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(factor), Math.sqrt(1 - factor)));
}

function formatCoordinate(point?: TelemetryPoint) {
  if (!point) {
    return "-";
  }

  return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
}

function buildSummary(
  state: LocationViewModel["state"],
  trail: TelemetryPoint[],
): LocationViewModel["summary"] {
  const origin = trail[0];
  const destination = trail[trail.length - 1];
  const previous = trail[trail.length - 2];

  let speedKmh: number | null = null;

  if (previous && destination) {
    const distanceKm = haversineKm(
      previous.latitude,
      previous.longitude,
      destination.latitude,
      destination.longitude,
    );
    const elapsedMs =
      new Date(destination.timestamp).getTime() -
      new Date(previous.timestamp).getTime();

    if (elapsedMs > 0) {
      speedKmh = Number((distanceKm / (elapsedMs / 3_600_000)).toFixed(1));
    }
  }

  return {
    destinationLabel: formatCoordinate(destination),
    lastUpdateLabel: destination
      ? new Date(destination.timestamp).toLocaleTimeString("pt-BR")
      : "-",
    originLabel: formatCoordinate(origin),
    speedKmh:
      speedKmh !== null && Number.isFinite(speedKmh) ? speedKmh : null,
    statusBadge:
      state === "live"
        ? "Ao vivo"
        : state === "stale"
          ? "Ultima posicao"
          : "Aguardando dados",
  };
}

function buildEmptyViewModel(): LocationViewModel {
  return {
    linkedDevice: null,
    selectedBus: null,
    state: "no-buses",
    summary: buildSummary("no-buses", []),
    telemetry: null,
    trail: [],
  };
}

export function useLiveLocation() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [viewModel, setViewModel] = useState<LocationViewModel>(buildEmptyViewModel);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trailByBusRef = useRef<Record<string, TelemetryPoint[]>>({});

  const applyLiveResponse = useCallback((response: LiveBusResponse) => {
    const busId = response.bus.id;
    const nextPoint = toTelemetryPoint(response);
    const currentTrail = trailByBusRef.current[busId] ?? [];

    let nextTrail = currentTrail;

    if (nextPoint) {
      const lastPoint = currentTrail[currentTrail.length - 1];

      nextTrail =
        lastPoint && samePoint(lastPoint, nextPoint)
          ? currentTrail
          : [...currentTrail, nextPoint].slice(-MAX_TRAIL_POINTS);
      trailByBusRef.current[busId] = nextTrail;
    }

    setViewModel({
      linkedDevice: response.linkedDevice,
      selectedBus: response.bus,
      state: response.state,
      summary: buildSummary(response.state, nextTrail),
      telemetry: response.telemetry,
      trail: nextTrail,
    });
  }, []);

  const syncBuses = useCallback(async (preferredBusId?: string) => {
    const nextBuses = await fetchBusOptions(BUS_OPTIONS_LIMIT);
    setBuses(nextBuses);

    const resolvedBusId =
      preferredBusId && nextBuses.some((bus) => bus.id === preferredBusId)
        ? preferredBusId
        : nextBuses[0]?.id ?? "";

    setSelectedBusId(resolvedBusId);

    if (!resolvedBusId) {
      setViewModel(buildEmptyViewModel());
    }

    return {
      nextBuses,
      resolvedBusId,
    };
  }, []);

  const loadBusLocation = useCallback(
    async (busId: string) => {
      const response = await fetchLiveBusLocation(busId);
      applyLiveResponse(response);
    },
    [applyLiveResponse],
  );

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setIsRefreshing(true);

      const { resolvedBusId } = await syncBuses(selectedBusId);

      if (!resolvedBusId) {
        return;
      }

      await loadBusLocation(resolvedBusId);
    } catch (nextError) {
      console.error("Erro ao atualizar a localizacao:", nextError);
      setError("Nao foi possivel carregar a localizacao dos onibus.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [loadBusLocation, selectedBusId, syncBuses]);

  const loadInitialState = useCallback(async () => {
    try {
      setError(null);
      const { resolvedBusId } = await syncBuses();

      if (!resolvedBusId) {
        return;
      }

      await loadBusLocation(resolvedBusId);
    } catch (nextError) {
      console.error("Erro ao carregar a visao inicial de localizacao:", nextError);
      setError("Nao foi possivel carregar a localizacao dos onibus.");
    } finally {
      setLoading(false);
    }
  }, [loadBusLocation, syncBuses]);

  useEffect(() => {
    void loadInitialState();
  }, [loadInitialState]);

  useEffect(() => {
    if (!selectedBusId) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function pollSelectedBus() {
      try {
        setError(null);
        const response = await fetchLiveBusLocation(selectedBusId);

        if (isCancelled) {
          return;
        }

        applyLiveResponse(response);
      } catch (nextError) {
        if (isCancelled) {
          return;
        }

        console.error("Erro ao buscar localizacao ao vivo:", nextError);
        setError("Nao foi possivel atualizar a localizacao em tempo real.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    if (!trailByBusRef.current[selectedBusId]) {
      trailByBusRef.current[selectedBusId] = [];
    }

    void pollSelectedBus();
    const intervalId = setInterval(() => {
      void pollSelectedBus();
    }, POLLING_INTERVAL_MS);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [applyLiveResponse, selectedBusId]);

  const selectedBus = useMemo(
    () => buses.find((bus) => bus.id === selectedBusId) ?? null,
    [buses, selectedBusId],
  );

  return {
    buses,
    error,
    isRefreshing,
    loading,
    refresh,
    selectedBus,
    selectedBusId,
    setSelectedBusId,
    viewModel,
  };
}
