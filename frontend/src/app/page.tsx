import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <div className="text-xl font-bold text-emerald-600">NaayiKhata</div>
        <Link
          href="/login"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
        >
          Login
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="text-3xl font-bold tracking-tight text-zinc-900">
            Daily Bill Book + Customer Khata for Barbers.
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            Create bills in seconds, track customers, and close your day with clean totals.
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-emerald-500 px-4 py-3 text-center text-base font-semibold text-white"
            >
              Create Free Account
            </Link>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-zinc-600">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-3">
                Secure
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-3">
                Simple billing
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-3">
                WhatsApp receipts
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <Link className="text-zinc-700 underline" href="/dashboard">
            Go to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
