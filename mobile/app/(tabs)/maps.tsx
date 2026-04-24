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
import GlassCard from "@/components/GlassCard";
import { Fonts } from "@/constants/fonts";
import { StockColors } from "@/constants/colors";

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch {}
}

// Level ranking for overall facility status (worst need wins)
const LEVEL_RANK = { critical: 0, low: 1, moderate: 2, adequate: 3 } as const;
type Level = keyof typeof LEVEL_RANK;

const LEVEL_LABEL_KEYS: Record<Level, string> = {
  critical: "levelCritical",
  low: "levelLow",
  moderate: "levelModerate",
  adequate: "levelAdequate",
};

// Only keep facilities that have a usable coordinate. This fixes the missing-pin bug
// — NULL/NaN lat/lng from Supabase was poisoning the map's region calc.
function hasValidCoords(f: Facility): boolean {
  return (
    typeof f.latitude === "number" && Number.isFinite(f.latitude) && f.latitude !== 0 &&
    typeof f.longitude === "number" && Number.isFinite(f.longitude) && f.longitude !== 0
  );
}

function worstLevel(f: Facility): Level {
  if (f.bloodNeeds.length === 0) return "adequate";
  return f.bloodNeeds.reduce<Level>((acc, n) => (LEVEL_RANK[n.level] < LEVEL_RANK[acc] ? n.level : acc), "adequate");
}

function HospitalMapCard({
  facility,
  onDonate,
  colors,
  theme,
}: {
  facility: Facility;
  onDonate: () => void;
  colors: any;
  theme: string;
}) {
  const { t } = useLanguage();
  const level = worstLevel(facility);
  const isDark = theme === "dark";

  const glow = StockColors[level];

  const openDirections = () => {
    const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;
    if (Platform.OS === "ios") {
      Linking.openURL(`comgooglemaps://?daddr=${facility.latitude},${facility.longitude}&directionsmode=driving`).catch(() => {
        Linking.openURL(webFallback);
      });
    } else if (Platform.OS === "android") {
      Linking.openURL(`google.navigation:q=${facility.latitude},${facility.longitude}`).catch(() => {
        Linking.openURL(webFallback);
      });
    } else {
      Linking.openURL(webFallback);
    }
  };

  const criticalCount = facility.bloodNeeds.filter((n) => n.level === "critical").length;

  return (
    <GlassCard glowColor={glow}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: "/hospital/[id]", params: { id: facility.id } })}
        style={{ padding: 18 }}
      >
        {/* Status row — worst stock level + critical count */}
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: glow + (isDark ? "33" : "1F") }]}>
            <View style={[styles.statusDot, { backgroundColor: glow }]} />
            <Text style={[styles.statusPillText, { color: glow }]}>
              {t(LEVEL_LABEL_KEYS[level]).toUpperCase()}
            </Text>
          </View>
          {criticalCount > 0 && (
            <View style={styles.criticalCount}>
              <Feather name="alert-circle" size={11} color={StockColors.critical} />
              <Text style={[styles.criticalCountText, { color: StockColors.critical }]}>
                {criticalCount} {t('criticalNeedBadge')}
              </Text>
            </View>
          )}
        </View>

        {/* Hospital name — editorial typography */}
        <Text style={[styles.hospitalName, { color: colors.text }]} numberOfLines={2}>
          {facility.name}
        </Text>

        {/* Meta — city · hours, quieter than before */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={13} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {facility.city || facility.address}
            </Text>
          </View>
          {facility.workingHours ? (
            <View style={styles.metaItem}>
              <Feather name="clock" size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {facility.workingHours}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.ghostBtn, { borderColor: colors.glassBorder }]}
            onPress={openDirections}
            activeOpacity={0.85}
          >
            <Feather name="navigation" size={14} color={colors.text} />
            <Text style={[styles.ghostBtnText, { color: colors.text }]}>{t('directions')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.donateBtn, { backgroundColor: colors.primary }]}
            onPress={onDonate}
            activeOpacity={0.85}
          >
            <Feather name="droplet" size={14} color="#fff" />
            <Text style={styles.donateBtnText}>{t('donateHere')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </GlassCard>
  );
}

// Custom glass marker — circular ring + inner dot, color matches worst stock level.
function GlassMarker({ level }: { level: Level }) {
  const color = StockColors[level];
  return (
    <View style={markerStyles.outer}>
      <View style={[markerStyles.ring, { borderColor: color + "55" }]} />
      <View style={[markerStyles.dot, { backgroundColor: color, shadowColor: color }]}>
        <View style={markerStyles.inner} />
      </View>
    </View>
  );
}

