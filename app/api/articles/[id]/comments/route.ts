import { NextResponse } from "next/server";
import { articleService } from "@/modules/articles/services/articleService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await articleService.getComments(params.id);
    return NextResponse.json(comments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await request.json();
    if (!content) throw new Error("Inhalt fehlt");
    const comment = await articleService.addComment(params.id, content);
    return NextResponse.json(comment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
