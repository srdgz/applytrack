import { messages, resolveLocale } from "@applytrack/i18n";
import { render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import App from "./App";

jest.mock(
  "react-native-safe-area-context",
  () =>
    jest.requireActual<{ default: unknown }>("react-native-safe-area-context/jest/mock").default,
);

const kindNames = (locale: "es" | "en") => {
  const { toast } = messages[locale];
  return [
    toast.success,
    toast.error,
    toast.warning,
    toast.info,
    toast.action,
    toast.icon,
    toast.loading,
  ];
};

describe("App", () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("muestra un botón con texto por cada tipo de aviso y React no avisa de nada", async () => {
    const consoleError = jest.spyOn(console, "error");
    const locale = resolveLocale([Intl.DateTimeFormat().resolvedOptions().locale]);

    await render(<App />);

    expect(screen.getAllByRole("button")).toHaveLength(7);
    for (const name of kindNames(locale)) {
      expect(screen.getByText(name)).toBeOnTheScreen();
    }
    expect(consoleError).not.toHaveBeenCalled();
  });

  it.each(["es", "en"] as const)("los nombres de tipo existen y no se repiten en %s", (locale) => {
    const names = kindNames(locale);

    expect(names.every((name) => name.trim() !== "")).toBe(true);
    expect(new Set(names).size).toBe(7);
  });
});
