import { Application } from "../../domain/application/application";
import type { ApplicationSnapshot } from "../../domain/application/application";
import type { ApplicationDraft } from "../../domain/application/application-draft";
import { validateNewApplication } from "../../domain/application/validate-new-application";
import { toApplicationId } from "../../domain/shared/ids";
import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { ApplicationUseCaseError } from "../errors";
import { unauthenticated, validationFailed } from "../errors";
import type { ApplicationRepository } from "../ports/application-repository";
import type { Clock } from "../ports/clock";
import type { IdGenerator } from "../ports/id-generator";
import type { SessionProvider } from "../ports/session-provider";

export interface CreateApplicationDeps {
  readonly repository: ApplicationRepository;
  readonly session: SessionProvider;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export class CreateApplication {
  constructor(private readonly deps: CreateApplicationDeps) {}

  async execute(
    draft: ApplicationDraft,
  ): Promise<Result<ApplicationSnapshot, ApplicationUseCaseError>> {
    const { repository, session, clock, ids } = this.deps;

    const ownerId = await session.currentUser();
    if (ownerId === null) return err(unauthenticated);

    const validated = validateNewApplication(draft, clock.today());
    if (!validated.ok) return err(validationFailed(validated.error));

    const application = Application.create({
      id: toApplicationId(ids.next()),
      ownerId,
      status: validated.value.status,
      details: validated.value.details,
      now: clock.now(),
    });

    await repository.save(application);
    return ok(application.toSnapshot());
  }
}
