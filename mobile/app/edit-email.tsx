import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

export default function EditEmailScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

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
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

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
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>{t('editEmailTitle')}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{t('editEmailDesc')}</Text>
          </View>
        </View>

        {success ? (
          <View style={{
            flexDirection: "row", alignItems: "flex-start", gap: 14,
            backgroundColor: "#D1FAE5", borderRadius: 18, padding: 18,
            borderWidth: 1, borderColor: "#6EE7B7", marginBottom: 24,
          }}>
            <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: "#A7F3D0", alignItems: "center", justifyContent: "center" }}>
              <Feather name="check-circle" size={18} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#065F46", marginBottom: 4 }}>{t('emailUpdated')}</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={{ fontSize: 13, color: "#059669", fontWeight: "600" }}>← {t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
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
              {t('newEmailLabel')}
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
              <Feather name="mail" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {loading ? t('updating') : t('updateEmail')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
