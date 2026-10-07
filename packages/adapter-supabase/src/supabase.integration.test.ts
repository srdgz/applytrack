import { describeApplicationRepositoryContract } from "@applytrack/core/testing";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { SupabaseApplicationRepository } from "./supabase-application-repository";
import { SupabaseProfilePreferencesStore } from "./supabase-profile-preferences-store";
import { SupabaseSessionProvider } from "./supabase-session-provider";

const url = process.env.SUPABASE_TEST_URL;
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;
const configured = Boolean(url && publishableKey && secretKey);

const PASSWORD = "contract-test-password";
const OWNER_EMAIL = "contract-owner@applytrack.test";
const OTHER_EMAIL = "contract-other@applytrack.test";

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

const idFor = (label: string): string => {
  const hex = Array.from(label, (char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .padEnd(32, "0");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
};

const service = () => createClient(url ?? "", secretKey ?? "", noSession);

const ensureUser = async (admin: SupabaseClient, email: string): Promise<string> => {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((user) => user.email === email);
  if (existing) return existing.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
};

const signedIn = async (email: string): Promise<SupabaseClient> => {
  const client = createClient(url ?? "", publishableKey ?? "", noSession);
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return client;
};

const owners = configured
  ? await (async () => {
      const admin = service();
      return {
        owner: await ensureUser(admin, OWNER_EMAIL),
        otherOwner: await ensureUser(admin, OTHER_EMAIL),
      };
    })()
  : { owner: "", otherOwner: "" };

const wipe = async () => {
  const { error } = await service()
    .from("applications")
    .delete()
    .in("owner_id", [owners.owner, owners.otherOwner]);
  if (error) throw error;
};

describe.skipIf(!configured)("Supabase", () => {
  describeApplicationRepositoryContract(
    "SupabaseApplicationRepository",
    async () => {
      await wipe();
      return new SupabaseApplicationRepository(service());
    },
    { owners, idFor },
  );

  describe("RLS", () => {
    let owner: SupabaseClient;
    let other: SupabaseClient;
    const applicationId = idFor("rls-1");

    const payload = (ownerId: string, id = applicationId, toStatus = "applied") => ({
      application: {
        id,
        owner_id: ownerId,
        company: "Privada",
        position: "Frontend",
        job_url: null,
        source: "linkedin",
        location: null,
        work_mode: "remote",
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        status: "applied",
        applied_at: null,
        tags: [],
        notes: null,
        archived: false,
        created_at: "2026-10-01T09:00:00.000Z",
        updated_at: "2026-10-01T09:00:00.000Z",
      },
      history: [
        {
          seq: 0,
          from_status: null,
          to_status: toStatus,
          changed_at: "2026-10-01T09:00:00.000Z",
          note: null,
        },
      ],
    });

    beforeAll(async () => {
      await wipe();
      owner = await signedIn(OWNER_EMAIL);
      other = await signedIn(OTHER_EMAIL);
      const { error } = await owner.rpc("save_application", { payload: payload(owners.owner) });
      if (error) throw error;
    });

    afterAll(wipe);

    it("CA-104-10 · otra persona no ve candidaturas, historial ni perfil ajenos", async () => {
      const applications = await other.from("applications").select("id");
      const history = await other.from("status_changes").select("id");
      const profile = await other.from("profiles").select("user_id").eq("user_id", owners.owner);
      const search = await other.rpc("search_applications", { query: { owner_id: owners.owner } });

      expect(applications.data).toEqual([]);
      expect(history.data).toEqual([]);
      expect(profile.data).toEqual([]);
      expect(search.data).toMatchObject({ total: 0, items: [] });
    });

    it("CA-104-10 · otra persona no edita ni borra candidaturas ajenas", async () => {
      await other.from("applications").update({ company: "Robada" }).eq("id", applicationId);
      await other.from("applications").delete().eq("id", applicationId);
      await other.from("profiles").update({ locale: "en" }).eq("user_id", owners.owner);

      const { data } = await owner.from("applications").select("company").eq("id", applicationId);
      expect(data).toEqual([{ company: "Privada" }]);
    });

    it("CA-104-10 · nadie puede crear a nombre de otra persona", async () => {
      const asOwner = await other.rpc("save_application", {
        payload: payload(owners.owner, idFor("rls-2")),
      });
      const overwrite = await other.rpc("save_application", {
        payload: payload(owners.otherOwner),
      });
      const history = await other.from("status_changes").insert({
        application_id: applicationId,
        owner_id: owners.otherOwner,
        seq: 5,
        to_status: "offer",
        changed_at: "2026-10-02T09:00:00.000Z",
      });

      expect(asOwner.error).not.toBeNull();
      expect(overwrite.error).not.toBeNull();
      expect(history.error).not.toBeNull();
    });

    it("CA-104-10 · sin sesión no se accede a nada", async () => {
      const anonymous = createClient(url ?? "", publishableKey ?? "", noSession);

      const result = await anonymous.from("applications").select("id");

      expect(result.error !== null || result.data.length === 0).toBe(true);
    });

    it("CA-104-11 · si falla el historial no queda la candidatura a medias", async () => {
      const broken = await owner.rpc("save_application", {
        payload: payload(owners.owner, idFor("rls-3"), "ghosted"),
      });
      const { data } = await owner.from("applications").select("id").eq("id", idFor("rls-3"));

      expect(broken.error).not.toBeNull();
      expect(data).toEqual([]);
    });

    it("el perfil se crea vacío al registrarse y guarda las preferencias", async () => {
      const profile = new SupabaseProfilePreferencesStore(
        other,
        new SupabaseSessionProvider(other),
      );
      await service()
        .from("profiles")
        .update({ locale: null, theme: null })
        .eq("user_id", owners.otherOwner);

      expect(await profile.get()).toBeNull();
      await profile.save({ locale: "en", theme: "dark" });
      expect(await profile.get()).toEqual({ locale: "en", theme: "dark" });
    });
  });
});
