import type { UserId } from "../shared/ids";
import type { Email } from "./email";

export interface Account {
  readonly userId: UserId;
  readonly email: Email;
}
