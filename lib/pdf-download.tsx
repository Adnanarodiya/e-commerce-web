"use client";

import type { ComponentProps, ReactElement } from "react";
import type { InvoiceData } from "@/lib/invoice";
import type { SlipData } from "@/lib/slip";

type PdfDocumentElement = ReactElement<
  ComponentProps<typeof import("@react-pdf/renderer").Document>
>;

/**
 * Dynamically imports @react-pdf/renderer (browser-only, avoids SSR bundling)
 * and triggers a download of the rendered PDF.
 */
export async function downloadPdf(
  doc: PdfDocumentElement,
  filename: string
): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Opens the rendered PDF in a new browser tab (used for "Print slip" so the
 * browser print dialog can be invoked without forcing a download).
 */
export async function openPdfInNewTab(doc: PdfDocumentElement): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Convenience wrapper: download a colorful A4 invoice for an order. */
export async function downloadInvoicePdf(data: InvoiceData): Promise<void> {
  const { InvoiceDocument } = await import("@/components/pdf/InvoiceDocument");
  await downloadPdf(<InvoiceDocument data={data} />, `invoice-${data.id}.pdf`);
}

/** Download a B&W packing slip PDF. */
export async function downloadSlipPdf(data: SlipData): Promise<void> {
  const { SlipDocument } = await import("@/components/pdf/SlipDocument");
  await downloadPdf(<SlipDocument slip={data} />, `slip-${data.id}.pdf`);
}

/** Open packing slip PDF in a new tab for printing. */
export async function openSlipPdfInNewTab(data: SlipData): Promise<void> {
  const { SlipDocument } = await import("@/components/pdf/SlipDocument");
  await openPdfInNewTab(<SlipDocument slip={data} />);
}

/** Download a colorful A4 order confirmation (with packaging + courier). */
export async function downloadOrderConfirmationPdf(
  data: import("@/lib/order-confirmation").OrderConfirmationData
): Promise<void> {
  const { default: OrderConfirmationDocument } = await import(
    "@/components/pdf/OrderConfirmationDocument"
  );
  await downloadPdf(
    <OrderConfirmationDocument data={data} />,
    `order-confirmation-${data.id}.pdf`
  );
}

/** Generate PDF blob for Web Share API. */
export async function generateOrderConfirmationBlob(
  data: import("@/lib/order-confirmation").OrderConfirmationData
): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  const { default: OrderConfirmationDocument } = await import(
    "@/components/pdf/OrderConfirmationDocument"
  );
  return pdf(<OrderConfirmationDocument data={data} />).toBlob();
}

/** Download financial statement PDF for the current filter selection. */
export async function downloadStatementPdf(
  data: import("@/lib/statement").StatementPdfData
): Promise<void> {
  const { default: StatementDocument } = await import(
    "@/components/pdf/StatementDocument"
  );
  const mode = data.mode === "bank" ? "bank" : "cash";
  const range = data.rangeLabel.replace(/\s+/g, "-").toLowerCase();
  await downloadPdf(
    <StatementDocument data={data} />,
    `statement-${mode}-${range}.pdf`
  );
}