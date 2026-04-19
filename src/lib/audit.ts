import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "view" | "export" | "print" | "approve" | "reject";

interface LogParams {
  action: AuditAction | string;
  entityType: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an admin/staff action to the audit_logs table.
 * Fails silently — never blocks the main user flow.
 */
export async function logAudit(params: LogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    await (supabase as any).from("audit_logs").insert({
      user_id: user.id,
      user_name: profile?.full_name || user.email,
      user_email: user.email,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      description: params.description || null,
      metadata: params.metadata || null,
    });
  } catch (err) {
    console.warn("Audit log failed:", err);
  }
}
