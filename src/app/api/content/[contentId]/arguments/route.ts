import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { verifyContentOwnership } from "@/lib/auth/verify-content-owner";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;

  const session = await getUser();
  if (!(await verifyContentOwnership(contentId, session.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const args = await db
    .select()
    .from(arguments_)
    .where(eq(arguments_.contentId, contentId));

  return NextResponse.json({ arguments: args });
}
