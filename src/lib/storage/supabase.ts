const BUCKET = "uploads";

function getSupabaseUrl(): string {
  const ref = getProjectRef();
  return `https://${ref}.supabase.co`;
}

function getProjectRef(): string {
  const url = process.env.DATABASE_URL || "";
  // pooler: postgres.PROJECT_REF:password@...pooler.supabase.com
  const poolerMatch = url.match(/postgres\.([a-z0-9]+)[:|@]/);
  if (poolerMatch) return poolerMatch[1];
  // direct: @db.PROJECT_REF.supabase.co
  const directMatch = url.match(/db\.([a-z0-9]+)\.supabase/);
  if (directMatch) return directMatch[1];

  console.error("Cannot extract Supabase project ref from DATABASE_URL");
  throw new Error(
    "Something went wrong on our end. Please try again later."
  );
}

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not set");
    throw new Error(
      "File uploads are temporarily unavailable. Please try again later."
    );
  }
  return key;
}

export async function uploadFile(
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const supabaseUrl = getSupabaseUrl();

  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/${BUCKET}/${filePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getServiceKey()}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`Storage upload failed (${res.status}):`, err);

    if (res.status === 413) {
      throw new Error(
        "This file is too large. Please try a smaller file."
      );
    }

    throw new Error(
      "We couldn't save your file right now. Please try again in a moment."
    );
  }

  return filePath;
}

export async function downloadFile(filePath: string): Promise<Buffer> {
  const supabaseUrl = getSupabaseUrl();

  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/${BUCKET}/${filePath}`,
    {
      headers: {
        Authorization: `Bearer ${getServiceKey()}`,
      },
    }
  );

  if (!res.ok) {
    console.error(`Storage download failed (${res.status}):`, res.statusText);

    if (res.status === 404) {
      throw new Error(
        "This file is no longer available. Please try uploading it again."
      );
    }

    throw new Error(
      "We couldn't load your file right now. Please try again in a moment."
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
