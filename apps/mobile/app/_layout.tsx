import "../src/i18n/intl-polyfills";
import "../global.css";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AppRoot } from "../src/shell/AppRoot";
import { boot } from "../src/di/boot";

export const unstable_settings = { initialRouteName: "index" };

void SplashScreen.preventAutoHideAsync();

const hideSplash = () => {
  void SplashScreen.hideAsync();
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!loaded && !error) return null;

  return (
    <AppRoot boot={boot} onReady={hideSplash}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="filters" options={{ presentation: "modal" }} />
        <Stack.Screen name="sort" options={{ presentation: "modal" }} />
        <Stack.Screen name="applications/[id]/status" options={{ presentation: "modal" }} />
      </Stack>
    </AppRoot>
  );
}
