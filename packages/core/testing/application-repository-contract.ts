import { describe, expect, it } from "vitest";

import type { ApplicationQuery, ApplicationRepository } from "../src";
import { Application, completeQuery, toApplicationId, toUserId } from "../src";
import { calendarDate } from "./calendar-date";
import { aSnapshot } from "./snapshot-builder";

export interface ContractOptions {
  readonly owners?: { readonly owner: string; readonly otherOwner: string };
  readonly idFor?: (label: string) => string;
}

export const describeApplicationRepositoryContract = (
  name: string,
  createRepository: () => ApplicationRepository | Promise<ApplicationRepository>,
  {
    owners = { owner: "owner-1", otherOwner: "owner-2" },
    idFor = (label) => label,
  }: ContractOptions = {},
): void => {
  const owner = toUserId(owners.owner);
  const otherOwner = toUserId(owners.otherOwner);
  const id = (label: string) => toApplicationId(idFor(label));
  const ids = (...labels: string[]) => labels.map(id);

  const buildApplication = (label: string) =>
    Application.create({
      id: id(label),
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
      id: idFor("s-01"),
      ownerId: owners.owner,
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
      id: idFor("s-02"),
      ownerId: owners.owner,
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
      id: idFor("s-03"),
      ownerId: owners.owner,
      company: "Cobalto",
      position: "Backend Developer",
      tags: ["Java"],
      status: "wishlist",
      workMode: "onsite",
      source: "infojobs",
      updatedAt: "2026-09-25T09:00:00.000Z",
    }),
    aSnapshot({
      id: idFor("s-04"),
      ownerId: owners.owner,
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
      id: idFor("s-05"),
      ownerId: owners.owner,
      company: "Echo Labs",
      position: "Frontend Lead",
      status: "wishlist",
      workMode: "remote",
      source: "other",
      updatedAt: "2026-09-30T09:00:00.000Z",
    }),
    aSnapshot({
      id: idFor("s-06"),
      ownerId: owners.otherOwner,
      company: "Brisa Health",
      position: "Frontend",
      tags: ["Secreto"],
      updatedAt: "2026-10-02T09:00:00.000Z",
    }),
  ];

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

      expect(await repository.findById(owner, id("missing"))).toBeNull();
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

      const found = async (query: Partial<ApplicationQuery>) => {
        const repository = await withFixtures();
        const page = await repository.search(owner, completeQuery(query));
        return page.items.map((application) => application.id);
      };

      it("CA-102-01 · sin filtros devuelve las no archivadas por última actualización", async () => {
        const repository = await withFixtures();
        const page = await repository.search(owner, completeQuery());

        expect(page.items.map(({ id }) => id)).toEqual(ids("s-05", "s-02", "s-03", "s-01"));
        expect(page).toMatchObject({ total: 4, offset: 0, limit: 50 });
      });

      it("CA-102-02 · cada palabra del texto tiene que aparecer en algún campo", async () => {
        expect(await found({ text: "fron vue" })).toEqual(ids("s-02", "s-01"));
      });

      it("CA-102-03 · el texto no distingue mayúsculas ni tildes", async () => {
        expect(await found({ text: "INGENIERIA" })).toEqual(ids("s-01"));
        expect(await found({ text: "arbol" })).toEqual(ids("s-02"));
        expect(await found({ text: "   " })).toEqual(ids("s-05", "s-02", "s-03", "s-01"));
      });

      it("CA-102-04 · filtros distintos se combinan con Y y valores del mismo filtro con O", async () => {
        expect(await found({ workModes: ["remote"], statuses: ["applied", "wishlist"] })).toEqual(
          ids("s-05", "s-01"),
        );
        expect(await found({ sources: ["referral", "infojobs"] })).toEqual(ids("s-02", "s-03"));
        expect(await found({ tags: ["VUE"] })).toEqual(ids("s-02", "s-01"));
        expect(await found({ statuses: [], tags: [] })).toHaveLength(4);
      });

      it("CA-102-05 · filtra por archivadas", async () => {
        expect(await found({ archived: "only" })).toEqual(ids("s-04"));
        expect(await found({ archived: "include" })).toHaveLength(5);
      });

      it("CA-102-06 · por fecha de candidatura, las que no tienen van al final", async () => {
        expect(await found({ sort: { field: "appliedAt", direction: "asc" } })).toEqual(
          ids("s-02", "s-01", "s-03", "s-05"),
        );
        expect(await found({ sort: { field: "appliedAt", direction: "desc" } })).toEqual(
          ids("s-01", "s-02", "s-03", "s-05"),
        );
      });

      it("ordena por empresa sin tildes ni mayúsculas", async () => {
        expect(
          await found({ archived: "include", sort: { field: "company", direction: "asc" } }),
        ).toEqual(ids("s-02", "s-01", "s-03", "s-04", "s-05"));
        expect(await found({ sort: { field: "company", direction: "desc" } })).toEqual(
          ids("s-05", "s-03", "s-01", "s-02"),
        );
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

        expect(seen).toEqual(ids("s-05", "s-02", "s-03", "s-01", "s-04"));
      });

      it("CA-102-12 · nunca devuelve candidaturas de otra persona", async () => {
        expect(await found({ text: "secreto", archived: "include" })).toEqual([]);
      });
    });

    describe("delete", () => {
      it("CA-106-03 · lo eliminado deja de encontrarse, de buscarse y de listar sus etiquetas", async () => {
        const repository = await createRepository();
        for (const snapshot of searchFixtures) {
          await repository.save(Application.restore(snapshot));
        }

        await repository.delete(owner, id("s-03"));

        expect(await repository.findById(owner, id("s-03"))).toBeNull();
        const page = await repository.search(owner, completeQuery({ archived: "include" }));
        expect(page.items.map(({ id }) => id)).not.toContain(id("s-03"));
        expect(page.total).toBe(4);
        expect(await repository.listTags(owner)).not.toContain("Java");
      });

      it("eliminar con otro propietario o un id inexistente no borra nada", async () => {
        const repository = await createRepository();
        const application = buildApplication("a-1");
        await repository.save(application);

        await repository.delete(otherOwner, application.id);
        await repository.delete(owner, id("missing"));

        expect(await repository.findById(owner, application.id)).not.toBeNull();
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
