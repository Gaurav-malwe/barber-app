"use client";

import Link from "next/link";

type Tab = "Home" | "Customers" | "Reports";

export function BottomNav(props: { active: Tab }) {
  const activeClass = "text-emerald-600";
  const inactiveClass = "text-zinc-700";

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-2xl grid-cols-3 px-4 py-2 text-sm">
        <Link
          href="/dashboard"
          className={`rounded-lg px-3 py-3 text-center font-medium ${
            props.active === "Home" ? activeClass : inactiveClass
          }`}
        >
          Home
        </Link>
        <Link
          href="/customers"
          className={`rounded-lg px-3 py-3 text-center font-medium ${
            props.active === "Customers" ? activeClass : inactiveClass
          }`}
        >
          Customers
        </Link>
        <Link
          href="/reports"
          className={`rounded-lg px-3 py-3 text-center font-medium ${
            props.active === "Reports" ? activeClass : inactiveClass
          }`}
        >
          Reports
        </Link>
      </div>
    </nav>
  );
}
