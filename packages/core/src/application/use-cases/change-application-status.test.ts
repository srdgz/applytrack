import { beforeEach, describe, expect, it } from "vitest";

import {
  aSnapshot,
  calendarDate,
  FakeSessionProvider,
  FixedClock,
  InMemoryApplicationRepository,
} from "../../../testing";
import { Application } from "../../domain/application/application";
import { ChangeApplicationStatus } from "./change-application-status";

const created = "2026-10-01T12:00:00.000Z";
const now = "2026-10-05T12:00:00.000Z";

describe("ChangeApplicationStatus", () => {
  let repository: InMemoryApplicationRepository;
  let session: FakeSessionProvider;
  let changeStatus: ChangeApplicationStatus;

  beforeEach(async () => {
    repository = new InMemoryApplicationRepository();
    session = new FakeSessionProvider("owner-1");
    changeStatus = new ChangeApplicationStatus({
      repository,
      session,
      clock: new FixedClock(now),
    });
    await repository.save(
      Application.restore(aSnapshot({ id: "wish", status: "wishlist", updatedAt: created })),
    );
    await repository.save(
      Application.restore(
        aSnapshot({
          id: "applied",
          status: "applied",
          appliedAt: calendarDate("2026-09-20"),
          updatedAt: created,
        }),
      ),
    );
    repository.saveCount = 0;
  });

  it("CA-101-02 · un cambio válido actualiza el estado, la fecha y el historial", async () => {
    const result = await changeStatus.execute({
      id: "applied",
      to: "screening",
      note: "  Llamada con RR. HH.  ",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("screening");
    expect(result.value.updatedAt).toBe(now);
    expect(result.value.history.at(-1)).toEqual({
      from: "applied",
      to: "screening",
      changedAt: now,
      note: "Llamada con RR. HH.",
    });
    expect(result.value.appliedAt).toBe("2026-09-20");
    expect(repository.saveCount).toBe(1);
  });

  it("una nota vacía no se guarda", async () => {
    const result = await changeStatus.execute({ id: "applied", to: "rejected", note: "   " });

    expect(result.ok && result.value.history.at(-1)).not.toHaveProperty("note");
  });

  it("CA-101-03 · un cambio no permitido no guarda nada", async () => {
    expect(await changeStatus.execute({ id: "wish", to: "offer" })).toEqual({
      ok: false,
      error: { code: "INVALID_STATUS_TRANSITION", from: "wishlist", to: "offer" },
    });
    expect(await changeStatus.execute({ id: "wish", to: "wishlist" })).toMatchObject({
      ok: false,
      error: { code: "INVALID_STATUS_TRANSITION" },
    });
    expect(repository.saveCount).toBe(0);
  });

  it("CA-101-04 · al pasar a applied sin fecha, la rellena con el día del cambio", async () => {
    const result = await changeStatus.execute({ id: "wish", to: "applied" });

    expect(result.ok && result.value.appliedAt).toBe("2026-10-05");
  });

  it("CA-101-05 · una nota demasiado larga devuelve FIELD_TOO_LONG", async () => {
    expect(
      await changeStatus.execute({ id: "applied", to: "screening", note: "n".repeat(501) }),
    ).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        issues: [{ field: "note", code: "FIELD_TOO_LONG", meta: { max: 500 } }],
      },
    });
    expect(repository.saveCount).toBe(0);
  });

  it("CA-101-06 · estado desconocido, id ajeno o inexistente y falta de sesión", async () => {
    expect(await changeStatus.execute({ id: "applied", to: "hired" })).toEqual({
      ok: false,
      error: { code: "VALIDATION_FAILED", issues: [{ field: "to", code: "INVALID_OPTION" }] },
    });
    expect(await changeStatus.execute({ id: "missing", to: "screening" })).toEqual({
      ok: false,
      error: { code: "APPLICATION_NOT_FOUND" },
    });

    session.signInAs("owner-2");
    expect(await changeStatus.execute({ id: "applied", to: "screening" })).toEqual({
      ok: false,
      error: { code: "APPLICATION_NOT_FOUND" },
    });

    session.signOut();
    expect(await changeStatus.execute({ id: "applied", to: "screening" })).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED" },
    });
  });
});
