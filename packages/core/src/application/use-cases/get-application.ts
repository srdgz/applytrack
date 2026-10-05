import type { ApplicationSnapshot } from "../../domain/application/application";
import { toApplicationId } from "../../domain/shared/ids";
import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { ApplicationUseCaseError } from "../errors";
import { applicationNotFound, unauthenticated } from "../errors";
import type { ApplicationRepository } from "../ports/application-repository";
import type { SessionProvider } from "../ports/session-provider";

export interface GetApplicationDeps {
  readonly repository: ApplicationRepository;
  readonly session: SessionProvider;
}

export class GetApplication {
  constructor(private readonly deps: GetApplicationDeps) {}

  async execute({
    id,
  }: {
    readonly id: string;
  }): Promise<Result<ApplicationSnapshot, ApplicationUseCaseError>> {
    const ownerId = await this.deps.session.currentUser();
    if (ownerId === null) return err(unauthenticated);

    const application = await this.deps.repository.findById(ownerId, toApplicationId(id));
    return application ? ok(application.toSnapshot()) : err(applicationNotFound);
  }
}