const NativeMap = React.memo(function NativeMap({
  facilities,
  theme,
}: {
  facilities: Facility[];
  theme: string;
}) {
  if (!MapView) return null;

  const validFacilities = facilities.filter(hasValidCoords);

  const avgLat = validFacilities.length > 0
    ? validFacilities.reduce((s, f) => s + f.latitude, 0) / validFacilities.length
    : 31.9539; // Amman fallback
  const avgLng = validFacilities.length > 0
    ? validFacilities.reduce((s, f) => s + f.longitude, 0) / validFacilities.length
    : 35.9106;

  const lats = validFacilities.map((f) => f.latitude);
  const lngs = validFacilities.map((f) => f.longitude);
  const latDelta = validFacilities.length > 1 ? (Math.max(...lats) - Math.min(...lats)) * 1.5 + 0.05 : 0.15;
  const lngDelta = validFacilities.length > 1 ? (Math.max(...lngs) - Math.min(...lngs)) * 1.5 + 0.05 : 0.15;

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
      customMapStyle={theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
    >
      {validFacilities.map((f) => {
        const level = worstLevel(f);
        return (
          <Marker
            key={f.id}
            coordinate={{ latitude: f.latitude, longitude: f.longitude }}
            title={f.name}
            description={`${f.city || ""}${f.workingHours ? " · " + f.workingHours : ""}`}
            tracksViewChanges={false}
          >
            <GlassMarker level={level} />
          </Marker>
        );
      })}
    </MapView>
  );
});

