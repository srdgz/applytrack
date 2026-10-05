import type { ApplicationSnapshot } from "../src";
import { toApplicationId, toUserId } from "../src";

export type SnapshotOverrides = Partial<Omit<ApplicationSnapshot, "id" | "ownerId">> & {
  readonly id: string;
  readonly ownerId?: string;
};

export const aSnapshot = ({
  id,
  ownerId = "owner-1",
  ...overrides
}: SnapshotOverrides): ApplicationSnapshot => {
  const status = overrides.status ?? "wishlist";
  const updatedAt = overrides.updatedAt ?? "2026-10-01T09:00:00.000Z";
  return {
    company: "Acme",
    position: "Frontend Developer",
    source: "linkedin",
    workMode: "remote",
    tags: [],
    archived: false,
    history: [{ from: null, to: status, changedAt: updatedAt }],
    createdAt: updatedAt,
    ...overrides,
    status,
    updatedAt,
    id: toApplicationId(id),
    ownerId: toUserId(ownerId),
  };
};
