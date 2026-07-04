import { createPackerManifest } from "@/lib/pwa-config";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(createPackerManifest(), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
