import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UrgencyBadge from "@/components/UrgencyBadge";
import Colors from "@/constants/colors";
import { CAMPAIGNS } from "@/constants/hospitals";
import { useApp } from "@/context/AppContext";

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, addAppointment } = useApp();
  const insets = useSafeAreaInsets();
  const [registered, setRegistered] = useState(false);

  const campaign = CAMPAIGNS.find((c) => c.id === id);

  if (!campaign) {
    return (
      <View style={styles.notFound}>
        <Text>Campaign not found</Text>
      </View>
    );
  }

  const pct = Math.round((campaign.registeredCount / campaign.targetCount) * 100);

  const handleRegister = async () => {
    if (!profile?.bloodType) {
      Alert.alert(
        "Blood Type Required",
        "Please set your blood type in your profile before registering."
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addAppointment({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      hospitalId: campaign.hospitalId,
      hospitalName: campaign.hospitalName,
      hospitalAddress: "",
      date: campaign.date,
      time: campaign.startTime,
      status: "upcoming",
      bloodType: profile.bloodType,
    });

    setRegistered(true);
    Alert.alert(
      "Registered!",
      `You're registered for "${campaign.title}". See you on ${campaign.date}!`,
      [{ text: "Done", onPress: () => router.back() }]
    );
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: botPad + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <UrgencyBadge urgency={campaign.urgency} />
        <Text style={styles.heroTitle}>{campaign.title}</Text>
        <Text style={styles.heroHospital}>{campaign.hospitalName}</Text>

        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <Feather name="calendar" size={16} color={Colors.light.primary} />
            <Text style={styles.heroMetaText}>{campaign.date}</Text>
          </View>
          <View style={styles.heroMetaItem}>
            <Feather name="clock" size={16} color={Colors.light.primary} />
            <Text style={styles.heroMetaText}>
              {campaign.startTime} - {campaign.endTime}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{campaign.registeredCount}</Text>
          <Text style={styles.statLabel}>Registered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#3498DB" }]}>
            {campaign.targetCount - campaign.registeredCount}
          </Text>
          <Text style={styles.statLabel}>Spots Left</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: Colors.light.success }]}>
            {pct}%
          </Text>
          <Text style={styles.statLabel}>Filled</Text>
        </View>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressBar, { width: `${pct}%` }]} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This Campaign</Text>
        <Text style={styles.description}>{campaign.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blood Types Needed</Text>
        <View style={styles.bloodTypes}>
          {campaign.bloodTypesNeeded.map((bt) => (
            <View key={bt} style={styles.btChip}>
              <Text style={styles.btText}>{bt}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Donation Tips</Text>
        {[
          "Fast for 4 hours before your appointment",
          "Drink plenty of water beforehand",
          "Wear comfortable, loose-fitting clothing",
          "Bring a valid ID",
          "Get a good night's sleep",
        ].map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.registerBtn, registered && styles.registerBtnDone]}
        onPress={registered ? undefined : handleRegister}
        activeOpacity={0.85}
      >
        <Feather
          name={registered ? "check-circle" : "user-plus"}
          size={20}
          color="#fff"
        />
        <Text style={styles.registerBtnText}>
          {registered ? "Registered!" : "Register for Campaign"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 4,
  },
  heroHospital: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  heroMeta: {
    flexDirection: "row",
    gap: 20,
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroMetaText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.separator,
  },
  progressWrap: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressBg: {
    height: 10,
    backgroundColor: Colors.light.separator,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  bloodTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  btChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  btText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.primary,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  registerBtnDone: {
    backgroundColor: Colors.light.success,
    shadowColor: Colors.light.success,
  },
  registerBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
