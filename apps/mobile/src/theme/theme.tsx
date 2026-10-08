import type { ThemePreference } from "@applytrack/core";
import { cssVariables } from "@applytrack/design-tokens";
import { colorScheme, useColorScheme, vars } from "nativewind";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { View } from "react-native";

export const applyTheme = (theme: ThemePreference): void => {
  colorScheme.set(theme);
};

export const useIsDark = (): boolean => useColorScheme().colorScheme === "dark";

export const ThemeRoot = ({ children }: { readonly children: ReactNode }) => {
  const dark = useIsDark();
  const style = useMemo(() => vars(cssVariables(dark ? "dark" : "light")), [dark]);

  return (
    <View style={style} className="flex-1 bg-canvas">
      {children}
    </View>
  );
};
