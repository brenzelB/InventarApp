"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserRole } from "@/hooks/useAuth";
import { revalidatePath } from "next/cache";

export async function inviteTeamMember(email: string, role: UserRole, invitedBy: string, metadata: { name: string }) {
  // Hard Key Check to avoid cryptic failures
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[Team] SUPABASE_SERVICE_ROLE_KEY is missing!");
    return { success: false, error: 'Service Role Key fehlt in der Konfiguration.' };
  }

  try {
    console.log(`[Team] Sending invitation to: ${email}`);

    // 1. Auth Admin Invitation (Restored with Metadata)
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
      console.error("[Team] Auth Error:", inviteError.message);
      return { success: false, error: inviteError.message };
    }

    // 2. Track in Invitations Table
    const { error: dbError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email: email.toLowerCase(),
        role: role,
        invited_by: invitedBy,
        metadata: metadata
      });

    if (dbError) {
      console.error("[Team] DB Tracking Warning:", dbError.message);
      // We don't fail here since the primary Auth invite was successful
    }

    revalidatePath("/dashboard/team");

    return { success: true, user: inviteData.user };
  } catch (err: any) {
    console.error("[Team] Critical Error:", err);
    return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten." };
  }
}
