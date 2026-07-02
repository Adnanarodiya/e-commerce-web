"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Check, Eye, Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
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
}

export default function ProductCard({ product }: { product: Product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { language, t, isRtl } = useLanguage();

  const { addToCart } = useCart();

  const displayName = language === "ur" ? (product.name_ur || product.name) : (product.name_en || product.name);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    setIsAdding(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    addToCart({
      id: product.id,
      name: displayName,
      price: product.price,
      image: product.image,
      quantity: 1,
      weight: product.weight ?? 80,
    });

    setIsAdding(false);
    setJustAdded(true);

    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <Card className="group overflow-hidden bg-card border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden">
        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute top-3 left-3 z-20 bg-destructive text-destructive-foreground px-2 py-0.5 rounded text-xs font-bold">
            {t("outOfStock")}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          name="Like Button"
          className={cn(
            "absolute top-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/80 backdrop-blur-sm hover:bg-background",
            isRtl ? "left-3" : "right-3",
            isLiked && "opacity-100 text-destructive"
          )}
          onClick={handleToggleLike}
        >
          <Heart
            name="Like Icon"
            className={cn("h-4 w-4", isLiked && "fill-current")}
          />
        </Button>

        <Link href={`/product/${product.id}`} className="block relative">
          <div className="aspect-square overflow-hidden bg-muted/30 flex items-center justify-center p-3">
            {!imageError ? (
              <Image
                src={product.image}
                alt={displayName}
                width={400}
                height={400}
                className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-105 shadow-sm rounded"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-muted-foreground text-sm">
                  Image not available
                </div>
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Eye className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {isRtl ? "تفصیل دیکھیں" : "Quick View"}
            </Button>
          </div>
        </Link>
      </div>

      <CardContent className="p-4 space-y-3">
        <Link href={`/product/${product.id}`}>
          <h2 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors text-right" style={{ direction: isRtl ? "rtl" : "ltr" }}>
            {displayName}
          </h2>
        </Link>

        <div className={`flex items-center ${isRtl ? "justify-end" : "justify-start"} gap-2`}>
          <span className="text-lg font-bold text-foreground">
            ₹{product.price.toFixed(2)}
          </span>
          {product.weight !== undefined && (
            <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded">
              {product.weight}g
            </span>
          )}
        </div>

        <Button
          className={cn(
            "w-full transition-all duration-300",
            isOutOfStock
              ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
              : justAdded
              ? "bg-green-600 text-white hover:bg-green-600"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
        >
          {isAdding ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t("processing")}
            </div>
          ) : justAdded ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              {isRtl ? "کارٹ میں شامل ہو گیا!" : "Added to Cart!"}
            </div>
          ) : isOutOfStock ? (
            <div className="flex items-center gap-2">
              {t("outOfStock")}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {isRtl ? "کارٹ میں شامل کریں" : "Add to Cart"}
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
