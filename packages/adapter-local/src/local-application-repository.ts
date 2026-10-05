import type {
  ApplicationId,
  ApplicationQuery,
  ApplicationRepository,
  ApplicationSnapshot,
  Page,
  UserId,
} from "@applytrack/core";
import { Application, applyQuery, uniqueTags } from "@applytrack/core";

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
    const rows = await this.ownedBy(owner);
    const row = rows.find((candidate) => candidate.id === id);
    return row ? Application.restore(row) : null;
  }

  save(application: Application): Promise<void> {
    const snapshot = application.toSnapshot();
    return this.storage.update((dataset) => ({
      ...dataset,
      applications: upsert(dataset.applications, snapshot),
    }));
  }

  async search(owner: UserId, query: ApplicationQuery): Promise<Page<Application>> {
    const page = applyQuery(await this.ownedBy(owner), query);
    return { ...page, items: page.items.map((row) => Application.restore(row)) };
  }

  async listTags(owner: UserId): Promise<readonly string[]> {
    return uniqueTags(await this.ownedBy(owner));
  }

  private async ownedBy(owner: UserId): Promise<ApplicationSnapshot[]> {
    const rows = await this.storage.applications();
    return rows.filter((row) => row.ownerId === owner);
  }
}
