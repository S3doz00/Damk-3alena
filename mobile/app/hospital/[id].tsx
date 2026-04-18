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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import GlassCard from "@/components/GlassCard";
import { Fonts } from "@/constants/fonts";
import { useTheme } from "@/context/ThemeContext";
import { Appointment, useApp } from "@/context/AppContext";

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, addAppointment, facilities } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const hospital = facilities.find((f) => f.id === id);

  if (!hospital) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ fontSize: 18, color: colors.textSecondary }}>Hospital not found</Text>
      </View>
    );
  }

  const DATES = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split("T")[0];
  });

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Select Date & Time", "Please choose a date and time slot.");
      return;
    }
    if (!profile?.bloodType) {
      Alert.alert(
        "Blood Type Required",
        "Please set your blood type in your profile before booking."
      );
      return;
    }

    setBooking(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const appointment: Appointment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      fileNumber: `#${Date.now().toString(36).toUpperCase().slice(-6)}`,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hospitalAddress: hospital.address,
      date: selectedDate,
      time: selectedTime,
      status: "upcoming",
      bloodType: profile.bloodType,
    };

    await addAppointment(appointment);
    setBooking(false);

    Alert.alert(
      "Appointment Confirmed!",
      `Your appointment at ${hospital.name} is set for ${formatDateLabel(selectedDate)} at ${selectedTime}. Please arrive 10 minutes early.`,
      [{ text: "Great!", onPress: () => router.back() }]
    );
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: botPad + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity
          style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
          <Feather name="activity" size={22} color={colors.primary} />
        </View>
      </View>

      {/* Info Card */}
      <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
        <GlassCard glowColor={colors.primary} borderRadius={16}>
          <View style={{ padding: 20 }}>
            <Text style={{ fontFamily: Fonts.extrabold, fontSize: 20, color: colors.text, marginBottom: 14, letterSpacing: -0.4 }}>{hospital.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Feather name="map-pin" size={15} color={colors.textSecondary} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: colors.textSecondary, flex: 1 }}>{hospital.address}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Feather name="clock" size={15} color={colors.textSecondary} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: colors.textSecondary, flex: 1 }}>{hospital.workingHours}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather name="navigation" size={15} color={colors.textSecondary} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: colors.textSecondary, flex: 1 }}>{hospital.city}, Jordan</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Book Appointment */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 18, color: colors.text, marginBottom: 16, letterSpacing: -0.3 }}>Book Appointment</Text>

        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 12 }}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DATES.map((d) => (
            <TouchableOpacity
              key={d}
              style={{
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, marginRight: 10,
                borderColor: selectedDate === d ? colors.primary : colors.inputBorder,
                backgroundColor: selectedDate === d ? colors.primary : colors.card,
              }}
              onPress={() => { Haptics.selectionAsync(); setSelectedDate(d); }}
            >
              <Text style={{ fontFamily: Fonts.semibold, fontSize: 14, color: selectedDate === d ? "#fff" : colors.text }}>
                {formatDateLabel(d)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={{ fontFamily: Fonts.extrabold, fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 12, marginTop: 20 }}>
          Select Time
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"].map((t) => (
            <TouchableOpacity
              key={t}
              style={{
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
                borderColor: selectedTime === t ? colors.primary : colors.inputBorder,
                backgroundColor: selectedTime === t ? colors.primary : colors.card,
              }}
              onPress={() => { Haptics.selectionAsync(); setSelectedTime(t); }}
            >
              <Text style={{ fontFamily: Fonts.semibold, fontSize: 14, color: selectedTime === t ? "#fff" : colors.text }}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 10, backgroundColor: "#FEF2F2", padding: 14, borderRadius: 12, marginTop: 20, marginBottom: 20 }}>
          <Feather name="alert-circle" size={16} color={colors.primary} />
          <Text style={{ flex: 1, fontFamily: Fonts.medium, fontSize: 13, color: Colors.light.primaryDark, lineHeight: 18 }}>
            Please fast for 4 hours before donating. Stay hydrated and get enough sleep.
          </Text>
        </View>

        <TouchableOpacity
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: 16, gap: 10,
            backgroundColor: (!selectedDate || !selectedTime) ? colors.inputBorder : colors.primary,
            shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: (!selectedDate || !selectedTime) ? 0 : 0.35, shadowRadius: 10, elevation: (!selectedDate || !selectedTime) ? 0 : 6,
          }}
          onPress={handleBook}
          disabled={booking || !selectedDate || !selectedTime}
          activeOpacity={0.85}
        >
          <Feather name="calendar" size={20} color="#fff" />
          <Text style={{ fontFamily: Fonts.bold, color: "#fff", fontSize: 17, letterSpacing: 0.2 }}>
            {booking ? "Booking..." : "Confirm Appointment"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
