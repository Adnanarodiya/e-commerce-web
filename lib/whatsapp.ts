import type { OrderConfirmationData } from "@/lib/order-confirmation";

/** Normalize Indian phone numbers for wa.me links (91 prefix). */
export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

export function formatOrderWhatsAppMessage(data: OrderConfirmationData): string {
  const products = data.productsTotal.toFixed(2);
  const packaging = data.packaging_charge.toFixed(2);
  const courier = data.courier_charge.toFixed(2);
  const total = data.total.toFixed(2);
  const isBank = data.payment_type === "bank";

  const lines = [
    `Assalamualaikum ${data.customer_name},`,
    "",
    `Your order *${data.id}* quotation:`,
    "",
    `Products: ₹${products}`,
    `Packaging: ₹${packaging}`,
    `Courier: ₹${courier}`,
    `*Total: ₹${total}*`,
    "",
  ];

  if (isBank) {
    lines.push("Payment: *Bank / UPI*");
    if (data.payee_name) lines.push(`Payee: ${data.payee_name}`);
    if (data.upi_id) lines.push(`UPI ID: ${data.upi_id}`);
    lines.push("");
  } else if (data.payment_type === "cash") {
    lines.push("Payment: *Cash on Delivery*");
    lines.push("");
  }

  lines.push(`Status: ${data.statusLabel}`, "", "— Noorani Makatib");
  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** Open WhatsApp chat directly for this phone (app or WhatsApp Web). */
export function openWhatsAppChat(phone: string, message: string): void {
  const url = buildWhatsAppUrl(phone, message);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Share quotation directly to the order customer number via wa.me (text only). */
export function shareOrderOnWhatsApp(options: {
  phone: string;
  data: OrderConfirmationData;
}): "opened" {
  openWhatsAppChat(options.phone, formatOrderWhatsAppMessage(options.data));
  return "opened";
}
