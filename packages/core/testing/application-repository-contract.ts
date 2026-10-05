import { describe, expect, it } from "vitest";

import type { ApplicationQuery, ApplicationRepository } from "../src";
import { Application, completeQuery, toApplicationId, toUserId } from "../src";
import { calendarDate } from "./calendar-date";
import { aSnapshot } from "./snapshot-builder";

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

const searchFixtures = [
  aSnapshot({
    id: "s-01",
    company: "Brisa Health",
    position: "Ingeniería Frontend",
    tags: ["Vue"],
    status: "applied",
    workMode: "remote",
    source: "linkedin",
    appliedAt: calendarDate("2026-09-20"),
    updatedAt: "2026-09-20T09:00:00.000Z",
  }),
  aSnapshot({
    id: "s-02",
    company: "Árbol Studio",
    position: "Frontend Developer",
    tags: ["React", "vue"],
    status: "screening",
    workMode: "hybrid",
    source: "referral",
    appliedAt: calendarDate("2026-09-10"),
    updatedAt: "2026-09-25T09:00:00.000Z",
  }),
  aSnapshot({
    id: "s-03",
    company: "Cobalto",
    position: "Backend Developer",
    tags: ["Java"],
    status: "wishlist",
    workMode: "onsite",
    source: "infojobs",
    updatedAt: "2026-09-25T09:00:00.000Z",
  }),
  aSnapshot({
    id: "s-04",
    company: "delta",
    position: "Mobile Developer",
    tags: ["React Native"],
    status: "rejected",
    workMode: "remote",
    source: "linkedin",
    appliedAt: calendarDate("2026-08-01"),
    updatedAt: "2026-09-01T09:00:00.000Z",
    archived: true,
  }),
  aSnapshot({
    id: "s-05",
    company: "Echo Labs",
    position: "Frontend Lead",
    status: "wishlist",
    workMode: "remote",
    source: "other",
    updatedAt: "2026-09-30T09:00:00.000Z",
  }),
  aSnapshot({
    id: "s-06",
    ownerId: "owner-2",
    company: "Brisa Health",
    position: "Frontend",
    tags: ["Secreto"],
    updatedAt: "2026-10-02T09:00:00.000Z",
  }),
];

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
      expect((await repository.search(owner, completeQuery())).total).toBe(1);
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

    describe("search", () => {
      const withFixtures = async () => {
        const repository = await createRepository();
        for (const snapshot of searchFixtures) {
          await repository.save(Application.restore(snapshot));
        }
        return repository;
      };

      const ids = async (query: Partial<ApplicationQuery>) => {
        const repository = await withFixtures();
        const page = await repository.search(owner, completeQuery(query));
        return page.items.map((application) => application.id);
      };

      it("CA-102-01 · sin filtros devuelve las no archivadas por última actualización", async () => {
        const repository = await withFixtures();
        const page = await repository.search(owner, completeQuery());

        expect(page.items.map(({ id }) => id)).toEqual(["s-05", "s-02", "s-03", "s-01"]);
        expect(page).toMatchObject({ total: 4, offset: 0, limit: 50 });
      });

      it("CA-102-02 · cada palabra del texto tiene que aparecer en algún campo", async () => {
        expect(await ids({ text: "fron vue" })).toEqual(["s-02", "s-01"]);
      });

      it("CA-102-03 · el texto no distingue mayúsculas ni tildes", async () => {
        expect(await ids({ text: "INGENIERIA" })).toEqual(["s-01"]);
        expect(await ids({ text: "arbol" })).toEqual(["s-02"]);
        expect(await ids({ text: "   " })).toEqual(["s-05", "s-02", "s-03", "s-01"]);
      });

      it("CA-102-04 · filtros distintos se combinan con Y y valores del mismo filtro con O", async () => {
        expect(await ids({ workModes: ["remote"], statuses: ["applied", "wishlist"] })).toEqual([
          "s-05",
          "s-01",
        ]);
        expect(await ids({ sources: ["referral", "infojobs"] })).toEqual(["s-02", "s-03"]);
        expect(await ids({ tags: ["VUE"] })).toEqual(["s-02", "s-01"]);
        expect(await ids({ statuses: [], tags: [] })).toHaveLength(4);
      });

      it("CA-102-05 · filtra por archivadas", async () => {
        expect(await ids({ archived: "only" })).toEqual(["s-04"]);
        expect(await ids({ archived: "include" })).toHaveLength(5);
      });

      it("CA-102-06 · por fecha de candidatura, las que no tienen van al final", async () => {
        expect(await ids({ sort: { field: "appliedAt", direction: "asc" } })).toEqual([
          "s-02",
          "s-01",
          "s-03",
          "s-05",
        ]);
        expect(await ids({ sort: { field: "appliedAt", direction: "desc" } })).toEqual([
          "s-01",
          "s-02",
          "s-03",
          "s-05",
        ]);
      });

      it("ordena por empresa sin tildes ni mayúsculas", async () => {
        expect(
          await ids({ archived: "include", sort: { field: "company", direction: "asc" } }),
        ).toEqual(["s-02", "s-01", "s-03", "s-04", "s-05"]);
        expect(await ids({ sort: { field: "company", direction: "desc" } })).toEqual([
          "s-05",
          "s-03",
          "s-01",
          "s-02",
        ]);
      });

      it("CA-102-07 · recorrer todas las páginas devuelve cada candidatura una vez", async () => {
        const repository = await withFixtures();
        const seen: string[] = [];

        for (let offset = 0; offset < 5; offset += 2) {
          const page = await repository.search(
            owner,
            completeQuery({ archived: "include", offset, limit: 2 }),
          );
          expect(page.total).toBe(5);
          seen.push(...page.items.map(({ id }) => id));
        }

        expect(seen).toEqual(["s-05", "s-02", "s-03", "s-01", "s-04"]);
      });

      it("CA-102-12 · nunca devuelve candidaturas de otra persona", async () => {
        expect(await ids({ text: "secreto", archived: "include" })).toEqual([]);
      });
    });

    describe("listTags", () => {
      it("CA-102-11 · devuelve las etiquetas sin repetir, ordenadas y solo de la persona usuaria", async () => {
        const repository = await createRepository();
        for (const snapshot of searchFixtures) {
          await repository.save(Application.restore(snapshot));
        }

        expect(await repository.listTags(owner)).toEqual(["Java", "React", "React Native", "vue"]);
      });

      it("sin candidaturas devuelve una lista vacía", async () => {
        const repository = await createRepository();

        expect(await repository.listTags(owner)).toEqual([]);
      });
    });
  });
};
