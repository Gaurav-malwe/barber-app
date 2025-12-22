"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AuthGate } from "@/components/AuthGate";
import { loadDraftBill, getBillTotalPaise } from "@/lib/bills";
import { formatRupeesFromPaise } from "@/lib/money";
import { useMe } from "@/lib/useMe";

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { me, loading: meLoading, error: meError } = useMe();

  const bill = useMemo(() => {
    return loadDraftBill(id);
  }, [id]);

  const totalPaise = bill ? getBillTotalPaise(bill) : 0;

  const whatsappText = useMemo(() => {
    if (!bill) return "";
    const lines = [
      `${bill.shop_name ?? "NaayiKhata"}`,
      `Bill: ${formatRupeesFromPaise(totalPaise)}`,
      bill.customer?.name ? `Customer: ${bill.customer.name}` : "Customer: Walk-in",
      "",
      "Items:",
      ...bill.items.map(
        (it) => `- ${it.name} x${it.qty}: ${formatRupeesFromPaise(it.price_paise * it.qty)}`
      ),
      "",
      `Paid via: ${bill.payment_method}`,
    ];
    return lines.join("\n");
  }, [bill, totalPaise]);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="min-h-screen bg-zinc-50 pb-40">
      <AppHeader title="Receipt" backHref="/dashboard" />
      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl p-4">
          <div className="rounded-lg bg-emerald-500 p-3 text-center text-sm font-medium text-white">
            Bill saved (local draft)
          </div>

          {!bill ? (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6">
              <div className="text-base font-semibold">Receipt not found</div>
              <div className="mt-1 text-sm text-zinc-600">
                This receipt was saved in this browser session only.
              </div>
              <Link
                href="/bill/new"
                className="mt-4 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Create bill
              </Link>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border-2 border-dashed border-zinc-300 bg-white p-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{bill.shop_name ?? me?.shop_name}</div>
                <div className="mt-1 text-sm text-zinc-600">
                  {new Date(bill.created_at).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="my-4 border-t border-dashed border-zinc-200" />

              <div className="space-y-2">
                {bill.items.map((it) => (
                  <div key={it.service_id} className="flex justify-between text-sm">
                    <div className="text-zinc-800">
                      {it.name} x {it.qty}
                    </div>
                    <div className="font-medium">
                      {formatRupeesFromPaise(it.price_paise * it.qty)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="my-4 border-t border-dashed border-zinc-200" />

              <div className="flex justify-between text-lg font-bold">
                <div>Total</div>
                <div>{formatRupeesFromPaise(totalPaise)}</div>
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                Paid via: {bill.payment_method}
              </div>
            </div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-2xl space-y-2 p-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-lg bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Share receipt on WhatsApp
            </a>
            <Link
              href="/bill/new"
              className="block w-full rounded-lg px-4 py-2 text-center text-sm font-medium text-emerald-600"
            >
              Create another bill
            </Link>
          </div>
        </div>
      </AuthGate>
    </div>
  );
}
