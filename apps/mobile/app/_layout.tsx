import "../src/i18n/intl-polyfills";
import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AppRoot } from "../src/shell/AppRoot";
import { boot } from "../src/di/boot";

void SplashScreen.preventAutoHideAsync();

const hideSplash = () => {
  void SplashScreen.hideAsync();
};

export default function RootLayout() {
  return (
    <AppRoot boot={boot} onReady={hideSplash}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="filters" options={{ presentation: "modal" }} />
        <Stack.Screen name="sort" options={{ presentation: "modal" }} />
        <Stack.Screen name="applications/[id]/status" options={{ presentation: "modal" }} />
      </Stack>
    </AppRoot>
  );
}
