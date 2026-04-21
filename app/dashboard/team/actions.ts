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
    const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10);
    console.log("[Server Action] Attempting invite for:", email, "Role Key Prefix:", keyPrefix);

    const result = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          display_name: metadata.name,
          role: role
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://inventar-app-pi.vercel.app'}/dashboard`
      }
    );

    console.log('INVITE_RAW_RESULT', JSON.stringify(result, null, 2));

    const { data: inviteData, error: inviteError } = result;

    if (inviteError) {
      console.error("[Server Action] FULL ERROR:", JSON.stringify(inviteError, null, 2));
      return { success: false, error: inviteError.message, status: inviteError.status || 500, raw: inviteError };
    }

    if (!inviteData?.user) {
      return { success: false, error: "Supabase hat keinen Nutzer erstellt (Data.user ist leer).", status: 500 };
    }

    // 2. Create Profile (Explicitly so they show up in the list)
    const profilePayload = {
      id: inviteData.user.id,
      email: email.toLowerCase(),
      display_name: metadata.name,
      role: role
    };
    console.log("[Server Action] Profile Payload:", JSON.stringify(profilePayload, null, 2));

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'email' });

    if (profileError) {
      console.error("[Server Action] Profile FULL ERROR:", JSON.stringify(profileError, null, 2));
      return { success: false, error: "Profil-Fehler: " + profileError.message, status: 500, raw: profileError };
    }

    // 3. Track in Invitations Table
    const { error: dbError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email: email.toLowerCase(),
        role: role,
        invited_by: invitedBy,
        metadata: metadata
      });

    revalidatePath("/dashboard/team");

    return { success: true, user: inviteData.user, status: 200 };
  } catch (err: any) {
    console.error("[Server Action] CRITICAL CATCH:", err);
    return { success: false, error: err.message || "Unerwarteter Fehler", status: 500 };
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
