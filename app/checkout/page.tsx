"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle, CreditCard, Shield, Truck, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Checkout() {
  const {
    cart,
    clearCart,
    subtotal,
    discount,
    packagingCharge,
    total,
    deliveryType,
    paymentType,
    setPaymentType
  } = useCart();
  const { t, isRtl } = useLanguage();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Dynamic QR Code/UPI settings from database
  const [upiSettings, setUpiSettings] = useState({
    upi_id: "9426880068@kotak",
    payee_name: "ADNAN IBADULLAH ARODIYA",
    qr_code_url: "/images/qr-code.png"
  });

  const [confirmPaid, setConfirmPaid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [stockError, setStockError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await db.getSettings();
        const loaded = { ...upiSettings };
        settings.forEach(s => {
          if (s.key === "upi_id") loaded.upi_id = s.value;
          if (s.key === "payee_name") loaded.payee_name = s.value;
          if (s.key === "qr_code_url") loaded.qr_code_url = s.value;
        });
        setUpiSettings(loaded);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData].trim()) {
        newErrors[field] = "This field is required";
      }
    });

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (paymentType === "bank" && !confirmPaid) {
      newErrors.confirmPaid = "Please confirm that you have scanned the QR code and completed the payment";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setStockError("");

    // Stock validation: prevent ordering more than available inventory
    try {
      const allBooks = await db.getBooks();
      const stockMap = new Map(allBooks.map(b => [b.id, b.stock]));
      const insufficient = cart.filter(
        (item) => item.quantity > (stockMap.get(item.id) ?? 0)
      );
      if (insufficient.length > 0) {
        const names = insufficient.map((i) => i.name).join(", ");
        setStockError(
          isRtl
            ? `درخواست کردہ تعداد اسٹاک سے زیادہ ہے: ${names}`
            : `Requested quantity exceeds available stock for: ${names}`
        );
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error("Stock check failed:", err);
    }

    // Collision-safe Order ID generation (retry until unique)
    let generatedOrderId = "";
    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = "NM-" + Math.floor(100000 + Math.random() * 900000);
      const exists = await db.orderExists(candidate);
      if (!exists) {
        generatedOrderId = candidate;
        break;
      }
    }
    if (!generatedOrderId) {
      setStockError(
        isRtl
          ? "آرڈر نمبر بنانے میں ناکام۔ براہ کرم دوبارہ کوشش کریں۔"
          : "Could not generate a unique order ID. Please try again."
      );
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      id: generatedOrderId,
      customer_name: `${formData.firstName} ${formData.lastName}`,
      customer_email: formData.email,
      customer_phone: formData.phone,
      customer_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
      delivery_type: deliveryType,
      payment_type: paymentType,
      subtotal: subtotal,
      discount: discount,
      packaging_charge: packagingCharge,
      total: total,
      status: "pending",
      payment_confirmed: paymentType === "bank" ? confirmPaid : false,
      created_at: new Date().toISOString()
    };

    const itemsData = cart.map(item => ({
      order_id: generatedOrderId,
      book_id: item.id,
      book_name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    try {
      const success = await db.insertOrder(orderData, itemsData);
      if (success) {
        setOrderId(generatedOrderId);
        setIsSuccess(true);
        clearCart();
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error placing order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-20 w-20 text-green-500 animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {t("thankYou")}
        </h1>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          {t("orderSuccessDesc")}
        </p>
        <div className="bg-muted/50 p-6 rounded-xl border border-border mb-8 text-left space-y-3" style={{ direction: "ltr" }}>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("orderId")}:</span>
            <span className="font-semibold text-foreground">{orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("paymentMethod")}:</span>
            <span className="font-semibold text-foreground">
              {paymentType === "cash" ? t("cod") : t("bankTransfer")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("shippingAddress")}:</span>
            <span className="font-medium text-foreground text-right">
              {formData.firstName} {formData.lastName}<br />
              {formData.address}<br />
              {formData.city}, {formData.state} {formData.zipCode}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border/60 text-sm sm:text-base">
            <span className="text-muted-foreground font-medium">
              {paymentType === "cash" ? t("amountToPay") + ":" : t("amountPaid") + ":"}
            </span>
            <span className="font-bold text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>
        
        {paymentType === "bank" && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs sm:text-sm text-amber-800" style={{ direction: isRtl ? "rtl" : "ltr" }}>
            <p className="font-semibold mb-1">{isRtl ? "بینک ٹرانسفر کے بارے میں نوٹ:" : "Note regarding bank transfer:"}</p>
            <p>
              {isRtl 
                ? `آپ کے آرڈر پر تب کارروائی کی جائے گی جب ہم تصدیق کر لیں گے کہ آپ کی ادائیگی (کل: ₹${total.toFixed(2)}) ہمارے بینک میں موصول ہو گئی ہے۔ ہم جلد ہی تصدیق کے لیے آپ سے رابطہ کریں گے۔`
                : `Your order will be processed once we verify the receipt of your payment (total: ₹${total.toFixed(2)}) in our bank. We will contact you shortly to confirm.`}
            </p>
          </div>
        )}

        <Button size="lg" className="w-full bg-primary text-primary-foreground" asChild>
          <Link href="/">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">{t("cartEmpty")}</h1>
        <Button asChild>
          <Link href="/">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className={`mb-8 flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className={isRtl ? "text-right" : "text-left"}>
          <h1 className="text-3xl font-bold text-foreground">{t("checkout")}</h1>
        </div>
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/cart" className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <ArrowLeft className="h-4 w-4" />
            <span>{t("backToCart")}</span>
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Forms (Shipping & Payment) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={`text-lg font-semibold ${isRtl ? "text-right" : "text-left"}`}>{t("shippingDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" style={{ direction: isRtl ? "rtl" : "ltr" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-start">
                    {t("firstName")}
                  </label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive text-start">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-start">
                    {t("lastName")}
                  </label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive text-start">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-start">
                    {t("email")}
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive text-start">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-start">
                    {isRtl ? "موبائل / فون نمبر" : "Phone / Mobile Number"}
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 94268XXXXX"
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive text-start">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-right">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-start">
                  {t("address")}
                </label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St, Apt 4B"
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && (
                  <p className="text-xs text-destructive text-start">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-start">
                    {t("city")}
                  </label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Mumbai"
                    className={errors.city ? "border-destructive" : ""}
                  />
                  {errors.city && (
                    <p className="text-xs text-destructive text-start">{errors.city}</p>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-start">
                    {t("state")}
                  </label>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Maharashtra"
                    className={errors.state ? "border-destructive" : ""}
                  />
                  {errors.state && (
                    <p className="text-xs text-destructive text-start">{errors.state}</p>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-start">
                    {t("zipCode")}
                  </label>
                  <Input
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="400001"
                    className={errors.zipCode ? "border-destructive" : ""}
                  />
                  {errors.zipCode && (
                    <p className="text-xs text-destructive text-start">{errors.zipCode}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${isRtl ? "flex-row-reverse justify-start" : ""}`}>
                <CreditCard className="h-5 w-5 text-primary" />
                <span>{t("paymentMethod")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentType("cash")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center transition-all duration-200 gap-2 cursor-pointer",
                    paymentType === "cash"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-gray-300 bg-background text-muted-foreground"
                  )}
                >
                  <Truck className="h-6 w-6" />
                  <span className="font-semibold text-sm">{t("cod")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("bank")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center transition-all duration-200 gap-2 cursor-pointer",
                    paymentType === "bank"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-gray-300 bg-background text-muted-foreground"
                  )}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="font-semibold text-sm">{t("bankTransfer")}</span>
                </button>
              </div>

              {paymentType === "cash" ? (
                <div className="p-4 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in duration-200 text-right" style={{ direction: isRtl ? "rtl" : "ltr" }}>
                  <p className="font-medium text-foreground mb-1">{t("cod")}</p>
                  <p>{t("codDesc")}</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-col items-center">
                    <p className="font-semibold text-foreground text-sm sm:text-base text-center mb-3">{t("scanQR")}</p>
                    <div className="relative w-full max-w-[280px] bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden p-3 flex flex-col items-center">
                      <Image
                        src={upiSettings.qr_code_url}
                        alt="UPI QR Code"
                        width={240}
                        height={240}
                        className="object-contain w-full h-auto rounded-lg"
                      />
                    </div>
                    <div className="mt-4 text-center space-y-1" style={{ direction: "ltr" }}>
                      <p className="text-sm font-bold text-foreground">
                        {t("upiId")}: <span className="text-primary select-all">{upiSettings.upi_id}</span>
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {t("payeeName")}: {upiSettings.payee_name}
                      </p>
                      <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full inline-block mt-2">
                        {isRtl ? "ادائیگی کی تفصیل میں اپنا نام یا آرڈر نمبر لکھیں" : "Add Order ID or your name in the payment description note"}
                      </p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-start gap-3 p-3 border rounded-xl transition-all",
                    isRtl ? "flex-row-reverse text-right" : "text-left",
                    confirmPaid ? "bg-primary/5 border-primary/20" : "bg-background border-border"
                  )}>
                    <input
                      type="checkbox"
                      id="confirmPaid"
                      checked={confirmPaid}
                      onChange={(e) => {
                        setConfirmPaid(e.target.checked);
                        if (errors.confirmPaid) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.confirmPaid;
                            return next;
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                    />
                    <label htmlFor="confirmPaid" className="text-xs sm:text-sm font-medium text-foreground leading-normal cursor-pointer select-none">
                      {t("confirmPaid")}
                    </label>
                  </div>
                  {errors.confirmPaid && (
                    <p className={`text-xs text-destructive font-medium ${isRtl ? "text-right" : "text-left"}`}>{errors.confirmPaid}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={`text-lg font-semibold ${isRtl ? "text-right" : "text-left"}`}>{isRtl ? "آپ کا آرڈر" : "Your Order"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product items in checkout */}
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className={`flex gap-3 text-sm ${isRtl ? "flex-row-reverse" : ""}`}>
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className={`flex-grow min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
                      <h4 className="font-medium text-foreground truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{t("qty")}: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-foreground flex-shrink-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Cost Summary */}
              <div className="space-y-2 text-sm" style={{ direction: isRtl ? "rtl" : "ltr" }}>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("subtotal")}</span>
                  <span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold">
                    <span>{paymentType === "bank" ? "10%" : "15%"} {t("discount")}</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("packaging")} ({deliveryType === "in_person" ? t("inPerson") : deliveryType === "post" ? t("post") : t("courier")})</span>
                  <span className="font-medium text-foreground">
                    {packagingCharge === 0 ? t("free") : `₹${packagingCharge.toFixed(2)}`}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>{t("total")}</span>
                  <span className="font-bold text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {stockError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-xs sm:text-sm text-destructive font-medium" style={{ direction: isRtl ? "rtl" : "ltr" }}>
                  {stockError}
                </div>
              )}

              {/* Order Submission Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t("processing")}
                  </div>
                ) : (
                  `${t("placeOrder")} (₹${total.toFixed(2)})`
                )}
              </Button>

              <div className="space-y-2 pt-4 border-t border-border text-xs text-muted-foreground" style={{ direction: isRtl ? "rtl" : "ltr" }}>
                <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <Shield className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  <span>{t("secureSsl")}</span>
                </div>
                <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <Truck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span>{isRtl ? "فوری تعمیل اور باقاعدہ ترسیل" : "Prompt fulfillment & tracked delivery"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
