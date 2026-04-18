import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useApp, Appointment } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import GlassCard from "@/components/GlassCard";
import { Fonts } from "@/constants/fonts";
import EligibilityGauge from "@/components/EligibilityGauge";

interface HomeCampaign {
  id: string;
  title: string;
  campaign_date: string;
  urgency: "medium" | "high" | "critical";
  blood_types_needed: string[];
  target_donors: number;
  registered_donors: number;
  facilities: { name: string; city: string } | null;
}

const URGENCY_COLOR: Record<HomeCampaign["urgency"], string> = {
  medium: "#3498DB",
  high: "#E11D48",
  critical: "#BE123C",
};

function eligibilityDaysLeft(lastDonation: string | null): number {
  if (!lastDonation) return 0;
  const diff = Date.now() - new Date(lastDonation).getTime();
  const daysDone = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, 90 - daysDone);
}

const BLOOD_COLORS: Record<string, string> = {
  "O-": "#BE123C", "O+": "#E11D48", "A+": "#7C3AED",
  "A-": "#9B59B6", "B+": "#2563EB", "B-": "#3498DB",
  "AB+": "#0D9488", "AB-": "#1ABC9C",
};

function UpcomingAppointmentCard({ appointment }: { appointment: Appointment }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const bloodColor = BLOOD_COLORS[appointment.bloodType] || colors.primary;

  return (
    <GlassCard glowColor={bloodColor} borderRadius={20} style={{ padding: 0 }}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/appointment/ticket", params: { appointmentId: appointment.id } })}
        activeOpacity={0.88}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <View style={{ width: 85, alignSelf: "stretch", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: bloodColor }}>
          <Feather name="droplet" size={22} color="#fff" />
          <Text style={{ fontFamily: Fonts.extrabold, fontSize: 13, color: "#fff" }}>{appointment.bloodType}</Text>
        </View>
        <View style={{ flex: 1, padding: 14, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Text style={{ fontFamily: Fonts.extrabold, fontSize: 18, color: colors.text, letterSpacing: 0.3 }}>{appointment.fileNumber}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#D1FAE5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981", marginRight: 4 }} />
              <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: "#047857", letterSpacing: 0.3 }}>{t('upcoming')}</Text>
            </View>
          </View>
          <Text style={{ fontFamily: Fonts.semibold, fontSize: 14, color: colors.textSecondary }} numberOfLines={1}>{appointment.hospitalName}</Text>
          <View style={{ flexDirection: "row", gap: 14, marginTop: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="calendar" size={12} color={colors.textMuted} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textMuted }}>{appointment.date}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="clock" size={12} color={colors.textMuted} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textMuted }}>{appointment.time}</Text>
            </View>
          </View>
        </View>
        <View style={{ paddingRight: 14, alignItems: "center", justifyContent: "center" }}>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    </GlassCard>
  );
}

