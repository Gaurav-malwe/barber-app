"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AuthGate } from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import { type InvoiceSummary } from "@/lib/invoices";
import { formatRupeesFromPaise } from "@/lib/money";
import { useMe } from "@/lib/useMe";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { me, loading: meLoading, error: meError } = useMe();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<InvoiceSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    setCustomer(null);
    setInvoices(null);
    (async () => {
      try {
        const c = (await apiFetch(`/api/customers/${id}`)) as Customer;
        const inv = (await apiFetch(`/api/invoices?customer_id=${encodeURIComponent(id)}`)) as InvoiceSummary[];
        if (cancelled) return;
        setCustomer(c);
        setInvoices(inv);
        setName(c.name);
        setPhone(c.phone ?? "");
        setNotes(c.notes ?? "");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load customer");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [me, id]);

  const billCount = invoices?.length ?? 0;
  const totalPaise = useMemo(() => (invoices ?? []).reduce((sum, inv) => sum + inv.total_paise, 0), [invoices]);

  async function saveCustomer() {
    setError(null);
    setSaving(true);
    try {
      const updated = (await apiFetch(`/api/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        }),
      })) as Customer;
      setCustomer(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <AppHeader title="Customer" backHref="/customers" />
      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl p-4">
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {!customer ? (
            error ? (
              <div className="rounded-lg border border-zinc-200 bg-white p-6">
                <div className="text-base font-semibold text-zinc-900">
                  Unable to load customer
                </div>
                <div className="mt-1 text-sm text-zinc-700">{error}</div>
                <Link className="mt-3 inline-block text-sm underline" href="/customers">
                  Back to customers
                </Link>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                Loading...
              </div>
            )
          ) : (
            <>
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold text-zinc-900">
                      {customer.name}
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">
                      {customer.phone ?? "No phone"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing((v) => !v)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800"
                  >
                    {editing ? "Close" : "Edit"}
                  </button>
                </div>

                {editing ? (
                  <div className="mt-4 space-y-3">
                    <input
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <input
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Phone (optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <textarea
                      className="min-h-[96px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={saveCustomer}
                      disabled={saving}
                      className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                ) : customer.notes ? (
                  <div className="mt-3 text-sm text-zinc-800">{customer.notes}</div>
                ) : null}
              </div>

              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
                <div className="font-semibold">Bill history</div>
                <div className="mt-1 text-sm text-zinc-700">
                  {billCount} bill{billCount === 1 ? "" : "s"} • Total {formatRupeesFromPaise(totalPaise)}
                </div>

                {!invoices ? (
                  <div className="mt-3 text-sm text-zinc-700">Loading...</div>
                ) : invoices.length === 0 ? (
                  <div className="mt-3 text-sm text-zinc-700">No bills yet.</div>
                ) : (
                  <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
                    {invoices.map((inv) => (
                      <Link
                        key={inv.id}
                        href={`/bill/${inv.id}/receipt`}
                        className="block bg-white px-4 py-3 hover:bg-zinc-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-zinc-900">
                              {new Date(inv.issued_at).toLocaleString("en-IN")}
                            </div>
                            <div className="text-sm text-zinc-700">{inv.payment_method}</div>
                          </div>
                          <div className="text-sm font-semibold text-zinc-900">
                            {formatRupeesFromPaise(inv.total_paise)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white">
                <div className="mx-auto max-w-2xl p-4">
                  <Link
                    href={`/bill/new?customer_id=${encodeURIComponent(customer.id)}&customer_name=${encodeURIComponent(customer.name)}`}
                    className="block w-full rounded-lg bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Create bill
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </AuthGate>
    </div>
  );
}
