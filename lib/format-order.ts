/** Human-readable delivery method (DB values: courier | post | in_person). */
export function formatDeliveryType(deliveryType: string): string {
  switch (deliveryType) {
    case "in_person":
      return "In Person";
    case "courier":
      return "Courier";
    case "post":
      return "Post";
    default:
      return deliveryType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/** e.g. "7 types, 22 books" */
export function formatOrderItemsSummary(
  items: { quantity: number }[]
): string {
  const types = items.length;
  const books = items.reduce((sum, item) => sum + item.quantity, 0);
  return `${types} ${types === 1 ? "type" : "types"}, ${books} ${books === 1 ? "book" : "books"}`;
}

/** PDF-safe currency (Helvetica lacks the ₹ glyph). */
export function formatMoneyPdf(amount: number): string {
  return `Rs. ${amount.toFixed(2)}`;
}

/** Web UI currency */
export function formatMoneyInr(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}
