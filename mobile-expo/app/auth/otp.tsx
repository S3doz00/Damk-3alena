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
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { signUp } = useApp();
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
        nationalId: pending.nationalId,
        bloodType: pending.bloodType,
        gender: pending.gender,
        dateOfBirth: pending.dateOfBirth,
      });
      await AsyncStorage.removeItem("pendingSignup");
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
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
      <View style={[styles.container, { paddingTop: topPad + 20 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Feather name="message-square" size={30} color={Colors.light.primary} />
          </View>
        </View>

        <Text style={styles.title}>Verify Phone Number</Text>
        <Text style={styles.subtitle}>
          We sent a 4-digit code to{"\n"}
          <Text style={{ color: Colors.light.text, fontWeight: "700" }}>{maskedPhone}</Text>
        </Text>

        {/* Test hint */}
        <View style={styles.testHint}>
          <Feather name="info" size={14} color={Colors.light.primary} />
          <Text style={styles.testHintText}>For testing, use code: <Text style={{ fontWeight: "700" }}>1234</Text></Text>
        </View>

        {/* Code boxes */}
        <View style={styles.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={refs[i]}
              style={[styles.codeBox, d.length > 0 && styles.codeBoxFilled, error.length > 0 && styles.codeBoxError]}
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
          style={[styles.verifyBtn, loading && { opacity: 0.8 }]}
          onPress={handleVerify} disabled={loading} activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : (
            <Text style={styles.verifyBtnText}>Verify & Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive the code? </Text>
          {countdown > 0 ? (
            <Text style={styles.countdown}>Resend in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={() => setCountdown(60)}>
              <Text style={styles.resendBtn}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, paddingHorizontal: 28 },
  backBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.light.card,
    alignItems: "center", justifyContent: "center", marginBottom: 36,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  iconWrap: { alignItems: "center", marginBottom: 24 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: "800", color: Colors.light.text, letterSpacing: -0.5, textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  testHint: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 12, padding: 14, marginBottom: 32,
  },
  testHintText: { fontSize: 13, color: Colors.light.textSecondary, flex: 1 },
  codeRow: { flexDirection: "row", gap: 14, justifyContent: "center", marginBottom: 24 },
  codeBox: {
    width: 60, height: 68, borderRadius: 16, fontSize: 28, fontWeight: "700",
    color: Colors.light.text, backgroundColor: Colors.light.inputBg,
    borderWidth: 2, borderColor: Colors.light.inputBorder,
  },
  codeBoxFilled: { borderColor: Colors.light.primary, backgroundColor: "#FEF2F2" },
  codeBoxError: { borderColor: "#E74C3C" },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" },
  verifyBtn: {
    backgroundColor: Colors.light.primary, paddingVertical: 17, borderRadius: 16,
    alignItems: "center", marginBottom: 24,
    shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  verifyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  resendLabel: { fontSize: 14, color: Colors.light.textSecondary },
  countdown: { fontSize: 14, color: Colors.light.textMuted, fontWeight: "600" },
  resendBtn: { fontSize: 14, fontWeight: "700", color: Colors.light.primary },
});
