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
  TrendingUp, BarChart3, BookOpen, AlertTriangle,
  Settings, Layers, PhoneCall, Check, Truck, Trash2, Plus, Edit2, RotateCw, LogOut, Upload
} from "lucide-react";
import Image from "next/image";

interface Book {
  id: number;
  name_en: string;
  name_ur: string;
  price: number;
  description_en: string;
  description_ur: string;
  image: string;
  stock: number;
  weight: number;
}

interface OrderItem {
  id: number;
  order_id: string;
  book_id: number;
  book_name: string;
  quantity: number;
  price: number;
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
  total: number;
  status: string; // 'pending' | 'ready_to_pack' | 'packed'
  payment_confirmed: boolean;
  packed_at?: string | null;
  pickup_confirmed?: boolean;
  pickup_confirmed_at?: string | null;
  created_at: string;
  items: OrderItem[];
}

export default function AdminDashboard() {
  const { t, isRtl, setUserRole } = useLanguage();
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
  const [activeTab, setActiveTab] = useState("dashboard");

  // Call simulation modal state
  const [callModal, setCallModal] = useState<{ open: boolean; orderId: string; phone: string; name: string } | null>(null);

  // QR Code edit state
  const [tempUpiSettings, setTempUpiSettings] = useState({ ...upiSettings });

  // Toast & upload states
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [uploadingQr, setUploadingQr] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [confirmingPickupId, setConfirmingPickupId] = useState<string | null>(null);

  // CRUD book states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookFormData, setBookFormData] = useState({
    name_en: "",
    name_ur: "",
    price: "",
    stock: "",
    weight: "",
    description_en: "",
    description_ur: "",
    image: ""
  });

  // Fetch all data
  const loadData = async () => {
    setLoading(true);
    try {
      const allBooks = await db.getBooks();
      setBooks(allBooks.map(b => ({ ...b, price: Number(b.price) })));

      const allOrders = await db.getOrders();
      setOrders(allOrders.map(o => ({
        ...o,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        packaging_charge: Number(o.packaging_charge),
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
  const totalStockQuantity = books.reduce((sum, b) => sum + b.stock, 0);
  const totalStockValue = books.reduce((sum, b) => sum + b.price * b.stock, 0);
  const outOfStockBooks = books.filter(b => b.stock === 0);
  const lowStockBooks = books.filter(b => b.stock > 0 && b.stock <= 3);

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
  const bankEarnings = filteredOrders
    .filter(o => o.payment_type === "bank" && o.status !== "pending")
    .reduce((sum, o) => sum + o.total, 0);

  const cashEarnings = filteredOrders
    .filter(o => o.payment_type === "cash" && o.status !== "pending")
    .reduce((sum, o) => sum + o.total, 0);

  const totalEarnings = bankEarnings + cashEarnings;

  // Actions
  const handleReadyToPackClick = (orderId: string, phone: string, name: string) => {
    setCallModal({ open: true, orderId, phone, name });
  };

  const confirmReadyToPack = async () => {
    if (!callModal) return;
    try {
      const success = await db.updateOrderStatus(callModal.orderId, "ready_to_pack");
      if (success) {
        setOrders(prev => prev.map(o => o.id === callModal.orderId ? { ...o, status: "ready_to_pack" } : o));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCallModal(null);
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
      }
    } catch (err) {
      console.error(err);
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
      price: "",
      stock: "",
      weight: "80",
      description_en: "",
      description_ur: "",
      image: ""
    });
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (book: Book) => {
    setEditingBook(book);
    setBookFormData({
      name_en: book.name_en,
      name_ur: book.name_ur,
      price: String(book.price),
      stock: String(book.stock),
      weight: String(book.weight ?? 80),
      description_en: book.description_en || "",
      description_ur: book.description_ur || "",
      image: book.image
    });
    setIsBookModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name_en: bookFormData.name_en,
      name_ur: bookFormData.name_ur,
      price: Number(bookFormData.price),
      stock: Number(bookFormData.stock),
      weight: Number(bookFormData.weight) || 80,
      description_en: bookFormData.description_en,
      description_ur: bookFormData.description_ur,
      image: bookFormData.image
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
  const packedOrders = orders.filter(o => o.status === "packed");

  const tabs: {
    id: string;
    label: string;
    icon: typeof BarChart3;
    badge?: number;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "orders", label: "Orders", icon: Truck, badge: pendingOrders.length },
    { id: "books", label: "Inventory", icon: BookOpen },
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
            <Button variant="outline" size="sm" onClick={loadData} className="h-8 text-xs bg-transparent border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white">
              <RotateCw className="h-3.5 w-3.5" />
              Reload
            </Button>
            <Button size="sm" onClick={handleOpenAddBook} className="h-8 text-xs bg-primary text-primary-foreground">
              <Plus className="h-3.5 w-3.5" />
              {t("addBook")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 text-xs bg-transparent border-slate-600 text-red-300 hover:bg-slate-800 hover:text-red-200">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <nav className="flex md:flex-col gap-0 md:w-44 shrink-0 border border-border bg-white overflow-x-auto md:overflow-visible">
            {tabs.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-left text-xs sm:text-sm font-medium border-b md:border-b-0 md:border-l-2 border-border last:border-b-0 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? "bg-slate-50 text-slate-900 md:border-l-primary border-l-transparent"
                    : "text-muted-foreground hover:bg-slate-50 hover:text-foreground md:border-l-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {badge ? (
                  <Badge className="ml-auto bg-red-600 text-white border-0 text-[10px] px-1.5">{badge}</Badge>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0 space-y-4">

        {/* Tab 1: Dashboard Analytics & Ledger */}
        {activeTab === "dashboard" && (
          <>
            {/* Filters and Stats */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-white p-3 border border-border">
              <span className="text-sm font-semibold text-muted-foreground">{t("filterBy")}</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant={timeFilter === "day" ? "default" : "outline"} onClick={() => setTimeFilter("day")}>Today</Button>
                <Button size="sm" variant={timeFilter === "month" ? "default" : "outline"} onClick={() => setTimeFilter("month")}>Month</Button>
                <Button size="sm" variant={timeFilter === "year" ? "default" : "outline"} onClick={() => setTimeFilter("year")}>Year</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="shadow-sm">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase">Stock Valuation</p>
                      <h3 className="text-lg sm:text-2xl font-bold mt-1 text-slate-800 truncate">₹{totalStockValue.toLocaleString()}</h3>
                    </div>
                    <Layers className="h-8 w-8 text-primary/80 bg-primary/10 p-1.5 rounded-lg" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 font-semibold">
                    Total {totalStockQuantity} books in inventory
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border border-border">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Bank Revenue</p>
                      <h3 className="text-2xl font-bold mt-1 text-blue-600">₹{bankEarnings.toLocaleString()}</h3>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 font-semibold">
                    From bank/UPI transfer (confirmed)
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border border-border">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Cash Revenue</p>
                      <h3 className="text-2xl font-bold mt-1 text-green-600">₹{cashEarnings.toLocaleString()}</h3>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500 bg-green-50 p-1.5 rounded-lg" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 font-semibold">
                    From cash payment orders (confirmed)
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border border-border">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Total Revenue</p>
                      <h3 className="text-2xl font-bold mt-1 text-purple-600">₹{totalEarnings.toLocaleString()}</h3>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-500 bg-purple-50 p-1.5 rounded-lg" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 font-semibold">
                    Combined earnings in filtered period
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Low Stock Alerts */}
            {(outOfStockBooks.length > 0 || lowStockBooks.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Out of Stock */}
                {outOfStockBooks.length > 0 && (
                  <Card className="border-red-200 bg-red-50/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Out of Stock ({outOfStockBooks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {outOfStockBooks.map(book => (
                        <div key={book.id} className="flex justify-between items-center border-b border-red-100 pb-2 last:border-0 last:pb-0 text-xs">
                          <div>
                            <span className="font-semibold text-slate-800">{book.name_en}</span>
                            <span className="block text-[10px] text-muted-foreground">{book.name_ur}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              placeholder="Qty"
                              className="w-14 h-7 text-xs px-1.5"
                              value={reorderAmount[book.id] || ""}
                              onChange={e => setReorderAmount(prev => ({ ...prev, [book.id]: parseInt(e.target.value) || 0 }))}
                            />
                            <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => handleUpdateStock(book.id)}>
                              Reorder
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Low Stock */}
                {lowStockBooks.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        Low Stock Alert ({lowStockBooks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {lowStockBooks.map(book => (
                        <div key={book.id} className="flex justify-between items-center border-b border-amber-100 pb-2 last:border-0 last:pb-0 text-xs">
                          <div>
                            <span className="font-semibold text-slate-800">{book.name_en}</span>
                            <span className="block text-[10px] text-amber-600">Qty remaining: {book.stock}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              placeholder="Qty"
                              className="w-14 h-7 text-xs px-1.5"
                              value={reorderAmount[book.id] || ""}
                              onChange={e => setReorderAmount(prev => ({ ...prev, [book.id]: parseInt(e.target.value) || 0 }))}
                            />
                            <Button size="sm" className="h-7 text-xs px-2 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleUpdateStock(book.id)}>
                              Update
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Ledger Statement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">{t("ledger")}</CardTitle>
                <CardDescription>Statements of completed Bank & Cash earnings in filtered period ({timeFilter})</CardDescription>
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
                      {filteredOrders.filter(o => o.payment_type === "bank" && o.status !== "pending").length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground">No bank statements</p>
                      ) : (
                        filteredOrders.filter(o => o.payment_type === "bank" && o.status !== "pending").map((order, idx) => (
                          <div key={idx} className="p-3 flex justify-between items-center hover:bg-muted/30">
                            <div>
                              <span className="font-bold text-slate-700 block">{order.id}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} | {order.customer_name}</span>
                            </div>
                            <span className="font-bold text-blue-600">₹{order.total.toFixed(2)}</span>
                          </div>
                        ))
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
                      {filteredOrders.filter(o => o.payment_type === "cash" && o.status !== "pending").length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground">No cash statements</p>
                      ) : (
                        filteredOrders.filter(o => o.payment_type === "cash" && o.status !== "pending").map((order, idx) => (
                          <div key={idx} className="p-3 flex justify-between items-center hover:bg-muted/30">
                            <div>
                              <span className="font-bold text-slate-700 block">{order.id}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} | {order.customer_name}</span>
                            </div>
                            <span className="font-bold text-green-600">₹{order.total.toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
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
                  <div className="space-y-4">
                    {pendingOrders.map(order => (
                      <div key={order.id} className="p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/10 shadow-sm">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-md text-slate-800">{order.customer_name}</span>
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold">{order.id}</Badge>
                            <Badge className="bg-blue-500 hover:bg-blue-600 uppercase text-[9px] font-extrabold">{order.payment_type}</Badge>
                          </div>
                          <p className="text-muted-foreground font-semibold"><span className="text-slate-800">Phone:</span> {order.customer_phone}</p>
                          <p className="text-muted-foreground"><span className="text-slate-800">Address:</span> {order.customer_address}</p>
                          
                          <div className="pt-2 font-bold text-slate-700">
                            Items: {order.items.map(i => `${i.book_name} (x${i.quantity})`).join(", ")}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-right text-xs">
                            <span className="text-muted-foreground block">Total Amount</span>
                            <span className="text-md font-bold text-primary">₹{order.total.toFixed(2)}</span>
                          </div>
                          <Button 
                            className="bg-primary hover:bg-primary/95 text-white font-bold"
                            onClick={() => handleReadyToPackClick(order.id, order.customer_phone, order.customer_name)}
                          >
                            <PhoneCall className="h-4 w-4 mr-2" />
                            Ready to Pack
                          </Button>
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
                <CardContent className="space-y-2 text-xs">
                  {orders
                    .filter((o) => o.status === "ready_to_pack")
                    .map((order) => (
                      <div key={order.id} className="flex justify-between items-center border p-3 bg-orange-50/50">
                        <div>
                          <span className="font-bold">{order.customer_name}</span>
                          <span className="text-muted-foreground ml-2">{order.id}</span>
                        </div>
                        <Badge className="bg-orange-500 text-white">With Packer</Badge>
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
                  confirmingId={confirmingPickupId}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Tab 3: Books Inventory (CRUD) */}
        {activeTab === "books" && (
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold">Books Stock Manager</CardTitle>
                <CardDescription>Perform CRUD operations, manage cover images, pricing, and translations.</CardDescription>
              </div>
              <Button onClick={handleOpenAddBook} size="sm" className="bg-primary text-primary-foreground flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Book
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {books.map(book => (
                  <Card key={book.id} className="border flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex gap-3">
                        <div className="relative w-16 h-16 shrink-0 rounded border border-border overflow-hidden">
                          <BookImage src={book.image} alt={book.name_en} fill className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{book.name_en}</h4>
                          <h5 className="text-xs text-muted-foreground truncate">{book.name_ur}</h5>
                          <div className="flex gap-2 mt-1.5 items-center">
                            <span className="font-bold text-xs">₹{book.price}</span>
                            <Badge variant={book.stock === 0 ? "destructive" : book.stock <= 3 ? "secondary" : "outline"} className="text-[10px]">
                              Stock: {book.stock}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              {book.weight ?? 80}g
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{book.description_en}</p>
                      
                      <Separator className="my-3" />
                      
                      <div className="flex gap-2 justify-end text-xs">
                        <Button size="sm" variant="outline" className="h-8 px-2.5 text-blue-600 hover:text-blue-700" onClick={() => handleOpenEditBook(book)}>
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-2.5 text-destructive hover:text-destructive/80" onClick={() => handleDeleteBook(book.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </div>

      {/* Confirmation modal for simulated calls */}
      {callModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm p-6 max-w-sm w-full text-center space-y-4 shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <PhoneCall className="h-6 w-6 text-primary animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800">{t("confirmPackTitle")}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calling <strong className="text-slate-800 font-bold">{callModal.name}</strong> at <strong className="text-slate-800 font-bold">{callModal.phone}</strong> for confirmation...
              </p>
              <div className="p-3 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 flex justify-center items-center gap-2 border">
                <span>⚡ Simulate Call Status: Connected</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-normal">
              Confirm with customer: Order details, Book types & quantities, Courier type, and Payment status. Once confirmed, assign to the packer.
            </p>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={() => setCallModal(null)}>
                {t("cancel")}
              </Button>
              <Button className="flex-1 text-xs bg-primary text-white font-bold" onClick={confirmReadyToPack}>
                {t("confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Book edit/add modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveBook} className="bg-white rounded-sm p-4 sm:p-6 max-w-lg w-full space-y-4 shadow-lg border overflow-y-auto max-h-[90vh] mx-2 sm:mx-0">
            <h3 className="text-lg font-bold text-slate-800">
              {editingBook ? "Edit Book details" : "Add new book to store"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Book Name (English)</label>
                <Input
                  required
                  value={bookFormData.name_en}
                  onChange={e => setBookFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="e.g. Makhfoozat Ka Aasan Nisab"
                />
              </div>
              <div className="space-y-1 text-right">
                <label className="font-bold text-muted-foreground block text-left">Book Name (Urdu)</label>
                <Input
                  required
                  value={bookFormData.name_ur}
                  onChange={e => setBookFormData(prev => ({ ...prev, name_ur: e.target.value }))}
                  placeholder="ملفوظات کا آسان نصاب"
                  className="text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Price (₹)</label>
                <Input
                  required
                  type="number"
                  value={bookFormData.price}
                  onChange={e => setBookFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="150"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Stock Qty</label>
                <Input
                  required
                  type="number"
                  value={bookFormData.stock}
                  onChange={e => setBookFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="50"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Weight (grams)</label>
                <Input
                  required
                  type="number"
                  value={bookFormData.weight}
                  onChange={e => setBookFormData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="80"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-muted-foreground">Cover Image URL (optional — leave blank for name placeholder)</label>
              <Input
                value={bookFormData.image}
                onChange={e => setBookFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://... or upload below"
              />
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                  <Upload className="h-3.5 w-3.5" />
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
                {uploadingCover && <span className="text-muted-foreground">Uploading…</span>}
              </div>
              {(bookFormData.image || bookFormData.name_en) && (
                <div className="relative w-20 h-20 mt-2 rounded border overflow-hidden">
                  <BookImage
                    src={bookFormData.image}
                    alt={bookFormData.name_en || "Preview"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-muted-foreground">Description (English)</label>
              <Textarea
                rows={2}
                value={bookFormData.description_en}
                onChange={e => setBookFormData(prev => ({ ...prev, description_en: e.target.value }))}
                placeholder="Brief summary..."
              />
            </div>

            <div className="space-y-1 text-xs text-right">
              <label className="font-bold text-muted-foreground block text-left">Description (Urdu)</label>
              <Textarea
                rows={2}
                value={bookFormData.description_ur}
                onChange={e => setBookFormData(prev => ({ ...prev, description_ur: e.target.value }))}
                placeholder="تفصیل..."
                className="text-right"
              />
            </div>

            <div className="flex gap-3 pt-2 justify-end text-xs">
              <Button type="button" variant="outline" onClick={() => setIsBookModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-white font-bold">Save Book</Button>
            </div>
          </form>
        </div>
      )}

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
        variant="success"
      />
    </div>
  );
}
