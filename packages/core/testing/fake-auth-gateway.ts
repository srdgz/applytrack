import type { Account, AuthFailure, AuthGateway, Email, Result } from "../src";
import { err, ok, toUserId } from "../src";

export class FakeAuthGateway implements AuthGateway {
  readonly requests: { email: Email; redirectTo: string }[] = [];
  failure: AuthFailure | null = null;
  validCode = "123456";
  validLinkCode = "link-code";
  private account: Account | null = null;

  currentAccount(): Promise<Account | null> {
    return Promise.resolve(this.account);
  }

  requestSignIn(email: Email, redirectTo: string): Promise<Result<void, AuthFailure>> {
    this.requests.push({ email, redirectTo });
    return Promise.resolve(this.failure ? err(this.failure) : ok(undefined));
  }

  verifyCode(email: Email, code: string): Promise<Result<Account, AuthFailure>> {
    if (this.failure) return Promise.resolve(err(this.failure));
    if (code !== this.validCode) return Promise.resolve(err("INVALID_CODE"));
    this.account = { userId: toUserId(`user-${email}`), email };
    return Promise.resolve(ok(this.account));
  }

  completeSignIn(linkCode: string): Promise<Result<Account, AuthFailure>> {
    if (this.failure) return Promise.resolve(err(this.failure));
    if (linkCode !== this.validLinkCode) return Promise.resolve(err("INVALID_CODE"));
    this.account = { userId: toUserId("user-link"), email: "link@mail.com" as Email };
    return Promise.resolve(ok(this.account));
  }

  signOut(): Promise<void> {
    this.account = null;
    return Promise.resolve();
  }
}
