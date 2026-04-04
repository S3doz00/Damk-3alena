import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HospitalCard from "@/components/HospitalCard";
import { useTheme } from "@/context/ThemeContext";
import { Hospital } from "@/constants/hospitals";
import { useHospitals } from "@/lib/hooks";

const FILTERS = ["All", "Critical", "Nearby", "Open Now"];

export default function HospitalsScreen() {
  const insets = useSafeAreaInsets();
  const { hospitals } = useHospitals();
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase());

    if (filter === "Critical") {
      return matchesSearch && h.bloodNeeds.some((n) => n.level === "critical");
    }
    if (filter === "Nearby") {
      return matchesSearch && h.distance <= 4;
    }
    return matchesSearch;
  }).sort((a, b) => {
    if (filter === "Nearby") return a.distance - b.distance;
    return 0;
  });

  const handlePress = (h: Hospital) => {
    router.push({ pathname: "/hospital/[id]", params: { id: h.id } });
  };

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
      marginBottom: 16,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      marginBottom: 14,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: "#fff",
    },
    list: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    empty: {
      alignItems: "center",
      paddingTop: 60,
      gap: 10,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.title}>Blood Banks & Hospitals</Text>
        <Text style={styles.subtitle}>
          {hospitals.length} centers near you in Amman
        </Text>

        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                filter === f && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(h) => h.id}
        renderItem={({ item }) => (
          <HospitalCard hospital={item} onPress={handlePress} />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: botPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="map-pin" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hospitals found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search</Text>
          </View>
        }
      />
    </View>
  );
}
