import {
  orderCourierCharge,
  orderGrossProfit,
  orderPackagingCharge,
  orderProductRevenue,
  type ProfitBook,
  type ProfitOrder,
} from "@/lib/profit";

export interface StatementRow {
  id: string;
  created_at: string;
  customer_name: string;
  customerPaid: number;
  packaging: number;
  courier: number;
  totalEarn: number;
  profit: number;
}

export function buildStatementRow(
  order: ProfitOrder & {
    id: string;
    created_at: string;
    customer_name: string;
  },
  costByBookId: Map<number, number>
): StatementRow {
  return {
    id: order.id,
    created_at: order.created_at,
    customer_name: order.customer_name,
    customerPaid: Number(order.total),
    packaging: orderPackagingCharge(order),
    courier: orderCourierCharge(order),
    totalEarn: orderProductRevenue(order),
    profit: orderGrossProfit(order, costByBookId),
  };
}

export function buildCostByBookId(books: ProfitBook[]): Map<number, number> {
  return new Map(books.map((b) => [b.id, Number(b.cost_price ?? 0)]));
}

export function sumStatementRows(rows: StatementRow[]) {
  return rows.reduce(
    (acc, row) => ({
      customerPaid: acc.customerPaid + row.customerPaid,
      packaging: acc.packaging + row.packaging,
      courier: acc.courier + row.courier,
      totalEarn: acc.totalEarn + row.totalEarn,
      profit: acc.profit + row.profit,
    }),
    { customerPaid: 0, packaging: 0, courier: 0, totalEarn: 0, profit: 0 }
  );
}

export interface StatementPdfData {
  mode: "bank" | "cash";
  rangeLabel: string;
  upiId?: string;
  generatedAt: string;
  rows: StatementRow[];
}
