import { beforeEach, describe, expect, it } from "vitest";

import {
  aSnapshot,
  FakeSessionProvider,
  FixedClock,
  InMemoryApplicationRepository,
} from "../../../testing";
import { Application } from "../../domain/application/application";
import { ListTags } from "./list-tags";
import { SearchApplications } from "./search-applications";

describe("SearchApplications", () => {
  let repository: InMemoryApplicationRepository;
  let session: FakeSessionProvider;
  let search: SearchApplications;

  beforeEach(async () => {
    repository = new InMemoryApplicationRepository();
    session = new FakeSessionProvider("owner-1");
    search = new SearchApplications({
      repository,
      session,
      clock: new FixedClock("2026-10-05T12:00:00.000Z"),
    });

    for (const snapshot of [
      aSnapshot({ id: "fresh", status: "applied", updatedAt: "2026-10-05T12:00:00.000Z" }),
      aSnapshot({ id: "limit", status: "screening", updatedAt: "2026-09-21T12:00:00.000Z" }),
      aSnapshot({ id: "stale", status: "offer", updatedAt: "2026-09-20T12:00:00.000Z" }),
      aSnapshot({ id: "closed", status: "rejected", updatedAt: "2026-08-01T12:00:00.000Z" }),
    ]) {
      await repository.save(Application.restore(snapshot));
    }
  });

  it("aplica la consulta por defecto y añade los datos de resumen", async () => {
    const result = await search.execute();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ total: 4, offset: 0, limit: 50 });
    expect(
      result.value.items.map(({ id, daysSinceUpdate, stale }) => ({ id, daysSinceUpdate, stale })),
    ).toEqual([
      { id: "fresh", daysSinceUpdate: 0, stale: false },
      { id: "limit", daysSinceUpdate: 14, stale: false },
      { id: "stale", daysSinceUpdate: 15, stale: true },
      { id: "closed", daysSinceUpdate: 65, stale: false },
    ]);
  });

  it.each([
    [{ limit: 0 }, "limit"],
    [{ limit: 501 }, "limit"],
    [{ limit: 2.5 }, "limit"],
    [{ offset: -1 }, "offset"],
  ])("CA-102-08 · %o devuelve VALIDATION_FAILED", async (query, field) => {
    const result = await search.execute(query);

    expect(result).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_FAILED", issues: [{ field, code: "INVALID_OPTION" }] },
    });
  });

  it("acepta el límite máximo de 500", async () => {
    expect((await search.execute({ limit: 500 })).ok).toBe(true);
  });

  it("CA-102-14 · sin sesión devuelve UNAUTHENTICATED", async () => {
    session.signOut();

    expect(await search.execute()).toEqual({ ok: false, error: { code: "UNAUTHENTICATED" } });
    expect(await new ListTags({ repository, session }).execute()).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED" },
    });
  });
});

describe("ListTags", () => {
  it("devuelve las etiquetas de la persona usuaria", async () => {
    const repository = new InMemoryApplicationRepository();
    await repository.save(Application.restore(aSnapshot({ id: "a", tags: ["Vue", "Pinia"] })));

    expect(
      await new ListTags({ repository, session: new FakeSessionProvider("owner-1") }).execute(),
    ).toEqual({ ok: true, value: ["Pinia", "Vue"] });
  });
});
