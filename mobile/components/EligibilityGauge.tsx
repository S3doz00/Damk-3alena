import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Fonts } from "@/constants/fonts";
import GlassCard from "./GlassCard";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Creative motion-driven eligibility visual.
// Layers: ambient ring pulse · SVG progress arc with gradient · pulsing heart
// at center · animated day counter. Ring fills 0→100% over 90 days. When
// eligible, the ring holds full and shifts to emerald, heart beats faster.
export interface EligibilityGaugeProps {
  daysLeft: number;
  lastDonation: string | null;
  totalDays?: number;
}

const SIZE = 168;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export default function EligibilityGauge({
  daysLeft,
  lastDonation,
  totalDays = 90,
}: EligibilityGaugeProps) {
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  const isEligible = daysLeft <= 0;
  const progress = isEligible ? 1 : Math.max(0, Math.min(1, (totalDays - daysLeft) / totalDays));
  const pct = Math.round(progress * 100);

  // Rose while waiting → emerald when eligible.
  const startColor = isEligible ? "#10B981" : "#E11D48";
  const endColor = isEligible ? "#34D399" : "#FB7185";
  const trackColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(44,31,14,0.08)";

  // Animated progress (stroke-dashoffset).
  const animated = useSharedValue(0);
  useEffect(() => {
    animated.value = withTiming(progress, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [progress, animated]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - animated.value),
  }));

  // Pulsing heart. Eligible = faster, larger pulse.
  const heartScale = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(heartScale);
    const peak = isEligible ? 1.22 : 1.1;
    const dur = isEligible ? 520 : 900;
    heartScale.value = withRepeat(
      withSequence(
        withTiming(peak, { duration: dur, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: dur, easing: Easing.in(Easing.quad) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(heartScale);
  }, [isEligible, heartScale]);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  // Ambient outer halo — breathes on a longer cycle.
  const halo = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(halo);
    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(halo);
  }, [halo]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + halo.value * 0.22,
    transform: [{ scale: 1 + halo.value * 0.05 }],
  }));

  const lastDonationLabel = useMemo(() => {
    if (!lastDonation) return null;
    return new Date(lastDonation).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [lastDonation]);

  return (
    <GlassCard glowColor={startColor} borderRadius={22}>
      <View style={{ padding: 18, alignItems: "center" }}>
        {/* Eyebrow */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: startColor,
            }}
          />
          <Text
            style={{
              fontFamily: Fonts.extrabold,
              fontSize: 10,
              letterSpacing: 1.4,
              color: colors.textMuted,
              textTransform: "uppercase",
            }}
          >
            {isEligible ? t("eligible") || "Eligible" : t("donationEligibility") || "Eligibility"}
          </Text>
        </View>

        {/* Gauge */}
        <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
          {/* Ambient breathing halo */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
                backgroundColor: startColor,
              },
              haloStyle,
            ]}
          />

          <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
            <Defs>
              <SvgGrad id="arcGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={startColor} stopOpacity="1" />
                <Stop offset="1" stopColor={endColor} stopOpacity="1" />
              </SvgGrad>
            </Defs>
            {/* Track */}
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={trackColor}
              strokeWidth={STROKE}
              fill="none"
            />
            {/* Progress arc */}
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="url(#arcGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${CIRC} ${CIRC}`}
              animatedProps={arcProps}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>

          {/* Center stack */}
          <Animated.View style={heartStyle}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: startColor,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: startColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.45,
                shadowRadius: 14,
                elevation: 6,
              }}
            >
              <Feather name="heart" size={26} color="#fff" />
            </View>
          </Animated.View>
        </View>

        {/* Readout */}
        <View style={{ marginTop: 16, alignItems: "center", gap: 4 }}>
          {isEligible ? (
            <>
              <Text
                style={{
                  fontFamily: Fonts.extrabold,
                  fontSize: 22,
                  color: colors.text,
                  letterSpacing: -0.3,
                }}
              >
                {t("youCanDonate") || "You can donate"}
              </Text>
              <Text
                style={{
                  fontFamily: Fonts.medium,
                  fontSize: 13,
                  color: colors.textSecondary,
                }}
              >
                {t("eligibleToday") || "Eligible today"}
              </Text>
            </>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                <Text
                  style={{
                    fontFamily: Fonts.extrabold,
                    fontSize: 38,
                    color: colors.text,
                    letterSpacing: -1.2,
                  }}
                >
                  {daysLeft}
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.semibold,
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  {t("daysLeft") || "days left"}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: Fonts.medium,
                  fontSize: 12,
                  color: colors.textMuted,
                  letterSpacing: 0.3,
                }}
              >
                {pct}% {t("of90Days") || "of 90 days"}
              </Text>
            </>
          )}
        </View>

        {lastDonationLabel && (
          <View
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.separator,
              alignSelf: "stretch",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.medium,
                fontSize: 11.5,
                color: colors.textMuted,
                letterSpacing: 0.3,
              }}
            >
              {t("lastDonation") || "Last donation"} · {lastDonationLabel}
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}
