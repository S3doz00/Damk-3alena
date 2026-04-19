import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

function ClassicTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: isIOS ? 1 : 1.5,
          borderTopColor: isIOS ? colors.separator : (theme === "dark" ? "#2A2A3A" : "#E0E0E0"),
          elevation: isIOS ? 0 : 8,
          height: isWeb ? 84 : (65 + (isIOS ? 0 : insets.bottom)),
          paddingBottom: isIOS ? 0 : insets.bottom,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={theme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: isWeb ? 10 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house" tintColor={color} size={24} /> : <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: t('tabMap'),
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="map" tintColor={color} size={24} /> : <Feather name="map" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="urgent"
        options={{
          title: t('tabUrgent'),
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="drop.triangle" tintColor={color} size={24} /> : <Feather name="alert-triangle" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.circle" tintColor={color} size={24} /> : <Feather name="user" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="hospitals" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  // NativeTabs on iOS 26 follow OS appearance and ignore in-app theme switching,
  // so we always use the classic layout to keep the tab bar in sync with the user's
  // chosen theme (dark/light) inside the app.
  return <ClassicTabLayout />;
}
