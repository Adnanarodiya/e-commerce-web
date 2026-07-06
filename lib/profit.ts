export interface ProfitBook {
  id: number;
  cost_price?: number | null;
  price: number;
  stock: number;
}

export interface ProfitOrderItem {
  book_id: number;
  quantity: number;
  price: number;
}

export interface ProfitOrder {
  status: string;
  total: number;
  items: ProfitOrderItem[];
}

/** Cost of goods for one order (buying price × qty). */
export function orderCostOfGoods(
  order: ProfitOrder,
  costByBookId: Map<number, number>
): number {
  return order.items.reduce((sum, item) => {
    const unitCost = costByBookId.get(item.book_id) ?? 0;
    return sum + unitCost * item.quantity;
  }, 0);
}

/** Gross profit = what customer paid − cost of books sold. */
export function orderGrossProfit(
  order: ProfitOrder,
  costByBookId: Map<number, number>
): number {
  if (order.status === "pending") return 0;
  return order.total - orderCostOfGoods(order, costByBookId);
}

export function sumGrossProfit(
  orders: ProfitOrder[],
  books: ProfitBook[]
): number {
  const costByBookId = new Map(books.map((b) => [b.id, Number(b.cost_price ?? 0)]));
  return orders
    .filter((o) => o.status !== "pending")
    .reduce((sum, o) => sum + orderGrossProfit(o, costByBookId), 0);
}

export function stockValuation(books: ProfitBook[]) {
  const atSellPrice = books.reduce((sum, b) => sum + b.price * b.stock, 0);
  const atCostPrice = books.reduce(
    (sum, b) => sum + Number(b.cost_price ?? 0) * b.stock,
    0
  );
  return {
    atSellPrice,
    atCostPrice,
    potentialMargin: atSellPrice - atCostPrice,
    quantity: books.reduce((sum, b) => sum + b.stock, 0),
  };
}

export function unitMargin(costPrice: number, sellPrice: number) {
  const margin = sellPrice - costPrice;
  const percent = sellPrice > 0 ? (margin / sellPrice) * 100 : 0;
  return { margin, percent };
}

export function formatRupee(amount: number, decimals = 0) {
  return `₹${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
