import { calendarDateFromDate } from "../shared/calendar-date";
import type { ApplicationId, UserId } from "../shared/ids";
import type { Result } from "../shared/result";
import { err, ok } from "../shared/result";
import { charLength, optionalText } from "../shared/text";
import type { ApplicationDetails } from "./application-details";
import { sameDetails } from "./application-details";
import type { FieldIssue } from "./field-issue";
import { LIMITS } from "./limits";
import type { ApplicationStatus, InitialStatus } from "./options";
import type { StatusChange } from "./status-change";
import { canTransition } from "./transitions";

export type StatusChangeError =
  | {
      readonly kind: "transition";
      readonly from: ApplicationStatus;
      readonly to: ApplicationStatus;
    }
  | { readonly kind: "note"; readonly issue: FieldIssue };

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

  changeStatus(to: ApplicationStatus, at: Date, note?: string): Result<void, StatusChangeError> {
    const from = this.state.status;
    if (!canTransition(from, to)) return err({ kind: "transition", from, to });

    const text = optionalText(note);
    if (text !== undefined && charLength(text) > LIMITS.statusNote) {
      return err({
        kind: "note",
        issue: { field: "note", code: "FIELD_TOO_LONG", meta: { max: LIMITS.statusNote } },
      });
    }

    const changedAt = at.toISOString();
    this.state = {
      ...this.state,
      status: to,
      history: [
        ...this.state.history,
        { from, to, changedAt, ...(text !== undefined && { note: text }) },
      ],
      updatedAt: changedAt,
      ...(to === "applied" &&
        this.state.appliedAt === undefined && { appliedAt: calendarDateFromDate(at) }),
    };
    return ok(undefined);
  }

  toSnapshot(): ApplicationSnapshot {
    return copy(this.state);
  }
}
