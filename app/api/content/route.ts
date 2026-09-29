import { NextRequest, NextResponse } from "next/server";
import { listContent } from "@/lib/db";

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section") ?? undefined;
  const items = await listContent(section);
  return NextResponse.json({ items });
}
