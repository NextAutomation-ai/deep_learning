export const maxDuration = 60;
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { isYoutubeUrl } from "@/lib/processing/extractors/youtube";
import { checkBadges, awardBadges } from "@/lib/gamification/badge-engine";
import { uploadFile } from "@/lib/storage/supabase";

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB — Vercel serverless limit
const SUPPORTED_TYPES = ["pdf", "docx", "epub", "txt"] as const;

export async function POST(request: NextRequest) {
  const session = await requireAuth();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "We couldn't read your upload. Please try again." },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const url = formData.get("url") as string | null;
  const text = formData.get("text") as string | null;
  const title = formData.get("title") as string | null;

  let sourceType: "pdf" | "docx" | "url" | "text" | "youtube" | "epub";
  let fileName: string | null = null;
  let filePath: string | null = null;
  let fileSize: number | null = null;
  let mimeType: string | null = null;
  let rawText: string | null = null;

  if (file) {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (!ext || !SUPPORTED_TYPES.includes(ext as (typeof SUPPORTED_TYPES)[number])) {
      return NextResponse.json(
        {
          error: `"${ext || "unknown"}" files are not supported. Please upload a PDF, DOCX, EPUB, or TXT file.`,
        },
        { status: 400 }
      );
    }

    if (ext === "pdf") sourceType = "pdf";
    else if (ext === "docx") sourceType = "docx";
    else if (ext === "epub") sourceType = "epub";
    else sourceType = "text";

    fileName = file.name;
    mimeType = file.type;
    fileSize = file.size;

    if (fileSize > MAX_FILE_SIZE) {
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: `Your file is ${sizeMB}MB, but the maximum allowed size is 4.5MB. Please try a smaller file, or paste the text directly instead.`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (ext === "txt") {
      rawText = buffer.toString("utf-8");
    } else {
      try {
        const storagePath = `${session.user.id}/${crypto.randomUUID()}-${file.name}`;
        await uploadFile(storagePath, buffer, mimeType || "application/octet-stream");
        filePath = storagePath;
      } catch (err) {
        console.error("File upload error:", err);
        const message =
          err instanceof Error ? err.message : "Unable to save your file. Please try again.";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  } else if (url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return NextResponse.json(
        { error: "Please enter a valid URL starting with https://" },
        { status: 400 }
      );
    }
    sourceType = isYoutubeUrl(url) ? "youtube" : "url";
  } else if (text) {
    if (text.trim().length < 50) {
      return NextResponse.json(
        { error: "Please enter at least 50 characters of text for meaningful analysis." },
        { status: 400 }
      );
    }
    sourceType = "text";
    rawText = text;
  } else {
    return NextResponse.json(
      { error: "Please upload a file, paste a URL, or enter text to get started." },
      { status: 400 }
    );
  }

  try {
    const content = (
      await db
        .insert(contents)
        .values({
          userId: session.user.id,
          title: title || fileName || url || "Untitled",
          sourceType,
          sourceUrl: url,
          fileName,
          filePath,
          fileSize,
          mimeType,
          rawText,
          processingStatus: "pending",
        })
        .returning()
    )[0];

    const newBadges = await checkBadges(session.user.id, "content_uploaded");
    await awardBadges(session.user.id, newBadges);

    return NextResponse.json({ content, newBadges }, { status: 201 });
  } catch (err) {
    console.error("Database error during upload:", err);
    return NextResponse.json(
      { error: "Something went wrong while saving your content. Please try again." },
      { status: 500 }
    );
  }
}
