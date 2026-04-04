import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { useHospitals } from "@/lib/hooks";
import { useApp, Appointment } from "@/context/AppContext";

function eligibilityDaysLeft(lastDonation: string | null): number {
  if (!lastDonation) return 0;
  const diff = Date.now() - new Date(lastDonation).getTime();
  const daysDone = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, 90 - daysDone);
}

function formatDate(d: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const URGENCY_COLORS = { critical: "#C0392B", urgent: "#E67E22", pending: "#2980B9" };

function UpcomingAppointmentCard({ appointment }: { appointment: Appointment }) {
  const { colors } = useTheme();
  const bloodColors: Record<string, string> = {
    "O-": "#C0392B", "O+": "#E74C3C", "A+": "#8E44AD",
    "A-": "#9B59B6", "B+": "#2980B9", "B-": "#3498DB",
    "AB+": "#16A085", "AB-": "#1ABC9C",
  };
  const bloodColor = bloodColors[appointment.bloodType] || colors.primary;

  const styles = StyleSheet.create({
    ticketCard: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.card, borderRadius: 20, overflow: "hidden",
      shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
      borderWidth: 1, borderColor: colors.separator,
    },
    ticketLeft: {
      width: 70, alignItems: "center", justifyContent: "center",
      paddingVertical: 20, gap: 4,
    },
    ticketBloodType: { fontSize: 13, fontWeight: "800", color: "#fff" },
    ticketBody: { flex: 1, padding: 14, gap: 6 },
    ticketFileRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    ticketFileNum: { fontSize: 18, fontWeight: "900", color: colors.text, letterSpacing: 0.5 },
    ticketUpcomingBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#D1FAE5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    ticketUpcomingText: { fontSize: 10, fontWeight: "700", color: "#27AE60" },
    ticketHospital: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
    ticketMeta: { flexDirection: "row", gap: 14, marginTop: 4 },
    ticketMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    ticketMetaText: { fontSize: 12, color: colors.textMuted },
  });

  return (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => router.push({ pathname: "/appointment/ticket", params: { appointmentId: appointment.id } })}
      activeOpacity={0.88}
    >
      <View style={[styles.ticketLeft, { backgroundColor: bloodColor }]}>
        <Feather name="droplet" size={22} color="#fff" />
        <Text style={styles.ticketBloodType}>{appointment.bloodType}</Text>
      </View>
      <View style={styles.ticketBody}>
        <View style={styles.ticketFileRow}>
          <Text style={styles.ticketFileNum}>{appointment.fileNumber}</Text>
          <View style={styles.ticketUpcomingBadge}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#27AE60", marginRight: 4 }} />
            <Text style={styles.ticketUpcomingText}>Upcoming</Text>
          </View>
        </View>
        <Text style={styles.ticketHospital} numberOfLines={1}>{appointment.hospitalName}</Text>
        <View style={styles.ticketMeta}>
          <View style={styles.ticketMetaItem}>
            <Feather name="calendar" size={12} color={colors.textMuted} />
            <Text style={styles.ticketMetaText}>{appointment.date}</Text>
          </View>
          <View style={styles.ticketMetaItem}>
            <Feather name="clock" size={12} color={colors.textMuted} />
            <Text style={styles.ticketMetaText}>{appointment.time}</Text>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function EligibilityCard({ daysLeft, lastDonation }: { daysLeft: number; lastDonation: string | null }) {
  const { colors } = useTheme();
  const isEligible = daysLeft === 0;
  const progress = isEligible ? 1 : (90 - daysLeft) / 90;

  const styles = StyleSheet.create({
    eligibilityCard: {
      backgroundColor: colors.card, borderRadius: 20, padding: 18,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
      borderWidth: 1, borderColor: colors.separator,
      borderLeftWidth: 4,
    },
    eligibilityTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
    eligibilityIcon: {
      width: 44, height: 44, borderRadius: 13, backgroundColor: "#FEF2F2",
      alignItems: "center", justifyContent: "center",
    },
    eligibilityTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: 2 },
    eligibilitySubtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    eligibilityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    progressContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    progressBar: { flex: 1, height: 6, backgroundColor: colors.separator, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 3 },
    progressLabel: { fontSize: 12, fontWeight: "700", color: colors.primary, width: 36, textAlign: "right" },
    lastDonationText: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  });

  return (
    <View style={[styles.eligibilityCard, { borderLeftColor: isEligible ? "#27AE60" : colors.primary }]}>
      <View style={styles.eligibilityTop}>
        <View style={styles.eligibilityIcon}>
          <Feather name={isEligible ? "check-circle" : "clock"} size={22} color={isEligible ? "#27AE60" : colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eligibilityTitle}>
            {isEligible ? "You Can Donate!" : `${daysLeft} Days Left`}
          </Text>
          <Text style={styles.eligibilitySubtitle}>
            {isEligible
              ? "You are eligible to donate blood today."
              : `${90 - daysLeft} of 90 days since your last donation`}
          </Text>
        </View>
        {isEligible && (
          <View style={[styles.eligibilityBadge, { backgroundColor: "#D1FAE5" }]}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#27AE60" }}>Eligible</Text>
          </View>
        )}
      </View>
      {!isEligible && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: colors.primary }]} />
          </View>
          <Text style={styles.progressLabel}>{Math.round(progress * 100)}%</Text>
        </View>
      )}
      {lastDonation && (
        <Text style={styles.lastDonationText}>
          Last donation: {new Date(lastDonation).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </Text>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { profile, appointments, unreadCount } = useApp();
  const { hospitals } = useHospitals();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    greeting: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
    subGreeting: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    notifBtn: {
      width: 46, height: 46, borderRadius: 14, backgroundColor: colors.card,
      alignItems: "center", justifyContent: "center", position: "relative",
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    badge: {
      position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9,
      backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
      borderWidth: 2, borderColor: "#fff",
    },
    badgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
    sectionLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, marginBottom: 10 },
    noAppointmentCard: {
      backgroundColor: colors.card, borderRadius: 20, padding: 18,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      borderWidth: 1, borderColor: colors.separator, gap: 14,
    },
    noAppointmentLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
    noAppointmentIcon: {
      width: 48, height: 48, borderRadius: 14, backgroundColor: colors.inputBg,
      alignItems: "center", justifyContent: "center",
    },
    noAppointmentTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 2 },
    noAppointmentSubtitle: { fontSize: 12, color: colors.textSecondary },
    noAppointmentBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 6, borderWidth: 1.5, borderColor: colors.primary,
      borderRadius: 12, paddingVertical: 10,
    },
    noAppointmentBtnText: { fontSize: 14, fontWeight: "700", color: colors.primary },
    bloodTypeCard: {
      backgroundColor: colors.card, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 16,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
      borderWidth: 1, borderColor: colors.separator,
    },
    bloodTypeBig: {
      width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center",
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    bloodTypeText: { fontSize: 20, fontWeight: "900", color: "#fff" },
    bloodTypeTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4 },
    bloodTypeSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 16, marginBottom: 10 },
    findHospitalBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    findHospitalText: { fontSize: 13, fontWeight: "600", color: colors.primary },
    urgentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    seeAll: { fontSize: 13, fontWeight: "600", color: colors.primary },
    urgentCard: {
      flexDirection: "row", alignItems: "center", gap: 14,
      backgroundColor: colors.card, borderRadius: 16, padding: 14,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
      borderWidth: 1, borderColor: colors.separator, borderLeftWidth: 3, borderLeftColor: colors.primary,
    },
    urgentBlood: {
      width: 46, height: 46, borderRadius: 13, backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center",
    },
    urgentBloodText: { fontSize: 14, fontWeight: "800", color: "#fff" },
    urgentHospital: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 2 },
    urgentCity: { fontSize: 12, color: colors.textSecondary },
    urgentBadge: { backgroundColor: "#FEE2E2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    urgentBadgeText: { fontSize: 10, fontWeight: "700", color: colors.primary, letterSpacing: 0.5 },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <View>
          <Text style={styles.greeting}>
            Ahlan, {profile?.firstName || "Donor"} 👋
          </Text>
          <Text style={styles.subGreeting}>Amman, Jordan</Text>
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

      {/* Appointment ticket or book CTA */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 4 }}>
        <Text style={styles.sectionLabel}>UPCOMING APPOINTMENT</Text>
      </View>

      {nextAppointment ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <UpcomingAppointmentCard appointment={nextAppointment} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={styles.noAppointmentCard}>
            <View style={styles.noAppointmentLeft}>
              <View style={styles.noAppointmentIcon}>
                <Feather name="calendar" size={24} color={colors.textMuted} />
              </View>
              <View>
                <Text style={styles.noAppointmentTitle}>No Upcoming Appointment</Text>
                <Text style={styles.noAppointmentSubtitle}>Help someone in need — donate today</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.noAppointmentBtn}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(tabs)/urgent");
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.noAppointmentBtnText}>See Urgent</Text>
              <Feather name="arrow-right" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Eligibility */}
      <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
        <Text style={styles.sectionLabel}>DONATION ELIGIBILITY</Text>
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <EligibilityCard daysLeft={daysLeft} lastDonation={profile?.lastDonationDate ?? null} />
      </View>

      {/* Blood type */}
      {profile?.bloodType && (
        <>
          <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
            <Text style={styles.sectionLabel}>YOUR BLOOD TYPE</Text>
          </View>
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View style={styles.bloodTypeCard}>
              <View style={styles.bloodTypeBig}>
                <Text style={styles.bloodTypeText}>{profile.bloodType}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bloodTypeTitle}>Blood Type {profile.bloodType}</Text>
                <Text style={styles.bloodTypeSubtitle}>
                  {profile.bloodType === "O-"
                    ? "Universal donor — your blood is the most needed"
                    : "You can help patients who need your blood type"}
                </Text>
                <TouchableOpacity
                  style={styles.findHospitalBtn}
                  onPress={() => router.push("/(tabs)/maps")} activeOpacity={0.85}
                >
                  <Feather name="map-pin" size={14} color={colors.primary} />
                  <Text style={styles.findHospitalText}>Find a hospital</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Critical needs */}
      {urgentNeeds.length > 0 && (
        <>
          <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            <View style={styles.urgentHeader}>
              <Text style={styles.sectionLabel}>CRITICAL BLOOD NEEDS</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/urgent")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
            {urgentNeeds.map((n, i) => (
              <TouchableOpacity
                key={i}
                style={styles.urgentCard}
                onPress={() => router.push({ pathname: "/appointment/book", params: { hospitalId: n.hospital.id } })}
                activeOpacity={0.85}
              >
                <View style={styles.urgentBlood}>
                  <Text style={styles.urgentBloodText}>{n.type}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.urgentHospital} numberOfLines={1}>{n.hospital.name}</Text>
                  <Text style={styles.urgentCity}>{n.hospital.city} · {n.hospital.distance} km</Text>
                </View>
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>CRITICAL</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
