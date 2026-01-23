"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { AuthGate } from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/useMe";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
};

type CustomerListResponse = {
  items: Customer[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
};

export default function CustomersPage() {
  const { me, loading: meLoading, error: meError } = useMe();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!me) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await apiFetch("/api/customers?page=1&limit=100");
        if (cancelled) return;
        if (Array.isArray(data)) {
          setCustomers(data as Customer[]);
        } else {
          setCustomers((data as CustomerListResponse).items);
        }
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load customers");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [me]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!customers) return [];
    if (!term) return customers;
    return customers.filter((c) => {
      return (
        c.name.toLowerCase().includes(term) ||
        (c.phone ?? "").toLowerCase().includes(term)
      );
    });
  }, [customers, q]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <AppHeader
        title="Customers"
        backHref="/dashboard"
        right={
          <Link
            href="/customers/new"
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
          >
            Add
          </Link>
        }
      />

      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl px-4 py-4">
          <input
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Search by name or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {!customers ? (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
              Loading customers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6">
              <div className="text-base font-semibold">No customers yet</div>
              <div className="mt-1 text-sm text-zinc-700">
                Add your first customer to track visits.
              </div>
              <Link
                href="/customers/new"
                className="mt-4 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Add customer
              </Link>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/customers/view?id=${encodeURIComponent(c.id)}`}
                  className="block px-4 py-4 hover:bg-zinc-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-zinc-900">{c.name}</div>
                      <div className="text-sm text-zinc-700">
                        {c.phone ? c.phone : "No phone"}
                      </div>
                    </div>
                    <div className="text-sm text-zinc-700">View</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </AuthGate>

      <BottomNav active="Customers" />
    </div>
  );
}
