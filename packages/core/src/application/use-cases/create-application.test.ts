import { beforeEach, describe, expect, it } from "vitest";

import {
  FakeSessionProvider,
  FixedClock,
  InMemoryApplicationRepository,
  SequentialIdGenerator,
} from "../../../testing";
import type { ApplicationDraft } from "../../domain/application/application-draft";
import { CreateApplication } from "./create-application";

const validDraft: ApplicationDraft = {
  company: "Acme",
  position: "Frontend Developer",
  source: "linkedin",
  workMode: "remote",
  status: "wishlist",
};

describe("CreateApplication", () => {
  let repository: InMemoryApplicationRepository;
  let session: FakeSessionProvider;
  let createApplication: CreateApplication;

  beforeEach(() => {
    repository = new InMemoryApplicationRepository();
    session = new FakeSessionProvider("user-1");
    createApplication = new CreateApplication({
      repository,
      session,
      clock: new FixedClock("2026-10-05T10:00:00.000Z"),
      ids: new SequentialIdGenerator(),
    });
  });

  it("CA-100-01 · crea una candidatura en wishlist sin fecha de candidatura", async () => {
    const result = await createApplication.execute(validDraft);

    expect(result).toEqual({
      ok: true,
      value: {
        id: "app-1",
        ownerId: "user-1",
        company: "Acme",
        position: "Frontend Developer",
        source: "linkedin",
        workMode: "remote",
        status: "wishlist",
        tags: [],
        archived: false,
        history: [{ from: null, to: "wishlist", changedAt: "2026-10-05T10:00:00.000Z" }],
        createdAt: "2026-10-05T10:00:00.000Z",
        updatedAt: "2026-10-05T10:00:00.000Z",
      },
    });
    expect(repository.all()).toHaveLength(1);
  });

  it("CA-100-02 · con estado applied usa la fecha de hoy", async () => {
    const result = await createApplication.execute({ ...validDraft, status: "applied" });

    expect(result.ok && result.value.appliedAt).toBe("2026-10-05");
  });

  it("CA-100-03 · devuelve todos los errores y no guarda nada", async () => {
    const result = await createApplication.execute({
      ...validDraft,
      company: "",
      status: "offer",
      tags: ["Vue", "vue"],
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        issues: [
          { field: "status", code: "INVALID_OPTION" },
          { field: "company", code: "REQUIRED_FIELD" },
          { field: "tags.1", code: "DUPLICATED_TAG", meta: { tag: "vue" } },
        ],
      },
    });
    expect(repository.saveCount).toBe(0);
  });

  it("CA-100-09 · sin sesión devuelve UNAUTHENTICATED y no guarda nada", async () => {
    session.signOut();

    expect(await createApplication.execute(validDraft)).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED" },
    });
    expect(repository.saveCount).toBe(0);
  });
});
