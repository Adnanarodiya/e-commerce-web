"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ProductCard from "./ProductCard";

const PAGE_SIZE = 12;

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

export default function ProductList() {
  const { t, isRtl } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const books = await db.getBooks();
        const mapped: Product[] = books.map((b) => ({
          id: b.id,
          name: b.name_en,
          name_en: b.name_en,
          name_ur: b.name_ur,
          price: Number(b.price),
          stock: b.stock,
          weight: b.weight,
          image: b.image,
          is_quran: b.is_quran ?? false,
        }));
        setProducts(mapped);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    // Brief delay so the loading state is visible on fast connections
    requestAnimationFrame(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, products.length));
      setLoadingMore(false);
    });
  }, [hasMore, loadingMore, products.length]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto px-1 sm:px-0">
        {visibleProducts.length > 0 ? (
          visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t("noProducts")}
            </h3>
            <p className="text-muted-foreground mb-4">{t("noProductsHint")}</p>
          </div>
        )}
      </div>

      {hasMore && visibleProducts.length > 0 && (
        <div className="flex flex-col items-center gap-3 pb-4">
          <p className="text-sm text-muted-foreground">
            {isRtl
              ? `${visibleCount} میں سے ${products.length} ${t("books")}`
              : `${t("showing")} ${visibleCount} ${t("of")} ${products.length} ${t("books")}`}
          </p>
          <Button
            onClick={loadMore}
            disabled={loadingMore}
            size="lg"
            className="min-w-[200px] rounded-lg"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loadingMore")}
              </>
            ) : (
              t("loadMore")
            )}
          </Button>
        </div>
      )}

      {!hasMore && products.length > PAGE_SIZE && (
        <p className="text-center text-sm text-muted-foreground pb-4">
          {t("allBooksLoaded")}
        </p>
      )}
    </div>
  );
}
