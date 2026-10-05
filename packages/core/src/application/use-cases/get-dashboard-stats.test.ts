import { describe, expect, it } from "vitest";

import {
  aSnapshot,
  FakeSessionProvider,
  FixedClock,
  InMemoryApplicationRepository,
} from "../../../testing";
import { Application } from "../../domain/application/application";
import { GetDashboardStats } from "./get-dashboard-stats";

const setup = async (count: number) => {
  const repository = new InMemoryApplicationRepository();
  const session = new FakeSessionProvider("owner-1");
  for (let index = 0; index < count; index += 1) {
    await repository.save(
      Application.restore(
        aSnapshot({ id: `a-${String(index)}`, archived: index % 2 === 0, status: "applied" }),
      ),
    );
  }
  await repository.save(Application.restore(aSnapshot({ id: "other", ownerId: "owner-2" })));
  const getStats = new GetDashboardStats({
    repository,
    session,
    clock: new FixedClock("2026-10-05T12:00:00.000Z"),
  });
  return { getStats, session };
};

describe("GetDashboardStats", () => {
  it("lee todas las candidaturas, archivadas incluidas, aunque haya más de una página", async () => {
    const { getStats } = await setup(1203);

    const result = await getStats.execute();

    expect(result.ok && result.value.total).toBe(1203);
  });

  it("CA-105-08 · no incluye candidaturas de otra persona", async () => {
    const { getStats } = await setup(0);

    expect(await getStats.execute()).toMatchObject({ ok: true, value: { total: 0 } });
  });

  it("CA-105-08 · sin sesión devuelve UNAUTHENTICATED", async () => {
    const { getStats, session } = await setup(1);
    session.signOut();

    expect(await getStats.execute()).toEqual({ ok: false, error: { code: "UNAUTHENTICATED" } });
  });
});
