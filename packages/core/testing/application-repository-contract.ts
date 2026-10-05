import { describe, expect, it } from "vitest";

import type { ApplicationRepository } from "../src";
import { Application, toApplicationId, toUserId } from "../src";
import { calendarDate } from "./calendar-date";

const owner = toUserId("owner-1");
const otherOwner = toUserId("owner-2");

const buildApplication = (id: string) =>
  Application.create({
    id: toApplicationId(id),
    ownerId: owner,
    status: "applied",
    details: {
      company: "Acme",
      position: "Frontend Developer",
      source: "linkedin",
      workMode: "remote",
      jobUrl: "https://acme.example/jobs/1",
      salary: { min: 30000, max: 36000, currency: "EUR" },
      appliedAt: calendarDate("2026-10-01"),
      tags: ["Vue", "TypeScript"],
      notes: "Primera llamada con RR. HH.",
    },
    now: new Date("2026-10-05T10:00:00.000Z"),
  });

export const describeApplicationRepositoryContract = (
  name: string,
  createRepository: () => ApplicationRepository | Promise<ApplicationRepository>,
): void => {
  describe(`${name} cumple el contrato de ApplicationRepository`, () => {
    it("recupera lo guardado con el mismo snapshot", async () => {
      const repository = await createRepository();
      const application = buildApplication("a-1");

      await repository.save(application);
      const found = await repository.findById(owner, application.id);

      expect(found?.toSnapshot()).toEqual(application.toSnapshot());
    });

    it("guardar dos veces el mismo id actualiza en lugar de duplicar", async () => {
      const repository = await createRepository();
      const application = buildApplication("a-1");
      await repository.save(application);

      application.updateDetails(
        { ...application.toSnapshot(), company: "Acme Labs" },
        new Date("2026-10-06T10:00:00.000Z"),
      );
      await repository.save(application);
      const found = await repository.findById(owner, application.id);

      expect(found?.toSnapshot().company).toBe("Acme Labs");
    });

    it("no devuelve candidaturas de otra persona", async () => {
      const repository = await createRepository();
      const application = buildApplication("a-1");
      await repository.save(application);

      expect(await repository.findById(otherOwner, application.id)).toBeNull();
    });

    it("devuelve null si el id no existe", async () => {
      const repository = await createRepository();

      expect(await repository.findById(owner, toApplicationId("missing"))).toBeNull();
    });

    it("lo recuperado no comparte estado con lo guardado", async () => {
      const repository = await createRepository();
      const application = buildApplication("a-1");
      await repository.save(application);

      application.updateDetails(
        { ...application.toSnapshot(), company: "Cambiada sin guardar" },
        new Date("2026-10-06T10:00:00.000Z"),
      );
      const found = await repository.findById(owner, application.id);

      expect(found?.toSnapshot().company).toBe("Acme");
    });
  });
};
