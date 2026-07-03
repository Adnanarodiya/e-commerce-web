"use client";

import BookImage from "@/components/ui/BookImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/supabase";
import { Product } from "@/types/product";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RelatedProductsProps {
  product: Product;
}

export default function RelatedProducts({ product }: RelatedProductsProps) {
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      const books = await db.getBooks();
      setRelated(
        books
          .filter((b) => b.id !== product.id)
          .slice(0, 4)
          .map((b) => ({
            id: b.id,
            name: b.name_en,
            price: Number(b.price),
            image: b.image,
            description: b.description_en,
            weight: b.weight,
          }))
      );
    }
    load();
  }, [product.id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">Related Products</h2>
        <Button variant="ghost" asChild>
          <Link href="/" className="text-primary hover:text-primary/80">
            View All
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {related.map((relatedProduct) => (
          <Card
            key={relatedProduct.id}
            className="group overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <Link href={`/product/${relatedProduct.id}`}>
              <div className="relative aspect-square overflow-hidden bg-muted/30">
                <BookImage
                  src={relatedProduct.image}
                  alt={relatedProduct.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground line-clamp-1 mb-2">
                  {relatedProduct.name}
                </h3>
                <p className="text-lg font-bold text-primary">
                  ₹{relatedProduct.price.toFixed(2)}
                </p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}