import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      description,
      herstellpreis,
      verkaufspreis,
      purchase_price,
      lagerort,
      unit,
      tax_rate,
      items,
    } = body;

    if (!name || !sku || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Ungültige Anforderungsdaten. Name, SKU und Komponenten sind erforderlich." },
        { status: 400 }
      );
    }

    // Call the database function create_bundle via RPC
    const { data, error } = await supabase.rpc("create_bundle", {
      p_name: name,
      p_sku: sku,
      p_description: description || "",
      p_herstellpreis: herstellpreis || 0,
      p_verkaufspreis: verkaufspreis || 0,
      p_purchase_price: purchase_price || 0,
      p_lagerort: lagerort || "",
      p_unit: unit || "Stk",
      p_tax_rate: tax_rate || 19,
      p_items: items,
    });

    if (error) {
      console.error("[CreateBundle API] RPC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, bundle_id: data });
  } catch (error: any) {
    console.error("[CreateBundle API] Error:", error);
    return NextResponse.json({ error: error.message || "Interner Serverfehler." }, { status: 500 });
  }
}
