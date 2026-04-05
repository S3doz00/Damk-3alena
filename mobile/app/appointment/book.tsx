import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Facility, generateAppointmentFileNumber, useApp } from "@/context/AppContext";

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

function CalendarPicker({ selected, onSelect, colors }: { selected: Date | null; onSelect: (d: Date) => void; colors: any }) {
  const dates = getAvailableDates();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {dates.map((d, i) => {
        const isSelected = selected?.toDateString() === d.toDateString();
        return (
          <TouchableOpacity
            key={i}
            style={{
              width: 62, paddingVertical: 12, borderRadius: 16, alignItems: "center",
              backgroundColor: isSelected ? colors.primary : colors.inputBg,
              borderWidth: 1.5, borderColor: isSelected ? colors.primary : colors.inputBorder, gap: 2,
            }}
            onPress={() => { onSelect(d); Haptics.selectionAsync(); }}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: isSelected ? "rgba(255,255,255,0.8)" : colors.textMuted, textTransform: "uppercase" }}>{DAYS[d.getDay()]}</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: isSelected ? "#fff" : colors.text }}>{d.getDate()}</Text>
            <Text style={{ fontSize: 11, color: isSelected ? "rgba(255,255,255,0.8)" : colors.textMuted, fontWeight: "500" }}>{MONTHS[d.getMonth()]}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function TimeSlotPicker({ slots, selected, onSelect, colors }: { slots: string[]; selected: string | null; onSelect: (t: string) => void; colors: any }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {slots.map((slot) => (
        <TouchableOpacity
          key={slot}
          style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
            backgroundColor: selected === slot ? colors.primary : colors.inputBg,
            borderWidth: 1.5, borderColor: selected === slot ? colors.primary : colors.inputBorder,
          }}
          onPress={() => { onSelect(slot); Haptics.selectionAsync(); }}
        >
          <Feather name="clock" size={13} color={selected === slot ? "#fff" : colors.textSecondary} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: selected === slot ? "#fff" : colors.textSecondary }}>{slot}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function HospitalHeader({ hospital, colors }: { hospital: Facility; colors: any }) {
  const hasCritical = hospital.bloodNeeds.some((n) => n.level === "critical");
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: colors.separator }}>
      {/* Banner with hospital icon */}
      <View style={{ height: 120, alignItems: "center", justifyContent: "center", position: "relative", backgroundColor: hasCritical ? "#FEF2F2" : "#F0FDF4" }}>
        <View style={{
          width: 70, height: 70, borderRadius: 20, backgroundColor: colors.card,
          alignItems: "center", justifyContent: "center",
          shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
        }}>
          <Feather name="home" size={32} color={hasCritical ? colors.primary : "#16A085"} />
        </View>
        <View style={{ position: "absolute", right: 20, bottom: 20 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{
              position: "absolute", width: 80 + i * 50, height: 80 + i * 50,
              borderRadius: 100, borderWidth: 1,
              borderColor: hasCritical ? colors.primary + "20" : "#16A08520",
              right: -(i * 25), bottom: -(i * 25),
            }} />
          ))}
        </View>
      </View>
      <View style={{ padding: 18, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: -0.3, marginBottom: 4 }}>{hospital.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="map-pin" size={13} color={colors.textMuted} />
          <Text style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }}>{hospital.address}</Text>
        </View>
        {hospital.phone ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="phone" size={13} color={colors.textMuted} />
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>{hospital.phone}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="clock" size={13} color={colors.textMuted} />
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>{hospital.workingHours}</Text>
        </View>
        {hasCritical && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF2F2", borderRadius: 8, padding: 10, marginTop: 4 }}>
            <Feather name="alert-circle" size={12} color={colors.primary} />
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "500", flex: 1 }}>Critical blood shortage — urgent donation needed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function BookAppointmentScreen() {
  const { hospitalId } = useLocalSearchParams<{ hospitalId: string }>();
  const { addAppointment, profile, facilities } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const hospital = facilities.find((f) => f.id === hospitalId);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  if (!hospital) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Feather name="x-circle" size={48} color={colors.textMuted} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 16 }}>Hospital not found.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBook = async () => {
    if (!selectedDate) { setError("Please select a date."); return; }
    if (!selectedTime) { setError("Please select a time slot."); return; }
    setError("");
    setLoading(true);
    Haptics.selectionAsync();

    const formatDate = (d: Date) =>
      `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

    const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 6);
    const fileNumber = generateAppointmentFileNumber();

    const actualId = await addAppointment({
      id: tempId,
      fileNumber,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hospitalAddress: hospital.address,
      date: formatDate(selectedDate),
      time: selectedTime,
      status: "upcoming",
      bloodType: profile?.bloodType || "O+",
    });

    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/appointment/ticket", params: { appointmentId: actualId } });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 }}>
        <TouchableOpacity
          style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 }}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Book Appointment</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Hospital card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <HospitalHeader hospital={hospital} colors={colors} />
      </View>

      {/* Date */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
            <Feather name="calendar" size={16} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Select Date</Text>
        </View>
        <CalendarPicker selected={selectedDate} onSelect={setSelectedDate} colors={colors} />
        {selectedDate && (
          <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600", marginTop: 12 }}>
            Selected: {DAYS[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
        )}
      </View>

      {/* Time */}
      {selectedDate && (
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
              <Feather name="clock" size={16} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Available Time Slots</Text>
          </View>
          <TimeSlotPicker slots={["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"]} selected={selectedTime} onSelect={setSelectedTime} colors={colors} />
        </View>
      )}

      {/* Donor note */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
            <Feather name="edit-2" size={16} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Note (Optional)</Text>
        </View>
        <TextInput
          style={{
            backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.inputBorder,
            borderRadius: 14, padding: 14, fontSize: 14, color: colors.text, minHeight: 80,
          }}
          placeholder="Any special notes for the hospital..."
          placeholderTextColor={colors.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Important notice */}
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#EFF6FF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#BFDBFE" }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
            <Feather name="info" size={16} color="#2980B9" />
          </View>
          <Text style={{ flex: 1, fontSize: 13, color: "#1E40AF", lineHeight: 20 }}>
            Please arrive <Text style={{ fontWeight: "700" }}>15 minutes early</Text> with your national ID. Drink plenty of water and have a light meal before donating. Avoid alcohol and smoking 24 hours before.
          </Text>
        </View>
      </View>

      {/* Error */}
      {error.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12 }}>
            <Feather name="alert-circle" size={14} color="#991B1B" />
            <Text style={{ flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "500" }}>{error}</Text>
          </View>
        </View>
      )}

      {/* Book button */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <TouchableOpacity
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            backgroundColor: colors.primary, paddingVertical: 17, borderRadius: 18, gap: 10,
            shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35, shadowRadius: 12, elevation: 7,
            opacity: loading ? 0.8 : 1,
          }}
          onPress={handleBook} disabled={loading} activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>Confirm Appointment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
