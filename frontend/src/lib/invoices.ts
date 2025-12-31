export type PaymentMethod = "CASH" | "UPI";

export type InvoiceItem = {
  id: string;
  service_id: string | null;
  description: string;
  qty: number;
  unit_price_paise: number;
  total_paise: number;
};

export type Payment = {
  id: string;
  method: string;
  amount_paise: number;
  reference: string | null;
};

export type InvoiceDetail = {
  id: string;
  customer_id: string | null;
  customer_name?: string | null;
  issued_at: string;
  status: string;
  subtotal_paise: number;
  discount_paise: number;
  total_paise: number;
  items: InvoiceItem[];
  payments: Payment[];
};

export type InvoiceSummary = {
  id: string;
  issued_at: string;
  customer_name: string | null;
  total_paise: number;
  payment_method: PaymentMethod;
};
