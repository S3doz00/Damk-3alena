import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

type Step = "email" | "otp" | "done";

export default function EditEmailScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("email");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP state
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ─── Step 1: Request email change ──────────────────────────
  const handleUpdate = async () => {
    setError("");
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    Haptics.selectionAsync();
    const { error: updateError } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
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
      if (fullCode.length === CODE_LENGTH) handleVerifyOtp(fullCode);
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
      email: newEmail.trim().toLowerCase(),
      token,
      type: "email_change",
    });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } else {
      setStep("done");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setError("");
    await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
    setLoading(false);
    setCooldown(60);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const fullCode = code.join("");
  const isCodeComplete = fullCode.length === CODE_LENGTH;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: botPad + 40, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
          <TouchableOpacity
            style={{
              width: 42, height: 42, borderRadius: 12, backgroundColor: colors.card,
              alignItems: "center", justifyContent: "center",
              shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
            }}
            onPress={() => {
              if (step === "otp") setStep("email");
              else router.back();
            }}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
              {step === "done" ? t("emailUpdated") : step === "otp" ? t("enterCode") : t("editEmailTitle")}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              {step === "done" ? t("emailUpdatedDesc") : step === "otp" ? `${t("codeSentTo")} ${newEmail.trim().toLowerCase()}` : t("editEmailDesc")}
            </Text>
          </View>
        </View>

        {/* ─── STEP: DONE ─── */}
        {step === "done" && (
          <View style={{
            flexDirection: "row", alignItems: "flex-start", gap: 14,
            backgroundColor: "#D1FAE5", borderRadius: 18, padding: 18,
            borderWidth: 1, borderColor: "#6EE7B7", marginBottom: 24,
          }}>
            <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: "#A7F3D0", alignItems: "center", justifyContent: "center" }}>
              <Feather name="check-circle" size={18} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#065F46", marginBottom: 4 }}>{t("emailUpdated")}</Text>
              <Text style={{ fontSize: 13, color: "#047857", marginBottom: 8 }}>{t("emailUpdatedDesc")}</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={{ fontSize: 13, color: "#059669", fontWeight: "600" }}>← {t("cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── STEP: OTP ─── */}
        {step === "otp" && (
          <View style={{ alignItems: "center" }}>
            {error.length > 0 && (
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 8,
                backgroundColor: "#FEE2E2", borderRadius: 12, padding: 14, marginBottom: 20, width: "100%",
              }}>
                <Feather name="alert-circle" size={16} color="#991B1B" />
                <Text style={{ flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" }}>{error}</Text>
              </View>
            )}

            <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 }}>
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  style={{
                    width: 40, height: 50, borderRadius: 12,
                    borderWidth: 2, textAlign: "center" as const,
                    fontSize: 20, fontWeight: "800" as const,
                    backgroundColor: colors.inputBg,
                    borderColor: code[i] ? colors.primary : error ? "#E74C3C" : colors.inputBorder,
                    color: colors.text,
                  }}
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
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
                paddingVertical: 17, borderRadius: 16, backgroundColor: colors.primary,
                width: "100%", marginTop: 24,
                opacity: (!isCodeComplete || loading) ? 0.6 : 1,
                shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
              }}
              onPress={() => handleVerifyOtp()}
              disabled={!isCodeComplete || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>{t("verifyCode")}</Text>
                  <Feather name="check-circle" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                borderWidth: 2, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24,
                marginTop: 14, width: "100%",
                borderColor: cooldown > 0 ? colors.separator : colors.primary,
                opacity: cooldown > 0 ? 0.5 : 1,
              }}
              onPress={handleResend}
              disabled={cooldown > 0 || loading}
              activeOpacity={0.85}
            >
              <Feather name="refresh-cw" size={16} color={cooldown > 0 ? colors.textMuted : colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: cooldown > 0 ? colors.textMuted : colors.primary }}>
                {cooldown > 0 ? `${t("resendIn")} ${cooldown}s` : t("resendCode")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP: EMAIL INPUT ─── */}
        {step === "email" && (
          <>
            {error.length > 0 && (
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 8,
                backgroundColor: "#FEE2E2", borderRadius: 12, padding: 14, marginBottom: 20,
              }}>
                <Feather name="alert-circle" size={16} color="#991B1B" />
                <Text style={{ flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" }}>{error}</Text>
              </View>
            )}

            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
              {t("newEmailLabel")}
            </Text>
            <View style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.inputBorder,
              borderRadius: 14, paddingHorizontal: 14, marginBottom: 28,
            }}>
              <Feather name="mail" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, fontSize: 16, color: colors.text, paddingVertical: 14 }}
                value={newEmail}
                onChangeText={(v) => { setNewEmail(v); setError(""); }}
                placeholder="new@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
                paddingVertical: 17, borderRadius: 16, backgroundColor: colors.primary,
                opacity: loading ? 0.8 : 1,
                shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
              }}
              onPress={handleUpdate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="mail" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{t("updateEmail")}</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
