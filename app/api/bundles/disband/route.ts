import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const { bundle_id } = await request.json();

    if (!bundle_id) {
      return NextResponse.json(
        { error: "Bundle-ID ist erforderlich." },
        { status: 400 }
      );
    }

    // Call the database function disband_bundle via RPC
    const { error } = await supabase.rpc("disband_bundle", {
      p_bundle_id: bundle_id,
    });

    if (error) {
      console.error("[DisbandBundle API] RPC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DisbandBundle API] Error:", error);
    return NextResponse.json({ error: error.message || "Interner Serverfehler." }, { status: 500 });
  }
}
