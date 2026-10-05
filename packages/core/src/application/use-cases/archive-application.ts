import type { Application, ApplicationSnapshot } from "../../domain/application/application";
import { toApplicationId } from "../../domain/shared/ids";
import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { ApplicationUseCaseError } from "../errors";
import { applicationNotFound, unauthenticated } from "../errors";
import type { ApplicationRepository } from "../ports/application-repository";
import type { SessionProvider } from "../ports/session-provider";

export interface ArchiveApplicationDeps {
  readonly repository: ApplicationRepository;
  readonly session: SessionProvider;
}

export interface ApplicationIdInput {
  readonly id: string;
}

type Change = (application: Application) => boolean;

const changeArchived = async (
  { repository, session }: ArchiveApplicationDeps,
  id: string,
  change: Change,
): Promise<Result<ApplicationSnapshot, ApplicationUseCaseError>> => {
  const ownerId = await session.currentUser();
  if (ownerId === null) return err(unauthenticated);

  const application = await repository.findById(ownerId, toApplicationId(id));
  if (application === null) return err(applicationNotFound);

  if (change(application)) await repository.save(application);
  return ok(application.toSnapshot());
};

export class ArchiveApplication {
  constructor(private readonly deps: ArchiveApplicationDeps) {}

  execute({
    id,
  }: ApplicationIdInput): Promise<Result<ApplicationSnapshot, ApplicationUseCaseError>> {
    return changeArchived(this.deps, id, (application) => application.archive());
  }
}

export class UnarchiveApplication {
  constructor(private readonly deps: ArchiveApplicationDeps) {}

  execute({
    id,
  }: ApplicationIdInput): Promise<Result<ApplicationSnapshot, ApplicationUseCaseError>> {
    return changeArchived(this.deps, id, (application) => application.unarchive());
  }
}
