"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AuthGate } from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
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
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const data = (await apiFetch("/api/customers")) as Customer[];
        setCustomers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load customer");
      }
    })();
  }, [me]);

  const customer = useMemo(() => {
    if (!customers) return null;
    return customers.find((c) => c.id === id) ?? null;
  }, [customers, id]);

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

          {!customers ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
              Loading...
            </div>
          ) : !customer ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <div className="text-base font-semibold">Customer not found</div>
              <Link className="mt-3 inline-block text-sm underline" href="/customers">
                Back to customers
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="text-lg font-semibold text-zinc-900">
                  {customer.name}
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  {customer.phone ?? "No phone"}
                </div>
                {customer.notes ? (
                  <div className="mt-3 text-sm text-zinc-700">{customer.notes}</div>
                ) : null}
              </div>

              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
                <div className="font-semibold">Bill history</div>
                <div className="mt-1 text-sm text-zinc-600">
                  Coming soon (needs invoice API).
                </div>
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
