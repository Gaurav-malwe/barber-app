"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

export default function DashboardPage() {
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

  const today = new Date();
  const todayInvoices = useMemo(() => {
    return (invoices ?? []).filter((inv) => isSameLocalDay(new Date(inv.issued_at), today));
  }, [invoices, today]);
  const todayTotalPaise = useMemo(
    () => todayInvoices.reduce((sum, inv) => sum + inv.total_paise, 0),
    [todayInvoices]
  );
  const cashPaise = useMemo(
    () => todayInvoices.filter((inv) => inv.payment_method === "CASH").reduce((s, inv) => s + inv.total_paise, 0),
    [todayInvoices]
  );
  const upiPaise = useMemo(
    () => todayInvoices.filter((inv) => inv.payment_method === "UPI").reduce((s, inv) => s + inv.total_paise, 0),
    [todayInvoices]
  );

  const recentInvoices = (invoices ?? []).slice(0, 10);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <header className="bg-zinc-900 text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-sm text-zinc-300">Shop</div>
            <div className="text-lg font-bold">{me?.shop_name ?? "NaayiKhata"}</div>
          </div>
          <Link
            href="/settings"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold"
          >
            Settings
          </Link>
        </div>
      </header>

      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl p-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <div className="text-sm text-zinc-700">Today’s Sales</div>
            <div className="mt-2 text-4xl font-bold text-zinc-900">
              {formatRupeesFromPaise(todayTotalPaise)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4">
              <div className="rounded-lg bg-zinc-50 p-3">
                <div className="text-xs text-zinc-700">Cash</div>
                <div className="font-semibold text-zinc-900">{formatRupeesFromPaise(cashPaise)}</div>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <div className="text-xs text-zinc-700">UPI</div>
                <div className="font-semibold text-zinc-900">{formatRupeesFromPaise(upiPaise)}</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 font-semibold text-zinc-700">Quick Actions</div>
            <div className="grid grid-cols-3 gap-3">
              <Link
                href="/bill/new"
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl bg-emerald-500 text-center text-white shadow-sm"
              >
                <div className="text-base font-bold">+ Bill</div>
                <div className="text-xs text-white/90">New bill</div>
              </Link>
              <Link
                href="/customers/new"
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-center shadow-sm"
              >
                <div className="text-base font-bold">+ Customer</div>
                <div className="text-xs text-zinc-700">Add</div>
              </Link>
              <Link
                href="/services"
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-center shadow-sm"
              >
                <div className="text-base font-bold">Services</div>
                <div className="text-xs text-zinc-700">Pricing</div>
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 font-semibold text-zinc-700">Recent bills</div>
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {recentInvoices.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                No bills yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                {recentInvoices.map((inv) => {
                  const title = inv.customer_name ? inv.customer_name : "Walk-in";
                  const total = formatRupeesFromPaise(inv.total_paise);
                  return (
                    <Link
                      key={inv.id}
                      href={`/bill/${inv.id}/receipt`}
                      className="block px-4 py-4 hover:bg-zinc-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-zinc-900">{title}</div>
                          <div className="text-sm text-zinc-700">
                            {new Date(inv.issued_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" "}• {inv.payment_method}
                          </div>
                        </div>
                        <div className="font-semibold text-zinc-900">{total}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AuthGate>

      <BottomNav active="Home" />
    </div>
  );
}
