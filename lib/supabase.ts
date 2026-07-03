import { createClient } from "@supabase/supabase-js";
import { DEFAULT_BOOKS as CATALOG_DEFAULT_BOOKS } from "./catalog";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isRealSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Real client
export const supabase = isRealSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock data structures
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
  status: string;
  payment_confirmed: boolean;
  packed_at?: string | null;
  pickup_confirmed?: boolean;
  pickup_confirmed_at?: string | null;
  created_at: string;
}

interface OrderItem {
  id: number;
  order_id: string;
  book_id: number;
  book_name: string;
  quantity: number;
  price: number;
}

interface Setting {
  key: string;
  value: string;
}

const DEFAULT_BOOKS: Book[] = CATALOG_DEFAULT_BOOKS;

// Helper to get/set mock DB
const getMockDB = () => {
  if (typeof window === "undefined") {
    return { books: DEFAULT_BOOKS, orders: [], orderItems: [], settings: [] };
  }

  let books = localStorage.getItem("mock_books_v3");
  if (!books) {
    localStorage.setItem("mock_books_v3", JSON.stringify(DEFAULT_BOOKS));
    books = JSON.stringify(DEFAULT_BOOKS);
  }

  let orders = localStorage.getItem("mock_orders");
  if (!orders) {
    localStorage.setItem("mock_orders", "[]");
    orders = "[]";
  }

  let orderItems = localStorage.getItem("mock_order_items");
  if (!orderItems) {
    localStorage.setItem("mock_order_items", "[]");
    orderItems = "[]";
  }

  let settings = localStorage.getItem("mock_settings");
  if (!settings) {
    const defaultSettings = [
      { key: "upi_id", value: "9426880068@kotak" },
      { key: "payee_name", value: "ADNAN IBADULLAH ARODIYA" },
      { key: "qr_code_url", value: "/images/qr-code.png" }
    ];
    localStorage.setItem("mock_settings", JSON.stringify(defaultSettings));
    settings = JSON.stringify(defaultSettings);
  }

  return {
    books: JSON.parse(books) as Book[],
    orders: JSON.parse(orders) as Order[],
    orderItems: JSON.parse(orderItems) as OrderItem[],
    settings: JSON.parse(settings) as Setting[]
  };
};

const saveMockDB = (db: { books: Book[]; orders: Order[]; orderItems: OrderItem[]; settings: Setting[] }) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mock_books_v3", JSON.stringify(db.books));
    localStorage.setItem("mock_orders", JSON.stringify(db.orders));
    localStorage.setItem("mock_order_items", JSON.stringify(db.orderItems));
    localStorage.setItem("mock_settings", JSON.stringify(db.settings));
  }
};

