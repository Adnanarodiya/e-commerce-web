"use client";

import { useState } from "react";
import BookImage from "@/components/ui/BookImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, Package, PackageX, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import type { StockBook } from "@/components/admin/StockAlertCards";
import { touchChoice } from "@/lib/touch-target";

interface StockManagementPanelProps {
  books: StockBook[];
  lowStockThreshold: number;
  reorderAmount: Record<number, number>;
  onReorderChange: (id: number, qty: number) => void;
  onAddStock: (id: number) => void;
  onEditBook: (book: StockBook) => void;
}

type Filter = "all" | "out" | "low";

const qtyInputClass =
  "flex-1 min-w-0 h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-base tabular-nums font-semibold shadow-none placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 md:h-9 md:text-sm";

function StatusBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock === 0) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-semibold">
        Out of stock
      </Badge>
    );
  }
  if (stock < threshold) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-semibold">
        Low — {stock.toLocaleString()} left
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="font-semibold">
      In stock
    </Badge>
  );
}

function StockItemCard({
  book,
  threshold,
  reorderAmount,
  onReorderChange,
  onAddStock,
  onEditBook,
}: {
  book: StockBook;
  threshold: number;
  reorderAmount: Record<number, number>;
  onReorderChange: (id: number, qty: number) => void;
  onAddStock: (id: number) => void;
  onEditBook: (book: StockBook) => void;
}) {
  const accent =
    book.stock === 0
      ? "border-l-red-500"
      : book.stock < threshold
        ? "border-l-amber-500"
        : "border-l-slate-200";

  const stockTone =
    book.stock === 0
      ? "bg-red-100 text-red-800"
      : book.stock < threshold
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-100 text-slate-800";

  return (
    <div
      className={`p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 ${accent} border-l-4`}
    >
      <div className="flex items-start gap-3">
        <div className="relative w-14 h-14 shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-white">
          <BookImage src={book.image} alt={book.name_en} fill className="object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 leading-snug">{book.name_en}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{book.name_ur}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold tabular-nums ${stockTone}`}
            >
              {book.stock.toLocaleString()} in stock
            </span>
            <StatusBadge stock={book.stock} threshold={threshold} />
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 text-slate-600 -mr-1"
          onClick={() => onEditBook(book)}
          aria-label={`Edit ${book.name_en}`}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 mt-3">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Qty to add"
          className={qtyInputClass}
          value={reorderAmount[book.id] || ""}
          onChange={(e) =>
            onReorderChange(book.id, parseInt(e.target.value, 10) || 0)
          }
        />
        <Button
          size="sm"
          className="shrink-0 bg-primary text-primary-foreground font-semibold px-4"
          onClick={() => onAddStock(book.id)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

export default function StockManagementPanel({
  books,
  lowStockThreshold,
  reorderAmount,
  onReorderChange,
  onAddStock,
  onEditBook,
}: StockManagementPanelProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const outOfStock = books.filter((b) => b.stock === 0);
  const lowStock = books.filter((b) => b.stock > 0 && b.stock < lowStockThreshold);
  const criticalBooks = [...outOfStock, ...lowStock];

  const visibleBooks =
    filter === "out"
      ? outOfStock
      : filter === "low"
        ? lowStock
        : criticalBooks;

  const filterBtn = (id: Filter, label: string, count: number, activeClass: string) => (
    <button
      type="button"
      onClick={() => setFilter(id)}
      className={`px-3 rounded-lg text-sm font-semibold transition-colors ${touchChoice} ${
        filter === id
          ? activeClass
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
      <span className="ml-1.5 opacity-80">({count})</span>
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-xl border border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <PackageX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Out of stock</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{outOfStock.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Low stock (&lt;{lowStockThreshold})
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{lowStock.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total titles</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{books.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {criticalBooks.length === 0 ? (
        <Card className="rounded-xl border border-emerald-200 bg-emerald-50/40">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-11 w-11 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">All stock levels look good</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              No books are out of stock or below {lowStockThreshold} copies.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-white">
            <div className="flex flex-col gap-3">
              <div>
                <CardTitle className="text-lg">Critical inventory</CardTitle>
                <CardDescription className="mt-1">
                  Enter how many copies to add and tap Add. Titles with fewer than {lowStockThreshold} copies appear here.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {filterBtn("all", "All", criticalBooks.length, "bg-slate-800 text-white")}
                {filterBtn("out", "Out of stock", outOfStock.length, "bg-red-600 text-white")}
                {filterBtn("low", "Low stock", lowStock.length, "bg-amber-500 text-white")}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {visibleBooks.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No books in this filter.
              </p>
            ) : (
              <div>
                {visibleBooks.map((book) => (
                  <StockItemCard
                    key={book.id}
                    book={book}
                    threshold={lowStockThreshold}
                    reorderAmount={reorderAmount}
                    onReorderChange={onReorderChange}
                    onAddStock={onAddStock}
                    onEditBook={onEditBook}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
