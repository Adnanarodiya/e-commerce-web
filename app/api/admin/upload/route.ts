import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKETS = ["book-covers", "qr-codes"] as const;
type Bucket = (typeof BUCKETS)[number];

/** Ensure public storage bucket exists (service role can create it). */
async function ensureBucket(admin: SupabaseClient, bucket: Bucket) {
  const { data: existing, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    throw new Error(`Could not list storage buckets: ${listError.message}`);
  }

  if (existing?.some((b) => b.name === bucket || b.id === bucket)) {
    return;
  }

  const { error: createError } = await admin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: bucket === "book-covers" ? 15 * 1024 * 1024 : 5 * 1024 * 1024,
    // MIME types are also validated in this route before upload
    allowedMimeTypes:
      bucket === "book-covers"
        ? [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/jpg",
            "application/pdf",
          ]
        : ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"],
  });

  // Ignore race where another request created it first
  if (createError && !/already exists|duplicate/i.test(createError.message)) {
    throw new Error(
      `Bucket "${bucket}" not found and could not be created: ${createError.message}. ` +
        `Create it in Supabase Dashboard → Storage → New bucket (public).`
    );
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_unlocked")?.value;
  const isPacker = cookieStore.get("packer_unlocked")?.value;
  if (!isAdmin && !isPacker) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Storage upload requires SUPABASE_SERVICE_ROLE_KEY in Vercel env (and .env.local locally)",
      },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as Bucket | null;

  if (!file || !bucket || !BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "Invalid file or bucket" }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  // QR codes must be images; book covers may be images or PDFs
  if (bucket === "qr-codes" && !isImage) {
    return NextResponse.json({ error: "Only image files are allowed for QR codes" }, { status: 400 });
  }
  if (bucket === "book-covers" && !isImage && !isPdf) {
    return NextResponse.json(
      { error: "Only image or PDF files are allowed for book covers" },
      { status: 400 }
    );
  }

  // PDFs can be larger; images stay under 5 MB, PDFs under 15 MB
  const maxSize = isPdf ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isPdf ? "PDF must be under 15 MB" : "File must be under 5 MB" },
      { status: 400 }
    );
  }

  try {
    await ensureBucket(admin, bucket);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to ensure storage bucket" },
      { status: 500 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(fileName);

  return NextResponse.json({ url: data.publicUrl });
}