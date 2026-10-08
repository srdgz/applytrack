import { MemoryKeyValueStore } from "@applytrack/adapter-local";
import type { Email } from "@applytrack/core";
import { Application, toApplicationId, toUserId } from "@applytrack/core";
import {
  FakeAuthGateway,
  FakeSessionProvider,
  FixedClock,
  InMemoryApplicationRepository,
  InMemoryPreferencesStore,
} from "@applytrack/core/testing";
import { describe, expect, it } from "vitest";

import { createContainer } from "./container";

const clock = new FixedClock("2026-10-05T12:00:00.000Z");

const signedIn = () => {
  const repository = new InMemoryApplicationRepository();
  const profile = new InMemoryPreferencesStore({ locale: "en", theme: "dark" });
  return {
    repository,
    profile,
    signedIn: {
      account: { userId: toUserId("user-ana"), email: "ana@mail.com" as Email },
      adapters: { repository, session: new FakeSessionProvider("user-ana"), profile },
    },
  };
};

describe("createContainer", () => {
  it("sin cuenta usa el almacenamiento local y la demo", async () => {
    const store = new MemoryKeyValueStore();
    const useCases = createContainer({ store, clock });

    expect(useCases.account).toBeNull();
    expect(useCases.accountsEnabled).toBe(false);
    expect(await useCases.isDemoActive.execute()).toBe(false);

    await useCases.startDemo.execute("es");
    const page = await useCases.searchApplications.execute({});

    expect(page.ok && page.value.total).toBeGreaterThan(0);
    expect(await store.getItem("applytrack:demo:v1")).not.toBeNull();

    const created = await useCases.createApplication.execute({
      company: "Nueva",
      position: "Dev",
      source: "linkedin",
      workMode: "remote",
      status: "wishlist",
      tags: [],
    });
    expect(created.ok && created.value.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("sin servicio de cuentas, entrar devuelve AUTH_UNAVAILABLE", async () => {
    const useCases = createContainer({ store: new MemoryKeyValueStore(), clock });

    expect(
      await useCases.requestSignIn.execute({ email: "ana@mail.com", redirectTo: "x" }),
    ).toEqual({ ok: false, error: { code: "AUTH_UNAVAILABLE" } });
    expect(await useCases.getCurrentAccount.execute()).toBeNull();
    await expect(useCases.signOut.execute()).resolves.toBeUndefined();
    expect(
      await useCases.verifySignInCode.execute({ email: "ana@mail.com", code: "123456" }),
    ).toEqual({ ok: false, error: { code: "AUTH_UNAVAILABLE" } });
    expect(await useCases.completeSignIn.execute({ linkCode: "abc" })).toEqual({
      ok: false,
      error: { code: "AUTH_UNAVAILABLE" },
    });
  });

  it("con servicio de cuentas, las cuentas están disponibles", () => {
    const useCases = createContainer({
      store: new MemoryKeyValueStore(),
      clock,
      auth: new FakeAuthGateway(),
    });

    expect(useCases.accountsEnabled).toBe(true);
  });

  it("con cuenta usa el repositorio y el perfil de la cuenta", async () => {
    const { repository, signedIn: account } = signedIn();
    await repository.save(
      Application.create({
        id: toApplicationId("a-1"),
        ownerId: toUserId("user-ana"),
        status: "wishlist",
        details: {
          company: "Acme",
          position: "Dev",
          source: "linkedin",
          workMode: "remote",
          tags: [],
        },
        now: new Date("2026-10-05T10:00:00.000Z"),
      }),
    );
    const store = new MemoryKeyValueStore();

    const useCases = createContainer({
      store,
      clock,
      auth: new FakeAuthGateway(),
      signedIn: account,
    });

    expect(useCases.account?.email).toBe("ana@mail.com");
    const page = await useCases.searchApplications.execute({});
    expect(page.ok && page.value.items.map(({ company }) => company)).toEqual(["Acme"]);
    expect(
      await useCases.getPreferences.execute({ fallback: { locale: "es", theme: "system" } }),
    ).toEqual({ locale: "en", theme: "dark" });
    expect(await store.getItem("applytrack:theme")).toBe("dark");
    expect(useCases.today()).toBe("2026-10-05");
  });
});
