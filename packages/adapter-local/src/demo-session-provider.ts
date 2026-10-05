import type { SessionProvider, UserId } from "@applytrack/core";
import { toUserId } from "@applytrack/core";

import type { KeyValueStore } from "./key-value-store";
import { DEMO_MODE, DEMO_USER_ID, MODE_KEY } from "./storage-keys";

export class DemoSessionProvider implements SessionProvider {
  constructor(private readonly store: KeyValueStore) {}

  async currentUser(): Promise<UserId | null> {
    const mode = await this.store.getItem(MODE_KEY);
    return mode === DEMO_MODE ? toUserId(DEMO_USER_ID) : null;
  }
}
