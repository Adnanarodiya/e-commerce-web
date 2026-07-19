"use client";

import PackedOrdersPanel, { type PackedOrder } from "@/components/orders/PackedOrdersPanel";
import ShippingSlipModal, { type ShippingSlipData } from "@/components/packer/ShippingSlipModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/LanguageContext";
import { setStaffSession } from "@/lib/staff-session";
import {
  formatBookWeight,
  formatDeliveryType,
  formatOrderItemsSummary,
  orderItemsTotalWeight,
} from "@/lib/format-order";
import { db, supabase } from "@/lib/supabase";
import { Check, LogOut, PackageCheck, Printer, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { touchChoice } from "@/lib/touch-target";
import { Input } from "@/components/ui/input";
import { formatRupee } from "@/lib/profit";

interface Order extends PackedOrder {
  customer_address: string;
  payment_confirmed: boolean;
  total: number;
}

function toSlipData(order: Order): ShippingSlipData {
  return {
    id: order.id,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_address: order.customer_address,
    delivery_type: order.delivery_type,
    items: order.items,
    created_at: order.created_at,
  };
}

function OrderItemsWithWeight({
  items,
  weightByBookId,
}: {
  items: Order["items"];
  weightByBookId: Map<number, number>;
}) {
  const totalWeight = orderItemsTotalWeight(items, weightByBookId);

  return (
    <div className="bg-muted/40 p-2 border space-y-1 text-xs">
      {items.map((item, idx) => {
        const unitWeight =
          item.book_id != null ? weightByBookId.get(item.book_id) ?? 0 : 0;
        const lineWeight = unitWeight * item.quantity;
        return (
          <div key={idx} className="flex justify-between gap-2">
            <span className="min-w-0">{item.book_name}</span>
            <span className="shrink-0 text-right font-bold">
              {item.quantity} {item.quantity === 1 ? "book" : "books"}
              {unitWeight > 0 && (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  × {formatBookWeight(unitWeight)} ={" "}
                  <span className="font-bold text-foreground">
                    {formatBookWeight(lineWeight)}
                  </span>
                </span>
              )}
            </span>
          </div>
        );
      })}
      {totalWeight > 0 && (
        <p className="pt-1 font-bold text-primary border-t border-border mt-1">
          Total weight: {formatBookWeight(totalWeight)}
        </p>
      )}
    </div>
  );
}

function OrderSummary({
  order,
  weightByBookId,
}: {
  order: Order;
  weightByBookId: Map<number, number>;
}) {
  const totalWeight = orderItemsTotalWeight(order.items, weightByBookId);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2 text-sm">
      <div className="flex justify-between gap-3">
        <span className="text-xs font-semibold uppercase text-slate-500">Order ID</span>
        <span className="font-bold font-mono">{order.id}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-xs font-semibold uppercase text-slate-500">Customer</span>
        <span className="font-bold text-right">{order.customer_name}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-xs font-semibold uppercase text-slate-500">Items</span>
        <span className="font-bold text-right">{formatOrderItemsSummary(order.items)}</span>
      </div>
      {totalWeight > 0 && (
        <div className="flex justify-between gap-3">
          <span className="text-xs font-semibold uppercase text-slate-500">Total weight</span>
          <span className="font-bold text-right text-primary">
            {formatBookWeight(totalWeight)}
          </span>
        </div>
      )}
      <div className="flex justify-between gap-3">
        <span className="text-xs font-semibold uppercase text-slate-500">Delivery</span>
        <span className="font-bold text-right">{formatDeliveryType(order.delivery_type)}</span>
      </div>
    </div>
  );
}

