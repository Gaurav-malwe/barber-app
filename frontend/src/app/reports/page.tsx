"use client";

import Link from "next/link";
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

type RangePreset = "TODAY" | "7D" | "30D";

type CustomerInsights = {
  start: string;
  end: string;
  dormant_days: number;
  repeat_customers: Array<{
    customer_id: string;
    customer_name: string;
    bill_count: number;
    gross_paise: number;
    discount_paise: number;
    net_paise: number;
    last_invoice_at: string | null;
  }>;
  top_customers: Array<{
    customer_id: string;
    customer_name: string;
    bill_count: number;
    gross_paise: number;
    discount_paise: number;
    net_paise: number;
    last_invoice_at: string | null;
  }>;
  dormant_customers: Array<{
    customer_id: string;
    customer_name: string;
    last_invoice_at: string | null;
    bill_count_all_time: number;
  }>;
};

type ServicePerformance = {
  start: string;
  end: string;
  limit: number;
  top_by_revenue: Array<{
    service_id: string;
    service_name: string;
    qty: number;
    revenue_paise: number;
    invoice_count: number;
  }>;
  top_by_quantity: Array<{
    service_id: string;
    service_name: string;
    qty: number;
    revenue_paise: number;
    invoice_count: number;
  }>;
};

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDaysLocal(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export default function ReportsPage() {
  const { me, loading: meLoading, error: meError } = useMe();

  const [invoices, setInvoices] = useState<InvoiceSummary[] | null>(null);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const [preset, setPreset] = useState<RangePreset>("TODAY");
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);
  const [dormantDays, setDormantDays] = useState<30 | 60 | 90>(30);
  const [servicePerformance, setServicePerformance] = useState<ServicePerformance | null>(null);
  const [customerInsightsOpen, setCustomerInsightsOpen] = useState(false);
  const [servicePerformanceOpen, setServicePerformanceOpen] = useState(false);
  const [customerInsightsLoading, setCustomerInsightsLoading] = useState(false);
  const [servicePerformanceLoading, setServicePerformanceLoading] = useState(false);
  const [customerInsightsError, setCustomerInsightsError] = useState<string | null>(null);
  const [servicePerformanceError, setServicePerformanceError] = useState<string | null>(null);

  const range = useMemo(() => {
    const now = new Date();
    const start = startOfLocalDay(now);
    const end = addDaysLocal(start, 1);
    const rangeStart = preset === "TODAY" ? start : addDaysLocal(end, preset === "7D" ? -7 : -30);
    return { rangeStart, end };
  }, [preset]);

  // Always-on fetch for per-day breakdown + top summary cards.
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    setInvoicesLoading(true);
    setInvoicesError(null);
    (async () => {
      try {
        const qs = new URLSearchParams({
          start: range.rangeStart.toISOString(),
          end: range.end.toISOString(),
        });
        const data = (await apiFetch(`/api/invoices?${qs.toString()}`)) as InvoiceSummary[];
        if (cancelled) return;
        setInvoices(data);
      } catch (err) {
        if (cancelled) return;
        setInvoices([]);
        setInvoicesError(err instanceof Error ? err.message : "Failed to load invoices");
      } finally {
        if (!cancelled) setInvoicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me, range.end, range.rangeStart]);

  // Lazy: only fetch customer insights when the section is opened.
  useEffect(() => {
    if (!me) return;
    if (!customerInsightsOpen) return;
    let cancelled = false;
    setCustomerInsightsLoading(true);
    setCustomerInsightsError(null);
    setCustomerInsights(null);
    (async () => {
      try {
        const insightsQs = new URLSearchParams({
          start: range.rangeStart.toISOString(),
          end: range.end.toISOString(),
          dormant_days: String(dormantDays),
          limit: "10",
          include_never: "true",
        });
        const insights = (await apiFetch(`/api/reports/customers?${insightsQs.toString()}`)) as CustomerInsights;
        if (cancelled) return;
        setCustomerInsights(insights);
      } catch (err) {
        if (cancelled) return;
        setCustomerInsights(null);
        setCustomerInsightsError(err instanceof Error ? err.message : "Failed to load customer insights");
      } finally {
        if (!cancelled) setCustomerInsightsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me, customerInsightsOpen, dormantDays, range.end, range.rangeStart]);

  // Lazy: only fetch service performance when the section is opened.
  useEffect(() => {
    if (!me) return;
    if (!servicePerformanceOpen) return;
    let cancelled = false;
    setServicePerformanceLoading(true);
    setServicePerformanceError(null);
    setServicePerformance(null);
    (async () => {
      try {
        const servicesQs = new URLSearchParams({
          start: range.rangeStart.toISOString(),
          end: range.end.toISOString(),
          limit: "10",
        });
        const services = (await apiFetch(`/api/reports/services?${servicesQs.toString()}`)) as ServicePerformance;
        if (cancelled) return;
        setServicePerformance(services);
      } catch (err) {
        if (cancelled) return;
        setServicePerformance(null);
        setServicePerformanceError(err instanceof Error ? err.message : "Failed to load service performance");
      } finally {
        if (!cancelled) setServicePerformanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me, servicePerformanceOpen, range.end, range.rangeStart]);

  const { grossPaise, discountPaise, netPaise, billCount, cashNetPaise, upiNetPaise } = useMemo(() => {
    const totals = (invoices ?? []).reduce(
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

  const perDay = useMemo(() => {
    const buckets = new Map<
      string,
      { day: string; grossPaise: number; discountPaise: number; netPaise: number; bills: number }
    >();

    for (const inv of invoices ?? []) {
      const d = new Date(inv.issued_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const existing = buckets.get(key) ?? {
        day: key,
        grossPaise: 0,
        discountPaise: 0,
        netPaise: 0,
        bills: 0,
      };
      existing.grossPaise += inv.subtotal_paise;
      existing.discountPaise += inv.discount_paise;
      existing.netPaise += inv.total_paise;
      existing.bills += 1;
      buckets.set(key, existing);
    }

    return Array.from(buckets.values()).sort((a, b) => (a.day < b.day ? 1 : -1));
  }, [invoices]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <AppHeader title="Reports" backHref="/dashboard" />
      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl p-4">
          {invoicesError ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {invoicesError}
            </div>
          ) : null}

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setPreset("TODAY")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                preset === "TODAY" ? "bg-emerald-500 text-white" : "border border-zinc-200 bg-white text-zinc-800"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPreset("7D")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                preset === "7D" ? "bg-emerald-500 text-white" : "border border-zinc-200 bg-white text-zinc-800"
              }`}
            >
              7D
            </button>
            <button
              type="button"
              onClick={() => setPreset("30D")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                preset === "30D" ? "bg-emerald-500 text-white" : "border border-zinc-200 bg-white text-zinc-800"
              }`}
            >
              30D
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">Gross</div>
              <div className="mt-1 text-xl font-bold">
                {formatRupeesFromPaise(grossPaise)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">Discount</div>
              <div className="mt-1 text-xl font-bold">
                -{formatRupeesFromPaise(discountPaise)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm text-zinc-700">Net</div>
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

          <div className="mt-6 rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3 font-semibold text-zinc-900">
              Per-day breakdown
            </div>
            {invoices === null || invoicesLoading ? (
              <div className="p-4 text-sm text-zinc-700">Loading...</div>
            ) : perDay.length === 0 ? (
              <div className="p-4 text-sm text-zinc-700">No data for this range.</div>
            ) : (
              <div className="divide-y divide-zinc-200">
                {perDay.map((d) => (
                  <div key={d.day} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-zinc-900">{d.day}</div>
                      <div className="text-sm text-zinc-700">{d.bills} bill{d.bills === 1 ? "" : "s"}</div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-lg bg-zinc-50 p-2">
                        <div className="text-xs text-zinc-700">Gross</div>
                        <div className="font-semibold text-zinc-900">{formatRupeesFromPaise(d.grossPaise)}</div>
                      </div>
                      <div className="rounded-lg bg-zinc-50 p-2">
                        <div className="text-xs text-zinc-700">Discount</div>
                        <div className="font-semibold text-zinc-900">-{formatRupeesFromPaise(d.discountPaise)}</div>
                      </div>
                      <div className="rounded-lg bg-zinc-50 p-2">
                        <div className="text-xs text-zinc-700">Net</div>
                        <div className="font-semibold text-zinc-900">{formatRupeesFromPaise(d.netPaise)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-white">
            <button
              type="button"
              onClick={() => setCustomerInsightsOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 text-left"
            >
              <div className="font-semibold text-zinc-900">Customer insights</div>
              <div className="text-sm font-semibold text-zinc-700">{customerInsightsOpen ? "Hide" : "View"}</div>
            </button>

            {!customerInsightsOpen ? (
              <div className="p-4 text-sm text-zinc-700">Tap “View” to load this report.</div>
            ) : customerInsightsLoading ? (
              <div className="p-4 text-sm text-zinc-700">Loading...</div>
            ) : customerInsightsError ? (
              <div className="p-4 text-sm text-rose-700">{customerInsightsError}</div>
            ) : !customerInsights ? (
              <div className="p-4 text-sm text-zinc-700">No data.</div>
            ) : (
              <div className="divide-y divide-zinc-200">
                <div className="p-4">
                  <div className="font-semibold text-zinc-900">Repeat customers (≥2 bills)</div>
                  {customerInsights.repeat_customers.length === 0 ? (
                    <div className="mt-2 text-sm text-zinc-700">No repeat customers in this range.</div>
                  ) : (
                    <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
                      {customerInsights.repeat_customers.map((c) => (
                        <Link
                          key={c.customer_id}
                          href={`/customers/view?id=${encodeURIComponent(c.customer_id)}`}
                          className="block bg-white px-4 py-3 hover:bg-zinc-50"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-zinc-900">{c.customer_name}</div>
                              <div className="text-sm text-zinc-700">{c.bill_count} bills</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-zinc-900">
                                {formatRupeesFromPaise(c.net_paise)}
                              </div>
                              <div className="text-xs text-zinc-700">
                                Gross {formatRupeesFromPaise(c.gross_paise)} • Disc -{formatRupeesFromPaise(c.discount_paise)}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="font-semibold text-zinc-900">Top customers (by net)</div>
                  {customerInsights.top_customers.length === 0 ? (
                    <div className="mt-2 text-sm text-zinc-700">No customer bills in this range.</div>
                  ) : (
                    <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
                      {customerInsights.top_customers.map((c, idx) => (
                        <Link
                          key={c.customer_id}
                          href={`/customers/view?id=${encodeURIComponent(c.customer_id)}`}
                          className="block bg-white px-4 py-3 hover:bg-zinc-50"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-zinc-900">
                                {idx + 1}. {c.customer_name}
                              </div>
                              <div className="text-sm text-zinc-700">{c.bill_count} bills</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-zinc-900">
                                {formatRupeesFromPaise(c.net_paise)}
                              </div>
                              <div className="text-xs text-zinc-700">
                                Gross {formatRupeesFromPaise(c.gross_paise)} • Disc -{formatRupeesFromPaise(c.discount_paise)}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-zinc-900">Dormant window</div>
                    <div className="flex gap-2">
                      {[30, 60, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDormantDays(d as 30 | 60 | 90)}
                          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                            dormantDays === d
                              ? "bg-emerald-500 text-white"
                              : "border border-zinc-200 bg-white text-zinc-800"
                          }`}
                        >
                          {d}D
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-zinc-700">
                    Shows customers with no bills in the last {dormantDays} days (or never billed).
                  </div>
                </div>

                <div className="p-4">
                  <div className="font-semibold text-zinc-900">Dormant customers ({customerInsights.dormant_days}+ days)</div>
                  {customerInsights.dormant_customers.length === 0 ? (
                    <div className="mt-2 text-sm text-zinc-700">No dormant customers.</div>
                  ) : (
                    <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
                      {customerInsights.dormant_customers.map((c) => (
                        <Link
                          key={c.customer_id}
                          href={`/customers/view?id=${encodeURIComponent(c.customer_id)}`}
                          className="block bg-white px-4 py-3 hover:bg-zinc-50"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-zinc-900">{c.customer_name}</div>
                              <div className="text-sm text-zinc-700">
                                {c.last_invoice_at
                                  ? `Last visit: ${new Date(c.last_invoice_at).toLocaleDateString("en-IN")}`
                                  : "Never billed"}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-zinc-900">
                              {c.bill_count_all_time} bills
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-white">
            <button
              type="button"
              onClick={() => setServicePerformanceOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 text-left"
            >
              <div className="font-semibold text-zinc-900">Service performance</div>
              <div className="text-sm font-semibold text-zinc-700">{servicePerformanceOpen ? "Hide" : "View"}</div>
            </button>

            {!servicePerformanceOpen ? (
              <div className="p-4 text-sm text-zinc-700">Tap “View” to load this report.</div>
            ) : servicePerformanceLoading ? (
              <div className="p-4 text-sm text-zinc-700">Loading...</div>
            ) : servicePerformanceError ? (
              <div className="p-4 text-sm text-rose-700">{servicePerformanceError}</div>
            ) : !servicePerformance ? (
              <div className="p-4 text-sm text-zinc-700">No data.</div>
            ) : servicePerformance.top_by_revenue.length === 0 && servicePerformance.top_by_quantity.length === 0 ? (
              <div className="p-4 text-sm text-zinc-700">No service usage in this range.</div>
            ) : (
              <div className="divide-y divide-zinc-200">
                <div className="p-4">
                  <div className="font-semibold text-zinc-900">Top services (by revenue)</div>
                  {servicePerformance.top_by_revenue.length === 0 ? (
                    <div className="mt-2 text-sm text-zinc-700">No data.</div>
                  ) : (
                    <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
                      {servicePerformance.top_by_revenue.map((s, idx) => (
                        <div key={s.service_id} className="bg-white px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-zinc-900">
                                {idx + 1}. {s.service_name}
                              </div>
                              <div className="text-sm text-zinc-700">
                                {s.qty} qty • {s.invoice_count} bill{s.invoice_count === 1 ? "" : "s"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-zinc-900">
                                {formatRupeesFromPaise(s.revenue_paise)}
                              </div>
                              <div className="text-xs text-zinc-700">Gross line total</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="font-semibold text-zinc-900">Top services (by quantity)</div>
                  {servicePerformance.top_by_quantity.length === 0 ? (
                    <div className="mt-2 text-sm text-zinc-700">No data.</div>
                  ) : (
                    <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
                      {servicePerformance.top_by_quantity.map((s, idx) => (
                        <div key={s.service_id} className="bg-white px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-zinc-900">
                                {idx + 1}. {s.service_name}
                              </div>
                              <div className="text-sm text-zinc-700">
                                {s.qty} qty • {s.invoice_count} bill{s.invoice_count === 1 ? "" : "s"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-zinc-900">
                                {formatRupeesFromPaise(s.revenue_paise)}
                              </div>
                              <div className="text-xs text-zinc-700">Gross line total</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </AuthGate>

      <BottomNav active="Reports" />
    </div>
  );
}
