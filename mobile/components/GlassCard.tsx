import React from "react";
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";

// Glassmorphism card matching dashboard's "Glass card — DASHBOARD" spec:
// 2-px top border in category color · inset highlight · soft blur.
//
// Layers (bottom → top):
//   1. BlurView (dark: intensity 40 / light: intensity 25)
//   2. Tinted glass background (theme.glassBg)
//   3. LinearGradient inset-highlight (top)
//   4. Optional 2-px accent border (glowColor)
//   5. Children
//
// Props:
//   glowColor    — border/glow hue. Defaults to primary.
//   intensity    — blur amount (0 disables blur).
//   variant      — "raised" (default) | "flat" (no shadow).
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

  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: "hidden",
    // On both platforms, render a solid surface in light mode so the card reads as
    // a clean parchment card rather than a ghostly translucent wash. Dark mode
    // keeps the blur for that "command center" glassmorphism.
    backgroundColor: isDark
      ? (Platform.OS === "android" ? colors.card : "transparent")
      : colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...(variant === "raised"
      ? {
          shadowColor: isDark ? "#000" : "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.06,
          shadowRadius: isDark ? 18 : 12,
          elevation: 3,
        }
      : {}),
  };

  return (
    <View style={[containerStyle, style]} {...rest}>
      {/* Dark mode: real blur for glass effect. Light mode: the solid surface above
          already provides the card look, so we skip blur to avoid the washed-out haze. */}
      {isDark && Platform.OS !== "android" && (
        <BlurView
          intensity={blurIntensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Tinted glass overlay — only in dark mode */}
      {isDark && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBg }]}
        />
      )}

      {/* 2-px top accent in category color */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 2,
          backgroundColor: borderHue,
          opacity: isDark ? 0.9 : 0.85,
        }}
      />

      {/* Soft glow orb top-right — strong in dark, very subtle in light */}
      <LinearGradient
        pointerEvents="none"
        colors={[borderHue + (isDark ? "55" : "14"), "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.7 }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: isDark ? 160 : 120,
          height: isDark ? 120 : 80,
        }}
      />

      <View style={{ position: "relative" }}>{children}</View>
    </View>
  );
}

export default GlassCard;
