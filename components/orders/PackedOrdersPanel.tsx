"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { formatRupee } from "@/lib/profit";
import { Check, PackageCheck, Printer, Download } from "lucide-react";

export interface PackedOrderItem {
  book_name: string;
  quantity: number;
}

export interface PackedOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: string;
  total?: number;
  status: string;
  created_at: string;
  packed_at?: string | null;
  pickup_confirmed?: boolean;
  pickup_confirmed_at?: string | null;
  items: PackedOrderItem[];
}

interface PackedOrdersPanelProps {
  orders: PackedOrder[];
  onConfirmPickup: (orderId: string) => void;
  onPrintSlip?: (order: PackedOrder) => void;
  onDownloadBill?: (order: PackedOrder) => void;
  confirmingId?: string | null;
  emptyMessage?: string;
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function PackedOrdersPanel({
  orders,
  onConfirmPickup,
  onPrintSlip,
  onDownloadBill,
  confirmingId,
  emptyMessage,
}: PackedOrdersPanelProps) {
  const { t, isRtl } = useLanguage();
  const packed = orders
    .filter((o) => o.status === "packed")
    .sort((a, b) => {
      const aTime = a.packed_at || a.created_at;
      const bTime = b.packed_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  if (packed.length === 0) {
    return (
      <Card className="border border-dashed">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          {emptyMessage || t("noPackedOrders")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {packed.map((order) => (
        <Card key={order.id} className="border border-orange-200">
          <CardHeader className="py-3 px-4 sm:px-5 bg-orange-50/40">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-sm font-bold">{order.customer_name}</CardTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-mono">
                  {order.id} · {order.customer_phone}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 justify-end">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {order.delivery_type}
                </Badge>
                {order.pickup_confirmed ? (
                  <Badge className="bg-green-700 text-white text-[10px]">
                    {t("pickupConfirmed")}
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500 text-white text-[10px]">
                    {t("pickupPending")}
                  </Badge>
                )}
                {typeof order.total === "number" && (
                  <p className="text-base sm:text-lg font-bold text-orange-600 tabular-nums w-full sm:w-auto text-right">
                    {formatRupee(order.total, 2)}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-5 pb-4 pt-3 space-y-3 text-xs">
            <div className="bg-muted/40 border border-border p-2.5 space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-2">
                  <span className="font-medium">{item.book_name}</span>
                  <span className="shrink-0 font-bold">x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <div>
                <span className="font-bold text-foreground block">{t("packedAt")}</span>
                {formatDateTime(order.packed_at)}
              </div>
              <div>
                <span className="font-bold text-foreground block">{t("pickupConfirmedAt")}</span>
                {order.pickup_confirmed
                  ? formatDateTime(order.pickup_confirmed_at)
                  : t("pickupPending")}
              </div>
            </div>

            <div className={`flex flex-wrap gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              {onPrintSlip && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onPrintSlip(order)}
                >
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  {t("printSlip")}
                </Button>
              )}
              {onDownloadBill && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onDownloadBill(order)}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download Bill
                </Button>
              )}
              {!order.pickup_confirmed && (
                <Button
                  size="sm"
                  className="text-xs bg-slate-800 hover:bg-slate-900 text-white"
                  onClick={() => onConfirmPickup(order.id)}
                  disabled={confirmingId === order.id}
                >
                  <PackageCheck className="h-3.5 w-3.5 mr-1" />
                  {t("confirmPickup")}
                </Button>
              )}
              {order.pickup_confirmed && (
                <span className="flex items-center gap-1 text-green-700 font-semibold text-xs">
                  <Check className="h-3.5 w-3.5" />
                  {t("pickupDone")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
