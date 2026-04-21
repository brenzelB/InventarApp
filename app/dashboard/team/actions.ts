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

    let inviteData = result.data;
    let inviteError = result.error;
    let emailSent = true;

    // --- SMTP 500 Fallback Logic ---
    if (inviteError && (inviteError.status === 500 || inviteError.message.includes('unexpected_failure'))) {
      console.warn("[Server Action] SMTP Failure detected. Attempting direct user creation fallback...");
      
      const fallbackResult = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          display_name: metadata.name,
          role: role
        },
        password: "TempPass!" + Math.random().toString(36).slice(-8)
      });

      console.log('FALLBACK_RESULT', JSON.stringify(fallbackResult, null, 2));

      if (fallbackResult.error) {
        console.error("[Server Action] Fallback also failed:", fallbackResult.error);
        return { success: false, error: "SMTP Fehler 500 und Fallback fehlgeschlagen: " + fallbackResult.error.message, status: 500, raw: fallbackResult.error };
      }

      inviteData = fallbackResult.data;
      inviteError = null;
      emailSent = false;
    }
    // --- End Fallback ---

    if (inviteError) {
      console.error("[Server Action] FULL ERROR:", JSON.stringify(inviteError, null, 2));
      return { success: false, error: inviteError.message, status: inviteError.status || 500, raw: inviteError };
    }

    if (!inviteData?.user) {
      return { success: false, error: "Supabase hat keinen Nutzer erstellt (Data.user ist leer).", status: 500 };
    }

    // 2. Create Profile (Explicitly so they show up in the list)
    const profilePayload: any = {
      id: inviteData.user.id,
      email: email.toLowerCase(),
      display_name: metadata.name,
      full_name: metadata.name, // Added for compatibility with different schema variations
      role: role
    };
    
    console.log("[Server Action] Attempting Profile Upsert:", JSON.stringify(profilePayload, null, 2));

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { 
        onConflict: 'id', // Use ID as primary conflict resolution
        ignoreDuplicates: false 
      });

    if (profileError) {
      console.error("[Server Action] Profile Upsert Error:", JSON.stringify(profileError, null, 2));
      // Attempt fallback to email conflict if ID conflict fails for some reason
      const { error: retryError } = await supabaseAdmin
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'email' });
        
      if (retryError) {
        console.error("[Server Action] Profile Retry Error:", JSON.stringify(retryError, null, 2));
        return { success: false, error: "Profil-Fehler: " + retryError.message, status: 500, raw: retryError };
      }
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

    return { success: true, user: inviteData.user, status: 200, emailSent };
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
