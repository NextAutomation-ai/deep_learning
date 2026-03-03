import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;

  const args = db
    .select()
    .from(arguments_)
    .where(eq(arguments_.contentId, contentId))
    .all();

  return NextResponse.json({ arguments: args });
}
