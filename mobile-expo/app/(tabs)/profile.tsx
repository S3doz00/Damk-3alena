import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Donation, useApp } from "@/context/AppContext";

const BLOOD_COLORS: Record<string, string> = {
  "O-": "#C0392B", "O+": "#E74C3C", "A+": "#8E44AD",
  "A-": "#9B59B6", "B+": "#2980B9", "B-": "#3498DB",
  "AB+": "#16A085", "AB-": "#1ABC9C",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getNextEligibleDate(lastDonation: string | null): string {
  if (!lastDonation) return "Now";
  const next = new Date(lastDonation);
  next.setDate(next.getDate() + 90);
  const today = new Date();
  if (next <= today) return "Now";
  return formatDate(next.toISOString());
}

function DonationHistoryItem({ item, isLast, colors }: { item: Donation; isLast: boolean; colors: any }) {
  const bloodColor = BLOOD_COLORS[item.bloodType] || colors.primary;

  const styles = StyleSheet.create({
    historyItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
    historyItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.separator },
    historyIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    historyHospital: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 2 },
    historyCity: { fontSize: 12, color: colors.textSecondary },
    historyBloodBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    historyBloodText: { fontSize: 12, fontWeight: "800", color: "#fff" },
    historyDate: { fontSize: 12, color: colors.textMuted },
  });

  return (
    <View style={[styles.historyItem, !isLast && styles.historyItemBorder]}>
      <View style={[styles.historyIcon, { backgroundColor: bloodColor + "20" }]}>
        <Feather name="droplet" size={18} color={bloodColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyHospital} numberOfLines={1}>{item.hospitalName}</Text>
        <Text style={styles.historyCity}>{item.hospitalCity}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={[styles.historyBloodBadge, { backgroundColor: bloodColor }]}>
          <Text style={styles.historyBloodText}>{item.bloodType}</Text>
        </View>
        <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
      </View>
    </View>
  );
}

