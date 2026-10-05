import type { ApplicationSnapshot } from "../../domain/application/application";
import { completeQuery, MAX_LIMIT } from "../../domain/application/query";
import type { DashboardStats } from "../../domain/application/stats";
import { computeDashboardStats } from "../../domain/application/stats";
import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { ApplicationUseCaseError } from "../errors";
import { unauthenticated } from "../errors";
import type { ApplicationRepository } from "../ports/application-repository";
import type { Clock } from "../ports/clock";
import type { SessionProvider } from "../ports/session-provider";

export interface GetDashboardStatsDeps {
  readonly repository: ApplicationRepository;
  readonly session: SessionProvider;
  readonly clock: Clock;
}

export class GetDashboardStats {
  constructor(private readonly deps: GetDashboardStatsDeps) {}

  async execute(): Promise<Result<DashboardStats, ApplicationUseCaseError>> {
    const { repository, session, clock } = this.deps;

    const ownerId = await session.currentUser();
    if (ownerId === null) return err(unauthenticated);

    const applications: ApplicationSnapshot[] = [];
    for (;;) {
      const page = await repository.search(
        ownerId,
        completeQuery({ archived: "include", offset: applications.length, limit: MAX_LIMIT }),
      );
      applications.push(...page.items.map((application) => application.toSnapshot()));
      if (page.items.length === 0 || applications.length >= page.total) break;
    }

    return ok(computeDashboardStats(applications, clock.today()));
  }
}
