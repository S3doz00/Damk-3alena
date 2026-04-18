import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";

const CODE_LENGTH = 6;

type Step = "email" | "otp" | "newPassword" | "done";

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP state
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // New password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ─── Step 1: Send reset email ──────────────────────────────
  const handleSendReset = async () => {
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError(t("enterYourEmail"));
      return;
    }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed);
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setStep("otp");
      setCooldown(60);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }
  };

  // ─── Step 2: Verify OTP ───────────────────────────────────
  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === CODE_LENGTH - 1) {
      const fullCode = newCode.join("");
      if (fullCode.length === CODE_LENGTH) {
        handleVerifyOtp(fullCode);
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  const handlePaste = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (digits.length === 0) return;
    const newCode = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < digits.length; i++) newCode[i] = digits[i];
    setCode(newCode);
    setError("");
    if (digits.length === CODE_LENGTH) handleVerifyOtp(digits);
    else inputRefs.current[digits.length]?.focus();
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const token = otpCode || code.join("");
    if (token.length !== CODE_LENGTH) return;

    setLoading(true);
    setError("");

    const { error: otpError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "recovery",
    });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } else {
      setStep("newPassword");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setError("");
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    setLoading(false);
    setCooldown(60);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ─── Step 3: Set new password ─────────────────────────────
  const handleSetNewPassword = async () => {
    setError("");
    if (newPassword.length < 6) {
      setError(t("passwordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordsNoMatch"));
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setStep("done");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const fullCode = code.join("");
  const isCodeComplete = fullCode.length === CODE_LENGTH;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingTop: topPad + 24, paddingBottom: botPad + 40, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step === "otp") setStep("email");
            else router.back();
          }}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>
            {step === "otp" ? t("back") : t("backToLogin")}
          </Text>
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
            <Feather
              name={step === "done" ? "check-circle" : step === "newPassword" ? "key" : step === "otp" ? "shield" : "lock"}
              size={32}
              color={step === "done" ? "#059669" : colors.primary}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {step === "done" ? t("passwordResetSuccess") : step === "newPassword" ? t("setNewPassword") : step === "otp" ? t("enterCode") : t("forgotPasswordTitle")}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          {step === "done" ? t("passwordResetSuccessDesc") : step === "newPassword" ? t("setNewPasswordDesc") : step === "otp" ? `${t("codeSentTo")} ${email.trim().toLowerCase()}` : t("forgotPasswordDesc")}
        </Text>

        {/* ─── STEP: EMAIL ─── */}
        {step === "email" && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator }]}>
            {error.length > 0 && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={15} color="#991B1B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t("enterYourEmail")}</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Feather name="mail" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSendReset}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.8 }]}
              onPress={handleSendReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>{t("sendResetCode")}</Text>
                  <Feather name="send" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP: OTP CODE ─── */}
        {step === "otp" && (
          <View style={{ alignItems: "center" }}>
            {error.length > 0 && (
              <View style={[styles.errorBanner, { width: "100%" }]}>
                <Feather name="alert-circle" size={15} color="#991B1B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.codeRow}>
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: code[i] ? colors.primary : error ? "#E74C3C" : colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  value={code[i]}
                  onChangeText={(v) => {
                    if (v.length > 1) handlePaste(v);
                    else handleCodeChange(i, v);
                  }}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  autoComplete="one-time-code"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, width: "100%", marginTop: 24 }, (!isCodeComplete || loading) && { opacity: 0.6 }]}
              onPress={() => handleVerifyOtp()}
              disabled={!isCodeComplete || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>{t("verifyCode")}</Text>
                  <Feather name="check-circle" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendBtn, { borderColor: cooldown > 0 ? colors.separator : colors.primary }, cooldown > 0 && { opacity: 0.5 }]}
              onPress={handleResend}
              disabled={cooldown > 0 || loading}
              activeOpacity={0.85}
            >
              <Feather name="refresh-cw" size={16} color={cooldown > 0 ? colors.textMuted : colors.primary} />
              <Text style={[styles.resendText, { color: cooldown > 0 ? colors.textMuted : colors.primary }]}>
                {cooldown > 0 ? `${t("resendIn")} ${cooldown}s` : t("resendCode")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP: NEW PASSWORD ─── */}
        {step === "newPassword" && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator }]}>
            {error.length > 0 && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={15} color="#991B1B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t("newPassword")}</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Feather name="lock" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t("minSixChars")}
                  placeholderTextColor={colors.textMuted}
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setError(""); }}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={17} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t("confirmPasswordLabel")}</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: confirmPassword.length > 0 && newPassword !== confirmPassword ? "#E74C3C" : colors.inputBorder }]}>
                <Feather name="lock" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t("reEnterPassword")}
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setError(""); }}
                  secureTextEntry={!showPass}
                />
              </View>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <Text style={{ fontSize: 12, color: "#E74C3C", marginTop: 5, fontWeight: "500" }}>{t("passwordsNoMatch")}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.8 }]}
              onPress={handleSetNewPassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>{t("resetPassword")}</Text>
                  <Feather name="check" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP: DONE ─── */}
        {step === "done" && (
          <View style={[styles.successCard, { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" }]}>
            <View style={styles.successIconWrap}>
              <Feather name="check-circle" size={24} color="#059669" />
            </View>
            <Text style={styles.successTitle}>{t("passwordResetSuccess")}</Text>
            <Text style={styles.successBody}>{t("passwordResetSuccessDesc")}</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 20, width: "100%" }]}
              onPress={() => router.replace("/auth/login")}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{t("backToLogin")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 28 },
  backText: { fontSize: 15, fontWeight: "600" },
  iconWrap: { alignItems: "center", marginBottom: 20 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  desc: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 28, paddingHorizontal: 12 },
  card: {
    borderRadius: 24, padding: 24, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 20,
  },
  errorText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 17, borderRadius: 16, gap: 10,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  codeRow: {
    flexDirection: "row", justifyContent: "center", gap: 6,
    marginTop: 4, marginBottom: 8,
  },
  codeInput: {
    width: 40, height: 50, borderRadius: 12,
    borderWidth: 2, textAlign: "center",
    fontSize: 20, fontWeight: "800",
  },
  resendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24,
    marginTop: 14, width: "100%",
  },
  resendText: { fontSize: 15, fontWeight: "700" },
  successCard: {
    borderRadius: 20, padding: 28, borderWidth: 1.5, alignItems: "center",
  },
  successIconWrap: { marginBottom: 14 },
  successTitle: { fontSize: 20, fontWeight: "800", color: "#065F46", marginBottom: 8 },
  successBody: { fontSize: 14, color: "#047857", textAlign: "center", lineHeight: 20 },
});
