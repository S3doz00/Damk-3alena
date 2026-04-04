import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { UrgentCase, UrgencyLevel } from "@/constants/urgent";
import { useUrgentCases } from "@/lib/hooks";

const URGENCY_CONFIG: Record<UrgencyLevel, { color: string; bg: string; label: string }> = {
  critical: { color: "#C0392B", bg: "#FEE2E2", label: "CRITICAL" },
  urgent: { color: "#E67E22", bg: "#FEF3C7", label: "URGENT" },
  pending: { color: "#2980B9", bg: "#EFF6FF", label: "PENDING" },
};

const BLOOD_COLORS: Record<string, string> = {
  "O-": "#C0392B", "O+": "#E74C3C", "A+": "#8E44AD",
  "A-": "#9B59B6", "B+": "#2980B9", "B-": "#3498DB",
  "AB+": "#16A085", "AB-": "#1ABC9C",
};

function timeAgo(isoDate: string): string {
  const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function UrgentCaseCard({ item }: { item: UrgentCase }) {
  const { colors } = useTheme();
  const cfg = URGENCY_CONFIG[item.urgency];
  const bloodColor = BLOOD_COLORS[item.bloodType] || colors.primary;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card, borderRadius: 20, padding: 18,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
      borderWidth: 1, borderColor: colors.separator,
      borderLeftWidth: 4,
    },
    cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
    cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
    patientName: { fontSize: 16, fontWeight: "700", color: colors.text },
    fileNumber: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
    urgencyBadge: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    urgencyText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
    bloodBadge: {
      width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center",
    },
    bloodText: { fontSize: 14, fontWeight: "800", color: "#fff" },
    cardDetails: { gap: 8, marginBottom: 16 },
    detailItem: { flexDirection: "row", alignItems: "center", gap: 8 },
    detailText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    unitsNeeded: { flexDirection: "row", alignItems: "center", gap: 6 },
    unitsText: { fontSize: 13, fontWeight: "700" },
    donateBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    },
    donateBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  });

  return (
    <View style={[styles.card, { borderLeftColor: cfg.color }]}>
      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <View style={[styles.urgencyBadge, { backgroundColor: cfg.bg }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.color, marginRight: 4 }} />
              <Text style={[styles.urgencyText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={styles.fileNumber}>{item.fileNumber}</Text>
        </View>
        {/* Blood type */}
        <View style={[styles.bloodBadge, { backgroundColor: bloodColor }]}>
          <Text style={styles.bloodText}>{item.bloodType}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Feather name="map-pin" size={13} color={colors.textMuted} />
          <Text style={styles.detailText} numberOfLines={1}>{item.hospitalName}</Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="navigation" size={13} color={colors.textMuted} />
          <Text style={styles.detailText}>{item.distanceKm} km away</Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="activity" size={13} color={colors.textMuted} />
          <Text style={styles.detailText}>{item.cause}</Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="clock" size={13} color={colors.textMuted} />
          <Text style={styles.detailText}>{timeAgo(item.postedAt)}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.unitsNeeded}>
          <Feather name="droplet" size={13} color={bloodColor} />
          <Text style={[styles.unitsText, { color: bloodColor }]}>{item.unitsNeeded} unit{item.unitsNeeded > 1 ? "s" : ""} needed</Text>
        </View>
        <TouchableOpacity
          style={[styles.donateBtn, { backgroundColor: cfg.color }]}
          onPress={() => router.push({ pathname: "/appointment/book", params: { hospitalId: item.hospitalId } })}
          activeOpacity={0.85}
        >
          <Text style={styles.donateBtnText}>Donate Now</Text>
          <Feather name="arrow-right" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function UrgentScreen() {
  const insets = useSafeAreaInsets();
  const { cases, loading } = useUrgentCases();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<"all" | UrgencyLevel>("all");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const filtered = filter === "all" ? cases : cases.filter((c) => c.urgency === filter);
  const criticalCount = cases.filter((c) => c.urgency === "critical").length;

  const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    criticalBubble: {
      width: 50, height: 50, borderRadius: 25, backgroundColor: "#FEE2E2",
      alignItems: "center", justifyContent: "center", position: "relative",
    },
    criticalPulse: {
      position: "absolute", width: 50, height: 50, borderRadius: 25,
      backgroundColor: "#FEE2E2", opacity: 0.5,
    },
    criticalCount: { fontSize: 22, fontWeight: "800", color: colors.primary },
    locationBar: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: colors.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.separator, marginBottom: 14,
    },
    locationBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    locationDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#27AE60" },
    locationText: { fontSize: 13, color: colors.text, fontWeight: "500" },
    locationUpdateBtn: {
      width: 32, height: 32, borderRadius: 10, backgroundColor: "#FEF2F2",
      alignItems: "center", justifyContent: "center",
    },
    alertBanner: {
      flexDirection: "row", alignItems: "center", gap: 14,
      backgroundColor: "#FEF2F2", borderRadius: 16, padding: 16,
      borderWidth: 1.5, borderColor: colors.primary + "40", marginBottom: 16,
    },
    alertPulse: {
      width: 42, height: 42, borderRadius: 12, backgroundColor: "#FEE2E2",
      alignItems: "center", justifyContent: "center",
    },
    alertTitle: { fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 2 },
    alertBody: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
    filterRow: { flexDirection: "row", gap: 8, marginBottom: 18, flexWrap: "wrap" },
    filterBtn: {
      flexDirection: "row", alignItems: "center", gap: 5,
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.inputBorder,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
    filterTextActive: { color: "#fff" },
    emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
    emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20 }}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Urgent Requests</Text>
                <Text style={styles.subtitle}>Amman, Jordan · {filtered.length} active cases</Text>
              </View>
              <View style={styles.criticalBubble}>
                <View style={styles.criticalPulse} />
                <Text style={styles.criticalCount}>{criticalCount}</Text>
              </View>
            </View>

            {/* Location bar */}
            <View style={styles.locationBar}>
              <View style={styles.locationBarLeft}>
                <View style={styles.locationDot} />
                <Text style={styles.locationText}>Current Location: Amman, Jordan</Text>
              </View>
              <TouchableOpacity style={styles.locationUpdateBtn}>
                <Feather name="refresh-cw" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Alert banner */}
            {criticalCount > 0 && (
              <View style={styles.alertBanner}>
                <View style={styles.alertPulse}>
                  <Feather name="alert-triangle" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{criticalCount} Critical Requests Near You</Text>
                  <Text style={styles.alertBody}>Lives are at stake. Your blood type may be urgently needed.</Text>
                </View>
              </View>
            )}

            {/* Filters */}
            <View style={styles.filterRow}>
              {(["all", "critical", "urgent", "pending"] as const).map((f) => {
                const cfg = f !== "all" ? URGENCY_CONFIG[f] : null;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterBtn, filter === f && (cfg ? { backgroundColor: cfg.color, borderColor: cfg.color } : styles.filterBtnActive)]}
                    onPress={() => setFilter(f)}
                  >
                    {cfg && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: filter === f ? "#fff" : cfg.color }} />}
                    <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                      {f === "all" ? "All" : URGENCY_CONFIG[f].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
            <UrgentCaseCard item={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="check-circle" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Active Requests</Text>
            <Text style={styles.emptySubtitle}>There are currently no urgent requests in this category.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: botPad + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
