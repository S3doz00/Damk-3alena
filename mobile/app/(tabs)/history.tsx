import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Platform,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BloodTypeBadge from "@/components/BloodTypeBadge";
import GlassCard from "@/components/GlassCard";
import { Fonts } from "@/constants/fonts";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Donation, useApp } from "@/context/AppContext";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const BLOOD_COLOR: Record<string, string> = {
  "O-": "#BE123C", "O+": "#E11D48", "A+": "#7C3AED", "A-": "#9B59B6",
  "B+": "#2563EB", "B-": "#3498DB", "AB+": "#0D9488", "AB-": "#1ABC9C",
};

function DonationItem({ item, colors, t }: { item: Donation; colors: any; t: (k: string) => string }) {
  const isCompleted = item.status === "completed";
  const isScheduled = item.status === "scheduled";

  const statusBg = isCompleted ? "#D1FAE5" : isScheduled ? "#DBEAFE" : "#FEE2E2";
  const statusColor = isCompleted ? "#065F46" : isScheduled ? "#1E40AF" : "#991B1B";
  const statusIcon = isCompleted ? "check-circle" : isScheduled ? "clock" : "x-circle";
  const statusLabel = isCompleted ? t('statusCompleted') : isScheduled ? t('statusScheduled') : t('statusCancelled');
  const bloodColor = BLOOD_COLOR[item.bloodType] || colors.primary;

  return (
    <View style={{ marginBottom: 10 }}>
      <GlassCard glowColor={bloodColor} borderRadius={14}>
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
            <BloodTypeBadge type={item.bloodType} size="sm" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: colors.text }} numberOfLines={1}>{item.hospitalName}</Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{item.hospitalCity}</Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: colors.textMuted, marginTop: 3 }}>{formatDate(item.date)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: statusBg }}>
            <Feather name={statusIcon as any} size={12} color={statusColor} />
            <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: statusColor, textTransform: "capitalize", letterSpacing: 0.3 }}>{statusLabel}</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

export default function HistoryScreen() {
  const { donations, appointments, profile } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const allEntries: Donation[] = [
    ...donations,
    ...appointments
      .filter((a) => a.status !== "cancelled")
      .map((a) => ({
        id: a.id,
        date: a.date,
        hospitalName: a.hospitalName,
        hospitalCity: "",
        bloodType: profile?.bloodType || ("A+" as any),
        units: 1,
        status: a.status === "upcoming" ? ("scheduled" as const) : ("completed" as const),
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: topPad + 16, paddingBottom: 16 }}>
        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 28, color: colors.text, letterSpacing: -0.7 }}>{t('historyTitle')}</Text>
        <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 20, letterSpacing: 0.2 }}>
          {donations.length} {t('completedDonations')}
        </Text>
        <GlassCard glowColor={colors.primary} borderRadius={16}>
          <View style={{ flexDirection: "row", padding: 20 }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontFamily: Fonts.extrabold, fontSize: 24, color: colors.primary, letterSpacing: -0.5 }}>{donations.length}</Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 11.5, color: colors.textSecondary, marginTop: 4, letterSpacing: 0.3, textTransform: "uppercase" }}>{t('statTotal')}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.separator }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontFamily: Fonts.extrabold, fontSize: 24, color: "#3498DB", letterSpacing: -0.5 }}>{donations.length * 3}</Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 11.5, color: colors.textSecondary, marginTop: 4, letterSpacing: 0.3, textTransform: "uppercase" }}>{t('statLivesHelped')}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.separator }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontFamily: Fonts.extrabold, fontSize: 24, color: "#10B981", letterSpacing: -0.5 }}>{(donations.length * 0.45).toFixed(1)}L</Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 11.5, color: colors.textSecondary, marginTop: 4, letterSpacing: 0.3, textTransform: "uppercase" }}>{t('statBloodGiven')}</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      <FlatList
        data={allEntries}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => <DonationItem item={item} colors={colors} t={t} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: botPad + 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 40 }}>
            <Feather name="droplet" size={48} color={colors.textMuted} />
            <Text style={{ fontFamily: Fonts.extrabold, fontSize: 20, color: colors.text, letterSpacing: -0.3 }}>{t('noHistoryTitle')}</Text>
            <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>{t('noHistoryDesc')}</Text>
          </View>
        }
      />
    </View>
  );
}
