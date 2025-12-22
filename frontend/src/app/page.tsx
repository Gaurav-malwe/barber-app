import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Barber CRM + Bill Book</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Onboard your shop, manage customers, and track daily bills.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            href="/register"
          >
            Create account
          </Link>
          <Link
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium"
            href="/login"
          >
            Login
          </Link>
        </div>

        <div className="mt-6 text-sm">
          <Link className="text-zinc-700 underline" href="/dashboard">
            Go to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
