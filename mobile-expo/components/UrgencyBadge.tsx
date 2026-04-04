import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  urgency: "low" | "medium" | "high" | "critical";
  label?: string;
}

const CONFIG = {
  critical: { bg: "#FEE2E2", text: "#991B1B", label: "Critical" },
  high: { bg: "#FEF3C7", text: "#92400E", label: "High" },
  medium: { bg: "#DBEAFE", text: "#1E40AF", label: "Medium" },
  low: { bg: "#D1FAE5", text: "#065F46", label: "Low" },
};

export default function UrgencyBadge({ urgency, label }: Props) {
  const c = CONFIG[urgency];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label || c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
