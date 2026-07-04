"use client";

import BookImage from "@/components/ui/BookImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, Package, PackageX, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { StockBook } from "@/components/admin/StockAlertCards";

interface StockManagementPanelProps {
  books: StockBook[];
  lowStockThreshold: number;
  reorderAmount: Record<number, number>;
  setStockDraft: Record<number, string>;
  onReorderChange: (id: number, qty: number) => void;
  onSetStockDraftChange: (id: number, value: string) => void;
  onAddStock: (id: number) => void;
  onSetStock: (id: number) => void;
  onEditBook: (book: StockBook) => void;
}

function stockStatus(stock: number, threshold: number) {
  if (stock === 0) return "out" as const;
  if (stock < threshold) return "low" as const;
  return "ok" as const;
}

function StockEditorRow({
  book,
  threshold,
  reorderAmount,
  setStockDraft,
  onReorderChange,
  onSetStockDraftChange,
  onAddStock,
  onSetStock,
  onEditBook,
}: {
  book: StockBook;
  threshold: number;
  reorderAmount: Record<number, number>;
  setStockDraft: Record<number, string>;
  onReorderChange: (id: number, qty: number) => void;
  onSetStockDraftChange: (id: number, value: string) => void;
  onAddStock: (id: number) => void;
  onSetStock: (id: number) => void;
  onEditBook: (book: StockBook) => void;
}) {
  const status = stockStatus(book.stock, threshold);

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_auto] gap-4 items-center p-4 rounded-xl border ${
        status === "out"
          ? "bg-red-50/80 border-red-200"
          : status === "low"
            ? "bg-amber-50/80 border-amber-200"
            : "bg-white border-border"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-14 h-14 shrink-0 rounded-lg border border-white shadow-sm overflow-hidden">
          <BookImage src={book.image} alt={book.name_en} fill className="object-cover" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-sm text-slate-900 truncate">
              {book.name_en}
            </h4>
            {status === "out" ? (
              <Badge className="bg-red-600 text-white border-0 text-[10px] font-bold">
                OUT OF STOCK
              </Badge>
            ) : status === "low" ? (
              <Badge className="bg-amber-600 text-white border-0 text-[10px] font-bold">
                LOW — {book.stock} left
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-semibold">
                In stock: {book.stock}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{book.name_ur}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">
            Add to stock
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              placeholder="Qty"
              className="w-24 h-9 text-sm"
              value={reorderAmount[book.id] || ""}
              onChange={(e) =>
                onReorderChange(book.id, parseInt(e.target.value, 10) || 0)
              }
            />
            <Button
              size="sm"
              className="h-9 bg-primary text-primary-foreground font-semibold"
              onClick={() => onAddStock(book.id)}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">
            Set exact stock
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              placeholder={String(book.stock)}
              className="w-24 h-9 text-sm"
              value={setStockDraft[book.id] ?? ""}
              onChange={(e) => onSetStockDraftChange(book.id, e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-9 font-semibold"
              onClick={() => onSetStock(book.id)}
            >
              Set
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end lg:justify-center">
        <Button
          size="sm"
          variant="outline"
          className="h-9"
          onClick={() => onEditBook(book)}
        >
          <Edit2 className="h-4 w-4 mr-1.5" />
          Edit book
        </Button>
      </div>
    </div>
  );
}

export default function StockManagementPanel({
  books,
  lowStockThreshold,
  reorderAmount,
  setStockDraft,
  onReorderChange,
  onSetStockDraftChange,
  onAddStock,
  onSetStock,
  onEditBook,
}: StockManagementPanelProps) {
  const criticalBooks = books.filter((b) => b.stock < lowStockThreshold);
  const outOfStock = criticalBooks.filter((b) => b.stock === 0);
  const lowStock = criticalBooks.filter(
    (b) => b.stock > 0 && b.stock < lowStockThreshold
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-red-200 bg-red-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <PackageX className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-red-700">Out of stock</p>
              <p className="text-2xl font-bold text-red-800">{outOfStock.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-amber-800">Low stock (&lt;{lowStockThreshold})</p>
              <p className="text-2xl font-bold text-amber-900">{lowStock.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-emerald-800">Total titles</p>
              <p className="text-2xl font-bold text-emerald-900">{books.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {criticalBooks.length === 0 ? (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">All stock levels look good</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No books are out of stock or below {lowStockThreshold} copies.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {outOfStock.length > 0 && (
            <Card className="border-2 border-red-300 shadow-md overflow-hidden">
              <CardHeader className="bg-red-600 text-white pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <PackageX className="h-5 w-5" />
                  Out of Stock ({outOfStock.length})
                </CardTitle>
                <CardDescription className="text-red-100">
                  These titles cannot be sold until restocked.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {outOfStock.map((book) => (
                  <StockEditorRow
                    key={book.id}
                    book={book}
                    threshold={lowStockThreshold}
                    reorderAmount={reorderAmount}
                    setStockDraft={setStockDraft}
                    onReorderChange={onReorderChange}
                    onSetStockDraftChange={onSetStockDraftChange}
                    onAddStock={onAddStock}
                    onSetStock={onSetStock}
                    onEditBook={onEditBook}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {lowStock.length > 0 && (
            <Card className="border-2 border-amber-300 shadow-md overflow-hidden">
              <CardHeader className="bg-amber-500 text-white pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock — fewer than {lowStockThreshold} copies ({lowStock.length})
                </CardTitle>
                <CardDescription className="text-amber-100">
                  Restock soon to avoid running out during orders.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {lowStock.map((book) => (
                  <StockEditorRow
                    key={book.id}
                    book={book}
                    threshold={lowStockThreshold}
                    reorderAmount={reorderAmount}
                    setStockDraft={setStockDraft}
                    onReorderChange={onReorderChange}
                    onSetStockDraftChange={onSetStockDraftChange}
                    onAddStock={onAddStock}
                    onSetStock={onSetStock}
                    onEditBook={onEditBook}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
