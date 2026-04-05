import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";

type UrgencyLevel = "critical" | "urgent" | "normal" | "pending";

interface BloodRequest {
  id: string;
  patientName: string;
  fileNumber: string;
  hospitalName: string;
  hospitalId: string;
  city: string;
  bloodType: string;
  urgency: UrgencyLevel;
  cause: string;
  unitsNeeded: number;
  postedAt: string;
}

const URGENCY_CONFIG: Record<string, { color: string; bg: string; labelKey: string }> = {
  critical: { color: "#E11D48", bg: "#FEE2E2", labelKey: "urgencyLabelCritical" },
  urgent:   { color: "#E67E22", bg: "#FEF3C7", labelKey: "urgencyLabelUrgent" },
  normal:   { color: "#2563EB", bg: "#EFF6FF", labelKey: "urgencyLabelNormal" },
  pending:  { color: "#2563EB", bg: "#EFF6FF", labelKey: "urgencyLabelPending" },
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

function UrgentCaseCard({ item, colors }: { item: BloodRequest; colors: any }) {
  const { t } = useLanguage();
  const cfg = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.normal;
  const bloodColor = BLOOD_COLORS[item.bloodType] || "#E11D48";

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: colors.separator, borderLeftWidth: 4, borderLeftColor: cfg.color }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{item.patientName}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: cfg.bg }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.color, marginRight: 4 }} />
              <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 0.5, color: cfg.color }}>{t(cfg.labelKey)}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "500" }}>{item.fileNumber}</Text>
        </View>
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: bloodColor, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>{item.bloodType}</Text>
        </View>
      </View>

      <View style={{ gap: 8, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="map-pin" size={13} color={colors.textMuted} />
          <Text style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }} numberOfLines={1}>{item.hospitalName}</Text>
        </View>
        {item.cause ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="activity" size={13} color={colors.textMuted} />
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>{item.cause}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="clock" size={13} color={colors.textMuted} />
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>{timeAgo(item.postedAt)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Feather name="droplet" size={13} color={bloodColor} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: bloodColor }}>{item.unitsNeeded} {t('unitsNeeded')}</Text>
        </View>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: cfg.color }}
          onPress={() => router.push({ pathname: "/appointment/book", params: { hospitalId: item.hospitalId } })}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{t('donateNow')}</Text>
          <Feather name="arrow-right" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function UrgentScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<"all" | UrgencyLevel>("all");
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  // Fetch blood requests from Supabase
  useEffect(() => {
    fetchRequests();

    // Subscribe to realtime changes — unique name avoids double-subscribe in dev mode
    const channelName = `blood_requests_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "blood_requests" }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("blood_requests")
        .select(`
          id,
          patient_name,
          patient_file_no,
          blood_type,
          urgency,
          units_needed,
          cause,
          status,
          created_at,
          facility_id,
          facilities!inner (
            id,
            name,
            city
          )
        `)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching blood requests:", error);
        setLoading(false);
        return;
      }

      const mapped: BloodRequest[] = (data || []).map((r: any) => ({
        id: r.id,
        patientName: r.patient_name || "Anonymous",
        fileNumber: r.patient_file_no ? `#${r.patient_file_no}` : "",
        hospitalName: r.facilities?.name || "",
        hospitalId: r.facility_id,
        city: r.facilities?.city || "Amman",
        bloodType: r.blood_type,
        urgency: r.urgency as UrgencyLevel,
        cause: r.cause || "",
        unitsNeeded: r.units_needed,
        postedAt: r.created_at,
      }));

      setRequests(mapped);
    } catch (e) {
      console.error("Fetch error:", e);
    }
    setLoading(false);
  };

  const filtered = filter === "all" ? requests : requests.filter((c) => c.urgency === filter);
  const criticalCount = requests.filter((c) => c.urgency === "critical").length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>{t('urgentTitle')}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Amman, Jordan · {requests.length} {t('activeCases')}</Text>
              </View>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>{criticalCount}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.separator, marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#27AE60" }} />
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: "500" }}>{t('currentLocation')}: Amman, Jordan</Text>
              </View>
              <TouchableOpacity onPress={fetchRequests} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
                <Feather name="refresh-cw" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {criticalCount > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#FEF2F2", borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: colors.primary + "40", marginBottom: 16 }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="alert-triangle" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 2 }}>{criticalCount} {t('criticalNearYou')}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>{t('livesAtStake')}</Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {(["all", "critical", "urgent", "normal"] as const).map((f) => {
                const cfg = f !== "all" ? URGENCY_CONFIG[f] : null;
                const isActive = filter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: isActive ? (cfg ? cfg.color : "#C0392B") : colors.inputBg, borderWidth: 1.5, borderColor: isActive ? (cfg ? cfg.color : "#C0392B") : colors.inputBorder }}
                    onPress={() => setFilter(f)}
                  >
                    {cfg && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isActive ? "#fff" : cfg.color }} />}
                    <Text style={{ fontSize: 12, fontWeight: "700", color: isActive ? "#fff" : colors.textSecondary }}>
                      {f === "all" ? t('filterAll') : t(URGENCY_CONFIG[f].labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
            <UrgentCaseCard item={item} colors={colors} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 16 }}>{t('loadingRequests')}</Text>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 40, gap: 12 }}>
              <Feather name="check-circle" size={48} color={colors.textMuted} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{t('noActiveRequests')}</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>{t('noRequestsInCat')}</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: botPad + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
