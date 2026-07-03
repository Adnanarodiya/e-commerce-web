import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json();
    const expected = process.env.PACKER_PASSCODE;

    if (!expected) {
      return NextResponse.json(
        { error: "Packer passcode is not configured. Set PACKER_PASSCODE in .env.local" },
        { status: 500 }
      );
    }

    if (typeof passcode !== "string" || passcode !== expected) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("packer_unlocked", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}