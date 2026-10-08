import type { Account, AuthFailure, AuthGateway, Email, Result } from "@applytrack/core";
import { err, ok, toUserId, validateEmail } from "@applytrack/core";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { toAuthFailure } from "./auth-failure";

const toAccount = (user: User | null): Account | null => {
  if (user?.email === undefined) return null;
  const email = validateEmail(user.email);
  return email.ok ? { userId: toUserId(user.id), email: email.value } : null;
};

export class SupabaseAuthGateway implements AuthGateway {
  constructor(private readonly client: SupabaseClient) {}

  async currentAccount(): Promise<Account | null> {
    const { data } = await this.client.auth.getSession();
    return toAccount(data.session?.user ?? null);
  }

  async requestSignIn(email: Email, redirectTo: string): Promise<Result<void, AuthFailure>> {
    try {
      const { error } = await this.client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      });
      return error ? err(toAuthFailure(error, "request")) : ok(undefined);
    } catch {
      return err("AUTH_UNAVAILABLE");
    }
  }

  async verifyCode(email: Email, code: string): Promise<Result<Account, AuthFailure>> {
    try {
      const { data, error } = await this.client.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) return err(toAuthFailure(error, "verify"));
      const account = toAccount(data.user);
      return account ? ok(account) : err("AUTH_UNAVAILABLE");
    } catch {
      return err("AUTH_UNAVAILABLE");
    }
  }

  async completeSignIn(linkCode: string): Promise<Result<Account, AuthFailure>> {
    try {
      const { data, error } = await this.client.auth.exchangeCodeForSession(linkCode);
      if (error) return err(toAuthFailure(error, "verify"));
      const account = toAccount(data.user);
      return account ? ok(account) : err("AUTH_UNAVAILABLE");
    } catch {
      return err("AUTH_UNAVAILABLE");
    }
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut({ scope: "local" });
  }
}
