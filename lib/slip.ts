export interface SlipItem {
  book_name: string;
  quantity: number;
}

export interface SlipData {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_type: string;
  items: SlipItem[];
  created_at?: string;
}
