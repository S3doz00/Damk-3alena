import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

export default function LocationScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const proceed = () => router.replace("/(tabs)");

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
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 28, alignItems: "center", paddingTop: topPad + 40, paddingBottom: botPad + 40 }}>
      <View style={{ marginBottom: 36, alignItems: "center" }}>
        <View style={{ width: 200, height: 200, alignItems: "center", justifyContent: "center" }}>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{
                position: "absolute",
                width: 80 + i * 60,
                height: 80 + i * 60,
                borderRadius: 1000,
                borderWidth: 1.5,
                borderColor: colors.primary,
                opacity: 1 - i * 0.3,
              }} />
            ))}
            <View style={{
              width: 56, height: 56, borderRadius: 28, backgroundColor: "#FEF2F2",
              alignItems: "center", justifyContent: "center",
              shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
            }}>
              <Feather name="map-pin" size={28} color={colors.primary} />
            </View>
          </View>
        </View>
      </View>

      <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text, textAlign: "center", letterSpacing: -0.5, marginBottom: 14 }}>
        Allow Location Access
      </Text>
      <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 28 }}>
        <Text style={{ fontWeight: "700", color: colors.text }}>Damk 3alena</Text>
        {" "}would like to access your location to find nearby blood banks and hospitals, and alert you when urgent donations are needed in your area.
      </Text>

      <View style={{ width: "100%", marginBottom: 36, gap: 14 }}>
        {[
          { icon: "map-pin", text: "Find blood banks near you" },
          { icon: "bell", text: "Get alerts for urgent nearby requests" },
          { icon: "navigation", text: "Get directions to hospitals" },
        ].map((b, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
              <Feather name={b.icon as any} size={16} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500", flex: 1 }}>{b.text}</Text>
          </View>
        ))}
      </View>

      <View style={{ width: "100%", gap: 12, marginBottom: 20 }}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }}
          onPress={handleAlwaysAllow} disabled={loading} activeOpacity={0.85}
        >
          {loading && selected === "always" ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Always Allow</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: colors.primary, backgroundColor: "transparent" }}
          onPress={handleAllowOnce} disabled={loading} activeOpacity={0.85}
        >
          {loading && selected === "once" ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              <Feather name="clock" size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>Allow Once</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ paddingVertical: 14, alignItems: "center" }}
          onPress={handleDontAllow} activeOpacity={0.7}
        >
          <Text style={{ fontSize: 15, color: colors.textMuted, fontWeight: "600" }}>Don't Allow</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", lineHeight: 18, paddingHorizontal: 10 }}>
        You can change this at any time in Settings. We never share your location with third parties.
      </Text>
    </View>
  );
}
