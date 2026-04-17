import { NextResponse } from "next/server";
import { articleService } from "@/modules/articles/services/articleService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const history = await articleService.getArticleHistory(params.id);
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
