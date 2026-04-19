import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UrgencyBadge from "@/components/UrgencyBadge";
import GlassCard from "@/components/GlassCard";
import Colors from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import { canDonateToAny } from "@/lib/bloodCompatibility";

interface CampaignDetail {
  id: string;
  title: string;
  description: string | null;
  campaign_date: string;
  start_time: string;
  end_time: string;
  blood_types_needed: string[];
  urgency: "medium" | "high" | "critical";
  target_donors: number;
  registered_donors: number;
  facility_id: string;
  facilities: { name: string; city: string; address?: string } | null;
}

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useApp();
  const insets = useSafeAreaInsets();
  const [registered, setRegistered] = useState(false);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("*, facilities(name, city, address)")
        .eq("id", id)
        .single();
      if (data) setCampaign(data as CampaignDetail);

      if (profile?.id) {
        const { data: reg } = await supabase
          .from("campaign_registrations")
          .select("id")
          .eq("campaign_id", id)
          .eq("donor_id", profile.id)
          .maybeSingle();
        if (reg) setRegistered(true);
      }
      setLoading(false);
    })();
  }, [id, profile?.id]);

  if (loading) {
    return (
      <View style={styles.notFound}>
        <ActivityIndicator color={Colors.light.primary} />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.notFound}>
        <Text style={{ fontFamily: Fonts.semibold }}>Campaign not found</Text>
      </View>
    );
  }

  const pct = Math.round((campaign.registered_donors / Math.max(campaign.target_donors, 1)) * 100);
  const dateLabel = new Date(campaign.campaign_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const donorType = profile?.bloodType ?? null;
  const compatible = canDonateToAny(donorType, campaign.blood_types_needed);

  const handleRegister = async () => {
    if (!donorType) {
      Alert.alert("Blood Type Required", "Please set your blood type in your profile before registering.");
      return;
    }
    if (!compatible) {
      Alert.alert(
        "Not Compatible",
        `Your ${donorType} blood is not compatible with this campaign's needs. Please look for a different drive.`
      );
      return;
    }
    if (registered) return;

    if (!profile?.id) {
      Alert.alert("Profile Incomplete", "Please complete your donor profile before registering.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("campaign_registrations").insert({
        campaign_id: campaign.id,
        donor_id: profile.id,
        blood_type: donorType,
      });

      if (error) {
        // 23505 = unique violation (already registered).
        if (error.code === "23505") {
          setRegistered(true);
          Alert.alert("Already Registered", "You're already signed up for this campaign.");
        } else {
          Alert.alert("Registration Failed", error.message);
        }
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRegistered(true);
      setCampaign({ ...campaign, registered_donors: campaign.registered_donors + 1 });
      Alert.alert("Registered!", `You're registered for "${campaign.title}". See you on ${dateLabel}!`, [
        { text: "Done", onPress: () => router.back() },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const urgencyColor = campaign.urgency === "critical" ? "#BE123C" : campaign.urgency === "high" ? "#E11D48" : "#3498DB";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: botPad + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
        <GlassCard glowColor={urgencyColor} borderRadius={20}>
          <View style={{ padding: 20 }}>
            <UrgencyBadge urgency={campaign.urgency} />
            <Text style={styles.heroTitle}>{campaign.title}</Text>
            <Text style={styles.heroHospital}>{campaign.facilities?.name ?? ""}</Text>

            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Feather name="calendar" size={16} color={Colors.light.primary} />
                <Text style={styles.heroMetaText}>{dateLabel}</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Feather name="clock" size={16} color={Colors.light.primary} />
                <Text style={styles.heroMetaText}>
                  {campaign.start_time.slice(0, 5)} - {campaign.end_time.slice(0, 5)}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </View>

      <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
        <GlassCard glowColor={Colors.light.primary} borderRadius={16}>
          <View style={{ flexDirection: "row", padding: 20 }}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{campaign.registered_donors}</Text>
              <Text style={styles.statLabel}>Registered</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: "#3498DB" }]}>
                {Math.max(0, campaign.target_donors - campaign.registered_donors)}
              </Text>
              <Text style={styles.statLabel}>Spots Left</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: Colors.light.success }]}>
                {pct}%
              </Text>
              <Text style={styles.statLabel}>Filled</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressBar, { width: `${pct}%` }]} />
        </View>
      </View>

      {donorType && !compatible && (
        <View style={styles.incompatWarn}>
          <Feather name="alert-triangle" size={16} color="#92400E" />
          <Text style={styles.incompatText}>
            Your {donorType} blood is not compatible with this campaign. You won't be able to register.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This Campaign</Text>
        <Text style={styles.description}>{campaign.description ?? ""}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blood Types Needed</Text>
        <View style={styles.bloodTypes}>
          {campaign.blood_types_needed.map((bt) => (
            <View key={bt} style={styles.btChip}>
              <Text style={styles.btText}>{bt}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Donation Tips</Text>
        {[
          "Fast for 4 hours before your appointment",
          "Drink plenty of water beforehand",
          "Wear comfortable, loose-fitting clothing",
          "Bring a valid ID",
          "Get a good night's sleep",
        ].map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.registerBtn,
          registered && styles.registerBtnDone,
          (!compatible || submitting) && !registered && styles.registerBtnDisabled,
        ]}
        onPress={registered || submitting || !compatible ? undefined : handleRegister}
        activeOpacity={0.85}
      >
        <Feather
          name={registered ? "check-circle" : !compatible ? "x-circle" : "user-plus"}
          size={20}
          color="#fff"
        />
        <Text style={styles.registerBtnText}>
          {registered
            ? "Registered!"
            : submitting
            ? "Registering..."
            : !compatible
            ? "Not Compatible"
            : "Register for Campaign"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  backBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: {
    fontFamily: Fonts.extrabold, fontSize: 22,
    color: Colors.light.text, marginTop: 12, marginBottom: 4, letterSpacing: -0.4,
  },
  heroHospital: {
    fontFamily: Fonts.medium, fontSize: 15,
    color: Colors.light.textSecondary, marginBottom: 16,
  },
  heroMeta: { flexDirection: "row", gap: 20 },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroMetaText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.light.text },
  statBox: { flex: 1, alignItems: "center" },
  statNum: { fontFamily: Fonts.extrabold, fontSize: 24, color: Colors.light.primary, letterSpacing: -0.5 },
  statLabel: { fontFamily: Fonts.medium, fontSize: 11.5, color: Colors.light.textSecondary, marginTop: 4, letterSpacing: 0.3, textTransform: "uppercase" },
  statDivider: { width: 1, backgroundColor: Colors.light.separator },
  progressWrap: { paddingHorizontal: 20, marginBottom: 16 },
  progressBg: {
    height: 10, backgroundColor: Colors.light.separator,
    borderRadius: 5, overflow: "hidden",
  },
  progressBar: { height: "100%", backgroundColor: Colors.light.primary, borderRadius: 5 },
  incompatWarn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FEF3C7", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    marginHorizontal: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "#F59E0B66",
  },
  incompatText: { flex: 1, fontFamily: Fonts.semibold, fontSize: 13, color: "#78350F", lineHeight: 18 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontFamily: Fonts.extrabold, fontSize: 11,
    color: Colors.light.textMuted, marginBottom: 12,
    letterSpacing: 1.4, textTransform: "uppercase",
  },
  description: { fontFamily: Fonts.medium, fontSize: 15, color: Colors.light.textSecondary, lineHeight: 22 },
  bloodTypes: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  btChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, backgroundColor: "#FEE2E2",
  },
  btText: { fontFamily: Fonts.extrabold, fontSize: 16, color: Colors.light.primary, letterSpacing: -0.3 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.light.primary, marginTop: 8 },
  tipText: { flex: 1, fontFamily: Fonts.medium, fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  registerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.light.primary, marginHorizontal: 20,
    paddingVertical: 18, borderRadius: 16, gap: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  registerBtnDone: { backgroundColor: Colors.light.success, shadowColor: Colors.light.success },
  registerBtnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0 },
  registerBtnText: { fontFamily: Fonts.bold, color: "#fff", fontSize: 17, letterSpacing: 0.2 },
});
