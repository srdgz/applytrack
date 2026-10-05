import type { ApplicationSnapshot } from "../../domain/application/application";
import { APPLICATION_STATUSES, isOneOf } from "../../domain/application/options";
import { toApplicationId } from "../../domain/shared/ids";
import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { ApplicationUseCaseError } from "../errors";
import {
  applicationNotFound,
  invalidTransition,
  unauthenticated,
  validationFailed,
} from "../errors";
import type { ApplicationRepository } from "../ports/application-repository";
import type { Clock } from "../ports/clock";
import type { SessionProvider } from "../ports/session-provider";

export interface ChangeApplicationStatusInput {
  readonly id: string;
  readonly to: string;
  readonly note?: string | undefined;
}

export interface ChangeApplicationStatusDeps {
  readonly repository: ApplicationRepository;
  readonly session: SessionProvider;
  readonly clock: Clock;
}

export class ChangeApplicationStatus {
  constructor(private readonly deps: ChangeApplicationStatusDeps) {}

  async execute({
    id,
    to,
    note,
  }: ChangeApplicationStatusInput): Promise<Result<ApplicationSnapshot, ApplicationUseCaseError>> {
    const { repository, session, clock } = this.deps;

    const ownerId = await session.currentUser();
    if (ownerId === null) return err(unauthenticated);

    if (!isOneOf(APPLICATION_STATUSES, to)) {
      return err(validationFailed([{ field: "to", code: "INVALID_OPTION" }]));
    }

    const application = await repository.findById(ownerId, toApplicationId(id));
    if (application === null) return err(applicationNotFound);

    const changed = application.changeStatus(to, clock.now(), note);
    if (!changed.ok) {
      return err(
        changed.error.kind === "transition"
          ? invalidTransition(changed.error.from, changed.error.to)
          : validationFailed([changed.error.issue]),
      );
    }

    await repository.save(application);
    return ok(application.toSnapshot());
  }
}
