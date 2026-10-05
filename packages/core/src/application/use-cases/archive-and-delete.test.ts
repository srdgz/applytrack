import { beforeEach, describe, expect, it } from "vitest";

import { aSnapshot, FakeSessionProvider, InMemoryApplicationRepository } from "../../../testing";
import { Application } from "../../domain/application/application";
import { ArchiveApplication, UnarchiveApplication } from "./archive-application";
import { DeleteApplication } from "./delete-application";

const updatedAt = "2026-09-01T12:00:00.000Z";

describe("archivar y eliminar", () => {
  let repository: InMemoryApplicationRepository;
  let session: FakeSessionProvider;

  beforeEach(async () => {
    repository = new InMemoryApplicationRepository();
    session = new FakeSessionProvider("owner-1");
    await repository.save(Application.restore(aSnapshot({ id: "a-1", updatedAt })));
    repository.saveCount = 0;
  });

  const deps = () => ({ repository, session });

  it("CA-106-01 · archivar guarda sin tocar la fecha ni el historial, y no repite", async () => {
    const archive = new ArchiveApplication(deps());

    const result = await archive.execute({ id: "a-1" });

    expect(result).toMatchObject({ ok: true, value: { archived: true, updatedAt } });
    expect(result.ok && result.value.history).toHaveLength(1);
    expect(repository.saveCount).toBe(1);

    await archive.execute({ id: "a-1" });
    expect(repository.saveCount).toBe(1);
  });

  it("CA-106-02 · desarchivar hace lo contrario con las mismas garantías", async () => {
    await new ArchiveApplication(deps()).execute({ id: "a-1" });
    const unarchive = new UnarchiveApplication(deps());

    expect(await unarchive.execute({ id: "a-1" })).toMatchObject({
      ok: true,
      value: { archived: false, updatedAt },
    });
    expect(repository.saveCount).toBe(2);

    await unarchive.execute({ id: "a-1" });
    expect(repository.saveCount).toBe(2);
  });

  it("CA-106-03 · eliminar borra la candidatura", async () => {
    expect(await new DeleteApplication(deps()).execute({ id: "a-1" })).toEqual({
      ok: true,
      value: undefined,
    });
    expect(repository.all()).toEqual([]);
  });

  it("CA-106-04 · con un id inexistente o ajeno no cambia nada", async () => {
    const notFound = { ok: false, error: { code: "APPLICATION_NOT_FOUND" } };

    expect(await new ArchiveApplication(deps()).execute({ id: "missing" })).toEqual(notFound);
    expect(await new UnarchiveApplication(deps()).execute({ id: "missing" })).toEqual(notFound);
    expect(await new DeleteApplication(deps()).execute({ id: "missing" })).toEqual(notFound);

    session.signInAs("owner-2");
    expect(await new ArchiveApplication(deps()).execute({ id: "a-1" })).toEqual(notFound);
    expect(await new DeleteApplication(deps()).execute({ id: "a-1" })).toEqual(notFound);
    expect(repository.all()).toHaveLength(1);
    expect(repository.saveCount).toBe(0);
  });

  it("CA-106-04 · sin sesión devuelven UNAUTHENTICATED", async () => {
    session.signOut();
    const unauthenticated = { ok: false, error: { code: "UNAUTHENTICATED" } };

    expect(await new ArchiveApplication(deps()).execute({ id: "a-1" })).toEqual(unauthenticated);
    expect(await new UnarchiveApplication(deps()).execute({ id: "a-1" })).toEqual(unauthenticated);
    expect(await new DeleteApplication(deps()).execute({ id: "a-1" })).toEqual(unauthenticated);
  });

  it("una candidatura archivada se puede seguir cambiando de estado", () => {
    const application = Application.restore(aSnapshot({ id: "x", status: "applied" }));
    application.archive();

    expect(application.changeStatus("screening", new Date(updatedAt)).ok).toBe(true);
    expect(application.archived).toBe(true);
  });
});
