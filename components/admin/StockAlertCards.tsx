"use client";

import BookImage from "@/components/ui/BookImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, PackageX } from "lucide-react";

export interface StockBook {
  id: number;
  name_en: string;
  name_ur: string;
  image: string;
  stock: number;
}

interface StockAlertCardsProps {
  outOfStock: StockBook[];
  lowStock: StockBook[];
  reorderAmount: Record<number, number>;
  onReorderChange: (id: number, qty: number) => void;
  onAddStock: (id: number) => void;
  onViewAll: () => void;
}

function CompactStockRow({
  book,
  variant,
  reorderAmount,
  onReorderChange,
  onAddStock,
}: {
  book: StockBook;
  variant: "out" | "low";
  reorderAmount: Record<number, number>;
  onReorderChange: (id: number, qty: number) => void;
  onAddStock: (id: number) => void;
}) {
  const isOut = variant === "out";

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-white ${
        isOut ? "border-l-4 border-l-red-500 border-slate-200" : "border-l-4 border-l-amber-500 border-slate-200"
      }`}
    >
      <div className="relative w-10 h-10 shrink-0 rounded-md border border-slate-200 overflow-hidden">
        <BookImage src={book.image} alt={book.name_en} fill className="object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm text-slate-900 truncate">{book.name_en}</span>
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold ${
              isOut
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {isOut ? "Out of stock" : `${book.stock} left`}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="number"
          min={1}
          placeholder="Qty"
          className="w-20 h-8 text-sm"
          value={reorderAmount[book.id] || ""}
          onChange={(e) =>
            onReorderChange(book.id, parseInt(e.target.value, 10) || 0)
          }
        />
        <Button
          size="sm"
          className={`h-8 text-xs font-semibold ${
            isOut ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
          } text-white`}
          onClick={() => onAddStock(book.id)}
        >
          Restock
        </Button>
      </div>
    </div>
  );
}

export default function StockAlertCards({
  outOfStock,
  lowStock,
  reorderAmount,
  onReorderChange,
  onAddStock,
  onViewAll,
}: StockAlertCardsProps) {
  if (outOfStock.length === 0 && lowStock.length === 0) return null;

  return (
    <Card className="rounded-xl border border-slate-200 shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Stock needs attention
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {outOfStock.length} out of stock · {lowStock.length} running low
            </p>
          </div>
          <Button variant="outline" size="sm" className="font-semibold shrink-0" onClick={onViewAll}>
            Manage stock
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {outOfStock.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-red-600 flex items-center gap-1.5">
                <PackageX className="h-3.5 w-3.5" />
                Out of stock ({outOfStock.length})
              </p>
              <div className="space-y-2">
                {outOfStock.slice(0, 4).map((book) => (
                  <CompactStockRow
                    key={book.id}
                    book={book}
                    variant="out"
                    reorderAmount={reorderAmount}
                    onReorderChange={onReorderChange}
                    onAddStock={onAddStock}
                  />
                ))}
                {outOfStock.length > 4 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    +{outOfStock.length - 4} more in Stock manager
                  </p>
                )}
              </div>
            </div>
          )}

          {lowStock.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Low stock ({lowStock.length})
              </p>
              <div className="space-y-2">
                {lowStock.slice(0, 4).map((book) => (
                  <CompactStockRow
                    key={book.id}
                    book={book}
                    variant="low"
                    reorderAmount={reorderAmount}
                    onReorderChange={onReorderChange}
                    onAddStock={onAddStock}
                  />
                ))}
                {lowStock.length > 4 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    +{lowStock.length - 4} more in Stock manager
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
