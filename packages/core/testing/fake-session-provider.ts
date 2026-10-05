import type { SessionProvider, UserId } from "../src";
import { toUserId } from "../src";

export class FakeSessionProvider implements SessionProvider {
  private user: UserId | null;

  constructor(userId: string | null = "user-1") {
    this.user = userId === null ? null : toUserId(userId);
  }

  currentUser(): Promise<UserId | null> {
    return Promise.resolve(this.user);
  }

  signInAs(userId: string): void {
    this.user = toUserId(userId);
  }

  signOut(): void {
    this.user = null;
  }
}
