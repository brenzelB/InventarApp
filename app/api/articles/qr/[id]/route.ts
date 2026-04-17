import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const isMock = !supabaseUrl || supabaseUrl.includes("placeholder");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return new NextResponse("Missing article id", { status: 400 });
  }

  // 1. Versuche QR aus Supabase zu laden (gecacht)
  if (!isMock) {
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
    const qrCodeUrl = `${APP_URL}/dashboard/articles/${id}`;
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
        supabase
          .from("articles")
          .update({ qr_code: svg })
          .eq("id", id)
          .then(() => {})
          .catch(() => {});
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
