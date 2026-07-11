/** Minimum cart subtotal (₹) to qualify for bulk % and Quran per-copy discounts. */
export const DISCOUNT_MIN_SUBTOTAL = 5000;

/** Bulk discount on non-Quran books — same rate for cash and bank. */
export const BULK_DISCOUNT_RATE = 0.1;

export const QURAN_DISCOUNT_PER_COPY = 25;

export function qualifiesForOrderDiscounts(subtotal: number): boolean {
  return subtotal >= DISCOUNT_MIN_SUBTOTAL;
}

export function computeOrderDiscounts(params: {
  subtotal: number;
  quranSubtotal: number;
  quranQty: number;
  nonQuranSubtotal: number;
}): {
  quranDiscount: number;
  percentageDiscount: number;
  discount: number;
} {
  const qualifies = qualifiesForOrderDiscounts(params.subtotal);

  const quranDiscount = qualifies
    ? Math.min(params.quranSubtotal, params.quranQty * QURAN_DISCOUNT_PER_COPY)
    : 0;

  let percentageDiscount = 0;
  if (qualifies && params.nonQuranSubtotal > 0) {
    percentageDiscount = params.nonQuranSubtotal * BULK_DISCOUNT_RATE;
  }

  return {
    quranDiscount,
    percentageDiscount,
    discount: quranDiscount + percentageDiscount,
  };
}
