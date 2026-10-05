import { createToastQueue } from "@applytrack/notifications";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, Text } from "react-native";

import type { ToastLabels } from "./ToastProvider";
import { ToastProvider, useToast } from "./ToastProvider";

const labels: ToastLabels = {
  close: "Cerrar aviso",
  region: "Avisos",
  kinds: { success: "Hecho", info: "Información", error: "Error" },
};

const Trigger = () => {
  const toast = useToast();
  return (
    <>
      <Text onPress={() => toast.success("Candidatura guardada")}>éxito</Text>
      <Text onPress={() => toast.error("No se ha podido guardar")}>error</Text>
    </>
  );
};

const setup = async () => {
  const queue = createToastQueue();
  await render(
    <ToastProvider labels={labels} queue={queue}>
      <Trigger />
    </ToastProvider>,
  );
  return queue;
};

describe("ToastProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("CA-107-13 · muestra el aviso, lo anuncia y lo cierra solo a los 5 s", async () => {
    await setup();

    await fireEvent.press(screen.getByText("éxito"));

    expect(await screen.findByText("Candidatura guardada")).toBeOnTheScreen();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      "Hecho: Candidatura guardada",
    );

    await act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.queryByText("Candidatura guardada")).toBeNull();
  });

  it("CA-107-13 · los errores son alertas, no se cierran solos y se cierran con su botón", async () => {
    await setup();

    await fireEvent.press(screen.getByText("error"));
    await act(() => {
      jest.advanceTimersByTime(60_000);
    });

    const toast = await screen.findByTestId("toast-error");
    expect(toast.props.accessibilityRole).toBe("alert");
    expect(toast.props.accessibilityLiveRegion).toBe("assertive");

    await fireEvent.press(screen.getByLabelText("Cerrar aviso"));
    expect(screen.queryByText("No se ha podido guardar")).toBeNull();
  });

  it("CA-107-13 · mantenerlo pulsado pausa el tiempo", async () => {
    const queue = await setup();
    const pause = jest.spyOn(queue, "pause");
    const resume = jest.spyOn(queue, "resume");

    await fireEvent.press(screen.getByText("éxito"));
    const toast = await screen.findByTestId("toast-success");
    await fireEvent(toast, "pressIn");
    await fireEvent(toast, "pressOut");

    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("useToast fuera del proveedor avisa del error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(render(<Trigger />)).rejects.toThrow("ToastProvider is missing");
  });
});
