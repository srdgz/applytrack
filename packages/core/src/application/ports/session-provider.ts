import type { UserId } from "../../domain/shared/ids";

export interface SessionProvider {
  currentUser(): Promise<UserId | null>;
}
