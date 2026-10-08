import type { Account } from "../../domain/account/account";
import type { Email } from "../../domain/account/email";
import type { Result } from "../../domain/shared/result";

export type AuthFailure = "RATE_LIMITED" | "INVALID_CODE" | "AUTH_UNAVAILABLE";

export interface AuthGateway {
  currentAccount(): Promise<Account | null>;
  requestSignIn(email: Email, redirectTo: string): Promise<Result<void, AuthFailure>>;
  verifyCode(email: Email, code: string): Promise<Result<Account, AuthFailure>>;
  completeSignIn(linkCode: string): Promise<Result<Account, AuthFailure>>;
  signOut(): Promise<void>;
}
