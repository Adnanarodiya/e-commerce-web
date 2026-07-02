"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart, DeliveryType } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { CreditCard, Heart, Shield, Truck, Package, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export default function OrderSummary() {
  const {
    cart,
    subtotal,
    discount,
    packagingCharge,
    total,
    totalWeightKg,
    deliveryType,
    setDeliveryType,
    paymentType,
    setPaymentType
  } = useCart();
  const { t, isRtl } = useLanguage();

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-right" style={{ direction: isRtl ? "rtl" : "ltr" }}>
          {t("orderSummary")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Delivery Method Selection */}
        <div className="space-y-2 text-right" style={{ direction: isRtl ? "rtl" : "ltr" }}>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {t("deliveryMethod")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryType("courier")}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 text-center text-xs font-semibold gap-1 transition-all ${
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
              className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 text-center text-xs font-semibold gap-1 transition-all ${
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
              className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 text-center text-xs font-semibold gap-1 transition-all ${
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

        {/* Payment Method Select (needed to compute correct discount) */}
        <div className="space-y-2 text-right pt-2" style={{ direction: isRtl ? "rtl" : "ltr" }}>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {t("paymentMethod")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType("cash")}
              className={`py-2 px-3 rounded-lg border-2 text-center text-xs font-semibold transition-all ${
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
              className={`py-2 px-3 rounded-lg border-2 text-center text-xs font-semibold transition-all ${
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
        <div className="space-y-3" style={{ direction: isRtl ? "rtl" : "ltr" }}>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("subtotal")} ({itemCount} {itemCount === 1 ? t("itemCount") : t("itemsCount")})
            </span>
            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-semibold">
              <span>{paymentType === "bank" ? "10%" : "15%"} {t("discount")}</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("packaging")}
              {deliveryType !== "in_person" && totalWeightKg > 0 && (
                <span className="text-[10px] text-muted-foreground/80">
                  {" "}({isRtl ? `کل وزن ${totalWeightKg.toFixed(2)} کلو` : `${totalWeightKg.toFixed(2)} kg · ₹10/kg`})
                </span>
              )}
            </span>
            <span className="font-medium">
              {packagingCharge === 0 ? (
                <Badge variant="secondary" className="text-xs">
                  {t("free")}
                </Badge>
              ) : (
                `₹${packagingCharge.toFixed(2)}`
              )}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-lg font-semibold">{t("total")}</span>
            <span className="text-lg font-bold text-primary">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Dynamic Warning Alert */}
        {subtotal < 5000 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 text-right leading-relaxed" style={{ direction: isRtl ? "rtl" : "ltr" }}>
            <p>
              {isRtl
                ? `ڈسکاؤنٹ حاصل کرنے کے لیے مزید ₹${(5000 - subtotal).toFixed(2)} کا سامان کارٹ میں شامل کریں!`
                : `Add ₹${(5000 - subtotal).toFixed(2)} more to qualify for special cash/bank discounts!`}
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

        <div className="space-y-3 pt-4 border-t border-border" style={{ direction: isRtl ? "rtl" : "ltr" }}>
          <div className={`flex items-center gap-3 text-sm text-muted-foreground ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <Shield className="h-4 w-4 text-green-500" />
            <span>{t("secureSsl")}</span>
          </div>
          <div className={`flex items-center gap-3 text-sm text-muted-foreground ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <Truck className="h-4 w-4 text-blue-500" />
            <span>{t("freeReturns")}</span>
          </div>
          <div className={`flex items-center gap-3 text-sm text-muted-foreground ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <Heart className="h-4 w-4 text-red-500" />
            <span>{t("support")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
