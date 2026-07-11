"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Minus, Plus, Trash2 } from "lucide-react";
import BookImage from "@/components/ui/BookImage";

interface CartItemProps {
  item: {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
  };
  isLast: boolean;
}

export default function CartItem({ item, isLast }: CartItemProps) {
  const { removeFromCart, updateQuantity } = useCart();
  const { isRtl } = useLanguage();

  return (
    <div className="min-w-0">
      <div className={`flex items-start gap-3 sm:gap-4 min-w-0 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className="relative w-[72px] h-[88px] sm:w-[88px] sm:h-[100px] shrink-0 rounded-lg overflow-hidden border border-border/60">
          <BookImage
            src={item.image}
            alt={item.name}
            fill
            sizes="88px"
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className={`flex items-start gap-2 min-w-0 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div
              className="flex-1 min-w-0 text-start"
              style={{ direction: isRtl ? "rtl" : "ltr" }}
            >
              <h2 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-snug">
                {item.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                ₹{item.price.toFixed(2)} {isRtl ? "فی کتاب" : "each"}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFromCart(item.id)}
              className="text-muted-foreground hover:text-destructive shrink-0 -mt-0.5"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div
            className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-3 sm:mt-4 min-w-0 ${isRtl ? "sm:flex-row-reverse" : ""}`}
          >
            <div
              className={`inline-flex items-center border border-border rounded-lg shrink-0 ${isRtl ? "flex-row-reverse self-end sm:self-auto" : "self-start sm:self-auto"}`}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  updateQuantity(item.id, Math.max(1, item.quantity - 1))
                }
                disabled={item.quantity <= 1}
                className={isRtl ? "rounded-l-none rounded-r" : "rounded-r-none rounded-l"}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="px-3 sm:px-4 py-2 min-w-[2.5rem] text-center text-sm font-medium tabular-nums">
                {item.quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className={isRtl ? "rounded-r-none rounded-l" : "rounded-l-none rounded-r"}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <p
              className={`text-base sm:text-lg font-bold text-foreground tabular-nums shrink-0 ${isRtl ? "text-left" : "text-right sm:text-right"}`}
            >
              ₹{(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {!isLast && <Separator className="mt-4" />}
    </div>
  );
}
