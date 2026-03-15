import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_VIDEO_CONTENT_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/mpeg",
  "video/ogg",
  "video/x-matroska",
];
const MAX_BLOB_VIDEO_BYTES = 250 * 1024 * 1024;
const TOKEN_VALIDITY_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new Error(
            "BLOB_READ_WRITE_TOKEN is not configured. Large deployed video uploads need Vercel Blob before they can be sent to Roboflow.",
          );
        }

        return {
          allowedContentTypes: ALLOWED_VIDEO_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BLOB_VIDEO_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + TOKEN_VALIDITY_MS,
        };
      },
      onUploadCompleted: async () => {
        // No database write is needed. The client immediately uses the returned blob URL.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare the Vercel Blob upload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
