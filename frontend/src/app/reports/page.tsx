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

  const { totalPaise, billCount, cashPaise, upiPaise } = useMemo(() => {
    const today = new Date();
    const todays = (invoices ?? []).filter((inv) =>
      isSameLocalDay(new Date(inv.issued_at), today)
    );
    const totals = todays.reduce(
      (acc, b) => {
        acc.totalPaise += b.total_paise;
        acc.billCount += 1;
        if (b.payment_method === "CASH") acc.cashPaise += b.total_paise;
        if (b.payment_method === "UPI") acc.upiPaise += b.total_paise;
        return acc;
      },
      { totalPaise: 0, billCount: 0, cashPaise: 0, upiPaise: 0 }
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
              <div className="text-sm text-zinc-700">Total (Today)</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(totalPaise)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">Bills</div>
              <div className="mt-1 text-xl font-bold">{billCount}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">Cash</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(cashPaise)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">UPI</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(upiPaise)}
              </div>
            </div>
          </div>

        </div>
      </AuthGate>

      <BottomNav active="Reports" />
    </div>
  );
}
