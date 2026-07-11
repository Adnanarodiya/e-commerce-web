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
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
        <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-primary/10 via-secondary to-primary/10 border border-primary/20 rounded-xl flex items-start gap-2.5 sm:gap-3 shadow-sm min-w-0">
          <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
          <p
            className="text-xs sm:text-sm font-semibold text-primary leading-relaxed break-words min-w-0"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            {t("discountBanner")}
          </p>
        </div>

        <div
          className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 min-w-0 ${isRtl ? "sm:flex-row-reverse" : ""}`}
        >
          <div className="min-w-0 text-start" style={{ direction: isRtl ? "rtl" : "ltr" }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("cart")}</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm">
              {itemCount} {itemCount === 1 ? t("itemCount") : t("itemsCount")}
            </p>
          </div>

          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-foreground self-start sm:self-auto shrink-0"
          >
            <Link href="/" className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span>{t("continueShopping")}</span>
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 min-w-0">
          <div className="lg:col-span-2 min-w-0 space-y-6">
            <CartItemList />
          </div>

          <div className="lg:col-span-1 min-w-0">
            <OrderSummary />
          </div>
        </div>

        <Recommendations />
      </div>
    </div>
  );
}
