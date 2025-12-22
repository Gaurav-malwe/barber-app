"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AuthGate } from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/useMe";

export default function SettingsPage() {
  const router = useRouter();
  const { me, loading: meLoading, error: meError } = useMe();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function logout() {
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader title="Settings" backHref="/dashboard" />
      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl p-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="text-sm text-zinc-600">Shop</div>
            <div className="mt-1 font-semibold text-zinc-900">{me?.shop_name}</div>
            <div className="mt-4 text-sm text-zinc-600">Email</div>
            <div className="mt-1 font-semibold text-zinc-900">{me?.email}</div>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={logout}
            disabled={loading}
            className="mt-4 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 disabled:opacity-60"
          >
            {loading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </AuthGate>
    </div>
  );
}
