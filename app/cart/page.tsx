"use client";

import CartItemList from "@/components/cart/CartItemList";
import EmptyCart from "@/components/cart/EmptyCart";
import OrderSummary from "@/components/cart/OrderSummary";
import Recommendations from "@/components/cart/Recommendations";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, Gift } from "lucide-react";
import Link from "next/link";

export default function Cart() {
  const { cart } = useCart();
  const { t, isRtl } = useLanguage();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Bilingual Discount Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 via-secondary to-primary/10 border border-primary/20 rounded-xl flex items-start gap-3 shadow-sm">
        <Gift className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-foreground text-start" style={{ direction: isRtl ? "rtl" : "ltr" }}>
          <p className="font-semibold text-primary leading-relaxed">
            {t("discountBanner")}
          </p>
        </div>
      </div>

      <div className={`flex flex-col md:flex-row items-center justify-between mb-8 gap-4 ${isRtl ? "md:flex-row-reverse" : ""}`}>
        <div className="text-start" style={{ direction: isRtl ? "rtl" : "ltr" }}>
          <h1 className="text-3xl font-bold text-foreground">{t("cart")}</h1>
          <p className="text-muted-foreground mt-2">
            {itemCount} {itemCount === 1 ? t("itemCount") : t("itemsCount")}
          </p>
        </div>

        <Button
          variant="ghost"
          asChild
          className="text-muted-foreground hover:text-foreground"
        >
          <Link href="/" className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <ArrowLeft className="h-4 w-4" />
            <span>{t("continueShopping")}</span>
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <CartItemList />
        </div>

        <div className="lg:col-span-1">
          <OrderSummary />
        </div>
      </div>

      <Recommendations />
    </div>
  );
}
