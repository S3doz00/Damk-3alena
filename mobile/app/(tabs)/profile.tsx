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
import GlassCard from "@/components/GlassCard";
import { Fonts } from "@/constants/fonts";
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
        <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: colors.text, marginBottom: 2 }} numberOfLines={1}>{item.hospitalName}</Text>
        <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textSecondary }}>{item.hospitalCity}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: bloodColor }}>
          <Text style={{ fontFamily: Fonts.extrabold, fontSize: 12, color: "#fff", letterSpacing: -0.2 }}>{item.bloodType}</Text>
        </View>
        <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textMuted }}>{formatDate(item.date)}</Text>
      </View>
    </View>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string; colors: any }) {
  const { colors: themeColors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <GlassCard glowColor={color} borderRadius={16}>
        <View style={{ padding: 12, alignItems: "center", gap: 6 }}>
          <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
            <Feather name={icon as any} size={18} color={color} />
          </View>
          <Text style={{ fontFamily: Fonts.extrabold, fontSize: 13, color: themeColors.text, textAlign: "center", letterSpacing: -0.2 }} numberOfLines={2} adjustsFontSizeToFit>{value}</Text>
          <Text style={{ fontFamily: Fonts.extrabold, fontSize: 9, color: themeColors.textMuted, textTransform: "uppercase", textAlign: "center", letterSpacing: 0.8 }}>{label}</Text>
        </View>
      </GlassCard>
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
        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 28, color: colors.text, letterSpacing: -0.7 }}>{t('profile')}</Text>
        <TouchableOpacity
          style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
          onPress={() => router.push("/settings")}
        >
          <Feather name="settings" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <GlassCard glowColor={bloodColor} borderRadius={24}>
          <View style={{ padding: 24, alignItems: "center" }}>
            <View style={{ position: "relative", marginBottom: 14 }}>
              <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: bloodColor, alignItems: "center", justifyContent: "center", shadowColor: bloodColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 }}>
                <Text style={{ fontFamily: Fonts.extrabold, fontSize: 28, color: "#fff", letterSpacing: -0.8 }}>{profile?.avatarInitials || "??"}</Text>
              </View>
              <View style={{ position: "absolute", bottom: -6, right: -6, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 2, borderColor: colors.card, backgroundColor: bloodColor }}>
                <Text style={{ fontFamily: Fonts.extrabold, fontSize: 12, color: "#fff", letterSpacing: -0.2 }}>{profile?.bloodType || "--"}</Text>
              </View>
            </View>
            <Text style={{ fontFamily: Fonts.extrabold, fontSize: 22, color: colors.text, marginBottom: 4, letterSpacing: -0.4 }}>{profile?.name || "Donor"}</Text>
            <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>{profile?.phone || ""}</Text>
            {profile?.city && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 }}>
                <Feather name="map-pin" size={13} color={colors.textMuted} />
                <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: colors.textMuted }}>{profile.city}</Text>
              </View>
            )}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Feather name="user" size={12} color={colors.textMuted} />
                <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textMuted }}>
                  {profile?.gender === "male" ? t('male') : profile?.gender === "female" ? t('female') : "—"}
                </Text>
              </View>
              {profile?.dateOfBirth && (
                <>
                  <View style={{ width: 1, height: 14, backgroundColor: colors.separator }} />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Feather name="calendar" size={12} color={colors.textMuted} />
                    <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textMuted }}>{profile.dateOfBirth}</Text>
                  </View>
                </>
              )}
              {profile?.weightKg && (
                <>
                  <View style={{ width: 1, height: 14, backgroundColor: colors.separator }} />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Feather name="activity" size={12} color={colors.textMuted} />
                    <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textMuted }}>{profile.weightKg} kg</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </GlassCard>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 11, color: colors.textMuted, letterSpacing: 1.4, marginBottom: 12, textTransform: "uppercase" }}>{t('donationStats')}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label={t('totalDonations')} value={totalDonations.toString()} icon="droplet" color={colors.primary} colors={colors} />
          <StatCard label={t('lastDonationStat')} value={lastDonationDate ? formatDate(lastDonationDate) : t('noneYet')} icon="calendar" color="#7C3AED" colors={colors} />
          <StatCard label={t('nextEligible')} value={nextEligibleDate} icon="clock" color="#10B981" colors={colors} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontFamily: Fonts.extrabold, fontSize: 11, color: colors.textMuted, letterSpacing: 1.4, textTransform: "uppercase" }}>{t('donationHistory')}</Text>
          {completedDonations.length > 0 && (
            <View style={{ backgroundColor: "#FEF2F2", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: colors.primary }}>{completedDonations.length} {t('donations')}</Text>
            </View>
          )}
        </View>

        {completedDonations.length === 0 ? (
          <GlassCard glowColor={colors.primary} borderRadius={20}>
            <View style={{ padding: 32, alignItems: "center", gap: 10 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" }}>
                <Feather name="droplet" size={28} color={colors.textMuted} />
              </View>
              <Text style={{ fontFamily: Fonts.extrabold, fontSize: 17, color: colors.text, letterSpacing: -0.3 }}>{t('noDonationsTitle')}</Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: colors.textSecondary, textAlign: "center" }}>{t('noDonationsDesc')}</Text>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, marginTop: 8 }}
                onPress={() => router.push("/(tabs)/maps")} activeOpacity={0.85}
              >
                <Feather name="map-pin" size={16} color="#fff" />
                <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: "#fff", letterSpacing: 0.2 }}>{t('findHospitalBtn')}</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : (
          <GlassCard glowColor={colors.primary} borderRadius={20}>
            <View>
              {completedDonations.map((d, i) => (
                <DonationHistoryItem key={d.id} item={d} isLast={i === completedDonations.length - 1} colors={colors} />
              ))}
            </View>
          </GlassCard>
        )}
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 11, color: colors.textMuted, letterSpacing: 1.4, marginBottom: 12, textTransform: "uppercase" }}>{t('quickActions')}</Text>
        <GlassCard glowColor={colors.primary} borderRadius={20}>
          <View>
            {[
              { icon: "map", labelKey: "findHospitalBtn", onPress: () => router.push("/(tabs)/maps") },
              { icon: "alert-triangle", labelKey: "urgentRequests", onPress: () => router.push("/(tabs)/urgent") },
              { icon: "calendar", labelKey: "myCampaigns", onPress: () => router.push("/my-campaigns") },
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
                  <Text style={{ flex: 1, fontFamily: Fonts.semibold, fontSize: 15, color: colors.text }}>{t(a.labelKey) || a.labelKey}</Text>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: colors.separator, marginLeft: 70 }} />}
              </React.Fragment>
            ))}
          </View>
        </GlassCard>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: "#FEE2E2", backgroundColor: "#FFF5F5" }}
          onPress={handleLogout} activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={colors.primary} />
          <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: colors.primary, letterSpacing: 0.2 }}>{t('signOut')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
