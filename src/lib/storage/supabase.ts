const BUCKET = "uploads";

function getSupabaseUrl(): string {
  const ref = getProjectRef();
  return `https://${ref}.supabase.co`;
}

function getProjectRef(): string {
  const url = process.env.DATABASE_URL || "";
  const poolerMatch = url.match(/postgres\.([a-z0-9]+)@/);
  if (poolerMatch) return poolerMatch[1];
  const directMatch = url.match(/db\.([a-z0-9]+)\.supabase/);
  if (directMatch) return directMatch[1];
  throw new Error(
    "Database connection is not configured correctly. Please check your DATABASE_URL in environment variables."
  );
}

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "File storage is not configured. Please add the SUPABASE_SERVICE_ROLE_KEY to your environment variables."
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

    if (res.status === 404 || err.includes("not found")) {
      throw new Error(
        'Storage bucket "uploads" does not exist. Please create it in your Supabase dashboard under Storage.'
      );
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Storage access denied. Please check your SUPABASE_SERVICE_ROLE_KEY is correct."
      );
    }

    if (res.status === 413) {
      throw new Error(
        "File is too large for storage. Please try a smaller file (under 50MB)."
      );
    }

    throw new Error(`Unable to save your file. Please try again later. (${res.status})`);
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
    if (res.status === 404) {
      throw new Error(
        "The uploaded file could not be found. It may have been deleted. Please try uploading again."
      );
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Unable to access file storage. Please check your SUPABASE_SERVICE_ROLE_KEY is correct."
      );
    }

    throw new Error(`Unable to retrieve your file. Please try again later. (${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
