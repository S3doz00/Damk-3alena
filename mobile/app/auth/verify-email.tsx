import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { verifySignupOtp } = useApp();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    // Only accept digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (digit && index === CODE_LENGTH - 1) {
      const fullCode = newCode.join("");
      if (fullCode.length === CODE_LENGTH) {
        handleVerify(fullCode);
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
    for (let i = 0; i < digits.length; i++) {
      newCode[i] = digits[i];
    }
    setCode(newCode);
    setError("");
    if (digits.length === CODE_LENGTH) {
      handleVerify(digits);
    } else {
      inputRefs.current[digits.length]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const token = otpCode || code.join("");
    if (token.length !== CODE_LENGTH || !email) return;

    setVerifying(true);
    setError("");

    const result = await verifySignupOtp(email.trim().toLowerCase(), token);

    setVerifying(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || t("verificationFailed"));
      // Clear code on error
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setResent(false);
    setError("");
    await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase() });
    setResending(false);
    setResent(true);
    setCooldown(60);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const fullCode = code.join("");
  const isCodeComplete = fullCode.length === CODE_LENGTH;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad + 40,
        paddingBottom: botPad + 40,
        paddingHorizontal: 24,
        alignItems: "center",
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
        <Feather name="shield" size={36} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{t("verifyEmailTitle")}</Text>

      <Text style={[styles.desc, { color: colors.textSecondary }]}>
        {t("verifyEmailDesc")}
      </Text>
      {email && (
        <Text style={[styles.email, { color: colors.text }]}>{email.trim().toLowerCase()}</Text>
      )}
      <Text style={[styles.desc, { color: colors.textSecondary, marginTop: 8 }]}>
        {t("enterOtpCode")}
      </Text>

      {/* OTP Code Input */}
      <View style={styles.codeRow}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => (
          <TextInput
            key={i}
            ref={(ref) => { inputRefs.current[i] = ref; }}
            style={[
              styles.codeInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: code[i]
                  ? colors.primary
                  : error
                  ? "#E74C3C"
                  : colors.inputBorder,
                color: colors.text,
              },
            ]}
            value={code[i]}
            onChangeText={(v) => {
              if (v.length > 1) {
                handlePaste(v);
              } else {
                handleCodeChange(i, v);
              }
            }}
            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            autoComplete="one-time-code"
          />
        ))}
      </View>

      {/* Error message */}
      {error.length > 0 && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color="#991B1B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Resent badge */}
      {resent && (
        <View style={styles.resentBadge}>
          <Feather name="check" size={14} color="#059669" />
          <Text style={styles.resentText}>{t("emailSent")}</Text>
        </View>
      )}

      {/* Verify button */}
      <TouchableOpacity
        style={[
          styles.verifyBtn,
          { backgroundColor: colors.primary },
          (!isCodeComplete || verifying) && { opacity: 0.6 },
        ]}
        onPress={() => handleVerify()}
        disabled={!isCodeComplete || verifying}
        activeOpacity={0.85}
      >
        {verifying ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.verifyBtnText}>{t("verifyCode")}</Text>
            <Feather name="check-circle" size={18} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      {/* Resend button */}
      <TouchableOpacity
        style={[
          styles.resendBtn,
          { borderColor: cooldown > 0 ? colors.separator : colors.primary },
          cooldown > 0 && { opacity: 0.5 },
        ]}
        onPress={handleResend}
        disabled={cooldown > 0 || resending}
        activeOpacity={0.85}
      >
        <Feather name="refresh-cw" size={16} color={cooldown > 0 ? colors.textMuted : colors.primary} />
        <Text style={[styles.resendText, { color: cooldown > 0 ? colors.textMuted : colors.primary }]}>
          {cooldown > 0 ? `${t("resendIn")} ${cooldown}s` : t("resendEmail")}
        </Text>
      </TouchableOpacity>

      {/* Back to login */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.replace("/auth/login")}
        activeOpacity={0.85}
      >
        <Feather name="arrow-left" size={16} color={colors.textSecondary} />
        <Text style={[styles.backText, { color: colors.textSecondary }]}>{t("backToLogin")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 14 },
  desc: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 12 },
  email: { fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 6 },
  codeRow: {
    flexDirection: "row", justifyContent: "center", gap: 6,
    marginTop: 28, marginBottom: 8,
  },
  codeInput: {
    width: 40, height: 50, borderRadius: 12,
    borderWidth: 2, textAlign: "center",
    fontSize: 20, fontWeight: "800",
  },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12,
    marginTop: 12, width: "100%",
  },
  errorText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" },
  resentBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#D1FAE5", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    marginTop: 12,
  },
  resentText: { fontSize: 13, fontWeight: "600", color: "#059669" },
  verifyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 17, borderRadius: 16, gap: 10, width: "100%", marginTop: 24,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  verifyBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  resendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24,
    marginTop: 14, width: "100%",
  },
  resendText: { fontSize: 15, fontWeight: "700" },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 24,
  },
  backText: { fontSize: 14, fontWeight: "600" },
});
