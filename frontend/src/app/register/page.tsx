"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [pan, setPan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          shop_name: shopName,
          pan,
        }),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Create your shop</h1>
      <p className="mt-1 text-sm text-zinc-600">Takes less than 1 minute.</p>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Shop name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="PAN (for uniqueness)"
          value={pan}
          onChange={(e) => setPan(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Password (min 8 chars)"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          className="w-full rounded-lg bg-emerald-500 p-3 text-sm font-semibold text-white disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create"}
        </button>

        <div className="text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <a className="font-semibold text-emerald-600" href="/login">
            Login
          </a>
        </div>
      </form>
    </div>
  );
}
