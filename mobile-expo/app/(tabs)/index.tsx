import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useHospitals } from "@/lib/hooks";
import { useApp, Appointment } from "@/context/AppContext";

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
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const bloodColor = BLOOD_COLORS[appointment.bloodType] || colors.primary;

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: "/appointment/ticket", params: { appointmentId: appointment.id } })}
      activeOpacity={0.88}
      style={{ borderRadius: 20, overflow: "hidden", shadowColor: bloodColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 }}
    >
      <LinearGradient
        colors={isDark ? ["rgba(30,41,59,0.95)", "rgba(15,23,42,0.9)"] : ["rgba(255,255,255,0.95)", "rgba(248,244,239,0.9)"]}
        style={{ flexDirection: "row", alignItems: "center", borderRadius: 20, borderWidth: 1, borderColor: isDark ? "rgba(51,65,85,0.8)" : "rgba(255,255,255,0.9)" }}
      >
        <View style={{ width: 70, alignItems: "center", justifyContent: "center", paddingVertical: 20, gap: 4, backgroundColor: bloodColor, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }}>
          <Feather name="droplet" size={22} color="#fff" />
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}>{appointment.bloodType}</Text>
        </View>
        <View style={{ flex: 1, padding: 14, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, letterSpacing: 0.5 }}>{appointment.fileNumber}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#D1FAE5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981", marginRight: 4 }} />
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#047857" }}>{t('upcoming')}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }} numberOfLines={1}>{appointment.hospitalName}</Text>
          <View style={{ flexDirection: "row", gap: 14, marginTop: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="calendar" size={12} color={colors.textMuted} />
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{appointment.date}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="clock" size={12} color={colors.textMuted} />
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{appointment.time}</Text>
            </View>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textMuted} style={{ marginRight: 14 }} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

function EligibilityCard({ daysLeft, lastDonation }: { daysLeft: number; lastDonation: string | null }) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const isEligible = daysLeft === 0;
  const progress = isEligible ? 1 : (90 - daysLeft) / 90;
  const accentColor = isEligible ? "#10B981" : colors.primary;

  return (
    <LinearGradient
      colors={isDark ? ["rgba(30,41,59,0.95)", "rgba(15,23,42,0.9)"] : ["rgba(255,255,255,0.95)", "rgba(248,244,239,0.9)"]}
      style={{
        borderRadius: 20, padding: 18,
        shadowColor: accentColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
        borderWidth: 1, borderColor: isDark ? "rgba(51,65,85,0.8)" : "rgba(255,255,255,0.9)",
        borderLeftWidth: 4, borderLeftColor: accentColor,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: accentColor + "20", alignItems: "center", justifyContent: "center" }}>
          <Feather name={isEligible ? "check-circle" : "clock"} size={22} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: 2 }}>
            {isEligible ? t('youCanDonate') : `${daysLeft} ${t('daysLeft')}`}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
            {isEligible ? t('eligibleToday') : `${90 - daysLeft} ${t('of90Days')}`}
          </Text>
        </View>
        {isEligible && (
          <View style={{ backgroundColor: "#D1FAE5", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#047857" }}>{t('eligible')}</Text>
          </View>
        )}
      </View>
      {!isEligible && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1, height: 6, backgroundColor: colors.separator, borderRadius: 3, overflow: "hidden" }}>
            <View style={{ width: `${Math.round(progress * 100)}%` as any, height: "100%", borderRadius: 3, backgroundColor: accentColor }} />
          </View>
          <Text style={{ fontSize: 12, fontWeight: "700", color: accentColor, width: 36, textAlign: "right" }}>{Math.round(progress * 100)}%</Text>
        </View>
      )}
      {lastDonation && (
        <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "500" }}>
          {t('lastDonation')} {new Date(lastDonation).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </Text>
      )}
    </LinearGradient>
  );
}

