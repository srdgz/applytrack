import { AccessibilityInfo } from "react-native";
import { MemoryKeyValueStore } from "@applytrack/adapter-local";
import { createContainer } from "@applytrack/composition";
import type { Email } from "@applytrack/core";
import { toUserId } from "@applytrack/core";
import type { FakeAuthGateway } from "@applytrack/core/testing/doubles";
import {
  FakeSessionProvider,
  FixedClock,
  InMemoryApplicationRepository,
  InMemoryPreferencesStore,
} from "@applytrack/core/testing/doubles";
import { Stack } from "expo-router";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";

import { AppRoot } from "../shell/AppRoot";
import type { Boot } from "../di/booted";
import { resolveBooted } from "../di/booted";
import { AuthCallbackScreen } from "../screens/AuthCallbackScreen";
import { BoardScreen } from "../screens/BoardScreen";
import { DetailScreen } from "../screens/DetailScreen";
import { FiltersScreen } from "../screens/FiltersScreen";
import { ListScreen } from "../screens/ListScreen";
import { EditApplicationScreen, NewApplicationScreen } from "../screens/FormScreens";
import { SettingsScreen } from "../screens/SettingsScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SortScreen } from "../screens/SortScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { StatusScreen } from "../screens/StatusScreen";
import { StartScreen } from "../screens/StartScreen";
import { TabsLayout } from "../screens/TabsLayout";

interface Setup {
  readonly store?: MemoryKeyValueStore;
  readonly auth?: FakeAuthGateway;
  readonly signedIn?: boolean;
  readonly profile?: InMemoryPreferencesStore;
  readonly onBoot?: () => boolean;
  readonly repository?: InMemoryApplicationRepository;
}

let lastView: ReturnType<typeof renderRouter> | null = null;

export const pathname = () => lastView?.getPathname();

export const clock = new FixedClock("2026-10-05T12:00:00.000Z");

export const spanishStore = async () => {
  const store = new MemoryKeyValueStore();
  await store.setItem("applytrack:locale", "es");
  return store;
};

export const startApp = async (initialUrl: string, setup: Setup = {}) => {
  const store = setup.store ?? (await spanishStore());
  let account = setup.signedIn ?? false;
  const boot: Boot = (fallback) => {
    if (setup.onBoot?.()) account = true;
    return resolveBooted(
      createContainer({
        store,
        clock,
        ...(setup.auth && { auth: setup.auth }),
        ...(account && {
          signedIn: {
            account: { userId: toUserId("user-ana"), email: "ana@mail.com" as Email },
            adapters: {
              repository: setup.repository ?? new InMemoryApplicationRepository(),
              session: new FakeSessionProvider("user-ana"),
              profile: setup.profile ?? new InMemoryPreferencesStore(),
            },
          },
        }),
      }),
      fallback,
    );
  };

  const signIn = () => {
    account = true;
  };
  const signOut = () => {
    account = false;
  };

  const view = renderRouter(
    {
      _layout: () => (
        <AppRoot boot={boot}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="filters" options={{ presentation: "modal" }} />
            <Stack.Screen name="sort" options={{ presentation: "modal" }} />
          </Stack>
        </AppRoot>
      ),
      index: StartScreen,
      "sign-in": SignInScreen,
      "auth/callback": AuthCallbackScreen,
      "(app)/_layout": TabsLayout,
      "(app)/board": BoardScreen,
      "(app)/list": ListScreen,
      "(app)/stats": StatsScreen,
      "(app)/settings": SettingsScreen,
      filters: FiltersScreen,
      sort: SortScreen,
      "applications/[id]/index": DetailScreen,
      "applications/[id]/status": StatusScreen,
      "applications/[id]/edit": EditApplicationScreen,
      "applications/new": NewApplicationScreen,
    },
    { initialUrl },
  );
  await view;
  await waitFor(
    () => {
      expect(screen.toJSON()).not.toBeNull();
    },
    { timeout: 5000 },
  );
  lastView = view;
  return { view, store, signIn, signOut };
};

export const setUpAppTests = () => {
  jest.setTimeout(20000);

  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
};
