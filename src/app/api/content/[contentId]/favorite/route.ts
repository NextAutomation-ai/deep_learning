import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();
  const { contentId } = await params;

  const content = (await db
    .select({ id: contents.id, isFavorited: contents.isFavorited })
    .from(contents)
    .where(
      and(eq(contents.id, contentId), eq(contents.userId, session.user.id))
    )
    .limit(1))[0];

  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  const newValue = content.isFavorited ? 0 : 1;

  await db.update(contents)
    .set({ isFavorited: newValue, updatedAt: new Date() })
    .where(eq(contents.id, contentId));

  return NextResponse.json({ isFavorited: newValue });
}
