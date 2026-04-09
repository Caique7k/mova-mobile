import { LucideIcon } from "@/components/ui/lucide-icon";
import type { TelemetryPoint } from "@/services/location";
import { LocateFixed } from "lucide";
import { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

const DEFAULT_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function LiveBusMap({
  lastUpdateLabel,
  latitude,
  longitude,
  plate,
  stale,
  trail,
}: {
  lastUpdateLabel: string;
  latitude: number;
  longitude: number;
  plate: string;
  stale: boolean;
  trail: TelemetryPoint[];
}) {
  const mapRef = useRef<MapView | null>(null);

  const region = useMemo(
    () => ({
      latitude,
      longitude,
      ...DEFAULT_DELTA,
    }),
    [latitude, longitude],
  );
  const trailCoordinates = useMemo(
    () =>
      trail.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })),
    [trail],
  );

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 900);
  }, [region]);

  return (
    <View style={styles.shell}>
      <MapView
        ref={mapRef}
        initialRegion={region}
        style={StyleSheet.absoluteFill}
        loadingEnabled
        mapPadding={{ bottom: 24, left: 24, right: 24, top: 24 }}
        rotateEnabled={false}
        showsBuildings
        showsCompass={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {trailCoordinates.length > 1 ? (
          <Polyline
            coordinates={trailCoordinates}
            strokeColor="#FC7C3A"
            strokeWidth={5}
          />
        ) : null}

        <Marker coordinate={{ latitude, longitude }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.markerOuter}>
            <View style={styles.markerPulse} />
            <View style={styles.markerPin}>
              <View style={styles.markerCore} />
            </View>
          </View>
        </Marker>
      </MapView>

      <View style={styles.topFade} />

      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Navegacao UniPass</Text>
        <Text style={styles.plate}>{plate}</Text>
        <Text style={styles.subtleText}>
          {stale
            ? `Ultima posicao conhecida as ${lastUpdateLabel}`
            : `Atualizacao ao vivo as ${lastUpdateLabel}`}
        </Text>
      </View>

      <View style={styles.topRightGroup}>
        <View
          style={[
            styles.badge,
            stale ? styles.badgeWarning : styles.badgeSuccess,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              stale ? styles.badgeWarningText : styles.badgeSuccessText,
            ]}
          >
            {stale ? "Ultima posicao" : "Ao vivo"}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Centralizar mapa"
          onPress={() => {
            mapRef.current?.animateToRegion(region, 900);
          }}
          style={styles.centerButton}
        >
          <LucideIcon color="#0f172a" icon={LocateFixed} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
  },
  badgeSuccessText: {
    color: "#15803d",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeWarning: {
    backgroundColor: "#fef3c7",
  },
  badgeWarningText: {
    color: "#b45309",
  },
  centerButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 18,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  headerCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    left: 16,
    maxWidth: 220,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "absolute",
    top: 16,
  },
  kicker: {
    color: "#FC7C3A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  markerCore: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  markerOuter: {
    alignItems: "center",
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  markerPin: {
    alignItems: "center",
    backgroundColor: "#FC7C3A",
    borderColor: "#ffffff",
    borderRadius: 999,
    borderWidth: 3,
    elevation: 6,
    height: 28,
    justifyContent: "center",
    shadowColor: "#FC7C3A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    width: 28,
  },
  markerPulse: {
    backgroundColor: "rgba(252,124,58,0.20)",
    borderRadius: 999,
    height: 52,
    position: "absolute",
    width: 52,
  },
  overlayCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  overlayLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  overlayLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  overlayValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },
  plate: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  shell: {
    backgroundColor: "#d9ddd3",
    borderRadius: 28,
    height: 400,
    overflow: "hidden",
    position: "relative",
  },
  subtleText: {
    color: "#475569",
    fontSize: 12,
    marginTop: 6,
  },
  topFade: {
    backgroundColor: "rgba(15,23,42,0.14)",
    height: 120,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  topRightGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    position: "absolute",
    right: 16,
    top: 16,
  },
});
