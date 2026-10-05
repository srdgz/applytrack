import { describe, expect, it } from "vitest";

import { toApplicationId, toUserId } from "../shared/ids";
import { Application } from "./application";
import type { ApplicationDetails } from "./application-details";

const details: ApplicationDetails = {
  company: "Acme",
  position: "Frontend Developer",
  source: "linkedin",
  workMode: "remote",
  salary: { min: 30000, max: 36000, currency: "EUR" },
  tags: ["Vue"],
};

const created = new Date("2026-10-05T10:00:00.000Z");
const later = new Date("2026-10-06T09:00:00.000Z");

const build = () =>
  Application.create({
    id: toApplicationId("a-1"),
    ownerId: toUserId("u-1"),
    status: "wishlist",
    details,
    now: created,
  });

describe("Application", () => {
  it("se crea sin archivar y con el cambio de estado inicial en el historial", () => {
    expect(build().toSnapshot()).toEqual({
      ...details,
      id: "a-1",
      ownerId: "u-1",
      status: "wishlist",
      archived: false,
      history: [{ from: null, to: "wishlist", changedAt: created.toISOString() }],
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    });
  });

  it("expone id, propietario y estado", () => {
    const application = build();

    expect(application.id).toBe("a-1");
    expect(application.ownerId).toBe("u-1");
    expect(application.status).toBe("wishlist");
  });

  it("no cambia si los datos son los mismos", () => {
    const application = build();

    expect(application.updateDetails({ ...details, tags: ["Vue"] }, later)).toBe(false);
    expect(application.toSnapshot().updatedAt).toBe(created.toISOString());
  });

  it("actualiza los datos y la fecha de modificación, sin tocar estado ni historial", () => {
    const application = build();
    const before = application.toSnapshot();

    expect(application.updateDetails({ ...details, company: "Acme Labs" }, later)).toBe(true);

    const after = application.toSnapshot();
    expect(after.company).toBe("Acme Labs");
    expect(after.updatedAt).toBe(later.toISOString());
    expect(after.status).toBe(before.status);
    expect(after.history).toEqual(before.history);
    expect(after.createdAt).toBe(before.createdAt);
  });

  it("detecta como cambio quitar un campo opcional", () => {
    const application = build();
    const { salary: _salary, ...withoutSalary } = details;

    expect(application.updateDetails(withoutSalary, later)).toBe(true);
    expect(application.toSnapshot()).not.toHaveProperty("salary");
  });

  it("cada snapshot es una copia nueva que no comparte objetos con la entidad", () => {
    const application = build();
    const first = application.toSnapshot();
    const second = application.toSnapshot();

    expect(second).toEqual(first);
    expect(second.tags).not.toBe(first.tags);
    expect(second.salary).not.toBe(first.salary);
    expect(second.history).not.toBe(first.history);
    expect(second.history[0]).not.toBe(first.history[0]);
  });

  it("restore reconstruye la entidad a partir de un snapshot", () => {
    const snapshot = build().toSnapshot();

    expect(Application.restore(snapshot).toSnapshot()).toEqual(snapshot);
  });
});
