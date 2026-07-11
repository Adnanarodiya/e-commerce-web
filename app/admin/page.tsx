"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import PackedOrdersPanel from "@/components/orders/PackedOrdersPanel";
import BookImage from "@/components/ui/BookImage";
import Toast from "@/components/ui/Toast";
import { setStaffSession } from "@/lib/staff-session";
import { db, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp, BarChart3, BookOpen,
  Settings, PhoneCall, Check, Truck, Trash2, Plus, Edit2, RotateCw, LogOut, Upload, ReceiptText, Download, Banknote, Wallet, X, Package, PackageCheck, HandCoins, MessageCircle
} from "lucide-react";
import Image from "next/image";
import { downloadInvoicePdf, downloadOrderConfirmationPdf } from "@/lib/pdf-download";
import { buildOrderConfirmationData } from "@/lib/order-confirmation";
import { openWhatsAppChat, formatOrderWhatsAppMessage } from "@/lib/whatsapp";
import { formatDeliveryType, formatOrderItemsSummary } from "@/lib/format-order";
import {
  stockValuation,
  sumGrossProfit,
  unitMargin,
  formatRupee,
  orderProductRevenue,
  orderPackagingCharge,
  orderCourierCharge,
  isConfirmedForRevenue,
} from "@/lib/profit";
import MobileSheet from "@/components/ui/MobileSheet";
import ConfirmModal from "@/components/ui/ConfirmModal";
import StockAlertCards from "@/components/admin/StockAlertCards";
import StockManagementPanel from "@/components/admin/StockManagementPanel";
import { touchChoice } from "@/lib/touch-target";

const LOW_STOCK_THRESHOLD = 5;

const adminFieldInput =
  "h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-base text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 sm:h-10 sm:text-sm";
const adminFieldLabel = "text-sm font-semibold text-slate-700";

interface Book {
  id: number;
  name_en: string;
  name_ur: string;
  price: number;
  cost_price: number;
  description_en: string;
  description_ur: string;
  image: string;
  stock: number;
  weight: number;
  is_quran?: boolean;
}

interface OrderItem {
  id: number;
  order_id: string;
  book_id: number;
  book_name: string;
  quantity: number;
  price: number;
  is_quran?: boolean;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  delivery_type: string;
  payment_type: string;
  subtotal: number;
  discount: number;
  packaging_charge: number;
  courier_charge?: number;
  total: number;
  status: string;
  payment_confirmed: boolean;
  packed_at?: string | null;
  pickup_confirmed?: boolean;
  pickup_confirmed_at?: string | null;
  admin_notes?: string | null;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  items: OrderItem[];
}

