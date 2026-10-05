import { describe, expect, it } from "vitest";

import { aSnapshot, FakeSessionProvider, InMemoryApplicationRepository } from "../../../testing";
import { Application } from "../../domain/application/application";
import { GetApplication } from "./get-application";

const setup = async () => {
  const repository = new InMemoryApplicationRepository();
  const session = new FakeSessionProvider("owner-1");
  const snapshot = aSnapshot({ id: "a-1" });
  await repository.save(Application.restore(snapshot));
  return { getApplication: new GetApplication({ repository, session }), session, snapshot };
};

describe("GetApplication", () => {
  it("devuelve la candidatura de la persona usuaria", async () => {
    const { getApplication, snapshot } = await setup();

    expect(await getApplication.execute({ id: "a-1" })).toEqual({ ok: true, value: snapshot });
  });

  it("no encuentra un id inexistente ni la candidatura de otra persona", async () => {
    const { getApplication, session } = await setup();
    const notFound = { ok: false, error: { code: "APPLICATION_NOT_FOUND" } };

    expect(await getApplication.execute({ id: "missing" })).toEqual(notFound);
    session.signInAs("owner-2");
    expect(await getApplication.execute({ id: "a-1" })).toEqual(notFound);
  });

  it("sin sesión devuelve UNAUTHENTICATED", async () => {
    const { getApplication, session } = await setup();
    session.signOut();

    expect(await getApplication.execute({ id: "a-1" })).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED" },
    });
  });
});
