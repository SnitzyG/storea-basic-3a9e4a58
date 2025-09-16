import { supabase } from "@/integrations/supabase/client";

export const DOCUMENTS_BUCKET = "documents" as const;

export class StorageError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}

// Returns a signed URL when possible. If not available, falls back to a Blob URL.
// Throws descriptive errors for missing/misconfigured bucket
export async function getDownloadUrl(filePath: string): Promise<{ url: string; revoke?: () => void }> {
  try {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, 60 * 60);

    if (error || !data?.signedUrl) {
      // Attempt blob download to avoid public bucket assumptions
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .download(filePath);

      if (downloadError) {
        const msg = normalizeStorageError(downloadError.message);
        throw new StorageError(msg, (downloadError as any)?.statusCode?.toString());
      }

      const blobUrl = URL.createObjectURL(fileData);
      return {
        url: blobUrl,
        revoke: () => URL.revokeObjectURL(blobUrl),
      };
    }

    return { url: data.signedUrl };
  } catch (e: any) {
    const msg = normalizeStorageError(e?.message || String(e));
    throw new StorageError(msg);
  }
}

export async function downloadFromStorage(filePath: string, fileName: string) {
  const { url, revoke } = await getDownloadUrl(filePath);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    revoke?.();
  }
}

export function normalizeStorageError(raw: string): string {
  const lower = (raw || "").toLowerCase();
  if (lower.includes("bucket not found") || lower.includes("no such bucket") || lower.includes("404")) {
    return 'Storage bucket "documents" is missing or misconfigured. Please ensure the bucket exists and policies allow access.';
  }
  if (lower.includes("not found")) {
    return "File not found in storage. It may have been moved or deleted.";
  }
  return raw || "Unknown storage error";
}
