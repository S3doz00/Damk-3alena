import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { BloodType } from "@/context/AppContext";

interface Props {
  type: BloodType | string;
  size?: "sm" | "md" | "lg";
  style?: object;
}

const BLOOD_COLORS: Record<string, string> = {
  "O-": "#C0392B",
  "O+": "#E74C3C",
  "A-": "#8E44AD",
  "A+": "#9B59B6",
  "B-": "#2980B9",
  "B+": "#3498DB",
  "AB-": "#16A085",
  "AB+": "#1ABC9C",
};

export default function BloodTypeBadge({ type, size = "md", style }: Props) {
  const color = BLOOD_COLORS[type] || Colors.light.primary;

  const sizes = {
    sm: { badge: 28, font: 10, radius: 6 },
    md: { badge: 44, font: 14, radius: 10 },
    lg: { badge: 64, font: 20, radius: 14 },
  };

  const s = sizes[size];

  return (
    <View
      style={[
        styles.badge,
        {
          width: s.badge,
          height: s.badge,
          borderRadius: s.radius,
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: s.font }]}>{type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
});
