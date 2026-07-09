import type { InvoiceData } from "@/lib/invoice";

export interface OrderConfirmationData extends InvoiceData {
  courier_charge: number;
  status: string;
  statusLabel: string;
  admin_notes?: string;
  productsTotal: number;
}

interface OrderItemLike {
  book_id: number;
  book_name: string;
  quantity: number;
  price: number;
}

interface OrderLike {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  delivery_type: string;
  payment_type: string;
  subtotal: number;
  discount: number;
  packaging_charge: number;
  courier_charge?: number;
  total: number;
  status: string;
  created_at: string;
  admin_notes?: string | null;
  items: OrderItemLike[];
}

export function deriveOrderDiscounts(
  order: OrderLike,
  isQuranById: Map<number, boolean>
) {
  const quranSubtotal = order.items
    .filter((it) => isQuranById.get(it.book_id) ?? false)
    .reduce((sum, it) => sum + it.price * it.quantity, 0);
  const nonQuranSubtotal = order.subtotal - quranSubtotal;
  const quranQty = order.items
    .filter((it) => isQuranById.get(it.book_id) ?? false)
    .reduce((sum, it) => sum + it.quantity, 0);
  const quranDiscount = Math.min(quranSubtotal, quranQty * 25);

  let percentageDiscount = 0;
  if (order.subtotal >= 5000 && nonQuranSubtotal > 0) {
    const rate = order.payment_type === "bank" ? 0.1 : 0.15;
    percentageDiscount = nonQuranSubtotal * rate;
  }

  return { quranDiscount, percentageDiscount };
}

export function buildOrderConfirmationData(
  order: OrderLike,
  isQuranById: Map<number, boolean>,
  upi?: { upi_id?: string; payee_name?: string }
): OrderConfirmationData {
  const { quranDiscount, percentageDiscount } = deriveOrderDiscounts(order, isQuranById);
  const productsTotal = Math.max(0, order.subtotal - order.discount);

  const statusLabel =
    order.status === "ready_to_pack"
      ? "Ready to Pack"
      : order.status === "packed"
        ? "Packed"
        : order.status === "cancelled"
          ? "Cancelled"
          : "Order Under Processing";

  return {
    id: order.id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    customer_address: order.customer_address,
    delivery_type: order.delivery_type,
    payment_type: order.payment_type,
    subtotal: order.subtotal,
    discount: order.discount,
    quranDiscount,
    percentageDiscount,
    packaging_charge: Number(order.packaging_charge ?? 0),
    courier_charge: Number(order.courier_charge ?? 0),
    total: order.total,
    productsTotal,
    status: order.status,
    statusLabel,
    admin_notes: order.admin_notes ?? undefined,
    created_at: order.created_at,
    items: order.items.map((it) => ({
      ...it,
      is_quran: isQuranById.get(it.book_id) ?? false,
    })),
    upi_id: upi?.upi_id,
    payee_name: upi?.payee_name,
  };
}
