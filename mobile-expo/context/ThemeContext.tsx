import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, useColorScheme } from "react-native";
import Colors from "@/constants/colors";

export type ThemePreference = "device" | "light" | "dark";
type ColorSet = typeof Colors.light;

interface ThemeContextType {
  colors: ColorSet;
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (p: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: Colors.light,
  preference: "device",
  isDark: false,
  setPreference: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("device");

  useEffect(() => {
    AsyncStorage.getItem("themePreference").then((val) => {
      if (val === "light" || val === "dark" || val === "device") {
        setPreferenceState(val);
        if (val !== "device") Appearance.setColorScheme(val);
      }
    });
  }, []);

  const setPreference = async (p: ThemePreference) => {
    setPreferenceState(p);
    await AsyncStorage.setItem("themePreference", p);
    Appearance.setColorScheme(p === "device" ? null : p);
  };

  const isDark =
    preference === "dark" ||
    (preference === "device" && systemScheme === "dark");

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ colors, preference, isDark, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