export default function HomeScreen() {
  const { profile, appointments, unreadCount } = useApp();
  const { hospitals } = useHospitals();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const daysLeft = eligibilityDaysLeft(profile?.lastDonationDate ?? null);
  const upcomingAppointments = appointments.filter((a) => a.status === "upcoming");
  const nextAppointment = upcomingAppointments[0] || null;

  const urgentNeeds = hospitals.flatMap((h) =>
    h.bloodNeeds
      .filter((n) => n.level === "critical")
      .map((n) => ({ ...n, hospital: h }))
  ).slice(0, 3);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const glassCard: any = {
    borderRadius: 20, overflow: "hidden" as const,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  };
  const glassColors: [string, string] = isDark
    ? ["rgba(30,41,59,0.95)", "rgba(15,23,42,0.9)"]
    : ["rgba(255,255,255,0.95)", "rgba(248,244,239,0.88)"];
  const glassBorder = isDark ? "rgba(51,65,85,0.8)" : "rgba(255,255,255,0.9)";

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    greeting: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
    subGreeting: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    notifBtn: {
      width: 46, height: 46, borderRadius: 14, backgroundColor: colors.card,
      alignItems: "center", justifyContent: "center", position: "relative",
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
      borderWidth: 1, borderColor: isDark ? "rgba(51,65,85,0.8)" : "rgba(255,255,255,0.9)",
    },
    badge: {
      position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9,
      backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
      borderWidth: 2, borderColor: colors.background,
    },
    badgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
    sectionLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, marginBottom: 10 },
    urgentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    seeAll: { fontSize: 13, fontWeight: "600", color: colors.primary },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 }}>
        <View>
          <Text style={styles.greeting}>
            {t('greeting')}, {profile?.firstName || "Donor"} 👋
          </Text>
          <Text style={styles.subGreeting}>{t('location')}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => router.push("/notifications")}>
          <Feather name="bell" size={22} color={colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Upcoming Appointment */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 4 }}>
        <Text style={styles.sectionLabel}>{t('upcomingAppt')}</Text>
      </View>

      {nextAppointment ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <UpcomingAppointmentCard appointment={nextAppointment} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <LinearGradient
            colors={glassColors}
            style={[glassCard, { padding: 18, gap: 14, borderWidth: 1, borderColor: glassBorder }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: isDark ? "rgba(51,65,85,0.6)" : "rgba(240,235,227,0.8)", alignItems: "center", justifyContent: "center" }}>
                <Feather name="calendar" size={24} color={colors.textMuted} />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 2 }}>{t('noApptTitle')}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('noApptSubtitle')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 12, paddingVertical: 10 }}
              onPress={() => { Haptics.selectionAsync(); router.push("/(tabs)/urgent"); }}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>{t('seeUrgent')}</Text>
              <Feather name="arrow-right" size={14} color={colors.primary} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Eligibility */}
      <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
        <Text style={styles.sectionLabel}>{t('donationEligibility')}</Text>
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <EligibilityCard daysLeft={daysLeft} lastDonation={profile?.lastDonationDate ?? null} />
      </View>

      {/* Blood type */}
      {profile?.bloodType && (
        <>
          <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
            <Text style={styles.sectionLabel}>{t('yourBloodType')}</Text>
          </View>
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <LinearGradient
              colors={glassColors}
              style={[glassCard, { padding: 18, flexDirection: "row", alignItems: "center", gap: 16, borderWidth: 1, borderColor: glassBorder }]}
            >
              <View style={{
                width: 64, height: 64, borderRadius: 20,
                backgroundColor: BLOOD_COLORS[profile.bloodType] || colors.primary,
                alignItems: "center", justifyContent: "center",
                shadowColor: BLOOD_COLORS[profile.bloodType] || colors.primary,
                shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
              }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff" }}>{profile.bloodType}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4 }}>{t('bloodTypeTitle')} {profile.bloodType}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16, marginBottom: 10 }}>
                  {profile.bloodType === "O-" ? t('universalDonor') : t('canHelpPatients')}
                </Text>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  onPress={() => router.push("/(tabs)/maps")} activeOpacity={0.85}
                >
                  <Feather name="map-pin" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>{t('findHospital')}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </>
      )}

      {/* Critical needs */}
      {urgentNeeds.length > 0 && (
        <>
          <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            <View style={styles.urgentHeader}>
              <Text style={styles.sectionLabel}>{t('criticalNeeds')}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/urgent")}>
                <Text style={styles.seeAll}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
            {urgentNeeds.map((n, i) => {
              const bloodColor = BLOOD_COLORS[n.type] || colors.primary;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => router.push({ pathname: "/appointment/book", params: { hospitalId: n.hospital.id } })}
                  activeOpacity={0.85}
                  style={{ borderRadius: 16, overflow: "hidden", shadowColor: bloodColor, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 }}
                >
                  <LinearGradient
                    colors={glassColors}
                    style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: glassBorder, borderLeftWidth: 3, borderLeftColor: bloodColor }}
                  >
                    <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: bloodColor, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>{n.type}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 2 }} numberOfLines={1}>{n.hospital.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{n.hospital.city} · {n.hospital.distance} km</Text>
                    </View>
                    <View style={{ backgroundColor: "#FEE2E2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: colors.primary, letterSpacing: 0.5 }}>{t('critical')}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}
