"use client";

export type PaymentMethod = "CASH" | "UPI";

export type BillItem = {
  service_id: string;
  name: string;
  price_paise: number;
  qty: number;
};

export type DraftBill = {
  id: string;
  created_at: string;
  shop_name?: string;
  customer?: { id?: string; name?: string; phone?: string };
  items: BillItem[];
  discount_paise?: number;
  payment_method: PaymentMethod;
  upi_ref?: string;
};

const BILL_PREFIX = "naayikhata:bill:";
const BILL_INDEX = "naayikhata:bill:index";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getBillTotalPaise(bill: DraftBill) {
  const subtotal = bill.items.reduce((sum, it) => sum + it.price_paise * it.qty, 0);
  const discount = bill.discount_paise ?? 0;
  return Math.max(0, subtotal - discount);
}

export function saveDraftBill(bill: DraftBill) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`${BILL_PREFIX}${bill.id}`, JSON.stringify(bill));

  const index = safeParse<string[]>(window.sessionStorage.getItem(BILL_INDEX)) ?? [];
  const next = [bill.id, ...index.filter((x) => x !== bill.id)].slice(0, 50);
  window.sessionStorage.setItem(BILL_INDEX, JSON.stringify(next));
}

export function loadDraftBill(id: string): DraftBill | null {
  if (typeof window === "undefined") return null;
  return safeParse<DraftBill>(window.sessionStorage.getItem(`${BILL_PREFIX}${id}`));
}

export function listRecentBills(limit = 10): DraftBill[] {
  if (typeof window === "undefined") return [];
  const index = safeParse<string[]>(window.sessionStorage.getItem(BILL_INDEX)) ?? [];
  const bills: DraftBill[] = [];
  for (const id of index) {
    const b = loadDraftBill(id);
    if (b) bills.push(b);
    if (bills.length >= limit) break;
  }
  return bills;
}