// Unified DB queries wrapper
export const db = {
  // Books CRUD
  async getBooks(): Promise<Book[]> {
    if (isRealSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("books").select("*").order("id", { ascending: true });
      if (!error && data) return data;
      console.warn("Supabase error fetching books, falling back to LocalStorage:", error);
    }
    return getMockDB().books;
  },

  async getBook(id: number): Promise<Book | null> {
    if (isRealSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("books").select("*").eq("id", id).single();
      if (!error && data) return data;
    }
    const books = getMockDB().books;
    return books.find((b: Book) => b.id === id) || null;
  },

  async insertBook(book: Omit<Book, "id">): Promise<Book> {
    if (isRealSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("books").insert(book).select().single();
      if (!error && data) return data;
      console.error("Supabase insert book error:", error);
    }
    const dbData = getMockDB();
    const newId = dbData.books.length > 0 ? Math.max(...dbData.books.map((b: Book) => b.id)) + 1 : 1;
    const newBook = { ...book, id: newId };
    dbData.books.push(newBook);
    saveMockDB(dbData);
    return newBook;
  },

  async updateBook(id: number, updates: Partial<Book>): Promise<Book | null> {
    if (isRealSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("books").update(updates).eq("id", id).select().single();
      if (!error && data) return data;
      console.error("Supabase update book error:", error);
    }
    const dbData = getMockDB();
    const bookIdx = dbData.books.findIndex((b: Book) => b.id === id);
    if (bookIdx === -1) return null;
    dbData.books[bookIdx] = { ...dbData.books[bookIdx], ...updates };
    saveMockDB(dbData);
    return dbData.books[bookIdx];
  },

  async deleteBook(id: number): Promise<boolean> {
    if (isRealSupabaseConfigured && supabase) {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (!error) return true;
      console.error("Supabase delete book error:", error);
    }
    const dbData = getMockDB();
    const initialLen = dbData.books.length;
    dbData.books = dbData.books.filter((b: Book) => b.id !== id);
    saveMockDB(dbData);
    return dbData.books.length < initialLen;
  },

  // Orders and checkout operations
  async getOrders(): Promise<(Order & { items: OrderItem[] })[]> {
    if (isRealSupabaseConfigured && supabase) {
      const { data: orders, error: ordersErr } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (!ordersErr && orders) {
        const { data: items, error: itemsErr } = await supabase.from("order_items").select("*");
        if (!itemsErr && items) {
          return orders.map((order: Order) => ({
            ...order,
            items: items.filter((item: OrderItem) => item.order_id === order.id)
          }));
        }
      }
      console.warn("Supabase error fetching orders, falling back to LocalStorage.");
    }
    const dbData = getMockDB();
    return dbData.orders.map((order: Order) => ({
      ...order,
      items: dbData.orderItems.filter((item: OrderItem) => item.order_id === order.id)
    }));
  },

  async insertOrder(order: Order, items: Omit<OrderItem, "id">[]): Promise<boolean> {
    if (isRealSupabaseConfigured && supabase) {
      const { error: orderErr } = await supabase.from("orders").insert(order);
      if (!orderErr) {
        const { error: itemsErr } = await supabase.from("order_items").insert(items);
        if (!itemsErr) {
          // Deduct stock in database
          for (const item of items) {
            const currentBook = await this.getBook(item.book_id);
            if (currentBook) {
              const newStock = Math.max(0, currentBook.stock - item.quantity);
              await this.updateBook(item.book_id, { stock: newStock });
            }
          }
          return true;
        } else {
          console.error("Supabase order_items insert error:", itemsErr);
        }
      } else {
        console.error("Supabase order insert error:", orderErr);
      }
    }
    // Mock insert
    const dbData = getMockDB();
    dbData.orders.push(order);
    
    // Create items and adjust stock
    items.forEach((item, index) => {
      const newId = dbData.orderItems.length > 0 ? Math.max(...dbData.orderItems.map((i: OrderItem) => i.id)) + 1 + index : 1 + index;
      dbData.orderItems.push({ ...item, id: newId });
      
      // Deduct mock stock
      const bookIdx = dbData.books.findIndex((b: Book) => b.id === item.book_id);
      if (bookIdx !== -1) {
        dbData.books[bookIdx].stock = Math.max(0, dbData.books[bookIdx].stock - item.quantity);
      }
    });

    saveMockDB(dbData);
    return true;
  },

  async updateOrderStatus(id: string, status: "pending" | "ready_to_pack" | "packed", paymentConfirmed?: boolean): Promise<boolean> {
    const now = new Date().toISOString();
    if (isRealSupabaseConfigured && supabase) {
      const updates: Partial<Order> = { status };
      if (paymentConfirmed !== undefined) updates.payment_confirmed = paymentConfirmed;
      if (status === "packed") updates.packed_at = now;
      const { error } = await supabase.from("orders").update(updates).eq("id", id);
      if (!error) return true;
      console.error("Supabase update order status error:", error);
    }
    const dbData = getMockDB();
    const orderIdx = dbData.orders.findIndex((o: Order) => o.id === id);
    if (orderIdx === -1) return false;
    dbData.orders[orderIdx].status = status;
    if (paymentConfirmed !== undefined) {
      dbData.orders[orderIdx].payment_confirmed = paymentConfirmed;
    }
    if (status === "packed") {
      dbData.orders[orderIdx].packed_at = now;
    }
    saveMockDB(dbData);
    return true;
  },

  async confirmPickup(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (isRealSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("orders")
        .update({ pickup_confirmed: true, pickup_confirmed_at: now })
        .eq("id", id);
      if (!error) return true;
      console.error("Supabase confirm pickup error:", error);
    }
    const dbData = getMockDB();
    const orderIdx = dbData.orders.findIndex((o: Order) => o.id === id);
    if (orderIdx === -1) return false;
    dbData.orders[orderIdx].pickup_confirmed = true;
    dbData.orders[orderIdx].pickup_confirmed_at = now;
    saveMockDB(dbData);
    return true;
  },

  // Check if an order ID already exists (for collision-safe ID generation)
  async orderExists(id: string): Promise<boolean> {
    if (isRealSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("orders").select("id").eq("id", id).limit(1);
      if (!error) return (data?.length ?? 0) > 0;
      console.warn("Supabase error checking order id:", error);
    }
    const dbData = getMockDB();
    return dbData.orders.some((o: Order) => o.id === id);
  },

  // Settings CRUD
  async getSettings(): Promise<Setting[]> {
    if (isRealSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("settings").select("*");
      if (!error && data) return data;
      console.warn("Supabase error fetching settings, falling back to LocalStorage:", error);
    }
    return getMockDB().settings;
  },

  async updateSetting(key: string, value: string): Promise<boolean> {
    if (isRealSupabaseConfigured && supabase) {
      const { error } = await supabase.from("settings").upsert({ key, value });
      if (!error) return true;
      console.error("Supabase update setting error:", error);
    }
    const dbData = getMockDB();
    const settingIdx = dbData.settings.findIndex((s: Setting) => s.key === key);
    if (settingIdx !== -1) {
      dbData.settings[settingIdx].value = value;
    } else {
      dbData.settings.push({ key, value });
    }
    saveMockDB(dbData);
    return true;
  }
};
