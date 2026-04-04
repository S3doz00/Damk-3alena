import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { BloodType, Gender } from "@/context/AppContext";

const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

function StepIndicator({ step }: { step: number }) {
  return (
    <View style={si.row}>
      {[1, 2].map((s) => (
        <React.Fragment key={s}>
          <View style={[si.dot, s <= step && si.dotActive]}>
            {s < step ? (
              <Feather name="check" size={12} color="#fff" />
            ) : (
              <Text style={[si.num, s === step && si.numActive]}>{s}</Text>
            )}
          </View>
          {s < 2 && <View style={[si.line, s < step && si.lineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const si = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 28 },
  dot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.light.inputBg,
    borderWidth: 2, borderColor: Colors.light.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  dotActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  line: { flex: 1, height: 2, backgroundColor: Colors.light.separator, marginHorizontal: 6 },
  lineActive: { backgroundColor: Colors.light.primary },
  num: { fontSize: 13, fontWeight: "700", color: Colors.light.textMuted },
  numActive: { color: "#fff" },
});

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Personal Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [dob, setDob] = useState("");

  // Step 2 — Security
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const validateStep1 = () => {
    if (!firstName.trim()) return "Please enter your first name.";
    if (!lastName.trim()) return "Please enter your last name.";
    if (!nationalId.trim() || nationalId.trim().length < 9) return "Please enter a valid national ID (min 9 digits).";
    if (!bloodType) return "Please select your blood type.";
    if (!gender) return "Please select your gender.";
    if (!dob.trim()) return "Please enter your date of birth.";
    return null;
  };

  const validateStep2 = () => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) return "Please enter a valid phone number.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    const err = validateStep2();
    if (err) { setError(err); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setError("");
    setLoading(true);
    const pendingData = { firstName, lastName, nationalId, bloodType, gender, dateOfBirth: dob, phone, password };
    await AsyncStorage.setItem("pendingSignup", JSON.stringify(pendingData));
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({ pathname: "/auth/otp", params: { phone } });
  };

  const InputRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: botPad + 40, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? (setStep(1), setError("")) : router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}><Feather name="droplet" size={20} color="#fff" /></View>
          <Text style={styles.logoText}>Damk 3alena</Text>
        </View>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          {step === 1 ? "Step 1: Personal Information" : "Step 2: Security Contact"}
        </Text>

        <StepIndicator step={step} />

        {/* Error */}
        {error.length > 0 && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color="#991B1B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputRow label="First Name">
                  <View style={styles.inputWrap}>
                    <TextInput style={styles.input} placeholder="Ahmad" placeholderTextColor={Colors.light.textMuted}
                      value={firstName} onChangeText={(t) => { setFirstName(t); setError(""); }}
                      autoCapitalize="words" returnKeyType="next" />
                  </View>
                </InputRow>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <InputRow label="Last Name">
                  <View style={styles.inputWrap}>
                    <TextInput style={styles.input} placeholder="Al-Rashid" placeholderTextColor={Colors.light.textMuted}
                      value={lastName} onChangeText={(t) => { setLastName(t); setError(""); }}
                      autoCapitalize="words" returnKeyType="next" />
                  </View>
                </InputRow>
              </View>
            </View>

            <InputRow label="National ID Number">
              <View style={styles.inputWrap}>
                <Feather name="credit-card" size={16} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="9-digit national ID" placeholderTextColor={Colors.light.textMuted}
                  value={nationalId} onChangeText={(t) => { setNationalId(t.replace(/\D/g, "")); setError(""); }}
                  keyboardType="numeric" maxLength={12} />
              </View>
            </InputRow>

            <InputRow label="Blood Type">
              <View style={styles.chipGrid}>
                {BLOOD_TYPES.map((bt) => (
                  <TouchableOpacity key={bt} style={[styles.chip, bloodType === bt && styles.chipActive]}
                    onPress={() => { setBloodType(bt); setError(""); Haptics.selectionAsync(); }}>
                    <Text style={[styles.chipText, bloodType === bt && styles.chipTextActive]}>{bt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </InputRow>

            <InputRow label="Gender">
              <View style={styles.row}>
                {GENDERS.map((g) => (
                  <TouchableOpacity key={g.value}
                    style={[styles.genderBtn, gender === g.value && styles.genderBtnActive, { marginRight: g.value === "male" ? 10 : 0 }]}
                    onPress={() => { setGender(g.value); setError(""); Haptics.selectionAsync(); }}>
                    <Feather name={g.value === "male" ? "user" : "user"} size={16}
                      color={gender === g.value ? "#fff" : Colors.light.textSecondary} />
                    <Text style={[styles.genderText, gender === g.value && styles.genderTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </InputRow>

            <InputRow label="Date of Birth">
              <View style={styles.inputWrap}>
                <Feather name="calendar" size={16} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="DD/MM/YYYY" placeholderTextColor={Colors.light.textMuted}
                  value={dob} onChangeText={(t) => { setDob(t); setError(""); }} keyboardType="numbers-and-punctuation" />
              </View>
            </InputRow>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: Security */}
        {step === 2 && (
          <>
            <InputRow label="Phone Number">
              <View style={styles.inputWrap}>
                <Feather name="phone" size={16} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="+962 7X XXX XXXX" placeholderTextColor={Colors.light.textMuted}
                  value={phone} onChangeText={(t) => { setPhone(t); setError(""); }}
                  keyboardType="phone-pad" returnKeyType="next" onSubmitEditing={() => passRef.current?.focus()} />
              </View>
            </InputRow>

            <InputRow label="Password">
              <View style={styles.inputWrap}>
                <Feather name="lock" size={16} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput ref={passRef} style={styles.input} placeholder="Min. 8 characters"
                  placeholderTextColor={Colors.light.textMuted}
                  value={password} onChangeText={(t) => { setPassword(t); setError(""); }}
                  secureTextEntry={!showPass} returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={17} color={Colors.light.textMuted} />
                </TouchableOpacity>
              </View>
            </InputRow>

            <InputRow label="Confirm Password">
              <View style={[styles.inputWrap, confirmPassword.length > 0 && password !== confirmPassword && { borderColor: "#E74C3C" }]}>
                <Feather name="lock" size={16} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput ref={confirmRef} style={styles.input} placeholder="Re-enter password"
                  placeholderTextColor={Colors.light.textMuted}
                  value={confirmPassword} onChangeText={(t) => { setConfirmPassword(t); setError(""); }}
                  secureTextEntry={!showConfirm} returnKeyType="done" onSubmitEditing={handleSubmit} />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Feather name={showConfirm ? "eye-off" : "eye"} size={17} color={Colors.light.textMuted} />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={{ fontSize: 12, color: "#E74C3C", marginTop: 5, fontWeight: "500" }}>Passwords do not match</Text>
              )}
            </InputRow>

            <View style={styles.smsNote}>
              <Feather name="message-square" size={14} color={Colors.light.primary} />
              <Text style={styles.smsNoteText}>A verification code will be sent to your phone number.</Text>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.8 }]}
              onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.loginRow} onPress={() => router.replace("/auth/login")}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  backBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.light.card, alignItems: "center", justifyContent: "center",
    marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  logoCircle: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.light.primary,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 16, fontWeight: "800", color: Colors.light.text },
  title: { fontSize: 26, fontWeight: "800", color: Colors.light.text, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 24 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 20,
  },
  errorText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" },
  row: { flexDirection: "row" },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 11, fontWeight: "700", color: Colors.light.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.light.inputBg, borderWidth: 1.5,
    borderColor: Colors.light.inputBorder, borderRadius: 14, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.light.text, paddingVertical: 13 },
  eyeBtn: { padding: 4, marginLeft: 6 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
    backgroundColor: Colors.light.inputBg, borderWidth: 1.5, borderColor: Colors.light.inputBorder,
  },
  chipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipText: { fontSize: 14, fontWeight: "600", color: Colors.light.textSecondary },
  chipTextActive: { color: "#fff" },
  genderBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.inputBg,
  },
  genderBtnActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  genderText: { fontSize: 15, fontWeight: "600", color: Colors.light.textSecondary },
  genderTextActive: { color: "#fff" },
  smsNote: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 12, padding: 14, marginBottom: 24,
  },
  smsNoteText: { flex: 1, fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.light.primary, paddingVertical: 16, borderRadius: 16, gap: 10,
    shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6, marginBottom: 20,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loginRow: { flexDirection: "row", justifyContent: "center", paddingVertical: 8 },
  loginText: { fontSize: 14, color: Colors.light.textSecondary },
  loginLink: { fontSize: 14, fontWeight: "700", color: Colors.light.primary },
});
