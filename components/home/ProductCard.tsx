"use client";

import BookImage from "@/components/ui/BookImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Check, Eye, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Product {
  id: number;
  image: string;
  name: string;
  name_en?: string;
  name_ur?: string;
  price: number;
  stock?: number;
  weight?: number;
  category?: string;
  is_quran?: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { language, t, isRtl } = useLanguage();
  const { addToCart } = useCart();

  const displayName =
    language === "ur" ? product.name_ur || product.name : product.name_en || product.name;
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    addToCart({
      id: product.id,
      name: displayName,
      price: product.price,
      image: product.image,
      quantity: 1,
      weight: product.weight ?? 80,
      is_quran: product.is_quran ?? false,
    });

    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <Card className="group overflow-hidden bg-card border-border hover:shadow-md sm:hover:shadow-lg hover:border-primary/20 transition-all duration-200 h-full flex flex-col rounded-lg">
      <div className="relative overflow-hidden">
        {isOutOfStock && (
          <div className="absolute top-1.5 left-1.5 z-20 bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded text-[9px] sm:text-xs font-bold">
            {t("outOfStock")}
          </div>
        )}

        <Link href={`/product/${product.id}`} className="block relative">
          <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden bg-muted/30">
            <BookImage
              src={product.image}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 45vw, 25vw"
              className="object-contain"
              containerClassName="rounded-none"
            />
          </div>

          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
              <Eye className={`h-3.5 w-3.5 ${isRtl ? "ml-1.5" : "mr-1.5"}`} />
              {isRtl ? "دیکھیں" : "View"}
            </Button>
          </div>
        </Link>
      </div>

      <CardContent className="p-2 sm:p-4 flex flex-col flex-1 gap-1.5 sm:gap-3">
        <Link href={`/product/${product.id}`} className="flex-1">
          <h2
            className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors text-[11px] sm:text-sm leading-tight"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            {displayName}
          </h2>
        </Link>

        <div
          className={`flex items-center flex-wrap gap-1 ${isRtl ? "justify-end" : "justify-start"}`}
        >
          <span className="text-sm sm:text-lg font-bold text-foreground">
            ₹{product.price.toFixed(0)}
          </span>
          {product.weight !== undefined && (
            <span className="text-[9px] sm:text-xs text-muted-foreground font-medium bg-muted/60 px-1.5 py-0.5 rounded">
              {product.weight}g
            </span>
          )}
        </div>

        <Button
          size="sm"
          className={cn(
            "w-full transition-all duration-200 h-8 sm:h-10 text-[10px] sm:text-sm px-2",
            isOutOfStock
              ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
              : justAdded
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
        >
          {isAdding ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : justAdded ? (
            <Check className="h-3.5 w-3.5" />
          ) : isOutOfStock ? (
            <span className="truncate">{t("outOfStock")}</span>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate ml-1">
                {isRtl ? "کارٹ" : "Add"}
              </span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}