import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Privacy Policy</h1>
          <Link href="/" className="text-sm font-semibold text-emerald-600 underline">
            Back
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-900">Groomly</p>
          <p className="mt-2">
            This is an early version privacy policy. We store your business data (customers, services, invoices,
            and payments) to provide the app features.
          </p>
          <p className="mt-3">
            We do not sell your personal information. We may use aggregated analytics to improve the product.
          </p>
          <p className="mt-3">
            If you need deletion/export of your data, contact support.
          </p>

          <div className="mt-6 text-xs text-zinc-600">Last updated: 3 Jan 2026</div>
        </div>
      </div>
    </div>
  );
}
