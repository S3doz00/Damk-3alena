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
import Colors from "@/constants/colors";
import { Notification, useApp } from "@/context/AppContext";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  shortage: { icon: "alert-triangle", color: "#C0392B", bg: "#FEE2E2" },
  campaign: { icon: "calendar", color: "#2980B9", bg: "#DBEAFE" },
  eligibility: { icon: "check-circle", color: "#27AE60", bg: "#D1FAE5" },
  reminder: { icon: "bell", color: "#F39C12", bg: "#FEF3C7" },
};

function NotifItem({
  notif,
  onPress,
}: {
  notif: Notification;
  onPress: () => void;
}) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.reminder;
  return (
    <TouchableOpacity
      style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {!notif.read && <View style={styles.unreadDot} />}
      <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.icon as any} size={20} color={cfg.color} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifTop}>
          <Text style={styles.notifTitle} numberOfLines={1}>
            {notif.title}
          </Text>
          <Text style={styles.notifTime}>{timeAgo(notif.timestamp)}</Text>
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>
          {notif.body}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useApp();
  const insets = useSafeAreaInsets();

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllNotificationsRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <NotifItem
            notif={item}
            onPress={() => markNotificationRead(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: botPad + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell-off" size={48} color={Colors.light.textMuted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              You'll be alerted when nearby hospitals need your blood type
            </Text>
          </View>
        }
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
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: Colors.light.text,
  },
  markAll: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  notifCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 10,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  notifTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  notifBody: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
