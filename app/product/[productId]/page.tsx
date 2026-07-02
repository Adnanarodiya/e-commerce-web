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
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [quantity, setQuantity] = useState(1);
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

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsAdding(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: book.id,
        name: displayName,
        price: Number(book.price),
        image: book.image,
        quantity: 1,
        weight: book.weight ?? 80,
      });
    }

    setIsAdding(false);
    setJustAdded(true);

    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => router.push("/cart"), 500);
  };

  const handleQuantityChange = (type: "increment" | "decrement") => {
    if (type === "increment") {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductBreadcrumb />

      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        <div className="space-y-4">
          <div className="w-full max-w-[500px] mx-auto flex flex-col items-center px-4">
            <div className="rounded-xl shadow-md overflow-hidden mb-4 w-full bg-muted/20 border border-border flex items-center justify-center p-6 aspect-[3/4]">
              <Image
                src={book.image}
                alt={displayName}
                width={600}
                height={600}
                priority
                fetchPriority="high"
                className="rounded shadow-lg object-contain max-w-full max-h-full w-auto h-auto"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6" style={{ direction: isRtl ? "rtl" : "ltr" }}>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
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
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange("decrement")}
                    disabled={quantity <= 1}
                    className="h-10 w-10 rounded-r-none"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange("increment")}
                    className="h-10 w-10 rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
                disabled={isAdding || isOutOfStock}
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
                disabled={isOutOfStock}
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

      <Features />

      <RelatedProducts product={relatedProduct} />
    </div>
  );
}
