import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <main
        className="relative w-full overflow-hidden pb-16 pt-24"
        style={{
          backgroundImage: "url('/landing/hero-barbershop.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/60 to-zinc-950/35" />

        <header className="absolute inset-x-0 top-0 z-20">
          <div className="border-b border-white/15 bg-white/10 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between overflow-visible px-4 py-3 sm:px-6">
              <div className="relative flex items-center gap-3 overflow-visible">
                <div className="relative h-10 w-40 sm:h-12">
                  <Image
                    src="/landing/hero-groomly-logo-transparent.png"
                    alt="Groomly logo"
                    width={260}
                    height={110}
                    priority
                    className="absolute left-[-6%] top-1/2 h-16 w-auto -translate-y-1/2 drop-shadow-lg sm:h-20"
                  />
                </div>
                <div className="hidden rounded-full border border-white/15 bg-white/10 px-2 py-1 text-xs font-semibold text-white/90 sm:block">
                  India-first
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="hidden rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white sm:inline-flex"
                >
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90">
                Bills • Customers • Discounts • Reports
              </div>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Digital Khata for Grooming Salons.
              </h1>
              <p className="mt-4 text-base text-white/85">
                Create bills in seconds, send receipts on WhatsApp, and track daily sales with clean reports.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="rounded-lg bg-emerald-500 px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Create free account
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  I already have an account
                </Link>
              </div>
              <div className="mt-4 text-xs text-white/75">Free for early users. Upgrade later.</div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur">
              <div className="text-sm font-semibold text-white">What you get</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <div className="font-semibold text-white">Fast billing</div>
                  <div className="mt-1 text-sm text-white/80">Create a bill in under a minute.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <div className="font-semibold text-white">WhatsApp receipts</div>
                  <div className="mt-1 text-sm text-white/80">Share directly to customer number.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <div className="font-semibold text-white">Customer history</div>
                  <div className="mt-1 text-sm text-white/80">See past bills and repeat visits.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <div className="font-semibold text-white">Reports</div>
                  <div className="mt-1 text-sm text-white/80">Gross, discounts, net, and insights.</div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur">
              <div className="text-sm font-semibold text-white">Made for</div>
              <div className="mt-2 text-sm text-white/80">Barbers, salons, and beauty parlors.</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur">
              <div className="text-sm font-semibold text-white">Works on</div>
              <div className="mt-2 text-sm text-white/80">Any phone or laptop browser.</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur">
              <div className="text-sm font-semibold text-white">Your data</div>
              <div className="mt-2 text-sm text-white/80">Saved securely to the database.</div>
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="text-lg font-bold text-white">Ready to try Groomly?</div>
                <div className="mt-1 text-sm text-white/80">Create your shop in under 2 minutes.</div>
              </div>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-500 px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Start Free
              </Link>
            </div>
          </section>

          <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-sm text-white/80 sm:flex-row">
            <div>© {new Date().getFullYear()} Groomly</div>
            <div className="flex items-center gap-4">
              <Link className="underline" href="/privacy">
                Privacy
              </Link>
              <Link className="underline" href="/terms">
                Terms
              </Link>
              <Link className="underline" href="/login">
                Open App
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
