import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme, ThemePreference } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

const THEME_OPTIONS: { value: ThemePreference; labelKey: string; icon: string; descKey: string }[] = [
  { value: "device", labelKey: "deviceDefault", icon: "monitor", descKey: "followSystem" },
  { value: "light",  labelKey: "lightMode",     icon: "sun",     descKey: "alwaysLight" },
  { value: "dark",   labelKey: "darkMode",       icon: "moon",    descKey: "alwaysDark" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const { colors, preference, setPreference } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleThemeChange = async (value: ThemePreference) => {
    Haptics.selectionAsync();
    await setPreference(value);
  };

  const handleLangChange = async (value: "en" | "ar") => {
    Haptics.selectionAsync();
    await setLang(value);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, marginBottom: 24,
    },
    backBtn: {
      width: 42, height: 42, borderRadius: 13, backgroundColor: colors.card,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    pageTitle: { fontSize: 20, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
    profileRow: {
      flexDirection: "row", alignItems: "center", gap: 14,
      marginHorizontal: 20, marginBottom: 28,
      backgroundColor: colors.card, borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: colors.separator,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    profileAvatar: {
      width: 48, height: 48, borderRadius: 14,
      alignItems: "center", justifyContent: "center",
    },
    profileAvatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
    profileName: { fontSize: 16, fontWeight: "700", color: colors.text },
    profilePhone: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: {
      fontSize: 11, fontWeight: "700", color: colors.textMuted,
      letterSpacing: 0.8, marginBottom: 10, textTransform: "uppercase",
    },
    card: {
      backgroundColor: colors.card, borderRadius: 18, overflow: "hidden",
      borderWidth: 1, borderColor: colors.separator,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    optionRow: {
      flexDirection: "row", alignItems: "center", gap: 14, padding: 16,
    },
    optionIcon: {
      width: 38, height: 38, borderRadius: 11,
      backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center",
    },
    optionIconActive: { backgroundColor: colors.primary },
    optionLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
    optionDesc: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
    radio: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: colors.inputBorder,
      alignItems: "center", justifyContent: "center",
    },
    radioActive: { borderColor: colors.primary },
    radioDot: {
      width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary,
    },
    divider: { height: 1, backgroundColor: colors.separator, marginLeft: 68 },
    infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
    infoLabel: { fontSize: 15, fontWeight: "500", color: colors.text },
    infoValue: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{t('settings')}</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Profile info */}
      {profile && (
        <View style={styles.profileRow}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.profileAvatarText}>{profile.avatarInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profilePhone}>{profile.phone}</Text>
          </View>
        </View>
      )}

      {/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('sectionLanguage')}</Text>
        <View style={styles.card}>
          {([
            { value: "en" as const, labelKey: "english", icon: "🇺🇸", descKey: "englishDesc" },
            { value: "ar" as const, labelKey: "arabic",  icon: "🇸🇦", descKey: "arabicDesc" },
          ]).map((opt, i, arr) => (
            <React.Fragment key={opt.value}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => handleLangChange(opt.value)}
                activeOpacity={0.75}
              >
                <View style={[styles.optionIcon, lang === opt.value && styles.optionIconActive]}>
                  <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{t(opt.labelKey)}</Text>
                  <Text style={styles.optionDesc}>{t(opt.descKey)}</Text>
                </View>
                <View style={[styles.radio, lang === opt.value && styles.radioActive]}>
                  {lang === opt.value && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('sectionAppearance')}</Text>
        <View style={styles.card}>
          {THEME_OPTIONS.map((opt, i) => (
            <React.Fragment key={opt.value}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => handleThemeChange(opt.value)}
                activeOpacity={0.75}
              >
                <View style={[styles.optionIcon, preference === opt.value && styles.optionIconActive]}>
                  <Feather
                    name={opt.icon as any}
                    size={18}
                    color={preference === opt.value ? "#fff" : colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{t(opt.labelKey)}</Text>
                  <Text style={styles.optionDesc}>{t(opt.descKey)}</Text>
                </View>
                <View style={[styles.radio, preference === opt.value && styles.radioActive]}>
                  {preference === opt.value && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
              {i < THEME_OPTIONS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('sectionAccount')}</Text>
        <View style={styles.card}>
          {[
            { icon: "user",    labelKey: "editProfile",    onPress: () => router.push("/onboarding") },
            { icon: "mail",    labelKey: "editEmail",      onPress: () => router.push("/edit-email") },
            { icon: "bell",    labelKey: "notifications",  onPress: () => router.push("/notifications") },
            { icon: "map-pin", labelKey: "resetLocation",  onPress: async () => {
              await AsyncStorage.removeItem("locationAsked");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.push("/auth/location");
            }},
          ].map((item, i, arr) => (
            <React.Fragment key={item.labelKey}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => { Haptics.selectionAsync(); item.onPress(); }}
                activeOpacity={0.75}
              >
                <View style={styles.optionIcon}>
                  <Feather name={item.icon as any} size={18} color={colors.textSecondary} />
                </View>
                <Text style={[styles.optionLabel, { flex: 1 }]}>{t(item.labelKey)}</Text>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('sectionAbout')}</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('appVersion')}</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('builtFor')}</Text>
            <Text style={styles.infoValue}>Jordan</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
