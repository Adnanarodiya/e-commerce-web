"use client";

import Features from "@/components/product/Features";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductNotFound from "@/components/product/ProductNotFound";
import RelatedProducts from "@/components/product/RelatedProducts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/supabase";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import {
  Check,
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Star,
} from "lucide-react";
import BookImage from "@/components/ui/BookImage";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function parseQuantityInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10);
}

interface Book {
  id: number;
  name_en: string;
  name_ur: string;
  price: number;
  description_en: string;
  description_ur: string;
  image: string;
  stock: number;
  weight: number;
}

export default function Product() {
  const { addToCart } = useCart();
  const { language, isRtl } = useLanguage();
  const { productId } = useParams();
  const router = useRouter();
  const [quantityInput, setQuantityInput] = useState("1");
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBook() {
      setLoading(true);
      try {
        const found = await db.getBook(parseInt(productId as string));
        setBook(found as Book | null);
      } catch (err) {
        console.error("Failed to load book:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return <ProductNotFound />;
  }

  const displayName =
    language === "ur" ? book.name_ur || book.name_en : book.name_en;
  const displayDescription =
    language === "ur"
      ? book.description_ur || book.description_en
      : book.description_en;
  const isOutOfStock = book.stock <= 0;
  const parsedQuantity = parseQuantityInput(quantityInput);
  const exceedsStock =
    !isOutOfStock && parsedQuantity > book.stock;
  const canAddToCart =
    !isOutOfStock && parsedQuantity >= 1 && !exceedsStock;

  const digitCount = Math.max(1, quantityInput.length);
  const maxDigitSlots = Math.max(5, String(book.stock).length);
  const quantityInputWidth = `calc(${Math.min(digitCount, maxDigitSlots)}ch + 1.75rem)`;
  const quantityInputMaxWidth = `calc(${maxDigitSlots}ch + 1.75rem)`;

  const setQuantityValue = (value: number) => {
    const next = Math.max(1, value);
    const capped = isOutOfStock ? next : Math.min(next, book.stock);
    setQuantityInput(String(capped));
  };

  const handleQuantityInputChange = (value: string) => {
    setQuantityInput(value.replace(/\D/g, ""));
  };

  const handleQuantityBlur = () => {
    if (parsedQuantity < 1) {
      setQuantityInput("1");
    }
  };

  const handleAddToCart = async () => {
    if (!canAddToCart) return;
    const quantity = parsedQuantity;
    setIsAdding(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    addToCart({
      id: book.id,
      name: displayName,
      price: Number(book.price),
      image: book.image,
      quantity,
      weight: book.weight ?? 80,
    });

    setIsAdding(false);
    setJustAdded(true);

    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!canAddToCart) return;
    handleAddToCart();
    setTimeout(() => router.push("/cart"), 500);
  };

  const handleQuantityChange = (type: "increment" | "decrement") => {
    const current = Math.max(1, parsedQuantity || 1);
    if (type === "increment") {
      if (!isOutOfStock && current >= book.stock) return;
      setQuantityValue(current + 1);
    } else if (current > 1) {
      setQuantityValue(current - 1);
    }
  };

  const relatedProduct: Product = {
    id: book.id,
    name: book.name_en,
    price: Number(book.price),
    image: book.image,
    description: book.description_en,
    weight: book.weight,
  };

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <ProductBreadcrumb />

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-12 mb-8 sm:mb-16">
        <div className="space-y-4">
          <div className="w-full max-w-[500px] mx-auto flex flex-col items-center px-4">
            <div className="relative rounded-xl shadow-md overflow-hidden mb-4 w-full bg-muted/20 border border-border aspect-[3/4]">
              <BookImage
                src={book.image}
                alt={displayName}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 500px"
                className="object-contain rounded shadow-lg"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6" style={{ direction: isRtl ? "rtl" : "ltr" }}>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 leading-snug">
            {displayName}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              (4.8) • 127 reviews
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-bold text-foreground">
              ₹{Number(book.price).toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded">
              {book.weight ?? 80}g
            </span>
            {isOutOfStock ? (
              <span className="text-xs font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                {isRtl ? "اسٹاک ختم" : "Out of Stock"}
              </span>
            ) : (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                {isRtl ? `اسٹاک: ${book.stock}` : `Stock: ${book.stock}`}
              </span>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {displayDescription}
          </p>

          <Separator />

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {isRtl ? "تعداد" : "Quantity"}
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "inline-flex items-center border rounded-lg",
                      exceedsStock
                        ? "border-destructive"
                        : "border-border"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange("decrement")}
                      disabled={parsedQuantity <= 1}
                      className="shrink-0 rounded-r-none"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantityInput}
                      onChange={(e) => handleQuantityInputChange(e.target.value)}
                      onBlur={handleQuantityBlur}
                      aria-label={isRtl ? "تعداد" : "Quantity"}
                      aria-invalid={exceedsStock}
                      className="min-h-[36px] sm:h-10 shrink-0 border-0 bg-transparent px-2 text-center text-base font-medium tabular-nums outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      style={{
                        width: quantityInputWidth,
                        minWidth: "calc(2ch + 1.75rem)",
                        maxWidth: quantityInputMaxWidth,
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange("increment")}
                      disabled={!isOutOfStock && parsedQuantity >= book.stock}
                      className="shrink-0 rounded-l-none"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {exceedsStock && (
                  <p className="text-sm text-destructive" role="alert">
                    {isRtl
                      ? `آپ ${parsedQuantity} نہیں خرید سکتے۔ صرف ${book.stock} دستیاب ہیں۔`
                      : `You cannot buy ${parsedQuantity}. Only ${book.stock} available.`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className={cn(
                  "flex-1 transition-all duration-300",
                  isOutOfStock
                    ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                    : justAdded
                    ? "bg-green-600 text-white hover:bg-green-600"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={handleAddToCart}
                disabled={isAdding || !canAddToCart}
              >
                {isAdding ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {isRtl ? "شامل ہو رہا ہے..." : "Adding..."}
                  </div>
                ) : justAdded ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {isRtl ? "کارٹ میں شامل ہو گیا!" : "Added to Cart!"}
                  </div>
                ) : isOutOfStock ? (
                  <div className="flex items-center gap-2">
                    {isRtl ? "اسٹاک ختم" : "Out of Stock"}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    {isRtl ? "کارٹ میں شامل کریں" : "Add to Cart"}
                  </div>
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleBuyNow}
                disabled={!canAddToCart}
                className="flex-1"
              >
                {isRtl ? "ابھی خریدیں" : "Buy Now"}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  isLiked && "text-destructive"
                )}
              >
                <Heart
                  className={cn("h-4 w-4 mr-2", isLiked && "fill-current")}
                />
                {isRtl ? "پسندیدہ میں شامل کریں" : "Add to Wishlist"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {isRtl ? "شیئر کریں" : "Share"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <RelatedProducts product={relatedProduct} />
    </div>
  );
}
