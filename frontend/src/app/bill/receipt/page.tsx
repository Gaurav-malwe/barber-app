"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import ReceiptPageClient from "./ReceiptPageClient";

function ReceiptPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  if (!id) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-2xl p-6 text-sm text-zinc-800">
          Missing receipt id. Please open this page via a valid receipt link.
        </div>
      </div>
    );
  }

  return <ReceiptPageClient id={id} />;
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <ReceiptPageInner />
    </Suspense>
  );
}
