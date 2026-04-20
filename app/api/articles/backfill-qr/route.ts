import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getBaseUrl(request: Request) {
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  if (!host) return APP_URL;
  return `${protocol}://${host}`;
}

export async function POST(request: Request) {
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return NextResponse.json({ message: "Mock mode – no Supabase configured.", updated: 0 });
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Alle Artikel oder nur solche ohne QR holen
  let query = supabase.from("articles").select("id, name");
  if (!force) {
    query = query.is("qr_code", null);
  }
  
  const { data: articles, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({ message: "Keine Artikel zur Aktualisierung gefunden.", updated: 0 });
  }

  const baseUrl = getBaseUrl(request);
  let updated = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      const qrCodeUrl = `${baseUrl}/dashboard/articles/${article.id}`;
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
