import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
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
import { useLanguage } from "@/context/LanguageContext";

export default function LoginScreen() {
  const { login } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { accountCreated } = useLocalSearchParams<{ accountCreated?: string }>();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const isEmail = identifier.includes("@") || identifier.length === 0;

  const handleLogin = async () => {
    setError("");
    if (!identifier.trim()) {
      setError(t('pleaseEnterIdentifier'));
      return;
    }
    if (!password) {
      setError(t('pleaseEnterPassword'));
      return;
    }
    setLoading(true);
    const result = await login(identifier.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || t('loginFailed'));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingTop: topPad + 24, paddingBottom: botPad + 40, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Feather name="droplet" size={28} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Damk 3alena</Text>
          <Text style={[styles.appTagline, { color: colors.textMuted }]}>{t('bloodDonationPlatformTagline')}</Text>
        </View>

        {accountCreated === "1" && (
          <View style={[styles.successBanner, { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" }]}>
            <View style={styles.successIconWrap}>
              <Feather name="check-circle" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>{t('accountCreatedTitle')}</Text>
              <Text style={styles.successBody}>{t('accountReady')}</Text>
            </View>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('welcomeBack')}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{t('signInWith')}</Text>

          {error.length > 0 && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={15} color="#991B1B" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('emailOrPhone')}</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Feather
                name={isEmail ? "mail" : "phone"}
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="you@example.com or 7XXXXXXXX"
                placeholderTextColor={colors.textMuted}
                value={identifier}
                onChangeText={(v) => { setIdentifier(v); setError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            <Text style={[styles.inputHint, { color: colors.textMuted }]}>
              {t('emailOrPhoneHint')}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('passwordLabel')}</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Feather name="lock" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(""); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push("/auth/forgot-password")}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>{t('forgotPassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.8 }]}
            onPress={handleLogin} disabled={loading} activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Text style={styles.loginBtnText}>{t('signIn')}</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>{t('newDonor')}</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
        </View>

        <TouchableOpacity
          style={[styles.signupBtn, { borderColor: colors.primary }]}
          onPress={() => router.push("/auth/signup")} activeOpacity={0.85}
        >
          <Text style={[styles.signupBtnText, { color: colors.primary }]}>{t('createAccountLink')}</Text>
        </TouchableOpacity>

        <View style={styles.infoBanner}>
          <Feather name="heart" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('joinThousands')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: "center", marginBottom: 28 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  appName: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  appTagline: { fontSize: 13, marginTop: 4 },
  successBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 16, padding: 14, marginBottom: 20,
    borderWidth: 1.5,
  },
  successIconWrap: { marginTop: 1 },
  successTitle: { fontSize: 15, fontWeight: "700", color: "#065F46", marginBottom: 2 },
  successBody: { fontSize: 13, color: "#047857", lineHeight: 17 },
  card: {
    borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  cardSubtitle: { fontSize: 14, marginBottom: 24 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 20,
  },
  errorText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  inputHint: { fontSize: 11, marginTop: 5, fontWeight: "500" },
  eyeBtn: { padding: 4, marginLeft: 8 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 24, marginTop: -8 },
  forgotText: { fontSize: 13, fontWeight: "600" },
  loginBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 17, borderRadius: 16, gap: 10,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  loginBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  signupBtn: {
    borderWidth: 2, borderRadius: 16,
    paddingVertical: 16, alignItems: "center", marginBottom: 24,
  },
  signupBtnText: { fontSize: 17, fontWeight: "700" },
  infoBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  infoText: { fontSize: 13, textAlign: "center", flex: 1, lineHeight: 18 },
});
