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
  subtotal: number;
  discount: number;
  packaging_charge: number;
  courier_charge?: number;
  total: number;
  items: ProfitOrderItem[];
}

export function isConfirmedForRevenue(status: string): boolean {
  return status !== "pending" && status !== "cancelled";
}

/** Book sales only — excludes packaging & courier (pass-through). */
export function orderProductRevenue(order: ProfitOrder): number {
  return Math.max(0, Number(order.subtotal) - Number(order.discount));
}

export function orderPackagingCharge(order: ProfitOrder): number {
  return Math.max(0, Number(order.packaging_charge ?? 0));
}

export function orderCourierCharge(order: ProfitOrder): number {
  return Math.max(0, Number(order.courier_charge ?? 0));
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

/** Gross profit = book revenue − cost of books sold. */
export function orderGrossProfit(
  order: ProfitOrder,
  costByBookId: Map<number, number>
): number {
  if (!isConfirmedForRevenue(order.status)) return 0;
  return orderProductRevenue(order) - orderCostOfGoods(order, costByBookId);
}

export function sumGrossProfit(
  orders: ProfitOrder[],
  books: ProfitBook[]
): number {
  const costByBookId = new Map(books.map((b) => [b.id, Number(b.cost_price ?? 0)]));
  return orders
    .filter((o) => isConfirmedForRevenue(o.status))
    .reduce((sum, o) => sum + orderGrossProfit(o, costByBookId), 0);
}

export function sumProductRevenue(orders: ProfitOrder[]): number {
  return orders
    .filter((o) => isConfirmedForRevenue(o.status))
    .reduce((sum, o) => sum + orderProductRevenue(o), 0);
}

export function stockValuation(books: ProfitBook[]) {
  const atCostPrice = books.reduce(
    (sum, b) => sum + Number(b.cost_price ?? 0) * b.stock,
    0
  );
  return {
    atCostPrice,
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
