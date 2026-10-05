import type {
  ApplicationId,
  ApplicationQuery,
  ApplicationRepository,
  ApplicationSnapshot,
  Page,
  UserId,
} from "../src";
import { Application, applyQuery, uniqueTags } from "../src";

export class InMemoryApplicationRepository implements ApplicationRepository {
  private readonly rows = new Map<ApplicationId, ApplicationSnapshot>();

  saveCount = 0;

  findById(owner: UserId, id: ApplicationId): Promise<Application | null> {
    const row = this.rows.get(id);
    return Promise.resolve(row && row.ownerId === owner ? Application.restore(row) : null);
  }

  save(application: Application): Promise<void> {
    this.rows.set(application.id, application.toSnapshot());
    this.saveCount += 1;
    return Promise.resolve();
  }

  search(owner: UserId, query: ApplicationQuery): Promise<Page<Application>> {
    const page = applyQuery(this.ownedBy(owner), query);
    return Promise.resolve({ ...page, items: page.items.map((row) => Application.restore(row)) });
  }

  listTags(owner: UserId): Promise<readonly string[]> {
    return Promise.resolve(uniqueTags(this.ownedBy(owner)));
  }

  all(): ApplicationSnapshot[] {
    return [...this.rows.values()];
  }

  private ownedBy(owner: UserId): ApplicationSnapshot[] {
    return this.all().filter((row) => row.ownerId === owner);
  }
}
