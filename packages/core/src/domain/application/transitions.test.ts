import { describe, expect, it } from "vitest";

import type { ApplicationStatus } from "./options";
import { APPLICATION_STATUSES } from "./options";
import { allowedTransitions, canTransition, isFinalStatus } from "./transitions";

const EXPECTED: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  wishlist: ["applied", "withdrawn"],
  applied: ["screening", "interviewing", "rejected", "withdrawn", "no_response"],
  screening: ["interviewing", "offer", "rejected", "withdrawn", "no_response"],
  interviewing: ["offer", "rejected", "withdrawn", "no_response"],
  offer: ["accepted", "rejected", "withdrawn"],
  no_response: ["screening", "interviewing", "rejected"],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

const pairs = APPLICATION_STATUSES.flatMap((from) =>
  APPLICATION_STATUSES.map((to) => [from, to] as const),
);

describe("transiciones", () => {
  it("cubre las 81 combinaciones", () => {
    expect(pairs).toHaveLength(81);
  });

  it.each(pairs)("CA-101-01 · %s → %s coincide con la tabla", (from, to) => {
    expect(canTransition(from, to)).toBe(EXPECTED[from].includes(to));
  });

  it("pasar al mismo estado nunca está permitido", () => {
    for (const status of APPLICATION_STATUSES) expect(canTransition(status, status)).toBe(false);
  });

  it("solo aceptada, descartada y retirada son finales", () => {
    expect(APPLICATION_STATUSES.filter(isFinalStatus)).toEqual([
      "accepted",
      "rejected",
      "withdrawn",
    ]);
    expect(allowedTransitions("offer")).toEqual(["accepted", "rejected", "withdrawn"]);
  });
});
