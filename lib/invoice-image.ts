import type { OrderConfirmationData } from "@/lib/order-confirmation";

/**
 * Paid invoice PNG for WhatsApp — layout inspired by Noorani Book invoices
 * (header, INVOICE banner, Bill To, green PAID stamp, item table, totals).
 */

const BLUE = "#7eb8d8";
const BLUE_SOFT = "#d6ebf5";
const INK = "#111827";
const GREY = "#4b5563";
const LINE = "#cbd5e1";
const PAID_GREEN = "#16a34a";

const BRAND_NAME = "NOORANI MAKATIB";
const BRAND_ADDRESS_1 =
  "MARYAM MASJID, DESAI NAGAR, MG ROAD, BARDOLI, 394601";
const BRAND_ADDRESS_2 = "& MAHMUD NAGAR, DABHEL, NAVSARI, 396415.";
const BRAND_CONTACT = "CONTACT : 8140902756";

interface InvoiceImageOptions {
  received?: number;
  balance?: number;
  paymentModeLabel?: string;
  /** book_id → weight in grams */
  weightByBookId?: Map<number, number>;
}

function money(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty",
  "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? ` ${ONES[o]}` : "");
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

export function amountInWords(amount: number): string {
  let n = Math.round(amount);
  if (n === 0) return "Zero Rupees Only";

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return `${parts.join(" ")} Rupees Only`;
}

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

function cityFromAddress(address: string): string {
  if (!address) return "";
  const parts = address
    .split(/[,|\n]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2] || parts[0];
  return parts[0] || "";
}

function drawPaidStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius = 46
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-18 * Math.PI) / 180);

  // Outer jagged ring
  ctx.beginPath();
  const spikes = 36;
  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius - 5;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = PAID_GREEN;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner circle
  ctx.beginPath();
  ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = PAID_GREEN;
  ctx.font = "bold 20px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PAID", 0, 1);
  ctx.restore();
}

