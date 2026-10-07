import { MemoryKeyValueStore } from "@applytrack/adapter-local";
import type { Account, Email } from "@applytrack/core";
import { toUserId } from "@applytrack/core";
import {
  FakeAuthGateway,
  FakeSessionProvider,
  FixedClock,
  InMemoryApplicationRepository,
  InMemoryPreferencesStore,
} from "@applytrack/core/testing";
import { screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createWebHistory } from "vue-router";

import { createApplyTrackApp } from "./app";
import type { ContainerOptions } from "./di/container";
import { createContainer } from "./di/container";

const mounted: (() => void)[] = [];

const ana: Account = { userId: toUserId("user-ana"), email: "ana@mail.com" as Email };

interface StartOptions {
  readonly auth?: FakeAuthGateway;
  readonly signedIn?: boolean;
  readonly profile?: InMemoryPreferencesStore;
  readonly store?: MemoryKeyValueStore;
}

const startApp = async (path: string, options: StartOptions = {}) => {
  const store = options.store ?? new MemoryKeyValueStore();
  const navigate = vi.fn<(path: string) => void>();
  const containerOptions: ContainerOptions = {
    store,
    clock: new FixedClock("2026-10-05T12:00:00.000Z"),
    ...(options.auth && { auth: options.auth }),
    ...(options.signedIn && {
      signedIn: {
        account: ana,
        adapters: {
          repository: new InMemoryApplicationRepository(),
          session: new FakeSessionProvider("user-ana"),
          profile: options.profile ?? new InMemoryPreferencesStore(),
        },
      },
    }),
  };
  const useCases = createContainer(containerOptions);
  window.history.replaceState(null, "", "/");
  const { app, router } = createApplyTrackApp({
    useCases,
    history: createWebHistory(),
    preferences: { locale: "es", theme: "system" },
    navigate,
  });
  const container = document.createElement("div");
  document.body.append(container);
  app.mount(container);
  mounted.push(() => {
    app.unmount();
    container.remove();
  });
  await router.replace(path);
  await router.isReady();
  return { router, navigate, store };
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.sessionStorage.clear();
  delete document.documentElement.dataset.theme;
  mounted.splice(0).forEach((unmount) => {
    unmount();
  });
});

describe("Entrar", () => {
  it("CA-104-15 · sin Supabase configurado, «Entrar» está desactivado y lo explica", async () => {
    await startApp("/");

    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Entrar" }).disabled).toBe(true);
    expect(screen.getByText("Las cuentas no están configuradas en este entorno.")).toBeTruthy();
  });

  it("CA-104-16 · valida el email y pasa al paso del código con el reenvío bloqueado", async () => {
    const auth = new FakeAuthGateway();
    const { router } = await startApp("/", { auth });

    await userEvent.click(screen.getByRole("link", { name: "Entrar" }));
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("sign-in");
    });

    await userEvent.type(screen.getByLabelText(/Email/), "ana@");
    await userEvent.click(screen.getByRole("button", { name: "Enviarme el enlace" }));
    expect(
      await screen.findByText("Introduce un email válido, como nombre@ejemplo.com."),
    ).toBeTruthy();
    expect(auth.requests).toEqual([]);

    await userEvent.type(screen.getByLabelText(/Email/), "mail.com");
    await userEvent.click(screen.getByRole("button", { name: "Enviarme el enlace" }));

    expect(await screen.findByRole("heading", { name: "Revisa tu correo" })).toBeTruthy();
    expect(auth.requests).toEqual([
      { email: "ana@mail.com", redirectTo: `${window.location.origin}/auth/callback` },
    ]);
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Puedes reenviarlo en 60 s" }).disabled,
    ).toBe(true);
    expect(document.activeElement).toBe(screen.getByLabelText(/Código de 6 dígitos/));
  });

  it("CA-104-17 · con un código inválido avisa y con el correcto entra en el tablero", async () => {
    const auth = new FakeAuthGateway();
    const { navigate } = await startApp("/sign-in?email=ana@mail.com", { auth });

    await userEvent.click(screen.getByRole("button", { name: "Enviarme el enlace" }));
    const code = await screen.findByLabelText(/Código de 6 dígitos/);

    await userEvent.type(code, "654321");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(
      await screen.findByText("El código no es válido o ha caducado.", {
        selector: "p[role=alert]",
      }),
    ).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();

    await userEvent.clear(code);
    await userEvent.type(code, "123 456");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/board");
    });
    expect(window.sessionStorage.getItem("applytrack:notice")).toContain("ana@mail.com");
  });

  it("explica el límite de correos", async () => {
    const auth = new FakeAuthGateway();
    auth.failure = "RATE_LIMITED";
    await startApp("/sign-in", { auth });

    await userEvent.type(screen.getByLabelText(/Email/), "ana@mail.com");
    await userEvent.click(screen.getByRole("button", { name: "Enviarme el enlace" }));

    expect(
      await screen.findByText("Has pedido demasiados correos. Espera unos minutos.", {
        selector: "p[role=alert]",
      }),
    ).toBeTruthy();
  });

  it("al terminar la cuenta atrás se puede reenviar y se anuncia", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const auth = new FakeAuthGateway();
    await startApp("/sign-in?email=ana@mail.com", { auth });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });

    await user.click(screen.getByRole("button", { name: "Enviarme el enlace" }));
    await screen.findByRole("heading", { name: "Revisa tu correo" });
    await vi.advanceTimersByTimeAsync(60_000);

    const resend = await screen.findByRole("button", { name: "Reenviar el correo" });
    expect((resend as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText("Ya puedes reenviar el correo.")).toBeTruthy();
    await user.click(resend);
    await waitFor(() => {
      expect(auth.requests).toHaveLength(2);
    });

    await user.click(screen.getByRole("button", { name: "Usar otro email" }));
    expect(await screen.findByRole("heading", { name: "Entra en ApplyTrack" })).toBeTruthy();
  });
});

