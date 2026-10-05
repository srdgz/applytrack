import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { ApplicationUseCaseError } from "../errors";
import { unauthenticated } from "../errors";
import type { ApplicationRepository } from "../ports/application-repository";
import type { SessionProvider } from "../ports/session-provider";

export interface ListTagsDeps {
  readonly repository: ApplicationRepository;
  readonly session: SessionProvider;
}

export class ListTags {
  constructor(private readonly deps: ListTagsDeps) {}

  async execute(): Promise<Result<readonly string[], ApplicationUseCaseError>> {
    const ownerId = await this.deps.session.currentUser();
    if (ownerId === null) return err(unauthenticated);

    return ok(await this.deps.repository.listTags(ownerId));
  }
}
