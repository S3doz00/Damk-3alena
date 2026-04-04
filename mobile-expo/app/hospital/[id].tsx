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
import { useHospitals } from "@/lib/hooks";
import { Appointment, useApp } from "@/context/AppContext";

const LEVEL_MAP: Record<string, "low" | "medium" | "high" | "critical"> = {
  critical: "critical",
  low: "high",
  moderate: "medium",
  adequate: "low",
};

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, addAppointment } = useApp();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const { hospitals } = useHospitals();
  const hospital = hospitals.find((h) => h.id === id);

  if (!hospital) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Hospital not found</Text>
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
      fileNumber: `#${Math.floor(100000 + Math.random() * 900000)}`,
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

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: topPad + 8,
        paddingBottom: botPad + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Feather name="activity" size={22} color={Colors.light.primary} />
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.hospitalName}>{hospital.name}</Text>
        <View style={styles.infoRow}>
          <Feather
            name="map-pin"
            size={15}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.infoText}>{hospital.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="clock" size={15} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>{hospital.openHours}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="phone" size={15} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>{hospital.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather
            name="navigation"
            size={15}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.infoText}>{hospital.distance} km away</Text>
        </View>
      </View>

      {/* Blood Needs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Blood Needs</Text>
        {hospital.bloodNeeds.map((need, i) => (
          <View key={i} style={styles.needRow}>
            <View style={styles.needType}>
              <Text style={styles.needTypeText}>{need.type}</Text>
            </View>
            <View style={styles.needLevel}>
              <UrgencyBadge urgency={LEVEL_MAP[need.level]} label={need.level.toUpperCase()} />
            </View>
            <View style={styles.needBar}>
              <View
                style={[
                  styles.needBarFill,
                  {
                    width:
                      need.level === "critical"
                        ? "15%"
                        : need.level === "low"
                        ? "35%"
                        : need.level === "moderate"
                        ? "60%"
                        : "85%",
                    backgroundColor:
                      need.level === "critical"
                        ? Colors.light.danger
                        : need.level === "low"
                        ? Colors.light.warning
                        : need.level === "moderate"
                        ? "#3498DB"
                        : Colors.light.success,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Book Appointment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Book Appointment</Text>

        <Text style={styles.subLabel}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DATES.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.dateChip,
                selectedDate === d && styles.dateChipActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedDate(d);
              }}
            >
              <Text
                style={[
                  styles.dateChipText,
                  selectedDate === d && styles.dateChipTextActive,
                ]}
              >
                {formatDateLabel(d)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.subLabel, { marginTop: 20 }]}>
          Select Time
        </Text>
        <View style={styles.timeGrid}>
          {hospital.availableSlots.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.timeChip,
                selectedTime === t && styles.timeChipActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedTime(t);
              }}
            >
              <Text
                style={[
                  styles.timeChipText,
                  selectedTime === t && styles.timeChipTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.reminderBanner}>
          <Feather name="alert-circle" size={16} color={Colors.light.primary} />
          <Text style={styles.reminderText}>
            Please fast for 4 hours before donating. Stay hydrated and get
            enough sleep.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.bookBtn,
            (!selectedDate || !selectedTime) && styles.bookBtnDisabled,
          ]}
          onPress={handleBook}
          disabled={booking || !selectedDate || !selectedTime}
          activeOpacity={0.85}
        >
          <Feather name="calendar" size={20} color="#fff" />
          <Text style={styles.bookBtnText}>
            {booking ? "Booking..." : "Confirm Appointment"}
          </Text>
        </TouchableOpacity>
      </View>
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
  notFoundText: {
    fontSize: 18,
    color: Colors.light.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  hospitalName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
  },
  needRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  needType: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  needTypeText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.light.primary,
  },
  needLevel: {
    width: 90,
  },
  needBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.separator,
    borderRadius: 4,
    overflow: "hidden",
  },
  needBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.card,
    marginRight: 10,
  },
  dateChipActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  dateChipTextActive: {
    color: "#fff",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.card,
  },
  timeChipActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  timeChipTextActive: {
    color: "#fff",
  },
  reminderBanner: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FEF2F2",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  reminderText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.primaryDark,
    lineHeight: 18,
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  bookBtnDisabled: {
    backgroundColor: Colors.light.inputBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
