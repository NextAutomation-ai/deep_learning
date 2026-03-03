import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  await params; // consume params
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

  const existing = db
    .select()
    .from(arguments_)
    .where(eq(arguments_.id, argumentId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Argument not found" }, { status: 404 });
  }

  const currentCounterArgs = (existing.counterArguments as string[]) || [];
  const updated = [...currentCounterArgs, counterArgument];

  db.update(arguments_)
    .set({ counterArguments: updated })
    .where(eq(arguments_.id, argumentId))
    .run();

  return NextResponse.json({
    argument: { ...existing, counterArguments: updated },
  });
}
