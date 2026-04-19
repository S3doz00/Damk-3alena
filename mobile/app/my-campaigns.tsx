import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlassCard from "@/components/GlassCard";
import UrgencyBadge from "@/components/UrgencyBadge";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

interface MyCampaignRow {
  registration_id: string;
  campaign_id: string;
  registered_at: string;
  blood_type: string;
  title: string;
  campaign_date: string;
  start_time: string;
  end_time: string;
  urgency: "medium" | "high" | "critical";
  blood_types_needed: string[];
  facility_name: string;
  facility_city: string;
}

export default function MyCampaignsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;
  const [rows, setRows] = useState<MyCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return setLoading(false);
    const { data: donor } = await supabase.from("donors").select("id").eq("auth_id", auth.user.id).single();
    if (!donor) return setLoading(false);

    const { data } = await supabase
      .from("campaign_registrations")
      .select(`
        id, registered_at, blood_type, campaign_id,
        campaigns:campaign_id (
          title, campaign_date, start_time, end_time, urgency, blood_types_needed,
          facilities:facility_id (name, city)
        )
      `)
      .eq("donor_id", donor.id)
      .order("registered_at", { ascending: false });

    if (data) {
      const mapped: MyCampaignRow[] = data.map((r: any) => ({
        registration_id: r.id,
        campaign_id: r.campaign_id,
        registered_at: r.registered_at,
        blood_type: r.blood_type,
        title: r.campaigns?.title ?? "",
        campaign_date: r.campaigns?.campaign_date ?? "",
        start_time: r.campaigns?.start_time ?? "",
        end_time: r.campaigns?.end_time ?? "",
        urgency: r.campaigns?.urgency ?? "medium",
        blood_types_needed: r.campaigns?.blood_types_needed ?? [],
        facility_name: r.campaigns?.facilities?.name ?? "",
        facility_city: r.campaigns?.facilities?.city ?? "",
      }));
      setRows(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const unregister = (row: MyCampaignRow) => {
    const doUnreg = async () => {
      const { error } = await supabase.from("campaign_registrations").delete().eq("id", row.registration_id);
      if (error) {
        Alert.alert("Could not unregister", error.message);
        return;
      }
      setRows((prev) => prev.filter((r) => r.registration_id !== row.registration_id));
    };
    if (Platform.OS === "web") {
      if (window.confirm(`Unregister from "${row.title}"?`)) doUnreg();
    } else {
      Alert.alert("Unregister", `Unregister from "${row.title}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Unregister", style: "destructive", onPress: doUnreg },
      ]);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Campaigns</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : rows.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <Feather name="calendar" size={48} color={colors.textSecondary} style={{ marginBottom: 12, opacity: 0.4 }} />
          <Text style={{ fontFamily: Fonts.extrabold, fontSize: 17, color: colors.text, marginBottom: 6, letterSpacing: -0.3 }}>
            No registered campaigns yet
          </Text>
          <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>
            Once you register for a blood drive it will show up here.
          </Text>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 }}
            onPress={() => router.push("/campaigns")}
            activeOpacity={0.85}
          >
            <Feather name="search" size={16} color="#fff" />
            <Text style={{ fontFamily: Fonts.bold, color: "#fff", fontSize: 14, letterSpacing: 0.2 }}>Browse Blood Drives</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.registration_id}
          renderItem={({ item }) => {
            const dateLabel = new Date(item.campaign_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const past = item.campaign_date < today;
            const accent = past ? "#10B981" : item.urgency === "critical" ? "#BE123C" : item.urgency === "high" ? "#E11D48" : "#3498DB";
            return (
              <View style={{ marginBottom: 14 }}>
                <GlassCard glowColor={accent} borderRadius={16}>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/campaign/[id]", params: { id: item.campaign_id } })}
                    activeOpacity={0.88}
                  >
                    <View style={{ padding: 18, gap: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        {past ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#D1FAE5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                            <Feather name="check-circle" size={12} color="#047857" />
                            <Text style={{ fontFamily: Fonts.extrabold, fontSize: 10, color: "#047857", letterSpacing: 0.8, textTransform: "uppercase" }}>Completed</Text>
                          </View>
                        ) : (
                          <UrgencyBadge urgency={item.urgency} />
                        )}
                        <Text style={{ fontFamily: Fonts.semibold, fontSize: 13, color: colors.textSecondary }}>{dateLabel}</Text>
                      </View>

                      <Text style={{ fontFamily: Fonts.extrabold, fontSize: 17, color: colors.text, letterSpacing: -0.3 }} numberOfLines={1}>{item.title}</Text>
                      <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: colors.textSecondary }} numberOfLines={1}>
                        {item.facility_name}{item.facility_city ? ` · ${item.facility_city}` : ""}
                      </Text>

                      <View style={{ flexDirection: "row", gap: 16, marginTop: 2 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Feather name="clock" size={13} color={colors.textMuted} />
                          <Text style={{ fontFamily: Fonts.medium, fontSize: 12.5, color: colors.textMuted }}>
                            {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Feather name="droplet" size={13} color={colors.textMuted} />
                          <Text style={{ fontFamily: Fonts.bold, fontSize: 12.5, color: colors.primary, letterSpacing: -0.2 }}>
                            {item.blood_type}
                          </Text>
                        </View>
                      </View>

                      {!past && (
                        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                          <TouchableOpacity
                            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.primary }}
                            onPress={() => router.push({ pathname: "/campaign/[id]", params: { id: item.campaign_id } })}
                            activeOpacity={0.85}
                          >
                            <Feather name="info" size={14} color="#fff" />
                            <Text style={{ fontFamily: Fonts.bold, color: "#fff", fontSize: 13, letterSpacing: 0.2 }}>Details</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary + "40", backgroundColor: colors.primary + "12" }}
                            onPress={() => unregister(item)}
                            activeOpacity={0.85}
                          >
                            <Feather name="x" size={14} color={colors.primary} />
                            <Text style={{ fontFamily: Fonts.bold, color: colors.primary, fontSize: 13, letterSpacing: 0.2 }}>Unregister</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </GlassCard>
              </View>
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
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, gap: 14 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontFamily: Fonts.extrabold, fontSize: 22, letterSpacing: -0.5 },
});
