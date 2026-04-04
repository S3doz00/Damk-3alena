import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Hospital } from "@/constants/hospitals";
import { useHospitals } from "@/lib/hooks";

const LEVEL_COLORS = {
  critical: "#C0392B",
  low: "#E67E22",
  moderate: "#F39C12",
  adequate: "#27AE60",
};

const LEVEL_LABELS = {
  critical: "Critical",
  low: "Low",
  moderate: "Moderate",
  adequate: "Adequate",
};

function BloodNeedDot({ level }: { level: keyof typeof LEVEL_COLORS }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LEVEL_COLORS[level] }} />
    </View>
  );
}

function HospitalMapCard({ hospital, onDonate }: { hospital: Hospital; onDonate: () => void }) {
  const { colors } = useTheme();
  const criticalNeeds = hospital.bloodNeeds.filter((n) => n.level === "critical");
  const hasCritical = criticalNeeds.length > 0;

  const styles = StyleSheet.create({
    mapCard: {
      backgroundColor: colors.card, borderRadius: 20,
      padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
      borderWidth: 1, borderColor: colors.separator,
    },
    criticalBadge: {
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: colors.primary, borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 10,
    },
    criticalBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
    mapCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
    mapCardPin: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center",
    },
    hospitalName: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 2 },
    hospitalAddress: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
    metaRow: { flexDirection: "row", gap: 14 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
    needsRow: { flexDirection: "row", gap: 6, marginBottom: 14, flexWrap: "wrap" },
    needChip: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
      backgroundColor: colors.inputBg, borderWidth: 1.5,
    },
    needType: { fontSize: 12, fontWeight: "700" },
    needChipMore: {
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
      backgroundColor: colors.inputBg, borderWidth: 1.5,
      borderColor: colors.inputBorder, alignItems: "center", justifyContent: "center",
    },
    needChipMoreText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
    donateBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      backgroundColor: colors.primary, paddingVertical: 13, borderRadius: 14, gap: 8,
    },
    donateBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  });

  return (
    <TouchableOpacity
      style={styles.mapCard}
      onPress={() => router.push({ pathname: "/hospital/[id]", params: { id: hospital.id } })}
      activeOpacity={0.85}
    >
      {hasCritical && (
        <View style={styles.criticalBadge}>
          <Feather name="alert-circle" size={11} color="#fff" />
          <Text style={styles.criticalBadgeText}>CRITICAL NEED</Text>
        </View>
      )}
      <View style={styles.mapCardRow}>
        <View style={styles.mapCardPin}>
          <Feather name="map-pin" size={20} color={hasCritical ? colors.primary : colors.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hospitalName} numberOfLines={1}>{hospital.name}</Text>
          <Text style={styles.hospitalAddress} numberOfLines={1}>{hospital.address}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="navigation" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}>{hospital.distance} km</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}>{hospital.openHours}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Blood needs */}
      <View style={styles.needsRow}>
        {hospital.bloodNeeds.slice(0, 4).map((n, i) => (
          <View key={i} style={[styles.needChip, { borderColor: LEVEL_COLORS[n.level] + "40" }]}>
            <BloodNeedDot level={n.level} />
            <Text style={[styles.needType, { color: LEVEL_COLORS[n.level] }]}>{n.type}</Text>
          </View>
        ))}
        {hospital.bloodNeeds.length > 4 && (
          <View style={styles.needChipMore}>
            <Text style={styles.needChipMoreText}>+{hospital.bloodNeeds.length - 4}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.donateBtn} onPress={onDonate} activeOpacity={0.85}>
        <Feather name="droplet" size={16} color="#fff" />
        <Text style={styles.donateBtnText}>Donate Here</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function MapsScreen() {
  const insets = useSafeAreaInsets();
  const { hospitals, loading } = useHospitals();
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "critical" | "nearby">("all");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const filtered = hospitals.filter((h) => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase());
    if (filter === "critical") return matchSearch && h.bloodNeeds.some((n) => n.level === "critical");
    if (filter === "nearby") return matchSearch && h.distance <= 4;
    return matchSearch;
  }).sort((a, b) => filter === "nearby" ? a.distance - b.distance : 0);

  const handleDonate = (hospital: Hospital) => {
    router.push({ pathname: "/appointment/book", params: { hospitalId: hospital.id } });
  };

  const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 },
    title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    headerIcon: {
      width: 46, height: 46, borderRadius: 14, backgroundColor: "#FEF2F2",
      alignItems: "center", justifyContent: "center",
    },
    mapBanner: {
      height: 200, borderRadius: 20, overflow: "hidden", marginBottom: 16,
      borderWidth: 1, borderColor: colors.separator,
    },
    searchWrap: {
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: colors.inputBg, borderWidth: 1.5,
      borderColor: colors.inputBorder, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
    },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },
    filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
    filterBtn: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.inputBorder,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
    filterTextActive: { color: "#fff" },
    legend: { flexDirection: "row", gap: 14, marginBottom: 18, flexWrap: "wrap" },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    legendText: { fontSize: 11, color: colors.textMuted, fontWeight: "500" },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(h) => h.id}
        ListHeaderComponent={
          <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20 }}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Blood Banks</Text>
                <Text style={styles.subtitle}>{filtered.length} hospitals in Jordan</Text>
              </View>
              <View style={styles.headerIcon}>
                <Feather name="map" size={22} color={colors.primary} />
              </View>
            </View>

            {/* Real map */}
            <View style={styles.mapBanner}>
              <MapView
                provider={PROVIDER_DEFAULT}
                style={StyleSheet.absoluteFillObject}
                initialRegion={{
                  latitude: 31.9539,
                  longitude: 35.9106,
                  latitudeDelta: 0.2,
                  longitudeDelta: 0.2,
                }}
                showsUserLocation
                showsMyLocationButton={false}
              >
                {hospitals.map((h) => (
                  h.coordinates?.lat && h.coordinates?.lng ? (
                    <Marker
                      key={h.id}
                      coordinate={{ latitude: h.coordinates.lat, longitude: h.coordinates.lng }}
                      onPress={() => router.push({ pathname: "/hospital/[id]", params: { id: h.id } })}
                      pinColor={h.bloodNeeds.some((n) => n.level === "critical") ? colors.primary : "#666"}
                      title={h.name}
                      description={h.city}
                    />
                  ) : null
                ))}
              </MapView>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <Feather name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search hospitals..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Feather name="x" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filters */}
            <View style={styles.filterRow}>
              {(["all", "critical", "nearby"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                    {f === "all" ? "All" : f === "critical" ? "Critical" : "Nearby"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              {(Object.entries(LEVEL_COLORS) as [keyof typeof LEVEL_COLORS, string][]).map(([level, color]) => (
                <View key={level} style={styles.legendItem}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                  <Text style={styles.legendText}>{LEVEL_LABELS[level]}</Text>
                </View>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
            <HospitalMapCard hospital={item} onDonate={() => handleDonate(item)} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: botPad + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
