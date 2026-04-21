"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserRole } from "@/hooks/useAuth";
import { revalidatePath } from "next/cache";

export async function inviteTeamMember(email: string, role: UserRole, invitedBy: string, metadata: { name: string }) {
  console.log('INVITE_STARTED', email);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Service Role Key fehlt in der Konfiguration.' };
  }

  try {
    console.log("[Server Action] Attempting invite for:", email);
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

    console.log('INVITE_RESPONSE', { inviteData, inviteError });

    if (inviteError) {
      console.error("[Server Action] Supabase Auth Error:", inviteError.message, inviteError.status);
      return { success: false, error: inviteError.message, status: inviteError.status };
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

export async function deleteTeamMember(userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Service Role Key fehlt in der Konfiguration.' };
  }

  try {
    console.log(`[Team] Delete member request: ${userId}`);

    // 1. Delete from Profiles (Admin Power)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error("[Team] Profile delete error:", profileError.message);
      return { success: false, error: "Fehler beim Löschen des Profils: " + profileError.message };
    }

    // 2. Delete from Auth (Admin Power)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("[Team] Auth delete error:", authError.message);
      // We log but continue as the profile is already gone
    }

    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (err: any) {
    console.error("[Team] Critical deletion error:", err);
    return { success: false, error: "Ein Fehler beim Löschen ist aufgetreten." };
  }
}
