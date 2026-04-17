import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST() {
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return NextResponse.json({ message: "Mock mode – no Supabase configured.", updated: 0 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Alle Artikel ohne QR holen
  const { data: articles, error: fetchError } = await supabase
    .from("articles")
    .select("id, name")
    .is("qr_code", null);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({ message: "Alle Artikel haben bereits einen QR-Code.", updated: 0 });
  }

  let updated = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      const qrCodeUrl = `${APP_URL}/dashboard/articles/${article.id}`;
      const qr_code = await QRCode.toString(qrCodeUrl, {
        type: "svg",
        margin: 2,
        width: 256,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      const { error: updateError } = await supabase
        .from("articles")
        .update({ qr_code })
        .eq("id", article.id);

      if (updateError) {
        errors.push(`Artikel ${article.id}: ${updateError.message}`);
      } else {
        updated++;
      }
    } catch (e: any) {
      errors.push(`Artikel ${article.id}: ${e.message}`);
    }
  }

  return NextResponse.json({
    message: `${updated} von ${articles.length} Artikel-QR-Codes aktualisiert.`,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function GET() {
  // Status: wie viele Artikel haben noch keinen QR?
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return NextResponse.json({ message: "Mock mode", missingCount: 0 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { count, error } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .is("qr_code", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ missingCount: count ?? 0 });
}
