import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const proceed = async () => {
    await AsyncStorage.setItem("locationAsked", "true");
    router.replace("/(tabs)");
  };

  const handleAlwaysAllow = async () => {
    setLoading(true);
    setSelected("always");
    Haptics.selectionAsync();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        await Location.requestBackgroundPermissionsAsync().catch(() => {});
      }
    } catch {}
    setLoading(false);
    proceed();
  };

  const handleAllowOnce = async () => {
    setLoading(true);
    setSelected("once");
    Haptics.selectionAsync();
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {}
    setLoading(false);
    proceed();
  };

  const handleDontAllow = () => {
    setSelected("deny");
    Haptics.selectionAsync();
    proceed();
  };

  return (
    <View style={[styles.container, { paddingTop: topPad + 40, paddingBottom: botPad + 40 }]}>
      {/* Top illustration */}
      <View style={styles.illustrationWrap}>
        <View style={styles.mapCircle}>
          <View style={styles.mapInner}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.mapRing, { width: 80 + i * 60, height: 80 + i * 60, opacity: 1 - i * 0.3 }]} />
            ))}
            <View style={styles.mapPin}>
              <Feather name="map-pin" size={28} color={Colors.light.primary} />
            </View>
          </View>
        </View>
      </View>

      {/* Text */}
      <Text style={styles.title}>Allow Location Access</Text>
      <Text style={styles.subtitle}>
        <Text style={{ fontWeight: "700", color: Colors.light.text }}>Damk 3alena</Text>
        {" "}would like to access your location to find nearby blood banks and hospitals, and alert you when urgent donations are needed in your area.
      </Text>

      {/* Benefits */}
      <View style={styles.benefitsList}>
        {[
          { icon: "map-pin", text: "Find blood banks near you" },
          { icon: "bell", text: "Get alerts for urgent nearby requests" },
          { icon: "navigation", text: "Get directions to hospitals" },
        ].map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Feather name={b.icon as any} size={16} color={Colors.light.primary} />
            </View>
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        ))}
      </View>

      {/* Options */}
      <View style={styles.optionsWrap}>
        <TouchableOpacity
          style={[styles.optionBtn, styles.optionBtnPrimary]}
          onPress={handleAlwaysAllow} disabled={loading} activeOpacity={0.85}
        >
          {loading && selected === "always" ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={styles.optionBtnPrimaryText}>Always Allow</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionBtn, styles.optionBtnSecondary]}
          onPress={handleAllowOnce} disabled={loading} activeOpacity={0.85}
        >
          {loading && selected === "once" ? <ActivityIndicator color={Colors.light.primary} size="small" /> : (
            <>
              <Feather name="clock" size={20} color={Colors.light.primary} />
              <Text style={styles.optionBtnSecondaryText}>Allow Once</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.dontAllowBtn} onPress={handleDontAllow} activeOpacity={0.7}>
          <Text style={styles.dontAllowText}>Don't Allow</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.privacyNote}>
        You can change this at any time in Settings. We never share your location with third parties.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.light.background,
    paddingHorizontal: 28, alignItems: "center",
  },
  illustrationWrap: { marginBottom: 36, alignItems: "center" },
  mapCircle: { width: 200, height: 200, alignItems: "center", justifyContent: "center" },
  mapInner: { alignItems: "center", justifyContent: "center", position: "relative" },
  mapRing: {
    position: "absolute", borderRadius: 1000,
    borderWidth: 1.5, borderColor: Colors.light.primary,
    opacity: 0.2,
  },
  mapPin: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: "#FEF2F2",
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  title: { fontSize: 26, fontWeight: "800", color: Colors.light.text, textAlign: "center", letterSpacing: -0.5, marginBottom: 14 },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  benefitsList: { width: "100%", marginBottom: 36, gap: 14 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  benefitIcon: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: "#FEF2F2",
    alignItems: "center", justifyContent: "center",
  },
  benefitText: { fontSize: 14, color: Colors.light.text, fontWeight: "500", flex: 1 },
  optionsWrap: { width: "100%", gap: 12, marginBottom: 20 },
  optionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 16,
  },
  optionBtnPrimary: {
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  optionBtnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  optionBtnSecondary: {
    borderWidth: 2, borderColor: Colors.light.primary, backgroundColor: "transparent",
  },
  optionBtnSecondaryText: { fontSize: 16, fontWeight: "700", color: Colors.light.primary },
  dontAllowBtn: { paddingVertical: 14, alignItems: "center" },
  dontAllowText: { fontSize: 15, color: Colors.light.textMuted, fontWeight: "600" },
  privacyNote: {
    fontSize: 12, color: Colors.light.textMuted, textAlign: "center",
    lineHeight: 18, paddingHorizontal: 10,
  },
});
