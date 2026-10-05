import type {
  ApplicationId,
  ApplicationRepository,
  ApplicationSnapshot,
  UserId,
} from "@applytrack/core";
import { Application } from "@applytrack/core";

import type { DemoStorage } from "./demo-storage";

const upsert = (
  rows: readonly ApplicationSnapshot[],
  snapshot: ApplicationSnapshot,
): ApplicationSnapshot[] => {
  const index = rows.findIndex((row) => row.id === snapshot.id);
  return index === -1 ? [...rows, snapshot] : rows.map((row, i) => (i === index ? snapshot : row));
};

export class LocalApplicationRepository implements ApplicationRepository {
  constructor(private readonly storage: DemoStorage) {}

  async findById(owner: UserId, id: ApplicationId): Promise<Application | null> {
    const rows = await this.storage.applications();
    const row = rows.find((candidate) => candidate.id === id && candidate.ownerId === owner);
    return row ? Application.restore(row) : null;
  }

  save(application: Application): Promise<void> {
    const snapshot = application.toSnapshot();
    return this.storage.update((dataset) => ({
      ...dataset,
      applications: upsert(dataset.applications, snapshot),
    }));
  }
}
