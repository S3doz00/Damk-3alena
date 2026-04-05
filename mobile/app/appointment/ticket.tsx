import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

const BLOOD_COLORS: Record<string, string> = {
  "O-": "#C0392B", "O+": "#E74C3C", "A+": "#8E44AD",
  "A-": "#9B59B6", "B+": "#2980B9", "B-": "#3498DB",
  "AB+": "#16A085", "AB-": "#1ABC9C",
};

function TicketDivider({ colors }: { colors: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.background, marginLeft: -12 }} />
      <View style={{ flex: 1, height: 1.5, borderBottomWidth: 2, borderStyle: "dashed", borderColor: colors.separator, marginHorizontal: 4 }} />
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.background, marginRight: -12 }} />
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon as any} size={14} color={colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 }}>{label}</Text>
        <Text style={{ fontSize: 15, color: colors.text, fontWeight: "600" }}>{value}</Text>
      </View>
    </View>
  );
}

export default function AppointmentTicketScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { appointments, cancelAppointment, profile } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [cancelling, setCancelling] = useState(false);

  const appointment = appointments.find((a) => a.id === appointmentId);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  if (!appointment) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Feather name="x-circle" size={48} color={colors.textMuted} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 16 }}>{t('appointmentNotFound')}</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.replace("/(tabs)")}>
          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 16 }}>{t('goHome')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bloodColor = BLOOD_COLORS[appointment.bloodType] || colors.primary;
  const isCancelled = appointment.status === "cancelled";

  const qrData = JSON.stringify({
    fileNumber: appointment.fileNumber,
    hospital: appointment.hospitalName,
    date: appointment.date,
    time: appointment.time,
    patient: profile?.name || "Donor",
    bloodType: appointment.bloodType,
  });

  const handleCancel = () => {
    if (Platform.OS === "web") {
      if (window.confirm(t('cancelApptMsg'))) {
        doCancel();
      }
    } else {
      Alert.alert(
        t('cancelApptTitle'),
        t('cancelApptMsg'),
        [
          { text: t('keepIt'), style: "cancel" },
          { text: t('cancelAppointmentBtn'), style: "destructive", onPress: doCancel },
        ]
      );
    }
  };

  const doCancel = async () => {
    setCancelling(true);
    await cancelAppointment(appointment.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCancelling(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: botPad + 40, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            width: 42, height: 42, borderRadius: 12, backgroundColor: colors.card,
            alignItems: "center", justifyContent: "center",
            shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
          }}
          onPress={() => router.replace("/(tabs)")}
        >
          <Feather name="home" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{t('appointmentTicket')}</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Success header */}
      {!isCancelled && (
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Feather name="check-circle" size={28} color="#27AE60" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 4 }}>{t('appointmentConfirmedTitle')}</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>{t('showTicketHint')}</Text>
        </View>
      )}

      {/* Ticket */}
      <View style={[{ backgroundColor: colors.card, borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8, marginBottom: 20, position: "relative" }, isCancelled && { opacity: 0.7 }]}>
        {/* Cancelled overlay */}
        {isCancelled && (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: 10, backgroundColor: "rgba(255,255,255,0.4)" }}>
            <Text style={{ fontSize: 40, fontWeight: "900", color: "#E74C3C", opacity: 0.6, transform: [{ rotate: "-25deg" }], borderWidth: 3, borderColor: "#E74C3C", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 }}>CANCELLED</Text>
          </View>
        )}

        {/* Header */}
        <View style={{ padding: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: bloodColor }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: 1 }}>{appointment.fileNumber}</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "500", marginTop: 2 }}>{t('patientFileNumber')}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Feather name="droplet" size={16} color="#fff" />
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff" }}>{appointment.bloodType}</Text>
          </View>
        </View>

        {/* Hospital name strip */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.separator }}>
          <Feather name="map-pin" size={16} color={bloodColor} />
          <Text style={{ fontSize: 15, fontWeight: "700", flex: 1, color: bloodColor }}>{appointment.hospitalName}</Text>
        </View>

        <TicketDivider colors={colors} />

        {/* Info rows */}
        <View style={{ paddingHorizontal: 22, paddingVertical: 16, gap: 14 }}>
          <InfoRow icon="calendar" label={t('dateLabel')} value={appointment.date} colors={colors} />
          <InfoRow icon="clock" label={t('timeLabel')} value={appointment.time} colors={colors} />
          <InfoRow icon="map-pin" label={t('locationLabel')} value={appointment.hospitalAddress} colors={colors} />
          <InfoRow icon="user" label={t('donorLabel')} value={profile?.name || "Donor"} colors={colors} />
          <InfoRow icon="activity" label={t('bloodTypeTicketLabel')} value={appointment.bloodType} colors={colors} />
        </View>

        <TicketDivider colors={colors} />

        {/* QR Code */}
        <View style={{ alignItems: "center", paddingVertical: 20, paddingHorizontal: 22, gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>{t('scanAtEntrance')}</Text>
          <View style={{ padding: 16, borderRadius: 20, backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: colors.separator }}>
            <QRCode value={qrData} size={160} color="#1a1a2e" backgroundColor="#fff" />
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center" }}>{t('presentQR')}</Text>
        </View>

        {/* Footer */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.inputBg, padding: 14, borderTopWidth: 1, borderTopColor: colors.separator }}>
          <Feather name="droplet" size={14} color={bloodColor} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: bloodColor }}>Damk 3alena — Blood Donation Platform</Text>
        </View>
      </View>

      {/* Reminder */}
      {!isCancelled && (
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, backgroundColor: "#EFF6FF", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#BFDBFE", marginBottom: 16 }}>
          <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" }}>
            <Feather name="info" size={16} color="#2980B9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E40AF", marginBottom: 8 }}>{t('beforeYouArriveTitle')}</Text>
            <Text style={{ fontSize: 13, color: "#3B82F6", lineHeight: 22 }}>{t('arrivalInstructions')}</Text>
          </View>
        </View>
      )}

      {/* Cancel button */}
      {!isCancelled && (
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: "#E74C3C", backgroundColor: "#FEE2E2" }}
          onPress={handleCancel} disabled={cancelling} activeOpacity={0.75}
        >
          <Feather name="x-circle" size={18} color="#E74C3C" />
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#E74C3C" }}>{cancelling ? t('cancellingLabel') : t('cancelAppointmentBtn')}</Text>
        </TouchableOpacity>
      )}

      {isCancelled && (
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: colors.primary }}
          onPress={() => router.back()} activeOpacity={0.85}
        >
          <Feather name="refresh-cw" size={18} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{t('bookAnother')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
