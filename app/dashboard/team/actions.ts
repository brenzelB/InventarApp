"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserRole } from "@/hooks/useAuth";
import { revalidatePath } from "next/cache";

export async function inviteTeamMember(email: string, role: UserRole, invitedBy: string, metadata: { name: string }) {
  try {
    console.log(`[Team] Start invitation: ${email} (Role: ${role})`);

    // 1. Minimal Auth Admin Invitation
    // Using minimal metadata for maximum stability after trigger fix
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          role: role,
          display_name: metadata.name
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
      }
    );

    if (inviteError) {
      console.error("[Team] Auth invitation error:", inviteError.message);
      return { success: false, error: inviteError.message };
    }

    // SUCCESS PRIORITY: If we have a user, the primary goal is achieved
    const user = inviteData.user;

    // 2. Track the invitation in our custom invitations table (Stabilized)
    const { error: dbError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email: email.toLowerCase(),
        role: role,
        invited_by: invitedBy,
        metadata: metadata
      });

    if (dbError) {
      // Log DB error but don't fail as the invite was already sent successfully
      console.error("[Team] Database tracking warning:", dbError.message);
    }

    // Clear caches for the team page
    revalidatePath("/dashboard/team");

    return { success: true, user };
  } catch (err: any) {
    console.error("[Team] Critical error during invitation:", err);
    return { success: false, error: err.message || "Ein unerwarteter Fehler ist aufgetreten." };
  }
}
