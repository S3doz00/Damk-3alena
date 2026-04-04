import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { Hospital } from "@/constants/hospitals";
import { useHospitals } from "@/lib/hooks";
import { generateAppointmentFileNumber, useApp } from "@/context/AppContext";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getAvailableDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 28; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 5) dates.push(d); // skip Friday
  }
  return dates.slice(0, 14);
}

function CalendarPicker({ selected, onSelect }: { selected: Date | null; onSelect: (d: Date) => void }) {
  const dates = getAvailableDates();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {dates.map((d, i) => {
        const isSelected = selected?.toDateString() === d.toDateString();
        return (
          <TouchableOpacity
            key={i}
            style={[styles.dateChip, isSelected && styles.dateChipActive]}
            onPress={() => { onSelect(d); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.dateDayName, isSelected && styles.dateDayNameActive]}>{DAYS[d.getDay()]}</Text>
            <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>{d.getDate()}</Text>
            <Text style={[styles.dateMon, isSelected && styles.dateMonActive]}>{MONTHS[d.getMonth()]}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function TimeSlotPicker({ slots, selected, onSelect }: { slots: string[]; selected: string | null; onSelect: (t: string) => void }) {
  return (
    <View style={styles.slotsGrid}>
      {slots.map((slot) => (
        <TouchableOpacity
          key={slot}
          style={[styles.slotChip, selected === slot && styles.slotChipActive]}
          onPress={() => { onSelect(slot); Haptics.selectionAsync(); }}
        >
          <Feather name="clock" size={13} color={selected === slot ? "#fff" : Colors.light.textSecondary} />
          <Text style={[styles.slotText, selected === slot && styles.slotTextActive]}>{slot}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function HospitalHeader({ hospital }: { hospital: Hospital }) {
  const hasCritical = hospital.bloodNeeds.some((n) => n.level === "critical");
  return (
    <View style={styles.hospitalHeaderCard}>
      {/* Gradient-style banner */}
      <View style={[styles.hospitalBanner, { backgroundColor: hasCritical ? "#FEF2F2" : "#F0FDF4" }]}>
        <View style={styles.hospitalBannerIcon}>
          <Feather name="cross" size={32} color={hasCritical ? Colors.light.primary : "#16A085"} />
        </View>
        <View style={{ position: "absolute", right: 20, bottom: 20 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{
              position: "absolute", width: 80 + i * 50, height: 80 + i * 50,
              borderRadius: 100, borderWidth: 1,
              borderColor: hasCritical ? Colors.light.primary + "20" : "#16A08520",
              right: -(i * 25), bottom: -(i * 25),
            }} />
          ))}
        </View>
      </View>
      <View style={styles.hospitalInfo}>
        <Text style={styles.hospitalName}>{hospital.name}</Text>
        <View style={styles.hospitalMetaRow}>
          <Feather name="map-pin" size={13} color={Colors.light.textMuted} />
          <Text style={styles.hospitalMeta}>{hospital.address}</Text>
        </View>
        <View style={styles.hospitalMetaRow}>
          <Feather name="phone" size={13} color={Colors.light.textMuted} />
          <Text style={styles.hospitalMeta}>{hospital.phone}</Text>
        </View>
        <View style={styles.hospitalMetaRow}>
          <Feather name="clock" size={13} color={Colors.light.textMuted} />
          <Text style={styles.hospitalMeta}>{hospital.openHours}</Text>
        </View>
        {hasCritical && (
          <View style={styles.criticalNote}>
            <Feather name="alert-circle" size={12} color={Colors.light.primary} />
            <Text style={styles.criticalNoteText}>Critical blood shortage — urgent donation needed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function BookAppointmentScreen() {
  const { hospitalId } = useLocalSearchParams<{ hospitalId: string }>();
  const { addAppointment, profile } = useApp();
  const { hospitals } = useHospitals();
  const insets = useSafeAreaInsets();

  const hospital = hospitals.find((h) => h.id === hospitalId);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  if (!hospital) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Hospital not found.</Text>
      </View>
    );
  }

  const handleBook = async () => {
    if (!selectedDate) { setError("Please select a date."); return; }
    if (!selectedTime) { setError("Please select a time slot."); return; }
    setError("");
    setLoading(true);
    Haptics.selectionAsync();

    // ISO date for Supabase (YYYY-MM-DD)
    const isoDate = selectedDate.toISOString().split("T")[0];
    const displayDate = `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

    const appointmentId = Date.now().toString() + Math.random().toString(36).substr(2, 6);
    const fileNumber = generateAppointmentFileNumber();

    await addAppointment({
      id: appointmentId,
      fileNumber,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hospitalAddress: hospital.address,
      date: isoDate,
      time: selectedTime,
      status: "upcoming",
      bloodType: profile?.bloodType || "O+",
      notes: note || undefined,
    });

    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/appointment/ticket", params: { appointmentId } });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Book Appointment</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Hospital card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <HospitalHeader hospital={hospital} />
      </View>

      {/* Date */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}><Feather name="calendar" size={16} color={Colors.light.primary} /></View>
          <Text style={styles.sectionTitle}>Select Date</Text>
        </View>
        <CalendarPicker selected={selectedDate} onSelect={setSelectedDate} />
        {selectedDate && (
          <Text style={styles.selectedInfo}>
            Selected: {DAYS[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
        )}
      </View>

      {/* Time */}
      {selectedDate && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}><Feather name="clock" size={16} color={Colors.light.primary} /></View>
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
          </View>
          <TimeSlotPicker slots={hospital.availableSlots} selected={selectedTime} onSelect={setSelectedTime} />
        </View>
      )}

      {/* Donor note */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}><Feather name="edit-2" size={16} color={Colors.light.primary} /></View>
          <Text style={styles.sectionTitle}>Note (Optional)</Text>
        </View>
        <TextInput
          style={styles.noteInput}
          placeholder="Any special notes for the hospital..."
          placeholderTextColor={Colors.light.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Important notice */}
      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.notice}>
          <View style={styles.noticeIcon}><Feather name="info" size={16} color="#2980B9" /></View>
          <Text style={styles.noticeText}>
            Please arrive <Text style={{ fontWeight: "700" }}>15 minutes early</Text> with your national ID. Drink plenty of water and have a light meal before donating. Avoid alcohol and smoking 24 hours before.
          </Text>
        </View>
      </View>

      {/* Error */}
      {error.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color="#991B1B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      )}

      {/* Book button */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <TouchableOpacity
          style={[styles.bookBtn, loading && { opacity: 0.8 }]}
          onPress={handleBook} disabled={loading} activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={styles.bookBtnText}>Confirm Appointment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.light.card,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  screenTitle: { fontSize: 18, fontWeight: "700", color: Colors.light.text },
  hospitalHeaderCard: {
    backgroundColor: Colors.light.card, borderRadius: 20, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: Colors.light.separator,
  },
  hospitalBanner: { height: 120, alignItems: "center", justifyContent: "center", position: "relative" },
  hospitalBannerIcon: {
    width: 70, height: 70, borderRadius: 20, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  hospitalInfo: { padding: 18, gap: 8 },
  hospitalName: { fontSize: 18, fontWeight: "800", color: Colors.light.text, letterSpacing: -0.3, marginBottom: 4 },
  hospitalMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hospitalMeta: { fontSize: 13, color: Colors.light.textSecondary, flex: 1 },
  criticalNote: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FEF2F2", borderRadius: 8, padding: 10, marginTop: 4,
  },
  criticalNoteText: { fontSize: 12, color: Colors.light.primary, fontWeight: "500", flex: 1 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "#FEF2F2",
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.light.text },
  dateChip: {
    width: 62, paddingVertical: 12, borderRadius: 16, alignItems: "center",
    backgroundColor: Colors.light.inputBg, borderWidth: 1.5, borderColor: Colors.light.inputBorder, gap: 2,
  },
  dateChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  dateDayName: { fontSize: 11, fontWeight: "600", color: Colors.light.textMuted, textTransform: "uppercase" },
  dateDayNameActive: { color: "rgba(255,255,255,0.8)" },
  dateNum: { fontSize: 22, fontWeight: "800", color: Colors.light.text },
  dateNumActive: { color: "#fff" },
  dateMon: { fontSize: 11, color: Colors.light.textMuted, fontWeight: "500" },
  dateMonActive: { color: "rgba(255,255,255,0.8)" },
  selectedInfo: { fontSize: 13, color: Colors.light.primary, fontWeight: "600", marginTop: 12 },
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.light.inputBg, borderWidth: 1.5, borderColor: Colors.light.inputBorder,
  },
  slotChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  slotText: { fontSize: 14, fontWeight: "600", color: Colors.light.textSecondary },
  slotTextActive: { color: "#fff" },
  noteInput: {
    backgroundColor: Colors.light.inputBg, borderWidth: 1.5, borderColor: Colors.light.inputBorder,
    borderRadius: 14, padding: 14, fontSize: 14, color: Colors.light.text, minHeight: 80,
  },
  notice: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: "#EFF6FF", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#BFDBFE",
  },
  noticeIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "#DBEAFE",
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  noticeText: { flex: 1, fontSize: 13, color: "#1E40AF", lineHeight: 20 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" },
  bookBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.light.primary, paddingVertical: 17, borderRadius: 18, gap: 10,
    shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 7,
  },
  bookBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
