"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AppHeader(props: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        {props.backHref ? (
          <Link
            href={props.backHref}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium"
          >
            Back
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium"
            aria-label="Back"
          >
            Back
          </button>
        )}
        <div className="flex-1 text-base font-semibold text-zinc-900">
          {props.title}
        </div>
        {props.right ? <div className="shrink-0">{props.right}</div> : null}
      </div>
    </header>
  );
}
