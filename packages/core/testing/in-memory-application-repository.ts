import type { ApplicationId, ApplicationRepository, ApplicationSnapshot, UserId } from "../src";
import { Application } from "../src";

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

  all(): ApplicationSnapshot[] {
    return [...this.rows.values()];
  }
}
