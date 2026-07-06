import { NextResponse } from "next/server";
import {
  isValidPincodeFormat,
  normalizePincode,
  parsePostalApiResponse,
} from "@/lib/pincode";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pincode: string }> }
) {
  const { pincode: raw } = await params;
  const pincode = normalizePincode(raw);

  if (!isValidPincodeFormat(pincode)) {
    return NextResponse.json(
      { valid: false, pincode, error: "Enter a valid 6-digit Indian pincode" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { valid: false, pincode, error: "Pincode lookup failed. Try again." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const result = parsePostalApiResponse(pincode, data);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, pincode, error: "Pincode not found. Check and try again." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { valid: false, pincode, error: "Could not verify pincode right now." },
      { status: 503 }
    );
  }
}
