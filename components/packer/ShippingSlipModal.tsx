"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { openSlipPdfInNewTab, downloadSlipPdf } from "@/lib/pdf-download";
import { Printer, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SlipItem {
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
  onClose: () => void;
}

export default function ShippingSlipModal({
  slip,
  labels,
  onClose,
}: ShippingSlipModalProps) {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const handlePrint = async () => {
    setBusy(true);
    try {
      await openSlipPdfInNewTab(slip);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadSlipPdf(slip);
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div id="shipping-slip-print-host">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="bg-white text-black p-6 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {labels.slipTitle}
              </h2>
              <p className="text-xs text-gray-500 mt-1">{labels.slipDesc}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <SlipPreview slip={slip} labels={labels} />

          <div className="slip-screen-actions pt-4 border-t border-dashed border-gray-300 flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="flex-1 min-w-[100px]"
              onClick={onClose}
              disabled={busy}
            >
              Close
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-w-[100px]"
              onClick={handleDownload}
              disabled={busy}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              className="flex-1 min-w-[100px] bg-primary text-white"
              onClick={handlePrint}
              disabled={busy}
            >
              <Printer className="h-4 w-4 mr-2" />
              {busy ? "Preparing…" : "Print Slip"}
            </Button>
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
}: {
  slip: ShippingSlipModalProps["slip"];
  labels: ShippingSlipModalProps["labels"];
}) {
  return (
    <div className="py-2 space-y-3 text-sm">
      <div className="border-2 border-black rounded p-3 text-center">
        <p className="text-base font-bold tracking-widest">
          PACKING &amp; SHIPPING SLIP
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          Noorani Makatib · attach to the packed box
        </p>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-500 font-medium shrink-0">
          {labels.orderId}:
        </span>
        <span className="font-bold text-right">{slip.id}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-500 font-medium shrink-0">
          {labels.name}:
        </span>
        <span className="font-bold text-right">{slip.customer_name}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-500 font-medium shrink-0">
          {labels.phone}:
        </span>
        <span className="font-bold text-right">{slip.customer_phone}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-500 font-medium shrink-0">
          {labels.shippingAddress}:
        </span>
        <span className="font-bold text-right">{slip.customer_address}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-500 font-medium shrink-0">
          {labels.deliveryMethod}:
        </span>
        <span className="font-bold capitalize text-right">
          {slip.delivery_type}
        </span>
      </div>

      <Separator className="border-dashed my-2" />

      <div>
        <span className="text-xs text-gray-400 font-bold block mb-1">
          PACK CONTENT
        </span>
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 space-y-1">
          {slip.items.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between text-xs font-semibold gap-2"
            >
              <span className="flex-1">{item.book_name}</span>
              <span className="shrink-0">x {item.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}