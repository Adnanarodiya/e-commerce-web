export interface PincodeLookupResult {
  valid: boolean;
  pincode: string;
  state: string;
  district: string;
  isGujarat: boolean;
  postOffices?: string[];
}

const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

export function normalizePincode(input: string): string {
  return input.replace(/\D/g, "").slice(0, 6);
}

export function isValidPincodeFormat(pincode: string): boolean {
  return PINCODE_REGEX.test(pincode);
}

export function isGujaratState(stateName: string): boolean {
  return stateName.trim().toLowerCase() === "gujarat";
}

/** Parse India Post API response (api.postalpincode.in). */
export function parsePostalApiResponse(
  pincode: string,
  payload: unknown
): PincodeLookupResult {
  const invalid: PincodeLookupResult = {
    valid: false,
    pincode,
    state: "",
    district: "",
    isGujarat: false,
  };

  if (!Array.isArray(payload) || payload.length === 0) return invalid;

  const block = payload[0] as {
    Status?: string;
    Message?: string;
    PostOffice?: Array<{
      State?: string;
      District?: string;
      Name?: string;
    }>;
  };

  if (block.Status !== "Success" || !block.PostOffice?.length) return invalid;

  const first = block.PostOffice[0];
  const state = (first.State ?? "").trim();
  const district = (first.District ?? "").trim();

  if (!state) return invalid;

  return {
    valid: true,
    pincode,
    state,
    district,
    isGujarat: isGujaratState(state),
    postOffices: block.PostOffice.map((o) => o.Name).filter(Boolean) as string[],
  };
}
