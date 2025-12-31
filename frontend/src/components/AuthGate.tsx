"use client";

import Link from "next/link";

import type { Me } from "@/lib/useMe";

export function AuthGate(props: {
  loading: boolean;
  error: string | null;
  me: Me | null;
  children: React.ReactNode;
}) {
  if (props.loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
          Loading...
        </div>
      </div>
    );
  }

  if (props.error || !props.me) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {props.error ?? "Not authenticated"} —{" "}
          <Link className="underline" href="/login">
            login
          </Link>
        </div>
      </div>
    );
  }

  return <>{props.children}</>;
}
