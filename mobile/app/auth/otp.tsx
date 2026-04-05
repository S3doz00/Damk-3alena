import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { signUp } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const refs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleDigit = (val: string, idx: number) => {
    const cleaned = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[idx] = cleaned;
    setDigits(newDigits);
    setError("");
    if (cleaned && idx < 3) refs[idx + 1].current?.focus();
    if (!cleaned && idx > 0) refs[idx - 1].current?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < 4) { setError("Please enter the 4-digit code."); return; }
    if (code !== "1234") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Invalid code. Use 1234 for testing.");
      return;
    }
    setLoading(true);
    try {
      const pendingRaw = await AsyncStorage.getItem("pendingSignup");
      if (!pendingRaw) { setError("Session expired. Please sign up again."); setLoading(false); return; }
      const pending = JSON.parse(pendingRaw);
      const result = await signUp(pending.phone, pending.password, {
        firstName: pending.firstName,
        lastName: pending.lastName,
        email: pending.email || "",
        nationalId: pending.nationalId || "",
        bloodType: pending.bloodType,
        gender: pending.gender,
        dateOfBirth: pending.dateOfBirth,
        city: pending.city,
        weightKg: pending.weightKg,
      });
      await AsyncStorage.removeItem("pendingSignup");
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace({ pathname: "/auth/login", params: { accountCreated: "1" } });
      } else {
        setError(result.error || "Signup failed.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const maskedPhone = phone ? phone.replace(/(\d{3})\d+(\d{3})/, "$1***$2") : "your phone";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 28, paddingTop: topPad + 20 }}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: colors.inputBg }]}>
            <Feather name="message-square" size={30} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Verify Phone Number</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We sent a 4-digit code to{"\n"}
          <Text style={{ color: colors.text, fontWeight: "700" }}>{maskedPhone}</Text>
        </Text>

        <View style={[styles.testHint, { backgroundColor: colors.inputBg }]}>
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={[styles.testHintText, { color: colors.textSecondary }]}>
            For testing, use code: <Text style={{ fontWeight: "700" }}>1234</Text>
          </Text>
        </View>

        <View style={styles.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={refs[i]}
              style={[
                styles.codeBox,
                { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                d.length > 0 && { borderColor: colors.primary, backgroundColor: colors.inputBg },
                error.length > 0 && { borderColor: "#E74C3C" },
              ]}
              value={d}
              onChangeText={(v) => handleDigit(v, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {error.length > 0 && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color="#991B1B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.verifyBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.8 }]}
          onPress={handleVerify} disabled={loading} activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : (
            <Text style={styles.verifyBtnText}>Verify & Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.successNote}>
          <Feather name="check-circle" size={14} color={colors.success} />
          <Text style={[styles.successNoteText, { color: colors.textSecondary }]}>
            After verification, you'll be taken to the sign in page to log in.
          </Text>
        </View>

        <View style={styles.resendRow}>
          <Text style={[styles.resendLabel, { color: colors.textSecondary }]}>Didn't receive the code? </Text>
          {countdown > 0 ? (
            <Text style={[styles.countdown, { color: colors.textMuted }]}>Resend in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={() => setCountdown(60)}>
              <Text style={[styles.resendBtn, { color: colors.primary }]}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginBottom: 36,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  iconWrap: { alignItems: "center", marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  testHint: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, padding: 14, marginBottom: 32,
  },
  testHintText: { fontSize: 13, flex: 1 },
  codeRow: { flexDirection: "row", gap: 14, justifyContent: "center", marginBottom: 24 },
  codeBox: {
    width: 60, height: 68, borderRadius: 16, fontSize: 28, fontWeight: "700",
    borderWidth: 2,
  },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" },
  verifyBtn: {
    paddingVertical: 17, borderRadius: 16,
    alignItems: "center", marginBottom: 16,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  verifyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  successNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 20, paddingHorizontal: 4 },
  successNoteText: { fontSize: 12, flex: 1, lineHeight: 17 },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  resendLabel: { fontSize: 14 },
  countdown: { fontSize: 14, fontWeight: "600" },
  resendBtn: { fontSize: 14, fontWeight: "700" },
});
