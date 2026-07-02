"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/supabase";
import ProductCard from "./ProductCard";

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

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const books = await db.getBooks();
        // Convert Book type to Product type expected by ProductCard
        const mapped: Product[] = books.map(b => ({
          id: b.id,
          name: b.name_en,
          name_en: b.name_en,
          name_ur: b.name_ur,
          price: Number(b.price),
          stock: b.stock,
          weight: b.weight,
          image: b.image
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

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
      {products.length > 0 ? (
        products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No products found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </div>
  );
}
