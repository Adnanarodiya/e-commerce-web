import { formatBookWeight, orderItemsTotalWeight } from "@/lib/format-order";

export interface SlipItem {
  book_id?: number;
  book_name: string;
  quantity: number;
  /** Unit weight in grams (optional; shown on PDF when present). */
  unit_weight_g?: number;
}

export interface SlipData {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_type: string;
  items: SlipItem[];
  created_at?: string;
  /** Total package weight in grams. */
  total_weight_g?: number;
}

/** Attach book weights onto slip items for PDF / print. */
export function enrichSlipWithWeights(
  slip: SlipData,
  weightByBookId?: Map<number, number>
): SlipData {
  if (!weightByBookId || weightByBookId.size === 0) return slip;

  const items = slip.items.map((item) => {
    const unit =
      item.unit_weight_g ??
      (item.book_id != null ? weightByBookId.get(item.book_id) ?? 0 : 0);
    return unit > 0 ? { ...item, unit_weight_g: unit } : item;
  });

  const total_weight_g =
    slip.total_weight_g ?? orderItemsTotalWeight(items, weightByBookId);

  return {
    ...slip,
    items,
    total_weight_g: total_weight_g > 0 ? total_weight_g : undefined,
  };
}
