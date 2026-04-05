import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UrgencyBadge from "@/components/UrgencyBadge";
import Colors from "@/constants/colors";
import { CAMPAIGNS } from "@/constants/hospitals";

export default function CampaignsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Blood Drives</Text>
      </View>

      <FlatList
        data={CAMPAIGNS}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/campaign/[id]",
                params: { id: item.id },
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <UrgencyBadge urgency={item.urgency} />
              <Text style={styles.cardDate}>{item.date}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardHospital}>{item.hospitalName}</Text>

            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Feather name="clock" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.metaText}>
                  {item.startTime} - {item.endTime}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="users" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.metaText}>
                  {item.registeredCount}/{item.targetCount}
                </Text>
              </View>
            </View>

            <View style={styles.bloodTypes}>
              {item.bloodTypesNeeded.map((bt) => (
                <View key={bt} style={styles.btChip}>
                  <Text style={styles.btChipText}>{bt}</Text>
                </View>
              ))}
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.round(
                        (item.registeredCount / item.targetCount) * 100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((item.registeredCount / item.targetCount) * 100)}%
                filled
              </Text>
            </View>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() =>
                router.push({
                  pathname: "/campaign/[id]",
                  params: { id: item.id },
                })
              }
            >
              <Text style={styles.registerBtnText}>View & Register</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: botPad + 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.light.text,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 4,
  },
  cardHospital: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 14,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  bloodTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  btChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  btChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.separator,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 13,
    gap: 8,
  },
  registerBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
