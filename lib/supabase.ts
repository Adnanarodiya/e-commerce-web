import { createClient } from "@supabase/supabase-js";

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

// Default books helper
const DEFAULT_BOOKS: Book[] = [
  {
    id: 1,
    name_en: "Makhfoozat Ka Aasan Nisab",
    name_ur: "ملفوظات کا آسان نصاب",
    price: 150,
    description_en: "An easy-to-learn syllabus of memorized passages, prayers, and basic Islamic teachings designed specifically for young students and beginners.",
    description_ur: "ملفوظات، دعائیں اور بنیادی اسلامی تعلیمات کا ایک آسان نصاب جو خاص طور پر نوجوان طلباء اور مبتدیوں کے لیے تیار کیا گیا ہے۔",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRK_84LHfiZSUCzdVOn1mJwIQEg-jTv-dWckEO2p8MqzQ&s=10",
    stock: 50,
    weight: 80
  },
  {
    id: 2,
    name_en: "Bachon Ka Tohfa - Part 2",
    name_ur: "بچوں کا تحفہ - حصہ دوم",
    price: 180,
    description_en: "Part 2 of the popular series 'Bachon Ka Tohfa'. Includes advanced lessons on Islamic ethics, stories of the prophets, and daily practices for children.",
    description_ur: "مقبول سیریز 'بچوں کا تحفہ' کا دوسرا حصہ۔ اس میں بچوں کے لیے اسلامی اخلاقیات، انبیاء کے قصص اور روزمرہ کے معمولات پر اسباق شامل ہیں۔",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfBo68cmQqfaQqRxNrkFh1d4ItA2QzZzm75O78qK6vL_w&s=10",
    stock: 45,
    weight: 90
  },
  {
    id: 3,
    name_en: "Bachon Ka Tohfa - Part 1",
    name_ur: "بچوں کا تحفہ - حصہ اول",
    price: 160,
    description_en: "Part 1 of the introductory Islamic learning guide for young kids. Focuses on foundational moral values, basic beliefs, and engaging learning exercises.",
    description_ur: "چھوٹے بچوں کے لیے تعارفی اسلامی سیکھنے کی گائیڈ کا پہلا حصہ۔ بنیادی اخلاقی اقدار، عقائد اور سیکھنے کی مشقوں پر توجہ مرکوز کرتا ہے۔",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUl8sNjlvktA5XILdFZhIV7ddHdgjhJTJOK3z4VDUBRQ&s=10",
    stock: 60,
    weight: 80
  },
  {
    id: 4,
    name_en: "Bachon Ko Hifz Kaise Karayein",
    name_ur: "بچوں کو حفظ کیسے کروائیں",
    price: 220,
    description_en: "A comprehensive guidebook for parents and educators outlining practical, time-tested methods to help children memorize the Holy Quran easily and effectively.",
    description_ur: "والدین اور اساتذہ کے لیے ایک جامع گائیڈ بک جس میں بچوں کو قرآن پاک کو آسانی اور مؤثر طریقے سے یاد کرنے میں مدد دینے کے عملی طریقے بیان کیے گئے ہیں۔",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxTDMnupNp_7Wfb-ORBe8M9B727TN_r98f9VwF9mFIFQ&s=10",
    stock: 2,
    weight: 120
  },
  {
    id: 5,
    name_en: "Noorani Urdu Qaida",
    name_ur: "نورانی اردو قاعدہ",
    price: 120,
    description_en: "A beautifully structured guide for children to learn basic Urdu letters, pronunciation, and vocabulary in a step-by-step interactive manner.",
    description_ur: "بچوں کے لیے بنیادی اردو حروف، تلفظ اور الفاظ کو مرحلہ وار انٹرایکٹو طریقے سے سیکھنے کے لیے ایک خوبصورت گائیڈ۔",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8NTKfzHLIyjKK9DCpC51frO1uB0xvpU7_jWPQ_DtI6CnUQIcdGRj_j88&s=10",
    stock: 0,
    weight: 80
  },
  {
    id: 6,
    name_en: "Deeniyat Course - Beginner Guide",
    name_ur: "دینیات کورس - مبتدی گائیڈ",
    price: 140,
    description_en: "An essential starter course book for basic Deeniyat studies, covering daily prayers, Islamic supplications, and fundamental manners.",
    description_ur: "بنیادی دینیات کے مطالعہ کے لیے ایک ضروری تعارفی کتاب، جس میں روزمرہ کی نمازیں، دعائیں اور بنیادی آداب شامل ہیں۔",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsheDpskd6NSFI-wNQkb26vFS6Epk3gb-xgBmHBf5Kq284bGzjIPOYSSk&s=10",
    stock: 80,
    weight: 100
  },
  {
    id: 7,
    name_en: "Taysirul Quran",
    name_ur: "تیسیرالقرآن - آسان اردو ترجمہ مع تشریحی فوائد",
    price: 750,
    description_en: "An easy Urdu translation of the Holy Quran with explanatory benefits, designed for beginners and general readers.",
    description_ur: "قرآن پاک کا آسان اردو ترجمہ، تشریحی فوائد کے ساتھ، جو مبتدیوں اور عام قارئین کے لیے تیار کیا گیا ہے۔",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRK_84LHfiZSUCzdVOn1mJwIQEg-jTv-dWckEO2p8MqzQ&s=10",
    stock: 20,
    weight: 600
  },
  {
    id: 8,
    name_en: "Rauzatul Atfal",
    name_ur: "روضۃ الاطفال",
    price: 90,
    description_en: "A foundational book teaching children the recitation of the Holy Quran from the very beginning, step by step.",
    description_ur: "بچوں کو قرآن پاک کی تلاوت ابتدا سے، مرحلہ وار سکھانے والی بنیادی کتاب۔",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUl8sNjlvktA5XILdFZhIV7ddHdgjhJTJOK3z4VDUBRQ&s=10",
    stock: 80,
    weight: 80
  },
  {
    id: 9,
    name_en: "Haroof-e-Tahajji Takhti",
    name_ur: "حروف تہجی تختی (جدید)",
    price: 10,
    description_en: "A modern tablet board printed with the Arabic alphabet to help young children recognize and learn the letters.",
    description_ur: "بچوں کو حروف پہچاننے اور سیکھنے میں مدد کے لیے جدید تختی جس پر عربی حروف درج ہیں۔",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8NTKfzHLIyjKK9DCpC51frO1uB0xvpU7_jWPQ_DtI6CnUQIcdGRj_j88&s=10",
    stock: 200,
    weight: 80
  },
  {
    id: 10,
    name_en: "Syllabus Of Maktab",
    name_ur: "نصاب مکتب",
    price: 100,
    description_en: "The complete syllabus guide for maktab teachers, outlining what to teach at each stage of a child's learning.",
    description_ur: "مکتب کے اساتذہ کے لیے مکمل نصاب گائیڈ، جس میں بچے کی سیکھنے کی ہر منزل پر کیا پڑھانا ہے اس کی تفصیل دی گئی ہے۔",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsheDpskd6NSFI-wNQkb26vFS6Epk3gb-xgBmHBf5Kq284bGzjIPOYSSk&s=10",
    stock: 100,
    weight: 80
  }
];

// Helper to get/set mock DB
const getMockDB = () => {
  if (typeof window === "undefined") {
    return { books: DEFAULT_BOOKS, orders: [], orderItems: [], settings: [] };
  }

  let books = localStorage.getItem("mock_books_v2");
  if (!books) {
    localStorage.setItem("mock_books_v2", JSON.stringify(DEFAULT_BOOKS));
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
    localStorage.setItem("mock_books_v2", JSON.stringify(db.books));
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
    if (isRealSupabaseConfigured && supabase) {
      const updates: Partial<Order> = { status };
      if (paymentConfirmed !== undefined) updates.payment_confirmed = paymentConfirmed;
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
