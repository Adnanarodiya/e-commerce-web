import type { OrderConfirmationData } from "@/lib/order-confirmation";

/**
 * Renders a "Tax Invoice" style PNG entirely on a <canvas> so it can be shared
 * as an image on WhatsApp (like the competitor's invoice screenshot).
 * No external dependencies — works offline inside the PWA.
 */

const BRAND = "#0ea5e9"; // sky blue accent bar (matches competitor look)
const BRAND_DARK = "#0284c7";
const INK = "#0f172a";
const GREY = "#64748b";
const LINE = "#e2e8f0";

const BRAND_NAME = "NOORANI MAKATIB";
const BRAND_ADDRESS = "Educational Islamic & Urdu Books";
const BRAND_EMAIL = "Email : nooranimakatib@gmail.com";

interface InvoiceImageOptions {
  received?: number;
  balance?: number;
  paymentModeLabel?: string;
}

function rupee(n: number): string {
  return `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
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

/** Indian-numbering amount to words: 4250 -> "Four Thousand Two Hundred Fifty". */
export function amountInWords(amount: number): string {
  let n = Math.round(amount);
  if (n === 0) return "Zero Rupees only";

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundreds = n;

  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundreds) parts.push(threeDigits(hundreds));

  return `${parts.join(" ")} Rupees only`;
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = LINE,
  width = 1
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Build the invoice PNG blob for an order. */
export async function generateInvoiceImageBlob(
  data: OrderConfirmationData,
  options: InvoiceImageOptions = {}
): Promise<Blob> {
  const isBank = data.payment_type === "bank";
  const total = data.total;
  // An invoice image is generated only after full payment.
  const received = options.received ?? total;
  const balance = options.balance ?? Math.max(0, total - received);
  const paymentModeLabel =
    options.paymentModeLabel ?? (isBank ? "Bank / UPI" : "Cash");

  const scale = 2; // retina crispness
  const W = 820;
  const PAD = 28;
  const rowH = 30;

  // --- pre-measure height ---
  const itemsCount = data.items.length;
  const tableTop = 250;
  const tableHeaderH = 30;
  const tableBodyH = itemsCount * rowH + rowH; // rows + total row
  const summaryTop = tableTop + tableHeaderH + tableBodyH + 24;
  const summaryLines = 6;
  const summaryBlockH = summaryLines * 26 + 20;
  const bankLines = isBank ? 4 : 0;
  const leftBlockH = 120 + bankLines * 20;
  const H = Math.max(summaryTop + summaryBlockH, summaryTop + leftBlockH) + 40;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");
  ctx.scale(scale, scale);

  // background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const rightX = W - PAD;

  // --- Company header ---
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = "bold 22px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(BRAND_NAME, PAD, 46);

  ctx.fillStyle = GREY;
  ctx.font = "11px Helvetica, Arial, sans-serif";
  ctx.fillText(BRAND_ADDRESS, PAD, 64);
  ctx.fillText(BRAND_EMAIL, PAD, 80);

  line(ctx, PAD, 96, rightX, 96, LINE, 1);

  // --- Title ---
  ctx.fillStyle = BRAND;
  ctx.font = "bold 20px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Tax Invoice", W / 2, 128);

  // --- Bill To (left) ---
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = "bold 11px Helvetica, Arial, sans-serif";
  ctx.fillText("Bill To", PAD, 162);

  ctx.font = "bold 13px Helvetica, Arial, sans-serif";
  ctx.fillText(data.customer_name || "-", PAD, 182);

  ctx.fillStyle = GREY;
  ctx.font = "11px Helvetica, Arial, sans-serif";
  if (data.customer_phone) {
    ctx.fillText(`Contact No. : ${data.customer_phone}`, PAD, 200);
  }

  // --- Invoice details (right) ---
  const created = new Date(data.created_at);
  const dateStr = created.toLocaleDateString("en-GB");
  const timeStr = created.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  ctx.textAlign = "right";
  ctx.fillStyle = INK;
  ctx.font = "bold 11px Helvetica, Arial, sans-serif";
  ctx.fillText("Invoice Details", rightX, 162);

  ctx.fillStyle = GREY;
  ctx.font = "11px Helvetica, Arial, sans-serif";
  ctx.fillText(`Invoice No. : ${data.id}`, rightX, 182);
  ctx.fillText(`Date : ${dateStr}`, rightX, 200);
  ctx.fillText(`Time : ${timeStr}`, rightX, 218);

  // --- Items table ---
  const cols = {
    idx: PAD + 6,
    name: PAD + 40,
    qty: W - 320,
    price: W - 180,
    amount: rightX,
  };

  // header band
  ctx.fillStyle = BRAND;
  ctx.fillRect(PAD, tableTop, W - PAD * 2, tableHeaderH);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("#", cols.idx, tableTop + 20);
  ctx.fillText("Item name", cols.name, tableTop + 20);
  ctx.textAlign = "right";
  ctx.fillText("Quantity", cols.qty, tableTop + 20);
  ctx.fillText("Price/ Unit", cols.price, tableTop + 20);
  ctx.fillText("Amount", cols.amount, tableTop + 20);

  // rows
  let y = tableTop + tableHeaderH;
  ctx.font = "11px Helvetica, Arial, sans-serif";
  let totalQty = 0;
  data.items.forEach((item, i) => {
    const rowY = y + 20;
    totalQty += item.quantity;
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.fillText(String(i + 1), cols.idx, rowY);

    // clamp name width
    let name = item.book_name || "-";
    const maxNameW = cols.qty - cols.name - 90;
    while (ctx.measureText(name).width > maxNameW && name.length > 4) {
      name = name.slice(0, -2);
    }
    if (name !== (item.book_name || "-")) name += "…";
    ctx.fillText(name, cols.name, rowY);

    ctx.textAlign = "right";
    ctx.fillText(String(item.quantity), cols.qty, rowY);
    ctx.fillText(rupee(item.price), cols.price, rowY);
    ctx.fillText(rupee(item.price * item.quantity), cols.amount, rowY);

    line(ctx, PAD, y + rowH, rightX, y + rowH, LINE, 0.6);
    y += rowH;
  });

  // total row
  const totalRowY = y + 20;
  ctx.fillStyle = INK;
  ctx.font = "bold 12px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Total", cols.name, totalRowY);
  ctx.textAlign = "right";
  ctx.fillText(String(totalQty), cols.qty, totalRowY);
  ctx.fillText(rupee(total), cols.amount, totalRowY);
  line(ctx, PAD, y, rightX, y, INK, 1.2);
  y += rowH;
  line(ctx, PAD, y, rightX, y, INK, 1.2);

  // --- Bottom two columns ---
  const bottomY = summaryTop;

  // LEFT: amount in words, terms, pay-to
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = "bold 11px Helvetica, Arial, sans-serif";
  ctx.fillText("Invoice Amount In Words", PAD, bottomY);
  ctx.fillStyle = GREY;
  ctx.font = "11px Helvetica, Arial, sans-serif";
  ctx.fillText(amountInWords(total), PAD, bottomY + 18);

  ctx.fillStyle = INK;
  ctx.font = "bold 11px Helvetica, Arial, sans-serif";
  ctx.fillText("Terms and Conditions", PAD, bottomY + 48);
  ctx.fillStyle = BRAND_DARK;
  ctx.font = "11px Helvetica, Arial, sans-serif";
  ctx.fillText("Thanks for doing business", PAD, bottomY + 66);

  if (isBank && (data.payee_name || data.upi_id)) {
    ctx.fillStyle = INK;
    ctx.font = "bold 11px Helvetica, Arial, sans-serif";
    ctx.fillText("Pay To:", PAD, bottomY + 96);
    ctx.fillStyle = GREY;
    ctx.font = "11px Helvetica, Arial, sans-serif";
    let py = bottomY + 114;
    if (data.payee_name) {
      ctx.fillText(`Account holder's name : ${data.payee_name}`, PAD, py);
      py += 18;
    }
    if (data.upi_id) {
      ctx.fillText(`UPI ID : ${data.upi_id}`, PAD, py);
    }
  }

  // RIGHT: summary box
  const boxX = W - 320;
  const boxW = 320 - PAD;
  let sy = bottomY - 8;
  const rowsSummary: [string, string, boolean?][] = [
    ["Sub Total", rupee(data.subtotal)],
  ];
  if ((data.discount ?? 0) > 0) rowsSummary.push(["Discount", `- ${rupee(data.discount)}`]);
  if ((data.packaging_charge ?? 0) > 0)
    rowsSummary.push(["Packaging", rupee(data.packaging_charge)]);
  if ((data.courier_charge ?? 0) > 0)
    rowsSummary.push(["Courier", rupee(data.courier_charge)]);

  ctx.font = "11px Helvetica, Arial, sans-serif";
  rowsSummary.forEach(([label, value]) => {
    ctx.fillStyle = GREY;
    ctx.textAlign = "left";
    ctx.fillText(label, boxX, sy + 4);
    ctx.fillStyle = INK;
    ctx.textAlign = "right";
    ctx.fillText(value, rightX, sy + 4);
    line(ctx, boxX, sy + 14, rightX, sy + 14, LINE, 0.6);
    sy += 26;
  });

  // Total highlighted band
  ctx.fillStyle = BRAND;
  ctx.fillRect(boxX - 6, sy - 8, boxW + 12, 26);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Total", boxX, sy + 9);
  ctx.textAlign = "right";
  ctx.fillText(rupee(total), rightX, sy + 9);
  sy += 34;

  const tail: [string, string][] = [
    ["Received", rupee(received)],
    ["Balance", rupee(balance)],
    ["Payment mode", paymentModeLabel],
  ];
  ctx.font = "11px Helvetica, Arial, sans-serif";
  tail.forEach(([label, value]) => {
    ctx.fillStyle = GREY;
    ctx.textAlign = "left";
    ctx.fillText(label, boxX, sy + 4);
    ctx.fillStyle = INK;
    ctx.textAlign = "right";
    ctx.fillText(value, rightX, sy + 4);
    line(ctx, boxX, sy + 14, rightX, sy + 14, LINE, 0.6);
    sy += 26;
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
      0.95
    );
  });
}

/** Trigger a download of the invoice PNG. */
export async function downloadInvoiceImage(
  data: OrderConfirmationData
): Promise<void> {
  const blob = await generateInvoiceImageBlob(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${data.id}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
