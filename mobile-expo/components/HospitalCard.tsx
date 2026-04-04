import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { Hospital } from "@/constants/hospitals";
import UrgencyBadge from "./UrgencyBadge";

interface Props {
  hospital: Hospital;
  onPress: (h: Hospital) => void;
}

const LEVEL_MAP: Record<string, "low" | "medium" | "high" | "critical"> = {
  critical: "critical",
  low: "high",
  moderate: "medium",
  adequate: "low",
};

export default function HospitalCard({ hospital, onPress }: Props) {
  const criticalNeeds = hospital.bloodNeeds.filter(
    (n) => n.level === "critical" || n.level === "low"
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(hospital)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Feather name="activity" size={20} color={Colors.light.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {hospital.name}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {hospital.address}
          </Text>
        </View>
        <View style={styles.distWrap}>
          <Text style={styles.distance}>{hospital.distance}km</Text>
          <Text style={styles.hours}>{hospital.openHours}</Text>
        </View>
      </View>

      {criticalNeeds.length > 0 && (
        <View style={styles.needs}>
          {criticalNeeds.slice(0, 3).map((need) => (
            <View key={need.type} style={styles.needItem}>
              <UrgencyBadge urgency={LEVEL_MAP[need.level]} label={need.type} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Feather name="phone" size={13} color={Colors.light.textSecondary} />
          <Text style={styles.footerText}>{hospital.phone}</Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={() => onPress(hospital)}>
          <Text style={styles.bookBtnText}>Book</Text>
          <Feather name="chevron-right" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  address: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  distWrap: {
    alignItems: "flex-end",
  },
  distance: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  hours: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  needs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  needItem: {},
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.separator,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
