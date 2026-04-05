import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
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
  colors,
}: {
  notif: Notification;
  onPress: () => void;
  colors: any;
}) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.reminder;
  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: colors.card,
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
        !notif.read && {
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {!notif.read && (
        <View
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.primary,
          }}
        />
      )}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: cfg.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={cfg.icon as any} size={20} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Text
            style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.text }}
            numberOfLines={1}
          >
            {notif.title}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            {timeAgo(notif.timestamp)}
          </Text>
        </View>
        <Text
          style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}
          numberOfLines={2}
        >
          {notif.body}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 16,
          paddingTop: topPad + 16,
          gap: 14,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: "800", color: colors.text }}>
          {t('notificationsTitle')}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllNotificationsRead}>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
              {t('markAllRead')}
            </Text>
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
            colors={colors}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: botPad + 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              paddingTop: 80,
              gap: 12,
              paddingHorizontal: 40,
            }}
          >
            <Feather name="bell-off" size={48} color={colors.textMuted} />
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>
              {t('noNotifications')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {t('noNotificationsDesc')}
            </Text>
          </View>
        }
      />
    </View>
  );
}
