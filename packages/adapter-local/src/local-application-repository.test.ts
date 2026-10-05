import { Application, toApplicationId, toUserId } from "@applytrack/core";
import { describeApplicationRepositoryContract } from "@applytrack/core/testing";
import { describe, expect, it } from "vitest";

import { DemoStorage } from "./demo-storage";
import { MemoryKeyValueStore } from "./key-value-store";
import { LocalApplicationRepository } from "./local-application-repository";
import { StorageFullError } from "./storage-full-error";

const owner = toUserId("demo-user");

const build = (id: string, company = "Acme") =>
  Application.create({
    id: toApplicationId(id),
    ownerId: owner,
    status: "wishlist",
    details: { company, position: "Dev", source: "linkedin", workMode: "remote", tags: [] },
    now: new Date("2026-10-05T10:00:00.000Z"),
  });

const repositoryOn = (store: MemoryKeyValueStore) =>
  new LocalApplicationRepository(new DemoStorage(store));

describeApplicationRepositoryContract("LocalApplicationRepository", () =>
  repositoryOn(new MemoryKeyValueStore()),
);

describe("LocalApplicationRepository", () => {
  it("CA-103-11 · dos instancias sobre el mismo almacén no pierden los cambios de la otra", async () => {
    const store = new MemoryKeyValueStore();
    const firstTab = repositoryOn(store);
    const secondTab = repositoryOn(store);

    await firstTab.save(build("a-1"));
    await secondTab.save(build("a-2"));
    await firstTab.save(build("a-3"));

    for (const id of ["a-1", "a-2", "a-3"]) {
      expect(await secondTab.findById(owner, toApplicationId(id))).not.toBeNull();
    }
  });

  it("CA-103-12 · dos guardados a la vez en la misma instancia se guardan los dos", async () => {
    const repository = repositoryOn(new MemoryKeyValueStore());

    await Promise.all([repository.save(build("a-1")), repository.save(build("a-2"))]);

    expect(await repository.findById(owner, toApplicationId("a-1"))).not.toBeNull();
    expect(await repository.findById(owner, toApplicationId("a-2"))).not.toBeNull();
  });

  it("CA-103-13 · si el almacén rechaza la escritura lanza StorageFullError", async () => {
    const store = new MemoryKeyValueStore();
    const repository = repositoryOn(store);
    store.failWrites = true;

    await expect(repository.save(build("a-1"))).rejects.toBeInstanceOf(StorageFullError);
  });

  it("tras un error de escritura la cola sigue funcionando", async () => {
    const store = new MemoryKeyValueStore();
    const repository = repositoryOn(store);
    store.failWrites = true;
    await expect(repository.save(build("a-1"))).rejects.toThrow();

    store.failWrites = false;
    await repository.save(build("a-2"));

    expect(await repository.findById(owner, toApplicationId("a-2"))).not.toBeNull();
  });
});
