"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer } from "lucide-react";
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

export default function ShippingSlipModal({ slip, labels, onClose }: ShippingSlipModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handlePrint = () => {
    requestAnimationFrame(() => window.print());
  };

  if (!mounted) return null;

  return createPortal(
    <div id="shipping-slip-print-host">
      {/* Screen-only backdrop */}
      <div
        className="slip-screen-backdrop fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="shipping-slip-print bg-white text-black p-6 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <SlipContent slip={slip} labels={labels} />

          <div className="slip-screen-actions pt-4 border-t border-dashed border-gray-300 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1 bg-primary text-white" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Slip
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SlipContent({
  slip,
  labels,
}: {
  slip: ShippingSlipData;
  labels: ShippingSlipModalProps["labels"];
}) {
  return (
    <>
      <div className="text-center pb-4 border-b border-dashed border-gray-300">
        <h2 className="text-xl font-bold tracking-tight">{labels.slipTitle}</h2>
        <p className="text-xs text-gray-500 mt-1">{labels.slipDesc}</p>
      </div>

      <div className="py-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 font-medium shrink-0">{labels.orderId}:</span>
          <span className="font-bold text-right">{slip.id}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 font-medium shrink-0">{labels.name}:</span>
          <span className="font-bold text-right">{slip.customer_name}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 font-medium shrink-0">{labels.phone}:</span>
          <span className="font-bold text-right">{slip.customer_phone}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 font-medium shrink-0">{labels.shippingAddress}:</span>
          <span className="font-bold text-right">{slip.customer_address}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 font-medium shrink-0">{labels.deliveryMethod}:</span>
          <span className="font-bold capitalize text-right">{slip.delivery_type}</span>
        </div>

        <Separator className="border-dashed my-2" />

        <div>
          <span className="text-xs text-gray-400 font-bold block mb-1">PACK CONTENT</span>
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 space-y-1">
            {slip.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs font-semibold gap-2">
                <span className="flex-1">{item.book_name}</span>
                <span className="shrink-0">x {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}