function StatCard({ label, value, icon, color, colors }: { label: string; value: string; icon: string; color: string; colors: any }) {
  const styles = StyleSheet.create({
    statCard: {
      flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 12,
      alignItems: "center", gap: 6, borderTopWidth: 3,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      borderWidth: 1, borderColor: colors.separator,
    },
    statIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    statValue: { fontSize: 13, fontWeight: "800", color: colors.text, textAlign: "center" },
    statLabel: { fontSize: 9, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase", textAlign: "center", letterSpacing: 0.3 },
  });

  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statValue} numberOfLines={2} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, donations, logout } = useApp();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const completedDonations = donations.filter((d) => d.status === "completed");
  const totalDonations = completedDonations.length;
  const lastDonationDate = completedDonations.length > 0 ? completedDonations[0].date : null;
  const nextEligibleDate = getNextEligibleDate(profile?.lastDonationDate ?? null);

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        doLogout();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  const doLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
  };

  const bloodColor = BLOOD_COLORS[profile?.bloodType || ""] || colors.primary;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 20 },
    pageTitle: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
    settingsBtn: {
      width: 42, height: 42, borderRadius: 13, backgroundColor: colors.card,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    profileCard: {
      marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 24, padding: 24,
      alignItems: "center", marginBottom: 24,
      shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
      borderWidth: 1, borderColor: colors.separator,
    },
    avatarWrap: { position: "relative", marginBottom: 14 },
    avatar: {
      width: 80, height: 80, borderRadius: 24,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
    },
    avatarText: { fontSize: 28, fontWeight: "900", color: "#fff" },
    bloodTypeDot: {
      position: "absolute", bottom: -6, right: -6, borderRadius: 10,
      paddingHorizontal: 8, paddingVertical: 3, borderWidth: 2, borderColor: "#fff",
    },
    bloodTypeDotText: { fontSize: 12, fontWeight: "800", color: "#fff" },
    profileName: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 4 },
    profilePhone: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
    profileMetaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" },
    profileMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    profileMetaText: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
    profileMetaDivider: { width: 1, height: 14, backgroundColor: colors.separator },
    sectionWrap: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: { fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, marginBottom: 12 },
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    donationCountBadge: { backgroundColor: "#FEF2F2", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    donationCountText: { fontSize: 12, fontWeight: "700", color: colors.primary },
    statsRow: { flexDirection: "row", gap: 10 },
    historyList: {
      backgroundColor: colors.card, borderRadius: 20,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
      borderWidth: 1, borderColor: colors.separator, overflow: "hidden",
    },
    emptyHistory: {
      backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: "center", gap: 10,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      borderWidth: 1, borderColor: colors.separator,
    },
    emptyHistoryIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" },
    emptyHistoryTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
    emptyHistorySubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
    donateNowBtn: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 20,
      borderRadius: 14, marginTop: 8,
    },
    donateNowText: { fontSize: 14, fontWeight: "700", color: "#fff" },
    actionsCard: {
      backgroundColor: colors.card, borderRadius: 20,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      borderWidth: 1, borderColor: colors.separator, overflow: "hidden",
    },
    actionRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
    actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" },
    actionLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
    actionDivider: { height: 1, backgroundColor: colors.separator, marginLeft: 70 },
    signOutBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 10, paddingVertical: 16, borderRadius: 16,
      borderWidth: 2, borderColor: "#FEE2E2", backgroundColor: "#FFF5F5",
    },
    signOutText: { fontSize: 16, fontWeight: "700", color: "#E74C3C" },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push("/settings")}>
          <Feather name="settings" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: bloodColor }]}>
            <Text style={styles.avatarText}>{profile?.avatarInitials || "??"}</Text>
          </View>
          <View style={[styles.bloodTypeDot, { backgroundColor: bloodColor }]}>
            <Text style={styles.bloodTypeDotText}>{profile?.bloodType || "--"}</Text>
          </View>
        </View>
        <Text style={styles.profileName}>{profile?.name || "Donor"}</Text>
        <Text style={styles.profilePhone}>{profile?.phone || ""}</Text>

        <View style={styles.profileMetaRow}>
          {profile?.nationalId && (
            <>
              <View style={styles.profileMetaItem}>
                <Feather name="credit-card" size={12} color={colors.textMuted} />
                <Text style={styles.profileMetaText}>ID: {profile.nationalId}</Text>
              </View>
              <View style={styles.profileMetaDivider} />
            </>
          )}
          <View style={styles.profileMetaItem}>
            <Feather name="user" size={12} color={colors.textMuted} />
            <Text style={styles.profileMetaText}>
              {profile?.gender === "male" ? "Male" : profile?.gender === "female" ? "Female" : "—"}
            </Text>
          </View>
          {profile?.dateOfBirth && (
            <>
              <View style={styles.profileMetaDivider} />
              <View style={styles.profileMetaItem}>
                <Feather name="calendar" size={12} color={colors.textMuted} />
                <Text style={styles.profileMetaText}>{profile.dateOfBirth}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Donation stats */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>DONATION STATISTICS</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="Total Donations"
            value={totalDonations.toString()}
            icon="droplet"
            color={colors.primary}
            colors={colors}
          />
          <StatCard
            label="Last Donation"
            value={lastDonationDate ? formatDate(lastDonationDate) : "None yet"}
            icon="calendar"
            color="#8E44AD"
            colors={colors}
          />
          <StatCard
            label="Next Eligible"
            value={nextEligibleDate}
            icon="clock"
            color="#27AE60"
            colors={colors}
          />
        </View>
      </View>

      {/* Donation history */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>DONATION HISTORY</Text>
          {completedDonations.length > 0 && (
            <View style={styles.donationCountBadge}>
              <Text style={styles.donationCountText}>{completedDonations.length} donations</Text>
            </View>
          )}
        </View>

        {completedDonations.length === 0 ? (
          <View style={styles.emptyHistory}>
            <View style={styles.emptyHistoryIcon}>
              <Feather name="droplet" size={28} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyHistoryTitle}>No Donations Yet</Text>
            <Text style={styles.emptyHistorySubtitle}>Start your journey and help save lives</Text>
            <TouchableOpacity style={styles.donateNowBtn} onPress={() => router.push("/(tabs)/maps")} activeOpacity={0.85}>
              <Feather name="map-pin" size={16} color="#fff" />
              <Text style={styles.donateNowText}>Find a Hospital</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.historyList}>
            {completedDonations.map((d, i) => (
              <DonationHistoryItem key={d.id} item={d} isLast={i === completedDonations.length - 1} colors={colors} />
            ))}
          </View>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsCard}>
          {[
            { icon: "map", label: "Find a Hospital", onPress: () => router.push("/(tabs)/maps") },
            { icon: "alert-triangle", label: "Urgent Requests", onPress: () => router.push("/(tabs)/urgent") },
            { icon: "bell", label: "Notifications", onPress: () => router.push("/notifications") },
          ].map((a, i, arr) => (
            <React.Fragment key={a.label}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => { Haptics.selectionAsync(); a.onPress(); }}
                activeOpacity={0.75}
              >
                <View style={styles.actionIcon}>
                  <Feather name={a.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.actionDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Sign out */}
      <View style={styles.sectionWrap}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#E74C3C" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
