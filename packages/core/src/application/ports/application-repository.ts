import type { Application } from "../../domain/application/application";
import type { ApplicationQuery, Page } from "../../domain/application/query";
import type { ApplicationId, UserId } from "../../domain/shared/ids";

export interface ApplicationRepository {
  findById(owner: UserId, id: ApplicationId): Promise<Application | null>;
  save(application: Application): Promise<void>;
  search(owner: UserId, query: ApplicationQuery): Promise<Page<Application>>;
  listTags(owner: UserId): Promise<readonly string[]>;
}
