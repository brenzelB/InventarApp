"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserRole } from "@/hooks/useAuth";
import { revalidatePath } from "next/cache";

export async function inviteTeamMember(email: string, role: UserRole, invitedBy: string, metadata: { name: string }) {
  // HARD KEY CHECK
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[Team] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment!");
    return { success: false, error: 'KEY MISSING' };
  }

  try {
    console.log(`[Team] Start minimal invitation (Naked Call) for: ${email}`);

    // 1. NAKED Auth Admin Invitation
    // NO 'data' property passed here to avoid conflicts with fixed database triggers
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
      }
    );

    if (inviteError) {
      console.error("[Team] Auth invitation error (JSON):", inviteError);
      return { 
        success: false, 
        error: `AUTH_API_FEHLER: ${JSON.stringify(inviteError, null, 2)}` 
      };
    }

    // SUCCESS PRIORITY: If we have a user, the primary goal is achieved
    const user = inviteData.user;

    // 2. Track the invitation in our custom invitations table
    // (This still accepts metadata as it is into our own schema, not auth.users)
    const { error: dbError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email: email.toLowerCase(),
        role: role,
        invited_by: invitedBy,
        metadata: metadata
      });

    if (dbError) {
      // Log DB error as JSON for debugging but don't fail the primary success
      console.error("[Team] Database tracking error (JSON):", dbError);
    }

    // Clear caches for the team page
    revalidatePath("/dashboard/team");

    return { success: true, user };
  } catch (err: any) {
    console.error("[Team] Exception occurred (JSON):", err);
    return { 
      success: false, 
      error: `KRITISCHER_EXCEPTION_FEHLER: ${err.message || JSON.stringify(err, null, 2)}` 
    };
  }
}
