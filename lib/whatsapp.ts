import type { OrderConfirmationData } from "@/lib/order-confirmation";
import { generateInvoiceImageBlob } from "@/lib/invoice-image";

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
  const bookLines = data.items.map((item, index) => {
    const unitPrice = item.price.toFixed(2);
    const lineTotal = (item.price * item.quantity).toFixed(2);
    return `${index + 1}. *${item.book_name}*\n   ${item.quantity} × ₹${unitPrice} = ₹${lineTotal}`;
  });

  const lines = [
    `Assalamualaikum ${data.customer_name},`,
    "",
    `Your order *${data.id}* quotation:`,
    "",
    "*Books:*",
    ...bookLines,
    "",
    `Products: ₹${products}`,
    `Packaging: ₹${packaging}`,
    `Courier: ₹${courier}`,
    `*Total: ₹${total}*`,
    "",
  ];

  if (isBank) {
    lines.push("Payment: *Bank / UPI*");
    // if (data.payee_name) lines.push(`Payee: ${data.payee_name}`);
    // if (data.upi_id) lines.push(`UPI ID: ${data.upi_id}`);
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

/** Open the customer's WhatsApp chat with the complete quotation text. */
export function shareOrderOnWhatsApp(options: {
  phone: string;
  data: OrderConfirmationData;
}): "opened" {
  openWhatsAppChat(options.phone, formatOrderWhatsAppMessage(options.data));
  return "opened";
}

/** Short status when admin confirms order → ready to pack. */
export function formatOrderConfirmedWhatsAppMessage(order: {
  id: string;
  customer_name: string;
}): string {
  return [
    `Assalamualaikum ${order.customer_name},`,
    "",
    `Your order number *${order.id}* has been confirmed.`,
    "It is now ready for packing.",
    "",
    "Thank you for ordering with us.",
    "",
    "— Noorani Makatib",
  ].join("\n");
}

/** Open WhatsApp with the ready-to-pack confirmation status. */
export function shareOrderConfirmedOnWhatsApp(order: {
  id: string;
  customer_name: string;
  customer_phone: string;
}): "opened" {
  openWhatsAppChat(
    order.customer_phone,
    formatOrderConfirmedWhatsAppMessage(order)
  );
  return "opened";
}

export type InvoiceShareKind = "quotation" | "invoice";

/** Caption sent with the Tax Invoice image (competitor-style). */
export function formatTransactionUpdateMessage(
  data: OrderConfirmationData,
  kind: InvoiceShareKind = "invoice"
): string {
  const isBank = data.payment_type === "bank";
  const total = Math.round(data.total).toLocaleString("en-IN");
  // Quotations are unpaid; an invoice is sent only after full payment.
  const balance =
    kind === "quotation" ? total : "0";

  const heading =
    kind === "quotation" ? "*QUOTATION*" : "*TRANSACTION UPDATE*";
  const intro =
    kind === "quotation"
      ? "Please find the quotation for your order below. Kindly review and confirm."
      : "We are pleased to have you as a valued customer. Please find the details of your transaction.";

  const lines = [
    heading,
    "",
    "Greetings from Noorani Makatib",
    intro,
    "",
    kind === "quotation" ? "Quotation :" : "Sale Invoice :",
    `Invoice No: ${data.id}`,
    `Invoice Amount: ₹${total}`,
    `Balance: ₹${balance}`,
    "",
  ];

  if (kind === "quotation") {
    const products = data.productsTotal.toFixed(2);
    const packaging = data.packaging_charge.toFixed(2);
    const courier = data.courier_charge.toFixed(2);
    lines.push(
      `Products: ₹${products}`,
      `Packaging: ₹${packaging}`,
      `Courier: ₹${courier}`,
      `*Total: ₹${total}*`,
      ""
    );
    if (isBank) {
      lines.push("Payment: *Bank / UPI*");
      if (data.payee_name) lines.push(`Payee: ${data.payee_name}`);
      if (data.upi_id) lines.push(`UPI ID: ${data.upi_id}`);
      lines.push("");
    } else {
      lines.push("Payment: *Cash on Delivery*", "");
    }
  }

  lines.push(
    "Thanks for doing business with us.",
    "Regards,",
    "Noorani Makatib"
  );
  return lines.join("\n");
}

export interface ShareInvoiceOptions {
  kind?: InvoiceShareKind;
  received?: number;
  balance?: number;
  weightByBookId?: Map<number, number>;
}

/**
 * Share the paid invoice IMAGE + caption.
 * Invoice always shows PAID (full payment received, balance 0).
 *
 * Free WhatsApp path: download image + open customer chat with caption.
 * Native share sheet is offered on phones that support file sharing.
 */
export async function shareInvoiceImageOnWhatsApp(
  data: OrderConfirmationData,
  options: ShareInvoiceOptions = {}
): Promise<"shared" | "fallback"> {
  const kind = options.kind ?? "invoice";
  const message = formatTransactionUpdateMessage(data, kind);
  const blob = await generateInvoiceImageBlob(data, {
    received: options.received ?? data.total,
    balance: options.balance ?? 0,
    weightByBookId: options.weightByBookId,
  });
  const file = new File([blob], `invoice-${data.id}.png`, {
    type: "image/png",
  });

  // Always save the image locally so attach is one tap away.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${data.id}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  // Always open the correct customer chat with the caption.
  openWhatsAppChat(data.customer_phone, message);

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const canShareFiles =
    !!nav &&
    typeof nav.canShare === "function" &&
    nav.canShare({ files: [file] });

  if (canShareFiles && typeof nav!.share === "function") {
    try {
      await new Promise((r) => setTimeout(r, 400));
      await nav!.share({
        files: [file],
        text: message,
        title: `Invoice ${data.id}`,
      });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "shared";
      }
    }
  }

  return "fallback";
}
