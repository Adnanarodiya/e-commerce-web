"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Trash2 } from "lucide-react";
import CartItem from "./CartItem";

export default function CartItemList() {
  const { cart, clearCart } = useCart();
  const { t, isRtl } = useLanguage();

  return (
    <Card className="text-start min-w-0 overflow-hidden" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <CardHeader className={`flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 p-4 sm:p-6 pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
        <CardTitle className="text-base sm:text-lg font-semibold min-w-0">
          {isRtl ? "شاپنگ کارٹ کی تفصیل" : "Cart Items"}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className={`text-muted-foreground hover:text-destructive shrink-0 ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <Trash2 className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
          {isRtl ? "سب صاف کریں" : "Clear All"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:p-6 pt-0 min-w-0">
        {cart.map((item, index) => (
          <CartItem
            key={`${item.id}-${index}`}
            item={item}
            isLast={index === cart.length - 1}
          />
        ))}
      </CardContent>
    </Card>
  );
}
