import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
} from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { Fonts } from "@/constants/fonts";
import { useTheme } from "@/context/ThemeContext";

const SIZE = 168;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface EligibilityGaugeProps {
  daysLeft: number;
  lastDonation: string | null;
  totalDays?: number;
}

export default function EligibilityGauge({
  daysLeft,
  lastDonation,
  totalDays = 90,
}: EligibilityGaugeProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const eligible = daysLeft <= 0;

  const progress = useMemo(() => {
    if (eligible) return 1;
    const daysSince = Math.max(0, totalDays - daysLeft);
    return Math.min(1, daysSince / totalDays);
  }, [daysLeft, eligible, totalDays]);

  const startColor = eligible ? "#10B981" : "#E11D48";
  const endColor = eligible ? "#34D399" : "#F472B6";

  const animatedProgress = useSharedValue(0);
  const heart = useSharedValue(1);
  const halo = useSharedValue(0.6);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress]);

  useEffect(() => {
    heart.value = withRepeat(
      withTiming(1.16, {
        duration: eligible ? 520 : 900,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
    return () => cancelAnimation(heart);
  }, [eligible, heart]);

  useEffect(() => {
    halo.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    return () => cancelAnimation(halo);
  }, [halo]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - animatedProgress.value),
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heart.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + halo.value * 0.2,
    transform: [{ scale: 0.95 + halo.value * 0.1 }],
  }));

  // Inner disc is now a solid saturated fill in both themes so the gauge reads
  // the same in light mode as it does in dark (dark-green / dark-rose disc with
  // a crisp white heart floating on top). Previously the light-mode inner was
  // a ~15% alpha wash that disappeared into the parchment surface.
  const innerColor = eligible ? "#10B981" : "#E11D48";
  const innerSoftColor = eligible
    ? "rgba(52, 211, 153, 0.45)"
    : "rgba(244, 114, 182, 0.40)";
  const heartColor = "#FFFFFF";
  const trackColor = isDark ? "#27272A" : "#E8DFCB";

  return (
    <View style={styles.root}>
      <View style={[styles.pill, { backgroundColor: eligible ? "#10B98122" : "#E11D4820" }]}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: eligible ? "#10B981" : "#F59E0B",
            marginRight: 7,
          }}
        />
        <Text
          style={{
            fontFamily: Fonts.extrabold,
            fontSize: 10,
            letterSpacing: 1.3,
            color: eligible ? "#10B981" : "#E11D48",
          }}
        >
          {eligible ? "ELIGIBLE" : "REPLENISHING"}
        </Text>
      </View>

      <View style={styles.ringWrap}>
        <Animated.View
          style={[
            styles.halo,
            haloStyle,
            { backgroundColor: startColor + "22" },
          ]}
        />
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Defs>
            <SvgGrad id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={startColor} />
              <Stop offset="1" stopColor={endColor} />
            </SvgGrad>
          </Defs>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={trackColor}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="url(#ringGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRC}`}
            fill="none"
            animatedProps={ringProps}
            rotation={-90}
            originX={SIZE / 2}
            originY={SIZE / 2}
          />
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R - 14} fill={innerColor} fillOpacity={0.9} />
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R - 34} fill={innerSoftColor} />
        </Svg>

        <Animated.View style={[styles.heart, heartStyle]}>
          <Feather name="heart" size={44} color={heartColor} />
        </Animated.View>
      </View>

      <Text style={[styles.caption, { color: colors.text }]}>
        {eligible ? "You Can Donate!" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} until eligible`}
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {eligible
          ? "You are eligible to donate blood today."
          : lastDonation
          ? `Last donation ${new Date(lastDonation).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : "Every drop counts. Stay hydrated."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: SIZE + 20,
    height: SIZE + 20,
    borderRadius: (SIZE + 20) / 2,
  },
  heart: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    fontFamily: Fonts.extrabold,
    fontSize: 18,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  sub: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
