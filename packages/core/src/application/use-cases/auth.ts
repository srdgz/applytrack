import type { Account } from "../../domain/account/account";
import { validateEmail } from "../../domain/account/email";
import { validateSignInCode } from "../../domain/account/sign-in-code";
import type { FieldIssue } from "../../domain/application/field-issue";
import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { AuthUseCaseError } from "../errors";
import type { AuthGateway } from "../ports/auth-gateway";

export interface AuthDeps {
  readonly auth: AuthGateway;
}

const invalid = (issues: readonly FieldIssue[]): AuthUseCaseError => ({
  code: "VALIDATION_FAILED",
  issues,
});

export class GetCurrentAccount {
  constructor(private readonly deps: AuthDeps) {}

  execute(): Promise<Account | null> {
    return this.deps.auth.currentAccount();
  }
}

export interface RequestSignInInput {
  readonly email: string;
  readonly redirectTo: string;
}

export class RequestSignIn {
  constructor(private readonly deps: AuthDeps) {}

  async execute({
    email,
    redirectTo,
  }: RequestSignInInput): Promise<Result<void, AuthUseCaseError>> {
    const valid = validateEmail(email);
    if (!valid.ok) return err(invalid([valid.error]));

    const sent = await this.deps.auth.requestSignIn(valid.value, redirectTo);
    return sent.ok ? ok(undefined) : err({ code: sent.error });
  }
}

export interface VerifySignInCodeInput {
  readonly email: string;
  readonly code: string;
}

export class VerifySignInCode {
  constructor(private readonly deps: AuthDeps) {}

  async execute({
    email,
    code,
  }: VerifySignInCodeInput): Promise<Result<Account, AuthUseCaseError>> {
    const validEmail = validateEmail(email);
    const validCode = validateSignInCode(code);
    if (!validEmail.ok || !validCode.ok) {
      return err(
        invalid([validEmail, validCode].flatMap((result) => (result.ok ? [] : [result.error]))),
      );
    }

    const verified = await this.deps.auth.verifyCode(validEmail.value, validCode.value);
    return verified.ok ? ok(verified.value) : err({ code: verified.error });
  }
}

export class SignOut {
  constructor(private readonly deps: AuthDeps) {}

  execute(): Promise<void> {
    return this.deps.auth.signOut();
  }
}
