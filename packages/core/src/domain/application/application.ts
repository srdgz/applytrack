import type { ApplicationId, UserId } from "../shared/ids";
import type { ApplicationDetails } from "./application-details";
import { sameDetails } from "./application-details";
import type { ApplicationStatus, InitialStatus } from "./options";
import type { StatusChange } from "./status-change";

export interface ApplicationSnapshot extends ApplicationDetails {
  readonly id: ApplicationId;
  readonly ownerId: UserId;
  readonly status: ApplicationStatus;
  readonly archived: boolean;
  readonly history: readonly StatusChange[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

const copy = (snapshot: ApplicationSnapshot): ApplicationSnapshot => ({
  ...snapshot,
  ...(snapshot.salary && { salary: { ...snapshot.salary } }),
  tags: [...snapshot.tags],
  history: snapshot.history.map((change) => ({ ...change })),
});

export interface NewApplicationProps {
  readonly id: ApplicationId;
  readonly ownerId: UserId;
  readonly status: InitialStatus;
  readonly details: ApplicationDetails;
  readonly now: Date;
}

export class Application {
  private constructor(private state: ApplicationSnapshot) {}

  static create({ id, ownerId, status, details, now }: NewApplicationProps): Application {
    const timestamp = now.toISOString();
    return new Application({
      ...details,
      id,
      ownerId,
      status,
      archived: false,
      history: [{ from: null, to: status, changedAt: timestamp }],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static restore(snapshot: ApplicationSnapshot): Application {
    return new Application(copy(snapshot));
  }

  get id(): ApplicationId {
    return this.state.id;
  }

  get ownerId(): UserId {
    return this.state.ownerId;
  }

  get status(): ApplicationStatus {
    return this.state.status;
  }

  updateDetails(details: ApplicationDetails, now: Date): boolean {
    if (sameDetails(this.state, details)) return false;

    const { id, ownerId, status, archived, history, createdAt } = this.state;
    this.state = {
      ...details,
      id,
      ownerId,
      status,
      archived,
      history,
      createdAt,
      updatedAt: now.toISOString(),
    };
    return true;
  }

  toSnapshot(): ApplicationSnapshot {
    return copy(this.state);
  }
}
