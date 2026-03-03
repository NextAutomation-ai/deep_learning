import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isYoutubeUrl } from "@/lib/processing/extractors/youtube";
import { checkBadges, awardBadges } from "@/lib/gamification/badge-engine";

export async function POST(request: NextRequest) {
  const session = await getUser();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Failed to parse upload data. Please try again." },
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
    if (ext === "pdf") sourceType = "pdf";
    else if (ext === "docx") sourceType = "docx";
    else if (ext === "epub") sourceType = "epub";
    else if (ext === "txt") sourceType = "text";
    else {
      return NextResponse.json(
        { error: "Unsupported file type. Supported: PDF, DOCX, EPUB, TXT" },
        { status: 400 }
      );
    }

    fileName = file.name;
    mimeType = file.type;
    fileSize = file.size;

    if (fileSize > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 50MB." },
        { status: 400 }
      );
    }

    // Save file to disk
    const uploadDir = path.join(
      process.cwd(),
      "data",
      "uploads",
      session.user.id
    );
    await mkdir(uploadDir, { recursive: true });
    const savedFileName = `${crypto.randomUUID()}-${file.name}`;
    const savedPath = path.join(uploadDir, savedFileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(savedPath, buffer);
    filePath = path.relative(process.cwd(), savedPath);

    // For TXT files, read text directly
    if (ext === "txt") {
      rawText = buffer.toString("utf-8");
    }
  } else if (url) {
    sourceType = isYoutubeUrl(url) ? "youtube" : "url";
  } else if (text) {
    sourceType = "text";
    rawText = text;
  } else {
    return NextResponse.json(
      { error: "No content provided. Send a file, URL, or text." },
      { status: 400 }
    );
  }

  const content = db
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
    .get();

  // Check content upload badges
  const newBadges = checkBadges(session.user.id, "content_uploaded");
  awardBadges(session.user.id, newBadges);

  return NextResponse.json({ content, newBadges }, { status: 201 });
}
