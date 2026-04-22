// Admin endpoint to create staff auth users with email+password
// Uses the service role key, requires the caller to be an admin in staff_permissions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: callerErr } = await userClient.auth.getClaims(token);
    const callerId = claimsData?.claims?.sub as string | undefined;
    if (callerErr || !callerId) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Check caller is admin in staff_permissions OR is the very first user (bootstrap)
    const { data: callerStaff } = await admin
      .from("staff_permissions")
      .select("role_label, is_active")
      .eq("user_id", caller.id)
      .maybeSingle();

    const { count: staffCount } = await admin
      .from("staff_permissions")
      .select("id", { count: "exact", head: true });

    const isAdmin = callerStaff?.is_active && callerStaff?.role_label === "admin";
    const bootstrap = (staffCount ?? 0) === 0; // allow first ever staff to be created by anyone authenticated
    if (!isAdmin && !bootstrap) {
      return new Response(JSON.stringify({ error: "Only admins can create staff accounts" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      email,
      password,
      full_name,
      phone,
      role_label = "staff",
      permissions = {},
      is_active = true,
    } = body || {};

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "email, password and full_name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (String(password).length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the auth user (auto-confirm so they can log in immediately)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone },
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message || "Failed to create user" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = created.user.id;

    // Insert staff permission row (or update if it already exists)
    const { error: permErr } = await admin
      .from("staff_permissions")
      .upsert({
        user_id: newUserId,
        full_name,
        email,
        phone: phone || null,
        role_label,
        is_active,
        permissions,
      }, { onConflict: "user_id" });

    if (permErr) {
      // best-effort: keep auth user, but report the error
      return new Response(JSON.stringify({
        error: `Auth user created but permission save failed: ${permErr.message}`,
        user_id: newUserId,
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, user_id: newUserId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
