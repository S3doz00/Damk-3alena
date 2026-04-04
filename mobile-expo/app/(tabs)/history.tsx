import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BloodTypeBadge from "@/components/BloodTypeBadge";
import { useTheme } from "@/context/ThemeContext";
import { Donation, useApp } from "@/context/AppContext";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function DonationItem({ item }: { item: Donation }) {
  const { colors } = useTheme();
  const isCompleted = item.status === "completed";
  const isScheduled = item.status === "scheduled";

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flex: 1,
    },
    cardInfo: {
      flex: 1,
    },
    hospitalName: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    hospitalCity: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    date: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 3,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusCompleted: {
      backgroundColor: "#D1FAE5",
    },
    statusScheduled: {
      backgroundColor: "#DBEAFE",
    },
    statusCancelled: {
      backgroundColor: "#FEE2E2",
    },
    statusText: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    statusCompletedText: {
      color: "#065F46",
    },
    statusScheduledText: {
      color: "#1E40AF",
    },
    statusCancelledText: {
      color: "#991B1B",
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <BloodTypeBadge type={item.bloodType} size="sm" />
        <View style={styles.cardInfo}>
          <Text style={styles.hospitalName} numberOfLines={1}>
            {item.hospitalName}
          </Text>
          <Text style={styles.hospitalCity}>{item.hospitalCity}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
        </View>
      </View>
      <View
        style={[
          styles.statusBadge,
          isCompleted
            ? styles.statusCompleted
            : isScheduled
            ? styles.statusScheduled
            : styles.statusCancelled,
        ]}
      >
        <Feather
          name={
            isCompleted ? "check-circle" : isScheduled ? "clock" : "x-circle"
          }
          size={12}
          color={isCompleted ? "#065F46" : isScheduled ? "#1E40AF" : "#991B1B"}
        />
        <Text
          style={[
            styles.statusText,
            isCompleted
              ? styles.statusCompletedText
              : isScheduled
              ? styles.statusScheduledText
              : styles.statusCancelledText,
          ]}
        >
          {item.status}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { donations, appointments, profile } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const allEntries: Donation[] = [
    ...donations,
    ...appointments
      .filter((a) => a.status !== "cancelled")
      .map((a) => ({
        id: a.id,
        date: a.date,
        hospitalName: a.hospitalName,
        hospitalCity: "",
        bloodType: profile?.bloodType || ("A+" as any),
        units: 1,
        status: a.status === "upcoming" ? ("scheduled" as const) : ("completed" as const),
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: 20,
    },
    statsRow: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 3,
      marginBottom: 4,
    },
    stat: {
      flex: 1,
      alignItems: "center",
    },
    statNum: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.separator,
    },
    list: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    empty: {
      alignItems: "center",
      paddingTop: 60,
      gap: 12,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.title}>Donation History</Text>
        <Text style={styles.subtitle}>
          {donations.length} completed donations
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{donations.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: "#3498DB" }]}>
              {donations.length * 3}
            </Text>
            <Text style={styles.statLabel}>Lives Helped</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.success }]}>
              {(donations.length * 0.45).toFixed(1)}L
            </Text>
            <Text style={styles.statLabel}>Blood Given</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={allEntries}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => <DonationItem item={item} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: botPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="droplet" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No donations yet</Text>
            <Text style={styles.emptyText}>
              Your donation history will appear here after your first donation
            </Text>
          </View>
        }
      />
    </View>
  );
}
