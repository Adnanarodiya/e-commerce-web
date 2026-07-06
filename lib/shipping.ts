import type { DeliveryType } from "@/context/CartContext";

export const SHIPPING_RATES = {
  courierGujaratPerKg: 30,
  courierOutsideGujaratPerKg: 50,
  postFlat: 50,
} as const;

/** Billable kg — minimum 1 kg when the cart has any weight. */
export function chargeableKg(totalWeightGrams: number): number {
  if (totalWeightGrams <= 0) return 0;
  return Math.max(1, Math.ceil(totalWeightGrams / 1000));
}

/**
 * Shipping / packaging charge stored as `packaging_charge` on orders.
 * Courier: ₹30/kg (Gujarat) or ₹50/kg (outside) after pincode verification.
 * Post: flat ₹50. In person: free.
 */
export function calculateShippingCharge(
  deliveryType: DeliveryType,
  totalWeightGrams: number,
  isGujarat: boolean | null
): number {
  if (deliveryType === "in_person") return 0;

  if (deliveryType === "post") {
    return isGujarat === null ? 0 : SHIPPING_RATES.postFlat;
  }

  // courier — needs verified pincode
  if (isGujarat === null) return 0;
  const kg = chargeableKg(totalWeightGrams);
  const rate = isGujarat
    ? SHIPPING_RATES.courierGujaratPerKg
    : SHIPPING_RATES.courierOutsideGujaratPerKg;
  return kg * rate;
}

export function shippingRateDescription(
  deliveryType: DeliveryType,
  isGujarat: boolean | null,
  totalWeightGrams: number
): string {
  if (deliveryType === "in_person") return "Free pickup";

  if (deliveryType === "post") {
    return `₹${SHIPPING_RATES.postFlat} flat (India Post)`;
  }

  const kg = chargeableKg(totalWeightGrams);
  if (isGujarat === null) {
    return `₹${SHIPPING_RATES.courierGujaratPerKg}/kg (Gujarat) · ₹${SHIPPING_RATES.courierOutsideGujaratPerKg}/kg (outside)`;
  }

  const rate = isGujarat
    ? SHIPPING_RATES.courierGujaratPerKg
    : SHIPPING_RATES.courierOutsideGujaratPerKg;
  const region = isGujarat ? "Gujarat" : "outside Gujarat";
  return `${kg} kg × ₹${rate}/kg (${region})`;
}
