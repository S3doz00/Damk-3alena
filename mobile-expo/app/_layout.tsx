import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoggedIn, isOnboarded, isLoading } = useApp();
  const [locationAsked, setLocationAsked] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("locationAsked").then((val) => {
      setLocationAsked(val === "true");
    });
  }, []);

  useEffect(() => {
    if (isLoading || locationAsked === null) return;
    if (!isLoggedIn) {
      router.replace("/auth/login");
    } else if (!isOnboarded) {
      router.replace("/onboarding");
    } else if (!locationAsked) {
      router.replace("/auth/location");
    } else {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn, isOnboarded, isLoading, locationAsked]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="auth/login" options={{ animation: "none" }} />
      <Stack.Screen name="auth/signup" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/otp" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/location" options={{ animation: "fade" }} />
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen name="hospital/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="campaign/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="campaigns" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="appointment/book" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="appointment/ticket" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
    <LanguageProvider>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AppProvider>
                  <RootLayoutNav />
                </AppProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </LanguageProvider>
    </ThemeProvider>
  );
}
