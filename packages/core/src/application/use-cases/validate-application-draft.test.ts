import { describe, expect, it } from "vitest";

import {
  FakeSessionProvider,
  FixedClock,
  InMemoryApplicationRepository,
  SequentialIdGenerator,
} from "../../../testing";
import type { ApplicationDraft } from "../../domain/application/application-draft";
import { CreateApplication } from "./create-application";
import { ValidateApplicationDraft } from "./validate-application-draft";

const clock = new FixedClock("2026-10-05T10:00:00.000Z");
const validateDraft = new ValidateApplicationDraft({ clock });

const invalidDraft: ApplicationDraft = {
  company: "",
  position: "p".repeat(121),
  source: "linkedin",
  workMode: "remote",
  status: "wishlist",
  appliedAt: "2026-10-01",
  salary: { min: 50000, max: 40000, currency: "GBP" },
};

const validFields = {
  company: "Acme",
  position: "Frontend Developer",
  appliedAt: undefined,
  salary: { min: 40000, max: 50000, currency: "GBP" },
};

describe("ValidateApplicationDraft", () => {
  it("devuelve una lista vacía si el borrador es válido", () => {
    expect(validateDraft.execute({ draft: { ...invalidDraft, ...validFields } })).toEqual([]);
  });

  it("CA-100-13 · devuelve los mismos errores que CreateApplication", async () => {
    const createApplication = new CreateApplication({
      repository: new InMemoryApplicationRepository(),
      session: new FakeSessionProvider(),
      clock,
      ids: new SequentialIdGenerator(),
    });

    const created = await createApplication.execute(invalidDraft);
    const issues = validateDraft.execute({ draft: invalidDraft });

    expect(issues).toHaveLength(4);
    expect(created).toEqual({ ok: false, error: { code: "VALIDATION_FAILED", issues } });
  });

  it("al editar valida con el estado actual", () => {
    const { status: _status, ...details } = { ...invalidDraft, ...validFields };

    expect(
      validateDraft.execute({
        draft: { ...details, appliedAt: "2026-10-01" },
        currentStatus: "wishlist",
      }),
    ).toEqual([{ field: "appliedAt", code: "APPLIED_AT_NOT_ALLOWED" }]);
    expect(
      validateDraft.execute({
        draft: { ...details, appliedAt: "2026-10-01" },
        currentStatus: "interviewing",
      }),
    ).toEqual([]);
  });
});
