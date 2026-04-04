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
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";

export default function LoginScreen() {
  const { login } = useApp();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const handleLogin = async () => {
    setError("");
    if (!phone.trim()) { setError("Please enter your phone number."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setLoading(true);
    const result = await login(phone.trim(), password);
    setLoading(false);
    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || "Login failed.");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Routing is handled by _layout.tsx based on auth state
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    logoWrap: { alignItems: "center", marginBottom: 36 },
    logoCircle: {
      width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center", marginBottom: 14,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
    },
    appName: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
    appTagline: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    card: {
      backgroundColor: colors.card, borderRadius: 24, padding: 24, marginBottom: 24,
      shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    },
    cardTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 6 },
    cardSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
    errorBanner: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 20,
    },
    errorText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" },
    inputGroup: { marginBottom: 18 },
    label: {
      fontSize: 12, fontWeight: "700", color: colors.textSecondary,
      textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8,
    },
    inputWrap: {
      flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBg,
      borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 14,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 14 },
    eyeBtn: { padding: 4, marginLeft: 8 },
    forgotBtn: { alignSelf: "flex-end", marginBottom: 24, marginTop: -8 },
    forgotText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
    loginBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      backgroundColor: colors.primary, paddingVertical: 17, borderRadius: 16, gap: 10,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
    loginBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
    divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.separator },
    dividerText: { fontSize: 13, color: colors.textMuted },
    signupBtn: {
      borderWidth: 2, borderColor: colors.primary, borderRadius: 16,
      paddingVertical: 16, alignItems: "center", marginBottom: 24,
    },
    signupBtnText: { color: colors.primary, fontSize: 17, fontWeight: "700" },
    infoBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    infoText: { fontSize: 13, color: colors.textSecondary, textAlign: "center", flex: 1, lineHeight: 18 },
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: topPad + 24, paddingBottom: botPad + 40, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Feather name="droplet" size={28} color="#fff" />
          </View>
          <Text style={styles.appName}>Damk 3alena</Text>
          <Text style={styles.appTagline}>Blood Donation Platform · Jordan</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in with your phone number</Text>

          {error.length > 0 && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={15} color="#991B1B" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrap}>
              <Feather name="phone" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+962 7X XXX XXXX"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={(t) => { setPhone(t); setError(""); }}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(""); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.8 }]}
            onPress={handleLogin} disabled={loading} activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>New donor?</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.signupBtn} onPress={() => router.push("/auth/signup")} activeOpacity={0.85}>
          <Text style={styles.signupBtnText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.infoBanner}>
          <Feather name="heart" size={14} color={colors.primary} />
          <Text style={styles.infoText}>Join thousands of donors helping save lives across Jordan</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
