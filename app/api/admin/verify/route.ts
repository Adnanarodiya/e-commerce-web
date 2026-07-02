import { NextRequest, NextResponse } from "next/server";

// Verifies the shared admin passcode (server-side env, never exposed to client)
// and sets an httpOnly session cookie on success.
export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json();
    const expected = process.env.ADMIN_PASSCODE;

    if (!expected) {
      return NextResponse.json(
        { error: "Admin passcode is not configured on the server. Set ADMIN_PASSCODE in .env.local" },
        { status: 500 }
      );
    }

    if (typeof passcode !== "string" || passcode !== expected) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_unlocked", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
