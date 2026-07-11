"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { CreditCard, Truck, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import PincodeField from "@/components/checkout/PincodeField";
import { DISCOUNT_MIN_SUBTOTAL } from "@/lib/discounts";
import { touchChoice } from "@/lib/touch-target";

function SummaryRow({
  label,
  value,
  valueClassName = "font-medium tabular-nums shrink-0",
  labelClassName = "text-muted-foreground min-w-0 break-words",
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-3 text-sm min-w-0">
      <span className={labelClassName}>{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

export default function OrderSummary() {
  const {
    cart,
    subtotal,
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
    <Card className="min-w-0 overflow-hidden lg:sticky lg:top-4">
      <CardHeader className="p-4 sm:p-6 pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold text-start" style={dirStyle}>
          {t("orderSummary")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-start p-4 sm:p-6 pt-0 min-w-0" style={dirStyle}>
        <div className="space-y-2 min-w-0">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {t("deliveryMethod")}
          </label>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setDeliveryType("courier")}
              className={`flex flex-col items-center justify-center rounded-lg border-2 text-center text-[10px] sm:text-xs font-semibold gap-1 transition-all leading-tight ${touchChoice} p-2 min-w-0 ${
                deliveryType === "courier"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-gray-300 text-muted-foreground bg-background"
              }`}
            >
              <Truck className="h-4 w-4 shrink-0" />
              <span className="break-words">{t("courier")}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("post")}
              className={`flex flex-col items-center justify-center rounded-lg border-2 text-center text-[10px] sm:text-xs font-semibold gap-1 transition-all leading-tight ${touchChoice} p-2 min-w-0 ${
                deliveryType === "post"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-gray-300 text-muted-foreground bg-background"
              }`}
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span className="break-words">{t("post")}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("in_person")}
              className={`flex flex-col items-center justify-center rounded-lg border-2 text-center text-[10px] sm:text-xs font-semibold gap-1 transition-all leading-tight ${touchChoice} p-2 min-w-0 ${
                deliveryType === "in_person"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-gray-300 text-muted-foreground bg-background"
              }`}
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="break-words">{t("inPerson")}</span>
            </button>
          </div>
        </div>

        {deliveryType !== "in_person" && (
          <div className="space-y-2 pt-2 border-t border-border min-w-0">
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
            <p className="text-[11px] text-muted-foreground leading-relaxed break-words">
              {t("pincodeCallNotice")}
            </p>
          </div>
        )}

        <div className="space-y-2 pt-2 min-w-0">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {t("paymentMethod")}
          </label>
          <div className="grid grid-cols-2 gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setPaymentType("cash")}
              className={`rounded-lg border-2 text-center text-xs font-semibold transition-all ${touchChoice} px-2 sm:px-3 min-w-0 break-words ${
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
              className={`rounded-lg border-2 text-center text-xs font-semibold transition-all ${touchChoice} px-2 sm:px-3 min-w-0 break-words ${
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

        <div className="space-y-3 min-w-0">
          <SummaryRow
            label={
              <>
                {t("subtotal")} ({itemCount}{" "}
                {itemCount === 1 ? t("itemCount") : t("itemsCount")})
              </>
            }
            value={`₹${subtotal.toFixed(2)}`}
          />

          {quranDiscount > 0 && (
            <SummaryRow
              label="Quran discount (₹25/copy)"
              value={`-₹${quranDiscount.toFixed(2)}`}
              labelClassName="text-emerald-600 font-semibold min-w-0 break-words"
              valueClassName="text-emerald-600 font-semibold tabular-nums shrink-0"
            />
          )}
          {percentageDiscount > 0 && (
            <SummaryRow
              label={`10% ${t("discount")} (books)`}
              value={`-₹${percentageDiscount.toFixed(2)}`}
              labelClassName="text-green-600 font-semibold min-w-0 break-words"
              valueClassName="text-green-600 font-semibold tabular-nums shrink-0"
            />
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed break-words">
            <p>{t("shippingCallNotice")}</p>
          </div>

          <Separator />

          <div className="flex justify-between items-center gap-3 min-w-0">
            <span className="text-base sm:text-lg font-semibold">{t("total")}</span>
            <span className="text-base sm:text-lg font-bold text-primary tabular-nums shrink-0">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>

        {subtotal < DISCOUNT_MIN_SUBTOTAL && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 leading-relaxed break-words">
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
          <Link
            href="/checkout"
            className={`flex items-center justify-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}
          >
            <CreditCard className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("proceedToCheckout")}</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
