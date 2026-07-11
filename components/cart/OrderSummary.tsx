"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { CreditCard, Heart, Shield, Truck, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import PincodeField from "@/components/checkout/PincodeField";
import { DISCOUNT_MIN_SUBTOTAL } from "@/lib/discounts";
import { touchChoice } from "@/lib/touch-target";

export default function OrderSummary() {
  const {
    cart,
    subtotal,
    discount,
    quranDiscount,
    percentageDiscount,
    total,
    deliveryType,
    setDeliveryType,
    paymentType,
    setPaymentType,
    deliveryPincode,
    setDeliveryPincode,
    pincodeStatus,
    pincodeInfo,
  } = useCart();
  const { t, isRtl } = useLanguage();

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const dirStyle = { direction: isRtl ? ("rtl" as const) : ("ltr" as const) };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-start" style={dirStyle}>
          {t("orderSummary")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-start" style={dirStyle}>
        {/* Delivery Method Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {t("deliveryMethod")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryType("courier")}
              className={`flex flex-col items-center justify-center rounded-lg border-2 text-center text-xs font-semibold gap-1 transition-all ${touchChoice} p-2 sm:p-2 ${
                deliveryType === "courier"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-gray-300 text-muted-foreground bg-background"
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>{t("courier")}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("post")}
              className={`flex flex-col items-center justify-center rounded-lg border-2 text-center text-xs font-semibold gap-1 transition-all ${touchChoice} p-2 sm:p-2 ${
                deliveryType === "post"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-gray-300 text-muted-foreground bg-background"
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>{t("post")}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("in_person")}
              className={`flex flex-col items-center justify-center rounded-lg border-2 text-center text-xs font-semibold gap-1 transition-all ${touchChoice} p-2 sm:p-2 ${
                deliveryType === "in_person"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-gray-300 text-muted-foreground bg-background"
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>{t("inPerson")}</span>
            </button>
          </div>
        </div>

        {deliveryType !== "in_person" && (
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              {t("shippingRatesTitle")}
            </label>
            <PincodeField
              value={deliveryPincode}
              onChange={setDeliveryPincode}
              status={pincodeStatus}
              state={pincodeInfo?.state}
              district={pincodeInfo?.district}
              isGujarat={pincodeInfo?.isGujarat}
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t("pincodeCallNotice")}
            </p>
          </div>
        )}

        {/* Payment Method */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {t("paymentMethod")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType("cash")}
              className={`rounded-lg border-2 text-center text-xs font-semibold transition-all ${touchChoice} px-3 ${
                paymentType === "cash"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-gray-300 text-muted-foreground bg-background"
              }`}
            >
              {t("cod")}
            </button>
            <button
              type="button"
              onClick={() => setPaymentType("bank")}
              className={`rounded-lg border-2 text-center text-xs font-semibold transition-all ${touchChoice} px-3 ${
                paymentType === "bank"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-gray-300 text-muted-foreground bg-background"
              }`}
            >
              {t("bankTransfer")}
            </button>
          </div>
        </div>

        <Separator />

        {/* Calculations */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("subtotal")} ({itemCount} {itemCount === 1 ? t("itemCount") : t("itemsCount")})
            </span>
            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
          </div>

          {quranDiscount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 font-semibold">
              <span>Quran discount (₹25/copy)</span>
              <span>-₹{quranDiscount.toFixed(2)}</span>
            </div>
          )}
          {percentageDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-semibold">
              <span>10% {t("discount")} (books)</span>
              <span>-₹{percentageDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
            <p>{t("shippingCallNotice")}</p>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-lg font-semibold">{t("total")}</span>
            <span className="text-lg font-bold text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {subtotal < DISCOUNT_MIN_SUBTOTAL && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 leading-relaxed">
            <p>
              {isRtl
                ? `₹5,000 یا اس سے زیادہ کی خریداری پر %10 اور قرآن پر ₹25/نقل کی رعایت — مزید ₹${(DISCOUNT_MIN_SUBTOTAL - subtotal).toFixed(2)} شامل کریں`
                : `10% off books + ₹25/copy on Quran when you spend ₹${DISCOUNT_MIN_SUBTOTAL.toLocaleString()}+ — add ₹${(DISCOUNT_MIN_SUBTOTAL - subtotal).toFixed(2)} more`}
            </p>
          </div>
        )}

        <Button
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          asChild
        >
          <Link href="/checkout" className={`flex items-center justify-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <CreditCard className="h-4 w-4" />
            <span>{t("proceedToCheckout")}</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
