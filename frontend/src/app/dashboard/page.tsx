"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/api";

type Me = {
  id: string;
  email: string;
  shop_id: string;
  shop_name: string;
};

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = (await apiFetch("/api/users/me")) as Me;
        setMe(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Not authenticated");
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} — <Link className="underline" href="/login">login</Link>
        </div>
      ) : null}

      {me ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="text-sm text-zinc-600">Signed in as</div>
          <div className="font-medium">{me.email}</div>
          <div className="mt-4 text-sm text-zinc-600">Shop</div>
          <div className="font-medium">{me.shop_name}</div>
          <div className="mt-6 flex gap-3 text-sm">
            <span className="rounded-lg border border-zinc-200 px-3 py-2">
              Next: Services + Customers + Bills
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