export default function AdminDashboard() {
  const { t, setUserRole } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [upiSettings, setUpiSettings] = useState({
    upi_id: "9426880068@kotak",
    payee_name: "ADNAN IBADULLAH ARODIYA",
    qr_code_url: "/images/qr-code.png"
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"day" | "month" | "year">("month");
  const [reorderAmount, setReorderAmount] = useState<Record<number, number>>({});
  const [activeTab, setActiveTab] = useState("orders");
  const [statementRange, setStatementRange] = useState<"today" | "week" | "month" | "year" | "all">("today");
  const [statementMode, setStatementMode] = useState<"bank" | "cash">("bank");

  // Quotation modal (packaging + courier charges)
  const [callModal, setCallModal] = useState<Order | null>(null);
  const [chargePackaging, setChargePackaging] = useState("0");
  const [chargeCourier, setChargeCourier] = useState("0");
  const [chargeNotes, setChargeNotes] = useState("");
  const [submittingQuotation, setSubmittingQuotation] = useState(false);

  // Confirm order → send to packer
  const [confirmPackModal, setConfirmPackModal] = useState<Order | null>(null);
  const [confirmingToPacker, setConfirmingToPacker] = useState(false);

  // Cancel order modal
  const [cancelModal, setCancelModal] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(false);

  // WhatsApp send prompt after quotation
  const [whatsappQuotationOrder, setWhatsappQuotationOrder] = useState<Order | null>(null);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);

  // QR Code edit state
  const [tempUpiSettings, setTempUpiSettings] = useState({ ...upiSettings });

  // Toast & upload states
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [uploadingQr, setUploadingQr] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [confirmingPickupId, setConfirmingPickupId] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [runningMigration, setRunningMigration] = useState(false);

  // CRUD book states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookFormData, setBookFormData] = useState({
    name_en: "",
    name_ur: "",
    cost_price: "",
    price: "",
    stock: "",
    weight: "80",
    description_en: "",
    description_ur: "",
    image: "",
    is_quran: false
  });

  // Fetch all data
  const loadData = async () => {
    setLoading(true);
    try {
      const allBooks = await db.getBooks();
      setBooks(allBooks.map(b => ({ ...b, price: Number(b.price), cost_price: Number(b.cost_price ?? 0) })));

      const allOrders = await db.getOrders();
      setOrders(allOrders.map(o => ({
        ...o,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        packaging_charge: Number(o.packaging_charge ?? 0),
        courier_charge: Number(o.courier_charge ?? 0),
        total: Number(o.total)
      })));

      const allSettings = await db.getSettings();
      const loadedSettings = { ...upiSettings };
      allSettings.forEach(s => {
        if (s.key === "upi_id") loadedSettings.upi_id = s.value;
        if (s.key === "payee_name") loadedSettings.payee_name = s.value;
        if (s.key === "qr_code_url") loadedSettings.qr_code_url = s.value;
      });
      setUpiSettings(loadedSettings);
      setTempUpiSettings(loadedSettings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const uploadImage = async (file: File, bucket: "book-covers" | "qr-codes") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  };

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const orderId = (payload.new as { id?: string })?.id ?? "unknown";
          setToast({ message: `New order received: ${orderId}`, visible: true });
          loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // Calculations
  const stockStats = stockValuation(books);
  const totalStockQuantity = stockStats.quantity;
  const totalStockCost = stockStats.atCostPrice;
  const outOfStockBooks = books.filter(b => b.stock === 0);
  const lowStockBooks = books.filter(b => b.stock > 0 && b.stock < LOW_STOCK_THRESHOLD);
  const criticalStockCount = outOfStockBooks.length + lowStockBooks.length;

  // Earnings calculations filter
  const getFilteredOrders = () => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (timeFilter === "day") {
        return orderDate.toDateString() === now.toDateString();
      } else if (timeFilter === "month") {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      } else {
        return orderDate.getFullYear() === now.getFullYear();
      }
    });
  };

  const filteredOrders = getFilteredOrders();
  const confirmedInPeriod = filteredOrders.filter((o) => isConfirmedForRevenue(o.status));

  const bankEarnings = confirmedInPeriod
    .filter((o) => o.payment_type === "bank")
    .reduce((sum, o) => sum + orderProductRevenue(o), 0);

  const cashEarnings = confirmedInPeriod
    .filter((o) => o.payment_type === "cash")
    .reduce((sum, o) => sum + orderProductRevenue(o), 0);

  const totalEarnings = bankEarnings + cashEarnings;
  const periodGrossProfit = sumGrossProfit(filteredOrders, books);
  const profitMarginPct =
    totalEarnings > 0 ? Math.round((periodGrossProfit / totalEarnings) * 100) : 0;

  // Actions
  const getQuranMap = () => {
    const isQuranById = new Map<number, boolean>();
    books.forEach((b) => isQuranById.set(b.id, b.is_quran ?? false));
    return isQuranById;
  };

  const buildConfirmation = (order: Order) =>
    buildOrderConfirmationData(order, getQuranMap(), upiSettings);

  const handleQuotationClick = (order: Order) => {
    setChargePackaging(String(order.packaging_charge ?? 0));
    setChargeCourier(String(order.courier_charge ?? 0));
    setChargeNotes(order.admin_notes ?? "");
    setCallModal(order);
  };

  const callModalProductsTotal = callModal
    ? Math.max(0, callModal.subtotal - callModal.discount)
    : 0;
  const callModalFinalTotal =
    callModalProductsTotal +
    Math.max(0, parseFloat(chargePackaging) || 0) +
    Math.max(0, parseFloat(chargeCourier) || 0);

  const shareOrderOnWhatsApp = (order: Order) => {
    const data = buildConfirmation(order);
    const message = formatOrderWhatsAppMessage(data);
    openWhatsAppChat(order.customer_phone, message);
    setToast({
      message: `WhatsApp opened for ${order.customer_phone}`,
      visible: true,
    });
  };

  const submitQuotation = async () => {
    if (!callModal) return;
    const packaging = Math.max(0, parseFloat(chargePackaging) || 0);
    const courier = Math.max(0, parseFloat(chargeCourier) || 0);
    const productsTotal = Math.max(0, callModal.subtotal - callModal.discount);
    const finalTotal = productsTotal + packaging + courier;

    setSubmittingQuotation(true);
    try {
      const success = await db.saveOrderQuotation(callModal.id, {
        packaging_charge: packaging,
        courier_charge: courier,
        total: finalTotal,
        admin_notes: chargeNotes.trim() || undefined,
      });
      if (success) {
        const updated: Order = {
          ...callModal,
          packaging_charge: packaging,
          courier_charge: courier,
          total: finalTotal,
          admin_notes: chargeNotes.trim() || null,
        };
        setOrders((prev) =>
          prev.map((o) => (o.id === callModal.id ? updated : o))
        );
        setToast({
          message: `${t("quotationSaved")} — ${callModal.id}`,
          visible: true,
        });
        setCallModal(null);
        setWhatsappQuotationOrder(updated);
      } else {
        setToast({ message: "Failed to save quotation", visible: true });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to save quotation", visible: true });
    } finally {
      setSubmittingQuotation(false);
    }
  };

  const handleWhatsAppQuotationConfirm = () => {
    if (!whatsappQuotationOrder) return;
    const order = whatsappQuotationOrder;
    const data = buildConfirmation(order);
    const message = formatOrderWhatsAppMessage(data);

    setSharingWhatsApp(true);
    setWhatsappQuotationOrder(null);
    openWhatsAppChat(order.customer_phone, message);
    setToast({
      message: `WhatsApp opened for ${order.customer_phone}`,
      visible: true,
    });
    setSharingWhatsApp(false);
  };

  const handleConfirmOrderToPacker = async () => {
    if (!confirmPackModal) return;
    setConfirmingToPacker(true);
    try {
      const success = await db.sendOrderToPacker(confirmPackModal.id);
      if (success) {
        const updated: Order = {
          ...confirmPackModal,
          status: "ready_to_pack",
          confirmed_at: new Date().toISOString(),
        };
        setOrders((prev) =>
          prev.map((o) => (o.id === confirmPackModal.id ? updated : o))
        );
        setToast({
          message: `${t("orderSentToPacker")} — ${confirmPackModal.id}`,
          visible: true,
        });
        setConfirmPackModal(null);
      } else {
        setToast({ message: "Failed to confirm order", visible: true });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to confirm order", visible: true });
    } finally {
      setConfirmingToPacker(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModal) return;
    setCancellingOrder(true);
    try {
      const success = await db.cancelOrder(cancelModal.id, cancelReason.trim() || undefined);
      if (success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === cancelModal.id
              ? {
                  ...o,
                  status: "cancelled",
                  cancelled_at: new Date().toISOString(),
                  cancel_reason: cancelReason.trim() || null,
                }
              : o
          )
        );
        setToast({ message: `Order ${cancelModal.id} cancelled`, visible: true });
        await loadData();
        setCancelModal(null);
        setCancelReason("");
      } else {
        setToast({ message: "Failed to cancel order", visible: true });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to cancel order", visible: true });
    } finally {
      setCancellingOrder(false);
    }
  };

  const handleUpdateStock = async (id: number) => {
    const qty = reorderAmount[id];
    if (!qty || qty <= 0) return;
    try {
      const book = books.find(b => b.id === id);
      if (book) {
        const newStock = book.stock + qty;
        await db.updateBook(id, { stock: newStock });
        setBooks(prev => prev.map(b => b.id === id ? { ...b, stock: newStock } : b));
        setReorderAmount(prev => ({ ...prev, [id]: 0 }));
        setToast({ message: `Added ${qty} to "${book.name_en}" — now ${newStock} in stock`, visible: true });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to update stock", visible: true });
    }
  };

  const handleRunMigration = async () => {
    setRunningMigration(true);
    setMigrationStatus(null);
    try {
      const res = await fetch("/api/admin/migrate-call-charges", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMigrationStatus(data.message ?? "Migration applied");
        setToast({ message: data.message ?? "Database migration applied", visible: true });
      } else {
        setMigrationStatus(data.error ?? "Migration failed");
      }
    } catch (err) {
      setMigrationStatus(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setRunningMigration(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await db.updateSetting("upi_id", tempUpiSettings.upi_id);
      await db.updateSetting("payee_name", tempUpiSettings.payee_name);
      await db.updateSetting("qr_code_url", tempUpiSettings.qr_code_url);
      setUpiSettings(tempUpiSettings);
      alert("Settings updated successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      const success = await db.deleteBook(id);
      if (success) {
        setBooks(prev => prev.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookFormData({
      name_en: "",
      name_ur: "",
      cost_price: "",
      price: "",
      stock: "",
      weight: "80",
      description_en: "",
      description_ur: "",
      image: "",
      is_quran: false
    });
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (book: Book) => {
    setEditingBook(book);
    setBookFormData({
      name_en: book.name_en,
      name_ur: book.name_ur,
      cost_price: String(book.cost_price ?? 0),
      price: String(book.price),
      stock: String(book.stock),
      weight: String(book.weight ?? 80),
      description_en: book.description_en || "",
      description_ur: book.description_ur || "",
      image: book.image,
      is_quran: book.is_quran ?? false
    });
    setIsBookModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name_en: bookFormData.name_en,
      name_ur: bookFormData.name_ur,
      cost_price: Number(bookFormData.cost_price) || 0,
      price: Number(bookFormData.price),
      stock: Number(bookFormData.stock),
      weight: Number(bookFormData.weight) || 80,
      description_en: bookFormData.description_en,
      description_ur: bookFormData.description_ur,
      image: bookFormData.image,
      is_quran: bookFormData.is_quran
    };

    try {
      if (editingBook) {
        const updated = await db.updateBook(editingBook.id, data);
        if (updated) {
          setBooks(prev => prev.map(b => b.id === editingBook.id ? { ...b, ...data } : b));
        }
      } else {
        const inserted = await db.insertBook(data);
        setBooks(prev => [...prev, inserted]);
      }
      setIsBookModalOpen(false);
    } catch (err) {
      console.error(err);
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
        setToast({ message: "Pickup confirmed", visible: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmingPickupId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setStaffSession("admin", false);
    setUserRole("customer");
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
  };

  const handleDownloadBill = async (order: Order) => {
    try {
      const data = buildConfirmation(order);
      if (order.status === "ready_to_pack" || order.status === "packed") {
        await downloadOrderConfirmationPdf(data);
        return;
      }
      await downloadInvoicePdf(data);
    } catch (err) {
      console.error("Invoice generation failed:", err);
      alert("Could not generate invoice. See console for details.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  // Admin View
  const pendingOrders = orders.filter(o => o.status === "pending");

  const tabs: {
    id: string;
    label: string;
    icon: typeof BarChart3;
    badge?: number;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "orders", label: "Orders", icon: Truck, badge: pendingOrders.length || undefined },
    { id: "statement", label: "Statement", icon: ReceiptText },
    { id: "books", label: "Inventory", icon: BookOpen },
    { id: "stock", label: "Stock", icon: Package, badge: criticalStockCount || undefined },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 -mx-0">
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">{t("adminPanel")}</h1>
            <p className="text-slate-400 text-xs mt-0.5">Noorani Makatib — stock, orders & payments</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadData} className="text-xs bg-transparent border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white">
              <RotateCw className="h-3.5 w-3.5" />
              Reload
            </Button>
            <Button size="sm" onClick={handleOpenAddBook} className="text-xs bg-primary text-primary-foreground">
              <Plus className="h-3.5 w-3.5" />
              {t("addBook")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs bg-transparent border-slate-600 text-red-300 hover:bg-slate-800 hover:text-red-200">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <nav className="flex md:flex-col gap-0 md:w-48 shrink-0 border border-border bg-white rounded-xl shadow-sm overflow-x-auto md:overflow-visible md:sticky md:top-4 md:self-start md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
            {tabs.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2.5 px-4 text-left text-xs sm:text-sm font-semibold border-b md:border-b-0 md:border-l-[3px] border-border last:border-b-0 transition-colors whitespace-nowrap ${touchChoice} ${
                  activeTab === id
                    ? "bg-primary/10 text-primary md:border-l-primary border-l-transparent"
                    : "text-muted-foreground hover:bg-slate-50 hover:text-foreground md:border-l-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {badge ? (
                  <Badge className={`ml-auto border-0 text-[10px] px-1.5 ${
                    id === "stock" ? "bg-red-600 text-white" : "bg-primary text-primary-foreground"
                  }`}>{badge}</Badge>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0 space-y-4">

        {/* Tab 1: Dashboard Analytics & Ledger */}
        {activeTab === "dashboard" && (
          <>
            {/* Filters and Stats */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-white p-4 border border-border rounded-xl shadow-sm">
              <span className="text-sm font-semibold text-muted-foreground">{t("filterBy")}</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant={timeFilter === "day" ? "default" : "outline"} onClick={() => setTimeFilter("day")}>Today</Button>
                <Button size="sm" variant={timeFilter === "month" ? "default" : "outline"} onClick={() => setTimeFilter("month")}>Month</Button>
                <Button size="sm" variant={timeFilter === "year" ? "default" : "outline"} onClick={() => setTimeFilter("year")}>Year</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Card className="shadow-sm rounded-xl border border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Gross Profit</p>
                      <h3 className="text-xl sm:text-2xl font-bold mt-1 text-emerald-600 tabular-nums">
                        {formatRupee(periodGrossProfit)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 font-semibold">
                        {profitMarginPct}% margin on book sales ({timeFilter})
                      </p>
                    </div>
                    <HandCoins className="h-9 w-9 shrink-0 text-emerald-600 bg-emerald-50 p-1.5 rounded-lg" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-xl border border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Total Revenue</p>
                      <h3 className="text-xl sm:text-2xl font-bold mt-1 text-purple-600 tabular-nums">
                        {formatRupee(totalEarnings)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 font-semibold">
                        Book sales only · Bank {formatRupee(bankEarnings)} · Cash {formatRupee(cashEarnings)}
                      </p>
                    </div>
                    <BarChart3 className="h-9 w-9 shrink-0 text-purple-500 bg-purple-50 p-1.5 rounded-lg" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-xl border border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Stock at Cost Price</p>
                      <h3 className="text-xl sm:text-2xl font-bold mt-1 text-amber-700 tabular-nums">
                        {formatRupee(totalStockCost)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 font-semibold">
                        {totalStockQuantity.toLocaleString()} books in inventory (buying price)
                      </p>
                    </div>
                    <Package className="h-9 w-9 shrink-0 text-amber-600 bg-amber-50 p-1.5 rounded-lg" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-xl border border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Bank Revenue</p>
                      <h3 className="text-xl sm:text-2xl font-bold mt-1 text-blue-600 tabular-nums">
                        {formatRupee(bankEarnings)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 font-semibold">
                        Book sales via Bank / UPI
                      </p>
                    </div>
                    <TrendingUp className="h-9 w-9 shrink-0 text-blue-500 bg-blue-50 p-1.5 rounded-lg" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-xl border border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Cash Revenue</p>
                      <h3 className="text-xl sm:text-2xl font-bold mt-1 text-green-600 tabular-nums">
                        {formatRupee(cashEarnings)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 font-semibold">
                        Book sales via cash on delivery
                      </p>
                    </div>
                    <TrendingUp className="h-9 w-9 shrink-0 text-green-500 bg-green-50 p-1.5 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stock alerts — prominent on dashboard */}
            <StockAlertCards
              outOfStock={outOfStockBooks}
              lowStock={lowStockBooks}
              reorderAmount={reorderAmount}
              onReorderChange={(id, qty) =>
                setReorderAmount((prev) => ({ ...prev, [id]: qty }))
              }
              onAddStock={handleUpdateStock}
              onViewAll={() => setActiveTab("stock")}
            />

            {/* Ledger Statement */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">{t("ledger")}</CardTitle>
                <CardDescription>
                  Customer payments with breakdown. &quot;Earned&quot; is book sales only — packaging &amp; courier are pass-through.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Bank Statement */}
                  <div>
                    <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                      {t("bankStatement")}
                    </h3>
                    <div className="border rounded-xl divide-y text-xs max-h-[300px] overflow-y-auto">
                      {filteredOrders.filter(o => o.payment_type === "bank" && isConfirmedForRevenue(o.status)).length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground">No bank statements</p>
                      ) : (
                        filteredOrders.filter(o => o.payment_type === "bank" && isConfirmedForRevenue(o.status)).map((order, idx) => {
                          const booksAmt = orderProductRevenue(order);
                          const packAmt = orderPackagingCharge(order);
                          const courierAmt = orderCourierCharge(order);
                          return (
                          <div key={idx} className="p-3 flex justify-between items-start gap-3 hover:bg-muted/30">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-700 block">{order.id}</span>
                              <span className="text-[10px] text-muted-foreground block">{new Date(order.created_at).toLocaleDateString()} | {order.customer_name}</span>
                              <span className="text-[10px] text-blue-600 font-mono block truncate">UPI: {upiSettings.upi_id}</span>
                              <span className="text-[10px] text-muted-foreground block mt-1">
                                Books {formatRupee(booksAmt, 2)} · Pack {formatRupee(packAmt, 2)} · Courier {formatRupee(courierAmt, 2)}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-blue-600 block tabular-nums">₹{order.total.toFixed(2)}</span>
                              <span className="text-[10px] font-semibold text-emerald-700 block">Earned {formatRupee(booksAmt, 2)}</span>
                            </div>
                          </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Cash Statement */}
                  <div>
                    <h3 className="text-xs font-bold text-green-600 uppercase mb-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                      {t("cashStatement")}
                    </h3>
                    <div className="border rounded-xl divide-y text-xs max-h-[300px] overflow-y-auto">
                      {filteredOrders.filter(o => o.payment_type === "cash" && isConfirmedForRevenue(o.status)).length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground">No cash statements</p>
                      ) : (
                        filteredOrders.filter(o => o.payment_type === "cash" && isConfirmedForRevenue(o.status)).map((order, idx) => {
                          const booksAmt = orderProductRevenue(order);
                          const packAmt = orderPackagingCharge(order);
                          const courierAmt = orderCourierCharge(order);
                          return (
                          <div key={idx} className="p-3 flex justify-between items-start gap-3 hover:bg-muted/30">
                            <div>
                              <span className="font-bold text-slate-700 block">{order.id}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} | {order.customer_name}</span>
                              <span className="text-[10px] text-muted-foreground block mt-1">
                                Books {formatRupee(booksAmt, 2)} · Pack {formatRupee(packAmt, 2)} · Courier {formatRupee(courierAmt, 2)}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-green-600 block tabular-nums">₹{order.total.toFixed(2)}</span>
                              <span className="text-[10px] font-semibold text-emerald-700 block">Earned {formatRupee(booksAmt, 2)}</span>
                            </div>
                          </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Stock manager — out of stock & low stock (< 5) */}
        {activeTab === "stock" && (
          <div className="space-y-4">
            <div className="bg-white px-5 py-4 border border-slate-200 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Stock Manager</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Out-of-stock and low-inventory titles (fewer than {LOW_STOCK_THRESHOLD} copies).
              </p>
            </div>
            <StockManagementPanel
              books={books}
              lowStockThreshold={LOW_STOCK_THRESHOLD}
              reorderAmount={reorderAmount}
              onReorderChange={(id, qty) =>
                setReorderAmount((prev) => ({ ...prev, [id]: qty }))
              }
              onAddStock={handleUpdateStock}
              onEditBook={(b) => {
                const full = books.find((x) => x.id === b.id);
                if (full) handleOpenEditBook(full);
              }}
            />
          </div>
        )}

        {/* Tab 2: Orders List & Ready to Pack */}
        {activeTab === "orders" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">New & Pending Orders</CardTitle>
                <CardDescription>Verify payment and details, then assign to the packing team.</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingOrders.length === 0 ? (
                  <div className="p-12 text-center border-dashed border-2">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-lg font-bold text-foreground">No pending orders</h3>
                    <p className="text-muted-foreground text-sm mt-1">All incoming orders have been assigned to packer or completed.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingOrders.map(order => (
                      <div
                        key={order.id}
                        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-base text-slate-900 leading-tight">
                                {order.customer_name}
                              </h3>
                              <a
                                href={`tel:${order.customer_phone.replace(/\s/g, "")}`}
                                className="text-sm text-primary font-medium mt-1 inline-block tabular-nums hover:underline"
                              >
                                {order.customer_phone}
                              </a>
                            </div>
                            <div className="flex flex-wrap gap-1.5 shrink-0 justify-end">
                              <Badge variant="secondary" className="text-[10px] uppercase font-bold font-mono">
                                {order.id}
                              </Badge>
                              <Badge className="bg-blue-500 hover:bg-blue-600 uppercase text-[10px] font-bold">
                                {order.payment_type}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 leading-relaxed">
                            <span className="font-semibold text-slate-800">Address: </span>
                            {order.customer_address}
                          </p>

                          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                              Items
                            </p>
                            <p className="text-sm font-medium text-slate-800 leading-relaxed">
                              {order.items.map((i) => `${i.book_name} (×${i.quantity})`).join(", ")}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-4">
                          <div className="flex items-end justify-between gap-3 mb-4">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground leading-snug">
                                {t("productsTotal")}
                              </p>
                              {(order.packaging_charge > 0 || (order.courier_charge ?? 0) > 0) ? (
                                <p className="text-[11px] text-emerald-700 font-medium mt-1 leading-snug">
                                  Quoted ₹{order.total.toFixed(2)} · pack ₹{order.packaging_charge.toFixed(0)} + courier ₹{(order.courier_charge ?? 0).toFixed(0)}
                                </p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  + packaging & courier on call
                                </p>
                              )}
                            </div>
                            <p className="text-2xl font-bold text-primary tabular-nums shrink-0">
                              ₹{Math.max(0, order.subtotal - order.discount).toFixed(2)}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
                              onClick={() => handleQuotationClick(order)}
                            >
                              <PhoneCall className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                              {t("quotationOrder")}
                            </Button>
                            <Button
                              size="sm"
                              className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                              onClick={() => setConfirmPackModal(order)}
                            >
                              <Check className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                              {t("confirmOrder")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs font-semibold text-red-600 border-red-200 bg-white hover:bg-red-50 hover:text-red-700"
                              onClick={() => {
                                setCancelReason("");
                                setCancelModal(order);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                              {t("cancelOrder")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {orders.filter((o) => o.status === "ready_to_pack").length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md font-bold">With Packer</CardTitle>
                  <CardDescription>Orders waiting to be packed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orders
                    .filter((o) => o.status === "ready_to_pack")
                    .map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border border-orange-200 bg-white shadow-sm overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-sm text-slate-900 leading-tight">
                                {order.customer_name}
                              </h3>
                              <a
                                href={`tel:${order.customer_phone.replace(/\s/g, "")}`}
                                className="text-xs text-primary font-medium mt-1 inline-block tabular-nums hover:underline"
                              >
                                {order.customer_phone}
                              </a>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <Badge className="bg-orange-500 text-white text-[10px]">With Packer</Badge>
                              <span className="text-[10px] font-mono text-muted-foreground">{order.id}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="rounded-lg bg-orange-50/60 border border-orange-100 px-3 py-2">
                              <span className="text-muted-foreground block mb-0.5">Products</span>
                              <span className="font-semibold tabular-nums text-slate-900">
                                ₹{Math.max(0, order.subtotal - order.discount).toFixed(2)}
                              </span>
                            </div>
                            <div className="rounded-lg bg-orange-50/60 border border-orange-100 px-3 py-2">
                              <span className="text-muted-foreground block mb-0.5">Packaging</span>
                              <span className="font-semibold tabular-nums text-slate-900">
                                ₹{order.packaging_charge.toFixed(2)}
                              </span>
                            </div>
                            <div className="rounded-lg bg-orange-50/60 border border-orange-100 px-3 py-2">
                              <span className="text-muted-foreground block mb-0.5">Courier</span>
                              <span className="font-semibold tabular-nums text-slate-900">
                                ₹{(order.courier_charge ?? 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="rounded-lg bg-orange-50/60 border border-orange-100 px-3 py-2">
                              <span className="text-muted-foreground block mb-0.5">Total</span>
                              <span className="font-bold text-primary tabular-nums">
                                ₹{order.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-orange-100 bg-orange-50/30 px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs font-semibold border-slate-200"
                              onClick={() => handleDownloadBill(order)}
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                              {t("downloadConfirmation")}
                            </Button>
                            <Button
                              size="sm"
                              className="w-full text-xs font-semibold bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => shareOrderOnWhatsApp(order)}
                            >
                              <MessageCircle className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                              {t("shareWhatsApp")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {orders.filter((o) => o.status === "cancelled").length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md font-bold text-red-700">{t("orderCancelled")}</CardTitle>
                  <CardDescription>Cancelled orders — stock has been restored</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {orders
                    .filter((o) => o.status === "cancelled")
                    .map((order) => (
                      <div key={order.id} className="flex justify-between items-center border border-red-100 p-3 bg-red-50/40 rounded-lg">
                        <div>
                          <span className="font-bold">{order.customer_name}</span>
                          <span className="text-muted-foreground ml-2">{order.id}</span>
                          {order.cancel_reason && (
                            <p className="text-[11px] text-red-600 mt-1">Reason: {order.cancel_reason}</p>
                          )}
                        </div>
                        <Badge variant="destructive">Cancelled</Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-md font-bold">{t("packedHistory")}</CardTitle>
                <CardDescription>All packed orders — confirm pickup when customer collects</CardDescription>
              </CardHeader>
              <CardContent>
                <PackedOrdersPanel
                  orders={orders}
                  onConfirmPickup={handleConfirmPickup}
                  onDownloadBill={(order) => handleDownloadBill(order as Order)}
                  confirmingId={confirmingPickupId}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Tab 3: Statement (Cash + Bank ledger audit) */}
        {activeTab === "statement" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ReceiptText className="h-5 w-5" />
                Financial Statement
              </CardTitle>
              <CardDescription>
                Full payment audit — customer paid vs what you earned (books only). Packaging &amp; courier shown separately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Range filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase mr-1">Period:</span>
                {([
                  { id: "today", label: "Today" },
                  { id: "week", label: "1 Week" },
                  { id: "month", label: "1 Month" },
                  { id: "year", label: "1 Year" },
                  { id: "all", label: "All Time" },
                ] as const).map(({ id, label }) => (
                  <Button
                    key={id}
                    size="sm"
                    variant={statementRange === id ? "default" : "outline"}
                    onClick={() => setStatementRange(id)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Mode tabs */}
              <div className="flex border border-border bg-white">
                <button
                  type="button"
                  onClick={() => setStatementMode("bank")}
                  className={`flex-1 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${touchChoice} ${
                    statementMode === "bank"
                      ? "border-blue-600 text-blue-700 bg-blue-50"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  Bank / UPI
                </button>
                <button
                  type="button"
                  onClick={() => setStatementMode("cash")}
                  className={`flex-1 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${touchChoice} ${
                    statementMode === "cash"
                      ? "border-green-600 text-green-700 bg-green-50"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  Cash
                </button>
              </div>

              {/* Statement table */}
              {(() => {
                const now = new Date();
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const yearStart = new Date(now.getFullYear(), 0, 1);

                const inRange = (dateStr: string) => {
                  const d = new Date(dateStr);
                  if (statementRange === "all") return true;
                  if (statementRange === "today") return d.toDateString() === now.toDateString();
                  if (statementRange === "week") return d >= weekStart;
                  if (statementRange === "month") return d >= monthStart;
                  if (statementRange === "year") return d >= yearStart;
                  return true;
                };

                const rows = orders
                  .filter(
                    (o) =>
                      o.payment_type === (statementMode === "bank" ? "bank" : "cash") &&
                      isConfirmedForRevenue(o.status) &&
                      inRange(o.created_at)
                  )
                  .sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  );

                const totalPaid = rows.reduce((sum, o) => sum + o.total, 0);
                const totalBooks = rows.reduce((sum, o) => sum + orderProductRevenue(o), 0);
                const totalPackaging = rows.reduce((sum, o) => sum + orderPackagingCharge(o), 0);
                const totalCourier = rows.reduce((sum, o) => sum + orderCourierCharge(o), 0);

                if (rows.length === 0) {
                  return (
                    <div className="p-12 text-center border-dashed border-2 text-sm text-muted-foreground">
                      No {statementMode} transactions in this period.
                    </div>
                  );
                }

                return (
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[640px]">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="text-left font-bold p-3 whitespace-nowrap">Date</th>
                          <th className="text-left font-bold p-3 whitespace-nowrap">Order ID</th>
                          <th className="text-left font-bold p-3 whitespace-nowrap">Customer</th>
                          {statementMode === "bank" && (
                            <th className="text-left font-bold p-3 whitespace-nowrap">UPI ID</th>
                          )}
                          <th className="text-right font-bold p-3 whitespace-nowrap">Books</th>
                          <th className="text-right font-bold p-3 whitespace-nowrap">Packaging</th>
                          <th className="text-right font-bold p-3 whitespace-nowrap">Courier</th>
                          <th className="text-right font-bold p-3 whitespace-nowrap">Customer Paid</th>
                          <th className="text-right font-bold p-3 whitespace-nowrap text-emerald-700">Earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((order) => {
                          const booksAmt = orderProductRevenue(order);
                          const packAmt = orderPackagingCharge(order);
                          const courierAmt = orderCourierCharge(order);
                          return (
                          <tr key={order.id} className="border-t hover:bg-muted/30">
                            <td className="p-3 whitespace-nowrap text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                              })}
                            </td>
                            <td className="p-3 font-bold text-slate-700 whitespace-nowrap">{order.id}</td>
                            <td className="p-3 whitespace-nowrap">{order.customer_name}</td>
                            {statementMode === "bank" && (
                              <td className="p-3 text-blue-700 font-mono text-[11px] whitespace-nowrap">
                                {upiSettings.upi_id}
                              </td>
                            )}
                            <td className="p-3 text-right tabular-nums whitespace-nowrap">
                              ₹{booksAmt.toFixed(2)}
                            </td>
                            <td className="p-3 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                              ₹{packAmt.toFixed(2)}
                            </td>
                            <td className="p-3 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                              ₹{courierAmt.toFixed(2)}
                            </td>
                            <td className={`p-3 text-right font-bold tabular-nums whitespace-nowrap ${statementMode === "bank" ? "text-blue-600" : "text-green-600"}`}>
                              ₹{order.total.toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-bold tabular-nums whitespace-nowrap text-emerald-700">
                              ₹{booksAmt.toFixed(2)}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 bg-muted/40">
                          <td className="p-3 font-bold" colSpan={statementMode === "bank" ? 4 : 3}>
                            Total ({rows.length} transactions)
                          </td>
                          <td className="p-3 text-right font-bold tabular-nums">₹{totalBooks.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold tabular-nums text-muted-foreground">₹{totalPackaging.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold tabular-nums text-muted-foreground">₹{totalCourier.toFixed(2)}</td>
                          <td className={`p-3 text-right font-bold tabular-nums ${statementMode === "bank" ? "text-blue-700" : "text-green-700"}`}>
                            ₹{totalPaid.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-bold tabular-nums text-emerald-700">
                            ₹{totalBooks.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Books Inventory (CRUD) */}
        {activeTab === "books" && (
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <CardTitle className="text-lg font-bold">Books Stock Manager</CardTitle>
                <CardDescription>
                  Buying price, selling price, stock, and margin per book. Gross profit on the dashboard uses these buying prices.
                </CardDescription>
              </div>
              <Button onClick={handleOpenAddBook} size="sm" className="bg-primary text-primary-foreground flex items-center justify-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add New Book
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {books.map(book => {
                  const { margin, percent } = unitMargin(book.cost_price ?? 0, book.price);
                  return (
                  <Card key={book.id} className="border flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex gap-3">
                        <div className="relative w-16 h-16 shrink-0 rounded border border-border overflow-hidden">
                          <BookImage src={book.image} alt={book.name_en} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-foreground leading-snug">{book.name_en}</h4>
                          <h5 className="text-xs text-muted-foreground truncate mt-0.5">{book.name_ur}</h5>
                          <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                            <div className="rounded-lg bg-amber-50 border border-amber-100 px-2 py-1.5">
                              <p className="text-[10px] font-semibold uppercase text-amber-700">Buying</p>
                              <p className="font-bold tabular-nums text-amber-900">{formatRupee(book.cost_price ?? 0, 2)}</p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-1.5">
                              <p className="text-[10px] font-semibold uppercase text-emerald-700">Selling</p>
                              <p className="font-bold tabular-nums text-emerald-900">{formatRupee(book.price, 2)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                            <Badge variant="outline" className="text-[10px] tabular-nums bg-slate-50">
                              Margin: {formatRupee(margin, 2)} ({percent.toFixed(0)}%)
                            </Badge>
                            <Badge variant={book.stock === 0 ? "destructive" : book.stock < LOW_STOCK_THRESHOLD ? "secondary" : "outline"} className={`text-[10px] tabular-nums ${book.stock > 0 && book.stock < LOW_STOCK_THRESHOLD ? "bg-amber-100 text-amber-800 border-amber-300" : ""}`}>
                              Stock: {book.stock.toLocaleString()}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] text-muted-foreground tabular-nums">
                              {book.weight ?? 80}g
                            </Badge>
                            {book.is_quran && (
                              <Badge className="text-[10px] bg-emerald-600 text-white border-0">Quran</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{book.description_en}</p>
                      
                      <Separator className="my-3" />
                      
                      <div className="flex gap-2 justify-end text-xs">
                        <Button size="sm" variant="outline" className="px-2.5 text-blue-600 hover:text-blue-700" onClick={() => handleOpenEditBook(book)}>
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="px-2.5 text-destructive hover:text-destructive/80" onClick={() => handleDeleteBook(book.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 4: QR Code & Payment configuration */}
        {activeTab === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">{t("changeQrCode")}</CardTitle>
              <CardDescription>Update your UPI credentials, Payee name, and scan QR code dynamically displayed to users on checkouts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">UPI Address (UPI ID)</label>
                <Input
                  value={tempUpiSettings.upi_id}
                  onChange={e => setTempUpiSettings(prev => ({ ...prev, upi_id: e.target.value }))}
                  placeholder="9426880068@kotak"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payee Name</label>
                <Input
                  value={tempUpiSettings.payee_name}
                  onChange={e => setTempUpiSettings(prev => ({ ...prev, payee_name: e.target.value }))}
                  placeholder="ADNAN IBADULLAH ARODIYA"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">QR Code Image URL / Local Path</label>
                <Input
                  value={tempUpiSettings.qr_code_url}
                  onChange={e => setTempUpiSettings(prev => ({ ...prev, qr_code_url: e.target.value }))}
                  placeholder="/images/qr-code.png"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="text-xs"
                    disabled={uploadingQr}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingQr(true);
                      try {
                        const url = await uploadImage(file, "qr-codes");
                        setTempUpiSettings(prev => ({ ...prev, qr_code_url: url }));
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "QR upload failed");
                      } finally {
                        setUploadingQr(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  {uploadingQr && <span className="text-xs text-muted-foreground">Uploading…</span>}
                </div>
              </div>

              <div className="p-3 bg-muted rounded-xl flex items-center gap-4">
                <div className="relative w-16 h-16 bg-white border rounded p-1 flex-shrink-0">
                  <Image src={tempUpiSettings.qr_code_url} alt="QR Code Preview" fill className="object-contain" />
                </div>
                <div className="text-xs text-muted-foreground leading-normal">
                  <p className="font-bold text-foreground">QR Code Preview</p>
                  Verify that this QR Code is scanning correctly on mobile devices before confirming settings.
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="bg-primary text-primary-foreground font-bold">
                <Check className="h-4 w-4 mr-2" />
                Update Payment Settings
              </Button>

              <Separator className="my-6" />

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Database Migration</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Apply courier &amp; packaging charge columns to Supabase. Requires{" "}
                  <code className="text-[10px] bg-muted px-1 rounded">SUPABASE_DB_PASSWORD</code> in .env.local.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRunMigration}
                  disabled={runningMigration}
                  className="font-semibold"
                >
                  {runningMigration ? "Applying…" : "Apply Call-Charges Migration"}
                </Button>
                {migrationStatus && (
                  <p className="text-xs text-slate-600">{migrationStatus}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </div>

      {/* Quotation modal — packaging & courier charges */}
      <MobileSheet
        open={!!callModal}
        onClose={() => setCallModal(null)}
        maxWidth="sm"
        header={
          callModal ? (
            <div className="bg-primary px-4 pt-2 pb-4 sm:px-5 sm:pt-4 flex items-start justify-between gap-3 text-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <PhoneCall className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-tight">{t("quotationPackTitle")}</h3>
                  <p className="text-sm text-white/85 mt-0.5">
                    Enter charges agreed on the call — order stays pending
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCallModal(null)}
                className="p-1.5 rounded-full hover:bg-white/20 shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          ) : null
        }
        footer={
          callModal ? (
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={submitQuotation}
                disabled={submittingQuotation}
              >
                <Check className="h-4 w-4 mr-2" />
                {submittingQuotation ? "Saving…" : t("sendQuotation")}
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => setCallModal(null)}>
                {t("cancel")}
              </Button>
            </div>
          ) : null
        }
      >
        {callModal ? (
          <div className="px-4 py-4 sm:px-5 sm:py-5 space-y-4 text-left">
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("quotationPackPrompt").replace("{phone}", callModal.customer_phone)}
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <div className="flex justify-between items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order ID</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{callModal.id}</span>
              </div>
              <Separator className="bg-slate-200" />
              <div className="flex justify-between items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</span>
                <span className="text-sm font-bold text-slate-900 text-right">{callModal.customer_name}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</span>
                <a
                  href={`tel:${callModal.customer_phone.replace(/\s/g, "")}`}
                  className="text-sm font-bold text-primary hover:underline text-right"
                >
                  {callModal.customer_phone}
                </a>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  {callModal.payment_type === "bank" ? (
                    <>
                      <Banknote className="h-4 w-4 text-blue-600" />
                      Bank / UPI
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      Cash on Delivery
                    </>
                  )}
                  <span className="text-primary">· ₹{Math.max(0, callModal.subtotal - callModal.discount).toFixed(2)} (books)</span>
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery</span>
                <span className="text-sm font-bold text-slate-900 capitalize text-right">
                  {formatDeliveryType(callModal.delivery_type)}
                </span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 shrink-0">Items</span>
                <div className="text-sm text-slate-800 text-right space-y-1">
                  <p className="font-bold">{formatOrderItemsSummary(callModal.items)}</p>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    {callModal.items.slice(0, 4).map((item) => (
                      <li key={item.id}>
                        {item.book_name} — {item.quantity} {item.quantity === 1 ? "book" : "books"}
                      </li>
                    ))}
                    {callModal.items.length > 4 && (
                      <li className="text-slate-400">+{callModal.items.length - 4} more…</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Charges agreed on phone call
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">{t("packagingChargeLabel")}</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={chargePackaging}
                    onChange={(e) => setChargePackaging(e.target.value)}
                    className={adminFieldInput}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">{t("courierChargeLabel")}</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={chargeCourier}
                    onChange={(e) => setChargeCourier(e.target.value)}
                    className={adminFieldInput}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">{t("adminNotes")}</label>
                <Textarea
                  value={chargeNotes}
                  onChange={(e) => setChargeNotes(e.target.value)}
                  rows={2}
                  className="rounded-xl border-slate-200 bg-slate-50 text-sm"
                  placeholder="Payment received on call, delivery notes…"
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                <span className="text-sm text-slate-600">{t("productsTotal")}</span>
                <span className="text-sm font-bold">₹{callModalProductsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-slate-900">{t("finalTotal")}</span>
                <span className="text-lg font-bold text-primary">₹{callModalFinalTotal.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Save the quotation and optionally send the price breakdown on WhatsApp. Use <strong>Confirm Order</strong> when the customer agrees — that sends the order to the packer.
            </p>
          </div>
        ) : null}
      </MobileSheet>

      {/* WhatsApp send prompt — after quotation */}
      <ConfirmModal
        open={!!whatsappQuotationOrder}
        title={t("whatsappQuotationTitle")}
        description={
          whatsappQuotationOrder
            ? t("whatsappQuotationPrompt")
                .replace("{name}", whatsappQuotationOrder.customer_name)
                .replace("{phone}", whatsappQuotationOrder.customer_phone)
            : ""
        }
        confirmLabel={t("whatsappSendYes")}
        cancelLabel={t("whatsappSendNo")}
        onConfirm={handleWhatsAppQuotationConfirm}
        onCancel={() => setWhatsappQuotationOrder(null)}
        loading={sharingWhatsApp}
        headerTone="green"
        icon={<MessageCircle className="h-5 w-5 text-white" />}
      >
        {whatsappQuotationOrder ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-1">
            <p>
              <span className="font-semibold text-slate-500">Order:</span>{" "}
              {whatsappQuotationOrder.id}
            </p>
            <p>
              <span className="font-semibold text-slate-500">Total:</span>{" "}
              ₹{whatsappQuotationOrder.total.toFixed(2)}
            </p>
            <p className="text-slate-500 pt-1">{t("whatsappQuotationHint")}</p>
          </div>
        ) : null}
      </ConfirmModal>

      {/* Confirm order → send to packer */}
      <ConfirmModal
        open={!!confirmPackModal}
        title={t("confirmOrderTitle")}
        description={t("confirmOrderPrompt")}
        confirmLabel={t("confirmOrderYes")}
        cancelLabel={t("cancel")}
        onConfirm={handleConfirmOrderToPacker}
        onCancel={() => setConfirmPackModal(null)}
        loading={confirmingToPacker}
        headerTone="primary"
        icon={<PackageCheck className="h-5 w-5 text-white" />}
      >
        {confirmPackModal ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-1">
            <p>
              <span className="font-semibold text-slate-500">Order:</span>{" "}
              {confirmPackModal.id}
            </p>
            <p>
              <span className="font-semibold text-slate-500">Customer:</span>{" "}
              {confirmPackModal.customer_name}
            </p>
            <p>
              <span className="font-semibold text-slate-500">Total:</span>{" "}
              ₹{confirmPackModal.total.toFixed(2)}
            </p>
          </div>
        ) : null}
      </ConfirmModal>

      {/* Cancel order modal */}
      <MobileSheet
        open={!!cancelModal}
        onClose={() => setCancelModal(null)}
        maxWidth="sm"
        header={
          cancelModal ? (
            <div className="bg-red-600 px-4 pt-2 pb-4 sm:px-5 sm:pt-4 flex items-start justify-between gap-3 text-white shrink-0">
              <div className="min-w-0">
                <h3 className="text-lg font-bold leading-tight">{t("cancelOrderTitle")}</h3>
                <p className="text-sm text-white/85 mt-0.5">{cancelModal.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                className="p-1.5 rounded-full hover:bg-white/20 shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          ) : null
        }
        footer={
          cancelModal ? (
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={handleCancelOrder}
                disabled={cancellingOrder}
              >
                {cancellingOrder ? "Cancelling…" : t("cancelOrder")}
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => setCancelModal(null)}>
                Go Back
              </Button>
            </div>
          ) : null
        }
      >
        {cancelModal ? (
          <div className="px-4 py-4 sm:px-5 space-y-4">
            <p className="text-sm text-slate-600">{t("cancelOrderPrompt")}</p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Reason (optional)</label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className="rounded-xl border-slate-200 bg-slate-50 text-sm"
              />
            </div>
          </div>
        ) : null}
      </MobileSheet>

      {/* CRUD Book edit/add modal */}
      <MobileSheet
        open={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        maxWidth="md"
        title={editingBook ? "Edit Book details" : "Add new book to store"}
        footer={
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setIsBookModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="admin-book-form" size="lg" className="flex-1 bg-primary text-white">
              Save Book
            </Button>
          </div>
        }
      >
        <form id="admin-book-form" onSubmit={handleSaveBook} className="px-4 py-4 sm:px-6 sm:py-5 space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={adminFieldLabel}>Book Name (English)</label>
              <Input
                required
                value={bookFormData.name_en}
                onChange={e => setBookFormData(prev => ({ ...prev, name_en: e.target.value }))}
                placeholder="e.g. Makhfoozat Ka Aasan Nisab"
                className={adminFieldInput}
              />
            </div>
            <div className="space-y-1.5">
              <label className={adminFieldLabel}>Book Name (Urdu)</label>
              <Input
                required
                value={bookFormData.name_ur}
                onChange={e => setBookFormData(prev => ({ ...prev, name_ur: e.target.value }))}
                placeholder="ملفوظات کا آسان نصاب"
                className={`${adminFieldInput} text-right`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={adminFieldLabel}>Buying price (₹)</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={bookFormData.cost_price}
                onChange={e => setBookFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                placeholder="13.50"
                className={`${adminFieldInput} tabular-nums`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={adminFieldLabel}>Selling price (₹)</label>
              <Input
                required
                type="number"
                inputMode="numeric"
                value={bookFormData.price}
                onChange={e => setBookFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="150"
                className={`${adminFieldInput} tabular-nums font-semibold`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={adminFieldLabel}>Stock Qty</label>
              <Input
                required
                type="number"
                inputMode="numeric"
                value={bookFormData.stock}
                onChange={e => setBookFormData(prev => ({ ...prev, stock: e.target.value }))}
                placeholder="50"
                className={`${adminFieldInput} tabular-nums font-semibold`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={adminFieldLabel}>Weight (grams)</label>
              <Input
                required
                type="number"
                inputMode="numeric"
                value={bookFormData.weight}
                onChange={e => setBookFormData(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="80"
                className={`${adminFieldInput} tabular-nums`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={adminFieldLabel}>Cover Image URL (optional)</label>
            <Input
              value={bookFormData.image}
              onChange={e => setBookFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="https://... or upload below"
              className={adminFieldInput}
            />
            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                <Upload className="h-4 w-4" />
                <span>Upload cover image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingCover}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingCover(true);
                    try {
                      const url = await uploadImage(file, "book-covers");
                      setBookFormData(prev => ({ ...prev, image: url }));
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Cover upload failed");
                    } finally {
                      setUploadingCover(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
              {uploadingCover && <span className="text-sm text-muted-foreground">Uploading…</span>}
            </div>
            {(bookFormData.image || bookFormData.name_en) && (
              <div className="relative w-20 h-20 mt-2 rounded-xl border overflow-hidden">
                <BookImage
                  src={bookFormData.image}
                  alt={bookFormData.name_en || "Preview"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className={adminFieldLabel}>Description (English)</label>
            <Textarea
              rows={3}
              value={bookFormData.description_en}
              onChange={e => setBookFormData(prev => ({ ...prev, description_en: e.target.value }))}
              placeholder="Brief summary..."
              className={`${adminFieldInput} min-h-[5rem] py-3 resize-none`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={adminFieldLabel}>Description (Urdu)</label>
            <Textarea
              rows={3}
              value={bookFormData.description_ur}
              onChange={e => setBookFormData(prev => ({ ...prev, description_ur: e.target.value }))}
              placeholder="تفصیل..."
              className={`${adminFieldInput} min-h-[5rem] py-3 resize-none text-right`}
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-foreground cursor-pointer select-none p-3 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              checked={bookFormData.is_quran}
              onChange={e => setBookFormData(prev => ({ ...prev, is_quran: e.target.checked }))}
              className="h-5 w-5 mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer shrink-0"
            />
            <span>
              Mark as <span className="font-bold text-emerald-700">Quran Sharif</span> — ₹25/copy off when order is ₹5,000+ (no % discount on Quran)
            </span>
          </label>
        </form>
      </MobileSheet>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
        variant="success"
      />
    </div>
  );
}
