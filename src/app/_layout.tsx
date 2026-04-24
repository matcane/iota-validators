import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { setBackgroundColorAsync } from "expo-system-ui";
import { useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";

import { preloadEarthNightPixels } from "@/lib/globe-earth-pixels";

import "@/global.css";

import "react-native-reanimated";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({});

function RootNavigation() {
  const headerStyleBackground = useResolveClassNames("bg-bg").backgroundColor as string;
  const headerTintColor = useResolveClassNames("text-tab-active").color as string;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: headerStyleBackground },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="validator-detail"
        options={{
          title: "",
          animation: "slide_from_right",
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: headerStyleBackground },
          headerTintColor,
        }}
      />
    </Stack>
  );
}

export default function Root() {
  const onLayoutRootView = useCallback(async () => {
    await preloadEarthNightPixels();
    await setBackgroundColorAsync("#0f0f19");
    await SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <RootNavigation />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