describe("Con cuenta", () => {
  it("CA-104-20 · el inicio y «Entrar» llevan al tablero", async () => {
    const { router } = await startApp("/", { signedIn: true });
    expect(router.currentRoute.value.name).toBe("board");

    await router.push("/sign-in");
    expect(router.currentRoute.value.name).toBe("board");
  });

  it("CA-104-19 · sin aviso de demo, con el email y «Cerrar sesión», que vuelve al inicio", async () => {
    const { navigate } = await startApp("/settings", { signedIn: true });

    expect(screen.queryByText(/modo demo/i)).toBeNull();
    expect(screen.getByText("Has entrado como ana@mail.com.")).toBeTruthy();

    await userEvent.click(
      screen.getAllByRole("button", { name: "Cerrar sesión" })[0] as HTMLElement,
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/");
    });
    expect(window.sessionStorage.getItem("applytrack:notice")).toBe('{"kind":"signedOut"}');
  });

  it("muestra el aviso pendiente después de recargar", async () => {
    window.sessionStorage.setItem(
      "applytrack:notice",
      JSON.stringify({ kind: "signedIn", email: "ana@mail.com" }),
    );

    await startApp("/board", { signedIn: true });

    expect(await screen.findByText("Has entrado como ana@mail.com")).toBeTruthy();
    expect(window.sessionStorage.getItem("applytrack:notice")).toBeNull();
  });

  it("CA-104-18 · la vuelta del enlace con sesión entra en el tablero", async () => {
    const { router } = await startApp("/auth/callback", { signedIn: true });

    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("board");
    });
  });

  it("si el perfil falla, avisa de que solo se ha guardado en el dispositivo", async () => {
    const profile = new InMemoryPreferencesStore({ locale: "es", theme: "system" });
    profile.failing = true;
    const { store } = await startApp("/settings", { signedIn: true, profile });

    await userEvent.click(screen.getByRole("radio", { name: "Oscuro" }));

    expect(
      await screen.findByText("Guardado en este dispositivo, pero no en tu cuenta"),
    ).toBeTruthy();
    expect(await store.getItem("applytrack:theme")).toBe("dark");
  });
});

describe("Vuelta del enlace sin sesión", () => {
  it("CA-104-18 · explica el fallo y ofrece volver a entrar", async () => {
    await startApp("/auth/callback", { auth: new FakeAuthGateway() });

    expect(
      screen.getByRole("heading", { name: "No se ha podido entrar con este enlace" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Volver a entrar" }).getAttribute("href")).toBe(
      "/sign-in",
    );
  });
});

describe("Tema", () => {
  it("CA-104-21 · se aplica al momento, se guarda y «Sistema» quita la preferencia", async () => {
    const store = new MemoryKeyValueStore();
    const demo = createContainer({ store, clock: new FixedClock("2026-10-05T12:00:00.000Z") });
    await demo.startDemo.execute("es");
    await startApp("/settings", { store });

    await userEvent.click(screen.getByRole("radio", { name: "Oscuro" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("radio", { name: "Oscuro" }).getAttribute("aria-checked")).toBe("true");
    await waitFor(async () => {
      expect(await store.getItem("applytrack:theme")).toBe("dark");
    });

    await userEvent.keyboard("{ArrowRight}");
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Sistema" }));

    await userEvent.keyboard("{ArrowRight}");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
