import type { ApplicationQuery, Page } from "../../domain/application/query";
import { completeQuery, validateQuery } from "../../domain/application/query";
import type { ApplicationSummary } from "../../domain/application/summary";
import { toSummary } from "../../domain/application/summary";
import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { ApplicationUseCaseError } from "../errors";
import { unauthenticated, validationFailed } from "../errors";
import type { ApplicationRepository } from "../ports/application-repository";
import type { Clock } from "../ports/clock";
import type { SessionProvider } from "../ports/session-provider";

export interface SearchApplicationsDeps {
  readonly repository: ApplicationRepository;
  readonly session: SessionProvider;
  readonly clock: Clock;
}

export class SearchApplications {
  constructor(private readonly deps: SearchApplicationsDeps) {}

  async execute(
    partial: Partial<ApplicationQuery> = {},
  ): Promise<Result<Page<ApplicationSummary>, ApplicationUseCaseError>> {
    const { repository, session, clock } = this.deps;

    const ownerId = await session.currentUser();
    if (ownerId === null) return err(unauthenticated);

    const query = completeQuery(partial);
    const issues = validateQuery(query);
    if (issues.length > 0) return err(validationFailed(issues));

    const page = await repository.search(ownerId, query);
    const today = clock.today();
    return ok({
      ...page,
      items: page.items.map((application) => toSummary(application.toSnapshot(), today)),
    });
  }
}
