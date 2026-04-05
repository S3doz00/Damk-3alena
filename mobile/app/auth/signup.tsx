import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useTheme } from "@/context/ThemeContext";
import { BloodType, Gender, useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const JORDAN_CITIES = [
  "Amman", "Zarqa", "Irbid", "Aqaba", "Salt", "Mafraq",
  "Jerash", "Ajloun", "Karak", "Tafileh", "Ma'an", "Madaba",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function StepIndicator({ step, total, colors }: { step: number; total: number; colors: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => {
        const s = i + 1;
        return (
          <React.Fragment key={s}>
            <View style={[
              { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2 },
              s <= step
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }
            ]}>
              {s < step ? (
                <Feather name="check" size={12} color="#fff" />
              ) : (
                <Text style={{ fontSize: 13, fontWeight: "700", color: s === step ? "#fff" : colors.textMuted }}>{s}</Text>
              )}
            </View>
            {s < total && (
              <View style={{ flex: 1, height: 2, backgroundColor: s < step ? colors.primary : colors.separator, marginHorizontal: 6 }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const COLUMN_HEIGHT = 240;

function PickerColumn({
  items,
  selected,
  onSelect,
  label,
  flex,
  colors,
}: {
  items: (string | number)[];
  selected: string | number;
  onSelect: (v: string | number) => void;
  label: string;
  flex: number;
  colors: any;
}) {
  return (
    <View style={{ flex, borderRightWidth: 0 }}>
      <Text style={{ fontSize: 10, fontWeight: "800", color: colors.textMuted, textAlign: "center", marginBottom: 8, letterSpacing: 0.8 }}>
        {label}
      </Text>
      <ScrollView
        style={{ height: COLUMN_HEIGHT }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {items.map((item) => {
          const isSelected = item === selected;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => { onSelect(item); Haptics.selectionAsync(); }}
              style={{
                paddingVertical: 9,
                borderRadius: 10,
                marginBottom: 3,
                marginHorizontal: 4,
                backgroundColor: isSelected ? colors.primary : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: isSelected ? "700" : "400", color: isSelected ? "#fff" : colors.text }}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

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
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.separator }}>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={{ fontSize: 16, color: colors.textSecondary, fontWeight: "500" }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>Date of Birth</Text>
            <TouchableOpacity
              onPress={() => onConfirm(new Date(selYear, selMonth, Math.min(selDay, daysInMonth)))}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>Confirm</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", paddingHorizontal: 10, paddingTop: 12, paddingBottom: 28 }}>
            <PickerColumn label="DAY" items={days} selected={selDay} onSelect={(v) => setSelDay(v as number)} flex={1} colors={colors} />
            <View style={{ width: 1, backgroundColor: colors.separator, marginVertical: 4 }} />
            <PickerColumn label="MONTH" items={FULL_MONTHS} selected={FULL_MONTHS[selMonth]} onSelect={(v) => setSelMonth(FULL_MONTHS.indexOf(v as string))} flex={2} colors={colors} />
            <View style={{ width: 1, backgroundColor: colors.separator, marginVertical: 4 }} />
            <PickerColumn label="YEAR" items={years} selected={selYear} onSelect={(v) => setSelYear(v as number)} flex={1.3} colors={colors} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SignupScreen() {
  const { colors } = useTheme();
  const { signUp } = useApp();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weightKg, setWeightKg] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);

  const [city, setCity] = useState("");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const formatDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  // Format date for DB (YYYY-MM-DD)
  const formatDateForDb = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const validateStep1 = () => {
    if (!firstName.trim()) return t('enterFullName');
    if (!lastName.trim()) return t('enterFullName');
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) return "Please enter a valid phone number.";
    if (!email.trim() || !email.includes("@")) return "Please enter a valid email address.";
    if (!nationalId.trim() || nationalId.replace(/\D/g, "").length < 9) return "Please enter a valid national ID number (9+ digits).";
    if (!dob) return t('selectDateOfBirth');
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return t('passwordsNoMatch');
    return null;
  };

  const validateStep2 = () => {
    if (!bloodType) return "Please select your blood type.";
    if (!gender) return "Please select your gender.";
    return null;
  };

  const validateStep3 = () => {
    if (!city) return "Please select your city.";
    return null;
  };

  const handleNext = () => {
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
    if (err) { setError(err); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setError("");
    setStep((s) => s + 1);
    Haptics.selectionAsync();
  };

  const handleBack = () => {
    if (step > 1) { setStep((s) => s - 1); setError(""); }
    else router.back();
  };

  const handleSubmit = async () => {
    const err = validateStep3();
    if (err) { setError(err); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setError("");
    setLoading(true);

    const result = await signUp(email.trim().toLowerCase(), password, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: "+962" + phone.replace(/\s/g, ""),
      nationalId: nationalId.trim(),
      bloodType: bloodType!,
      gender: gender!,
      dateOfBirth: dob ? formatDateForDb(dob) : "",
      city,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
    });

    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Supabase auto-confirms in dev → user is logged in automatically
      router.replace("/(tabs)");
    } else {
      setError(result.error || t('signUpFailed'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const InputRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
        {label}
      </Text>
      {children}
    </View>
  );

  const inputWrapStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
  };

  const inputStyle = {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 13,
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: botPad + 40, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={handleBack}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Feather name="droplet" size={20} color="#fff" />
          </View>
          <Text style={[styles.logoText, { color: colors.text }]}>Damk 3alena</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('createAccountTitle')}</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
          {step === 1 ? t('step1SubTitle') : step === 2 ? t('step2SubTitle') : t('step3SubTitle')}
        </Text>

        <StepIndicator step={step} total={3} colors={colors} />

        {error.length > 0 && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color="#991B1B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 1 && (
          <>
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputRow label={t('firstName')}>
                  <View style={inputWrapStyle}>
                    <TextInput style={inputStyle} placeholder="Ahmad" placeholderTextColor={colors.textMuted}
                      value={firstName} onChangeText={(v) => { setFirstName(v); setError(""); }} autoCapitalize="words" />
                  </View>
                </InputRow>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <InputRow label={t('lastName')}>
                  <View style={inputWrapStyle}>
                    <TextInput style={inputStyle} placeholder="Al-Rashid" placeholderTextColor={colors.textMuted}
                      value={lastName} onChangeText={(v) => { setLastName(v); setError(""); }} autoCapitalize="words" />
                  </View>
                </InputRow>
              </View>
            </View>

            <InputRow label={t('emailAddressLabel')}>
              <View style={inputWrapStyle}>
                <Feather name="mail" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={inputStyle} placeholder="you@example.com" placeholderTextColor={colors.textMuted}
                  value={email} onChangeText={(v) => { setEmail(v); setError(""); }}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>
            </InputRow>

            <InputRow label={t('phoneNumber')}>
              <View style={inputWrapStyle}>
                <Feather name="phone" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 15, color: colors.text, fontWeight: "600" }}>+962 </Text>
                <TextInput style={inputStyle} placeholder="7X XXX XXXX" placeholderTextColor={colors.textMuted}
                  value={phone} onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, "").slice(0, 9)); setError(""); }} keyboardType="phone-pad" maxLength={9} />
              </View>
            </InputRow>

            <InputRow label={t('nationalIdNumber')}>
              <View style={inputWrapStyle}>
                <Feather name="credit-card" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={inputStyle} placeholder="10-digit national ID" placeholderTextColor={colors.textMuted}
                  value={nationalId} onChangeText={(v) => { setNationalId(v.replace(/\D/g, "")); setError(""); }}
                  keyboardType="number-pad" maxLength={12} />
              </View>
            </InputRow>

            <InputRow label={t('dateOfBirth')}>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={inputWrapStyle} activeOpacity={0.8}>
                <Feather name="calendar" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                <Text style={[inputStyle, { paddingVertical: 13 }, !dob && { color: colors.textMuted }]}>
                  {dob ? formatDate(dob) : t('selectDateOfBirth')}
                </Text>
                <Feather name="chevron-down" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </InputRow>

            <DatePickerModal
              visible={showDatePicker}
              value={dob || new Date(2000, 0, 1)}
              onConfirm={(d) => { setDob(d); setShowDatePicker(false); setError(""); }}
              onCancel={() => setShowDatePicker(false)}
              colors={colors}
            />

            <InputRow label={t('weightOptional')}>
              <View style={inputWrapStyle}>
                <Feather name="activity" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={inputStyle} placeholder="e.g. 70" placeholderTextColor={colors.textMuted}
                  value={weightKg} onChangeText={(v) => setWeightKg(v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" />
                <Text style={{ fontSize: 14, color: colors.textMuted, marginLeft: 4 }}>kg</Text>
              </View>
            </InputRow>

            <InputRow label={t('passwordLabel')}>
              <View style={inputWrapStyle}>
                <Feather name="lock" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={inputStyle} placeholder={t('minSixChars')} placeholderTextColor={colors.textMuted}
                  value={password} onChangeText={(v) => { setPassword(v); setError(""); }} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4, marginLeft: 6 }}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={17} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </InputRow>

            <InputRow label={t('confirmPasswordLabel')}>
              <View style={[inputWrapStyle, confirmPassword.length > 0 && password !== confirmPassword ? { borderColor: "#E74C3C" } : {}]}>
                <Feather name="lock" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={inputStyle} placeholder={t('reEnterPassword')} placeholderTextColor={colors.textMuted}
                  value={confirmPassword} onChangeText={(v) => { setConfirmPassword(v); setError(""); }} secureTextEntry={!showConfirm} />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={{ padding: 4, marginLeft: 6 }}>
                  <Feather name={showConfirm ? "eye-off" : "eye"} size={17} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={{ fontSize: 12, color: "#E74C3C", marginTop: 5, fontWeight: "500" }}>{t('passwordsNoMatch')}</Text>
              )}
            </InputRow>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t('continueBtn')}</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                {t('bloodType')}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {BLOOD_TYPES.map((bt) => (
                  <TouchableOpacity key={bt}
                    style={{ paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: bloodType === bt ? colors.primary : colors.inputBg, borderWidth: 1.5, borderColor: bloodType === bt ? colors.primary : colors.inputBorder, minWidth: 70, alignItems: "center" }}
                    onPress={() => { setBloodType(bt); setError(""); Haptics.selectionAsync(); }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: bloodType === bt ? "#fff" : colors.textSecondary }}>{bt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                {t('gender')}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {GENDERS.map((g) => (
                  <TouchableOpacity key={g.value}
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: gender === g.value ? colors.primary : colors.inputBorder, backgroundColor: gender === g.value ? colors.primary : colors.inputBg }}
                    onPress={() => { setGender(g.value); setError(""); Haptics.selectionAsync(); }}>
                    <Feather name="user" size={18} color={gender === g.value ? "#fff" : colors.textSecondary} />
                    <Text style={{ fontSize: 15, fontWeight: "600", color: gender === g.value ? "#fff" : colors.textSecondary }}>{t(g.value)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t('continueBtn')}</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>
                {t('selectYourCity')}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {JORDAN_CITIES.map((c) => (
                  <TouchableOpacity key={c}
                    style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: city === c ? colors.primary : colors.inputBg, borderWidth: 1.5, borderColor: city === c ? colors.primary : colors.inputBorder }}
                    onPress={() => { setCity(c); setError(""); Haptics.selectionAsync(); }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: city === c ? "#fff" : colors.textSecondary }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.8 }]}
              onPress={handleSubmit} disabled={loading} activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Text style={styles.primaryBtnText}>{t('createAccountTitle')}</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.loginRow} onPress={() => router.replace("/auth/login")}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>{t('alreadyHaveAccount')} </Text>
          <Text style={[styles.loginLink, { color: colors.primary }]}>{t('signIn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  logoCircle: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginBottom: 4 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 20,
  },
  errorText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 16, gap: 10,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6, marginBottom: 20,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loginRow: { flexDirection: "row", justifyContent: "center", paddingVertical: 8 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: "700" },
});
