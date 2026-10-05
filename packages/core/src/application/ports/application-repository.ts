import type { Application } from "../../domain/application/application";
import type { ApplicationId, UserId } from "../../domain/shared/ids";

export interface ApplicationRepository {
  findById(owner: UserId, id: ApplicationId): Promise<Application | null>;
  save(application: Application): Promise<void>;
}
