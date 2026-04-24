import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Location from "expo-location";
import React, { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoggedIn, isOnboarded, isLoading } = useApp();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.replace("/auth/login");
    } else {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="auth/login" options={{ animation: "none" }} />
      <Stack.Screen name="auth/signup" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/otp" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/forgot-password" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/verify-email" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/location" options={{ animation: "fade" }} />
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="hospital/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="campaign/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="campaigns" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="my-campaigns" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="appointment/book" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="appointment/ticket" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="edit-email" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Request location permission when app first launches
  useEffect(() => {
    if (Platform.OS !== "web") {
      Location.requestForegroundPermissionsAsync().catch(() => {});
    }
  }, []);

  // Return a white view instead of null so there's no jarring flash between the
  // red splash screen and the app background while fonts are still loading.
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} />;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LanguageProvider>
              <AppProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </AppProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
