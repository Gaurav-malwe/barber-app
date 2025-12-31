"use client";

import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AuthGate } from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import { formatRupeesFromPaise, rupeesToPaise } from "@/lib/money";
import { useMe } from "@/lib/useMe";

type Service = {
  id: string;
  name: string;
  price_paise: number;
  active: boolean;
};

export default function ServicesPage() {
  const { me, loading: meLoading, error: meError } = useMe();

  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<string>("");

  async function load() {
    setError(null);
    try {
      const data = (await apiFetch("/api/services")) as Service[];
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    }
  }

  useEffect(() => {
    if (!me) return;
    void load();
  }, [me]);

  const activeServices = useMemo(() => {
    return (services ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  async function createService(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const rupees = Number(newPrice);
      if (!Number.isFinite(rupees) || rupees <= 0) {
        throw new Error("Price must be a positive number");
      }
      await apiFetch("/api/services", {
        method: "POST",
        body: JSON.stringify({
          name: newName.trim(),
          price_paise: rupeesToPaise(rupees),
        }),
      });
      setNewName("");
      setNewPrice("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(service: Service) {
    setError(null);
    try {
      const updated = (await apiFetch(`/api/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !service.active }),
      })) as Service;

      setServices((prev) => {
        if (!prev) return prev;
        return prev.map((s) => (s.id === updated.id ? updated : s));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service");
    }
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
    setEditName(service.name);
    setEditPrice(String(service.price_paise / 100));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
  }

  async function saveEdit(service: Service) {
    setError(null);
    try {
      const name = editName.trim();
      const rupees = Number(editPrice);
      if (!name) throw new Error("Name is required");
      if (!Number.isFinite(rupees) || rupees < 0) {
        throw new Error("Price must be a valid number")
      }

      const updated = (await apiFetch(`/api/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          price_paise: rupeesToPaise(rupees),
        }),
      })) as Service;

      setServices((prev) => {
        if (!prev) return prev;
        return prev.map((s) => (s.id === updated.id ? updated : s));
      });
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <AppHeader title="Services" backHref="/dashboard" />
      <AuthGate loading={meLoading} error={meError} me={me}>
        <div className="mx-auto max-w-2xl p-4">
          <form
            onSubmit={createService}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="font-semibold">Add service</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:col-span-2"
                placeholder="Service name (e.g., Haircut)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <input
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Price (₹)"
                inputMode="numeric"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />
            </div>
            <button
              className="mt-3 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving ? "Adding..." : "Add"}
            </button>
          </form>

          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-4 rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3 font-semibold">
              Your services
            </div>
            {!services ? (
              <div className="p-4 text-sm text-zinc-700">Loading...</div>
            ) : activeServices.length === 0 ? (
              <div className="p-4 text-sm text-zinc-700">No services yet.</div>
            ) : (
              <div className="divide-y divide-zinc-200">
                {activeServices.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      {editingId === s.id ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <input
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:col-span-2"
                            placeholder="Service name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <input
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Price (₹)"
                            inputMode="numeric"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-zinc-900">{s.name}</div>
                          <div className="text-sm text-zinc-700">
                            {formatRupeesFromPaise(s.price_paise)}
                          </div>
                        </>
                      )}
                    </div>
                    {editingId === s.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(s)}
                          className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800"
                      >
                        Edit
                      </button>
                    )}
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={s.active}
                        onChange={() => toggleActive(s)}
                      />
                      Active
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AuthGate>
    </div>
  );
}
