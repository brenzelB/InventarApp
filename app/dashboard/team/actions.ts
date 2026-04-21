"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserRole } from "@/hooks/useAuth";
import { revalidatePath } from "next/cache";

export async function inviteTeamMember(email: string, role: UserRole, invitedBy: string, metadata: { name: string }) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Service Role Key fehlt in der Konfiguration.' };
  }

  try {
    // 1. Auth Admin Invitation
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          display_name: metadata.name,
          role: role
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://inventar-app-pi.vercel.app'}/dashboard`
      }
    );

    if (inviteError) {
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

    revalidatePath("/dashboard/team");

    return { success: true, user: inviteData.user };
  } catch (err: any) {
    return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten." };
  }
}
