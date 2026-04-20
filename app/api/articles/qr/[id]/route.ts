import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const isMock = !supabaseUrl || supabaseUrl.includes("placeholder");

function getBaseUrl(request: Request) {
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  if (!host) return APP_URL;
  return `${protocol}://${host}`;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");

  if (!id) {
    return new NextResponse("Missing article id", { status: 400 });
  }

  // 1. Versuche QR aus Supabase zu laden (gecacht)
  // Falls ein 'origin' mitgegeben wird, erzwingen wir eine Neugenerierung für dieses Ziel
  if (!isMock && !origin) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await supabase
        .from("articles")
        .select("qr_code")
        .eq("id", id)
        .single();

      if (data?.qr_code) {
        return new NextResponse(data.qr_code, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
          },
        });
      }
    } catch {
      // Fallback: generiere on-the-fly
    }
  }

  // 2. On-the-fly generieren (Fallback oder Mock)
  try {
    const baseUrl = origin || getBaseUrl(request);
    const qrCodeUrl = `${baseUrl}/dashboard/articles/${id}`;
    const svg = await QRCode.toString(qrCodeUrl, {
      type: "svg",
      margin: 2,
      width: 256,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Im Hintergrund in Supabase speichern
    if (!isMock) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        await supabase
          .from("articles")
          .update({ qr_code: svg })
          .eq("id", id);
      } catch {}
    }

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e: any) {
    return new NextResponse("QR generation failed: " + e.message, { status: 500 });
  }
}