/** Build the paid invoice PNG blob for an order. */
export async function generateInvoiceImageBlob(
  data: OrderConfirmationData,
  options: InvoiceImageOptions = {}
): Promise<Blob> {
  const total = data.total;
  const received = options.received ?? total;
  const paymentModeLabel =
    options.paymentModeLabel ??
    (data.payment_type === "bank" ? "Bank / UPI" : "Cash");
  const weights = options.weightByBookId ?? new Map<number, number>();

  const orderDiscount = Math.max(0, Number(data.discount ?? 0));
  const subtotal = Math.max(0, Number(data.subtotal ?? 0));
  const packaging = Math.max(0, Number(data.packaging_charge ?? 0));
  const courier = Math.max(0, Number(data.courier_charge ?? 0));
  const productsTotal = Math.max(0, subtotal - orderDiscount);

  const scale = 2;
  const W = 900;
  const PAD = 28;
  const rowH = 26;
  const tableHeaderH = 28;

  const itemsCount = Math.max(1, data.items.length);
  const headerH = 168;
  const metaH = 110;
  const tableTop = headerH + metaH;
  const tableBodyH = itemsCount * rowH + rowH; // rows + total
  const afterTable = tableTop + tableHeaderH + tableBodyH + 18;
  const footerH = 140;
  const H = afterTable + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  const rightX = W - PAD;

  // --- Header ---
  ctx.fillStyle = INK;
  ctx.font = "bold 26px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(BRAND_NAME, PAD, 42);

  ctx.fillStyle = GREY;
  ctx.font = "10px Helvetica, Arial, sans-serif";
  ctx.fillText(BRAND_ADDRESS_1, PAD, 62);
  ctx.fillText(BRAND_ADDRESS_2, PAD, 76);
  ctx.fillText(BRAND_CONTACT, PAD, 94);

  // INVOICE banner
  ctx.fillStyle = BLUE;
  ctx.fillRect(PAD, 118, W - PAD * 2, 34);
  ctx.fillStyle = INK;
  ctx.font = "bold 18px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("INVOICE", W / 2, 141);

  // --- Bill To + Invoice meta ---
  const created = new Date(data.created_at);
  const dateStr = created
    .toLocaleDateString("en-GB")
    .replace(/\//g, "-");
  const city = cityFromAddress(data.customer_address);

  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = "bold 12px Helvetica, Arial, sans-serif";
  ctx.fillText("Bill To", PAD, 180);
  ctx.font = "bold 13px Helvetica, Arial, sans-serif";
  ctx.fillText(data.customer_name || "-", PAD, 200);
  ctx.fillStyle = GREY;
  ctx.font = "11px Helvetica, Arial, sans-serif";
  if (city) ctx.fillText(city, PAD, 218);
  if (data.customer_phone) {
    ctx.fillText(data.customer_phone, PAD, city ? 234 : 218);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = INK;
  ctx.font = "11px Helvetica, Arial, sans-serif";
  ctx.fillText(`Invoice No. : ${data.id}`, rightX, 200);
  ctx.fillText(`Date : ${dateStr}`, rightX, 218);

  // PAID stamp (center)
  drawPaidStamp(ctx, W / 2, 212, 48);

  // --- Table ---
  const cols = {
    idx: PAD + 8,
    name: PAD + 36,
    price: W - 430,
    qty: W - 350,
    weight: W - 270,
    amount: W - 190,
    less: W - 110,
    total: rightX,
  };

  ctx.fillStyle = BLUE;
  ctx.fillRect(PAD, tableTop, W - PAD * 2, tableHeaderH);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("#", cols.idx, tableTop + 18);
  ctx.fillText("Book Name", cols.name, tableTop + 18);
  ctx.textAlign = "right";
  ctx.fillText("Price", cols.price, tableTop + 18);
  ctx.fillText("Qty", cols.qty, tableTop + 18);
  ctx.fillText("Weight", cols.weight, tableTop + 18);
  ctx.fillText("Amount", cols.amount, tableTop + 18);
  ctx.fillText("Less", cols.less, tableTop + 18);
  ctx.fillText("Total", cols.total, tableTop + 18);

  let y = tableTop + tableHeaderH;
  let totalQty = 0;
  let totalWeightKg = 0;
  let totalAmount = 0;
  let totalLess = 0;
  let totalNet = 0;

  data.items.forEach((item, i) => {
    const amount = item.price * item.quantity;
    const share =
      subtotal > 0 ? (amount / subtotal) * orderDiscount : 0;
    const less = Math.round(share * 100) / 100;
    const net = Math.max(0, amount - less);
    const unitG =
      "book_id" in item && typeof (item as { book_id?: number }).book_id === "number"
        ? weights.get((item as { book_id: number }).book_id) ?? 0
        : 0;
    const lineKg = (unitG * item.quantity) / 1000;

    totalQty += item.quantity;
    totalWeightKg += lineKg;
    totalAmount += amount;
    totalLess += less;
    totalNet += net;

    const rowY = y + 18;
    if (i % 2 === 1) {
      ctx.fillStyle = BLUE_SOFT;
      ctx.fillRect(PAD, y, W - PAD * 2, rowH);
    }

    ctx.fillStyle = INK;
    ctx.font = "10px Helvetica, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(String(i + 1), cols.idx, rowY);
    ctx.fillText(
      truncate(ctx, item.book_name || "-", cols.price - cols.name - 16),
      cols.name,
      rowY
    );

    ctx.textAlign = "right";
    ctx.fillText(money(item.price), cols.price, rowY);
    ctx.fillText(money(item.quantity), cols.qty, rowY);
    ctx.fillText(lineKg > 0 ? money(lineKg) : "-", cols.weight, rowY);
    ctx.fillText(money(amount), cols.amount, rowY);
    ctx.fillText(money(less), cols.less, rowY);
    ctx.fillText(money(net), cols.total, rowY);

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(PAD, y + rowH);
    ctx.lineTo(rightX, y + rowH);
    ctx.stroke();
    y += rowH;
  });

  // Total row
  {
    const rowY = y + 18;
    ctx.fillStyle = BLUE_SOFT;
    ctx.fillRect(PAD, y, W - PAD * 2, rowH);
    ctx.fillStyle = INK;
    ctx.font = "bold 11px Helvetica, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Total", cols.name, rowY);
    ctx.textAlign = "right";
    ctx.fillText(money(totalQty), cols.qty, rowY);
    ctx.fillText(
      totalWeightKg > 0 ? `${money(totalWeightKg)} Kg` : "-",
      cols.weight,
      rowY
    );
    ctx.fillText(money(totalAmount), cols.amount, rowY);
    ctx.fillText(money(totalLess), cols.less, rowY);
    ctx.fillText(money(totalNet || productsTotal), cols.total, rowY);
    y += rowH;
  }

  // --- Bottom: amount in words + summary ---
  const bottomY = y + 28;
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = "bold 11px Helvetica, Arial, sans-serif";
  ctx.fillText("Amount in Words", PAD, bottomY);
  ctx.fillStyle = GREY;
  ctx.font = "11px Helvetica, Arial, sans-serif";
  const words = amountInWords(total);
  ctx.fillText(truncate(ctx, words, 380), PAD, bottomY + 18);

  const boxX = W - 310;
  const summary: [string, string, boolean?][] = [
    ["Amount", money(productsTotal)],
    ["Packaging Charge", money(packaging)],
    ["Courier Amount", money(courier)],
    ["Grand Total", money(total), true],
  ];

  let sy = bottomY - 4;
  summary.forEach(([label, value, strong]) => {
    if (strong) {
      ctx.fillStyle = BLUE_SOFT;
      ctx.fillRect(boxX - 8, sy - 12, 310 - PAD + 8, 24);
      ctx.font = "bold 12px Helvetica, Arial, sans-serif";
      ctx.fillStyle = INK;
    } else {
      ctx.font = "11px Helvetica, Arial, sans-serif";
      ctx.fillStyle = GREY;
    }
    ctx.textAlign = "left";
    ctx.fillText(label, boxX, sy);
    ctx.fillStyle = INK;
    ctx.textAlign = "right";
    ctx.fillText(value, rightX, sy);
    sy += 22;
  });

  ctx.textAlign = "left";
  ctx.fillStyle = GREY;
  ctx.font = "10px Helvetica, Arial, sans-serif";
  ctx.fillText(`Payment mode : ${paymentModeLabel}`, PAD, bottomY + 48);
  ctx.fillText(`Received : ${money(received)}`, PAD, bottomY + 64);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
      0.95
    );
  });
}

export async function downloadInvoiceImage(
  data: OrderConfirmationData,
  options: InvoiceImageOptions = {}
): Promise<void> {
  const blob = await generateInvoiceImageBlob(data, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${data.id}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
