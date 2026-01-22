"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AuthGate } from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import { type InvoiceDetail } from "../../../../lib/invoices";
import { formatRupeesFromPaise } from "@/lib/money";
import { useMe } from "@/lib/useMe";

function normalizePhoneForWhatsapp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  // Default to India country code for 10-digit numbers
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  // WhatsApp requires an international number with country code, digits only.
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export default function ReceiptPageClient({ id }: { id: string }) {
  const { me, loading: meLoading, error: meError } = useMe();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = (await apiFetch(`/api/invoices/${id}`)) as InvoiceDetail;
        if (cancelled) return;
        setInvoice(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load invoice");
        setInvoice(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const totalPaise = invoice?.total_paise ?? 0;
  const subtotalPaise = invoice?.subtotal_paise ?? 0;
  const discountPaise = invoice?.discount_paise ?? 0;

  const whatsappText = useMemo(() => {
    if (!invoice) return "";
    const lines = [
      `${me?.shop_name ?? "Groomly"}`,
      `Bill: ${formatRupeesFromPaise(totalPaise)}`,
      invoice.customer_name ? `Customer: ${invoice.customer_name}` : "Customer: Walk-in",
      "",
      "Items:",
      ...invoice.items.map(
        (it) => `- ${it.description} x${it.qty}: ${formatRupeesFromPaise(it.total_paise)}`
      ),
      "",
      `Subtotal: ${formatRupeesFromPaise(subtotalPaise)}`,
      `Discount: -${formatRupeesFromPaise(discountPaise)}`,
      `Total: ${formatRupeesFromPaise(totalPaise)}`,
      "",
      `Paid via: ${(invoice.payments?.[0]?.method ?? "").toUpperCase()}`,
    ];
    return lines.join("\n");
  }, [invoice, me?.shop_name, totalPaise, subtotalPaise, discountPaise]);

  const whatsappNumber = normalizePhoneForWhatsapp(invoice?.customer_phone);
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="min-h-screen bg-zinc-50 pb-40">
      <AppHeader title="Receipt" backHref="/dashboard" />
      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl p-4">
          <div className="rounded-lg bg-emerald-500 p-3 text-center text-sm font-medium text-white">
            Bill saved to database
          </div>

          {loading ? (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
              Loading receipt...
            </div>
          ) : error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : !invoice ? (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6">
              <div className="text-base font-semibold">Invoice not found</div>
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
                <div className="text-2xl font-bold">{me?.shop_name ?? "Groomly"}</div>
                <div className="mt-1 text-sm text-zinc-700">
                  {new Date(invoice.issued_at).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="my-4 border-t border-dashed border-zinc-200" />

              <div className="space-y-2">
                {invoice.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm">
                    <div className="text-zinc-800">
                      {it.description} x {it.qty}
                    </div>
                    <div className="font-medium">
                      {formatRupeesFromPaise(it.total_paise)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="my-4 border-t border-dashed border-zinc-200" />

              <div className="flex justify-between text-lg font-bold">
                <div>Total</div>
                <div>{formatRupeesFromPaise(totalPaise)}</div>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between text-zinc-800">
                  <div>Subtotal</div>
                  <div className="font-semibold text-zinc-900">
                    {formatRupeesFromPaise(subtotalPaise)}
                  </div>
                </div>
                <div className="flex justify-between text-zinc-800">
                  <div>Discount</div>
                  <div className="font-semibold text-zinc-900">
                    -{formatRupeesFromPaise(discountPaise)}
                  </div>
                </div>
              </div>
              <div className="mt-1 text-sm text-zinc-700">
                Paid via: {(invoice.payments?.[0]?.method ?? "").toUpperCase()}
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
