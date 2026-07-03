import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BUCKETS = ["book-covers", "qr-codes"] as const;
type Bucket = (typeof BUCKETS)[number];

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
      { error: "Storage upload requires SUPABASE_SERVICE_ROLE_KEY in .env.local" },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as Bucket | null;

  if (!file || !bucket || !BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "Invalid file or bucket" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
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