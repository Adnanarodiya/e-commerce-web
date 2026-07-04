"use client";

import BookImage from "@/components/ui/BookImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

function StockRow({
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
      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border ${
        isOut
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="relative w-12 h-12 shrink-0 rounded-lg border border-white shadow-sm overflow-hidden">
        <BookImage src={book.image} alt={book.name_en} fill className="object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-sm text-slate-900 truncate">
            {book.name_en}
          </span>
          <Badge
            className={`text-[10px] font-bold border-0 ${
              isOut
                ? "bg-red-600 text-white"
                : "bg-amber-600 text-white"
            }`}
          >
            {isOut ? "OUT OF STOCK" : `${book.stock} left`}
          </Badge>
        </div>
        <p className="text-xs text-slate-600 truncate mt-0.5">{book.name_ur}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="number"
          min={1}
          placeholder="Add qty"
          className="w-24 h-9 text-sm"
          value={reorderAmount[book.id] || ""}
          onChange={(e) =>
            onReorderChange(book.id, parseInt(e.target.value, 10) || 0)
          }
        />
        <Button
          size="sm"
          className={`h-9 font-semibold ${
            isOut
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-amber-600 hover:bg-amber-700 text-white"
          }`}
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Stock needs attention
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {outOfStock.length} out of stock · {lowStock.length} running low
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="font-semibold"
          onClick={onViewAll}
        >
          Open Stock Manager
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {outOfStock.length > 0 && (
          <div className="rounded-2xl border-2 border-red-300 bg-white shadow-md overflow-hidden">
            <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
              <PackageX className="h-5 w-5 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Out of Stock ({outOfStock.length})
              </h3>
            </div>
            <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
              {outOfStock.slice(0, 5).map((book) => (
                <StockRow
                  key={book.id}
                  book={book}
                  variant="out"
                  reorderAmount={reorderAmount}
                  onReorderChange={onReorderChange}
                  onAddStock={onAddStock}
                />
              ))}
              {outOfStock.length > 5 && (
                <p className="text-xs text-center text-red-600 font-medium pt-1">
                  +{outOfStock.length - 5} more — open Stock Manager
                </p>
              )}
            </div>
          </div>
        )}

        {lowStock.length > 0 && (
          <div className="rounded-2xl border-2 border-amber-300 bg-white shadow-md overflow-hidden">
            <div className="bg-amber-500 px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Low Stock — under 5 ({lowStock.length})
              </h3>
            </div>
            <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
              {lowStock.slice(0, 5).map((book) => (
                <StockRow
                  key={book.id}
                  book={book}
                  variant="low"
                  reorderAmount={reorderAmount}
                  onReorderChange={onReorderChange}
                  onAddStock={onAddStock}
                />
              ))}
              {lowStock.length > 5 && (
                <p className="text-xs text-center text-amber-700 font-medium pt-1">
                  +{lowStock.length - 5} more — open Stock Manager
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
