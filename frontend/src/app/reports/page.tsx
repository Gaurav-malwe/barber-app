"use client";

import { useMemo } from "react";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { AuthGate } from "@/components/AuthGate";
import { listRecentBills, getBillTotalPaise } from "@/lib/bills";
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

  const { totalPaise, billCount, cashPaise, upiPaise } = useMemo(() => {
    const today = new Date();
    const bills = listRecentBills(50).filter((b) =>
      isSameLocalDay(new Date(b.created_at), today)
    );
    const totals = bills.reduce(
      (acc, b) => {
        const t = getBillTotalPaise(b);
        acc.totalPaise += t;
        acc.billCount += 1;
        if (b.payment_method === "CASH") acc.cashPaise += t;
        if (b.payment_method === "UPI") acc.upiPaise += t;
        return acc;
      },
      { totalPaise: 0, billCount: 0, cashPaise: 0, upiPaise: 0 }
    );
    return totals;
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <AppHeader title="Reports" backHref="/dashboard" />
      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-600">Total (Today)</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(totalPaise)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-600">Bills</div>
              <div className="mt-1 text-xl font-bold">{billCount}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-600">Cash</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(cashPaise)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-600">UPI</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(upiPaise)}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="font-semibold">Notes</div>
            <div className="mt-1 text-sm text-zinc-600">
              These totals are currently based on locally saved draft bills.
              When we add invoice APIs, this will become a real report.
            </div>
          </div>
        </div>
      </AuthGate>

      <BottomNav active="Reports" />
    </div>
  );
}
