"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "ur";

export const translations = {
  en: {
    title: "Expand Your Knowledge",
    subtitle: "Discover our curated collection of educational Islamic and Urdu books for children and beginners.",
    cart: "Shopping Cart",
    cartEmpty: "Your cart is empty",
    continueShopping: "Continue Shopping",
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    discount: "Instant Discount",
    shipping: "Shipping",
    packaging: "Packaging Charges",
    total: "Total",
    proceedToCheckout: "Proceed to Checkout",
    checkout: "Checkout",
    backToCart: "Back to Cart",
    shippingDetails: "Shipping Details",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    address: "Street Address",
    city: "City",
    state: "State / Region",
    zipCode: "Zip / Postal Code",
    paymentMethod: "Select Payment Method",
    cod: "Cash on Delivery",
    codDesc: "Pay with cash when your package is delivered. No upfront payment required. We will verify your details and contact you to confirm the delivery.",
    bankTransfer: "Bank Transfer / UPI",
    scanQR: "Scan QR to Pay via UPI",
    payeeName: "Payee Name",
    upiId: "UPI ID",
    confirmPaid: "Are you sure you've paid? I confirm that I have scanned the QR code and completed the payment transfer.",
    placeOrder: "Place Order",
    processing: "Processing...",
    thankYou: "Thank you for your order!",
    orderSuccessDesc: "Your order has been placed successfully. We will verify details and contact you shortly.",
    orderId: "Order ID",
    shippingAddress: "Shipping Address",
    deliveryLabel: "Delivery",
    amountToPay: "Amount to Pay (COD)",
    amountPaid: "Amount Paid",
    noteBankTransfer: "Note regarding bank transfer: Your order will be processed once we verify receipt of your payment in our bank.",
    deliveryMethod: "How would you like your order delivered?",
    courier: "By Courier",
    post: "By Post",
    inPerson: "In Person",
    discountBanner: "🎉 Special Offer: Buy for ₹5,000 or more to get a 10% discount on Bank payments and a 15% discount on Cash payments!",
    lowStock: "Low Stock Alert",
    outOfStock: "Out of Stock",
    itemsCount: "items",
    itemCount: "item",
    free: "Free",
    qty: "Qty",
    secureSsl: "Secure SSL Checkout",
    freeReturns: "Free returns within 30 days",
    support: "24/7 customer support",
    addBook: "Add Book",
    editBook: "Edit Book",
    deleteBook: "Delete Book",
    stock: "Stock",
    price: "Price",
    description: "Description",
    name: "Name",
    roleSwitcher: "Current View",
    adminPanel: "Admin Panel",
    packerPanel: "Packer View",
    readyToPack: "Ready to Pack",
    boxPack: "Box Pack",
    printSlip: "Print Slip",
    confirmBoxPack: "Mark this order as packed and complete?",
    packedHistory: "Packed Orders",
    toPack: "To Pack",
    noPackedOrders: "No packed orders yet",
    confirmPickup: "Confirm Pickup",
    pickupConfirmed: "Pickup Confirmed",
    pickupPending: "Pickup Pending",
    pickupConfirmedAt: "Pickup confirmed at",
    packedAt: "Packed at",
    pickupDone: "Pickup done",
    confirmPickupPrompt: "Confirm that the customer has picked up this order?",
    ledger: "Ledger / Statement",
    bankStatement: "Bank Statement",
    cashStatement: "Cash Statement",
    totalEarnings: "Total Earnings",
    filterBy: "Filter By",
    day: "Day",
    month: "Month",
    year: "Year",
    reorder: "Reorder",
    updateStock: "Update Stock",
    changeQrCode: "Change UPI QR Code",
    confirmPackPrompt: "Admin will call customer at {phone} for further confirmation. Are you sure you want to send this order to the Packer?",
    confirmPackTitle: "Call Customer for Confirmation",
    cancel: "Cancel",
    confirm: "Confirm",
    slipTitle: "PACKING & SHIPPING SLIP",
    slipDesc: "Attach this slip to the packed box for delivery reference.",
    printedOn: "Printed on",
    deliveryBoyReference: "Delivery Reference",
    phone: "Phone",
    loadMore: "Load More Books",
    loadingMore: "Loading...",
    showing: "Showing",
    of: "of",
    books: "books",
    allBooksLoaded: "You've seen all our books",
    noProducts: "No products found",
    noProductsHint: "Check back soon — new titles are added regularly"
  },
  ur: {
    title: "اپنے علم میں اضافہ کریں",
    subtitle: "بچوں اور مبتدیوں کے لیے تعلیمی اسلامی اور اردو کتابوں کا ہمارا منتخب کردہ مجموعہ دریافت کریں۔",
    cart: "شاپنگ کارٹ",
    cartEmpty: "آپ کا کارٹ خالی ہے",
    continueShopping: "خریداری جاری رکھیں",
    orderSummary: "آرڈر کی تفصیلات",
    subtotal: "ذیلی رقم",
    discount: "فوری رعایت",
    shipping: "شپنگ",
    packaging: "پیکجنگ چارجز",
    total: "کل رقم",
    proceedToCheckout: "چیک آؤٹ پر جائیں",
    checkout: "چیک آؤٹ",
    backToCart: "کارٹ پر واپس جائیں",
    shippingDetails: "ترسیل کی تفصیلات",
    firstName: "پہلا نام",
    lastName: "آخری نام",
    email: "ای میل ایڈریس",
    address: "پتہ",
    city: "شہر",
    state: "صوبہ / علاقہ",
    zipCode: "زپ / پوسٹل کوڈ",
    paymentMethod: "طریقہ ادائیگی منتخب کریں",
    cod: "کیش آن ڈیلیوری",
    codDesc: "پیکیج کی ترسیل کے وقت نقد رقم ادا کریں۔ کسی پیشگی ادائیگی کی ضرورت نہیں ہے۔ ہم آپ کے فراہم کردہ پتے کی تصدیق کے لیے رابطہ کریں گے۔",
    bankTransfer: "بینک ٹرانسفر / یو پی آئی",
    scanQR: "UPI کے ذریعے ادائیگی کے لیے QR کوڈ اسکین کریں",
    payeeName: "وصول کنندہ کا نام",
    upiId: "UPI آئی ڈی",
    confirmPaid: "کیا آپ نے یقینی طور پر ادائیگی کر دی ہے؟ میں تصدیق کرتا ہوں کہ میں نے QR کوڈ اسکین کر کے ادائیگی مکمل کر لی ہے۔",
    placeOrder: "آرڈر دیں",
    processing: "پروسیسنگ ہو رہی ہے...",
    thankYou: "آرڈر دینے کا شکریہ!",
    orderSuccessDesc: "آپ کا آرڈر کامیابی کے ساتھ موصول ہو گیا ہے۔ ہم تفصیلات کی تصدیق کے بعد جلد ہی آپ سے رابطہ کریں گے۔",
    orderId: "آرڈر نمبر",
    shippingAddress: "ترسیل کا پتہ",
    deliveryLabel: "ترسیل",
    amountToPay: "قابل ادائیگی رقم (کیش)",
    amountPaid: "ادا شدہ رقم",
    noteBankTransfer: "بینک ٹرانسفر کے بارے میں نوٹ: آپ کے آرڈر پر کارروائی تب شروع ہوگی جب ہم اپنے بینک میں ادائیگی کی وصولی کی تصدیق کر لیں گے۔",
    deliveryMethod: "آپ اپنا آرڈر کیسے حاصل کرنا چاہیں گے؟",
    courier: "کورئیر کے ذریعے",
    post: "پوسٹ کے ذریعے",
    inPerson: "خود وصولی (ان پرسن)",
    discountBanner: "🎉 خصوصی پیشکش: ₹5,000 یا اس سے زیادہ کی خریداری پر بینک ادائیگی پر %10 اور کیش پر %15 کی رعایت حاصل کریں!",
    lowStock: "کم اسٹاک کا الرٹ",
    outOfStock: "اسٹاک ختم",
    itemsCount: "آئٹمز",
    itemCount: "آئٹم",
    free: "مفت",
    qty: "تعداد",
    secureSsl: "محفوظ SSL چیک آؤٹ",
    freeReturns: "30 دنوں کے اندر مفت واپسی",
    support: "24/7 کسٹمر سپورٹ",
    addBook: "نئی کتاب شامل کریں",
    editBook: "کتاب کی ترمیم کریں",
    deleteBook: "کتاب حذف کریں",
    stock: "اسٹاک",
    price: "قیمت",
    description: "تفصیل",
    name: "نام",
    roleSwitcher: "موجودہ منظر",
    adminPanel: "ایڈمن پینل",
    packerPanel: "پیکر منظر",
    readyToPack: "پیکنگ کے لیے تیار",
    boxPack: "باکس پیک کریں",
    printSlip: "سلپ پرنٹ کریں",
    confirmBoxPack: "کیا یہ آرڈر پیک ہو چکا ہے؟",
    packedHistory: "پیک شدہ آرڈرز",
    toPack: "پیکنگ باقی",
    noPackedOrders: "ابھی کوئی پیک شدہ آرڈر نہیں",
    confirmPickup: "پک اپ کی تصدیق",
    pickupConfirmed: "پک اپ ہو چکا",
    pickupPending: "پک اپ باقی",
    pickupConfirmedAt: "پک اپ کی تصدیق",
    packedAt: "پیک کی تاریخ",
    pickupDone: "پک اپ مکمل",
    confirmPickupPrompt: "کیا کسٹمر نے آرڈر وصول کر لیا ہے؟",
    ledger: "لیجر / اسٹیٹمنٹ",
    bankStatement: "بینک اسٹیٹمنٹ",
    cashStatement: "کیش اسٹیٹمنٹ",
    totalEarnings: "کل آمدنی",
    filterBy: "فلٹر کریں",
    day: "دن",
    month: "مہینہ",
    year: "سال",
    reorder: "دوبارہ آرڈر کریں",
    updateStock: "اسٹاک اپ ڈیٹ کریں",
    changeQrCode: "UPI QR کوڈ تبدیل کریں",
    confirmPackPrompt: "ایڈمن کسٹمر کو فون نمبر {phone} پر کال کر کے مزید تصدیق کرے گا۔ کیا آپ واقعی یہ آرڈر پیکر کو بھیجنا چاہتے ہیں؟",
    confirmPackTitle: "تصدیق کے لیے کسٹمر کو کال کریں",
    cancel: "منسوخ کریں",
    confirm: "تصدیق کریں",
    slipTitle: "پیکنگ اور شپنگ سلپ",
    slipDesc: "ڈیلیوری کے حوالے کے لیے اس پرچی کو پیک شدہ ڈبے کے ساتھ چسپاں کریں۔",
    printedOn: "پرنٹ کی تاریخ",
    deliveryBoyReference: "ڈیلیوری کا حوالہ",
    phone: "فون",
    loadMore: "مزید کتابیں دیکھیں",
    loadingMore: "لوڈ ہو رہا ہے...",
    showing: "دکھایا جا رہا ہے",
    of: "میں سے",
    books: "کتابیں",
    allBooksLoaded: "آپ نے تمام کتابیں دیکھ لی ہیں",
    noProducts: "کوئی مصنوعات نہیں ملیں",
    noProductsHint: "جلد دوبارہ چیک کریں — نئی کتابیں شامل کی جاتی ہیں"
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  isRtl: boolean;
  userRole: "customer" | "admin" | "packer";
  setUserRole: (role: "customer" | "admin" | "packer") => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [userRole, setUserRoleState] = useState<"customer" | "admin" | "packer">("customer");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang === "en" || savedLang === "ur") {
      setLanguageState(savedLang);
    }
    const savedRole = localStorage.getItem("userRole") as "customer" | "admin" | "packer";
    if (savedRole) {
      setUserRoleState(savedRole);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const setUserRole = (role: "customer" | "admin" | "packer") => {
    setUserRoleState(role);
    localStorage.setItem("userRole", role);
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || String(key);
  };

  const isRtl = language === "ur";

  // Side effect to update body direction
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  }, [language, isRtl]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl, userRole, setUserRole }}>
      <div dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "font-sans rtl" : "font-sans"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
