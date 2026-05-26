import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { createClient } from "@supabase/supabase-js";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const TEMP_PAYSTACK_SECRET_KEY = "sk_test_4f267a3f561c8ce7532469ca98f6623f2b11edfd";

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function jsonResponse(payload: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function getEnvValue(env: unknown, key: string): string | undefined {
  // 1. Try Cloudflare worker env bindings first
  if (env && typeof env === "object") {
    const value = (env as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  // 2. Fallback to process.env (local Vite dev injects .env vars here)
  try {
    const processValue = (globalThis as any).process?.env?.[key];
    if (typeof processValue === "string" && processValue.trim()) return processValue;
  } catch {
    // process may not exist in Cloudflare Workers runtime — safe to ignore
  }
  return undefined;
}

function getPaystackSecretKey(env: unknown): string {
  return getEnvValue(env, "PAYSTACK_SECRET_KEY") ?? TEMP_PAYSTACK_SECRET_KEY;
}

function getSupabaseAdmin(env: unknown) {
  const url = getEnvValue(env, "SUPABASE_URL");
  const serviceKey = getEnvValue(env, "SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getRequester(request: Request, env: unknown) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "Missing authorization token" as const };

  const supabaseAdmin = getSupabaseAdmin(env);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return { error: "Invalid authorization token" as const };

  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .in("role", ["super_admin", "admin"])
    .limit(1)
    .maybeSingle();

  if (roleError || !roleData) return { error: "Admin access required" as const };
  return { user: data.user, supabaseAdmin, error: undefined };
}

async function recordAdminAudit(
  env: unknown,
  user: { id: string; email?: string | null },
  action: string,
  tableName: string,
  recordId: string | null,
  oldData: unknown,
  newData: unknown,
) {
  const supabaseAdmin = getSupabaseAdmin(env);
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email ?? null,
    action,
    table_name: tableName,
    record_id: recordId,
    old_data: oldData ?? null,
    new_data: newData ?? null,
  });
  if (error) console.error("[Audit] Failed to record admin action:", error);
}

async function adminBootstrap(request: Request, env: unknown): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return jsonResponse({ error: "You must be signed in" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin(env);
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonResponse({ error: "Invalid session" }, { status: 401 });
  }

  // Check if ANY admin already exists
  const { data: existingAdmins, error: countError } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .in("role", ["super_admin", "admin"])
    .limit(1);

  if (countError) {
    return jsonResponse({ error: countError.message }, { status: 500 });
  }

  if (existingAdmins && existingAdmins.length > 0) {
    return jsonResponse(
      { error: "An admin already exists. Ask an existing admin to grant you access." },
      { status: 403 },
    );
  }

  // No admins exist — bootstrap this user as super_admin
  const assignedRole = "super_admin";
  const { error: insertError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: authData.user.id, role: assignedRole });

  if (insertError) {
    return jsonResponse({ error: insertError.message }, { status: 500 });
  }

  console.log(`[Bootstrap] Granted ${assignedRole} to ${authData.user.email} (${authData.user.id})`);
  return jsonResponse({ ok: true, message: `You are now a Super Admin! Refreshing…` });
}

async function adminUsersApi(request: Request, env: unknown): Promise<Response> {
  const requester = await getRequester(request, env);
  if (requester.error) {
    return jsonResponse({ error: requester.error }, { status: requester.error.startsWith("Super") ? 403 : 401 });
  }

  const { supabaseAdmin, user: actor } = requester;

  if (request.method === "GET") {
    const [{ data: listed, error: listError }, { data: profiles, error: profilesError }, { data: roles, error: rolesError }] =
      await Promise.all([
        supabaseAdmin.auth.admin.listUsers(),
        supabaseAdmin.from("profiles").select("id,email,display_name,created_at,updated_at"),
        supabaseAdmin.from("user_roles").select("user_id,role,created_at"),
      ]);

    if (listError || profilesError || rolesError) {
      return jsonResponse({ error: listError?.message ?? profilesError?.message ?? rolesError?.message }, { status: 500 });
    }

    const profileById = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
    const rolesByUser = new Map<string, string[]>();
    for (const role of roles ?? []) {
      const list = rolesByUser.get(role.user_id) ?? [];
      list.push(role.role);
      rolesByUser.set(role.user_id, list);
    }

    const users = listed.users.map((item) => ({
      id: item.id,
      email: item.email,
      display_name: profileById.get(item.id)?.display_name ?? item.user_metadata?.display_name ?? null,
      created_at: item.created_at,
      last_sign_in_at: item.last_sign_in_at,
      roles: rolesByUser.get(item.id) ?? [],
    }));

    return jsonResponse({ users });
  }

  if (request.method === "POST") {
    const body = (await request.json().catch(() => null)) as {
      email?: string;
      password?: string;
      displayName?: string;
      role?: string;
    } | null;

    const email = body?.email?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";
    const displayName = body?.displayName?.trim() ?? "";
    const role = body?.role;

    if (!email || !email.includes("@")) return jsonResponse({ error: "A valid email is required" }, { status: 400 });
    if (password.length < 8) return jsonResponse({ error: "Password must be at least 8 characters" }, { status: 400 });
    if (!["super_admin", "admin", "editor"].includes(role ?? "")) {
      return jsonResponse({ error: "Choose a valid role" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName || email.split("@")[0] },
    });
    if (error || !data.user) return jsonResponse({ error: error?.message ?? "Unable to create user" }, { status: 400 });

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: data.user.id,
      email,
      display_name: displayName || email.split("@")[0],
    });
    if (profileError) return jsonResponse({ error: profileError.message }, { status: 500 });

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: data.user.id,
      role,
    });
    if (roleError) return jsonResponse({ error: roleError.message }, { status: 500 });

    await recordAdminAudit(env, actor, "create_user", "auth.users", data.user.id, null, { email, displayName, role });
    return jsonResponse({ user: { id: data.user.id, email, display_name: displayName, roles: [role] } }, { status: 201 });
  }

  if (request.method === "PATCH") {
    const body = (await request.json().catch(() => null)) as {
      userId?: string;
      displayName?: string;
      role?: string;
    } | null;

    const userId = body?.userId ?? "";
    const role = body?.role;
    const displayName = body?.displayName?.trim();

    if (!userId) return jsonResponse({ error: "User ID is required" }, { status: 400 });
    if (!["super_admin", "admin", "editor"].includes(role ?? "")) {
      return jsonResponse({ error: "Choose a valid role" }, { status: 400 });
    }

    const { data: oldRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
    const { error: deleteRoleError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .in("role", ["super_admin", "admin", "editor"]);
    if (deleteRoleError) return jsonResponse({ error: deleteRoleError.message }, { status: 500 });

    const { error: insertRoleError } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
    if (insertRoleError) return jsonResponse({ error: insertRoleError.message }, { status: 500 });

    if (displayName !== undefined) {
      const { error: profileError } = await supabaseAdmin.from("profiles").update({ display_name: displayName }).eq("id", userId);
      if (profileError) return jsonResponse({ error: profileError.message }, { status: 500 });
    }

    await recordAdminAudit(env, actor, "update_user_role", "user_roles", userId, { roles: oldRoles }, { role, displayName });
    return jsonResponse({ ok: true });
  }

  if (request.method === "DELETE") {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return jsonResponse({ error: "User ID is required" }, { status: 400 });
    if (userId === actor.id) return jsonResponse({ error: "You cannot delete your own account" }, { status: 400 });

    const { data: oldUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return jsonResponse({ error: error.message }, { status: 500 });

    await recordAdminAudit(env, actor, "delete_user", "auth.users", userId, oldUser?.user ?? null, null);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "Method not allowed" }, { status: 405 });
}

function getOrigin(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function toPaystackAmount(amount: unknown): number | null {
  const parsed = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.round(parsed * 100);
}

function allowedChannels(method: unknown): string[] | null {
  switch (method) {
    case "mobile_money":
      return ["mobile_money"];
    case "card":
      return ["card"];
    default:
      return null;
  }
}

async function initializePaystackTransaction(request: Request, env: unknown): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const givingType = typeof body.givingType === "string" ? body.givingType.trim() : "General Offering";
  const amount = toPaystackAmount(body.amount);
  const channels = allowedChannels(body.method);

  if (!email || !email.includes("@")) {
    return jsonResponse({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!amount) {
    return jsonResponse({ error: "Please enter an amount of at least GHS 1." }, { status: 400 });
  }
  if (!channels) {
    return jsonResponse({ error: "Please choose a payment method." }, { status: 400 });
  }

  const reference = `SWIC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const origin = getOrigin(request);

  const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey(env)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      email,
      currency: "GHS",
      channels,
      reference,
      callback_url: `${origin}/giving?reference=${encodeURIComponent(reference)}`,
      metadata: {
        custom_fields: [
          { display_name: "Donor Name", variable_name: "donor_name", value: name || "Anonymous" },
          { display_name: "Phone", variable_name: "phone", value: phone || "Not provided" },
          { display_name: "Giving Type", variable_name: "giving_type", value: givingType },
        ],
      },
    }),
  });

  const payload = (await paystackResponse.json().catch(() => null)) as
    | { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string } }
    | null;

  if (!paystackResponse.ok || !payload?.status || !payload.data?.authorization_url) {
    return jsonResponse(
      { error: payload?.message ?? "Unable to initialize payment. Please try again." },
      { status: paystackResponse.status || 502 },
    );
  }

  // Save pending transaction record to database
  try {
    const supabaseAdmin = getSupabaseAdmin(env);
    const { error: dbError } = await supabaseAdmin
      .from("giving_records")
      .insert({
        donor_name: name || "Anonymous",
        email,
        phone: phone || null,
        amount: Number(body.amount),
        currency: "GHS",
        giving_type: givingType,
        reference: payload.data.reference ?? reference,
        status: "pending",
      });

    if (dbError) {
      console.error("[Database] Error saving pending giving record:", dbError);
    }
  } catch (dbErr) {
    console.error("[Database] Failed to save pending giving record:", dbErr);
  }

  return jsonResponse({
    authorizationUrl: payload.data.authorization_url,
    reference: payload.data.reference ?? reference,
  });
}

async function verifyPaystackTransaction(request: Request, env: unknown): Promise<Response> {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference");

  if (!reference) {
    return jsonResponse({ error: "Reference parameter is required" }, { status: 400 });
  }

  try {
    const paystackSecret = getPaystackSecretKey(env);
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    });

    const payload = (await paystackResponse.json().catch(() => null)) as any;

    if (!paystackResponse.ok || !payload?.status || !payload.data) {
      return jsonResponse(
        { error: payload?.message ?? "Unable to verify payment with Paystack" },
        { status: paystackResponse.status || 502 }
      );
    }

    const tx = payload.data;
    const status = tx.status;
    const channel = tx.authorization?.channel || null;

    // Update database status using admin client
    const supabaseAdmin = getSupabaseAdmin(env);
    const { data: record, error: dbError } = await supabaseAdmin
      .from("giving_records")
      .update({
        status,
        channel,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference)
      .select()
      .maybeSingle();

    if (dbError) {
      console.error("[Database] Error updating giving record:", dbError);
      return jsonResponse({ error: "Failed to update record in database" }, { status: 500 });
    }

    return jsonResponse({
      status: "success",
      data: record || {
        donor_name: tx.metadata?.custom_fields?.find((f: any) => f.variable_name === 'donor_name')?.value || "Anonymous",
        email: tx.customer?.email || "",
        phone: tx.metadata?.custom_fields?.find((f: any) => f.variable_name === 'phone')?.value || null,
        amount: tx.amount / 100,
        currency: tx.currency,
        giving_type: tx.metadata?.custom_fields?.find((f: any) => f.variable_name === 'giving_type')?.value || "General Offering",
        reference,
        status,
        channel,
        created_at: tx.created_at,
      }
    });

  } catch (error: any) {
    console.error("[Verification] Error:", error);
    return jsonResponse({ error: error.message || "Failed to verify transaction" }, { status: 500 });
  }
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/paystack/initialize") {
        return await initializePaystackTransaction(request, env);
      }
      if (url.pathname === "/api/paystack/verify") {
        return await verifyPaystackTransaction(request, env);
      }
      if (url.pathname === "/api/admin/bootstrap") {
        return await adminBootstrap(request, env);
      }
      if (url.pathname === "/api/admin/users") {
        return await adminUsersApi(request, env);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
