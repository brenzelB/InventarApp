"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserRole } from "@/hooks/useAuth";
import { revalidatePath } from "next/cache";

export async function inviteTeamMember(email: string, role: UserRole, invitedBy: string, metadata: { name: string }) {
  console.log(">>> [DEBUG] Starte Einladungs-Prozess für:", email);
  console.log(">>> [DEBUG] Admin-Key vorhanden:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log(">>> [DEBUG] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Vorhanden" : "FEHLT!");

  try {
    // 1. Auth Admin Invitation
    console.log(">>> [DEBUG] Rufe auth.admin.inviteUserByEmail auf...");
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
      console.error(">>> [DEBUG] Auth Admin Fehler:", inviteError);
      // Gib das KOMPLETTE Error-Objekt als String zurück
      return { 
        success: false, 
        error: `AUTH_API_FEHLER: ${JSON.stringify(inviteError, null, 2)}` 
      };
    }

    console.log(">>> [DEBUG] Auth Einladung erfolgreich gesendet. User ID:", inviteData.user?.id);

    // 2. Track in Database (DEAKTIVIERT ALS FALLBACK FÜR DEBUGGING)
    /*
    console.log(">>> [DEBUG] Schreibe in invitations Tabelle...");
    const { error: dbError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email: email.toLowerCase(),
        role: role,
        invited_by: invitedBy,
        metadata: metadata
      });

    if (dbError) {
      console.error(">>> [DEBUG] Database Tracking Fehler:", dbError);
      return { 
        success: false, 
        error: `DB_TRACKING_FEHLER: ${JSON.stringify(dbError, null, 2)}` 
      };
    }
    */
    console.log(">>> [DEBUG] Database Tracking wurde übersprungen (Simplified Mode)");

    // Clear caches for the team page
    revalidatePath("/dashboard/team");

    return { success: true, user: inviteData.user };
  } catch (err: any) {
    console.error(">>> [DEBUG] Kritischer Catch-Fehler:", err);
    return { 
      success: false, 
      error: `KRITISCHER_EXCEPTION_FEHLER: ${err.message || JSON.stringify(err)}` 
    };
  }
}
