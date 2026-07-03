"use client";

import PackedOrdersPanel, { type PackedOrder } from "@/components/orders/PackedOrdersPanel";
import ShippingSlipModal, { type ShippingSlipData } from "@/components/packer/ShippingSlipModal";
import Toast from "@/components/ui/Toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/LanguageContext";
import { setStaffSession } from "@/lib/staff-session";
import { db, supabase } from "@/lib/supabase";
import { Check, LogOut, Printer } from "lucide-react";
import { useEffect, useState } from "react";

interface Order extends PackedOrder {
  customer_address: string;
  payment_confirmed: boolean;
}

function toSlipData(order: Order): ShippingSlipData {
  return {
    id: order.id,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_address: order.customer_address,
    delivery_type: order.delivery_type,
    items: order.items,
  };
}

export default function PackerDashboard() {
  const { t, isRtl, setUserRole } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"queue" | "packed">("queue");
  const [printSlip, setPrintSlip] = useState<ShippingSlipData | null>(null);
  const [packingId, setPackingId] = useState<string | null>(null);
  const [confirmingPickupId, setConfirmingPickupId] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: "", visible: false });

  const loadData = async () => {
    setLoading(true);
    try {
      const allOrders = await db.getOrders();
      setOrders(allOrders as Order[]);
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

  const handleBoxPack = async (order: Order) => {
    if (!window.confirm(t("confirmBoxPack"))) return;

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
        setActiveView("packed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPackingId(null);
    }
  };

  const handleConfirmPickup = async (orderId: string) => {
    if (!window.confirm(t("confirmPickupPrompt"))) return;

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

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 sm:py-32 space-y-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium text-sm">Loading packer queue...</p>
      </div>
    );
  }

  const queueOrders = orders.filter((o) => o.status === "ready_to_pack");
  const packedCount = orders.filter((o) => o.status === "packed").length;

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
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs h-8">
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-destructive hover:text-destructive h-8 text-xs"
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
          className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeView === "queue"
              ? "border-primary text-foreground bg-slate-50"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {t("toPack")} ({queueOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveView("packed")}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeView === "packed"
              ? "border-primary text-foreground bg-slate-50"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {t("packedHistory")} ({packedCount})
        </button>
      </div>

      {activeView === "queue" ? (
        <div className="space-y-4">
          {queueOrders.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center border-dashed border-2">
              <div className="text-5xl sm:text-6xl mb-4">📦</div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
                {isRtl ? "کوئی پینڈنگ پیکنگ نہیں ہے" : "No orders ready to pack"}
              </h3>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {queueOrders.map((order) => (
                <Card key={order.id} className="border-2 border-primary/20">
                  <CardHeader className="bg-primary/5 pb-3 px-4 pt-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-sm font-bold">{order.customer_name}</CardTitle>
                        <CardDescription className="text-xs">{order.id}</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {order.delivery_type}
                      </Badge>
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
                    <div className="bg-muted/40 p-2 border space-y-1 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.book_name}</span>
                          <span className="font-bold">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => handlePrintSlip(order)}>
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        {t("printSlip")}
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleBoxPack(order)}
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
          orders={orders}
          onConfirmPickup={handleConfirmPickup}
          onPrintSlip={(o) => handlePrintSlip(o as Order)}
          confirmingId={confirmingPickupId}
        />
      )}

      {printSlip && (
        <ShippingSlipModal
          slip={printSlip}
          labels={{
            slipTitle: t("slipTitle"),
            slipDesc: t("slipDesc"),
            orderId: t("orderId"),
            name: t("name"),
            phone: t("phone"),
            shippingAddress: t("shippingAddress"),
            deliveryMethod: t("deliveryMethod"),
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