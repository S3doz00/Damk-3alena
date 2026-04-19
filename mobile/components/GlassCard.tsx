import React from "react";
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";

// Glassmorphism card. Two-layer structure:
//   Outer wrapper (no overflow)  — carries shadow + soft halo spill
//   Inner card    (overflow hidden, borderRadius) — blur + 2-px top accent + content
// This lets the corner halo bleed past the card edge as a real glow
// instead of being clipped to a flat rectangle.

export interface GlassCardProps extends ViewProps {
  glowColor?: string;
  intensity?: number;
  variant?: "raised" | "flat";
  borderRadius?: number;
  children?: React.ReactNode;
}

export function GlassCard({
  glowColor,
  intensity,
  variant = "raised",
  borderRadius = 20,
  style,
  children,
  ...rest
}: GlassCardProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const borderHue = glowColor ?? colors.primary;

  const blurIntensity = intensity ?? (isDark ? 40 : 25);
  const tint: "dark" | "light" = isDark ? "dark" : "light";

  const wrapperStyle: ViewStyle = {
    ...(variant === "raised"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: isDark ? 14 : 14,
          elevation: 3,
        }
      : {}),
  };

  const cardStyle: ViewStyle = {
    borderRadius,
    overflow: "hidden",
    backgroundColor: isDark
      ? (Platform.OS === "android" ? colors.card : "transparent")
      : colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  };

  return (
    <View style={[wrapperStyle, style]} {...rest}>
      <View style={cardStyle}>
        {/* Dark mode: real blur. Light mode: solid surface (no blur) to keep parchment crispness. */}
        {isDark && Platform.OS !== "android" && (
          <BlurView
            intensity={blurIntensity}
            tint={tint}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Tinted overlay — dark only. */}
        {isDark && (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBg }]}
          />
        )}

        {/* Internal diagonal sheen — subtle, extends cleanly because it fades before the edge. */}
        <LinearGradient
          pointerEvents="none"
          colors={[borderHue + (isDark ? "22" : "0A"), "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.2, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 2-px top accent in category color. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 2,
            backgroundColor: borderHue,
            opacity: isDark ? 0.95 : 0.85,
          }}
        />

        <View style={{ position: "relative" }}>{children}</View>
      </View>
    </View>
  );
}

export default GlassCard;
