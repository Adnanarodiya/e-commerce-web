/** Minimum cart subtotal (₹) to qualify for bulk % and Quran per-copy discounts. */
export const DISCOUNT_MIN_SUBTOTAL = 5000;

/** Bulk % discount on non-Quran books by payment method. */
export const BANK_DISCOUNT_RATE = 0.1; // 10%
export const CASH_DISCOUNT_RATE = 0.15; // 15%

/** @deprecated use BANK_DISCOUNT_RATE / CASH_DISCOUNT_RATE */
export const BULK_DISCOUNT_RATE = BANK_DISCOUNT_RATE;

export const QURAN_DISCOUNT_PER_COPY = 25;

export type PaymentDiscountType = "bank" | "cash";

export function bulkDiscountRate(paymentType: PaymentDiscountType): number {
  return paymentType === "cash" ? CASH_DISCOUNT_RATE : BANK_DISCOUNT_RATE;
}

/** Display percent, e.g. 10 or 15 */
export function bulkDiscountPercent(paymentType: PaymentDiscountType): number {
  return Math.round(bulkDiscountRate(paymentType) * 100);
}

export function qualifiesForOrderDiscounts(subtotal: number): boolean {
  return subtotal >= DISCOUNT_MIN_SUBTOTAL;
}

export function computeOrderDiscounts(params: {
  subtotal: number;
  quranSubtotal: number;
  quranQty: number;
  nonQuranSubtotal: number;
  paymentType?: PaymentDiscountType | string;
}): {
  quranDiscount: number;
  percentageDiscount: number;
  discount: number;
  bulkPercent: number;
} {
  const paymentType: PaymentDiscountType =
    params.paymentType === "cash" ? "cash" : "bank";
  const rate = bulkDiscountRate(paymentType);
  const bulkPercent = bulkDiscountPercent(paymentType);
  const qualifies = qualifiesForOrderDiscounts(params.subtotal);

  const quranDiscount = qualifies
    ? Math.min(params.quranSubtotal, params.quranQty * QURAN_DISCOUNT_PER_COPY)
    : 0;

  let percentageDiscount = 0;
  if (qualifies && params.nonQuranSubtotal > 0) {
    percentageDiscount = params.nonQuranSubtotal * rate;
  }

  return {
    quranDiscount,
    percentageDiscount,
    discount: quranDiscount + percentageDiscount,
    bulkPercent,
  };
}
