import { toApplicationId } from "../../domain/shared/ids";
import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { ApplicationUseCaseError } from "../errors";
import { applicationNotFound, unauthenticated } from "../errors";
import type { ApplicationRepository } from "../ports/application-repository";
import type { SessionProvider } from "../ports/session-provider";

export interface DeleteApplicationDeps {
  readonly repository: ApplicationRepository;
  readonly session: SessionProvider;
}

export class DeleteApplication {
  constructor(private readonly deps: DeleteApplicationDeps) {}

  async execute({ id }: { readonly id: string }): Promise<Result<void, ApplicationUseCaseError>> {
    const { repository, session } = this.deps;

    const ownerId = await session.currentUser();
    if (ownerId === null) return err(unauthenticated);

    const applicationId = toApplicationId(id);
    if ((await repository.findById(ownerId, applicationId)) === null) {
      return err(applicationNotFound);
    }

    await repository.delete(ownerId, applicationId);
    return ok(undefined);
  }
}
