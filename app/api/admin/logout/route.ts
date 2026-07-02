import { NextResponse } from "next/server";

// Clears the admin session cookie.
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_unlocked");
  return res;
}
