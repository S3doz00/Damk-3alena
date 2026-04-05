import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { useApp, BloodType, Gender } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const JORDAN_CITIES = [
  "Amman", "Zarqa", "Irbid", "Aqaba", "Salt", "Mafraq",
  "Jerash", "Ajloun", "Karak", "Tafileh", "Ma'an", "Madaba",
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function DatePickerModal({
  visible,
  value,
  onConfirm,
  onCancel,
  colors,
}: {
  visible: boolean;
  value: Date;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
  colors: any;
}) {
  const [selYear, setSelYear] = useState(value.getFullYear());
  const [selMonth, setSelMonth] = useState(value.getMonth());
  const [selDay, setSelDay] = useState(value.getDate());

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 80;
  const maxYear = currentYear - 10;

  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: colors.separator }}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>Date of Birth</Text>
            <TouchableOpacity onPress={() => onConfirm(new Date(selYear, selMonth, Math.min(selDay, daysInMonth)))}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>Confirm</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingTop: 16 }}>
            <ScrollView style={{ flex: 1.2 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textAlign: "center", marginBottom: 8 }}>DAY</Text>
              {days.map((d) => (
                <TouchableOpacity key={d} onPress={() => { setSelDay(d); Haptics.selectionAsync(); }}
                  style={{ paddingVertical: 10, borderRadius: 10, marginBottom: 4, backgroundColor: selDay === d ? colors.primary : "transparent", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: selDay === d ? "700" : "500", color: selDay === d ? "#fff" : colors.text }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={{ flex: 2 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textAlign: "center", marginBottom: 8 }}>MONTH</Text>
              {FULL_MONTHS.map((m, i) => (
                <TouchableOpacity key={m} onPress={() => { setSelMonth(i); Haptics.selectionAsync(); }}
                  style={{ paddingVertical: 10, borderRadius: 10, marginBottom: 4, backgroundColor: selMonth === i ? colors.primary : "transparent", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: selMonth === i ? "700" : "500", color: selMonth === i ? "#fff" : colors.text }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={{ flex: 1.5 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textAlign: "center", marginBottom: 8 }}>YEAR</Text>
              {years.map((y) => (
                <TouchableOpacity key={y} onPress={() => { setSelYear(y); Haptics.selectionAsync(); }}
                  style={{ paddingVertical: 10, borderRadius: 10, marginBottom: 4, backgroundColor: selYear === y ? colors.primary : "transparent", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: selYear === y ? "700" : "500", color: selYear === y ? "#fff" : colors.text }}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { profile, updateProfile } = useApp();
  const { lang, setLang, t } = useLanguage();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const parseDob = (dobStr: string): Date => {
    if (!dobStr) return new Date(2000, 0, 1);
    const parts = dobStr.split(" ");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = MONTHS.indexOf(parts[1]);
      const year = parseInt(parts[2]);
      if (!isNaN(day) && month >= 0 && !isNaN(year)) return new Date(year, month, day);
    }
    const d = new Date(dobStr);
    return isNaN(d.getTime()) ? new Date(2000, 0, 1) : d;
  };

  const formatDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [dob, setDob] = useState<Date>(parseDob(profile?.dateOfBirth || ""));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weightKg, setWeightKg] = useState(profile?.weightKg?.toString() || "");
  const [bloodType, setBloodType] = useState<BloodType | null>(profile?.bloodType || null);
  const [gender, setGender] = useState<Gender | null>(profile?.gender || null);
  const [city, setCity] = useState(profile?.city || "Amman");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('missingInfo'), t('enterFullName'));
      return;
    }
    setSaving(true);
    Haptics.selectionAsync();
    await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      dateOfBirth: formatDate(dob),
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      bloodType: bloodType || profile?.bloodType || null,
      gender: gender || profile?.gender || "male",
      city,
    });
    setSaving(false);
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSaved(false), 2000);
  };

  const THEME_OPTIONS: { labelKey: string; value: ThemeMode; icon: string; descKey: string }[] = [
    { labelKey: "lightMode", value: "light", icon: "sun", descKey: "alwaysLight" },
    { labelKey: "darkMode", value: "dark", icon: "moon", descKey: "alwaysDark" },
    { labelKey: "deviceDefault", value: "system", icon: "monitor", descKey: "followSystem" },
  ];

  const handleLangChange = async (value: "en" | "ar") => {
    Haptics.selectionAsync();
    await setLang(value);
  };

  const SectionLabel = ({ text }: { text: string }) => (
    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12, paddingHorizontal: 20 }}>
      {text}
    </Text>
  );

  const FieldLabel = ({ text }: { text: string }) => (
    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
      {text}
    </Text>
  );

  const inputWrap = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: botPad + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 28 }}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>{t('settings')}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{t('manageProfile')}</Text>
          </View>
        </View>

        {saved && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#D1FAE5", borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 20 }}>
            <Feather name="check-circle" size={16} color="#065F46" />
            <Text style={{ color: "#065F46", fontWeight: "600", fontSize: 14 }}>{t('profileUpdated')}</Text>
          </View>
        )}

        <SectionLabel text={t('sectionLanguage')} />
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View style={{ borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: colors.separator }}>
            {([
              { value: "en" as const, labelKey: "english", icon: "🇺🇸", descKey: "englishDesc" },
              { value: "ar" as const, labelKey: "arabic",  icon: "🇸🇦", descKey: "arabicDesc" },
            ]).map((opt, i, arr) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => handleLangChange(opt.value)}
                style={{
                  flexDirection: "row", alignItems: "center", padding: 16,
                  backgroundColor: colors.card,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: colors.separator,
                }}
                activeOpacity={0.75}
              >
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: lang === opt.value ? colors.primary + "20" : colors.inputBg, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{t(opt.labelKey)}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{t(opt.descKey)}</Text>
                </View>
                {lang === opt.value && (
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="check" size={13} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SectionLabel text={t('sectionAppearance')} />
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View style={{ borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: colors.separator }}>
            {THEME_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { setThemeMode(opt.value); Haptics.selectionAsync(); }}
                style={{
                  flexDirection: "row", alignItems: "center", padding: 16,
                  backgroundColor: colors.card,
                  borderBottomWidth: i < THEME_OPTIONS.length - 1 ? 1 : 0,
                  borderBottomColor: colors.separator,
                }}
                activeOpacity={0.75}
              >
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: themeMode === opt.value ? colors.primary + "20" : colors.inputBg, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <Feather name={opt.icon as any} size={18} color={themeMode === opt.value ? colors.primary : colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{t(opt.labelKey)}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{t(opt.descKey)}</Text>
                </View>
                {themeMode === opt.value && (
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="check" size={13} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SectionLabel text={t('personalInfo')} />
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel text={t('firstName')} />
              <View style={inputWrap}>
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 }}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor={colors.textMuted}
                  placeholder="First name"
                  autoCapitalize="words"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel text={t('lastName')} />
              <View style={inputWrap}>
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 }}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Last name"
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <FieldLabel text={t('phoneNumber')} />
            <View style={inputWrap}>
              <Feather name="phone" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: "600" }}>+962 </Text>
              <TextInput
                style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 }}
                value={phone.replace(/^\+962/, "")}
                onChangeText={(t) => setPhone("+962" + t.replace(/[^0-9]/g, "").slice(0, 9))}
                placeholderTextColor={colors.textMuted}
                placeholder="7X XXX XXXX"
                keyboardType="phone-pad"
                maxLength={9}
              />
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <FieldLabel text={t('nationalId')} />
            <View style={[inputWrap, { backgroundColor: colors.inputBg, opacity: 0.6 }]}>
              <Feather name="credit-card" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: colors.textMuted, paddingVertical: 12 }}
                value={profile?.nationalId || ""}
                editable={false}
                selectTextOnFocus={false}
              />
              <Feather name="lock" size={14} color={colors.textMuted} />
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 5, fontWeight: "500" }}>
              {t('nationalIdLocked')}
            </Text>
          </View>

          <View style={{ marginBottom: 16 }}>
            <FieldLabel text={t('dateOfBirth')} />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={inputWrap} activeOpacity={0.8}>
              <Feather name="calendar" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 }}>
                {formatDate(dob)}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <DatePickerModal
            visible={showDatePicker}
            value={dob}
            onConfirm={(d) => { setDob(d); setShowDatePicker(false); }}
            onCancel={() => setShowDatePicker(false)}
            colors={colors}
          />

          <View style={{ marginBottom: 16 }}>
            <FieldLabel text={t('weightOptional')} />
            <View style={inputWrap}>
              <Feather name="activity" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 }}
                value={weightKg}
                onChangeText={(t) => setWeightKg(t.replace(/[^0-9.]/g, ""))}
                placeholderTextColor={colors.textMuted}
                placeholder="e.g. 70"
                keyboardType="decimal-pad"
              />
              <Text style={{ fontSize: 14, color: colors.textMuted }}>kg</Text>
            </View>
          </View>
        </View>

        <SectionLabel text={t('bloodHealth')} />
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <FieldLabel text={t('bloodType')} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {BLOOD_TYPES.map((bt) => (
              <TouchableOpacity key={bt}
                style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: bloodType === bt ? colors.primary : colors.inputBg, borderWidth: 1.5, borderColor: bloodType === bt ? colors.primary : colors.inputBorder, minWidth: 65, alignItems: "center" }}
                onPress={() => { setBloodType(bt); Haptics.selectionAsync(); }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: bloodType === bt ? "#fff" : colors.textSecondary }}>{bt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FieldLabel text={t('gender')} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[{ labelKey: "male", value: "male" as Gender }, { labelKey: "female", value: "female" as Gender }].map((g) => (
              <TouchableOpacity key={g.value}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: gender === g.value ? colors.primary : colors.inputBorder, backgroundColor: gender === g.value ? colors.primary : colors.inputBg }}
                onPress={() => { setGender(g.value); Haptics.selectionAsync(); }}>
                <Feather name="user" size={16} color={gender === g.value ? "#fff" : colors.textSecondary} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: gender === g.value ? "#fff" : colors.textSecondary }}>{t(g.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SectionLabel text={t('sectionAccount')} />
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <FieldLabel text={t('emailAddressField')} />
          <TouchableOpacity
            onPress={() => router.push('/edit-email')}
            style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: colors.inputBg,
              borderWidth: 1.5, borderColor: colors.inputBorder,
              borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
            }}
            activeOpacity={0.75}
          >
            <Feather name="mail" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontSize: 15, color: colors.textSecondary }}>{profile?.email || ''}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>{t('editEmail')}</Text>
              <Feather name="chevron-right" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <SectionLabel text={t('locationSection')} />
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <FieldLabel text={t('city')} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {JORDAN_CITIES.map((c) => (
              <TouchableOpacity key={c}
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: city === c ? colors.primary : colors.inputBg, borderWidth: 1.5, borderColor: city === c ? colors.primary : colors.inputBorder }}
                onPress={() => { setCity(c); Haptics.selectionAsync(); }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: city === c ? "#fff" : colors.textSecondary }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17, borderRadius: 16, backgroundColor: colors.primary, opacity: saving ? 0.8 : 1 }}
            onPress={handleSave} disabled={saving} activeOpacity={0.85}
          >
            {saving ? (
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{t('saving')}</Text>
            ) : (
              <>
                <Feather name="save" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{t('saveChanges')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
});
