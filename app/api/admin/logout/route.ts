import { NextResponse } from "next/server";

// Clears the admin session cookie only (packer session stays if logged in).
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_unlocked", "", { path: "/", maxAge: 0 });
  return res;
}
