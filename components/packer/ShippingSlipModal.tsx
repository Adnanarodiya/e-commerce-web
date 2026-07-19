"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { openSlipPdfInNewTab, downloadSlipPdf } from "@/lib/pdf-download";
import {
  formatBookWeight,
  formatDeliveryType,
  formatOrderItemsSummary,
  orderItemsTotalWeight,
} from "@/lib/format-order";
import { enrichSlipWithWeights } from "@/lib/slip";
import { useLockBodyScroll } from "@/lib/use-lock-body-scroll";
import { Printer, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SlipItem {
  book_id?: number;
  book_name: string;
  quantity: number;
}

export interface ShippingSlipData {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_type: string;
  items: SlipItem[];
  created_at?: string;
}

interface ShippingSlipModalProps {
  slip: ShippingSlipData;
  labels: {
    slipTitle: string;
    slipDesc: string;
    orderId: string;
    name: string;
    phone: string;
    shippingAddress: string;
    deliveryMethod: string;
  };
  weightByBookId?: Map<number, number>;
  onClose: () => void;
}

function SlipField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="py-2.5 border-b border-gray-100 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </p>
      <p
        className={`text-sm font-bold text-gray-900 break-words leading-snug ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function ShippingSlipModal({
  slip,
  labels,
  weightByBookId,
  onClose,
}: ShippingSlipModalProps) {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useLockBodyScroll(mounted);

  if (!mounted) return null;

  const handlePrint = async () => {
    setBusy(true);
    try {
      await openSlipPdfInNewTab(enrichSlipWithWeights(slip, weightByBookId));
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadSlipPdf(enrichSlipWithWeights(slip, weightByBookId));
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div id="shipping-slip-print-host">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 overscroll-none touch-none"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="bg-white text-black w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl border border-gray-200 h-[90dvh] max-h-[90dvh] sm:h-auto sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 px-4 pt-4 pb-3 sm:px-6 sm:pt-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight leading-tight">
                  {labels.slipTitle}
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {labels.slipDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-1 rounded-full hover:bg-gray-100 shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
            <SlipPreview
              slip={slip}
              labels={labels}
              weightByBookId={weightByBookId}
            />
          </div>

          <div className="shrink-0 px-4 pb-4 pt-3 sm:px-6 sm:pb-6 border-t border-dashed border-gray-300 bg-white">
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
                disabled={busy}
              >
                Close
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownload}
                disabled={busy}
              >
                <Download className="h-4 w-4 mr-1.5 shrink-0" />
                Download
              </Button>
              <Button
                className="w-full bg-primary text-white"
                onClick={handlePrint}
                disabled={busy}
              >
                <Printer className="h-4 w-4 mr-1.5 shrink-0" />
                {busy ? "Preparing…" : "Print Slip"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SlipPreview({
  slip,
  labels,
  weightByBookId,
}: {
  slip: ShippingSlipModalProps["slip"];
  labels: ShippingSlipModalProps["labels"];
  weightByBookId?: Map<number, number>;
}) {
  const weights = weightByBookId ?? new Map<number, number>();
  const totalWeight = orderItemsTotalWeight(slip.items, weights);

  return (
    <div className="space-y-3 text-sm">
      <div className="border-2 border-black rounded-lg p-3 text-center">
        <p className="text-sm sm:text-base font-bold tracking-wide leading-tight">
          PACKING &amp; SHIPPING SLIP
        </p>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 leading-relaxed">
          Noorani Makatib · attach to the packed box
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3">
        <SlipField label={labels.orderId} value={slip.id} mono />
        <SlipField label={labels.name} value={slip.customer_name} />
        <SlipField label={labels.phone} value={slip.customer_phone} mono />
        <SlipField label={labels.shippingAddress} value={slip.customer_address} />
        <SlipField
          label={labels.deliveryMethod}
          value={formatDeliveryType(slip.delivery_type)}
        />
        {totalWeight > 0 && (
          <SlipField label="Total weight" value={formatBookWeight(totalWeight)} />
        )}
      </div>

      <Separator className="border-dashed" />

      <div>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">
          Pack content · {formatOrderItemsSummary(slip.items)}
        </p>
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
          {slip.items.map((item, idx) => {
            const unitWeight =
              item.book_id != null ? weights.get(item.book_id) ?? 0 : 0;
            const lineWeight = unitWeight * item.quantity;
            return (
              <div
                key={idx}
                className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between px-3 py-2.5"
              >
                <span className="text-sm font-medium text-gray-900 break-words">
                  {item.book_name}
                </span>
                <span className="text-xs font-bold text-gray-600 shrink-0 text-right">
                  {item.quantity} {item.quantity === 1 ? "book" : "books"}
                  {unitWeight > 0 && (
                    <span className="font-normal text-gray-500">
                      {" "}
                      × {formatBookWeight(unitWeight)} ={" "}
                      <span className="font-bold text-gray-900">
                        {formatBookWeight(lineWeight)}
                      </span>
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
