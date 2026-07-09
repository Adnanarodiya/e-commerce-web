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

  return [
    `Assalamualaikum ${data.customer_name},`,
    "",
    `Your order *${data.id}* is confirmed.`,
    "",
    `Products: ₹${products}`,
    `Packaging: ₹${packaging}`,
    `Courier: ₹${courier}`,
    `*Total: ₹${total}*`,
    "",
    `Status: ${data.statusLabel}`,
    "",
    "Please find the order confirmation PDF attached.",
    "— Noorani Makatib",
  ].join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** Open WhatsApp chat via wa.me (works on phone app + desktop web). */
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
