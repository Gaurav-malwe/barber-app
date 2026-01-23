"use client";

import Link from "next/link";
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
  email: string | null;
  dob: string | null;
  gender: "male" | "female" | null;
  anniversary: string | null;
  referral_source: string | null;
  marketing_consent: boolean;
  whatsapp_opt_in: boolean;
  notes: string | null;
};

export default function CustomerDetailPageClient({ id }: { id: string }) {
  const { me, loading: meLoading, error: meError } = useMe();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<InvoiceSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [anniversary, setAnniversary] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Missing customer id");
      return;
    }
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
        setEmail(c.email ?? "");
        setDob(c.dob ?? "");
        setGender(c.gender ?? "");
        setAnniversary(c.anniversary ?? "");
        setReferralSource(c.referral_source ?? "");
        setMarketingConsent(c.marketing_consent ?? true);
        setWhatsappOptIn(c.whatsapp_opt_in ?? true);
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
  const grossPaise = useMemo(
    () => (invoices ?? []).reduce((sum, inv) => sum + inv.subtotal_paise, 0),
    [invoices]
  );
  const discountPaise = useMemo(
    () => (invoices ?? []).reduce((sum, inv) => sum + inv.discount_paise, 0),
    [invoices]
  );
  const netPaise = useMemo(() => (invoices ?? []).reduce((sum, inv) => sum + inv.total_paise, 0), [invoices]);

  async function saveCustomer() {
    setError(null);
    setSaving(true);
    try {
      const updated = (await apiFetch(`/api/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          dob: dob || null,
          gender: gender || null,
          anniversary: anniversary || null,
          referral_source: referralSource.trim() || null,
          marketing_consent: marketingConsent,
          whatsapp_opt_in: whatsappOptIn,
          notes: notes.trim() || null,
        }),
      })) as Customer;
      setCustomer(updated);
      setEmail(updated.email ?? "");
      setDob(updated.dob ?? "");
      setGender(updated.gender ?? "");
      setAnniversary(updated.anniversary ?? "");
      setReferralSource(updated.referral_source ?? "");
      setMarketingConsent(updated.marketing_consent ?? true);
      setWhatsappOptIn(updated.whatsapp_opt_in ?? true);
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
                    <input
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Email (optional)"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-zinc-700">
                        <span className="font-medium text-zinc-900">Date of birth</span>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                        />
                      </label>
                      <label className="space-y-2 text-sm text-zinc-700">
                        <span className="font-medium text-zinc-900">Gender</span>
                        <select
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={gender}
                          onChange={(e) => setGender(e.target.value as "male" | "female" | "")}
                        >
                          <option value="">Select gender (optional)</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-zinc-700">
                        <span className="font-medium text-zinc-900">Anniversary</span>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          type="date"
                          value={anniversary}
                          onChange={(e) => setAnniversary(e.target.value)}
                        />
                      </label>
                      <label className="space-y-2 text-sm text-zinc-700">
                        <span className="font-medium text-zinc-900">Referral source</span>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="(optional)"
                          value={referralSource}
                          onChange={(e) => setReferralSource(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={marketingConsent}
                          onChange={(e) => setMarketingConsent(e.target.checked)}
                        />
                        Marketing consent
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={whatsappOptIn}
                          onChange={(e) => setWhatsappOptIn(e.target.checked)}
                        />
                        WhatsApp opt-in
                      </label>
                    </div>
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
                ) : (
                  <div className="mt-3 space-y-2 text-sm text-zinc-800">
                    <div>Email: {customer.email ?? "Not set"}</div>
                    <div>
                      Date of birth: {customer.dob ? new Date(customer.dob).toLocaleDateString("en-IN") : "Not set"}
                    </div>
                    <div>Gender: {customer.gender ?? "Not set"}</div>
                    <div>
                      Anniversary: {customer.anniversary ? new Date(customer.anniversary).toLocaleDateString("en-IN") : "Not set"}
                    </div>
                    <div>Referral source: {customer.referral_source ?? "Not set"}</div>
                    <div>Marketing consent: {(customer.marketing_consent ?? true) ? "Yes" : "No"}</div>
                    <div>WhatsApp opt-in: {(customer.whatsapp_opt_in ?? true) ? "Yes" : "No"}</div>
                    {customer.notes ? <div>Notes: {customer.notes}</div> : null}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
                <div className="font-semibold">Bill history</div>
                <div className="mt-1 text-sm text-zinc-700">
                  {billCount} bill{billCount === 1 ? "" : "s"} • Gross {formatRupeesFromPaise(grossPaise)} • Discount -{formatRupeesFromPaise(discountPaise)} • Net {formatRupeesFromPaise(netPaise)}
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
                        href={`/bill/receipt?id=${encodeURIComponent(inv.id)}`}
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
