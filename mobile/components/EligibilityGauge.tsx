import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient as SvgGrad,
  Path,
  Rect,
  Stop,
  Circle,
} from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Fonts } from "@/constants/fonts";
import { useTheme } from "@/context/ThemeContext";

// Human body silhouette in a 160×240 viewBox — head, shoulders, torso, legs.
// Liquid clipped to this path fills anatomically from feet upward.
const BODY_PATH =
  "M80 18 C94 18 104 30 104 44 C104 58 94 70 80 70 C66 70 56 58 56 44 C56 30 66 18 80 18 Z " +
  "M70 72 L90 72 L92 86 L95 92 L116 96 C126 98 134 108 134 120 L134 162 C134 166 132 170 128 172 L120 176 L118 220 L116 230 C116 232 112 234 108 234 L98 234 C94 234 92 232 92 228 L92 178 L84 178 L84 228 C84 232 80 234 76 234 L66 234 C62 234 60 232 60 228 L58 178 L50 176 C46 174 44 170 44 166 L44 120 C44 108 50 98 60 96 L81 92 L84 86 Z";

const WAVE_WIDTH = 280;
const WAVE_HEIGHT = 8;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);
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

  // Top of the blood surface in SVG coords (y=0 top, y=240 bottom).
  const surfaceY = 240 - progress * 220;

  const wavePhase = useSharedValue(0);
  const fillY = useSharedValue(240);
  const heart = useSharedValue(1);
  const bubble1 = useSharedValue(0);
  const bubble2 = useSharedValue(0);
  const bubble3 = useSharedValue(0);

  useEffect(() => {
    wavePhase.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(wavePhase);
  }, [wavePhase]);

  useEffect(() => {
    fillY.value = withTiming(surfaceY, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, [surfaceY, fillY]);

  useEffect(() => {
    heart.value = withRepeat(
      withTiming(1.14, {
        duration: eligible ? 520 : 900,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
    return () => cancelAnimation(heart);
  }, [eligible, heart]);

  useEffect(() => {
    const loop = (sv: typeof bubble1, dur: number) => {
      sv.value = withRepeat(
        withTiming(1, { duration: dur, easing: Easing.linear }),
        -1,
        false
      );
    };
    loop(bubble1, 3200);
    loop(bubble2, 4100);
    loop(bubble3, 2700);
    return () => {
      cancelAnimation(bubble1);
      cancelAnimation(bubble2);
      cancelAnimation(bubble3);
    };
  }, [bubble1, bubble2, bubble3]);

  const waveProps1 = useAnimatedProps(() => ({
    transform: [{ translateX: -wavePhase.value * (WAVE_WIDTH / 2) }],
  }));
  const waveProps2 = useAnimatedProps(() => ({
    transform: [{ translateX: -((wavePhase.value + 0.5) % 1) * (WAVE_WIDTH / 2) }],
  }));

  const fillRectProps = useAnimatedProps(() => ({
    y: fillY.value,
    height: 240 - fillY.value,
  }));
  const waveGroup1Props = useAnimatedProps(() => ({ y: fillY.value - WAVE_HEIGHT / 2 }));
  const waveGroup2Props = useAnimatedProps(() => ({ y: fillY.value - WAVE_HEIGHT / 2 + 1 }));

  const heartStyle = useAnimatedProps(() => ({
    transform: [{ scale: heart.value }],
  }));

  const bubbleCY = (sv: typeof bubble1) =>
    useDerivedValue(() => 235 - sv.value * (220 * progress));

  const b1CY = bubbleCY(bubble1);
  const b2CY = bubbleCY(bubble2);
  const b3CY = bubbleCY(bubble3);

  const bubble1Props = useAnimatedProps(() => ({
    cy: b1CY.value,
    opacity: Math.sin(bubble1.value * Math.PI) * 0.55,
  }));
  const bubble2Props = useAnimatedProps(() => ({
    cy: b2CY.value,
    opacity: Math.sin(bubble2.value * Math.PI) * 0.45,
  }));
  const bubble3Props = useAnimatedProps(() => ({
    cy: b3CY.value,
    opacity: Math.sin(bubble3.value * Math.PI) * 0.4,
  }));

  const bloodColor = eligible ? "#10B981" : "#E11D48";
  const bloodColorDark = eligible ? "#047857" : "#9F1239";
  const outlineColor = isDark ? "#3F3F46" : "#D4D4D8";
  const bodyFill = isDark ? "#1F1F23" : "#F4F4F5";

  return (
    <View style={styles.root}>
      <View style={[styles.statusPill, { backgroundColor: eligible ? "#10B98122" : "#E11D4820" }]}>
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

      <View style={styles.svgWrap}>
        <Svg width={160} height={240} viewBox="0 0 160 240">
          <Defs>
            <SvgGrad id="bloodGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={bloodColor} stopOpacity="1" />
              <Stop offset="1" stopColor={bloodColorDark} stopOpacity="1" />
            </SvgGrad>
            <ClipPath id="bodyClip">
              <Path d={BODY_PATH} />
            </ClipPath>
          </Defs>

          <Path d={BODY_PATH} fill={bodyFill} stroke={outlineColor} strokeWidth={2} />

          <G clipPath="url(#bodyClip)">
            <AnimatedRect
              x={0}
              width={160}
              fill="url(#bloodGrad)"
              animatedProps={fillRectProps}
            />

            <AnimatedG animatedProps={waveGroup1Props}>
              <AnimatedPath
                animatedProps={waveProps1}
                d={`M0 ${WAVE_HEIGHT} Q 35 0 70 ${WAVE_HEIGHT} T 140 ${WAVE_HEIGHT} T 210 ${WAVE_HEIGHT} T 280 ${WAVE_HEIGHT} L 280 ${WAVE_HEIGHT * 2} L 0 ${WAVE_HEIGHT * 2} Z`}
                fill={bloodColor}
                opacity={0.9}
              />
            </AnimatedG>

            <AnimatedG animatedProps={waveGroup2Props}>
              <AnimatedPath
                animatedProps={waveProps2}
                d={`M0 ${WAVE_HEIGHT} Q 35 ${WAVE_HEIGHT * 2} 70 ${WAVE_HEIGHT} T 140 ${WAVE_HEIGHT} T 210 ${WAVE_HEIGHT} T 280 ${WAVE_HEIGHT} L 280 ${WAVE_HEIGHT * 2} L 0 ${WAVE_HEIGHT * 2} Z`}
                fill={bloodColorDark}
                opacity={0.55}
              />
            </AnimatedG>

            <AnimatedCircle cx={72} r={3} fill="#ffffff" animatedProps={bubble1Props} />
            <AnimatedCircle cx={86} r={2} fill="#ffffff" animatedProps={bubble2Props} />
            <AnimatedCircle cx={96} r={2.5} fill="#ffffff" animatedProps={bubble3Props} />
          </G>

          {/* Heart overlay — always visible, pulses faster when eligible */}
          <AnimatedG animatedProps={heartStyle} originX={80} originY={118}>
            <Path
              d="M80 130 C 73 122 65 122 65 114 C 65 108 70 104 75 104 C 78 104 80 106 80 108 C 80 106 82 104 85 104 C 90 104 95 108 95 114 C 95 122 87 122 80 130 Z"
              fill={eligible ? "#ffffff" : "#ffffffCC"}
              stroke={bloodColorDark}
              strokeWidth={1}
            />
          </AnimatedG>
        </Svg>
      </View>

      <Text style={[styles.caption, { color: colors.text }]}>
        {eligible ? "You Can Donate!" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} until eligible`}
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {eligible
          ? "Your body is fully replenished."
          : lastDonation
          ? `Replenishing since ${new Date(lastDonation).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : "Every drop counts. Stay hydrated."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    paddingVertical: 14,
    gap: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  svgWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
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