export default function HomeScreen() {
  const { profile, appointments, unreadCount, facilities } = useApp();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const isDark = theme === "dark";
  const [campaigns, setCampaigns] = useState<HomeCampaign[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("campaigns")
      .select("id, title, campaign_date, urgency, blood_types_needed, target_donors, registered_donors, facilities(name, city)")
      .eq("is_active", true)
      .gte("campaign_date", today)
      .order("campaign_date", { ascending: true })
      .limit(5)
      .then(({ data }) => {
        if (data) setCampaigns(data as unknown as HomeCampaign[]);
      });
  }, []);

  const daysLeft = eligibilityDaysLeft(profile?.lastDonationDate ?? null);
  const upcomingAppointments = appointments.filter((a) => a.status === "upcoming");
  const nextAppointment = upcomingAppointments[0] || null;

  const urgentNeeds = facilities.flatMap((f) =>
    f.bloodNeeds
      .filter((n) => n.level === "critical")
      .map((n) => ({ ...n, facility: f }))
  ).slice(0, 3);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 }}>
        <View>
          <Text style={{ fontFamily: Fonts.extrabold, fontSize: 26, color: colors.text, letterSpacing: -0.7 }}>
            {t('greeting')}, {profile?.firstName || "Donor"}
          </Text>
          <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: colors.textSecondary, marginTop: 2, letterSpacing: 0.2 }}>
            {profile?.city || "Amman"}, Jordan
          </Text>
        </View>
        <TouchableOpacity
          style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: colors.glassBorder }}
          onPress={() => router.push("/notifications")}
        >
          <Feather name="bell" size={22} color={colors.text} />
          {unreadCount > 0 && (
            <View style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.background }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: "#fff" }}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Upcoming Appointment */}
      <View style={{ paddingHorizontal: 20, marginTop: 22, marginBottom: 4 }}>
        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 11, color: colors.textMuted, letterSpacing: 1.4, marginBottom: 10, textTransform: "uppercase" }}>{t('upcomingAppt')}</Text>
      </View>

      {nextAppointment ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <UpcomingAppointmentCard appointment={nextAppointment} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <GlassCard glowColor={colors.primary} borderRadius={20}>
            <View style={{ padding: 18, gap: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: isDark ? "rgba(51,65,85,0.6)" : "rgba(240,235,227,0.8)", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="calendar" size={24} color={colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.extrabold, fontSize: 16, color: colors.text, marginBottom: 2, letterSpacing: -0.2 }}>{t('noApptTitle')}</Text>
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 12.5, color: colors.textSecondary }}>{t('noApptSubtitle')}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 12, paddingVertical: 11 }}
                onPress={() => { Haptics.selectionAsync(); router.push("/(tabs)/urgent"); }}
                activeOpacity={0.85}
              >
                <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: colors.primary, letterSpacing: 0.2 }}>{t('seeUrgent')}</Text>
                <Feather name="arrow-right" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      )}

      {/* Eligibility */}
      <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 11, color: colors.textMuted, letterSpacing: 1.4, marginBottom: 10, textTransform: "uppercase" }}>{t('donationEligibility')}</Text>
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <EligibilityGauge daysLeft={daysLeft} lastDonation={profile?.lastDonationDate ?? null} />
      </View>

      {/* Blood Drives / Campaigns */}
      {campaigns.length > 0 && (
        <>
          <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: Fonts.extrabold, fontSize: 11, color: colors.textMuted, letterSpacing: 1.4, textTransform: "uppercase" }}>Blood Drives</Text>
              <TouchableOpacity onPress={() => router.push("/campaigns")}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: colors.primary }}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            style={{ marginBottom: 24 }}
          >
            {campaigns.map((c) => {
              const accent = URGENCY_COLOR[c.urgency] || colors.primary;
              const pct = Math.min(100, Math.round((c.registered_donors / Math.max(c.target_donors, 1)) * 100));
              const dateLabel = new Date(c.campaign_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/campaign/[id]", params: { id: c.id } }); }}
                  activeOpacity={0.88}
                  style={{ width: 280 }}
                >
                  <GlassCard glowColor={accent} borderRadius={20}>
                    <View style={{ padding: 16, gap: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: accent + "18", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
                          <Text style={{ fontFamily: Fonts.extrabold, fontSize: 10, color: accent, letterSpacing: 0.8, textTransform: "uppercase" }}>{c.urgency}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Feather name="calendar" size={11} color={colors.textMuted} />
                          <Text style={{ fontFamily: Fonts.semibold, fontSize: 11, color: colors.textMuted }}>{dateLabel}</Text>
                        </View>
                      </View>
                      <Text numberOfLines={1} style={{ fontFamily: Fonts.extrabold, fontSize: 16, color: colors.text, letterSpacing: -0.3 }}>{c.title}</Text>
                      <Text numberOfLines={1} style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textSecondary }}>
                        {c.facilities?.name || ""} {c.facilities?.city ? `· ${c.facilities.city}` : ""}
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                        {c.blood_types_needed.slice(0, 4).map((bt) => (
                          <View key={bt} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, backgroundColor: accent + "18" }}>
                            <Text style={{ fontFamily: Fonts.extrabold, fontSize: 10, color: accent }}>{bt}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                        <View style={{ flex: 1, height: 5, backgroundColor: colors.separator, borderRadius: 3, overflow: "hidden" }}>
                          <View style={{ width: `${pct}%` as any, height: "100%", borderRadius: 3, backgroundColor: accent }} />
                        </View>
                        <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: accent }}>
                          {c.registered_donors}/{c.target_donors}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Blood type */}
      {profile?.bloodType && (
        <>
          <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
            <Text style={{ fontFamily: Fonts.extrabold, fontSize: 11, color: colors.textMuted, letterSpacing: 1.4, marginBottom: 10, textTransform: "uppercase" }}>{t('yourBloodType')}</Text>
          </View>
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <GlassCard glowColor={BLOOD_COLORS[profile.bloodType] || colors.primary} borderRadius={20}>
              <View style={{ padding: 18, flexDirection: "row", alignItems: "center", gap: 16 }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 20,
                  backgroundColor: BLOOD_COLORS[profile.bloodType] || colors.primary,
                  alignItems: "center", justifyContent: "center",
                  shadowColor: BLOOD_COLORS[profile.bloodType] || colors.primary,
                  shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
                }}>
                  <Text style={{ fontFamily: Fonts.extrabold, fontSize: 20, color: "#fff", letterSpacing: -0.5 }}>{profile.bloodType}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.extrabold, fontSize: 16, color: colors.text, marginBottom: 4, letterSpacing: -0.2 }}>{t('bloodTypeTitle')} {profile.bloodType}</Text>
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 10 }}>
                    {profile.bloodType === "O-" ? t('universalDonor') : t('canHelpPatients')}
                  </Text>
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                    onPress={() => router.push("/(tabs)/maps")} activeOpacity={0.85}
                  >
                    <Feather name="map-pin" size={14} color={colors.primary} />
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: colors.primary }}>{t('findHospital')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          </View>
        </>
      )}

      {/* Critical needs */}
      {urgentNeeds.length > 0 && (
        <>
          <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: Fonts.extrabold, fontSize: 11, color: colors.textMuted, letterSpacing: 1.4, textTransform: "uppercase" }}>{t('criticalNeeds')}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/urgent")}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: colors.primary }}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
            {urgentNeeds.map((n, i) => {
              const bloodColor = BLOOD_COLORS[n.type] || colors.primary;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => router.push({ pathname: "/appointment/book", params: { hospitalId: n.facility.id } })}
                  activeOpacity={0.85}
                >
                  <GlassCard glowColor={bloodColor} borderRadius={16}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
                      <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: bloodColor, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 14, color: "#fff", letterSpacing: -0.3 }}>{n.type}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: colors.text, marginBottom: 2 }} numberOfLines={1}>{n.facility.name}</Text>
                        <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textSecondary }}>{n.facility.city}</Text>
                      </View>
                      <View style={{ backgroundColor: "#FEE2E2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 10, color: colors.primary, letterSpacing: 0.8, textTransform: "uppercase" }}>{t('critical')}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}
