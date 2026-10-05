import { beforeEach, describe, expect, it } from "vitest";

import {
  FakeSessionProvider,
  FixedClock,
  InMemoryApplicationRepository,
  SequentialIdGenerator,
} from "../../../testing";
import type { ApplicationSnapshot } from "../../domain/application/application";
import type { ApplicationDetailsDraft } from "../../domain/application/application-draft";
import { CreateApplication } from "./create-application";
import { UpdateApplicationDetails } from "./update-application-details";

const details: ApplicationDetailsDraft = {
  company: "Acme",
  position: "Frontend Developer",
  source: "linkedin",
  workMode: "remote",
  appliedAt: "2026-10-01",
  tags: ["Vue"],
};

describe("UpdateApplicationDetails", () => {
  let repository: InMemoryApplicationRepository;
  let session: FakeSessionProvider;
  let clock: FixedClock;
  let updateDetails: UpdateApplicationDetails;
  let existing: ApplicationSnapshot;

  beforeEach(async () => {
    repository = new InMemoryApplicationRepository();
    session = new FakeSessionProvider("user-1");
    clock = new FixedClock("2026-10-05T10:00:00.000Z");

    const created = await new CreateApplication({
      repository,
      session,
      clock,
      ids: new SequentialIdGenerator(),
    }).execute({ ...details, status: "applied" });
    if (!created.ok) throw new Error("no se pudo crear la candidatura de prueba");
    existing = created.value;

    updateDetails = new UpdateApplicationDetails({ repository, session, clock });
    repository.saveCount = 0;
    clock.set("2026-10-06T08:00:00.000Z");
  });

  it("CA-100-12 · actualiza los datos y updatedAt sin tocar estado ni historial", async () => {
    const result = await updateDetails.execute({
      id: existing.id,
      details: { ...details, company: "Acme Labs", notes: "Hablar con Laura" },
    });

    expect(result.ok).toBe(true);
    const saved = repository.all()[0];
    expect(saved?.company).toBe("Acme Labs");
    expect(saved?.notes).toBe("Hablar con Laura");
    expect(saved?.updatedAt).toBe("2026-10-06T08:00:00.000Z");
    expect(saved?.status).toBe(existing.status);
    expect(saved?.history).toEqual(existing.history);
    expect(repository.saveCount).toBe(1);
  });

  it("CA-100-11 · sin cambios no guarda ni modifica updatedAt", async () => {
    const result = await updateDetails.execute({
      id: existing.id,
      details: { ...details, company: "  Acme  " },
    });

    expect(result).toEqual({ ok: true, value: existing });
    expect(repository.saveCount).toBe(0);
  });

  it("valida con el estado actual de la candidatura", async () => {
    const result = await updateDetails.execute({
      id: existing.id,
      details: { ...details, appliedAt: "2026-12-01" },
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION_FAILED", issues: [{ field: "appliedAt", code: "FUTURE_DATE" }] },
    });
    expect(repository.saveCount).toBe(0);
  });

  it("CA-100-10 · la candidatura de otra persona no se encuentra", async () => {
    session.signInAs("user-2");

    expect(await updateDetails.execute({ id: existing.id, details })).toEqual({
      ok: false,
      error: { code: "APPLICATION_NOT_FOUND" },
    });
  });

  it("un id inexistente no se encuentra", async () => {
    expect(await updateDetails.execute({ id: "missing", details })).toEqual({
      ok: false,
      error: { code: "APPLICATION_NOT_FOUND" },
    });
  });

  it("CA-100-09 · sin sesión devuelve UNAUTHENTICATED y no guarda nada", async () => {
    session.signOut();

    expect(await updateDetails.execute({ id: existing.id, details })).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED" },
    });
    expect(repository.saveCount).toBe(0);
  });
});
