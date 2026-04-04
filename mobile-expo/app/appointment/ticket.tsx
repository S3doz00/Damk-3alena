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
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const BLOOD_COLORS: Record<string, string> = {
  "O-": "#C0392B", "O+": "#E74C3C", "A+": "#8E44AD",
  "A-": "#9B59B6", "B+": "#2980B9", "B-": "#3498DB",
  "AB+": "#16A085", "AB-": "#1ABC9C",
};

function TicketDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerCircleLeft} />
      <View style={styles.dividerDashes} />
      <View style={styles.dividerCircleRight} />
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Feather name={icon as any} size={14} color={Colors.light.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function AppointmentTicketScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { appointments, cancelAppointment, profile } = useApp();
  const insets = useSafeAreaInsets();
  const [cancelling, setCancelling] = useState(false);

  const appointment = appointments.find((a) => a.id === appointmentId);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  if (!appointment) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <Feather name="x-circle" size={48} color={Colors.light.textMuted} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.light.text, marginTop: 16 }}>Appointment not found</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.replace("/(tabs)")}>
          <Text style={{ color: Colors.light.primary, fontWeight: "600", fontSize: 16 }}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bloodColor = BLOOD_COLORS[appointment.bloodType] || Colors.light.primary;
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
      if (window.confirm("Are you sure you want to cancel this appointment?")) {
        doCancel();
      }
    } else {
      Alert.alert(
        "Cancel Appointment",
        "Are you sure you want to cancel this appointment?",
        [
          { text: "Keep it", style: "cancel" },
          { text: "Cancel Appointment", style: "destructive", onPress: doCancel },
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
      style={{ flex: 1, backgroundColor: "#F4F5F7" }}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: botPad + 40, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/(tabs)")}>
          <Feather name="home" size={20} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Appointment Ticket</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Success header */}
      {!isCancelled && (
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={28} color="#27AE60" />
          </View>
          <Text style={styles.successTitle}>Appointment Confirmed!</Text>
          <Text style={styles.successSubtitle}>Show this ticket at the hospital entrance</Text>
        </View>
      )}

      {/* Ticket */}
      <View style={[styles.ticket, isCancelled && { opacity: 0.7 }]}>
        {/* Cancelled overlay */}
        {isCancelled && (
          <View style={styles.cancelledOverlay}>
            <Text style={styles.cancelledStamp}>CANCELLED</Text>
          </View>
        )}

        {/* Header */}
        <View style={[styles.ticketHeader, { backgroundColor: bloodColor }]}>
          <View>
            <Text style={styles.ticketFileNum}>{appointment.fileNumber}</Text>
            <Text style={styles.ticketPatientLabel}>Patient File Number</Text>
          </View>
          <View style={[styles.bloodBadge, { borderColor: "rgba(255,255,255,0.4)" }]}>
            <Feather name="droplet" size={16} color="#fff" />
            <Text style={styles.bloodBadgeText}>{appointment.bloodType}</Text>
          </View>
        </View>

        {/* Hospital name strip */}
        <View style={styles.hospitalStrip}>
          <Feather name="map-pin" size={16} color={bloodColor} />
          <Text style={[styles.hospitalStripName, { color: bloodColor }]}>{appointment.hospitalName}</Text>
        </View>

        <TicketDivider />

        {/* Info rows */}
        <View style={styles.infoSection}>
          <InfoRow icon="calendar" label="Date" value={appointment.date} />
          <InfoRow icon="clock" label="Time" value={appointment.time} />
          <InfoRow icon="map-pin" label="Location" value={appointment.hospitalAddress} />
          <InfoRow icon="user" label="Donor" value={profile?.name || "Donor"} />
          <InfoRow icon="activity" label="Blood Type" value={appointment.bloodType} />
        </View>

        <TicketDivider />

        {/* QR Code */}
        <View style={styles.qrSection}>
          <Text style={styles.qrLabel}>Scan at Entrance</Text>
          <View style={styles.qrWrapper}>
            <QRCode
              value={qrData}
              size={160}
              color={Colors.light.text}
              backgroundColor="#fff"
            />
          </View>
          <Text style={styles.qrSubLabel}>Present this QR code at the hospital reception</Text>
        </View>

        {/* Footer */}
        <View style={styles.ticketFooter}>
          <Feather name="droplet" size={14} color={bloodColor} />
          <Text style={[styles.ticketFooterText, { color: bloodColor }]}>Damk 3alena — Blood Donation Platform</Text>
        </View>
      </View>

      {/* Reminder */}
      {!isCancelled && (
        <View style={styles.reminderCard}>
          <View style={styles.reminderIcon}><Feather name="info" size={16} color="#2980B9" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>Before You Arrive</Text>
            <Text style={styles.reminderText}>• Arrive 15 minutes early with your national ID{"\n"}• Drink 2–3 glasses of water before donating{"\n"}• Have a light meal at least 2 hours before{"\n"}• Avoid alcohol and smoking for 24 hours</Text>
          </View>
        </View>
      )}

      {/* Cancel button */}
      {!isCancelled && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel} disabled={cancelling} activeOpacity={0.75}
        >
          <Feather name="x-circle" size={18} color="#E74C3C" />
          <Text style={styles.cancelBtnText}>{cancelling ? "Cancelling..." : "Cancel Appointment"}</Text>
        </TouchableOpacity>
      )}

      {isCancelled && (
        <TouchableOpacity style={styles.rebookBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Feather name="refresh-cw" size={18} color="#fff" />
          <Text style={styles.rebookBtnText}>Book Another Appointment</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.light.card,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  screenTitle: { fontSize: 18, fontWeight: "700", color: Colors.light.text },
  successHeader: { alignItems: "center", marginBottom: 20 },
  successIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: "#D1FAE5",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  successTitle: { fontSize: 22, fontWeight: "800", color: Colors.light.text, marginBottom: 4 },
  successSubtitle: { fontSize: 14, color: Colors.light.textSecondary },
  ticket: {
    backgroundColor: "#fff", borderRadius: 24, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 18, elevation: 8, marginBottom: 20, position: "relative",
  },
  cancelledOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center", zIndex: 10, backgroundColor: "rgba(255,255,255,0.4)",
  },
  cancelledStamp: {
    fontSize: 40, fontWeight: "900", color: "#E74C3C", opacity: 0.6,
    transform: [{ rotate: "-25deg" }], borderWidth: 3, borderColor: "#E74C3C",
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6,
  },
  ticketHeader: { padding: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ticketFileNum: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  ticketPatientLabel: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "500", marginTop: 2 },
  bloodBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
  },
  bloodBadgeText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  hospitalStrip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F4F5F7",
  },
  hospitalStripName: { fontSize: 15, fontWeight: "700", flex: 1 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  dividerCircleLeft: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: "#F4F5F7",
    marginLeft: -12, borderWidth: 0,
  },
  dividerCircleRight: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: "#F4F5F7",
    marginRight: -12,
  },
  dividerDashes: {
    flex: 1, height: 1.5,
    borderBottomWidth: 2, borderStyle: "dashed", borderColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  infoSection: { paddingHorizontal: 22, paddingVertical: 16, gap: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#F4F5F7", alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, color: Colors.light.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  infoValue: { fontSize: 15, color: Colors.light.text, fontWeight: "600" },
  qrSection: { alignItems: "center", paddingVertical: 20, paddingHorizontal: 22, gap: 12 },
  qrLabel: { fontSize: 13, fontWeight: "700", color: Colors.light.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  qrWrapper: {
    padding: 16, borderRadius: 20, backgroundColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: Colors.light.separator,
  },
  qrSubLabel: { fontSize: 12, color: Colors.light.textMuted, textAlign: "center" },
  ticketFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#F9FAFB", padding: 14, borderTopWidth: 1, borderTopColor: "#F4F5F7",
  },
  ticketFooterText: { fontSize: 12, fontWeight: "600" },
  reminderCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    backgroundColor: "#EFF6FF", borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: "#BFDBFE", marginBottom: 16,
  },
  reminderIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  reminderTitle: { fontSize: 14, fontWeight: "700", color: "#1E40AF", marginBottom: 8 },
  reminderText: { fontSize: 13, color: "#3B82F6", lineHeight: 22 },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16,
    borderWidth: 2, borderColor: "#E74C3C", backgroundColor: "#FEE2E2",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: "#E74C3C" },
  rebookBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: Colors.light.primary,
  },
  rebookBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
