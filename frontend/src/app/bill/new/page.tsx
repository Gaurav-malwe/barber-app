"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AuthGate } from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import { type PaymentMethod } from "../../../lib/invoices";
import { formatRupeesFromPaise } from "@/lib/money";
import { useMe } from "@/lib/useMe";

type Service = {
  id: string;
  name: string;
  price_paise: number;
  active: boolean;
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

export default function NewBillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50">
          <div className="mx-auto max-w-2xl p-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
              Loading...
            </div>
          </div>
        </div>
      }
    >
      <NewBillPageInner />
    </Suspense>
  );
}

function NewBillPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const preCustomerId = search.get("customer_id") ?? "";
  const preCustomerName = search.get("customer_name") ?? "";

  const { me, loading: meLoading, error: meError } = useMe();

  const [services, setServices] = useState<Service[] | null>(null);
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState(preCustomerId);
  const [items, setItems] = useState<
    Array<{ service_id: string; name: string; price_paise: number; qty: number }>
  >([]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [upiRef, setUpiRef] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const svc = (await apiFetch("/api/services")) as Service[];
        setServices(svc.filter((s) => s.active));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load services");
      }
    })();
    (async () => {
      try {
        const cust = (await apiFetch("/api/customers")) as Customer[];
        setCustomers(cust);
      } catch {
        setCustomers([]);
      }
    })();
  }, [me]);

  useEffect(() => {
    if (!preCustomerId) return;
    setSelectedCustomerId(preCustomerId);
  }, [preCustomerId]);

  const selectedCustomer = useMemo(() => {
    const c = (customers ?? []).find((x) => x.id === selectedCustomerId);
    if (c) return c;
    if (selectedCustomerId && preCustomerName) {
      return { id: selectedCustomerId, name: preCustomerName, phone: null };
    }
    return null;
  }, [customers, selectedCustomerId, preCustomerName]);

  function addService(service: Service) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.service_id === service.id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [
        ...prev,
        {
          service_id: service.id,
          name: service.name,
          price_paise: service.price_paise,
          qty: 1,
        },
      ];
    });
  }

  function decQty(serviceId: string) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.service_id === serviceId);
      if (idx < 0) return prev;
      const cur = prev[idx];
      if (cur.qty <= 1) return prev.filter((x) => x.service_id !== serviceId);
      const next = prev.slice();
      next[idx] = { ...cur, qty: cur.qty - 1 };
      return next;
    });
  }

  function incQty(serviceId: string) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.service_id === serviceId);
      if (idx < 0) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
      return next;
    });
  }

  const totalPaise = useMemo(
    () => items.reduce((sum, it) => sum + it.price_paise * it.qty, 0),
    [items]
  );

  async function onSave() {
    setError(null);
    if (items.length === 0) {
      setError("Add at least one service");
      return;
    }

    setSaving(true);
    try {
      const invoice = (await apiFetch("/api/invoices/", {
        method: "POST",
        body: JSON.stringify({
          customer_id: selectedCustomer?.id ?? null,
          items: items.map((it) => ({ service_id: it.service_id, qty: it.qty })),
          discount_paise: 0,
          payment_method: paymentMethod,
          upi_ref: upiRef.trim() || null,
        }),
      })) as { id: string };

      router.push(`/bill/${invoice.id}/receipt`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bill");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-40">
      <AppHeader title="New bill" backHref="/dashboard" />
      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl p-4">
          {error ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="font-semibold">Customer (optional)</div>
            <div className="mt-2">
              {!customers ? (
                <div className="text-sm text-zinc-600">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className="text-sm text-zinc-600">
                  No customers yet. <Link className="underline" href="/customers/new">Add one</Link>.
                </div>
              ) : (
                <select
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">Walk-in / Not saved</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` (${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="font-semibold">Tap to add items</div>
            {!services ? (
              <div className="mt-2 text-sm text-zinc-600">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="mt-2 text-sm text-zinc-600">
                No active services. <Link className="underline" href="/services">Add services</Link>.
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addService(s)}
                    className="rounded-full border border-emerald-500 bg-white px-4 py-2 text-sm font-medium text-emerald-700"
                  >
                    + {s.name} {formatRupeesFromPaise(s.price_paise)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="font-semibold">Bill summary</div>
            {items.length === 0 ? (
              <div className="mt-2 text-sm text-zinc-600">No items added.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {items.map((it) => (
                  <div
                    key={it.service_id}
                    className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-zinc-900">{it.name}</div>
                      <div className="text-sm text-zinc-600">
                        {formatRupeesFromPaise(it.price_paise)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decQty(it.service_id)}
                        className="h-10 w-10 rounded-lg border border-zinc-200 bg-white font-semibold"
                      >
                        -
                      </button>
                      <div className="w-8 text-center font-semibold">{it.qty}</div>
                      <button
                        type="button"
                        onClick={() => incQty(it.service_id)}
                        className="h-10 w-10 rounded-lg border border-zinc-200 bg-white font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 text-lg font-bold">
                  <div>Total</div>
                  <div>{formatRupeesFromPaise(totalPaise)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-2xl space-y-3 p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                  paymentMethod === "CASH"
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                CASH
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                  paymentMethod === "UPI"
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                UPI
              </button>
            </div>

            {paymentMethod === "UPI" ? (
              <input
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="UPI reference (optional)"
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
              />
            ) : null}

            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="w-full rounded-lg bg-emerald-500 px-4 py-4 text-base font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : `Save bill (${formatRupeesFromPaise(totalPaise)})`}
            </button>
          </div>
        </div>
      </AuthGate>
    </div>
  );
}
