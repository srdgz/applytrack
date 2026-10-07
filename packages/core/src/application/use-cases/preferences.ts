import type { Preferences } from "../../domain/preferences/preferences";
import { samePreferences } from "../../domain/preferences/preferences";
import type { Result } from "../../domain/shared/result";
import { err, ok } from "../../domain/shared/result";
import type { PreferencesSyncError } from "../errors";
import type { PreferencesStore } from "../ports/preferences-store";

export interface PreferencesDeps {
  readonly device: PreferencesStore;
  readonly profile?: PreferencesStore;
}

const attempt = async <T>(action: () => Promise<T>): Promise<Result<T, unknown>> => {
  try {
    return ok(await action());
  } catch (error) {
    return err(error);
  }
};

export class GetPreferences {
  constructor(private readonly deps: PreferencesDeps) {}

  async execute({ fallback }: { readonly fallback: Preferences }): Promise<Preferences> {
    const { device, profile } = this.deps;
    const stored = await attempt(() => device.get());
    const onDevice = stored.ok ? stored.value : null;
    const local = onDevice ?? fallback;
    if (!profile) return local;

    const remote = await attempt(() => profile.get());
    if (!remote.ok) return local;

    const fromProfile = remote.value;
    if (fromProfile === null) {
      await attempt(() => profile.save(local));
      return local;
    }

    if (onDevice === null || !samePreferences(onDevice, fromProfile)) {
      await attempt(() => device.save(fromProfile));
    }
    return fromProfile;
  }
}

export interface UpdatePreferencesInput {
  readonly current: Preferences;
  readonly changes: Partial<Preferences>;
}

export class UpdatePreferences {
  constructor(private readonly deps: PreferencesDeps) {}

  async execute({
    current,
    changes,
  }: UpdatePreferencesInput): Promise<Result<Preferences, PreferencesSyncError>> {
    const preferences: Preferences = { ...current, ...changes };
    await attempt(() => this.deps.device.save(preferences));

    const { profile } = this.deps;
    if (!profile) return ok(preferences);

    const saved = await attempt(() => profile.save(preferences));
    return saved.ok ? ok(preferences) : err({ code: "SYNC_FAILED", preferences });
  }
}
