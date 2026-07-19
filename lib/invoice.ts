export interface InvoiceItem {
  book_id?: number;
  book_name: string;
  quantity: number;
  price: number;
  is_quran?: boolean;
}

export interface InvoiceData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  delivery_type: string;
  payment_type: string;
  subtotal: number;
  discount: number;
  quranDiscount?: number;
  percentageDiscount?: number;
  packaging_charge: number;
  courier_charge?: number;
  total: number;
  created_at: string;
  items: InvoiceItem[];
  upi_id?: string;
  payee_name?: string;
}
