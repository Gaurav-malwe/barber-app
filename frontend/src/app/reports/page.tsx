"use client";

import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { AuthGate } from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import { type InvoiceSummary } from "@/lib/invoices";
import { formatRupeesFromPaise } from "@/lib/money";
import { useMe } from "@/lib/useMe";

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function ReportsPage() {
  const { me, loading: meLoading, error: meError } = useMe();

  const [invoices, setInvoices] = useState<InvoiceSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    (async () => {
      try {
        const data = (await apiFetch("/api/invoices")) as InvoiceSummary[];
        if (cancelled) return;
        setInvoices(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setInvoices([]);
        setError(err instanceof Error ? err.message : "Failed to load invoices");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me]);

  const { grossPaise, discountPaise, netPaise, billCount, cashNetPaise, upiNetPaise } = useMemo(() => {
    const today = new Date();
    const todays = (invoices ?? []).filter((inv) =>
      isSameLocalDay(new Date(inv.issued_at), today)
    );
    const totals = todays.reduce(
      (acc, b) => {
        acc.grossPaise += b.subtotal_paise;
        acc.discountPaise += b.discount_paise;
        acc.netPaise += b.total_paise;
        acc.billCount += 1;
        if (b.payment_method === "CASH") acc.cashNetPaise += b.total_paise;
        if (b.payment_method === "UPI") acc.upiNetPaise += b.total_paise;
        return acc;
      },
      { grossPaise: 0, discountPaise: 0, netPaise: 0, billCount: 0, cashNetPaise: 0, upiNetPaise: 0 }
    );
    return totals;
  }, [invoices]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <AppHeader title="Reports" backHref="/dashboard" />
      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl p-4">
          {error ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">Gross (Today)</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(grossPaise)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">Discount (Today)</div>
              <div className="mt-1 text-xl font-bold">
                -{formatRupeesFromPaise(discountPaise)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">Net (Today)</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(netPaise)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">Bills</div>
              <div className="mt-1 text-xl font-bold">{billCount}</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">Cash (Net)</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(cashNetPaise)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">UPI (Net)</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(upiNetPaise)}
              </div>
            </div>
          </div>

        </div>
      </AuthGate>

      <BottomNav active="Reports" />
    </div>
  );
}
