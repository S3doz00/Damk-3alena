// Damk 3alena unified palette — mirrors the dashboard design system.
// Primary = Rose 500, secondary = Amber (alerts/campaigns), tertiary = Teal (success/live).
// Light surface = parchment, dark surface = command-center.

// Rose scale (brand primary)
const rose50 = "#FFF1F3";
const rose100 = "#FFE4E8";
const rose200 = "#FECDD3";
const rose400 = "#FB7185";
const rose500 = "#E11D48";
const rose600 = "#BE123C";
const rose800 = "#881337";

// Amber (alerts / campaigns)
const amber400 = "#F59E0B";
const amber500 = "#D97706";

// Teal (success / live / donations)
const teal400 = "#14B8A6";
const teal500 = "#0D9488";

// Blood-type families (shared with dashboard)
export const BloodColors = {
  "O-": "#B91C1C",
  "O+": "#E11D48",
  "A-": "#9333EA",
  "A+": "#7C3AED",
  "B-": "#2563EB",
  "B+": "#1D4ED8",
  "AB-": "#0F766E",
  "AB+": "#0D9488",
} as const;

// Urgency semantic badges (Critical / High / Medium / Low)
export const UrgencyColors = {
  critical: { bg: "#FFE4E8", text: "#881337", dot: "#E11D48" },
  high:     { bg: "#FEF3C7", text: "#78350F", dot: "#D97706" },
  medium:   { bg: "#DBEAFE", text: "#1E3A8A", dot: "#2563EB" },
  low:      { bg: "#D1FAE5", text: "#064E3B", dot: "#059669" },
} as const;

// Stock level (hospital blood inventory)
export const StockColors = {
  critical: "#E11D48",   // rose 500
  low:      "#D97706",   // amber 500
  moderate: "#F59E0B",   // amber 400
  adequate: "#0D9488",   // teal 500
} as const;

export default {
  light: {
    // Typography
    text: "#2C1F0E",            // parchment text (deep brown-black)
    textSecondary: "#6B5E4A",
    textMuted: "#9A8B72",

    // Surfaces (parchment theme)
    background: "#F2EAD8",      // bg
    surface: "#FBF7EF",         // surface (raised)
    card: "#FBF7EF",
    cardBorder: "#E8DEC8",      // container
    separator: "#DDD0B8",       // high
    inputBg: "#FBF7EF",
    inputBorder: "#DDD0B8",

    // Glass card (light)
    glassBg: "rgba(251,247,239,0.72)",
    glassBorder: "rgba(44,31,14,0.08)",
    glassHighlight: "rgba(255,255,255,0.6)",

    // Brand
    primary: rose500,
    primaryDark: rose600,
    primaryLight: rose400,
    primarySoft: rose100,
    primarySoftBorder: rose200,
    primaryContainer: rose800,

    // Semantic
    accent: amber400,
    accentDark: amber500,
    success: teal500,
    successLight: teal400,
    warning: amber400,
    danger: rose500,

    // System
    tint: rose500,
    tabIconDefault: "#C9B99A",
    tabIconSelected: rose500,
    overlay: "rgba(44,31,14,0.45)",
    shadow: "rgba(136,19,55,0.12)",
  },
  dark: {
    // Typography
    text: "#E2E8F0",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",

    // Surfaces (command-center)
    background: "#070711",      // bg
    surface: "#0C0C1A",         // surface
    card: "#111122",            // container
    cardBorder: "#1A1A2E",      // high
    separator: "#20203A",       // highest
    inputBg: "#0C0C1A",
    inputBorder: "#20203A",

    // Glass card (dark) — glassmorphism on command-center
    glassBg: "rgba(17,17,34,0.55)",
    glassBorder: "rgba(255,255,255,0.08)",
    glassHighlight: "rgba(255,255,255,0.04)",

    // Brand
    primary: rose500,
    primaryDark: rose600,
    primaryLight: rose400,
    primarySoft: "rgba(225,29,72,0.12)",
    primarySoftBorder: "rgba(225,29,72,0.35)",
    primaryContainer: rose800,

    // Semantic
    accent: amber400,
    accentDark: amber500,
    success: teal400,
    successLight: teal400,
    warning: amber400,
    danger: rose400,

    // System
    tint: rose500,
    tabIconDefault: "#48485A",
    tabIconSelected: rose500,
    overlay: "rgba(0,0,0,0.7)",
    shadow: "rgba(225,29,72,0.25)",
  },
};
