import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useApp, Facility } from "@/context/AppContext";

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
let Callout: any = null;
if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
    Callout = maps.Callout;
  } catch {}
}

const LEVEL_COLORS = {
  critical: "#C0392B",
  low: "#E67E22",
  moderate: "#F39C12",
  adequate: "#27AE60",
};

const LEVEL_LABEL_KEYS = {
  critical: "levelCritical",
  low: "levelLow",
  moderate: "levelModerate",
  adequate: "levelAdequate",
};

function BloodNeedDot({ level }: { level: keyof typeof LEVEL_COLORS }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LEVEL_COLORS[level] }} />
    </View>
  );
}

function HospitalMapCard({ facility, onDonate, colors }: { facility: Facility; onDonate: () => void; colors: any }) {
  const { t } = useLanguage();
  const criticalNeeds = facility.bloodNeeds.filter((n) => n.level === "critical");
  const hasCritical = criticalNeeds.length > 0;

  const openInGoogleMaps = () => {
    const googleMapsUrl = Platform.select({
      ios: `comgooglemaps://?daddr=${facility.latitude},${facility.longitude}&directionsmode=driving`,
      android: `google.navigation:q=${facility.latitude},${facility.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`,
    });
    Linking.openURL(googleMapsUrl || "").catch(() => {
      // Fallback to Google Maps web if app not installed
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;
      Linking.openURL(webUrl);
    });
  };

  return (
    <TouchableOpacity
      style={[styles.mapCard, { backgroundColor: colors.card, borderColor: colors.separator }]}
      onPress={() => router.push({ pathname: "/hospital/[id]", params: { id: facility.id } })}
      activeOpacity={0.85}
    >
      {hasCritical && (
        <View style={[styles.criticalBadge, { backgroundColor: colors.primary }]}>
          <Feather name="alert-circle" size={11} color="#fff" />
          <Text style={styles.criticalBadgeText}>{t('criticalNeedBadge')}</Text>
        </View>
      )}
      <View style={styles.mapCardRow}>
        <View style={[styles.mapCardPin, { backgroundColor: hasCritical ? "#FEF2F2" : colors.inputBg }]}>
          <Feather name="map-pin" size={20} color={hasCritical ? colors.primary : colors.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.hospitalName, { color: colors.text }]} numberOfLines={1}>{facility.name}</Text>
          <Text style={[styles.hospitalAddress, { color: colors.textSecondary }]} numberOfLines={1}>{facility.address}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{facility.city}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{facility.workingHours}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.needsRow}>
        {facility.bloodNeeds.slice(0, 4).map((n, i) => (
          <View key={i} style={[styles.needChip, { backgroundColor: colors.inputBg, borderColor: LEVEL_COLORS[n.level] + "40" }]}>
            <BloodNeedDot level={n.level} />
            <Text style={[styles.needType, { color: LEVEL_COLORS[n.level] }]}>{n.type}</Text>
          </View>
        ))}
        {facility.bloodNeeds.length > 4 && (
          <View style={[styles.needChipMore, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Text style={[styles.needChipMoreText, { color: colors.textMuted }]}>+{facility.bloodNeeds.length - 4}</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          style={[styles.mapsBtn, { borderColor: colors.primary }]}
          onPress={openInGoogleMaps}
          activeOpacity={0.85}
        >
          <Feather name="navigation" size={15} color={colors.primary} />
          <Text style={[styles.mapsBtnText, { color: colors.primary }]}>{t('directions')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.donateBtn, { backgroundColor: colors.primary, flex: 1 }]}
          onPress={onDonate}
          activeOpacity={0.85}
        >
          <Feather name="droplet" size={16} color="#fff" />
          <Text style={styles.donateBtnText}>{t('donateHere')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function NativeMap({ facilities, colors, theme }: { facilities: Facility[]; colors: any; theme: string }) {
  if (!MapView) return null;

  // Calculate center from all facilities
  const avgLat = facilities.length > 0
    ? facilities.reduce((sum, f) => sum + f.latitude, 0) / facilities.length
    : 31.9539;
  const avgLng = facilities.length > 0
    ? facilities.reduce((sum, f) => sum + f.longitude, 0) / facilities.length
    : 35.9106;

  // Calculate delta to fit all markers
  const lats = facilities.map((f) => f.latitude);
  const lngs = facilities.map((f) => f.longitude);
  const latDelta = facilities.length > 1
    ? (Math.max(...lats) - Math.min(...lats)) * 1.5 + 0.05
    : 0.15;
  const lngDelta = facilities.length > 1
    ? (Math.max(...lngs) - Math.min(...lngs)) * 1.5 + 0.05
    : 0.15;

  return (
    <MapView
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: avgLat,
        longitude: avgLng,
        latitudeDelta: Math.max(latDelta, 0.05),
        longitudeDelta: Math.max(lngDelta, 0.05),
      }}
      zoomEnabled
      scrollEnabled
      pitchEnabled
      rotateEnabled
      showsUserLocation
      showsMyLocationButton
      customMapStyle={theme === "dark" ? DARK_MAP_STYLE : undefined}
    >
      {facilities.map((f) => {
        const hasCritical = f.bloodNeeds.some((n) => n.level === "critical");
        return (
          <Marker
            key={f.id}
            coordinate={{ latitude: f.latitude, longitude: f.longitude }}
            title={f.name}
            description={`${f.city} · ${f.workingHours}`}
            pinColor={hasCritical ? "#C0392B" : "#27AE60"}
          />
        );
      })}
    </MapView>
  );
}

function WebMapBanner({ facilities, colors, theme }: { facilities: Facility[]; colors: any; theme: string }) {
  if (facilities.length === 0) return null;

  const avgLat = facilities.reduce((sum, f) => sum + f.latitude, 0) / facilities.length;
  const avgLng = facilities.reduce((sum, f) => sum + f.longitude, 0) / facilities.length;

  const markersJSON = JSON.stringify(
    facilities.map((f) => ({
      lat: f.latitude,
      lng: f.longitude,
      name: f.name,
      critical: f.bloodNeeds.some((n) => n.level === "critical"),
    }))
  );

  const isDark = theme === "dark";

  const html = `
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>html,body,#map{width:100%;height:100%;margin:0;padding:0;}</style>
</head><body>
<div id="map"></div>
<script>
function initMap(){
  const markers = ${markersJSON};
  const darkStyle = ${isDark ? `[
    {elementType:"geometry",stylers:[{color:"#242f3e"}]},
    {elementType:"labels.text.stroke",stylers:[{color:"#242f3e"}]},
    {elementType:"labels.text.fill",stylers:[{color:"#746855"}]},
    {featureType:"road",elementType:"geometry",stylers:[{color:"#38414e"}]},
    {featureType:"water",elementType:"geometry",stylers:[{color:"#17263c"}]},
  ]` : "[]"};
  const map = new google.maps.Map(document.getElementById("map"),{
    center:{lat:${avgLat},lng:${avgLng}},
    zoom:9,
    styles:darkStyle,
    disableDefaultUI:false,
    zoomControl:true,
    mapTypeControl:false,
    streetViewControl:false,
    fullscreenControl:false,
  });
  markers.forEach(m=>{
    const marker = new google.maps.Marker({
      position:{lat:m.lat,lng:m.lng},
      map:map,
      title:m.name,
      icon:{
        path:google.maps.SymbolPath.CIRCLE,
        fillColor:m.critical?"#C0392B":"#27AE60",
        fillOpacity:1,
        strokeColor:"#fff",
        strokeWeight:2,
        scale:8,
      }
    });
    const info = new google.maps.InfoWindow({content:'<b>'+m.name+'</b>'});
    marker.addListener('click',()=>info.open(map,marker));
  });
}
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCUwCHZGcgaThPEHwXyJNFh2_ts2h2gfUI&callback=initMap"></script>
</body></html>`;

  // Use WebView on native, iframe on web
  if (Platform.OS === "web") {
    return (
      <View style={[styles.mapBannerWeb, { backgroundColor: colors.inputBg, borderColor: colors.separator }]}>
        <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
          <Text style={{ textAlign: "center", padding: 20, color: colors.textSecondary }}>Map available on mobile</Text>
        </View>
      </View>
    );
  }

  // Assuming WebView is imported at the top of the file
  return (
    <View style={[styles.mapBannerWeb, { backgroundColor: colors.inputBg, borderColor: colors.separator }]}>
      <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
        <WebView
          source={{ html }}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />
      </View>
    </View>
  );
}

// Dark mode map style for Google Maps
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
];

export default function MapsScreen() {
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const { facilities } = useApp();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "critical" | "hospital" | "blood_bank">("all");
  const [showFullMap, setShowFullMap] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.city.toLowerCase().includes(search.toLowerCase());
      if (filter === "critical") return matchSearch && f.bloodNeeds.some((n) => n.level === "critical");
      if (filter === "hospital") return matchSearch && f.type === "hospital";
      if (filter === "blood_bank") return matchSearch && f.type === "blood_bank";
      return matchSearch;
    });
  }, [facilities, search, filter]);

  const handleDonate = (facility: Facility) => {
    router.push({ pathname: "/appointment/book", params: { hospitalId: facility.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(f) => f.id}
        ListHeaderComponent={
          <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20 }}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>{t('bloodBanks')}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{filtered.length} {t('locationsInJordan')}</Text>
              </View>
              <TouchableOpacity
                style={[styles.headerIcon, { backgroundColor: "#FEF2F2" }]}
                onPress={() => setShowFullMap(!showFullMap)}
              >
                <Feather name={showFullMap ? "list" : "map"} size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {showFullMap ? (
              <View style={[styles.mapBannerNative, { borderColor: colors.separator }]}>
                {Platform.OS !== "web" ? (
                  <NativeMap facilities={filtered} colors={colors} theme={theme} />
                ) : (
                  <WebMapBanner facilities={filtered} colors={colors} theme={theme} />
                )}
              </View>
            ) : (
              Platform.OS !== "web" ? (
                <View style={[styles.mapBannerWeb, { backgroundColor: colors.inputBg, borderColor: colors.separator }]}>
                  <NativeMap facilities={filtered} colors={colors} theme={theme} />
                </View>
              ) : (
                <WebMapBanner facilities={filtered} colors={colors} theme={theme} />
              )
            )}

            <View style={[styles.searchWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Feather name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('searchHospitals')}
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Feather name="x" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filterRow}>
              {(["all", "critical", "hospital", "blood_bank"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterBtn,
                    { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                    filter === f && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterText, { color: colors.textSecondary }, filter === f && { color: "#fff" }]}>
                    {f === "all" ? t('filterAll') : f === "critical" ? t('filterCriticalMap') : f === "hospital" ? t('filterHospitals') : t('filterBloodBanks')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.legend}>
              {(Object.entries(LEVEL_COLORS) as [keyof typeof LEVEL_COLORS, string][]).map(([level, color]) => (
                <View key={level} style={styles.legendItem}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>{t(LEVEL_LABEL_KEYS[level])}</Text>
                </View>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
            <HospitalMapCard facility={item} onDonate={() => handleDonate(item)} colors={colors} />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 20, paddingVertical: 40, alignItems: "center" }}>
            <Feather name="search" size={40} color={colors.textMuted} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 12 }}>{t('noResults')}</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
              {t('adjustSearch')}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: botPad + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  headerIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  mapBannerWeb: {
    height: 220, borderRadius: 20, overflow: "hidden", marginBottom: 16,
    borderWidth: 1, position: "relative",
  },
  mapBannerNative: {
    height: 260, borderRadius: 20, overflow: "hidden", marginBottom: 16,
    borderWidth: 1,
  },
  mapLabel: {
    position: "absolute", bottom: 10, right: 10, flexDirection: "row",
    alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  filterText: { fontSize: 13, fontWeight: "600" },
  legend: { flexDirection: "row", gap: 14, marginBottom: 18, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendText: { fontSize: 11, fontWeight: "500" },
  mapCard: { borderRadius: 20, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, borderWidth: 1 },
  criticalBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 10 },
  criticalBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  mapCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  mapCardPin: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hospitalName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  hospitalAddress: { fontSize: 13, marginBottom: 6 },
  metaRow: { flexDirection: "row", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontWeight: "500" },
  needsRow: { flexDirection: "row", gap: 6, marginBottom: 14, flexWrap: "wrap" },
  needChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1.5 },
  needType: { fontSize: 12, fontWeight: "700" },
  needChipMore: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  needChipMoreText: { fontSize: 12, fontWeight: "600" },
  mapsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2 },
  mapsBtnText: { fontSize: 13, fontWeight: "700" },
  donateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 14, gap: 8 },
  donateBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