export default function PackerDashboard() {
  const { t, isRtl, setUserRole } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [weightByBookId, setWeightByBookId] = useState<Map<number, number>>(
    () => new Map()
  );
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"queue" | "packed">("queue");
  const [printSlip, setPrintSlip] = useState<ShippingSlipData | null>(null);
  const [boxPackTarget, setBoxPackTarget] = useState<Order | null>(null);
  const [pickupTarget, setPickupTarget] = useState<Order | null>(null);
  const [packingId, setPackingId] = useState<string | null>(null);
  const [confirmingPickupId, setConfirmingPickupId] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: "", visible: false });
  const [orderSearch, setOrderSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [allOrders, allBooks] = await Promise.all([
        db.getOrders(),
        db.getBooks(),
      ]);
      setOrders(allOrders as Order[]);
      setWeightByBookId(
        new Map(allBooks.map((b) => [b.id, Number(b.weight ?? 0)]))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("packer-orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => loadData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => loadData())
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const handlePrintSlip = (order: Order) => {
    setPrintSlip(toSlipData(order));
  };

  const confirmBoxPack = async () => {
    if (!boxPackTarget) return;

    const order = boxPackTarget;
    setPackingId(order.id);
    try {
      const success = await db.updateOrderStatus(order.id, "packed", true);
      if (success) {
        const now = new Date().toISOString();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, status: "packed", payment_confirmed: true, packed_at: now }
              : o
          )
        );
        setToast({
          message: isRtl ? `آرڈر ${order.id} پیک ہو گیا` : `Order ${order.id} marked as packed`,
          visible: true,
        });
        setBoxPackTarget(null);
        setActiveView("packed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPackingId(null);
    }
  };

  const confirmPickup = async () => {
    if (!pickupTarget) return;

    const orderId = pickupTarget.id;
    setConfirmingPickupId(orderId);
    try {
      const success = await db.confirmPickup(orderId);
      if (success) {
        const now = new Date().toISOString();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, pickup_confirmed: true, pickup_confirmed_at: now }
              : o
          )
        );
        setToast({
          message: isRtl ? "پک اپ کی تصدیق ہو گئی" : "Pickup confirmed",
          visible: true,
        });
        setPickupTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmingPickupId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/packer/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setStaffSession("packer", false);
    setUserRole("customer");
    window.location.href = "/packer/login";
  };

  const queueOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter(
      (o) =>
        o.status === "ready_to_pack" &&
        (!q || o.id.toLowerCase().includes(q))
    );
  }, [orders, orderSearch]);

  const packedOrdersForPanel = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) => o.status !== "packed" || o.id.toLowerCase().includes(q)
    );
  }, [orders, orderSearch]);

  const toPackCount = orders.filter((o) => o.status === "ready_to_pack").length;
  const packedCount = orders.filter((o) => o.status === "packed").length;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 sm:py-32 space-y-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium text-sm">Loading packer queue...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-5xl">
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 pb-4 border-b border-border gap-3 ${
          isRtl ? "sm:flex-row-reverse" : ""
        }`}
      >
        <div className={isRtl ? "text-right" : "text-left"}>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {t("packerPanel")}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Print slip → Box pack → Confirm pickup when customer collects.
          </p>
        </div>
        <div className={`flex flex-wrap items-center gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-destructive hover:text-destructive text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            {isRtl ? "لاگ آؤٹ" : "Logout"}
          </Button>
        </div>
      </div>

      <div className="flex border border-border bg-white mb-4">
        <button
          type="button"
          onClick={() => setActiveView("queue")}
          className={`flex-1 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${touchChoice} ${
            activeView === "queue"
              ? "border-red-500 text-foreground bg-red-50/50"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {t("toPack")}{" "}
          <span className="font-bold text-red-600 tabular-nums">({toPackCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView("packed")}
          className={`flex-1 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${touchChoice} ${
            activeView === "packed"
              ? "border-orange-500 text-foreground bg-orange-50/50"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {t("packedHistory")}{" "}
          <span className="font-bold text-orange-600 tabular-nums">({packedCount})</span>
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={orderSearch}
          onChange={(e) => setOrderSearch(e.target.value)}
          placeholder={isRtl ? "آرڈر آئی ڈی سے تلاش کریں…" : "Search by order ID…"}
          className="pl-9 h-11 rounded-xl"
        />
      </div>

      {activeView === "queue" ? (
        <div className="space-y-4">
          {queueOrders.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center border-dashed border-2">
              <div className="text-5xl sm:text-6xl mb-4">📦</div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
                {orderSearch.trim()
                  ? isRtl
                    ? "کوئی آرڈر نہیں ملا"
                    : "No matching orders to pack"
                  : isRtl
                    ? "کوئی پینڈنگ پیکنگ نہیں ہے"
                    : "No orders ready to pack"}
              </h3>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {queueOrders.map((order) => (
                <Card key={order.id} className="border-2 border-red-200">
                  <CardHeader className="bg-red-50/60 pb-3 px-4 pt-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-sm font-bold">{order.customer_name}</CardTitle>
                        <CardDescription className="text-xs font-mono">{order.id}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {formatDeliveryType(order.delivery_type)}
                        </Badge>
                        <p className="text-lg font-bold text-red-600 tabular-nums">
                          {formatRupee(order.total ?? 0, 2)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="text-muted-foreground">Phone: </span>
                        {order.customer_phone}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Address: </span>
                        {order.customer_address}
                      </p>
                    </div>
                    <Separator />
                    <OrderItemsWithWeight
                      items={order.items}
                      weightByBookId={weightByBookId}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => handlePrintSlip(order)}>
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        {t("printSlip")}
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setBoxPackTarget(order)}
                        disabled={packingId === order.id}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        {t("boxPack")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <PackedOrdersPanel
          orders={packedOrdersForPanel}
          weightByBookId={weightByBookId}
          onConfirmPickup={(orderId) => {
            const order = orders.find((o) => o.id === orderId);
            if (order) setPickupTarget(order);
          }}
          onPrintSlip={(o) => handlePrintSlip(o as Order)}
          confirmingId={confirmingPickupId}
        />
      )}

      <ConfirmModal
        open={!!boxPackTarget}
        title={t("boxPack")}
        description={t("confirmBoxPack")}
        confirmLabel={t("boxPack")}
        cancelLabel={t("cancel")}
        onConfirm={confirmBoxPack}
        onCancel={() => setBoxPackTarget(null)}
        loading={!!packingId}
        headerTone="green"
        icon={<Check className="h-5 w-5 text-white" />}
      >
        {boxPackTarget ? (
          <OrderSummary order={boxPackTarget} weightByBookId={weightByBookId} />
        ) : null}
      </ConfirmModal>

      <ConfirmModal
        open={!!pickupTarget}
        title={t("confirmPickup")}
        description={t("confirmPickupPrompt")}
        confirmLabel={t("confirmPickup")}
        cancelLabel={t("cancel")}
        onConfirm={confirmPickup}
        onCancel={() => setPickupTarget(null)}
        loading={!!confirmingPickupId}
        headerTone="slate"
        icon={<PackageCheck className="h-5 w-5 text-white" />}
      >
        {pickupTarget ? (
          <OrderSummary order={pickupTarget} weightByBookId={weightByBookId} />
        ) : null}
      </ConfirmModal>

      {printSlip && (
        <ShippingSlipModal
          slip={printSlip}
          weightByBookId={weightByBookId}
          labels={{
            slipTitle: t("slipTitle"),
            slipDesc: t("slipDesc"),
            orderId: t("orderId"),
            name: t("name"),
            phone: t("phone"),
            shippingAddress: t("shippingAddress"),
            deliveryMethod: t("deliveryLabel"),
          }}
          onClose={() => setPrintSlip(null)}
        />
      )}

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        variant="success"
      />
    </div>
  );
}
