import type { ApplicationSnapshot } from "../../domain/application/application";
import type { ApplicationDetailsDraft } from "../../domain/application/application-draft";
import { validateApplicationDetails } from "../../domain/application/validate-application-details";
import { toApplicationId } from "../../domain/shared/ids";
import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { ApplicationUseCaseError } from "../errors";
import { applicationNotFound, unauthenticated, validationFailed } from "../errors";
import type { ApplicationRepository } from "../ports/application-repository";
import type { Clock } from "../ports/clock";
import type { SessionProvider } from "../ports/session-provider";

export interface UpdateApplicationDetailsInput {
  readonly id: string;
  readonly details: ApplicationDetailsDraft;
}

export interface UpdateApplicationDetailsDeps {
  readonly repository: ApplicationRepository;
  readonly session: SessionProvider;
  readonly clock: Clock;
}

export class UpdateApplicationDetails {
  constructor(private readonly deps: UpdateApplicationDetailsDeps) {}

  async execute({
    id,
    details,
  }: UpdateApplicationDetailsInput): Promise<Result<ApplicationSnapshot, ApplicationUseCaseError>> {
    const { repository, session, clock } = this.deps;

    const ownerId = await session.currentUser();
    if (ownerId === null) return err(unauthenticated);

    const application = await repository.findById(ownerId, toApplicationId(id));
    if (application === null) return err(applicationNotFound);

    const validated = validateApplicationDetails(details, {
      status: application.status,
      today: clock.today(),
    });
    if (!validated.ok) return err(validationFailed(validated.error));

    if (application.updateDetails(validated.value, clock.now())) {
      await repository.save(application);
    }
    return ok(application.toSnapshot());
  }
}
