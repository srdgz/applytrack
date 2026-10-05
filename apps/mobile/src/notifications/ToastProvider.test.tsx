import type { ToastKind } from "@applytrack/notifications";
import { createToastQueue } from "@applytrack/notifications";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { ToastApi, ToastLabels } from "./ToastProvider";
import { ToastProvider, useToast } from "./ToastProvider";

const labels: ToastLabels = {
  close: "Cerrar aviso",
  region: "Avisos",
  kinds: {
    success: "Hecho",
    info: "Información",
    warning: "Atención",
    error: "Error",
    action: "Acción",
    icon: "Aviso",
    loading: "Cargando",
  },
};

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

let api: ToastApi | undefined;

const Capture = () => {
  api = useToast();
  return <Text>contenido</Text>;
};

const toast = () => {
  if (!api) throw new Error("sin API");
  return api;
};

const setup = async () => {
  const queue = createToastQueue();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider labels={labels} queue={queue}>
        <Capture />
      </ToastProvider>
    </SafeAreaProvider>,
  );
  return queue;
};

const advance = async (ms: number) => {
  await act(() => {
    jest.advanceTimersByTime(ms);
  });
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
    api = undefined;
  });

  it("CA-107-14 · los avisos aparecen arriba, por debajo del área segura", async () => {
    await setup();

    expect(screen.getByTestId("toast-host")).toHaveStyle({ top: 55 });
  });

  it.each<[ToastKind, keyof ToastApi]>([
    ["success", "success"],
    ["info", "info"],
    ["warning", "warning"],
    ["error", "error"],
    ["action", "action"],
    ["icon", "icon"],
  ])("CA-107-14 · muestra y anuncia el tipo %s", async (kind, method) => {
    await setup();

    await act(() => {
      (toast()[method] as (title: string) => string)("Título");
    });

    expect(await screen.findByTestId(`toast-${kind}`)).toBeOnTheScreen();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      `${labels.kinds[kind]}: Título`,
    );
  });

  it("CA-107-14 · errores y avisos son alertas; el resto, no", async () => {
    await setup();

    await act(() => {
      toast().error("Fallo");
      toast().success("Bien");
    });

    expect(screen.getByTestId("toast-error").props.accessibilityRole).toBe("alert");
    expect(screen.getByTestId("toast-error").props.accessibilityLiveRegion).toBe("assertive");
    expect(screen.getByTestId("toast-success").props.accessibilityRole).toBe("text");
  });

  it("se expande solo con descripción y se cierra a su tiempo", async () => {
    await setup();

    await act(() => {
      toast().success("Guardada", { description: "Nimbus Labs" });
    });
    expect(screen.getByTestId("toast-success").props.accessibilityState).toEqual({
      expanded: false,
    });

    await advance(300);
    expect(screen.getByTestId("toast-success").props.accessibilityState).toEqual({
      expanded: true,
    });
    expect(screen.getByText("Nimbus Labs")).toBeOnTheScreen();

    await advance(6000);
    expect(screen.queryByText("Guardada")).toBeNull();
  });

  it("CA-107-15 · tocar expande o contrae; mantener pulsado pausa", async () => {
    const queue = await setup();
    const pause = jest.spyOn(queue, "pause");
    const resume = jest.spyOn(queue, "resume");

    await act(() => {
      toast().info("Info", { description: "Detalle" });
    });
    await advance(300);
    const pressable = screen.getByLabelText("Información: Info. Detalle");

    await fireEvent.press(pressable);
    expect(screen.getByTestId("toast-info").props.accessibilityState).toEqual({ expanded: false });
    await fireEvent.press(pressable);
    expect(screen.getByTestId("toast-info").props.accessibilityState).toEqual({ expanded: true });

    await fireEvent(pressable, "pressIn");
    await fireEvent(pressable, "pressOut");
    expect(pause).toHaveBeenCalled();
    expect(resume).toHaveBeenCalled();
  });

  it("CA-107-15 · deslizar hacia arriba lo cierra; un gesto corto no", async () => {
    await setup();
    await act(() => {
      toast().error("Fallo");
    });
    const item = screen.getByTestId("toast-error");

    await fireEvent(item, "touchStart", { nativeEvent: { pageY: 100 } });
    await fireEvent(item, "touchMove", { nativeEvent: { pageY: 90 } });
    await fireEvent(item, "touchEnd", { nativeEvent: { pageY: 90 } });
    expect(screen.getByText("Fallo")).toBeOnTheScreen();

    await fireEvent(item, "touchStart", { nativeEvent: { pageY: 100 } });
    await fireEvent(item, "touchEnd", { nativeEvent: { pageY: 40 } });
    expect(screen.queryByText("Fallo")).toBeNull();
  });

  it("CA-107-15 · la acción ejecuta su función y cierra el aviso; cerrar también funciona", async () => {
    await setup();
    const onPress = jest.fn();

    await act(() => {
      toast().action("Archivada", {
        description: "Fuera del tablero",
        action: { label: "Deshacer", onPress },
      });
      toast().error("Fallo", { description: "Sin espacio" });
    });
    await advance(300);

    await fireEvent.press(screen.getByText("Deshacer"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Archivada")).toBeNull();

    await fireEvent.press(screen.getByLabelText("Cerrar aviso"));
    expect(screen.queryByText("Fallo")).toBeNull();
  });

  it("las promesas pasan de cargando a éxito en el mismo aviso", async () => {
    await setup();
    let resolve: () => void = () => undefined;
    const task = new Promise<void>((done) => {
      resolve = done;
    });

    await act(() => {
      void toast().promise(task, {
        loading: { title: "Restaurando" },
        success: { title: "Restaurado" },
        error: { title: "Fallo" },
      });
    });
    await advance(300);
    expect(screen.getByTestId("toast-loading")).toBeOnTheScreen();

    await act(async () => {
      resolve();
      await task;
    });
    expect(screen.queryByTestId("toast-loading")).toBeNull();
    expect(screen.getByText("Restaurado")).toBeOnTheScreen();
  });

  it("useToast fuera del proveedor avisa del error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(render(<Capture />)).rejects.toThrow("ToastProvider is missing");
  });
});
