import type {
  ApplicationId,
  ApplicationQuery,
  ApplicationRepository,
  ApplicationSnapshot,
  Page,
  UserId,
} from "@applytrack/core";
import { Application, uniqueTags } from "@applytrack/core";
import type { SupabaseClient } from "@supabase/supabase-js";

import { parseApplicationRow, parseSearchResult, toSavePayload } from "./rows";

export type Warn = (message: string) => void;

const WITH_HISTORY = "*, status_changes(seq, from_status, to_status, changed_at, note)";

export class SupabaseApplicationRepository implements ApplicationRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly warn: Warn = () => undefined,
  ) {}

  async findById(owner: UserId, id: ApplicationId): Promise<Application | null> {
    const { data, error }: { data: unknown; error: { code: string; message: string } | null } =
      await this.client
        .from("applications")
        .select(WITH_HISTORY)
        .eq("owner_id", owner)
        .eq("id", id)
        .maybeSingle();
    if (error) {
      if (error.code === "22P02") return null;
      throw new Error(error.message);
    }
    if (data === null) return null;
    const snapshot = this.parse(data);
    return snapshot ? Application.restore(snapshot) : null;
  }

  async save(application: Application): Promise<void> {
    const { error } = await this.client.rpc("save_application", {
      payload: toSavePayload(application.toSnapshot()),
    });
    if (error) throw new Error(error.message);
  }

  async search(owner: UserId, query: ApplicationQuery): Promise<Page<Application>> {
    const response = await this.client.rpc("search_applications", {
      query: {
        owner_id: owner,
        text: query.text ?? "",
        statuses: query.statuses ?? [],
        work_modes: query.workModes ?? [],
        sources: query.sources ?? [],
        tags: query.tags ?? [],
        archived: query.archived,
        sort_field: query.sort.field,
        sort_direction: query.sort.direction,
        offset: query.offset,
        limit: query.limit,
      },
    });
    if (response.error) throw new Error(response.error.message);

    const data: unknown = response.data;
    const result = parseSearchResult(data);
    if (!result.success) throw new Error("Unexpected search_applications response");

    return {
      items: this.parseAll(result.data.items).map((snapshot) => Application.restore(snapshot)),
      total: result.data.total,
      offset: query.offset,
      limit: query.limit,
    };
  }

  async listTags(owner: UserId): Promise<readonly string[]> {
    const { data, error }: { data: unknown[] | null; error: { message: string } | null } =
      await this.client.from("applications").select(WITH_HISTORY).eq("owner_id", owner);
    if (error) throw new Error(error.message);
    return uniqueTags(this.parseAll(data ?? []));
  }

  async delete(owner: UserId, id: ApplicationId): Promise<void> {
    const { error } = await this.client
      .from("applications")
      .delete()
      .eq("owner_id", owner)
      .eq("id", id);
    if (error && error.code !== "22P02") throw new Error(error.message);
  }

  private parseAll(rows: readonly unknown[]): ApplicationSnapshot[] {
    return rows.flatMap((row) => {
      const snapshot = this.parse(row);
      return snapshot ? [snapshot] : [];
    });
  }

  private parse(row: unknown): ApplicationSnapshot | null {
    const snapshot = parseApplicationRow(row);
    if (snapshot === null) {
      this.warn("ApplyTrack skipped an application row that does not match the expected schema");
    }
    return snapshot;
  }
}
