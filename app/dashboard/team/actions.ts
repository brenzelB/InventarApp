"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserRole } from "@/hooks/useAuth";
import { revalidatePath } from "next/cache";

export async function inviteTeamMember(email: string, role: UserRole, invitedBy: string, metadata: { name: string }) {
  try {
    console.log(`[Server Action] Inviting user: ${email} with role: ${role}`);

    // 1. Trigger the actual Supabase Auth Invitation
    // This sends the actual email. 
    // Redirect goes to /dashboard after the user accepts and sets their password
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          display_name: metadata.name,
          role: role
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
      }
    );

    if (inviteError) {
      console.error("[Server Action] Auth invitation error:", inviteError.message);
      return { success: false, error: inviteError.message };
    }

    // 2. Track the invitation in our custom invitations table
    const { error: dbError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email: email.toLowerCase(),
        role: role,
        invited_by: invitedBy,
        metadata: metadata
      });

    if (dbError) {
      console.error("[Server Action] Database tracking error (Warning only):", dbError.message);
      // We don't fail here because the email was already sent
    }

    // Clear caches for the team page
    revalidatePath("/dashboard/team");

    return { success: true, user: inviteData.user };
  } catch (err: any) {
    console.error("[Server Action] Critical error during invitation:", err);
    return { success: false, error: err.message || "Ein unerwarteter Fehler ist aufgetreten." };
  }
}
