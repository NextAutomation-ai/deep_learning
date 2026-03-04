import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { verifyContentOwnership } from "@/lib/auth/verify-content-owner";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;

  const session = await getUser();
  if (!(await verifyContentOwnership(contentId, session.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { argumentId, counterArgument } = body as {
    argumentId: string;
    counterArgument: string;
  };

  if (!argumentId || !counterArgument) {
    return NextResponse.json(
      { error: "argumentId and counterArgument are required" },
      { status: 400 }
    );
  }

  const existing = (await db
    .select()
    .from(arguments_)
    .where(eq(arguments_.id, argumentId))
    .limit(1))[0];

  if (!existing) {
    return NextResponse.json({ error: "Argument not found" }, { status: 404 });
  }

  const currentCounterArgs = (existing.counterArguments as string[]) || [];
  const updated = [...currentCounterArgs, counterArgument];

  await db.update(arguments_)
    .set({ counterArguments: updated })
    .where(eq(arguments_.id, argumentId));

  return NextResponse.json({
    argument: { ...existing, counterArguments: updated },
  });
}
