import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import UrgencyBadge from "@/components/UrgencyBadge";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import { canDonateToAny } from "@/lib/bloodCompatibility";

interface CampaignRow {
  id: string;
  title: string;
  description: string | null;
  campaign_date: string;
  start_time: string;
  end_time: string;
  blood_types_needed: string[];
  urgency: string;
  target_donors: number;
  registered_donors: number;
  is_active: boolean;
  facilities: { name: string; city: string } | null;
}

export default function CampaignsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const donorType = profile?.bloodType ?? null;
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("campaigns")
      .select("*, facilities(name, city)")
      .eq("is_active", true)
      .gte("campaign_date", today)
      .order("campaign_date", { ascending: true });
    if (data) setCampaigns(data as CampaignRow[]);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Blood Drives</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      ) : campaigns.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <Feather name="calendar" size={48} color={Colors.light.textSecondary} style={{ marginBottom: 12, opacity: 0.4 }} />
          <Text style={{ fontSize: 15, color: Colors.light.textSecondary, textAlign: "center" }}>
            No upcoming blood drives right now. Check back soon.
          </Text>
        </View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => {
            const pct = Math.min(100, Math.round((item.registered_donors / Math.max(item.target_donors, 1)) * 100));
            const facilityName = item.facilities?.name ?? "";
            const dateLabel = new Date(item.campaign_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const compatible = canDonateToAny(donorType, item.blood_types_needed);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: "/campaign/[id]", params: { id: item.id } })}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <UrgencyBadge urgency={item.urgency as "medium" | "high" | "critical"} />
                  <Text style={styles.cardDate}>{dateLabel}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardHospital}>{facilityName}</Text>

                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Feather name="clock" size={14} color={Colors.light.textSecondary} />
                    <Text style={styles.metaText}>
                      {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="users" size={14} color={Colors.light.textSecondary} />
                    <Text style={styles.metaText}>
                      {item.registered_donors}/{item.target_donors}
                    </Text>
                  </View>
                </View>

                <View style={styles.bloodTypes}>
                  {item.blood_types_needed.map((bt) => (
                    <View key={bt} style={styles.btChip}>
                      <Text style={styles.btChipText}>{bt}</Text>
                    </View>
                  ))}
                </View>

                {!compatible && donorType && (
                  <View style={styles.incompatWarn}>
                    <Feather name="alert-triangle" size={13} color="#92400E" />
                    <Text style={styles.incompatText}>
                      Your {donorType} blood is not compatible with this drive
                    </Text>
                  </View>
                )}

                <View style={styles.progressWrap}>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressBar, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{pct}% filled</Text>
                </View>

                <TouchableOpacity
                  style={styles.registerBtn}
                  onPress={() => router.push({ pathname: "/campaign/[id]", params: { id: item.id } })}
                >
                  <Text style={styles.registerBtnText}>View & Register</Text>
                  <Feather name="arrow-right" size={16} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: botPad + 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.light.card, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: Colors.light.text },
  card: { backgroundColor: Colors.light.card, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cardDate: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: "600" },
  cardTitle: { fontSize: 17, fontWeight: "800", color: Colors.light.text, marginBottom: 4 },
  cardHospital: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 14 },
  cardMeta: { flexDirection: "row", gap: 20, marginBottom: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: Colors.light.textSecondary },
  bloodTypes: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  btChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "#FEE2E2" },
  btChipText: { fontSize: 13, fontWeight: "700", color: Colors.light.primary },
  progressWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  progressBg: { flex: 1, height: 8, backgroundColor: Colors.light.separator, borderRadius: 4, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: Colors.light.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: Colors.light.textSecondary, fontWeight: "600" },
  registerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.primary, borderRadius: 12, paddingVertical: 13, gap: 8 },
  registerBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  incompatWarn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF3C7", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12, borderWidth: 1, borderColor: "#F59E0B55" },
  incompatText: { flex: 1, fontSize: 11.5, fontWeight: "600", color: "#78350F", lineHeight: 15 },
});
