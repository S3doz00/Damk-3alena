import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
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
  const bloodColor = BLOOD_COLORS[item.bloodType] || "#C0392B";
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.separator }]}>
      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: bloodColor + "20", alignItems: "center", justifyContent: "center" }}>
        <Feather name="droplet" size={18} color={bloodColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 2 }} numberOfLines={1}>{item.hospitalName}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.hospitalCity}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: bloodColor }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>{item.bloodType}</Text>
        </View>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{formatDate(item.date)}</Text>
      </View>
    </View>
  );
}

function StatCard({ label, value, icon, color, colors }: { label: string; value: string; icon: string; color: string; colors: any }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 12, alignItems: "center", gap: 6, borderTopWidth: 3, borderTopColor: color, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: colors.separator }}>
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: "800", color: colors.text, textAlign: "center" }} numberOfLines={2} adjustsFontSizeToFit>{value}</Text>
      <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase", textAlign: "center", letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, donations, logout } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const completedDonations = donations.filter((d) => d.status === "completed");
  const totalDonations = completedDonations.length;
  const lastDonationDate = completedDonations.length > 0 ? completedDonations[0].date : null;
  const nextEligibleDate = getNextEligibleDate(profile?.lastDonationDate ?? null);

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm(t('signOutConfirm'))) doLogout();
    } else {
      Alert.alert(t('signOut'), t('signOutConfirm'), [
        { text: t('cancel'), style: "cancel" },
        { text: t('signOut'), style: "destructive", onPress: doLogout },
      ]);
    }
  };

  const doLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
  };

  const bloodColor = BLOOD_COLORS[profile?.bloodType || ""] || "#C0392B";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>{t('profile')}</Text>
        <TouchableOpacity
          style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
          onPress={() => router.push("/settings")}
        >
          <Feather name="settings" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 24, padding: 24, alignItems: "center", marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5, borderWidth: 1, borderColor: colors.separator }}>
        <View style={{ position: "relative", marginBottom: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: bloodColor, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff" }}>{profile?.avatarInitials || "??"}</Text>
          </View>
          <View style={{ position: "absolute", bottom: -6, right: -6, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 2, borderColor: colors.card, backgroundColor: bloodColor }}>
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>{profile?.bloodType || "--"}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 4 }}>{profile?.name || "Donor"}</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>{profile?.phone || ""}</Text>
        {profile?.city && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 }}>
            <Feather name="map-pin" size={13} color={colors.textMuted} />
            <Text style={{ fontSize: 13, color: colors.textMuted }}>{profile.city}</Text>
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Feather name="user" size={12} color={colors.textMuted} />
            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "500" }}>
              {profile?.gender === "male" ? t('male') : profile?.gender === "female" ? t('female') : "—"}
            </Text>
          </View>
          {profile?.dateOfBirth && (
            <>
              <View style={{ width: 1, height: 14, backgroundColor: colors.separator }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Feather name="calendar" size={12} color={colors.textMuted} />
                <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "500" }}>{profile.dateOfBirth}</Text>
              </View>
            </>
          )}
          {profile?.weightKg && (
            <>
              <View style={{ width: 1, height: 14, backgroundColor: colors.separator }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Feather name="activity" size={12} color={colors.textMuted} />
                <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "500" }}>{profile.weightKg} kg</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, marginBottom: 12 }}>{t('donationStats')}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label={t('totalDonations')} value={totalDonations.toString()} icon="droplet" color={colors.primary} colors={colors} />
          <StatCard label={t('lastDonationStat')} value={lastDonationDate ? formatDate(lastDonationDate) : t('noneYet')} icon="calendar" color="#7C3AED" colors={colors} />
          <StatCard label={t('nextEligible')} value={nextEligibleDate} icon="clock" color="#10B981" colors={colors} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8 }}>{t('donationHistory')}</Text>
          {completedDonations.length > 0 && (
            <View style={{ backgroundColor: "#FEF2F2", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>{completedDonations.length} {t('donations')}</Text>
            </View>
          )}
        </View>

        {completedDonations.length === 0 ? (
          <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: "center", gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: colors.separator }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" }}>
              <Feather name="droplet" size={28} color={colors.textMuted} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{t('noDonationsTitle')}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center" }}>{t('noDonationsDesc')}</Text>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, marginTop: 8 }}
              onPress={() => router.push("/(tabs)/maps")} activeOpacity={0.85}
            >
              <Feather name="map-pin" size={16} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{t('findHospitalBtn')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.card, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: colors.separator, overflow: "hidden" }}>
            {completedDonations.map((d, i) => (
              <DonationHistoryItem key={d.id} item={d} isLast={i === completedDonations.length - 1} colors={colors} />
            ))}
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, marginBottom: 12 }}>{t('quickActions')}</Text>
        <View style={{ backgroundColor: colors.card, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: colors.separator, overflow: "hidden" }}>
          {[
            { icon: "map", labelKey: "findHospitalBtn", onPress: () => router.push("/(tabs)/maps") },
            { icon: "alert-triangle", labelKey: "urgentRequests", onPress: () => router.push("/(tabs)/urgent") },
            { icon: "bell", labelKey: "notifications", onPress: () => router.push("/notifications") },
            { icon: "settings", labelKey: "settings", onPress: () => router.push("/settings") },
          ].map((a, i, arr) => (
            <React.Fragment key={a.labelKey}>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}
                onPress={() => { Haptics.selectionAsync(); a.onPress(); }}
                activeOpacity={0.75}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + "10", alignItems: "center", justifyContent: "center" }}>
                  <Feather name={a.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text }}>{t(a.labelKey)}</Text>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: colors.separator, marginLeft: 70 }} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: "#FEE2E2", backgroundColor: "#FFF5F5" }}
          onPress={handleLogout} activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>{t('signOut')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
