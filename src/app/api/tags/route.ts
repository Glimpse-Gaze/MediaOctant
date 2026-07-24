import { NextResponse } from "next/server";
import { listTagsWithCounts } from "@/lib/tags";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const tags = await listTagsWithCounts(q);
  return NextResponse.json({ tags });
}
