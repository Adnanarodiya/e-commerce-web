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
    <Card className="text-start" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
        <CardTitle className="text-lg font-semibold">
          {isRtl ? "شاپنگ کارٹ کی تفصیل" : "Cart Items"}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className={`text-muted-foreground hover:text-destructive ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <Trash2 className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
          {isRtl ? "سب صاف کریں" : "Clear All"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
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
