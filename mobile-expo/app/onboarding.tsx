import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { BloodType, DonorProfile, useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CITIES = ["Amman", "Zarqa", "Irbid", "Aqaba", "Jerash", "Madaba", "Karak", "Other"];

const CITY_TRANSLATIONS: Record<string, { ar: string }> = {
  Amman: { ar: 'عمّان' }, Zarqa: { ar: 'الزرقاء' }, Irbid: { ar: 'إربد' },
  Aqaba: { ar: 'العقبة' }, Jerash: { ar: 'جرش' }, Madaba: { ar: 'مادبا' },
  Karak: { ar: 'الكرك' }, Other: { ar: 'أخرى' },
}

export default function OnboardingScreen() {
  const { profile: currentProfile, setProfile, completeOnboarding } = useApp();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [city, setCity] = useState("");
  const [dob, setDob] = useState("");
  const [weight, setWeight] = useState("");

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 2) {
      setStep(step + 1);
    } else {
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

      if (currentProfile) {
        await setProfile({
          ...currentProfile,
          firstName, lastName, name, bloodType, phone, city,
          dateOfBirth: dob, avatarInitials: initials,
        });
      }
      await completeOnboarding();
      router.replace("/(tabs)");
    }
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 1 && phone.trim().length > 7;
    if (step === 1) return bloodType !== null;
    if (step === 2) return city.length > 0;
    return false;
  };

  function cityLabel(c: string) {
    return lang === 'ar' ? (CITY_TRANSLATIONS[c]?.ar ?? c) : c
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🩸</Text>
          </View>
          <Text style={styles.appName}>Damk 3alena</Text>
        </View>

        <View style={styles.stepIndicator}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>

        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('onboardStep1Title')}</Text>
            <Text style={styles.stepSubtitle}>{t('onboardStep1Desc')}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('fullName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('fullNamePlaceholder')}
                placeholderTextColor={Colors.light.textMuted}
                value={name} onChangeText={setName} autoCapitalize="words"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('phoneNumber')}</Text>
              <TextInput
                style={styles.input}
                placeholder="+962 7x xxx xxxx"
                placeholderTextColor={Colors.light.textMuted}
                value={phone} onChangeText={setPhone} keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('dateOfBirth')}</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={Colors.light.textMuted}
                value={dob} onChangeText={setDob}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('weightOptional')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('weightPlaceholder')}
                placeholderTextColor={Colors.light.textMuted}
                value={weight} onChangeText={setWeight} keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('onboardStep2Title')}</Text>
            <Text style={styles.stepSubtitle}>{t('onboardStep2Desc')}</Text>
            <View style={styles.bloodGrid}>
              {BLOOD_TYPES.map((bt) => (
                <TouchableOpacity
                  key={bt}
                  style={[styles.bloodBtn, bloodType === bt && styles.bloodBtnActive]}
                  onPress={() => { Haptics.selectionAsync(); setBloodType(bt); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.bloodBtnText, bloodType === bt && styles.bloodBtnTextActive]}>
                    {bt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.infoBanner}>
              <Feather name="info" size={16} color={Colors.light.primary} />
              <Text style={styles.infoText}>{t('onboardBloodTypeNote')}</Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('onboardStep3Title')}</Text>
            <Text style={styles.stepSubtitle}>{t('onboardStep3Desc')}</Text>
            <View style={styles.cityGrid}>
              {CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cityBtn, city === c && styles.cityBtnActive]}
                  onPress={() => { Haptics.selectionAsync(); setCity(c); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.cityBtnText, city === c && styles.cityBtnTextActive]}>
                    {cityLabel(c)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed()}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {step < 2 ? t('onboardContinue') : t('onboardFinish')}
          </Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 24, minHeight: "100%" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 },
  logoCircle: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 22 },
  appName: { fontSize: 22, fontWeight: "800", color: Colors.light.primary },
  stepIndicator: { flexDirection: "row", gap: 8, marginBottom: 32 },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.light.separator },
  dotActive: { backgroundColor: Colors.light.primary },
  stepContent: { flex: 1, marginBottom: 32 },
  stepTitle: { fontSize: 26, fontWeight: "800", color: Colors.light.text, marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: Colors.light.textSecondary, marginBottom: 28, lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.light.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: Colors.light.inputBg, borderWidth: 1.5, borderColor: Colors.light.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.light.text },
  bloodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  bloodBtn: { width: "23%", aspectRatio: 1, borderRadius: 16, borderWidth: 2, borderColor: Colors.light.inputBorder, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.card, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  bloodBtnActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary, shadowColor: Colors.light.primary, shadowOpacity: 0.3, elevation: 4 },
  bloodBtnText: { fontSize: 17, fontWeight: "800", color: Colors.light.text, textAlign: "center" },
  bloodBtnTextActive: { color: "#fff" },
  infoBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FEE2E2", padding: 14, borderRadius: 12, marginTop: 24 },
  infoText: { flex: 1, fontSize: 13, color: Colors.light.primaryDark, lineHeight: 18 },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cityBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.light.inputBorder, backgroundColor: Colors.light.card },
  cityBtnActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary },
  cityBtnText: { fontSize: 15, fontWeight: "600", color: Colors.light.text },
  cityBtnTextActive: { color: "#fff" },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.primary, paddingVertical: 18, borderRadius: 16, gap: 10, shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  nextBtnDisabled: { backgroundColor: Colors.light.inputBorder, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
