"use client";

import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/supabase";
import { BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";

const PAGE_SIZE = 12;
const LOAD_MORE_DELAY_MS = 2000;

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

function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[4/5] sm:aspect-square bg-muted/40" />
      <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
        <div className="h-3 sm:h-4 bg-muted rounded-md w-4/5" />
        <div className="h-3 bg-muted rounded-md w-1/3" />
        <div className="h-8 sm:h-10 bg-muted rounded-md w-full" />
      </div>
    </div>
  );
}

function LoadingMoreIndicator() {
  const { t } = useLanguage();

  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 py-6">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-primary/15 border-t-primary animate-spin" />
        <BookOpen className="h-5 w-5 text-primary animate-pulse" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {t("loadingMore")}
      </p>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-primary/70 animate-bounce"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProductList() {
  const { t, isRtl } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const loadTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (loadTimerRef.current !== null) {
        window.clearTimeout(loadTimerRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loadingRef.current) return;

        loadingRef.current = true;
        setLoadingMore(true);

        loadTimerRef.current = window.setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, products.length));
          setLoadingMore(false);
          loadingRef.current = false;
          loadTimerRef.current = null;
        }, LOAD_MORE_DELAY_MS);
      },
      { rootMargin: "300px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, products.length, visibleCount]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-primary/15 border-t-primary animate-spin" />
          <BookOpen className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">{t("loadingMore")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

        {loadingMore && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={`skeleton-${i}`} />
            ))}
            <LoadingMoreIndicator />
          </>
        )}
      </div>

      {hasMore && visibleProducts.length > 0 && !loadingMore && (
        <div ref={sentinelRef} className="pb-8 min-h-12" aria-hidden="true" />
      )}

      {!hasMore && products.length > PAGE_SIZE && (
        <p className="text-center text-sm text-muted-foreground pb-8">
          {isRtl
            ? `${products.length} ${t("books")} — ${t("allBooksLoaded")}`
            : `${t("allBooksLoaded")} (${products.length} ${t("books")})`}
        </p>
      )}
    </div>
  );
}