function WebMapBanner({ facilities, colors, theme }: { facilities: Facility[]; colors: any; theme: string }) {
  const valid = facilities.filter(hasValidCoords);
  if (valid.length === 0) return null;

  const avgLat = valid.reduce((s, f) => s + f.latitude, 0) / valid.length;
  const avgLng = valid.reduce((s, f) => s + f.longitude, 0) / valid.length;

  const markersJSON = JSON.stringify(
    valid.map((f) => ({
      lat: f.latitude,
      lng: f.longitude,
      name: f.name,
      level: worstLevel(f),
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
var STOCK = {critical:"#E11D48", low:"#D97706", moderate:"#F59E0B", adequate:"#0D9488"};
function initMap(){
  var markers = ${markersJSON};
  var darkStyle = ${isDark ? `[
    {elementType:"geometry",stylers:[{color:"#070711"}]},
    {elementType:"labels.text.stroke",stylers:[{color:"#070711"}]},
    {elementType:"labels.text.fill",stylers:[{color:"#64748B"}]},
    {featureType:"road",elementType:"geometry",stylers:[{color:"#1A1A2E"}]},
    {featureType:"water",elementType:"geometry",stylers:[{color:"#0C0C1A"}]},
    {featureType:"poi",elementType:"geometry",stylers:[{color:"#111122"}]}
  ]` : `[
    {elementType:"geometry",stylers:[{color:"#F2EAD8"}]},
    {elementType:"labels.text.fill",stylers:[{color:"#6B5E4A"}]},
    {featureType:"road",elementType:"geometry",stylers:[{color:"#FBF7EF"}]},
    {featureType:"water",elementType:"geometry",stylers:[{color:"#DDD0B8"}]}
  ]`};
  var map = new google.maps.Map(document.getElementById("map"),{
    center:{lat:${avgLat},lng:${avgLng}},
    zoom:9,
    styles:darkStyle,
    disableDefaultUI:false,
    zoomControl:true,
    mapTypeControl:false,
    streetViewControl:false,
    fullscreenControl:false,
  });
  markers.forEach(function(m){
    var color = STOCK[m.level] || "#E11D48";
    new google.maps.Marker({
      position:{lat:m.lat,lng:m.lng},
      map:map,
      title:m.name,
      icon:{
        path:google.maps.SymbolPath.CIRCLE,
        fillColor:color,
        fillOpacity:1,
        strokeColor:"#ffffff",
        strokeWeight:2,
        scale:9,
      }
    });
  });
}
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCUwCHZGcgaThPEHwXyJNFh2_ts2h2gfUI&callback=initMap"></script>
</body></html>`;

  if (Platform.OS === "web") {
    return (
      <View style={[styles.mapBannerWeb, { backgroundColor: colors.inputBg, borderColor: colors.separator }]}>
        <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
          <Text style={{ textAlign: "center", padding: 20, color: colors.textSecondary, fontFamily: Fonts.medium }}>
            Map available on mobile
          </Text>
        </View>
      </View>
    );
  }

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

// Dashboard-matched map styles.
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#070711" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#070711" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748B" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1A1A2E" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0C0C1A" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#20203A" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0C0C1A" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#111122" }] },
];

const LIGHT_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#F2EAD8" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B5E4A" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FBF7EF" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#DDD0B8" }] },
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
      const q = search.toLowerCase();
      const matchSearch = f.name.toLowerCase().includes(q) || f.city.toLowerCase().includes(q);
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
            {/* Editorial header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>LIVE MAP</Text>
                <Text style={[styles.title, { color: colors.text }]}>{t('bloodBanks')}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {filtered.length} {t('locationsInJordan')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.headerIcon, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}
                onPress={() => setShowFullMap(!showFullMap)}
              >
                <Feather name={showFullMap ? "list" : "map"} size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Map preview */}
            <View style={[
              showFullMap ? styles.mapBannerNative : styles.mapBannerWeb,
              { borderColor: colors.glassBorder, backgroundColor: colors.surface },
            ]}>
              {Platform.OS !== "web" ? (
                <NativeMap facilities={facilities} theme={theme} />
              ) : (
                <WebMapBanner facilities={facilities} colors={colors} theme={theme} />
              )}
            </View>

            {/* Search */}
            <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
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

            {/* Filter chips */}
            <View style={styles.filterRow}>
              {(["all", "critical", "hospital", "blood_bank"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterBtn,
                    { backgroundColor: colors.surface, borderColor: colors.glassBorder },
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

            {/* Legend — explicit order avoids key-ordering inconsistency on Android */}
            <View style={styles.legend}>
              {(["critical", "low", "moderate", "adequate"] as Level[]).map((level) => (
                <View key={level} style={styles.legendItem}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, marginRight: 5, backgroundColor: StockColors[level] }} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>
                    {t(LEVEL_LABEL_KEYS[level])}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
            <HospitalMapCard facility={item} onDonate={() => handleDonate(item)} colors={colors} theme={theme} />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 20, paddingVertical: 40, alignItems: "center" }}>
            <Feather name="search" size={40} color={colors.textMuted} />
            <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: colors.text, marginTop: 12 }}>
              {t('noResults')}
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
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

const markerStyles = StyleSheet.create({
  outer: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute", width: 36, height: 36, borderRadius: 18, borderWidth: 2,
  },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 6, elevation: 4,
    borderWidth: 2, borderColor: "#ffffff",
  },
  inner: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
});

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, gap: 12 },
  eyebrow: { fontFamily: Fonts.extrabold, fontSize: 11, letterSpacing: 2, marginBottom: 4 },
  title: { fontFamily: Fonts.extrabold, fontSize: 32, letterSpacing: -0.8, lineHeight: 36 },
  subtitle: { fontFamily: Fonts.medium, fontSize: 13, marginTop: 2 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },

  mapBannerWeb: { height: 220, borderRadius: 20, overflow: "hidden", marginBottom: 16, borderWidth: 1 },
  mapBannerNative: { height: 280, borderRadius: 20, overflow: "hidden", marginBottom: 16, borderWidth: 1 },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: Fonts.medium },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontFamily: Fonts.semibold, fontSize: 12, letterSpacing: 0.3 },

  legend: { flexDirection: "row", marginBottom: 18, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 14, marginBottom: 4 },
  legendText: { fontFamily: Fonts.medium, fontSize: 11 },

  // Card internals
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontFamily: Fonts.extrabold, fontSize: 10, letterSpacing: 1 },
  criticalCount: { flexDirection: "row", alignItems: "center", gap: 4 },
  criticalCountText: { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 0.3 },

  hospitalName: { fontFamily: Fonts.extrabold, fontSize: 19, letterSpacing: -0.3, lineHeight: 24, marginBottom: 8 },
  metaRow: { flexDirection: "row", gap: 14, marginBottom: 16, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontFamily: Fonts.medium, fontSize: 12.5 },

  actionsRow: { flexDirection: "row", gap: 10 },
  ghostBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1,
  },
  ghostBtnText: { fontFamily: Fonts.bold, fontSize: 12.5, letterSpacing: 0.2 },
  donateBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 12, borderRadius: 12,
  },
  donateBtnText: { fontFamily: Fonts.extrabold, fontSize: 13, letterSpacing: 0.3, color: "#fff" },
});
